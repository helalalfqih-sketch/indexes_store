// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMetaProductPayload,
  metaCatalogVariantId,
  sanitizeAnalyticsPayload,
  trackEvent,
} from "@/lib/analytics";
import { useCart } from "@/lib/cart-store";

// Identifier fixtures from the audited Shopify CSV; never send these tests to Meta.
const VARIANT = "46287758884949";
const PRODUCT = "8504684019797";
const VARIANT_GID = `gid://shopify/ProductVariant/${VARIANT}`;
const fbq = vi.fn();
const gtag = vi.fn();
const browser = window as Window & {
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
};

const product = {
  id: `gid://shopify/Product/${PRODUCT}`,
  slug: "catalog-event-fixture",
  name: "Catalog fixture",
  description: "Test-only product",
  price: 11900,
  stock: 1000,
  image: "https://example.invalid/product.jpg",
  rating: 0,
  reviews: 0,
  categoryId: "test",
  shopifyVariantId: VARIANT_GID,
};

beforeEach(() => {
  fbq.mockReset();
  gtag.mockReset();
  browser.fbq = fbq;
  browser.gtag = gtag;
  useCart.getState().clear();
  localStorage.clear();
});

afterEach(() => {
  delete browser.fbq;
  delete browser.gtag;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Meta catalog variant identity", () => {
  it.each([VARIANT, VARIANT_GID, ` ${VARIANT_GID} `])("normalizes %s", (input) => {
    expect(metaCatalogVariantId(input)).toBe(VARIANT);
  });

  it("preserves string IDs beyond JavaScript's safe integer range", () => {
    expect(metaCatalogVariantId("18446744073709551615")).toBe("18446744073709551615");
  });

  it.each([
    undefined,
    null,
    "",
    46287758884949,
    9007199254740992,
    "0",
    "00123",
    "-12",
    "1.5",
    "1e13",
    "9".repeat(21),
    `gid://shopify/Product/${PRODUCT}`,
    `gid://shopify/Customer/${VARIANT}`,
    `${VARIANT_GID}?email=private@example.invalid`,
    `shopify_YE_${PRODUCT}_${VARIANT}`,
    "11111111-1111-4111-8111-111111111111",
    [VARIANT],
    { id: VARIANT },
  ])("rejects unsupported identity %j", (input) => {
    expect(metaCatalogVariantId(input)).toBeUndefined();
  });
});

describe("Meta-specific product allowlist", () => {
  it("builds a matching ViewContent payload", () => {
    expect(buildMetaProductPayload({ shopifyVariantId: VARIANT_GID, price: 11900 })).toEqual({
      content_ids: [VARIANT],
      content_type: "product",
      contents: [{ id: VARIANT, quantity: 1 }],
      value: 11900,
      currency: "YER",
    });
  });

  it("calculates the line value for the quantity added", () => {
    expect(buildMetaProductPayload({ shopifyVariantId: VARIANT, price: 11900, qty: 2 })).toEqual({
      content_ids: [VARIANT],
      content_type: "product",
      contents: [{ id: VARIANT, quantity: 2 }],
      value: 23800,
      currency: "YER",
    });
  });

  it("supports a validated explicit value and quantity alias", () => {
    expect(
      buildMetaProductPayload({ shopifyVariantId: VARIANT, value: 500, quantity: 2 }),
    ).toMatchObject({ value: 500, contents: [{ id: VARIANT, quantity: 2 }] });
  });

  it.each([0, -1, 1.5, 1000, Number.NaN, Number.POSITIVE_INFINITY, "2"])(
    "does not fabricate a quantity or price-derived value for invalid qty %j",
    (qty) => {
      const result = buildMetaProductPayload({ shopifyVariantId: VARIANT, price: 11900, qty });
      expect(result.contents).toBeUndefined();
      expect(result.value).toBeUndefined();
    },
  );

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, "11900"])(
    "rejects invalid prices %j",
    (price) => {
      const result = buildMetaProductPayload({ shopifyVariantId: VARIANT, price });
      expect(result.value).toBeUndefined();
      expect(result.currency).toBeUndefined();
    },
  );

  it("omits overflowed values without losing a valid variant", () => {
    const result = buildMetaProductPayload({ shopifyVariantId: VARIANT, price: 1e308, qty: 999 });
    expect(result.content_ids).toEqual([VARIANT]);
    expect(result.value).toBeUndefined();
  });

  it("never falls back to an internal product ID or caller-supplied content_ids", () => {
    expect(
      buildMetaProductPayload({
        productId: PRODUCT,
        content_ids: [VARIANT],
        contents: [{ id: VARIANT, quantity: 1 }],
        content_type: "product_group",
      }),
    ).toEqual({});
  });

  it("ignores arbitrary customer data and cannot be overridden by injected Meta fields", () => {
    const result = buildMetaProductPayload({
      shopifyVariantId: VARIANT_GID,
      price: 11900,
      email: "private@example.invalid",
      phone: "private-phone",
      name: "Private customer",
      address: "Private address",
      productId: "private-order-note",
      access_token: "not-a-real-token",
      content_ids: ["wrong-id"],
      content_type: "product_group",
      contents: [{ id: "wrong-id", email: "private@example.invalid" }],
      currency: "USD",
    });
    expect(Object.keys(result).sort()).toEqual([
      "content_ids",
      "content_type",
      "contents",
      "currency",
      "value",
    ]);
    expect(result.content_ids).toEqual([VARIANT]);
    expect(result.contents).toEqual([{ id: VARIANT, quantity: 1 }]);
    expect(result.content_type).toBe("product");
    expect(result.currency).toBe("YER");
  });

  it("does not broaden the original general analytics sanitizer", () => {
    expect(
      sanitizeAnalyticsPayload({
        productId: PRODUCT,
        price: 11900,
        shopifyVariantId: VARIANT_GID,
        content_ids: [VARIANT],
        email: "private@example.invalid",
      }),
    ).toEqual({ productId: PRODUCT, price: 11900, currency: "YER" });
  });
});

