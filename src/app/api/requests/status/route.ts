import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/domains/audit/log";
import { getActiveApiSession } from "@/domains/auth/api-session";
import { ipRateLimit } from "@/domains/auth/security";
import { getDb } from "@/domains/db/client";
import { invoices, serviceQuotes, serviceRequests } from "@/domains/db/schema/index";
import { creditService } from "@/domains/wallet/ledger";

const schema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["start", "deliver", "close", "cancel"]),
});

const transitions = {
  start: { from: ["quote_approved"], to: "in_progress" },
  deliver: { from: ["in_progress"], to: "delivered" },
} as const;

export async function PATCH(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const limit = await ipRateLimit(ip, "request-status", 90, 3600);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const authResult = await getActiveApiSession(req.headers);
  if (!authResult.ok) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  const staff = authResult.session.user as { id: string; role?: string; isSuspended?: boolean };
  if (!["superadmin", "admin", "creator"].includes(staff.role ?? "")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const db = getDb();
  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, parsed.data.requestId))
    .limit(1);
  if (!request) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [quote] = await db
    .select()
    .from(serviceQuotes)
    .where(eq(serviceQuotes.requestId, request.id))
    .orderBy(desc(serviceQuotes.createdAt))
    .limit(1);

  if (parsed.data.action === "start" || parsed.data.action === "deliver") {
    if (parsed.data.action === "start") {
      if (!quote || !["approved", "waived", "charged"].includes(quote.status)) {
        return NextResponse.json({ error: "approved_quote_required" }, { status: 409 });
      }
      if (quote.status === "approved" && quote.amount > 0) {
        const outstanding = await creditService.getOutstandingHold(request.businessId, quote.id);
        if (outstanding !== quote.amount) {
          const [invoice] = await db.select().from(invoices).where(eq(invoices.quoteId, quote.id)).limit(1);
          if (!invoice || invoice.status !== "paid" || invoice.paidTotal < invoice.total) {
            return NextResponse.json({ error: "payment_required" }, { status: 409 });
          }
        }
      }
    }
    const transition = transitions[parsed.data.action];
    const [updated] = await db
      .update(serviceRequests)
      .set({ status: transition.to, updatedAt: new Date() })
      .where(and(eq(serviceRequests.id, request.id), inArray(serviceRequests.status, [...transition.from])))
      .returning();
    if (!updated) return NextResponse.json({ error: "invalid_transition" }, { status: 409 });
    await audit.log({
      actorUserId: staff.id,
      actorRole: staff.role,
      action: `request.${parsed.data.action}`,
      targetType: "service_request",
      targetId: request.id,
      businessId: request.businessId,
      previous: { status: request.status },
      next: { status: transition.to },
    });
    return NextResponse.json({ ok: true, status: transition.to });
  }

  if (parsed.data.action === "cancel") {
    const [claimed] = await db
      .update(serviceRequests)
      .set({ status: "cancelling", updatedAt: new Date() })
      .where(and(
        eq(serviceRequests.id, request.id),
        inArray(serviceRequests.status, ["quote_approved", "in_progress", "delivered"]),
      ))
      .returning();
    if (!claimed) return NextResponse.json({ error: "invalid_transition" }, { status: 409 });

    try {
      if (quote) {
        const [invoice] = await db.select().from(invoices).where(eq(invoices.quoteId, quote.id)).limit(1);
        if (invoice?.status === "paid" || (invoice?.paidTotal ?? 0) > 0 || quote.status === "charged") {
          await db.update(serviceRequests).set({ status: request.status, updatedAt: new Date() })
            .where(and(eq(serviceRequests.id, request.id), eq(serviceRequests.status, "cancelling")));
          return NextResponse.json({ error: "refund_required" }, { status: 409 });
        }
        const outstanding = await creditService.getOutstandingHold(request.businessId, quote.id);
        if (outstanding > 0) {
          await creditService.release({
            businessId: request.businessId,
            referenceId: quote.id,
            amount: outstanding,
            createdBy: staff.id,
          });
        }
        await db.update(serviceQuotes).set({ status: "rejected" }).where(eq(serviceQuotes.id, quote.id));
        if (invoice) await db.update(invoices).set({ status: "void" }).where(eq(invoices.id, invoice.id));
      }
      await db.update(serviceRequests).set({ status: "rejected", updatedAt: new Date() })
        .where(and(eq(serviceRequests.id, request.id), eq(serviceRequests.status, "cancelling")));
    } catch {
      await db.update(serviceRequests).set({ status: request.status, updatedAt: new Date() })
        .where(and(eq(serviceRequests.id, request.id), eq(serviceRequests.status, "cancelling")))
        .catch(() => undefined);
      return NextResponse.json({ error: "transition_failed" }, { status: 503 });
    }
  } else {
    if (!quote || !["approved", "waived", "charged"].includes(quote.status)) {
      return NextResponse.json({ error: "approved_quote_required" }, { status: 409 });
    }
    const [claimed] = await db
      .update(serviceRequests)
      .set({ status: "closing", updatedAt: new Date() })
      .where(and(eq(serviceRequests.id, request.id), eq(serviceRequests.status, "delivered")))
      .returning();
    if (!claimed) return NextResponse.json({ error: "invalid_transition" }, { status: 409 });

    try {
      if (quote.status === "approved" && quote.amount > 0) {
        const outstanding = await creditService.getOutstandingHold(request.businessId, quote.id);
        if (outstanding > 0) {
          if (outstanding !== quote.amount) throw new Error("hold_mismatch");
          await creditService.capture({
            businessId: request.businessId,
            referenceId: quote.id,
            amount: outstanding,
            description: `Charge for ${request.number}`,
            createdBy: staff.id,
          });
        } else {
          const [invoice] = await db.select().from(invoices).where(eq(invoices.quoteId, quote.id)).limit(1);
          if (!invoice || invoice.status !== "paid" || invoice.paidTotal < invoice.total) {
            await db.update(serviceRequests).set({ status: "delivered", updatedAt: new Date() })
              .where(and(eq(serviceRequests.id, request.id), eq(serviceRequests.status, "closing")));
            return NextResponse.json({ error: "payment_required" }, { status: 409 });
          }
        }
        await db.update(serviceQuotes).set({ status: "charged" }).where(eq(serviceQuotes.id, quote.id));
      }
      await db.update(serviceRequests).set({ status: "closed", updatedAt: new Date() })
        .where(and(eq(serviceRequests.id, request.id), eq(serviceRequests.status, "closing")));
    } catch {
      await db.update(serviceRequests).set({ status: "delivered", updatedAt: new Date() })
        .where(and(eq(serviceRequests.id, request.id), eq(serviceRequests.status, "closing")))
        .catch(() => undefined);
      return NextResponse.json({ error: "settlement_failed" }, { status: 503 });
    }
  }

  const status = parsed.data.action === "cancel" ? "rejected" : "closed";
  await audit.log({
    actorUserId: staff.id,
    actorRole: staff.role,
    action: `request.${parsed.data.action}`,
    targetType: "service_request",
    targetId: request.id,
    businessId: request.businessId,
    previous: { status: request.status },
    next: { status },
  });
  return NextResponse.json({ ok: true, status });
}
