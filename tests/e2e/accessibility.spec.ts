import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("authentication page has no serious or critical accessibility violations", async ({ page }) => {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });

  const report = await new AxeBuilder({ page }).analyze();
  const blocking = report.violations.filter((violation) =>
    violation.impact === "serious" || violation.impact === "critical",
  );

  expect(blocking).toEqual([]);
});
