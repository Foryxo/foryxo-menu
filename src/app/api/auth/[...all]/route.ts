import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/domains/auth/server";
import { flags } from "@/config/env";
import { captureEmailOtpDelivery } from "@/domains/auth/email-delivery-status";

const handler = toNextJsHandler(auth);
export const GET = handler.GET;

export async function POST(request: Request) {
  const path = new URL(request.url).pathname;
  if (path === "/api/auth/sign-up/email") {
    return Response.json({ error: "password_registration_disabled" }, {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!flags.emailOtp && path.startsWith("/api/auth/email-otp/")) {
    return Response.json({ error: "email_delivery_unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (path === "/api/auth/email-otp/send-verification-otp") {
    const body = await request.clone().json().catch(() => null) as { type?: unknown } | null;
    if (body?.type !== "sign-in") {
      return Response.json({ error: "unsupported_otp_type" }, { status: 400 });
    }
    const { result, failure } = await captureEmailOtpDelivery(() => handler.POST(request));
    if (failure) {
      return Response.json({ error: failure }, {
        status: failure === "rate_limited" ? 429 : 502,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return result;
  }
  return handler.POST(request);
}
