/**
 * Service-credit ledger (spec §31, §51).
 *
 * FINANCIAL INVARIANTS:
 * 1. ledger_entries is append-only. No UPDATE/DELETE, ever.
 * 2. Balance is derived from SUM(amount); balance_cached is a display mirror.
 * 3. Every entry has an idempotencyKey (unique index) — replays are no-ops.
 * 4. Amounts are integer Toman. Never floats.
 * 5. The ledger can never silently create money: credits require a
 *    reference (payment/refund/adjustment-with-audit).
 */
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import {
  creditAccounts,
  ledgerEntries,
  businesses,
} from "@/domains/db/schema/index";

export type LedgerCategory =
  | "topup"
  | "refund"
  | "adjustment"
  | "hold"
  | "capture"
  | "release"
  | "service_charge"
  | "withdrawal"
  | "bonus";

export interface PostEntryInput {
  accountId: string;
  amount: number; // signed: positive credit, negative debit (Toman)
  direction: "credit" | "debit";
  category: LedgerCategory;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  createdBy: string;
  idempotencyKey: string;
}

export class LedgerError extends Error {
  constructor(
    message: string,
    public code:
      | "INSUFFICIENT_FUNDS"
      | "DUPLICATE"
      | "HOLD_EXCEEDED"
      | "NEGATIVE_AMOUNT"
      | "ACCOUNT_NOT_FOUND",
  ) {
    super(message);
  }
}

function assertPositive(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new LedgerError("amount must be a positive integer", "NEGATIVE_AMOUNT");
  }
}

class CreditService {
  async ensureAccount(businessId: string): Promise<string> {
    const db = getDb();
    const existing = (
      await db.select().from(creditAccounts).where(eq(creditAccounts.businessId, businessId)).limit(1)
    )[0];
    if (existing) return existing.id;
    const [created] = await db
      .insert(creditAccounts)
      .values({ id: crypto.randomUUID(), businessId })
      .returning();
    return created.id;
  }

