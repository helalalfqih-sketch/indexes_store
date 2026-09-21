import { describe, expect, it } from "vitest";
import { createStoreBrowserInspectionAdapter } from "@/lib/mcp/store-browser-inspection.server";

describe("store browser inspection adapter", () => {
  it("blocks browser navigation outside the Store origin before launching Chromium", async () => {
    const adapter = createStoreBrowserInspectionAdapter();
    await expect(adapter.inspectRenderedPage("https://example.com/", "desktop")).rejects.toThrow(
      "BROWSER_URL_FORBIDDEN",
    );
  });
});
