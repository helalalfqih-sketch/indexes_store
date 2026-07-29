import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("public terms page has no serious or critical accessibility violations", async ({ page }) => {
  const response = await page.goto("/terms", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  const report = await new AxeBuilder({ page }).analyze();
  const blocking = report.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );

  expect(blocking).toEqual([]);
});