  async getBalance(accountId: string): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${ledgerEntries.amount}), 0)::int` })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.accountId, accountId));
    return row?.total ?? 0;
  }

  /** Cash-backed credit eligible for withdrawal/refund. */
  async getRefundableBalance(accountId: string): Promise<number> {
    const db = getDb();
    const rows = await db
      .select({
        amount: ledgerEntries.amount,
        direction: ledgerEntries.direction,
        category: ledgerEntries.category,
        referenceType: ledgerEntries.referenceType,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.accountId, accountId));

    let refundable = 0;
    let total = 0;
    for (const row of rows) {
      total += row.amount;
      if (row.direction === "debit") {
        // Conservative: spending consumes real-money credit before bonuses.
        refundable += row.amount;
      } else if (
        row.category === "topup" ||
        row.category === "release" ||
        (row.category === "adjustment" && row.referenceType === "refund_compensation")
      ) {
        refundable += row.amount;
      }
    }
    return Math.max(0, Math.min(total, refundable));
  }

  async getHeld(accountId: string): Promise<number> {
    // Held = sum of unreleased hold entries (negative amounts with category hold minus release/capture matching reference)
    const db = getDb();
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${ledgerEntries.amount}), 0)::int` })
      .from(ledgerEntries)
      .where(sql`${ledgerEntries.accountId} = ${accountId} AND ${ledgerEntries.category} IN ('hold','capture','release')`);
    return Math.max(0, -(row?.total ?? 0) - 0);
  }

  /** Append an entry. Idempotent by idempotencyKey. Returns entryId, or null if replay. */
  async postEntry(input: PostEntryInput): Promise<{ id: string; replay: boolean }> {
    const db = getDb();
    assertPositive(Math.abs(input.amount));
    const existing = (
      await db
        .select({ id: ledgerEntries.id })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.idempotencyKey, input.idempotencyKey))
        .limit(1)
    )[0];
    if (existing) return { id: existing.id, replay: true };

    const [entry] = await db
      .insert(ledgerEntries)
      .values({
        id: crypto.randomUUID(),
        accountId: input.accountId,
        amount: input.direction === "credit" ? input.amount : -input.amount,
        direction: input.direction,
        category: input.category,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        description: input.description,
        createdBy: input.createdBy,
        idempotencyKey: input.idempotencyKey,
      })
      .returning();

    // Update display mirror (non-authoritative; corrected by reconcile).
    await db
      .update(creditAccounts)
      .set({
        balanceCached: sql`${creditAccounts.balanceCached} + ${entry.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(creditAccounts.id, input.accountId));

    return { id: entry.id, replay: false };
  }

  /**
   * Place a hold for approved work (quote approval). Debits available
   * (balance goes down visually) but captured amount can be partially
   * released back at completion.
   */
  async placeHold(opts: {
    businessId: string;
    amount: number;
    referenceType: string;
    referenceId: string;
    createdBy: string;
  }): Promise<void> {
    assertPositive(opts.amount);
    const db = getDb();
    const accountId = await this.ensureAccount(opts.businessId);
    const balance = await this.getBalance(accountId);
    const held = await this.getHeld(accountId);
    if (balance < opts.amount) {
      throw new LedgerError("insufficient credit", "INSUFFICIENT_FUNDS");
    }
    await this.postEntry({
      accountId,
      amount: opts.amount,
      direction: "debit",
      category: "hold",
      referenceType: opts.referenceType,
      referenceId: opts.referenceId,
      description: "Hold for approved work",
      createdBy: opts.createdBy,
      idempotencyKey: `hold-${opts.referenceId}`,
    });
    await db
      .update(creditAccounts)
      .set({ holdsCached: held + opts.amount })
      .where(eq(creditAccounts.id, accountId));
  }

  /** Finalize a hold: capture part/all. */
  async capture(opts: {
    businessId: string;
    referenceId: string;
    amount: number; // portion to capture (≤ held)
    description?: string;
    createdBy: string;
  }): Promise<void> {
    assertPositive(opts.amount);
    const accountId = await this.ensureAccount(opts.businessId);
    // Capture converts part of the hold into a final service_charge entry.
    await this.postEntry({
      accountId,
      amount: opts.amount,
      direction: "debit",
      category: "capture",
      referenceType: "service_request",
      referenceId: opts.referenceId,
      description: opts.description ?? "Capture of held funds",
      createdBy: opts.createdBy,
      idempotencyKey: `capture-${opts.referenceId}-${opts.amount}`,
    });
  }

  /** Release remaining hold back to available. */
  async release(opts: {
    businessId: string;
    referenceId: string;
    amount: number;
    createdBy: string;
  }): Promise<void> {
    assertPositive(opts.amount);
    const accountId = await this.ensureAccount(opts.businessId);
    await this.postEntry({
      accountId,
      amount: opts.amount,
      direction: "credit",
      category: "release",
      referenceType: "service_request",
      referenceId: opts.referenceId,
      description: "Release of unused hold",
      createdBy: opts.createdBy,
      idempotencyKey: `release-${opts.referenceId}-${opts.amount}`,
    });
  }

  async topupFromPayment(opts: {
    businessId: string;
    amount: number;
    paymentId: string;
    provider: string;
  }): Promise<void> {
    const accountId = await this.ensureAccount(opts.businessId);
    await this.postEntry({
      accountId,
      amount: opts.amount,
      direction: "credit",
      category: "topup",
      referenceType: "payment",
      referenceId: opts.paymentId,
      description: `Top-up via ${opts.provider}`,
      createdBy: "system",
      idempotencyKey: `ledger-topup-${opts.paymentId}`,
    });
  }

  /** Manual admin adjustment — requires audit reference; never silent. */
  async manualAdjustment(opts: {
    businessId: string;
    amount: number;
    direction: "credit" | "debit";
    reason: string;
    adminUserId: string;
  }): Promise<void> {
    const accountId = await this.ensureAccount(opts.businessId);
    await this.postEntry({
      accountId,
      amount: opts.amount,
      direction: opts.direction,
      category: "adjustment",
      referenceType: "manual",
      referenceId: opts.reason,
      description: `Manual adjustment: ${opts.reason}`,
      createdBy: opts.adminUserId,
      idempotencyKey: `adj-${crypto.randomUUID()}`,
    });
  }
}

export const creditService = new CreditService();
export { businesses };
