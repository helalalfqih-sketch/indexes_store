import { chromium, type Browser, type Page } from "playwright";
import { createHash } from "node:crypto";

const STORE_ORIGIN = "https://indexes-store.vercel.app";
const MAX_ELEMENTS = 400;
const MAX_EVENTS = 100;
const MAX_SCREENSHOT_BYTES = 4_000_000;

function allowedUrl(value: string) {
  const url = new URL(value, STORE_ORIGIN);
  if (url.origin !== STORE_ORIGIN || !["https:", "http:"].includes(url.protocol)) {
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
    const page = await browser.newPage({ viewportSize: viewport });
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
