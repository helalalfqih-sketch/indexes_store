/** Store Analytics Event Tracking Helper */

export type AnalyticsEvent =
  | "click_search"
  | "click_whatsapp"
  | "click_install_app"
  | "add_to_cart"
  | "view_product";

export function trackEvent(event: AnalyticsEvent, payload?: Record<string, any>) {
  if (typeof window === "undefined") return;

  try {
    // Console audit log for analytics
    console.log(`[Analytics Event] ${event}:`, payload || {});

    // Google Analytics / GTag
    if ((window as any).gtag) {
      (window as any).gtag("event", event, payload);
    }

    // Meta / Facebook Pixel
    if ((window as any).fbq) {
      if (event === "add_to_cart") {
        (window as any).fbq("track", "AddToCart", payload);
      } else if (event === "view_product") {
        (window as any).fbq("track", "ViewContent", payload);
      } else if (event === "click_search") {
        (window as any).fbq("track", "Search", payload);
      } else {
        (window as any).fbq("trackCustom", event, payload);
      }
    }
  } catch (err) {
    console.warn("Soft failure tracking analytics event:", err);
  }
}
