/**
 * Better Auth server instance (spec §25).
 * Email OTP is primary; Google OAuth behind credentials; phone OTP via dedicated route.
 */
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/domains/db/client";
import { env, flags, isProd } from "@/config/env";
import { renderEmail } from "@/domains/email/templates";
import { deliverEmail } from "@/domains/email/queue";
import { recordSecurityEvent, otpRateLimit } from "./security";
import { normalizeEmail } from "@/domains/i18n/normalize";
import { recordEmailOtpDeliveryFailure } from "./email-delivery-status";

export const auth = betterAuth({
  appName: env.APP_NAME,
  baseURL: env.AUTH_URL,
  secret: env.AUTH_SECRET,
  trustedOrigins: [env.APP_URL],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 14,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  database: drizzleAdapter(getDb(), {
    provider: "pg",
  }),
  // Server-controlled access fields are returned with the session, but can never be supplied by clients.
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "business", input: false },
      isSuspended: { type: "boolean", required: true, defaultValue: false, input: false },
    },
  },
  emailVerification: {
    async sendVerificationEmail() {
      /* OTP-first flow: verification handled via email OTP plugin. */
    },
  },
  session: {
    expiresIn: isProd ? 60 * 60 * 12 : 60 * 60 * 24 * 7, // 12h prod, 7d dev
    updateAge: 60 * 60,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  advanced: {
    cookiePrefix: "foryxo",
    useSecureCookies: isProd,
  },
  socialProviders: flags.googleOAuth
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      async sendVerificationOTP({ email, otp, type }, ctx) {
        if (type !== "sign-in") return;
        try {
          const rate = await otpRateLimit(`email:${email}`);
          if (!rate.allowed) throw new Error("RATE_LIMITED");
          if (env.AUTH_DEV_OTP && !isProd) {
            console.log(`[AUTH:dev] Email OTP for ${email}: ${otp}`);
            return;
          }
          if (!flags.emailOtp) throw new Error("EMAIL_DELIVERY_UNAVAILABLE");
          const html = renderEmail("otp", { otp }, "fa");
          // Sign-in codes must be sent synchronously: a queued job is not proof of delivery.
          await deliverEmail({
            to: email,
            subject: "کد ورود فوریکسو منو | Your Foryxo Menu code",
            html,
            text: `کد ورود شما: ${otp}\nYour code: ${otp}`,
          });
          await recordSecurityEvent({ type: "otp_sent", metadata: { channel: "email" } });
        } catch (error) {
          // Better Auth catches sender errors internally and otherwise returns success.
          recordEmailOtpDeliveryFailure(error);
          await ctx?.context.internalAdapter.deleteVerificationByIdentifier(`sign-in-otp-${email}`).catch(() => undefined);
          await recordSecurityEvent({ type: "otp_send_failed", metadata: { channel: "email" } });
          throw error;
        }
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = normalizeEmail(user.email);
          const role = email === env.ADMIN_EMAIL.toLowerCase()
            ? "superadmin"
            : email === env.CREATOR_EMAIL.toLowerCase() ? "creator" : "business";
          return {
            data: {
              ...user,
              email,
              role,
            },
          };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
