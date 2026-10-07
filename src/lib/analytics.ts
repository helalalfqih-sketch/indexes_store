/** Store Analytics Event Tracking Helper */

export type AnalyticsEvent =
  | "click_search"
  | "click_whatsapp"
  | "click_install_app"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "order_created"
  | "view_product";

type AnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};
const sentOrders = new Set<string>();
export function sanitizeAnalyticsPayload(payload: Record<string, unknown> = {}) {
  const result: Record<string, string | number> = {};
  for (const key of ["productId", "orderId", "section_source", "event_id"]) {
    const value = payload[key];
    if (typeof value === "string" && /^[\w:/.-]{1,180}$/.test(value)) result[key] = value;
  }
  for (const key of ["value", "price", "qty", "quantity", "queryLength"]) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) result[key] = value;
  }
  if ("value" in result || "price" in result) result.currency = "YER";
  return result;
}

/** Match the numeric ProductVariant IDs exported by the Shopify CSV feed. */
export function metaCatalogVariantId(value: unknown): string | undefined {
  // Keep IDs as strings; converting Shopify IDs to numbers can lose precision.
  if (typeof value !== "string") return undefined;
  const match = /^(?:gid:\/\/shopify\/ProductVariant\/)?([1-9]\d{0,19})$/.exec(value.trim());
  return match?.[1];
}

type MetaProductPayload = {
  content_ids?: string[];
  content_type?: "product";
  contents?: Array<{ id: string; quantity: number }>;
  value?: number;
  currency?: "YER";
};

/** Build Meta product parameters separately from the general analytics allowlist. */
export function buildMetaProductPayload(
  payload: Record<string, unknown> = {},
): MetaProductPayload {
  const result: MetaProductPayload = {};
  const id = metaCatalogVariantId(payload.shopifyVariantId);
  const requestedQuantity = payload.qty ?? payload.quantity ?? 1;
  const quantity =
    typeof requestedQuantity === "number" &&
    Number.isInteger(requestedQuantity) &&
    requestedQuantity >= 1 &&
    requestedQuantity <= 999
      ? requestedQuantity
      : undefined;

  // Never guess a catalog item from an internal product ID, SKU, or caller-supplied
  // content_ids. Unmapped products keep a behavioral event without a false match.
  if (id) {
    result.content_ids = [id];
    result.content_type = "product";
    if (quantity !== undefined) result.contents = [{ id, quantity }];
  }

  const value =
    typeof payload.value === "number"
      ? payload.value
      : typeof payload.price === "number" && quantity !== undefined
        ? payload.price * quantity
        : undefined;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    result.value = value;
    result.currency = "YER";
  }
  return result;
}

export function trackEvent(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const metaProductPayload =
    event === "add_to_cart" || event === "view_product"
      ? buildMetaProductPayload(payload)
      : undefined;
  payload = sanitizeAnalyticsPayload(payload);
  if (event === "order_created" && typeof payload.orderId === "string") {
    if (sentOrders.has(payload.orderId)) return;
    sentOrders.add(payload.orderId);
    payload.event_id = `order:${payload.orderId}`;
  }

  try {
    // Console audit log for analytics
    if (import.meta.env.DEV) console.log(`[Analytics Event] ${event}:`, payload);

    // Google Analytics / GTag
    if ((window as AnalyticsWindow).gtag) {
      const name =
        event === "click_search"
          ? "search"
          : event === "view_product"
            ? "view_item"
            : event === "click_whatsapp"
              ? "whatsapp_click"
              : event;
      (window as AnalyticsWindow).gtag?.("event", name, payload);
    }

    // Meta / Facebook Pixel
    if ((window as AnalyticsWindow).fbq) {
      if (event === "add_to_cart") {
        (window as AnalyticsWindow).fbq?.("track", "AddToCart", metaProductPayload);
      } else if (event === "view_product") {
        (window as AnalyticsWindow).fbq?.("track", "ViewContent", metaProductPayload);
      } else if (event === "click_search") {
        (window as AnalyticsWindow).fbq?.("track", "Search", payload);
      } else if (event === "begin_checkout") {
        (window as AnalyticsWindow).fbq?.("track", "InitiateCheckout", payload);
      } else {
        (window as AnalyticsWindow).fbq?.("trackCustom", event, payload);
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn("Analytics delivery unavailable");
  }
}
