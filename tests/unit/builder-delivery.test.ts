import { describe, expect, it } from "vitest";
import { EMPTY_CONFIG, invalidBuilderSteps } from "../../src/domains/builder/config";
import { calculateDeliveryEstimate } from "../../src/domains/builder/delivery";
import { calculateEstimate } from "../../src/domains/pricing/calculator";

const complete = {
  ...EMPTY_CONFIG,
  businessType: "cafe" as const,
  demoId: "mora",
  brandName: "Cafe Test",
  languages: ["fa" as const],
  contentOption: "manual" as const,
  domainOption: "none" as const,
  management: "managed" as const,
};

describe("builder completion and estimates", () => {
  it("requires all eight decision steps before submission", () => {
    expect(invalidBuilderSteps(EMPTY_CONFIG)).toEqual([1, 2, 3, 4, 6, 7, 8]);
    expect(invalidBuilderSteps(complete)).toEqual([]);
    expect(invalidBuilderSteps({ ...complete, demoId: "custom" })).toEqual([3]);
    expect(invalidBuilderSteps({ ...complete, contentOption: "full_service", itemCount: 0 })).toEqual([6]);
  });

  it("starts at seven business days and accounts for optional work", () => {
    expect(calculateDeliveryEstimate(complete).minimumBusinessDays).toBe(7);
    const complex = calculateDeliveryEstimate({ ...complete, demoId: "custom", languages: ["fa", "en"], features: ["multiple_branches", "table_qr"], branchCount: 3, branchMenuMode: "unique", qrTableCount: 60 });
    expect(complex.minimumBusinessDays).toBe(20);
    expect(complex.maximumBusinessDays).toBeGreaterThan(complex.minimumBusinessDays);
  });

  it("charges custom design and domain once, and multilingual menus explicitly", () => {
    const base = { demoId: "mora", businessType: "cafe", languages: ["fa"], features: [], contentOption: "manual", domainOption: "none", management: "managed" };
    const estimate = calculateEstimate({ ...base, demoId: "custom", languages: ["fa", "en"], features: ["custom_domain"], domainOption: "own" });
    expect(estimate.lines.filter((line) => line.key === "package.custom")).toHaveLength(1);
    expect(estimate.lines.filter((line) => line.key === "addon.domain_setup")).toHaveLength(1);
    expect(estimate.lines.filter((line) => line.key === "addon.english")).toHaveLength(1);
  });
});
