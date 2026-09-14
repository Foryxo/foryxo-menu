import { test, expect } from "@playwright/test";
import { demos } from "../../content/demos/index";
import { features } from "../../content/features";
import { getDictionary } from "../../src/domains/i18n/index";

for (const locale of ["en", "fa"] as const) {
  test(`${locale}: every builder option survives forward and back navigation`, async ({ page }) => {
    test.setTimeout(420_000);
    page.setDefaultTimeout(8000);
    const t = getDictionary(locale);
    const next = page.getByRole("button", { name: t.common.next, exact: true });
    const previous = page.getByRole("button", { name: t.common.previous, exact: true });
    const forwardAndBack = async () => {
      await next.click();
      await previous.click();
    };

    await page.goto(`/${locale}/build`);
    await expect(page.getByRole("button", { name: t.build.businessType.cafe, exact: true })).toBeVisible();
    for (const label of Object.values(t.build.businessType)) {
      const option = page.getByRole("button", { name: label, exact: true });
      await option.click();
      await expect(option).toHaveAttribute("aria-pressed", "true");
      await forwardAndBack();
    }
    await next.click();

    const custom = page.getByRole("button", { name: locale === "fa" ? "طراحی اختصاصی" : "Choose custom design", exact: true });
    await custom.click();
    await forwardAndBack();
    for (const demo of demos) {
      const name = locale === "fa" ? demo.nameFa : demo.name;
      const option = page.getByRole("button", { name: new RegExp(`: ${name}$`) });
      await option.click();
      await expect(option).toContainText(locale === "fa" ? "انتخاب شد" : "Selected");
      await forwardAndBack();
    }
    await next.click();

    await page.getByRole("textbox", { name: t.build.styleName, exact: true }).fill(locale === "fa" ? "کافه تست" : "Test Cafe");
    for (const mode of ["system", "light", "dark"] as const) {
      const label = locale === "fa" ? { system: "سیستم", light: "روشن", dark: "تیره" }[mode] : { system: "System", light: "Light", dark: "Dark" }[mode];
      const option = page.getByRole("button", { name: label, exact: true });
      await option.click();
      await expect(option).toHaveAttribute("aria-pressed", "true");
      await forwardAndBack();
    }
    for (const label of Object.values(t.build.styleFontFeel)) {
      const option = page.getByRole("button", { name: label, exact: true });
      await option.click();
      await expect(option).toHaveAttribute("aria-pressed", "true");
      await forwardAndBack();
    }
    await next.click();

    for (const label of [t.build.languageFa, t.build.languageEn, t.build.languageOther]) {
      const option = page.getByRole("button", { name: label, exact: false });
      await option.click();
      await forwardAndBack();
    }
    await next.click();

    for (const feature of features.filter((item) => !["custom_domain", "custom_design", "managed_editing"].includes(item.key))) {
      const label = locale === "fa" ? feature.fa : feature.en;
      const option = page.getByRole("button", { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).first();
      await option.click();
      await forwardAndBack();
      await expect(option).toBeVisible();
    }
    await next.click();

    for (const label of Object.values(t.build.contentOptions)) {
      const option = page.getByRole("button", { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).first();
      await option.click();
      await forwardAndBack();
    }
    await next.click();

    for (const [key, label] of Object.entries(t.build.domainOptions)) {
      const option = page.getByRole("button", { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).first();
      await option.click();
      if (key === "own") await page.getByPlaceholder("menu.mycafe.ir").fill("menu.example.com");
      await forwardAndBack();
    }
    await next.click();

    for (const label of Object.values(t.build.managementOptions)) {
      const option = page.getByRole("button", { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).first();
      await option.click();
      await forwardAndBack();
    }
    await next.click();
    await expect(page.locator("p:visible").filter({ hasText: locale === "fa" ? /زمان تقریبی اجرا/ : /Estimated delivery/ }).first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "fa" ? "rtl" : "ltr");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}
