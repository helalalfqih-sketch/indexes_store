const VERCEL_PRODUCTION_ORIGIN = "https://indexes-store.vercel.app";

const UNOWNED_CANONICAL_HOSTS = new Set([
  "indexes.store",
  "www.indexes.store",
  "indexes-store.com",
  "www.indexes-store.com",
]);

export function resolveCanonicalBaseUrl(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;

    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) continue;
      if (UNOWNED_CANONICAL_HOSTS.has(url.hostname.toLowerCase())) continue;

      return url.origin;
    } catch {
      // Ignore malformed CMS/environment values and continue to the safe fallback.
    }
  }

  return VERCEL_PRODUCTION_ORIGIN;
}
