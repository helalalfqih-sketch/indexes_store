import { expect, test } from "@playwright/test";

test("a saved cart restores but cannot checkout without server verification", async ({ page }) => {
  test.setTimeout(90_000);
  const hydrationErrors: string[] = [];
  const capture = (message: string) => {
    if (/hydration|hydrating|React error #418/i.test(message)) hydrationErrors.push(message);
  };
  page.on("pageerror", (error) => capture(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") capture(message.text());
  });
  await page.route("**/_serverFn/**", (route) => {
    if (route.request().method() === "POST") {
      return route.abort();
    }
    return route.continue();
  });
  await page.addInitScript(() => {
    if (localStorage.getItem("noqta-cart-v2")) return;
    localStorage.setItem(
      "noqta-cart-v2",
      JSON.stringify({
        state: {
          items: [
            {
              productId: "hydration-fixture",
              name: "Hydration cart fixture",
              price: 1000,
              image: "/favicon.ico",
              qty: 2,
            },
          ],
        },
        version: 0,
      }),
    );
  });

  await page.goto("/cart", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Hydration cart fixture", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Hydration cart fixture", { exact: true })).toBeVisible();
  // This saved fixture has no valid server product reference, and the network is
  // unavailable. Hydration must preserve it without trusting its cached price.
  await expect(
    page.getByRole("button", { name: "المتابعة لإتمام الطلب", exact: true }),
  ).toBeDisabled();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(
    page.getByRole("button", { name: "تأكيد الطلب عبر واتساب", exact: true }),
  ).not.toBeVisible();
  expect(hydrationErrors).toEqual([]);
});

test("saved favorites, cart, theme and Lite Mode survive a homepage reload", async ({ page }) => {
  test.setTimeout(90_000);
  const hydrationErrors: string[] = [];
  const capture = (message: string) => {
    if (/hydration|hydrating|React error #418/i.test(message)) hydrationErrors.push(message);
  };
  page.on("pageerror", (error) => capture(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") capture(message.text());
  });
  await page.addInitScript(() => {
    if (localStorage.getItem("noqta-cart-v2")) return;
    localStorage.setItem("indexes_favorites", JSON.stringify(["hydration-fixture"]));
    localStorage.setItem("indexes_store_theme", "dark");
    localStorage.setItem("indexes_lite_mode_preference", "on");
    localStorage.setItem(
      "noqta-cart-v2",
      JSON.stringify({
        state: {
          items: [
            {
              productId: "hydration-fixture",
              name: "Hydration cart fixture",
              price: 1000,
              image: "/favicon.ico",
              qty: 2,
            },
          ],
        },
        version: 0,
      }),
    );
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  for (const reload of [false, true]) {
    if (reload) await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "سلة التسوق", exact: true })).toContainText("2", {
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: "المفضلة", exact: true }).first()).toContainText(
      "1",
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(
      page.getByRole("button", { name: "إعدادات الوضع الخفيف", exact: true }).first(),
    ).toHaveClass(/bg-amber-500\/15/);
  }
  expect(hydrationErrors).toEqual([]);
});
