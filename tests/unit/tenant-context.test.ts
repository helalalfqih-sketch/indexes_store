import { describe, expect, it, vi } from "vitest";
import { parseTenantSubdomainSlug, resolveTenantId } from "@/lib/saas/tenant-context";

describe("tenant hostname resolution", () => {
  it.each([
    "indexes-store.vercel.app",
    "indexes-store-git-main-team.vercel.app",
    "indexes-store.lovable.app",
    "indexes-store.lovableproject.com",
    "indexes-store.pages.dev",
    "indexes-store.netlify.app",
    "indexes-store.helalalfqih.workers.dev",
  ])("does not mistake a deployment-provider hostname for a tenant: %s", (host) => {
    expect(parseTenantSubdomainSlug(host)).toBeNull();
  });

  it.each(["127.0.0.1", "127.0.0.1:4173", "192.168.1.20:3000"])(
    "does not mistake an IPv4 host for a tenant: %s",
    (host) => {
      expect(parseTenantSubdomainSlug(host)).toBeNull();
    },
  );

  it("still resolves a tenant from a custom storefront subdomain", () => {
    expect(parseTenantSubdomainSlug("fashion.indexes-store.com")).toBe("fashion");
    expect(parseTenantSubdomainSlug("FASHION.indexes-store.com:443")).toBe("fashion");
  });

  it("does not fall through to the default tenant when a custom-host lookup fails", async () => {
    const lookupError = new Error("tenant lookup unavailable");
    const maybeSingle = async () => ({ data: null, error: lookupError });
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle,
    };
    const from = vi.fn(() => query);
    const db = { from };

    await expect(
      resolveTenantId(db as never, {
        headers: new Headers({ host: "fashion.indexes-store.com" }),
      }),
    ).rejects.toBe(lookupError);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("does not serve the default tenant for an unknown custom hostname", async () => {
    const maybeSingle = async () => ({ data: null, error: null });
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle,
    };
    const from = vi.fn(() => query);

    await expect(
      resolveTenantId({ from } as never, {
        headers: new Headers({ host: "missing.indexes-store.com" }),
      }),
    ).rejects.toThrow("Requested tenant was not found.");
    expect(from).toHaveBeenCalledTimes(1);
  });
});
