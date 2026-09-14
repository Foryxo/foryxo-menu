import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { ipRateLimit } from "@/domains/auth/security";
import { requireMyBusiness } from "@/domains/dashboard/data";
import { getDb } from "@/domains/db/client";
import { invoices, serviceQuotes, serviceRequests } from "@/domains/db/schema/index";
import { creditService } from "@/domains/wallet/ledger";
import { audit } from "@/domains/audit/log";

const inputSchema = z.object({
  quoteId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

function invoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const limit = await ipRateLimit(ip, "quote-respond", 20, 3600);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = inputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const db = getDb();
  const [quote] = await db.select().from(serviceQuotes).where(eq(serviceQuotes.id, parsed.data.quoteId)).limit(1);
  if (!quote) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (quote.status !== "pending") return NextResponse.json({ error: "quote_not_pending" }, { status: 409 });
  const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, quote.requestId)).limit(1);
  if (!request) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const membership = await requireMyBusiness(session.user.id, request.businessId);
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (parsed.data.action === "reject") {
    const [updated] = await db
      .update(serviceQuotes)
      .set({ status: "rejected" })
      .where(and(eq(serviceQuotes.id, quote.id), eq(serviceQuotes.status, "pending")))
      .returning();
    if (!updated) return NextResponse.json({ error: "quote_not_pending" }, { status: 409 });
    await db.update(serviceRequests).set({ status: "rejected", updatedAt: new Date() }).where(eq(serviceRequests.id, request.id));
    await audit.log({ actorUserId: session.user.id, action: "quote.reject", targetType: "service_quote", targetId: quote.id, businessId: request.businessId });
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // Claim the quote before creating a hold or invoice so simultaneous clicks
  // cannot reserve/charge the same quote twice.
  const [claimed] = await db
    .update(serviceQuotes)
    .set({ status: "processing" })
    .where(and(eq(serviceQuotes.id, quote.id), eq(serviceQuotes.status, "pending")))
    .returning();
  if (!claimed) return NextResponse.json({ error: "quote_not_pending" }, { status: 409 });

  let paymentRequired = false;
  let invoiceId: string | null = null;
  if (quote.amount > 0) {
    const accountId = await creditService.ensureAccount(request.businessId);
    const balance = await creditService.getBalance(accountId);
    if (balance >= quote.amount) {
      await creditService.placeHold({
        businessId: request.businessId,
        amount: quote.amount,
        referenceType: "service_quote",
        referenceId: quote.id,
        createdBy: session.user.id,
      });
    } else {
      paymentRequired = true;
      const [existingInvoice] = await db.select().from(invoices).where(eq(invoices.quoteId, quote.id)).limit(1);
      if (existingInvoice) {
        invoiceId = existingInvoice.id;
      } else {
        const [createdInvoice] = await db.insert(invoices).values({
          id: crypto.randomUUID(),
          number: invoiceNumber(),
          businessId: request.businessId,
          quoteId: quote.id,
          status: "sent",
          subtotal: quote.amount,
          total: quote.amount,
          issuedAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          meta: { serviceRequestId: request.id },
        }).returning();
        invoiceId = createdInvoice.id;
      }
    }
  }

  const [updated] = await db
    .update(serviceQuotes)
    .set({ status: "approved", approvedAt: new Date() })
    .where(and(eq(serviceQuotes.id, quote.id), eq(serviceQuotes.status, "processing")))
    .returning();
  if (!updated) return NextResponse.json({ error: "quote_not_pending" }, { status: 409 });
  await db.update(serviceRequests).set({ status: "quote_approved", updatedAt: new Date() }).where(eq(serviceRequests.id, request.id));
  await audit.log({
    actorUserId: session.user.id,
    action: "quote.approve",
    targetType: "service_quote",
    targetId: quote.id,
    businessId: request.businessId,
    next: { amount: quote.amount, paymentRequired, invoiceId },
  });
  return NextResponse.json({ ok: true, status: "approved", paymentRequired, invoiceId });
}
