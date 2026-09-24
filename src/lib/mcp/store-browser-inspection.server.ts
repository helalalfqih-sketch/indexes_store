/* eslint-disable prettier/prettier */
import { readQaState, diffQaState } from "./store-qa-state";
import serverlessChromium from "@sparticuz/chromium";
import { chromium as playwright, type Browser, type BrowserContext, type Page } from "playwright-core";
import { createHash } from "node:crypto";

const STORE_ORIGIN = "https://indexes-store.vercel.app";
const PRODUCTION_ORIGIN = "https://indexes-store-rosy.vercel.app";
const PREVIEW_HOST_RE = /^indexes-store-[a-z0-9-]+\.vercel\.app$/i;
const SAFE_SELECTOR_RE =
  /^(?:#[A-Za-z][\w-]{0,80}|(?:(?:button|a|input|select|textarea))?\[(?:data-testid|aria-label|name|title)="[^"\\]{1,120}"\])$/u;
const MAX_ELEMENTS = 400;
const MAX_EVENTS = 100;
const MAX_SCREENSHOT_BYTES = 4_000_000;

function allowedUrl(value: string) {
  const url = new URL(value, STORE_ORIGIN);
  const production = url.origin === STORE_ORIGIN;
  const preview =
    url.protocol === "https:" &&
    PREVIEW_HOST_RE.test(url.hostname) &&
    !url.username &&
    !url.password &&
    !url.port;
  if ((!production && !preview) || !["https:", "http:"].includes(url.protocol)) {
    throw new Error("BROWSER_URL_FORBIDDEN");
  }
  return url;
}

async function launchBrowser() {
  if (!process.env.VERCEL) {
    try {
      return await playwright.launch({ headless: true });
    } catch {
      throw new Error("BROWSER_LOCAL_RUNTIME_UNAVAILABLE");
    }
  }

  let executablePath: string;
  try {
    executablePath = await serverlessChromium.executablePath();
  } catch {
    throw new Error("BROWSER_EXECUTABLE_UNAVAILABLE");
  }

  if (!executablePath) {
    throw new Error("BROWSER_EXECUTABLE_UNAVAILABLE");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await playwright.launch({
        args: serverlessChromium.args,
        executablePath,
        headless: true,
      });
    } catch {
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
    }
  }

  throw new Error("BROWSER_LAUNCH_FAILED");
}

async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 8_000 }).catch(() => undefined);
  await page.waitForLoadState("load", { timeout: 5_000 }).catch(() => undefined);
  await page.waitForTimeout(500);
}

async function hasUsableDocument(page: Page, target: URL) {
  try {
    const current = allowedUrl(page.url());
    if (current.origin !== target.origin) return false;
    await page.locator("body").waitFor({ state: "attached", timeout: 3_000 });
    return true;
  } catch {
    return false;
  }
}

async function navigatePage(page: Page, target: URL) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await page.goto(target.toString(), {
        waitUntil: "commit",
        timeout: 15_000,
      });
      if (response && response.status() >= 400) {
        throw new Error(`BROWSER_HTTP_${response.status()}`);
      }
      await settle(page);
      if (await hasUsableDocument(page, target)) return;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("BROWSER_HTTP_")) throw error;
      if (await hasUsableDocument(page, target)) {
        await settle(page);
        return;
      }
    }

    if (attempt < 2) {
      await page.waitForTimeout(attempt === 0 ? 350 : 700).catch(() => undefined);
    }
  }

  throw new Error("BROWSER_NAVIGATION_FAILED");
}

