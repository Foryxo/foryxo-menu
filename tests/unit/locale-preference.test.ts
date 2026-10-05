import { describe, expect, it } from "vitest";
import {
  localePreferenceCookie,
  resolveLocalePreference,
} from "@/lib/locale-preference";

describe("locale preference", () => {
  it("prefers the shared cookie used by server and static redirects", () => {
    expect(resolveLocalePreference("theme=dark; foryxo_locale=en", "fa")).toBe("en");
  });

  it("falls back to local storage and then Persian", () => {
    expect(resolveLocalePreference("", "en")).toBe("en");
    expect(resolveLocalePreference("", "de")).toBe("fa");
  });

  it("emits the durable same-site locale cookie", () => {
    expect(localePreferenceCookie("fa")).toBe(
      "foryxo_locale=fa; Path=/; Max-Age=31536000; SameSite=Lax",
    );
  });
});
