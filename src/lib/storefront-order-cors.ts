const ALLOWED_STOREFRONT_ORIGINS = new Set([
  "https://ubhd8d-iz.myshopify.com",
  "https://indexes-store.vercel.app",
]);

export function storefrontOrderCorsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "cache-control": "no-store",
    vary: "Origin",
  };

  if (origin && ALLOWED_STOREFRONT_ORIGINS.has(origin)) {
    headers["access-control-allow-origin"] = origin;
  }

  return headers;
}

export function isAllowedStorefrontOrderOrigin(origin: string | null): boolean {
  // Same-origin/server-to-server requests may omit Origin.
  return origin === null || ALLOWED_STOREFRONT_ORIGINS.has(origin);
}
