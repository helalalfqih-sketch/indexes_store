/** Store Analytics Event Tracking Helper */

export type AnalyticsEvent =
  | "click_search"
  | "click_whatsapp"
  | "click_install_app"
  | "add_to_cart"
  | "view_product"
  | "lead"
  | "contact"
  | "initiate_checkout"
  | "purchase";

export function trackEvent(event: AnalyticsEvent, payload?: Record<string, any>) {
  if (typeof window === "undefined") return;

  try {
    console.log(`[Analytics Event] ${event}:`, payload || {});

    if ((window as any).gtag) {
      (window as any).gtag("event", event, payload);
    }

    if ((window as any).fbq) {
      switch (event) {
        case "add_to_cart":
          (window as any).fbq("track", "AddToCart", payload);
          break;
        case "view_product":
          (window as any).fbq("track", "ViewContent", payload);
          break;
        case "click_search":
          (window as any).fbq("track", "Search", payload);
          break;
        case "lead":
          (window as any).fbq("track", "Lead", payload);
          break;
        case "contact":
          (window as any).fbq("track", "Contact", payload);
          break;
        case "initiate_checkout":
          (window as any).fbq("track", "InitiateCheckout", payload);
          break;
        case "purchase":
          (window as any).fbq("track", "Purchase", payload);
          break;
        default:
          (window as any).fbq("trackCustom", event, payload);
      }
    }
  } catch (err) {
    console.warn("Soft failure tracking analytics event:", err);
  }
}
