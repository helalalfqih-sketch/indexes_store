import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("returning visitors restore favorites without a hydration mismatch", async ({ page }) => {
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
  const favorites = page.getByRole("button", { name: "المفضلة", exact: true }).first();
  await expect(favorites).toBeVisible({ timeout: 30_000 });
  await expect(favorites).toContainText("1");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(favorites).toContainText("1");
  expect(hydrationErrors).toEqual([]);
  const accessibility = await new AxeBuilder({ page })
    .include('button[aria-label="المفضلة"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
