import { describe, expect, it } from "vitest";

import { resolveCanonicalBaseUrl } from "@/lib/site-url";

describe("resolveCanonicalBaseUrl", () => {
  it("falls back to the live Vercel origin when no canonical is configured", () => {
    expect(resolveCanonicalBaseUrl()).toBe("https://indexes-store.vercel.app");
  });

  it.each([
    "https://indexes.store",
    "https://www.indexes.store/",
    "https://indexes-store.com",
    "https://www.indexes-store.com/",
  ])("rejects the unowned domain %s", (candidate) => {
    expect(resolveCanonicalBaseUrl(candidate)).toBe("https://indexes-store.vercel.app");
  });

  it("keeps a valid owned custom origin when configured later", () => {
    expect(resolveCanonicalBaseUrl("https://shop.example.com/path/")).toBe(
      "https://shop.example.com",
    );
  });

  it("skips malformed values", () => {
    expect(resolveCanonicalBaseUrl("not a URL", "https://indexes-store.vercel.app/")).toBe(
      "https://indexes-store.vercel.app",
    );
  });
});
