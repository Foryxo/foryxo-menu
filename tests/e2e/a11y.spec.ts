import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * WCAG 2.2 AA automated checks (spec §151 A11y) on key public surfaces.
 * Critical + serious violations fail; moderate issues are surfaced in FINAL-AUDIT.md.
 */
const CRITICAL_TAGS = ["critical", "serious"];

async function scanNoCriticalViolations(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.locator("body").waitFor({ state: "visible" });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter((v) => v.impact && CRITICAL_TAGS.includes(v.impact));
  const report = blocking
    .map((v) => `${v.id} [${v.impact}] x${v.nodes.length}: ${v.nodes[0]?.target.join(" ")}`)
    .join("\n");
  expect(blocking, `${path} — critical/serious a11y violations:\n${report}`).toHaveLength(0);
}

test.describe("accessibility (WCAG 2.2 AA)", () => {
  test("home (fa)", async ({ page }) => scanNoCriticalViolations(page, "/fa"));
  test("home (en)", async ({ page }) => scanNoCriticalViolations(page, "/en"));
  test("demos gallery", async ({ page }) => scanNoCriticalViolations(page, "/en/demos"));
  test("blog", async ({ page }) => scanNoCriticalViolations(page, "/en/blog"));
  test("builder", async ({ page }) => scanNoCriticalViolations(page, "/en/build"));
  test("pricing", async ({ page }) => scanNoCriticalViolations(page, "/fa/pricing"));
  test("login", async ({ page }) => scanNoCriticalViolations(page, "/en/login"));
  test("live menu (mora)", async ({ page }) => scanNoCriticalViolations(page, "/menus/mora/menu"));
  test("live menu (khesht, RTL)", async ({ page }) => scanNoCriticalViolations(page, "/menus/khesht/menu"));
});
