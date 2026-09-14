/**
 * Foryxo Menu — runtime configuration & environment parsing.
 * Never import this from client components.
 */
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_NAME: z.string().default("Foryxo Menu"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  FEATURE_FLAGS: z.string().default("demoMode"),
  DB_DRIVER: z.enum(["pglite", "postgres"]).default("pglite"),
  DATA_DIR: z.string().default("./.data"),
  DATABASE_URL: z.string().optional(),
  DATABASE_POOL_MAX: z.coerce.number().default(10),
  REDIS_URL: z.string().optional(),
  AUTH_SECRET: z.string().default("dev-only-secret-change-me-0123456789abcdef"),
  AUTH_URL: z.string().url().default("http://localhost:3000"),
  AUTH_DEV_OTP: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["console", "smtp"]).default("console"),
  EMAIL_SMTP_HOST: z.string().optional(),
  EMAIL_SMTP_PORT: z.coerce.number().default(587),
  EMAIL_SMTP_USER: z.string().optional(),
  EMAIL_SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("Foryxo Menu <no-reply@foryxo.com>"),
  SMS_PROVIDER: z.enum(["console", "kavenegar", "generic"]).default("console"),
  SMS_KAVENEGAR_API_KEY: z.string().optional(),
  SMS_GENERIC_URL: z.string().optional(),
  SMS_GENERIC_KEY: z.string().optional(),
  ZARINPAL_MERCHANT_ID: z.string().optional(),
  ZARINPAL_SANDBOX: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./.data/uploads"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  INDEXNOW_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().default("foryxolabels@gmail.com"),
  CREATOR_EMAIL: z.string().email().default("yasaminsoraghi84@gmail.com"),
  OWNER_EMAIL: z.string().email().default("foryxolabels@gmail.com"),
  OWNER_BOOTSTRAP_PASSWORD: z.string().min(14).optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Fail loudly but readable.
  console.error("Invalid environment configuration:", parsed.error.flatten());
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === "production";
export const isDev = !isProd;

/** Feature flags default safely to OFF unless listed in FEATURE_FLAGS. */
export const flags = {
  mockPayments: env.FEATURE_FLAGS.split(",").map((v) => v.trim()).includes("mockPayments"),
  demoMode: env.FEATURE_FLAGS.split(",").map((v) => v.trim()).includes("demoMode"),
  zarinpal: Boolean(env.ZARINPAL_MERCHANT_ID),
  yekpay: false, // WebGate checkout requires merchant onboarding and verified billing fields.
  whatsappAuth: false, // requires official WhatsApp Business provider credentials
  telegramAuth: false, // requires compliant Telegram login configuration
  directRestaurantPayments: false, // tenant-specific gateway credentials
  consumerProfiles: true,
  pwa: true,
  waiterCall: true,
  customDomains: true,
  googleOAuth: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  emailOtp: (env.AUTH_DEV_OTP && !isProd) || (env.EMAIL_PROVIDER === "smtp" && Boolean(env.EMAIL_SMTP_HOST)),
  phoneOtp: Boolean(env.SMS_PROVIDER !== "console" || env.AUTH_DEV_OTP),
} as const;

export type FlagKey = keyof typeof flags;