export async function withPage<T>(
  value: string,
  viewport: { width: number; height: number },
  run: (page: Page, browser: Browser) => Promise<T>,
  beforeNavigate?: (page: Page) => void,
) {
  const url = allowedUrl(value);
  const browser = await launchBrowser();
  let context: BrowserContext | undefined;
  try {
    let page: Page;
    try {
      context = await browser.newContext({
        viewport,
        serviceWorkers: "block",
      });
      page = await context.newPage();
    } catch {
      throw new Error("BROWSER_PAGE_INIT_FAILED");
    }

    beforeNavigate?.(page);
    await navigatePage(page, url);
    return await run(page, browser);
  } finally {
    await context?.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

async function readRenderedElements(page: Page) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.locator("body").waitFor({ state: "attached", timeout: 3_000 });
      if (attempt > 0) {
        await page.waitForTimeout(300);
      }
      return await page.evaluate((maxElements) => {
        const nodes = Array.from(
          document.querySelectorAll("a,button,input,select,textarea,form"),
        ).slice(0, maxElements);

        return nodes.map((node) => {
          const element = node as HTMLElement;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            text: (element.innerText || element.getAttribute("aria-label") || "")
              .trim()
              .slice(0, 300),
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
        });
      }, MAX_ELEMENTS);
    } catch (error) {
      lastError = error;
      if (page.isClosed()) throw new Error("BROWSER_PAGE_CLOSED");
      await page.waitForLoadState("domcontentloaded", { timeout: 3_000 }).catch(() => undefined);
    }
  }

  if (lastError) throw new Error("BROWSER_DOM_INSPECTION_FAILED");
  throw new Error("BROWSER_DOM_INSPECTION_FAILED");
}

async function readPageTitle(page: Page) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await page.title();
    } catch {
      if (attempt === 0) {
        await page.waitForTimeout(200).catch(() => undefined);
      }
    }
  }
  throw new Error("BROWSER_TITLE_READ_FAILED");
}

