import { describe, expect, it } from "vitest";
import { calculateCart, type MenuProductResolver } from "../../src/domains/pricing/engine";
import type { ReadModelProduct } from "../../src/domains/menu-engine/read-model";

function product(overrides: Partial<ReadModelProduct> = {}): ReadModelProduct {
  return {
    id: "p1",
    slug: "classic-smash",
    categorySlug: "burgers",
    sort: 0,
    name: "Classic Smash",
    nameEn: null,
    description: null,
    descriptionEn: null,
    price: 285_000,
    priceOld: null,
    currency: "IRT",
    available: true,
    soldOut: false,
    featured: false,
    hidden: false,
    scheduledHide: false,
    badges: [],
    nutrition: null,
    allergens: [],
    dietary: [],
    allowsCustomRequest: false,
    imagePrompt: null,
    imageUrl: null,
    modifierGroups: [],
    ...overrides,
  } as ReadModelProduct;
}

const resolve: MenuProductResolver = (id) => (id === "p1" ? product() : undefined);

function withGroup(p: ReadModelProduct): ReadModelProduct {
  return {
    ...p,
    modifierGroups: [
      {
        id: "g1",
        slug: "size",
        name: "Size",
        nameEn: "Size",
        min: 1,
        max: 1,
        required: true,
        allowRepeat: false,
        options: [
          { id: "m1", name: "Single", nameEn: "Single", priceDelta: 0, isDefault: true, available: true },
          { id: "m2", name: "Double", nameEn: "Double", priceDelta: 120_000, isDefault: false, available: true },
          { id: "m3", name: "Triple", nameEn: "Triple", priceDelta: 0, isDefault: false, available: false },
        ],
      },
    ],
  };
}

describe("calculateCart", () => {
  it("prices a simple line", () => {
    const cart = calculateCart([{ productId: "p1", quantity: 2, selections: {} }], resolve);
    expect(cart.subtotal).toBe(570_000);
    expect(cart.total).toBe(570_000);
    expect(cart.lines[0].errors).toHaveLength(0);
  });

  it("flags unknown products instead of throwing", () => {
    const cart = calculateCart([{ productId: "gone", quantity: 1, selections: {} }], resolve);
    expect(cart.lines[0].errors).toContain("product_not_found");
    expect(cart.subtotal).toBe(0);
  });

  it("applies modifier deltas and snapshots names", () => {
    const p = withGroup(product());
    const cart = calculateCart(
      [{ productId: "p1", quantity: 1, selections: { g1: ["m2"] } }],
      (id) => (id === "p1" ? p : undefined),
    );
    expect(cart.lines[0].unitPrice).toBe(405_000);
    expect(cart.lines[0].modifiersSnapshot).toEqual([{ name: "Double", priceDelta: 120_000 }]);
  });

  it("enforces required groups and max selections", () => {
    const p = withGroup(product());
    const missing = calculateCart(
      [{ productId: "p1", quantity: 1, selections: {} }],
      (id) => (id === "p1" ? p : undefined),
    );
    expect(missing.lines[0].errors.some((e) => e.startsWith("missing_required"))).toBe(true);

    const tooMany = calculateCart(
      [{ productId: "p1", quantity: 1, selections: { g1: ["m1", "m2"] } }],
      (id) => (id === "p1" ? p : undefined),
    );
    expect(tooMany.lines[0].errors.some((e) => e.startsWith("too_many"))).toBe(true);
  });

  it("rejects unavailable products/options", () => {
    const soldOut = product({ soldOut: true });
    const c1 = calculateCart([{ productId: "p1", quantity: 1, selections: {} }], (id) =>
      id === "p1" ? soldOut : undefined,
    );
    expect(c1.lines[0].errors).toContain("unavailable");

    const p = withGroup(product());
    const c2 = calculateCart(
      [{ productId: "p1", quantity: 1, selections: { g1: ["m3"] } }],
      (id) => (id === "p1" ? p : undefined),
    );
    expect(c2.lines[0].errors.some((e) => e.startsWith("option_unavailable"))).toBe(true);
  });

  it("computes discount/fee/tax in correct order", () => {
    // subtotal 570,000; discount 10% = 57,000; fee 5% of subtotal = 28,500; tax 9% of (subtotal-discount) = 46,170
    const cart = calculateCart(
      [{ productId: "p1", quantity: 2, selections: {} }],
      resolve,
      { discountPercent: 10, serviceFeePercent: 5, taxPercent: 9 },
    );
    expect(cart.discountTotal).toBe(57_000);
    expect(cart.serviceFee).toBe(28_500);
    expect(cart.taxTotal).toBe(46_170);
    expect(cart.total).toBe(587_670);
  });

  it("clamps quantity into [1,99] and keeps totals integral", () => {
    const cart = calculateCart(
      [{ productId: "p1", quantity: 1000, selections: {} }],
      resolve,
      { discountPercent: 3 },
    );
    expect(cart.lines[0].quantity).toBe(99);
    expect(Number.isInteger(cart.total)).toBe(true);
  });

  it("never produces fractional Toman", () => {
    const cart = calculateCart(
      [{ productId: "p1", quantity: 3, selections: {} }],
      resolve,
      { discountPercent: 7, serviceFeePercent: 2.5, taxPercent: 9 },
    );
    for (const n of [cart.subtotal, cart.discountTotal, cart.serviceFee, cart.taxTotal, cart.total]) {
      expect(Number.isInteger(n)).toBe(true);
    }
  });
});
