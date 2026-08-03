import { expect, test, type Page } from "@playwright/test";

const route = process.env.STOREFRONT_TEST_ROUTE || "/";

async function settleStorefront(page: Page) {
  await page.goto(route, { waitUntil: "networkidle" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((image) => image.decode().catch(() => undefined)),
    );
  });
}

test.describe("Storefront premium reference", () => {
  test.use({ viewport: { width: 1024, height: 1536 }, deviceScaleFactor: 1 });

  test("preserves the reference composition and captures the visual result", async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await settleStorefront(page);

    const sections = [
      page.getByRole("banner"),
      page.getByLabel("معلومات التوصيل والشحن"),
      page.getByTestId("hero-sphere-3d"),
      page.getByLabel("اختصارات التصنيفات"),
      page.getByRole("heading", { name: "أفضل العروض" }),
      page.getByLabel("برنامج INDEXES المميز"),
    ];
    const boxes = await Promise.all(sections.map((section) => section.first().boundingBox()));
    for (let index = 1; index < boxes.length; index += 1) {
      expect(boxes[index]).not.toBeNull();
      expect(boxes[index - 1]).not.toBeNull();
      expect(boxes[index]!.y).toBeGreaterThan(boxes[index - 1]!.y);
    }

    const bottomNav = page.getByRole("navigation", { name: "التنقل الرئيسي" });
    await expect(bottomNav).toBeVisible();
    const navBox = await bottomNav.boundingBox();
    expect(navBox).not.toBeNull();
    expect(navBox!.y + navBox!.height).toBeLessThanOrEqual(1536);
    await expect(page.locator("html")).not.toHaveCSS("overflow-x", "scroll");

    const screenshotPath = testInfo.outputPath("storefront-result-1024x1536.png");
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      animations: "disabled",
    });
    await testInfo.attach("storefront-result-1024x1536", {
      path: screenshotPath,
      contentType: "image/png",
    });

    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);

    if (process.env.STOREFRONT_REFERENCE_ASSERT === "1") {
      await expect(page).toHaveScreenshot("storefront-reference-1024x1536.png", {
        animations: "disabled",
        fullPage: false,
        maxDiffPixels: 0,
      });
    }
  });

  test("uses client routing and updates the real cart state", async ({ page }) => {
    await settleStorefront(page);
    const firstAddButton = page.getByRole("button", { name: /^أضف .* إلى السلة$/ }).first();
    if (await firstAddButton.isEnabled()) {
      await firstAddButton.click();
      await expect(firstAddButton).toContainText("تمت الإضافة");
      await expect(page.getByRole("link", { name: "السلة" }).first()).toBeVisible();
    }

    await page.getByRole("link", { name: "البحث" }).last().click();
    await expect(page).toHaveURL(/\/search/);
    expect(await page.evaluate(() => performance.getEntriesByType("navigation").length)).toBe(1);
  });
});
