/* eslint-disable prettier/prettier */
import { chromium, type Browser, type Page } from "@playwright/test";
import { createHash } from "node:crypto";

const STORE_ORIGIN = "https://indexes-store.vercel.app";
const PREVIEW_HOST_RE = /^indexes-store-[a-z0-9-]+\.vercel\.app$/i;
const MAX_ELEMENTS = 400;
const MAX_EVENTS = 100;
const MAX_SCREENSHOT_BYTES = 4_000_000;

function allowedUrl(value: string) {
  const url = new URL(value, STORE_ORIGIN);
  const production = url.origin === STORE_ORIGIN;
  const preview = url.protocol === "https:" && PREVIEW_HOST_RE.test(url.hostname);
  if ((!production && !preview) || !["https:", "http:"].includes(url.protocol)) {
    throw new Error("BROWSER_URL_FORBIDDEN");
  }
  return url;
}

async function withPage<T>(
  value: string,
  viewport: { width: number; height: number },
  run: (page: Page, browser: Browser) => Promise<T>,
) {
  const url = allowedUrl(value);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport });
    await page.goto(url.toString(), { waitUntil: "networkidle", timeout: 30_000 });
    return await run(page, browser);
  } finally {
    await browser.close();
  }
}

export interface StoreBrowserInspectionAdapter {
  inspectRenderedPage(url: string, device: "desktop" | "mobile"): Promise<Record<string, unknown>>;
  inspectConsole(url: string): Promise<Record<string, unknown>>;
  inspectNetwork(url: string): Promise<Record<string, unknown>>;
  screenshot(url: string, device: "desktop" | "mobile"): Promise<Record<string, unknown>>;
  safeClick(input: {
    url: string;
    selector: string;
    device: "desktop" | "mobile";
  }): Promise<Record<string, unknown>>;
  trialNavigation(input: {
    url: string;
    href?: string;
    text?: string;
  }): Promise<Record<string, unknown>>;
  comparePages(input: {
    productionUrl: string;
    previewUrl: string;
    device: "desktop" | "mobile";
  }): Promise<Record<string, unknown>>;
}

