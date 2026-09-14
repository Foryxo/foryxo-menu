/**
 * Payment gateway callback. Providers redirect here after payment.
 * Verification is ALWAYS server-to-server; query params are never trusted.
 */
import { NextResponse, type NextRequest } from "next/server";
import { verifyPaymentCallback } from "@/domains/payments/index";
import { ipRateLimit } from "@/domains/auth/security";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "pay-callback", 30, 60);
  if (!rl.allowed) return NextResponse.redirect(new URL("/fa/status/rate-limited", req.url));

  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId");
  const authority = url.searchParams.get("Authority") ?? url.searchParams.get("authority") ?? undefined;
  const status = url.searchParams.get("Status");

  if (!paymentId) {
    return NextResponse.redirect(new URL("/fa/status/payment-failed", req.url));
  }

  // A gateway redirect is untrusted input. Show cancellation to the visitor,
  // but do not mutate the payment record without server-to-server verification.
  if (status === "NOK") {
    return NextResponse.redirect(new URL(`/fa/status/payment-cancelled?paymentId=${paymentId}`, req.url));
  }

  const result = await verifyPaymentCallback(paymentId, { authority });

  if (result.ok) {
    return NextResponse.redirect(
      new URL(`/fa/status/payment-success?paymentId=${paymentId}`, req.url),
    );
  }
  return NextResponse.redirect(
    new URL(`/fa/status/payment-failed?paymentId=${paymentId}`, req.url),
  );
}

export async function POST(req: NextRequest) {
  // Server-to-server webhooks (where provider supports) land here.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "pay-webhook", 60, 60);
  if (!rl.allowed) return new NextResponse("rate limited", { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { paymentId?: string; authority?: string };
  if (!body.paymentId) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const result = await verifyPaymentCallback(body.paymentId, { authority: body.authority });
  return NextResponse.json(result);
}
