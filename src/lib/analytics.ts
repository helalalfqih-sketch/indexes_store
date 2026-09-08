/** Store Analytics Event Tracking Helper */

export type AnalyticsEvent =
  | "click_search"
  | "click_whatsapp"
  | "click_install_app"
  | "add_to_cart"
  | "view_product"
  | "begin_checkout"
  | "purchase"
  | "checkout_error";

type AnalyticsPayload = Record<string, unknown>;

type AnalyticsWindow = Window & {
  dataLayer?: AnalyticsPayload[];
  gtag?: (command: "event", event: string, payload: AnalyticsPayload) => void;
  fbq?: (command: "track" | "trackCustom", event: string, payload: AnalyticsPayload) => void;
};

const META_EVENTS: Partial<Record<AnalyticsEvent, string>> = {
  add_to_cart: "AddToCart",
  view_product: "ViewContent",
  click_search: "Search",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

export function trackEvent(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  try {
    const analyticsWindow = window as AnalyticsWindow;

    // Vendor-neutral event stream. A tag manager or first-party consumer can
    // subscribe without requiring a vendor SDK in the application bundle.
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
    analyticsWindow.dataLayer.push({ event, ...payload });

    // Google Analytics / GTag
    if (analyticsWindow.gtag) {
      analyticsWindow.gtag("event", event, payload);
    }

    // Meta / Facebook Pixel
    if (analyticsWindow.fbq) {
      const metaEvent = META_EVENTS[event];
      analyticsWindow.fbq(metaEvent ? "track" : "trackCustom", metaEvent || event, payload);
    }
  } catch (err) {
    console.warn("Soft failure tracking analytics event:", err);
  }
}
