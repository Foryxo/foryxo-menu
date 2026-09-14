import { describe, expect, it } from "vitest";
import { slugify, isSafeSlug, sanitizeNote, clamp } from "../../src/lib/utils";

describe("slugify", () => {
  it("slugifies latin text", () => {
    expect(slugify("Aria Café & Grill")).toBe("aria-cafe-grill");
  });
  it("caps length at 48", () => {
    expect(slugify("x".repeat(100)).length).toBeLessThanOrEqual(48);
  });
});

describe("isSafeSlug", () => {
  it("accepts normal menu slugs", () => {
    expect(isSafeSlug("aria")).toBe(true);
    expect(isSafeSlug("mora-coffee-tehran")).toBe(true);
  });
  it("rejects reserved system slugs", () => {
    expect(isSafeSlug("admin")).toBe(false);
    expect(isSafeSlug("api")).toBe(false);
    expect(isSafeSlug("fa")).toBe(false);
    expect(isSafeSlug("menus")).toBe(false);
  });
  it("rejects malformed slugs", () => {
    expect(isSafeSlug("-lead")).toBe(false);
    expect(isSafeSlug("has spaces")).toBe(false);
    expect(isSafeSlug("UPPER")).toBe(false);
    expect(isSafeSlug("double--dash")).toBe(false);
    expect(isSafeSlug("a")).toBe(false);
  });
});

describe("sanitizeNote", () => {
  it("strips HTML-significant characters", () => {
    expect(sanitizeNote("<b>bold</b>")).toBe("bbold/b");
    expect(sanitizeNote(`"quote" & 'apostrophe'`)).toBe("quote apostrophe");
  });
  it("strips control characters and collapses whitespace", () => {
    expect(sanitizeNote("no onions\u0000\t extra  sauce")).toBe("no onions extra sauce");
  });
  it("enforces max length", () => {
    expect(sanitizeNote("a".repeat(500)).length).toBe(200);
  });
  it("preserves Persian text and ZWNJ", () => {
    expect(sanitizeNote("بدون پیاز")).toBe("بدون پیاز");
    expect(sanitizeNote("می\u200cخواهم")).toBe("می\u200cخواهم");
  });
});

describe("clamp", () => {
  it("clamps within bounds", () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(0, 1, 3)).toBe(1);
    expect(clamp(2, 1, 3)).toBe(2);
  });
});
