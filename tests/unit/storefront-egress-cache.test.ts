import { describe, expect, it, vi } from "vitest";
import { fetchPublishedRows } from "@/lib/services/storefront.service";
import { STOREFRONT_SETTINGS_CACHE_TTL_MS } from "@/lib/storefront-cache-policy";

function resolvedQuery<T>(result: T) {
  const query = {
    or: vi.fn(() => query),
    is: vi.fn(() => query),
    then: (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return query;
}

describe("storefront settings egress cache", () => {
  it("reuses published rows for repeated reads of the same tenant", async () => {
    const rows = [
      { key: "navigation", value: { storeName: "Indexes" }, tenant_id: null },
      {
        key: "navigation",
        value: { storeName: "Indexes Yemen" },
        tenant_id: "00000000-0000-4000-8000-000000000111",
      },
    ];
    const query = resolvedQuery({ data: rows, error: null });
    const select = vi.fn(() => query);
    const from = vi.fn(() => ({ select }));
    const db = { from };

    const first = await fetchPublishedRows(db, "00000000-0000-4000-8000-000000000111");
    const second = await fetchPublishedRows(db, "00000000-0000-4000-8000-000000000111");

    expect(first).toEqual([{ key: "navigation", value: { storeName: "Indexes Yemen" } }]);
    expect(second).toBe(first);
    expect(from).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith("key, value, tenant_id");
    expect(query.or).toHaveBeenCalledTimes(1);
  });

  it("revalidates after the bounded cache TTL", async () => {
    const tenantId = "00000000-0000-4000-8000-000000000222";
    let currentTime = 1_000;
    const now = vi.spyOn(Date, "now").mockImplementation(() => currentTime);
    const firstQuery = resolvedQuery({
      data: [{ key: "navigation", value: { storeName: "Before" }, tenant_id: tenantId }],
      error: null,
    });
    const secondQuery = resolvedQuery({
      data: [{ key: "navigation", value: { storeName: "After" }, tenant_id: tenantId }],
      error: null,
    });
    const select = vi.fn().mockReturnValueOnce(firstQuery).mockReturnValueOnce(secondQuery);
    const from = vi.fn(() => ({ select }));
    const db = { from };

    const cached = await fetchPublishedRows(db, tenantId);
    currentTime += STOREFRONT_SETTINGS_CACHE_TTL_MS + 1;
    const fresh = await fetchPublishedRows(db, tenantId);

    expect(cached).toEqual([{ key: "navigation", value: { storeName: "Before" } }]);
    expect(fresh).toEqual([{ key: "navigation", value: { storeName: "After" } }]);
    expect(from).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });

  it("keeps platform settings scoped to rows without a tenant", async () => {
    const query = resolvedQuery({
      data: [{ key: "navigation", value: { storeName: "Indexes" } }],
      error: null,
    });
    const select = vi.fn(() => query);
    const from = vi.fn(() => ({ select }));

    const rows = await fetchPublishedRows({ from }, null);

    expect(rows).toEqual([{ key: "navigation", value: { storeName: "Indexes" } }]);
    expect(query.is).toHaveBeenCalledWith("tenant_id", null);
    expect(query.or).not.toHaveBeenCalled();
  });

  it("coalesces concurrent cache misses for the same tenant", async () => {
    const tenantId = "00000000-0000-4000-8000-000000000333";
    const query = resolvedQuery({
      data: [{ key: "navigation", value: { storeName: "Indexes" }, tenant_id: tenantId }],
      error: null,
    });
    const select = vi.fn(() => query);
    const from = vi.fn(() => ({ select }));
    const db = { from };

    const first = fetchPublishedRows(db, tenantId);
    const second = fetchPublishedRows(db, tenantId);
    const [firstRows, secondRows] = await Promise.all([first, second]);

    expect(firstRows).toBe(secondRows);
    expect(from).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledTimes(1);
  });
});
