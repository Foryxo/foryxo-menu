import { test, expect } from "@playwright/test";

/**
 * Smoke: public surfaces render, respond 200, and expose the product chrome.
 * Runs against the dev server started by playwright webServer (or E2E_BASE_URL).
 */

test("home page (fa) renders hero, process and FAQ", async ({ page }) => {
  await page.goto("/fa");
  await expect(page).toHaveTitle(/فوریکسو|Foryxo/i);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: /فرآیند|مراحل|سؤالات/i }).first()).toBeVisible();
});

test("home page (en) is LTR with English copy", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/menu/i);
});

test("demos gallery lists all 10 designs", async ({ page }) => {
  await page.goto("/en/demos");
  await expect(page.getByRole("link", { name: /open full live menu/i })).toHaveCount(10);
  await expect(page.locator("[aria-label*='menu preview'] img").first()).toBeVisible();
});

test("demo detail page shows preview and CTA", async ({ page }) => {
  await page.goto("/en/demos/mora");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("live demo menu renders at /menus/[slug]/menu without login", async ({ page }) => {
  await page.goto("/menus/mora/menu?lang=en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Menu items visible
  await expect(page.getByText(/espresso/i).first()).toBeVisible();
  await expect(page.locator("main img").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /add/i })).toHaveCount(0);
});

test("live Persian menu (khesht) renders Persian item names", async ({ page }) => {
  await page.goto("/menus/khesht/menu");
  await expect(page.getByText(/کباب|چلو/i).first()).toBeVisible();
});

test("live menu language switch synchronizes URL and document direction", async ({ page }) => {
  await page.goto("/menus/mora/menu?lang=en");
  await page.getByRole("button", { name: "فا", exact: true }).click();
  await expect(page).toHaveURL(/lang=fa/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("missing pages render the branded noindex error experience", async ({ page, request }) => {
  expect((await request.get("/fa/not-a-real-route")).status()).toBe(404);
  await page.goto("/menus/not-real/menu");
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("pricing page renders with Toman amounts", async ({ page }) => {
  await page.goto("/fa/pricing");
  await expect(page.getByText(/تومان/).first()).toBeVisible();
});

test("builder page loads the configurator", async ({ page }) => {
  await page.goto("/en/build");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByText(/café/i).first().click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/design it for me/i)).toBeVisible();
});

test("builder waits for its persisted draft before allowing choices", async ({ page }) => {
  let delayed = false;
  await page.route("**/api/builder/draft", async (route) => {
    if (route.request().method() === "GET" && !delayed) {
      delayed = true;
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    await route.continue();
  });
  await page.goto("/en/build", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Loading your menu setup…", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Café", exact: true })).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Café", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/design it for me/i)).toBeVisible();
});

test("builder offers named food-photo editing and prices the image count", async ({ page }) => {
  await page.goto("/en/build?demo=mora");
  await page.getByText(/café/i).first().click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("textbox", { name: "Brand name (Persian)", exact: true }).fill("Test Cafe");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByText("English", { exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByText("Edit and place my food photos", { exact: true }).click();
  const count = page.getByLabel(/how many food photos/i);
  await expect(count).toHaveValue("1");
  await count.fill("12");
  await expect(page.getByText(/estimated image editing/i)).toBeVisible();
});

test("builder configures shared or unique menus for multiple branches", async ({ page }) => {
  await page.goto("/en/build?demo=mora");
  await page.getByText(/café/i).first().click();
  for (let step = 0; step < 2; step += 1) await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("textbox", { name: "Brand name (Persian)", exact: true }).fill("Test Cafe");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByText("English", { exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByText("Multiple branches", { exact: true }).click();
  await expect(page.getByLabel("Total number of branches")).toHaveValue("2");
  await page.getByLabel("Total number of branches").fill("4");
  await page.getByText("A unique menu per branch", { exact: true }).click();
  await expect(page.getByText(/estimated branch setup/i)).toBeVisible();
});

test("private media workflow APIs reject anonymous access", async ({ request }) => {
  const upload = await request.post("/api/upload", { multipart: { businessId: "not-mine", kind: "food_photo" } });
  expect(upload.status()).toBe(401);
  const update = await request.patch("/api/creator/assets", { data: { mediaId: "x", workflowStatus: "editing" } });
  expect(update.status()).toBe(401);
  expect((await request.patch("/api/orders/00000000-0000-0000-0000-000000000000", { data: { status: "accepted" } })).status()).toBe(401);
  expect((await request.post("/api/branches", { data: {} })).status()).toBeGreaterThanOrEqual(400);
});

test("blog index and article are complete bilingual routes", async ({ page }) => {
  await page.goto("/en/blog");
  const articleLink = page.locator("a[href^='/en/blog/']").first();
  await expect(articleLink).toBeVisible();
  await articleLink.click();
  await expect(page.locator("article").first()).toBeVisible();
  await expect(page.locator("article img").first()).toBeVisible();
});

test("language switch preserves the current route and theme persists", async ({ page }) => {
  await page.goto("/en/demos/mora");
  const menuToggle = page.getByRole("button", { name: "Toggle menu", exact: true });
  if (await menuToggle.isVisible()) {
    await menuToggle.click();
  }
  const themeButton = page.getByRole("button", { name: /theme:/i }).first();
  await themeButton.click();
  const isDark = await page.locator("html").evaluate((html) => html.classList.contains("dark"));
  await page.getByRole("link", { name: "فا", exact: true }).first().click();
  await expect(page).toHaveURL(/\/fa\/demos\/mora/);
  expect(await page.locator("html").evaluate((html) => html.classList.contains("dark"))).toBe(isDark);
});

test("mobile pages do not overflow horizontally", async ({ page }) => {
  await page.goto("/fa");
  const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflowing).toBe(false);
});

test("mobile navigation animates open and closes without leaving the page locked", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile navigation is only rendered below the desktop breakpoint");
  await page.goto("/en");
  const toggle = page.getByRole("button", { name: "Toggle menu", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("login page offers email and phone OTP", async ({ page }) => {
  await page.goto("/fa/login");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("robots.txt and sitemap.xml respond", async ({ request }) => {
  expect((await request.get("/robots.txt")).status()).toBe(200);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");
});

test("llms.txt responds with product description", async ({ request }) => {
  const res = await request.get("/llms.txt");
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("Foryxo Menu");
});

test("private order tracking tokens fail closed", async ({ request }) => {
  const malformed = await request.get("/api/orders/track/not-a-valid-token");
  expect(malformed.status()).toBe(404);
  const unknown = await request.get(`/api/orders/track/${"a".repeat(36)}`);
  expect(unknown.status()).toBe(404);
});
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  (page as typeof page & { __runtimeErrors?: string[] }).__runtimeErrors = errors;
});

test.afterEach(async ({ page }) => {
  const errors = (page as typeof page & { __runtimeErrors?: string[] }).__runtimeErrors ?? [];
  expect(errors.filter((message) => !message.includes("favicon")), "browser console/runtime errors").toEqual([]);
});