describe("Event dispatch uses the separate Meta payload", () => {
  it.each([
    ["view_product", "ViewContent", "view_item"],
    ["add_to_cart", "AddToCart", "add_to_cart"],
  ] as const)("dispatches %s without losing catalog fields", (event, metaName, googleName) => {
    trackEvent(event, { productId: PRODUCT, shopifyVariantId: VARIANT_GID, price: 11900 });
    expect(fbq).toHaveBeenCalledExactlyOnceWith("track", metaName, {
      content_ids: [VARIANT],
      content_type: "product",
      contents: [{ id: VARIANT, quantity: 1 }],
      value: 11900,
      currency: "YER",
    });
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", googleName, {
      productId: PRODUCT,
      price: 11900,
      currency: "YER",
    });
  });

  it("keeps unmapped products as behavioral events without an invented ID", () => {
    trackEvent("view_product", { productId: PRODUCT, price: 11900 });
    expect(fbq).toHaveBeenCalledWith("track", "ViewContent", { value: 11900, currency: "YER" });
  });

  it("does not label a WhatsApp click or order_created as Purchase", () => {
    trackEvent("click_whatsapp", { productId: PRODUCT, email: "private@example.invalid" });
    trackEvent("order_created", { orderId: "meta-catalog-test-order", value: 11900 });
    expect(fbq.mock.calls.every((call) => call[0] === "trackCustom")).toBe(true);
    expect(fbq.mock.calls.some((call) => call[1] === "Purchase")).toBe(false);
  });

  it("does not require a browser or an installed Meta SDK", () => {
    delete browser.fbq;
    expect(() => trackEvent("view_product", { shopifyVariantId: VARIANT })).not.toThrow();
    vi.stubGlobal("window", undefined);
    expect(() => trackEvent("view_product", { shopifyVariantId: VARIANT })).not.toThrow();
    expect(fbq).not.toHaveBeenCalled();
  });

  it("contains SDK failures instead of breaking the storefront", () => {
    fbq.mockImplementation(() => {
      throw new Error("test SDK failure");
    });
    expect(() => trackEvent("view_product", { shopifyVariantId: VARIANT })).not.toThrow();
  });
});

describe("Real cart-store integration", () => {
  it("passes the catalog variant and records an actual two-unit addition", () => {
    useCart.getState().add(product, 2);
    expect(useCart.getState().items[0]).toMatchObject({ qty: 2, variantId: VARIANT_GID });
    expect(fbq).toHaveBeenCalledExactlyOnceWith("track", "AddToCart", {
      content_ids: [VARIANT],
      content_type: "product",
      contents: [{ id: VARIANT, quantity: 2 }],
      value: 23800,
      currency: "YER",
    });
  });

  it("reports only accepted units when the existing cart limit is reached", () => {
    useCart.getState().add(product, 998);
    fbq.mockClear();
    useCart.getState().add(product, 5);
    expect(useCart.getState().items[0].qty).toBe(999);
    expect(fbq).toHaveBeenCalledExactlyOnceWith(
      "track",
      "AddToCart",
      expect.objectContaining({ contents: [{ id: VARIANT, quantity: 1 }], value: 11900 }),
    );
    fbq.mockClear();
    useCart.getState().add(product, 1);
    expect(fbq).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, 1000])("does not track rejected cart qty %s", (qty) => {
    useCart.getState().add(product, qty);
    expect(useCart.getState().items).toHaveLength(0);
    expect(fbq).not.toHaveBeenCalled();
  });

  it("does not track an unpublished product", () => {
    useCart.getState().add({ ...product, is_published: false });
    expect(useCart.getState().items).toHaveLength(0);
    expect(fbq).not.toHaveBeenCalled();
  });

  it("does not fabricate variant IDs for unmapped cart products", () => {
    useCart.getState().add({ ...product, shopifyVariantId: undefined });
    expect(fbq).toHaveBeenCalledWith("track", "AddToCart", { value: 11900, currency: "YER" });
  });

  it("uses the persisted line variant and price when updating that line", () => {
    useCart.getState().add(product);
    fbq.mockClear();
    useCart.getState().add({ ...product, price: 1, shopifyVariantId: undefined });
    expect(fbq).toHaveBeenCalledWith(
      "track",
      "AddToCart",
      expect.objectContaining({ content_ids: [VARIANT], value: 11900 }),
    );
  });
});

it("the product view call site forwards the explicit variant and observes variant changes", () => {
  const source = readFileSync(resolve(process.cwd(), "src/routes/product.$slug.tsx"), "utf8");
  expect(source).toMatch(
    /trackEvent\("view_product",\s*\{[^}]*shopifyVariantId:\s*product\.shopifyVariantId/s,
  );
  expect(source).toContain("[product?.id, product?.shopifyVariantId]");
});
