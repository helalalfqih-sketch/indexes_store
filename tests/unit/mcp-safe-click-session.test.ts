import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const state = { url: "", destination: "", enabled: true };
  const locator = {
    first: () => locator,
    waitFor: vi.fn(async () => {}),
    isEnabled: async () => state.enabled,
    evaluate: async () => ({
      tag: "button",
      href: null,
      type: "button",
      text: "المفضلة",
      insideForm: false,
    }),
    click: vi.fn(async () => {
      if (state.destination) state.url = state.destination;
    }),
  };
  const page = {
    url: () => state.url,
    goto: async (url: string) => {
      state.url = url;
      return { status: () => 200 };
    },
    locator: vi.fn(() => locator),
    waitForLoadState: vi.fn(async (state: string) => {
      void state;
    }),
    waitForTimeout: async () => {},
    evaluate: async () => [{ tag: "button", text: "إغلاق", visible: true }],
    title: async () => "Store",
  };
  const context = { newPage: async () => page, close: async () => {} };
  const browser = { newContext: async () => context, close: async () => {} };
  return { state, locator, page, browser };
});
vi.mock("playwright-core", () => ({ chromium: { launch: async () => mocks.browser } }));
vi.mock("@sparticuz/chromium", () => ({
  default: { executablePath: async () => "/mock/chromium", args: [] },
}));
import { createStoreBrowserInspectionAdapter } from "../../src/lib/mcp/store-browser-inspection.server";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.destination = "";
  mocks.state.enabled = true;
});
const input = {
  url: "https://indexes-store-rosy.vercel.app/",
  selector: 'button[aria-label="المفضلة"]',
  device: "mobile" as const,
};

describe("safe click browser sessions", () => {
  it("waits for the visible mobile target and returns post-click evidence without networkidle", async () => {
    const result = await createStoreBrowserInspectionAdapter().safeClick(input);
    expect(mocks.page.locator).toHaveBeenCalledWith(`${input.selector}:visible`);
    expect(mocks.locator.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: 5000 });
    expect(result.elementsAfter).toEqual([{ tag: "button", text: "إغلاق", visible: true }]);
    expect(
      mocks.page.waitForLoadState.mock.calls.some((call) => String(call[0]) === "networkidle"),
    ).toBe(false);
  });
  it("does not click a disabled feature", async () => {
    mocks.state.enabled = false;
    await expect(createStoreBrowserInspectionAdapter().safeClick(input)).rejects.toThrow(
      "SAFE_CLICK_TARGET_DISABLED",
    );
    expect(mocks.locator.click).not.toHaveBeenCalled();
  });
  it("still rejects a transition to another otherwise allowed store origin", async () => {
    mocks.state.destination = "https://indexes-store.vercel.app/";
    await expect(createStoreBrowserInspectionAdapter().safeClick(input)).rejects.toThrow(
      "SAFE_CLICK_LEFT_STORE_ORIGIN",
    );
  });
});
