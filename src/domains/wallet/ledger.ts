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
import { and, eq, inArray, sql } from "drizzle-orm";
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
  private async getReferenceState(accountId: string, referenceId: string) {
    const rows = await getDb()
      .select({ amount: ledgerEntries.amount, category: ledgerEntries.category })
      .from(ledgerEntries)
      .where(and(
        eq(ledgerEntries.accountId, accountId),
        eq(ledgerEntries.referenceId, referenceId),
        inArray(ledgerEntries.category, ["hold", "capture", "release", "service_charge"]),
      ));
    const holdRows = rows.filter((entry) => entry.category === "hold");
    const resolvedRows = rows.filter((entry) => entry.category === "capture" || entry.category === "release");
    return {
      rows,
      holdCount: holdRows.length,
      releaseCount: rows.filter((entry) => entry.category === "release").length,
      outstanding: Math.max(
        0,
        -(
          holdRows.reduce((total, entry) => total + entry.amount, 0) +
          resolvedRows.reduce((total, entry) => total + entry.amount, 0)
        ),
      ),
    };
  }

  async getOutstandingHold(businessId: string, referenceId: string): Promise<number> {
    const [account] = await getDb()
      .select({ id: creditAccounts.id })
      .from(creditAccounts)
      .where(eq(creditAccounts.businessId, businessId))
      .limit(1);
    if (!account) return 0;
    return (await this.getReferenceState(account.id, referenceId)).outstanding;
  }

  async hasHold(referenceId: string): Promise<boolean> {
    const db = getDb();
    const [entry] = await db
      .select({ accountId: ledgerEntries.accountId })
      .from(ledgerEntries)
      .where(and(eq(ledgerEntries.referenceId, referenceId), eq(ledgerEntries.category, "hold")))
      .limit(1);
    if (!entry) return false;
    return (await this.getReferenceState(entry.accountId, referenceId)).outstanding > 0;
  }

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
    const state = await this.getReferenceState(accountId, opts.referenceId);
    const amountToHold = opts.amount - state.outstanding;
    if (amountToHold <= 0) return;
    const balance = await this.getBalance(accountId);
    const held = await this.getHeld(accountId);
    if (balance < amountToHold) {
      throw new LedgerError("insufficient credit", "INSUFFICIENT_FUNDS");
    }
    await this.postEntry({
      accountId,
      amount: amountToHold,
      direction: "debit",
      category: "hold",
      referenceType: opts.referenceType,
      referenceId: opts.referenceId,
      description: "Hold for approved work",
      createdBy: opts.createdBy,
      idempotencyKey: state.holdCount === 0
        ? `hold-${opts.referenceId}`
        : `hold-${opts.referenceId}-${state.holdCount + 1}`,
    });
    await db
      .update(creditAccounts)
      .set({ holdsCached: held + amountToHold })
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
    const state = await this.getReferenceState(accountId, opts.referenceId);
    const captureKey = `capture-${opts.referenceId}-${opts.amount}`;
    const chargeKey = `service-charge-${opts.referenceId}-${opts.amount}`;
    const hasCapture = await getDb().select({ id: ledgerEntries.id }).from(ledgerEntries)
      .where(eq(ledgerEntries.idempotencyKey, captureKey)).limit(1);
    if (!hasCapture.length && opts.amount > state.outstanding) {
      throw new LedgerError("capture exceeds outstanding hold", "HOLD_EXCEEDED");
    }
    // A hold already reduced the available balance. Capturing releases that
    // portion of the hold and records the final charge with zero net movement,
    // avoiding the former double debit.
    await this.postEntry({
      accountId,
      amount: opts.amount,
      direction: "credit",
      category: "capture",
      referenceType: "service_request",
      referenceId: opts.referenceId,
      description: opts.description ?? "Capture of held funds",
      createdBy: opts.createdBy,
      idempotencyKey: captureKey,
    });
    await this.postEntry({
      accountId,
      amount: opts.amount,
      direction: "debit",
      category: "service_charge",
      referenceType: "service_request",
      referenceId: opts.referenceId,
      description: opts.description ?? "Charge for completed work",
      createdBy: opts.createdBy,
      idempotencyKey: chargeKey,
    });
    await getDb().update(creditAccounts).set({
      holdsCached: await this.getHeld(accountId),
      updatedAt: new Date(),
    }).where(eq(creditAccounts.id, accountId));
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
    const state = await this.getReferenceState(accountId, opts.referenceId);
    const amountToRelease = Math.min(opts.amount, state.outstanding);
    if (amountToRelease <= 0) return;
    await this.postEntry({
      accountId,
      amount: amountToRelease,
      direction: "credit",
      category: "release",
      referenceType: "service_request",
      referenceId: opts.referenceId,
      description: "Release of unused hold",
      createdBy: opts.createdBy,
      idempotencyKey: `release-${opts.referenceId}-${state.releaseCount + 1}`,
    });
    await getDb().update(creditAccounts).set({
      holdsCached: await this.getHeld(accountId),
      updatedAt: new Date(),
    }).where(eq(creditAccounts.id, accountId));
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
