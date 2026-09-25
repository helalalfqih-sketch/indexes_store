import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [390, 1440]) {
  test(`storefront and help are accessible at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/pages/faq", "/pages/about-us"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("searchbox", { name: "البحث عن المنتجات" })).toBeVisible();
      if (path === "/pages/about-us") {
        await expect(
          page.getByRole("heading", { level: 1, name: /تعرف على|عن المتجر|من نحن/ }),
        ).toBeVisible();
      }
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(result.violations).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
    }
  });
}
