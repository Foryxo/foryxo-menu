import { afterEach, describe, expect, it, vi } from "vitest";
import { accountUrl } from "@/lib/account-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("accountUrl", () => {
  it("keeps account navigation same-origin in the full-stack app", () => {
    vi.stubEnv("NEXT_PUBLIC_ACCOUNT_APP_URL", "");
    expect(accountUrl("/fa/login")).toBe("/fa/login");
  });

  it("routes static-site account actions to the configured app origin", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_ACCOUNT_APP_URL",
      "https://foryxo-menu-app.onrender.com/",
    );

    expect(accountUrl("/en/login?next=/en/build")).toBe(
      "https://foryxo-menu-app.onrender.com/en/login?next=/en/build",
    );
  });
});
