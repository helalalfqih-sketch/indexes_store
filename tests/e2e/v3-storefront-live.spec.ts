import { test, expect, type Page } from "@playwright/test";
import { STORE_BRANDS } from "../../src/components/storefront/filter-options";

const cards = (page: Page) =>
  page.locator('[data-qa-section="catalog"] [data-testid^="product-card-"]:visible');
const key = (page: Page, value: string) =>
  page.locator(`[data-element-key="${value}"]:visible`).first();
const state = async (page: Page) =>
  JSON.parse((await page.locator("#store-products").getAttribute("data-qa-filter-state")) || "{}");
const prices = async (page: Page) =>
  Promise.all(
    (await cards(page).all()).map(async (card) => {
      const value = await card.getAttribute("data-product-price");
      return value === null || value.trim() === "" ? NaN : Number(value);
    }),
  );

for (const device of ["desktop", "mobile"] as const) {
  test.describe(`${device} rendered storefront`, () => {
    test.use({
      viewport: device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    });
    test.beforeEach(async ({ page }) => {
      const base = process.env.PLAYWRIGHT_TEST_BASE_URL;
      const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
      if (!base || !secret) return;
      const previewOrigin = new URL(base).origin;
      await page.route("**/*", (route) => {
        if (new URL(route.request().url()).origin !== previewOrigin) return route.continue();
        return route.continue({
          headers: {
            ...route.request().headers(),
            "x-vercel-protection-bypass": secret,
          },
        });
      });
    });
    test("critical keys, routes and real product data", async ({ page }) => {
      await page.goto("/");
      for (const route of ["/search", "/offers", "/account", "/cart"]) {
        const response = await page.goto(route);
        expect(response?.status(), route).toBeLessThan(400);
        await expect(page.locator("body")).not.toBeEmpty();
      }
      await page.goto("/");
      await expect(cards(page).first()).toBeVisible({ timeout: 20_000 });
      for (const item of [
        "header.cart",
        "header.search",
        "header.notifications",
        "header.wishlist",
        "filter.price",
        "filter.brand",
        "filter.rating",
        "filter.sort",
      ]) {
        await expect(key(page, item), item).toBeVisible();
      }
      for (const card of await cards(page).all()) {
        expect(await card.getAttribute("data-product-id")).toBeTruthy();
        const rawPrice = await card.getAttribute("data-product-price");
        expect(rawPrice).toBeTruthy();
        expect(Number.isFinite(Number(rawPrice))).toBe(true);
        expect(Number(rawPrice)).toBeGreaterThan(0);
        expect(await card.getAttribute("data-section-source")).toBe("catalog");
      }
      const slug = await cards(page).first().getAttribute("data-product-slug");
      expect(slug).toBeTruthy();
      for (const route of [`/product/${encodeURIComponent(slug!)}`]) {
        const response = await page.goto(route);
        expect(response?.status(), route).toBeLessThan(400);
        await expect(page.locator("body")).not.toBeEmpty();
      }
    });
    test("price, brand and sorting use rendered card values", async ({ page }) => {
      await page.goto("/");
      await expect(cards(page).first()).toBeVisible({ timeout: 20_000 });
      for (const [preset, matches] of [
        ["under-20k", (n: number) => n < 20_000],
        ["20k-50k", (n: number) => n >= 20_000 && n <= 50_000],
        ["over-50k", (n: number) => n > 50_000],
      ] as const) {
        await key(page, `filter-price-${preset}`).click();
        await expect.poll(() => state(page).then((s) => s.priceRange)).toBe(preset);
        await expect
          .poll(
            async () => {
              const actual = await prices(page);
              return actual.length > 0 && actual.every((n) => Number.isFinite(n) && matches(n));
            },
            { message: `Observed catalog prices must match ${preset}` },
          )
          .toBe(true);
      }
      await key(page, "filter-price-all").click();
      for (const [sort, ordered] of [
        ["price-low", (a: number, b: number) => a <= b],
        ["price-high", (a: number, b: number) => a >= b],
      ] as const) {
        await key(page, "filter.sort").click();
        await key(page, `filter-sort-${sort}`).click();
        await expect.poll(() => state(page).then((s) => s.sort)).toBe(sort);
        await expect
          .poll(async () => {
            const actual = await prices(page);
            return (
              actual.length > 0 &&
              actual.every((n, i) => Number.isFinite(n) && (i === 0 || ordered(actual[i - 1], n)))
            );
          })
          .toBe(true);
      }
      const brands = await cards(page).evaluateAll((elements) =>
        elements.map((el) => el.getAttribute("data-product-brand")).filter(Boolean),
      );
      const brand = STORE_BRANDS.find((option) =>
        brands.some((value) =>
          [option.id, option.name, ...option.keywords].some(
            (alias) => alias.toLowerCase() === value?.toLowerCase(),
          ),
        ),
      );
      expect(brand, "No observed brand matches a selectable brand").toBeDefined();
      await key(page, "filter.brand").click();
      await expect(key(page, `filter-brand-${brand!.id}`)).toBeVisible();
      await page.waitForTimeout(350); // Wait for the filter drawer's entrance animation.
      await key(page, `filter-brand-${brand!.id}`).click();
      await expect.poll(() => state(page).then((s) => s.brand)).toContain(brand!.id);
      expect(await cards(page).count()).toBeGreaterThan(0);
      for (const card of await cards(page).all()) {
        expect([
          brand!.id.toLowerCase(),
          brand!.name.toLowerCase(),
          ...brand!.keywords.map((alias) => alias.toLowerCase()),
        ]).toContain((await card.getAttribute("data-product-brand"))?.toLowerCase());
      }
    });
    test("rating filter uses verified rendered ratings", async ({ page }) => {
      await page.goto("/");
      await expect(cards(page).first()).toBeVisible({ timeout: 20_000 });
      await key(page, "filter.rating").click();
      await expect(key(page, "filter-rating-4.0")).toBeVisible();
      await page.waitForTimeout(350);
      await key(page, "filter-rating-4.0").click();
      await expect.poll(() => state(page).then((s) => s.rating)).toContain("4.0");
      expect(await cards(page).count()).toBeGreaterThan(0);
      for (const card of await cards(page).all()) {
        const rating = await card.getAttribute("data-product-rating");
        expect(rating).toBeTruthy();
        expect(Number(rating)).toBeGreaterThanOrEqual(4);
      }
    });
    test("reset clears combined filter state", async ({ page }) => {
      await page.goto("/");
      await expect(cards(page).first()).toBeVisible({ timeout: 20_000 });
      await key(page, "filter-price-under-20k").click();
      await key(page, "filter.sort").click();
      await key(page, "filter-sort-price-low").click();
      await key(page, "filter.brand").click();
      await expect(key(page, "filter-brand-indexes")).toBeVisible();
      await page.waitForTimeout(350);
      await key(page, "filter-brand-indexes").click();
      await key(page, "filter.rating").click();
      await expect(key(page, "filter-rating-4.0")).toBeVisible();
      await page.waitForTimeout(350);
      await key(page, "filter-rating-4.0").click();
      await expect.poll(() => state(page).then((s) => s.rating)).toContain("4.0");
      await key(page, "filter.reset").click();
      await expect
        .poll(() => state(page))
        .toMatchObject({
          category: "all",
          minPrice: null,
          maxPrice: null,
          brand: [],
          rating: [],
          sort: "default",
        });
    });
  });
}