export function createStoreBrowserInspectionAdapter(): StoreBrowserInspectionAdapter {
  return {
    async inspectRenderedPage(url, device) {
      const viewport = device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
      return withPage(url, viewport, async (page) => {
        const data = await page.locator("a,button,input,select,textarea,form").evaluateAll(
          (nodes) =>
            nodes.slice(0, MAX_ELEMENTS).map((node) => {
              const element = node as HTMLElement;
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return {
                tag: element.tagName.toLowerCase(),
                text: (element.innerText || element.getAttribute("aria-label") || "").trim().slice(0, 300),
                id: element.id || null,
                role: element.getAttribute("role"),
                ariaLabel: element.getAttribute("aria-label"),
                href: element instanceof HTMLAnchorElement ? element.href : null,
                disabled: element.hasAttribute("disabled"),
                visible:
                  rect.width > 0 &&
                  rect.height > 0 &&
                  style.visibility !== "hidden" &&
                  style.display !== "none",
                box: {
                  x: Math.round(rect.x),
                  y: Math.round(rect.y),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height),
                },
              };
            }),
        );
        return {
          url: page.url(),
          title: await page.title(),
          device,
          viewport,
          elements: data,
          elementCount: data.length,
          inspectionMode: "rendered-read-only",
        };
      });
    },

    async inspectConsole(url) {
      return withPage(url, { width: 1440, height: 1000 }, async (page) => {
        const events: Array<Record<string, unknown>> = [];
        page.on("console", (message) => {
          if (events.length >= MAX_EVENTS) return;
          events.push({ type: message.type(), text: message.text().slice(0, 1000) });
        });
        page.on("pageerror", (error) => {
          if (events.length >= MAX_EVENTS) return;
          events.push({ type: "pageerror", text: error.message.slice(0, 1000) });
        });
        await page.reload({ waitUntil: "networkidle", timeout: 30_000 });
        return {
          url: page.url(),
          count: events.length,
          errors: events.filter((event) => ["error", "pageerror"].includes(String(event.type))),
          events,
        };
      });
    },

    async inspectNetwork(url) {
      return withPage(url, { width: 1440, height: 1000 }, async (page) => {
        const failures: Array<Record<string, unknown>> = [];
        const badResponses: Array<Record<string, unknown>> = [];
        page.on("requestfailed", (request) => {
          if (failures.length >= MAX_EVENTS) return;
          const requestUrl = new URL(request.url());
          failures.push({
            method: request.method(),
            origin: requestUrl.origin,
            path: requestUrl.pathname,
            resourceType: request.resourceType(),
            error: request.failure()?.errorText ?? null,
          });
        });
        page.on("response", (response) => {
          if (response.status() < 400 || badResponses.length >= MAX_EVENTS) return;
          const responseUrl = new URL(response.url());
          badResponses.push({
            status: response.status(),
            origin: responseUrl.origin,
            path: responseUrl.pathname,
            resourceType: response.request().resourceType(),
          });
        });
        await page.reload({ waitUntil: "networkidle", timeout: 30_000 });
        return { url: page.url(), failedRequests: failures, badResponses };
      });
    },

    async trialNavigation(input) {
      return withPage(input.url, { width: 1440, height: 1000 }, async (page) => {
        if (!input.href && !input.text) throw new Error("NAVIGATION_TARGET_REQUIRED");
        const locator = input.href
          ? page.locator(`a[href="${input.href.replace(/"/g, '\\"')}"]`).first()
          : page.getByRole("link", { name: input.text!, exact: true }).first();
        if ((await locator.count()) === 0) {
          return { found: false, startUrl: page.url(), destination: null };
        }
        const href = await locator.getAttribute("href");
        if (!href) return { found: true, navigable: false, startUrl: page.url(), destination: null };
        const destination = allowedUrl(new URL(href, page.url()).toString());
        const before = page.url();
        await locator.click({ timeout: 10_000 });
        await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
        return {
          found: true,
          navigable: true,
          startUrl: before,
          expectedDestination: destination.toString(),
          finalUrl: page.url(),
          stayedWithinAllowlist: Boolean(allowedUrl(page.url())),
        };
      });
    },

    async comparePages(input) {
      const production = allowedUrl(input.productionUrl);
      const preview = allowedUrl(input.previewUrl);
      if (production.origin !== STORE_ORIGIN) throw new Error("PRODUCTION_URL_REQUIRED");
      if (preview.origin === STORE_ORIGIN) throw new Error("PREVIEW_URL_REQUIRED");
      const viewport =
        input.device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };

      const inspect = async (url: string) =>
        withPage(url, viewport, async (page) => {
          const elements = await page.locator("a,button,input,select,textarea,form").count();
          const image = await page.screenshot({ fullPage: true, type: "png" });
          return {
            url: page.url(),
            title: await page.title(),
            elementCount: elements,
            screenshotSha256: createHash("sha256").update(image).digest("hex"),
            screenshotBytes: image.length,
          };
        });

      const [before, after] = await Promise.all([
        inspect(production.toString()),
        inspect(preview.toString()),
      ]);
      return {
        device: input.device,
        production: before,
        preview: after,
        changed:
          before.title !== after.title ||
          before.elementCount !== after.elementCount ||
          before.screenshotSha256 !== after.screenshotSha256,
      };
    },

    async safeClick(input) {
      const viewport =
        input.device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
      return withPage(input.url, viewport, async (page) => {
        const locator = page.locator(input.selector).first();
        if ((await locator.count()) !== 1) throw new Error("SAFE_CLICK_TARGET_NOT_FOUND");
        const info = await locator.evaluate((node) => {
          const element = node as HTMLElement;
          const tag = element.tagName.toLowerCase();
          const href = element instanceof HTMLAnchorElement ? element.href : null;
          const type = element.getAttribute("type")?.toLowerCase() ?? null;
          const text = (element.innerText || element.getAttribute("aria-label") || "").trim();
          const form = element.closest("form");
          return {
            tag,
            href,
            type,
            text: text.slice(0, 200),
            insideForm: Boolean(form),
            formAction: form?.getAttribute("action") ?? null,
          };
        });

        const forbiddenText =
          /(شراء|اطلب|تأكيد|دفع|checkout|place order|submit|delete|remove|حذف|ارسال|إرسال)/i;
        if (
          info.insideForm ||
          info.type === "submit" ||
          forbiddenText.test(info.text) ||
          (info.href && new URL(info.href).origin !== STORE_ORIGIN)
        ) {
          throw new Error("SAFE_CLICK_FORBIDDEN");
        }

        const before = page.url();
        await locator.click({ timeout: 10_000 });
        await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
        const after = page.url();
        if (new URL(after).origin !== STORE_ORIGIN) throw new Error("SAFE_CLICK_LEFT_STORE_ORIGIN");
        return {
          before,
          after,
          target: info,
          navigationChanged: before !== after,
          title: await page.title(),
          inspectionMode: "safe-click-read-only",
        };
      });
    },

    async screenshot(url, device) {
      const viewport = device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
      return withPage(url, viewport, async (page) => {
        const image = await page.screenshot({ fullPage: true, type: "png" });
        if (image.length > MAX_SCREENSHOT_BYTES) throw new Error("SCREENSHOT_TOO_LARGE");
        return {
          url: page.url(),
          device,
          viewport,
          mimeType: "image/png",
          bytes: image.length,
          sha256: createHash("sha256").update(image).digest("hex"),
          note:
            "The MCP returns screenshot metadata only in V2. Binary image delivery will be added separately to avoid oversized tool responses.",
        };
      });
    },
  };
}
