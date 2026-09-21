/* eslint-disable prettier/prettier */
import { describe, expect, it } from "vitest";
import { createStoreBrowserInspectionAdapter } from "@/lib/mcp/store-browser-inspection.server";

describe("store browser inspection adapter", () => {
  it("blocks browser navigation outside the Store origin before launching Chromium", async () => {
    const adapter = createStoreBrowserInspectionAdapter();
    await expect(adapter.inspectRenderedPage("https://example.com/", "desktop")).rejects.toThrow(
      "BROWSER_URL_FORBIDDEN",
    );
  });
  it("blocks arbitrary hosts while allowing indexes-store Vercel previews", async () => {
    const adapter = createStoreBrowserInspectionAdapter();
    await expect(
      adapter.comparePages({
        productionUrl: "https://indexes-store.vercel.app/",
        previewUrl: "https://example.vercel.app/",
        device: "desktop",
      }),
    ).rejects.toThrow("BROWSER_URL_FORBIDDEN");
  });

  it("blocks safe-click inspection outside the Store origin before launching Chromium", async () => {
    const adapter = createStoreBrowserInspectionAdapter();
    await expect(
      adapter.safeClick({
        url: "https://example.com/",
        selector: "a",
        device: "desktop",
      }),
    ).rejects.toThrow("BROWSER_URL_FORBIDDEN");
  });

});
