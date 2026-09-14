/**
 * Audit logging (spec §52). Never logs secrets or OTP codes.
 */
import { getDb } from "@/domains/db/client";
import { auditLogs } from "@/domains/db/schema/index";
import { randomId } from "@/lib/utils";

export interface AuditInput {
  actorUserId?: string;
  actorRole?: string;
  action: string; // dotted verb: menu.publish | refund.approve | ...
  targetType: string;
  targetId?: string;
  businessId?: string;
  previous?: unknown;
  next?: unknown;
  ip?: string;
  userAgent?: string;
}

class Audit {
  private correlationId?: string;

  setCorrelationId(id: string) {
    this.correlationId = id;
  }

  async log(input: AuditInput): Promise<void> {
    try {
      const db = getDb();
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        businessId: input.businessId,
        previous: input.previous ? JSON.parse(JSON.stringify(input.previous)) : undefined,
        next: input.next ? JSON.parse(JSON.stringify(input.next)) : undefined,
        correlationId: this.correlationId ?? randomId(8),
        ip: input.ip,
        userAgent: input.userAgent,
      });
    } catch (e) {
      console.error("[audit] write failed", e);
    }
  }
}

export const audit = new Audit();

/** Redact sensitive keys from snapshots before storing. */
export function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE = /(secret|password|token|otp|authorization|cookie)/i;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE.test(k)) out[k] = "[redacted]";
    else if (v && typeof v === "object" && !Array.isArray(v)) out[k] = redact(v as Record<string, unknown>);
    else out[k] = v;
  }
  return out;
}
