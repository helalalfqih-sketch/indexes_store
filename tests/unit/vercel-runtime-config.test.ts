import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type VercelConfig = {
  framework?: string;
  cleanUrls?: boolean;
  outputDirectory?: string;
  builds?: unknown[];
  rewrites?: Array<{ source?: string; destination?: string }>;
  redirects?: Array<{
    source?: string;
    destination?: string;
    permanent?: boolean;
  }>;
};

const config = JSON.parse(
  readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"),
) as VercelConfig;

type Redirect = NonNullable<VercelConfig["redirects"]>[number];

function compileRedirectSource(source: string) {
  if (source === "/") return /^\/$/;
  const namedPattern = /^\/:path\((.*)\)$/.exec(source);
  if (!namedPattern) throw new Error(`Unsupported redirect source in test: ${source}`);
  return new RegExp(`^/(${namedPattern[1]})$`);
}

function matchingRedirect(pathname: string): Redirect | undefined {
  return config.redirects?.find((redirect) => {
    if (!redirect.source) return false;
    return compileRedirectSource(redirect.source).test(pathname);
  });
}

describe("Vercel TanStack Start runtime contract", () => {
  it("uses the native TanStack Start framework adapter", () => {
    expect(config.framework).toBe("tanstack-start");
    expect(config.cleanUrls).toBe(true);
  });

  it("does not force static Vite output or a catch-all SPA rewrite", () => {
    expect(config.outputDirectory).toBeUndefined();
    expect(config.builds).toBeUndefined();
    expect(config.rewrites ?? []).not.toContainEqual({
      source: "/(.*)",
      destination: "/index.html",
    });
  });

  it("keeps public-page SEO redirects on the Shopify storefront", () => {
    for (const pathname of [
      "/",
      "/product/example",
      "/pages/faq",
      "/apiary",
      "/.well-knownness",
      "/authentication",
      "/mcp-authorized",
    ]) {
      const redirect = matchingRedirect(pathname);
      expect(redirect, `missing public redirect for ${pathname}`).toBeDefined();
      expect(redirect?.destination).toMatch(/^https:\/\/indexesstore\.com\//);
      expect(redirect?.permanent).toBe(true);
    }

    expect(
      config.redirects?.every(
        ({ destination }) =>
          typeof destination === "string" &&
          new URL(destination.replace(":path*", "test")).origin === "https://indexesstore.com",
      ),
    ).toBe(true);
  });

  it("keeps MCP, OAuth, discovery, auth and runtime dependencies on the service host", () => {
    for (const pathname of [
      "/api/mcp/whatsapp",
      "/api/mcp/oauth/authorize",
      "/api/mcp/oauth/token",
      "/api/mcp/oauth/register",
      "/api/mcp/oauth/approve",
      "/.well-known/oauth-authorization-server",
      "/.well-known/oauth-protected-resource/api/mcp/whatsapp",
      "/mcp-authorize",
      "/mcp-store-authorize",
      "/auth",
      "/auth/callback",
      "/assets/mcp-authorize.js",
      "/_build/mcp-authorize.js",
      "/_serverFn/root-loader",
      "/~oauth/initiate",
    ]) {
      expect(matchingRedirect(pathname), `unexpected redirect for ${pathname}`).toBeUndefined();
    }
  });

  it("never matches body-bearing service endpoints with a method-agnostic redirect", () => {
    // Vercel redirects do not filter by HTTP method. Keeping each path outside
    // every redirect rule is what prevents a 308 from replaying a POST body.
    expect(config.redirects?.some((redirect) => "methods" in redirect)).toBe(false);
    for (const pathname of [
      "/api/mcp/whatsapp",
      "/api/mcp/oauth/token",
      "/api/mcp/oauth/register",
      "/api/mcp/oauth/approve",
      "/_serverFn/redirect-sentinel",
    ]) {
      expect(
        matchingRedirect(pathname),
        `unexpected POST redirect for ${pathname}`,
      ).toBeUndefined();
    }
  });
});
