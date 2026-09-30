import { describe, expect, it } from "vitest";
import { resolveAuthRedirectUrl } from "../../src/lib/auth/oauth-redirect";

describe("resolveAuthRedirectUrl", () => {
  it("keeps the production origin on Production", () => {
    expect(
      resolveAuthRedirectUrl({
        currentOrigin: "https://indexes-store.vercel.app",
        baseUrl: "/",
      }),
    ).toBe("https://indexes-store.vercel.app/auth");
  });

  it("maps Vercel preview deployments to the canonical production callback", () => {
    expect(
      resolveAuthRedirectUrl({
        currentOrigin: "https://indexes-store-ofqghlkvm-helalalfqih-2473s-projects.vercel.app",
        baseUrl: "/",
      }),
    ).toBe("https://indexes-store.vercel.app/auth");
  });

  it("uses an explicit custom production origin for preview deployments", () => {
    expect(
      resolveAuthRedirectUrl({
        currentOrigin: "https://indexes-store-random-preview.vercel.app",
        productionOrigin: "https://indexes.store",
      }),
    ).toBe("https://indexes.store/auth");
  });

  it("ignores an accidental preview URL configured as the production origin", () => {
    expect(
      resolveAuthRedirectUrl({
        currentOrigin: "https://indexes-store-random-preview.vercel.app",
        productionOrigin: "https://indexes-store-other-preview.vercel.app",
      }),
    ).toBe("https://indexes-store.vercel.app/auth");
  });

  it("preserves localhost during local development", () => {
    expect(
      resolveAuthRedirectUrl({
        currentOrigin: "http://localhost:3000",
      }),
    ).toBe("http://localhost:3000/auth");
  });

  it("rejects non-HTTPS canonical production origins", () => {
    expect(() =>
      resolveAuthRedirectUrl({
        currentOrigin: "https://indexes-store-random-preview.vercel.app",
        productionOrigin: "http://indexes.store",
      }),
    ).toThrow("OAUTH_PRODUCTION_ORIGIN_MUST_BE_HTTPS");
  });

  it("does not allow a protocol-relative base path to alter the origin", () => {
    expect(
      resolveAuthRedirectUrl({
        currentOrigin: "https://indexes-store.vercel.app",
        baseUrl: "//evil.example",
      }),
    ).toBe("https://indexes-store.vercel.app/auth");
  });
});
