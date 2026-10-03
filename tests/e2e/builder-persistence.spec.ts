import { expect, test } from "@playwright/test";

test("builder restores saved choices after reload", async ({ page }) => {
  await page.goto("/en/build");
  await page.getByRole("button", { name: "Café", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/Progress saved/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Choose your design" })).toBeVisible();
});

test("builder exposes a working retry when a draft save fails", async ({ page }) => {
  let failedOnce = false;
  await page.route("**/api/builder/draft", async (route) => {
    if (route.request().method() === "PATCH" && !failedOnce) {
      failedOnce = true;
      await route.fulfill({ status: 500, body: JSON.stringify({ error: "test failure" }) });
    } else {
      await route.continue();
    }
  });
  await page.goto("/en/build");
  await page.getByRole("button", { name: "Café", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry saving" })).toBeVisible();
  await page.getByRole("button", { name: "Retry saving" }).click();
  await expect(page.getByText(/Progress saved/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Café", exact: true })).toHaveAttribute("aria-pressed", "true");
});
