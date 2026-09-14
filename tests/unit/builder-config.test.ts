import { describe, expect, it } from "vitest";
import { builderConfigSchema } from "../../src/domains/builder/config";

describe("builder content options", () => {
  it("accepts the canonical full-service option", () => {
    expect(builderConfigSchema.safeParse({ contentOption: "full_service" }).success).toBe(true);
  });

  it("stores an estimated food-photo count", () => {
    const result = builderConfigSchema.parse({ contentOption: "photos", photoCount: 24 });
    expect(result.photoCount).toBe(24);
  });

  it("rejects image counts above the supported project limit", () => {
    expect(builderConfigSchema.safeParse({ contentOption: "photos", photoCount: 201 }).success).toBe(false);
  });

  it("provides safe single-location and ordering defaults for older drafts", () => {
    const result = builderConfigSchema.parse({});
    expect(result.branchCount).toBe(1);
    expect(result.branchMenuMode).toBe("shared");
    expect(result.fulfillmentTypes).toEqual(["dine_in", "takeaway"]);
    expect(result.orderNotificationChannels).toEqual(["dashboard", "browser"]);
  });
});
