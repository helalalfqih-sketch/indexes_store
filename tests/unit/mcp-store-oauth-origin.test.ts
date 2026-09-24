import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveStoreOAuthOrigin, STORE_PRODUCTION_ORIGIN } from "@/lib/mcp/store-oauth-origin";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("OAuth deployment isolation", () => {
  it("keeps production and local defaults stable", () => {
    expect(resolveStoreOAuthOrigin("production", "another.vercel.app")).toBe(
      STORE_PRODUCTION_ORIGIN,
    );
    expect(resolveStoreOAuthOrigin()).toBe(STORE_PRODUCTION_ORIGIN);
  });
  it("uses the configured preview deployment only", () => {
    expect(resolveStoreOAuthOrigin("preview", "indexes-test.vercel.app")).toBe(
      "https://indexes-test.vercel.app",
    );
    for (const host of [
      undefined,
      "evil.test",
      "indexes.vercel.app.evil.test",
      "user@indexes.vercel.app",
      "indexes.vercel.app/path",
    ]) {
      expect(() => resolveStoreOAuthOrigin("preview", host)).toThrow(
        "STORE_MCP_OAUTH_NOT_CONFIGURED",
      );
    }
  });
  it("isolates preview registration from production even with the same configured secret", async () => {
    vi.stubEnv("STORE_MCP_OAUTH_SECRET", "isolated-test-secret-at-least-thirty-two-characters");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "indexes-test.vercel.app");
    vi.resetModules();
    const preview = await import("@/lib/mcp/store-oauth.server");
    const redirect = "https://chatgpt.com/connector/oauth/test";
    const client = preview.registerStoreClient([redirect]);
    expect(preview.storeOauthMetadata().authorization_endpoint).toBe(
      "https://indexes-test.vercel.app/api/mcp/store/oauth/authorize",
    );
    expect(() => preview.validateStoreClient(client, redirect)).not.toThrow();
    vi.stubEnv("VERCEL_ENV", "production");
    vi.resetModules();
    const production = await import("@/lib/mcp/store-oauth.server");
    expect(() => production.validateStoreClient(client, redirect)).toThrow();
  });
});
