/**
 * Order pricing engine (spec §88) — the client subtotal is display-only.
 * Server recalculates everything from current data.
 */
import type { ReadModelProduct } from "@/domains/menu-engine/read-model";

export interface CartItemSelection {
  productId: string;
  quantity: number;
  /** groupId -> optionId[] */
  selections: Record<string, string[]>;
  note?: string;
}

export interface CalculatedLine {
  productId: string;
  quantity: number;
  unitBase: number;
  modifierDelta: number;
  unitPrice: number;
  lineTotal: number;
  nameSnapshot: string;
  modifiersSnapshot: { name: string; priceDelta: number }[];
  note: string | null;
  errors: string[];
}

export interface CalculatedCart {
  lines: CalculatedLine[];
  subtotal: number;
  discountTotal: number;
  serviceFee: number;
  taxTotal: number;
  total: number;
}

export interface MenuProductResolver {
  (productId: string): ReadModelProduct | undefined;
}

/**
 * Recalculate a cart server-side. Rejects stale/invalid configurations
 * gracefully by collecting per-line errors instead of throwing.
 */
export function calculateCart(
  items: CartItemSelection[],
  resolve: MenuProductResolver,
  options?: { discountPercent?: number; serviceFeePercent?: number; taxPercent?: number },
): CalculatedCart {
  const lines: CalculatedLine[] = [];

  for (const item of items) {
    const errors: string[] = [];
    const product = resolve(item.productId);
    if (!product) {
      lines.push({
        productId: item.productId, quantity: item.quantity, unitBase: 0, modifierDelta: 0,
        unitPrice: 0, lineTotal: 0, nameSnapshot: "", modifiersSnapshot: [],
        note: item.note ?? null, errors: ["product_not_found"],
      });
      continue;
    }
    if (product.soldOut || !product.available) errors.push("unavailable");

    // Validate modifier groups server-side
    const modsSnapshot: { name: string; priceDelta: number }[] = [];
    let delta = 0;
    for (const group of product.modifierGroups) {
      const chosen = (item.selections?.[group.id] ?? []).filter(Boolean);
      if (group.required && chosen.length < Math.max(1, group.min)) {
        errors.push(`missing_required:${group.id}`);
        continue;
      }
      if (chosen.length > group.max) {
        errors.push(`too_many:${group.id}`);
      }
      for (const optId of chosen.slice(0, group.max)) {
        const opt = group.options.find((o) => o.id === optId);
        if (!opt) {
          errors.push(`invalid_option:${group.id}:${optId}`);
          continue;
        }
        if (!opt.available) errors.push(`option_unavailable:${optId}`);
        delta += opt.priceDelta;
        modsSnapshot.push({ name: opt.name, priceDelta: opt.priceDelta });
      }
    }

    const unitPrice = product.price + delta;
    const qty = Math.max(1, Math.min(99, Math.floor(item.quantity)));
    lines.push({
      productId: product.id,
      quantity: qty,
      unitBase: product.price,
      modifierDelta: delta,
      unitPrice,
      lineTotal: unitPrice * qty,
      nameSnapshot: product.name,
      modifiersSnapshot: modsSnapshot,
      note: item.note ?? null,
      errors,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const discountTotal = options?.discountPercent
    ? Math.round((subtotal * options.discountPercent) / 100)
    : 0;
  const serviceFee = options?.serviceFeePercent
    ? Math.round((subtotal * options.serviceFeePercent) / 100)
    : 0;
  const taxTotal = options?.taxPercent
    ? Math.round(((subtotal - discountTotal) * options.taxPercent) / 100)
    : 0;

  return {
    lines,
    subtotal,
    discountTotal,
    serviceFee,
    taxTotal,
    total: subtotal - discountTotal + serviceFee + taxTotal,
  };
}
