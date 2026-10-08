import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveTenantId: vi.fn(),
  fetchPublishedRows: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      validator: () => builder,
      handler: (handler: (...args: never[]) => unknown) => handler,
    };
    return builder;
  },
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => ({ headers: new Headers({ host: "indexes-store.vercel.app" }) }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/saas/tenant-context", () => ({
  parseTenantSubdomainSlug: () => null,
  resolveTenantId: mocks.resolveTenantId,
}));
vi.mock("@/lib/saas/tenant-resolver", () => ({ resolveCurrentTenant: vi.fn() }));
vi.mock("@/lib/services/storefront.service", () => ({
  fetchPublishedRows: mocks.fetchPublishedRows,
}));

import {
  getPublishedStorefrontAppearance,
  getPublishedStorefrontAppearanceResult,
} from "@/lib/actions/appearance.actions";

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.resolveTenantId.mockImplementation(() => new Promise<string>(() => {}));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("published appearance deadline", () => {
  it("treats a successful empty settings read as healthy defaults", async () => {
    mocks.resolveTenantId.mockResolvedValue("00000000-0000-0000-0000-000000000001");
    mocks.fetchPublishedRows.mockResolvedValue([]);

    await expect(getPublishedStorefrontAppearanceResult()).resolves.toMatchObject({
      degraded: false,
      retryAfterMs: null,
      settings: expect.objectContaining({ theme: expect.any(Object) }),
    });
  });

  it("keeps a failed settings read degraded", async () => {
    mocks.resolveTenantId.mockResolvedValue("00000000-0000-0000-0000-000000000001");
    mocks.fetchPublishedRows.mockResolvedValue(null);

    await expect(getPublishedStorefrontAppearanceResult()).resolves.toMatchObject({
      degraded: true,
      retryAfterMs: 5_000,
      settings: expect.objectContaining({ theme: expect.any(Object) }),
    });
  });

  it("marks a stalled SSR read degraded and short-circuits the next read", async () => {
    const first = getPublishedStorefrontAppearanceResult();
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(6_000);

    await expect(first).resolves.toMatchObject({
      degraded: true,
      retryAfterMs: 30_000,
      settings: expect.objectContaining({ theme: expect.any(Object) }),
    });
    expect(mocks.resolveTenantId).toHaveBeenCalledTimes(1);
    expect(mocks.fetchPublishedRows).not.toHaveBeenCalled();

    await expect(getPublishedStorefrontAppearanceResult()).resolves.toMatchObject({
      degraded: true,
      settings: expect.objectContaining({ theme: expect.any(Object) }),
    });
    expect(mocks.resolveTenantId).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);

    await expect(getPublishedStorefrontAppearance()).resolves.toEqual(
      expect.objectContaining({ theme: expect.any(Object) }),
    );
    expect(mocks.resolveTenantId).toHaveBeenCalledTimes(1);
  });
});
