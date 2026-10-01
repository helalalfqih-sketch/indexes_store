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

export function trackEvent(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
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
        (window as AnalyticsWindow).fbq?.("track", "AddToCart", payload);
      } else if (event === "view_product") {
        (window as AnalyticsWindow).fbq?.("track", "ViewContent", payload);
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
