import { defineConfig, devices } from "@playwright/test";

const useInstalledEdge = process.env.PLAYWRIGHT_USE_EDGE === "1";
const localEdge = useInstalledEdge
  ? ({
      browserName: "chromium" as const,
      channel: "msedge" as const,
      ...(process.env.E2E_DISABLE_QUIC === "1"
        ? { launchOptions: { args: ["--disable-quic", "--disable-features=EncryptedClientHello"] } }
        : {}),
    })
  : {};

export default defineConfig({
  testDir: "./tests/e2e",
  // The embedded PGlite adapter is a local single-process convenience. The
  // production PostgreSQL configuration may use Playwright's default parallelism.
  workers: process.env.DB_DRIVER === "postgres" ? undefined : 1,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: useInstalledEdge ? "desktop-edge" : "chromium", use: { ...devices["Desktop Chrome"], ...localEdge } },
    {
      name: useInstalledEdge ? "mobile-edge" : "mobile-safari",
      use: { ...devices["iPhone 13"], ...localEdge },
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
