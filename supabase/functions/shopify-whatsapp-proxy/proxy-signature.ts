/**
 * Verify Shopify's signed App Proxy query before accepting a customer order.
 * https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies
 * No credentials are stored here. The shared secret must come from staging env.
 */
export function canonicalProxyParams(params: URLSearchParams): string {
  const groups = new Map<string, string[]>();
  for (const [key, value] of params) {
    if (key === "signature") continue;
    const values = groups.get(key) ?? [];
    values.push(value);
    groups.set(key, values);
  }
  return [...groups].map(([key, values]) => `${key}=${values.join(",")}`).sort().join("");
}

export async function verifyProxySignature(
  url: URL,
  sharedSecret: string,
  expectedShop: string,
  nowMs = Date.now(),
): Promise<boolean> {
  const params = url.searchParams;
  const signatures = params.getAll("signature");
  const shops = params.getAll("shop");
  const times = params.getAll("timestamp");
  const paths = params.getAll("path_prefix");
  if (
    sharedSecret.length < 12 ||
    signatures.length !== 1 ||
    !/^[a-f0-9]{64}$/i.test(signatures[0]) ||
    shops.length !== 1 ||
    shops[0] !== expectedShop ||
    times.length !== 1 ||
    !/^\d{10}$/.test(times[0]) ||
    paths.length !== 1 ||
    paths[0] !== "/apps/indexes-orders" ||
    Math.abs(nowMs / 1000 - Number(times[0])) > 300
  ) {
    return false;
  }
  const bytes = Uint8Array.from(signatures[0].match(/.{2}/g) ?? [], (hex) =>
    Number.parseInt(hex, 16),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sharedSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    bytes as BufferSource,
    new TextEncoder().encode(canonicalProxyParams(params)),
  );
}
