import { describe, expect, it } from "vitest";
import {
  canonicalProxyParams,
  verifyProxySignature,
} from "../../supabase/functions/shopify-whatsapp-proxy/proxy-signature";

const secret = "preview-only-test-secret-not-a-real-credential";
const shop = "ubhd8d-iz.myshopify.com";
const timestamp = 1791800000;

async function signedUrl(overrides: Record<string, string> = {}) {
  const url = new URL("https://staging.example/functions/v1/shopify-whatsapp-proxy");
  const values: Record<string, string> = {
    shop,
    timestamp: String(timestamp),
    path_prefix: "/apps/indexes-orders",
    logged_in_customer_id: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    url.searchParams.append(key, value);
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(canonicalProxyParams(url.searchParams)),
    ),
  );
  const signature = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  url.searchParams.set("signature", signature);
  return url;
}

describe("Shopify Native App Proxy signed request boundary", () => {
  it("accepts only a fresh signed Shopify App Proxy call", async () => {
    const url = await signedUrl();
    expect(await verifyProxySignature(url, secret, shop, timestamp * 1000)).toBe(true);
  });

  it("rejects a tampered query or a different Shopify store", async () => {
    const url = await signedUrl();
    url.searchParams.set("logged_in_customer_id", "1234");
    expect(await verifyProxySignature(url, secret, shop, timestamp * 1000)).toBe(false);
    const valid = await signedUrl();
    expect(await verifyProxySignature(valid, secret, "other.myshopify.com", timestamp * 1000))
      .toBe(false);
  });

  it("rejects expired and future-dated signed requests", async () => {
    const url = await signedUrl();
    expect(await verifyProxySignature(url, secret, shop, (timestamp + 301) * 1000)).toBe(false);
    expect(await verifyProxySignature(url, secret, shop, (timestamp - 301) * 1000)).toBe(false);
  });

  it("rejects invalid signatures and duplicate signature parameters", async () => {
    const url = await signedUrl();
    url.searchParams.set("signature", "a".repeat(64));
    expect(await verifyProxySignature(url, secret, shop, timestamp * 1000)).toBe(false);
    const duplicate = await signedUrl();
    duplicate.searchParams.append("signature", "b".repeat(64));
    expect(await verifyProxySignature(duplicate, secret, shop, timestamp * 1000)).toBe(false);
  });

  it("rejects unsafe proxy paths and an unavailable shared secret", async () => {
    const url = await signedUrl({ path_prefix: "/apps/other-app" });
    expect(await verifyProxySignature(url, secret, shop, timestamp * 1000)).toBe(false);
    expect(await verifyProxySignature(await signedUrl(), "", shop, timestamp * 1000))
      .toBe(false);
  });

  it("canonicalizes repeated query values as specified by Shopify", () => {
    const params = new URLSearchParams(
      "extra=1&extra=2&shop=example.myshopify.com&logged_in_customer_id=&path_prefix=%2Fapps%2Findexes-orders&timestamp=1791800000&signature=ignored",
    );
    expect(canonicalProxyParams(params)).toBe(
      "extra=1,2logged_in_customer_id=path_prefix=/apps/indexes-ordersshop=example.myshopify.comtimestamp=1791800000",
    );
  });
});
