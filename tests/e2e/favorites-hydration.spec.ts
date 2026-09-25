import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("returning visitors restore favorites without a hydration mismatch", async ({ page }) => {
  // Two cold document loads plus Axe can exceed the default CI test budget.
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
    localStorage.setItem("indexes_favorites", JSON.stringify(["hydration-fixture"]));
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const favorites = page.getByRole("link", { name: "المفضلة", exact: true }).first();
  await expect(favorites).toBeVisible({ timeout: 30_000 });
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("indexes_favorites") ?? "[]")),
  ).toEqual(["hydration-fixture"]);
  await page.reload({ waitUntil: "domcontentloaded" });
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("indexes_favorites") ?? "[]")),
  ).toEqual(["hydration-fixture"]);
  expect(hydrationErrors).toEqual([]);
  const accessibility = await new AxeBuilder({ page })
    .include('a[aria-label="المفضلة"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
