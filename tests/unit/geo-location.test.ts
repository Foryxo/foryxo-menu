import { describe, expect, it } from "vitest";
import {
  getLocalizedCountryName,
  getRequestGeography,
  normalizeCountryCode,
  normalizeLanguageCode,
} from "@/domains/geo/location";

describe("geographic location normalization", () => {
  it("normalizes ISO country and language codes", () => {
    expect(normalizeCountryCode(" ir ")).toBe("IR");
    expect(normalizeCountryCode("Iran")).toBeNull();
    expect(normalizeLanguageCode("fa-IR")).toBe("fa");
    expect(normalizeLanguageCode("EN_us")).toBe("en");
  });

  it("prefers Cloudflare geography and detects Iran", () => {
    const headers = new Headers({
      "cf-ipcountry": "ir",
      "x-vercel-ip-country": "DE",
    });
    expect(getRequestGeography(headers)).toEqual({
      countryCode: "IR",
      isIran: true,
      source: "cloudflare",
    });
  });

  it("falls back to Vercel and rejects malformed values", () => {
    expect(getRequestGeography(new Headers({ "x-vercel-ip-country": "de" }))).toEqual({
      countryCode: "DE",
      isIran: false,
      source: "vercel",
    });
    expect(getRequestGeography(new Headers({ "cf-ipcountry": "unknown" }))).toEqual({
      countryCode: null,
      isIran: false,
      source: null,
    });
  });

  it("creates localized display labels without storing a second taxonomy", () => {
    expect(getLocalizedCountryName("IR", "en")).toBe("Iran");
    expect(getLocalizedCountryName("DE", "en-US")).toBe("Germany");
  });
});
