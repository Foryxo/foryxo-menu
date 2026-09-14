import { describe, expect, it } from "vitest";
import {
  normalizePersian,
  toPersianDigits,
  toAsciiDigits,
  normalizeIranPhone,
  normalizeEmail,
} from "../../src/domains/i18n/normalize";

describe("normalizePersian", () => {
  it("unifies Arabic Yeh/Kaf into Persian forms", () => {
    expect(normalizePersian("كباب ي")).toBe("کباب ی");
  });

  it("strips diacritics and tatweel", () => {
    expect(normalizePersian("قــهــوه")).toBe("قهوه");
  });

  it("folds Persian/Arabic digits to ASCII for search", () => {
    expect(normalizePersian("قیمت ۱۲۳")).toContain("123");
    expect(normalizePersian("٤٥")).toContain("45");
  });

  it("collapses whitespace and lowercases latin", () => {
    expect(normalizePersian("  Latte   ART ")).toBe("latte art");
  });
});

describe("digit conversion", () => {
  it("toPersianDigits converts ASCII", () => {
    expect(toPersianDigits(12345)).toBe("۱۲۳۴۵");
  });
  it("toAsciiDigits converts Persian and Arabic", () => {
    expect(toAsciiDigits("۱۲۳٤٥٦")).toBe("123456");
  });
  it("round-trips", () => {
    expect(toAsciiDigits(toPersianDigits("90210"))).toBe("90210");
  });
});

describe("normalizeIranPhone", () => {
  it.each([
    ["09121234567", "+989121234567"],
    ["+98 912 123 4567", "+989121234567"],
    ["00989121234567", "+989121234567"],
    ["۹۸۹۱۲۱۲۳۴۵۶۷", "+989121234567"],
    ["9121234567", "+989121234567"],
  ])("normalizes %s → %s", (input, expected) => {
    expect(normalizeIranPhone(input)).toBe(expected);
  });

  it.each(["0912123456", "12345", "02112345678", "099999999999"])("rejects invalid %s", (input) => {
    expect(normalizeIranPhone(input)).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Cafe@Example.COM ")).toBe("cafe@example.com");
  });
});
