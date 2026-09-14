import { describe, expect, it } from "vitest";
import { calculateEstimate, type BuilderConfig } from "../../src/domains/pricing/calculator";

const base: BuilderConfig = {
  demoId: "mora",
  businessType: "cafe",
  languages: ["fa"],
  features: [],
  contentOption: "later",
  domainOption: "none",
  management: "managed",
};

describe("calculateEstimate", () => {
  it("basic single-language static menu → basic package + managed hosting tier", () => {
    const e = calculateEstimate(base); // base.management = "managed"
    expect(e.lines.some((l) => l.key === "package.basic" && l.amount === 1_800_000)).toBe(true);
    expect(e.lines.some((l) => l.key === "hosting.managed" && l.recurring)).toBe(true);
    expect(e.recurringAnnual).toBe(1_500_000);
    expect(e.initialTotal).toBe(1_800_000);
  });

  it("self-managed upgrades to pro package + support hosting", () => {
    const e = calculateEstimate({ ...base, management: "self" });
    expect(e.lines.some((l) => l.key === "package.pro")).toBe(true);
    expect(e.lines.some((l) => l.key === "hosting.support")).toBe(true);
  });

  it("charges the advertised English add-on without silently upgrading the package", () => {
    const bilingual = calculateEstimate({ ...base, languages: ["fa", "en"] });
    expect(bilingual.lines.some((l) => l.key === "package.basic")).toBe(true);
    expect(bilingual.lines.some((l) => l.key === "addon.english" && l.amount === 1_000_000)).toBe(true);
    expect(bilingual.initialTotal).toBe(2_800_000);

    const third = calculateEstimate({ ...base, languages: ["fa", "ar"] });
    expect(third.lines.filter((l) => l.key === "addon.language")).toHaveLength(1);
  });

  it("direct ordering selects business package and suppresses ordering add-on charges", () => {
    const e = calculateEstimate({
      ...base,
      features: ["direct_order", "payment_gateway", "cart"],
      management: "self",
    });
    expect(e.lines.some((l) => l.key === "package.business")).toBe(true);
    expect(e.lines.some((l) => l.key === "addon.ordering_full")).toBe(false);
    expect(e.lines.some((l) => l.key === "addon.payment_gateway")).toBe(false);
    expect(e.lines.some((l) => l.key === "addon.cart")).toBe(false);
  });

  it("full-service content entry charges base + extra blocks of 50", () => {
    const e = calculateEstimate({ ...base, contentOption: "full_service", itemCount: 120 });
    const entryLines = e.lines.filter((l) => l.key === "content.entry_50" || l.key === "content.entry_extra_50");
    // 120 items → 1 base + 2 extra blocks (50→100→120)
    expect(entryLines).toHaveLength(3);
  });

  it("image cleanup is per-image", () => {
    const e = calculateEstimate({ ...base, photoCount: 10 });
    expect(e.lines.some((l) => l.key === "content.image_cleanup" && l.amount === 200_000)).toBe(true);
  });

  it("custom domain setup charged only for own/website options", () => {
    const own = calculateEstimate({ ...base, domainOption: "own" });
    expect(own.lines.some((l) => l.key === "addon.domain_setup")).toBe(true);
    const none = calculateEstimate({ ...base, domainOption: "none" });
    expect(none.lines.some((l) => l.key === "addon.domain_setup")).toBe(false);
  });

  it("managed mode uses managed hosting tier", () => {
    const e = calculateEstimate({ ...base, management: "managed" });
    expect(e.lines.some((l) => l.key === "hosting.managed" && l.amount === 1_500_000)).toBe(true);
  });

  it("included features are never charged", () => {
    const e = calculateEstimate({ ...base, features: ["search", "nutrition", "custom_request"] });
    expect(e.initialTotal).toBe(1_800_000);
  });

  it("all amounts are integers (no fractional Toman)", () => {
    const e = calculateEstimate({
      ...base,
      features: ["table_qr", "pwa", "analytics_pro"],
      photoCount: 7,
      itemCount: 33,
      contentOption: "full_service",
    });
    for (const l of e.lines) expect(Number.isInteger(l.amount)).toBe(true);
    expect(Number.isInteger(e.initialTotal)).toBe(true);
  });

  it("charges permanent table QR codes per requested table", () => {
    const e = calculateEstimate({ ...base, features: ["table_qr"], qrTableCount: 12 });
    expect(e.lines.some((l) => l.key === "addon.table_qr" && l.amount === 480_000 && l.note === "12 tables")).toBe(true);
  });

  it("prices every additional branch and unique branch menu", () => {
    const shared = calculateEstimate({ ...base, features: ["multiple_branches"], branchCount: 4, branchMenuMode: "shared" });
    expect(shared.lines.some((line) => line.key === "addon.branch" && line.amount === 4_500_000)).toBe(true);
    expect(shared.lines.some((line) => line.key === "addon.branch_unique_menu")).toBe(false);

    const unique = calculateEstimate({ ...base, features: ["multiple_branches"], branchCount: 4, branchMenuMode: "unique" });
    expect(unique.lines.some((line) => line.key === "addon.branch_unique_menu" && line.amount === 3_000_000)).toBe(true);
  });
});
