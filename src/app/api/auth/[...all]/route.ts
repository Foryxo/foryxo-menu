import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/domains/auth/server";
import { flags } from "@/config/env";

const handler = toNextJsHandler(auth);
export const GET = handler.GET;

export function POST(request: Request) {
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
  return handler.POST(request);
}