export interface StoreBrowserInspectionAdapter {
  inspectRenderedPage(url: string, device: "desktop" | "mobile"): Promise<Record<string, unknown>>;
  inspectConsole(url: string): Promise<Record<string, unknown>>;
  inspectNetwork(url: string): Promise<Record<string, unknown>>;
  screenshot(url: string, device: "desktop" | "mobile"): Promise<Record<string, unknown>>;
  safeClick(input: {
    url: string;
    selector?: string;
    elementKey?: string;
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

export function createStoreBrowserInspectionAdapter(browse: typeof withPage = withPage): StoreBrowserInspectionAdapter {
  return {
    async inspectRenderedPage(url, device) {
      const viewport = device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
      return browse(url, viewport, async (page) => {
        const data = await readRenderedElements(page);
        return {
          url: page.url(),
          title: await readPageTitle(page),
          device,
          viewport,
          elements: data,
          elementCount: data.length,
          inspectionMode: "rendered-read-only",
        };
      });
    },

    async inspectConsole(url) {
      const events: Array<Record<string, unknown>> = [];
      return browse(
        url,
        { width: 1440, height: 1000 },
        async (page) => ({
          url: page.url(),
          count: events.length,
          errors: events.filter((event) => ["error", "pageerror"].includes(String(event.type))),
          events,
        }),
        (page) => {
          page.on("console", (message) => {
            if (events.length >= MAX_EVENTS) return;
            events.push({ type: message.type(), text: message.text().slice(0, 1000) });
          });
          page.on("pageerror", (error) => {
            if (events.length >= MAX_EVENTS) return;
            events.push({ type: "pageerror", text: error.message.slice(0, 1000) });
          });
        },
      );
    },

    async inspectNetwork(url) {
      const failures: Array<Record<string, unknown>> = [];
      const badResponses: Array<Record<string, unknown>> = [];
      return browse(
        url,
        { width: 1440, height: 1000 },
        async (page) => ({ url: page.url(), failedRequests: failures, badResponses }),
        (page) => {
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
        },
      );
    },

    async trialNavigation(input) {
      return browse(input.url, { width: 1440, height: 1000 }, async (page) => {
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
        if (destination.origin !== new URL(before).origin) throw new Error("NAVIGATION_ORIGIN_FORBIDDEN");
        if (!/^\/(?:$|search\/?$|offers\/?$|account\/?$|product\/[^/]+\/?$)/.test(destination.pathname)) throw new Error("NAVIGATION_ROUTE_NOT_AUDITED");
        await page.context().route("**/*", async route => {
          const request = route.request();
          if (!["GET", "HEAD"].includes(request.method()) || new URL(request.url()).origin !== destination.origin) { await route.abort(); return; }
          await route.continue();
        });
        // Navigate to the inspected href instead of executing an arbitrary link handler.
        await navigatePage(page, destination);
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
      if (production.origin !== PRODUCTION_ORIGIN) throw new Error("PRODUCTION_URL_REQUIRED");
      if (preview.origin === PRODUCTION_ORIGIN || preview.origin === STORE_ORIGIN) throw new Error("PREVIEW_URL_REQUIRED");
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
      const targetOrigin = allowedUrl(input.url).origin;
      if ((!input.selector && !input.elementKey) || (input.selector && !SAFE_SELECTOR_RE.test(input.selector))) throw new Error("SAFE_SELECTOR_FORBIDDEN");
      const viewport =
        input.device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
      return browse(input.url, viewport, async (page) => {
        // Desktop controls can remain in the mobile DOM while hidden.
        const beforeState = await readQaState(page);
        const keyedTarget = input.elementKey ? beforeState.elements.find(e => e.element_key === input.elementKey) : undefined;
        if (input.elementKey && !keyedTarget?.key_selector) throw new Error("ELEMENT_KEY_NOT_FOUND");
        const locator = input.elementKey
          ? page.locator(keyedTarget!.key_selector!)
          : page.locator(`${input.selector}:visible`);
        if (await locator.count() !== 1) throw new Error("SAFE_CLICK_TARGET_AMBIGUOUS");
        try {
          await locator.waitFor({ state: "visible", timeout: 5_000 });
        } catch {
          throw new Error("SAFE_CLICK_TARGET_NOT_FOUND");
        }
        if (!(await locator.isEnabled())) throw new Error("SAFE_CLICK_TARGET_DISABLED");
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
            localAction: element.getAttribute("data-qa-action") === "local",
            formAction: form?.getAttribute("action") ?? null,
          };
        });

        const forbiddenText =
          /(شراء|اطلب|تأكيد|دفع|checkout|place order|submit|delete|remove|حذف|ارسال|إرسال)/i;
        if (
          !info.localAction ||
          info.tag !== "button" ||
          info.insideForm ||
          info.type === "submit" ||
          forbiddenText.test(info.text) ||
          (info.href && new URL(info.href).origin !== targetOrigin)
        ) {
          throw new Error("SAFE_CLICK_FORBIDDEN");
        }

        const before = page.url();
        const blockedRequests: Array<{method:string;path:string}> = [];
        const errors: string[] = [];
        const network: Array<{status:number;path:string}> = [];
        // Installed before the action; fresh context has no customer session.
        await page.context().route("**/*", async route => {
          const req = route.request();
          const u = new URL(req.url());
          if (!["GET", "HEAD"].includes(req.method()) || u.origin !== targetOrigin) {
            if (blockedRequests.length < 100) blockedRequests.push({method:req.method(),path:u.pathname});
            await route.abort(); return;
          }
          await route.continue();
        });
        page.on("pageerror", () => { if(errors.length < 100) errors.push("PAGE_ERROR"); });
        page.on("console", msg => { if(msg.type() === "error" && errors.length < 100) errors.push("CONSOLE_ERROR"); });
        page.on("response", response => { if(response.status() >= 400 && network.length < 100) network.push({status:response.status(),path:new URL(response.url()).pathname}); });
        await locator.click({ timeout: 10_000 });
        await page.waitForLoadState("domcontentloaded", { timeout: 3_000 }).catch(() => undefined);
        await page.waitForTimeout(500);
        const after = page.url();
        if (new URL(after).origin !== targetOrigin) throw new Error("SAFE_CLICK_LEFT_STORE_ORIGIN");
        const afterState = await readQaState(page);
        return {
          before,
          after,
          target: info,
          navigationChanged: before !== after,
          elementsAfter: await readRenderedElements(page),
          title: await page.title(),
          before_state: beforeState,
          after_state: afterState,
          state_diff: diffQaState(beforeState, afterState),
          interaction_errors: errors, interaction_network: network, blocked_requests: blockedRequests,
          outcome: blockedRequests.length ? "BLOCKED" : "OBSERVED",
          observation_window_ms: 500,
          inspectionMode: "isolated-safe-click",
        };
      });
    },

    async screenshot(url, device) {
      const viewport = device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
      return browse(url, viewport, async (page) => {
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
