import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.resetModules();
});

function globalSettingsDb(response: { data: unknown[] | null; error: unknown }) {
  const is = vi.fn(async () => response);
  const select = vi.fn(() => ({ is }));
  const from = vi.fn(() => ({ select }));
  return { db: { from }, from };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("public storefront settings reads", () => {
  it("returns and caches an empty successful global read", async () => {
    const { fetchPublishedRows } = await import("@/lib/services/storefront.service");
    const { db, from } = globalSettingsDb({ data: [], error: null });

    await expect(fetchPublishedRows(db, null)).resolves.toEqual([]);
    await expect(fetchPublishedRows(db, null)).resolves.toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("returns null and does not cache a failed global read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { fetchPublishedRows } = await import("@/lib/services/storefront.service");
    const { db, from } = globalSettingsDb({
      data: null,
      error: { message: "unavailable" },
    });

    await expect(fetchPublishedRows(db, null)).resolves.toBeNull();
    await expect(fetchPublishedRows(db, null)).resolves.toBeNull();
    expect(from).toHaveBeenCalledTimes(2);
  });

  it("replaces a stale in-flight read while continuing to dedupe the replacement", async () => {
    vi.useFakeTimers();
    const { fetchPublishedRows, PUBLISHED_ROWS_IN_FLIGHT_STALE_MS } =
      await import("@/lib/services/storefront.service");
    const firstResponse = deferred<{ data: unknown[]; error: null }>();
    const replacementResponse = deferred<{ data: unknown[]; error: null }>();
    const responses = [firstResponse.promise, replacementResponse.promise];
    const from = vi.fn(() => {
      const response = responses.shift();
      if (!response) throw new Error("Unexpected extra settings query");
      return {
        select: () => ({ is: () => response }),
      };
    });
    const db = { from };

    const firstRead = fetchPublishedRows(db, null);
    const coalescedRead = fetchPublishedRows(db, null);
    expect(from).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(PUBLISHED_ROWS_IN_FLIGHT_STALE_MS);
    const replacementRead = fetchPublishedRows(db, null);
    expect(from).toHaveBeenCalledTimes(2);

    firstResponse.resolve({ data: [], error: null });
    await expect(firstRead).resolves.toEqual([]);
    await expect(coalescedRead).resolves.toEqual([]);

    const replacementFollower = fetchPublishedRows(db, null);
    expect(from).toHaveBeenCalledTimes(2);

    const replacementRows = [{ key: "theme", value: { primaryColor: "#123456" } }];
    replacementResponse.resolve({ data: replacementRows, error: null });
    await expect(replacementRead).resolves.toEqual(replacementRows);
    await expect(replacementFollower).resolves.toEqual(replacementRows);
  });
});
