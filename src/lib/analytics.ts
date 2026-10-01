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

export type AttributionContext = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_adset?: string;
  utm_content?: string;
};

const UTM_KEYS: Array<keyof AttributionContext> = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_adset",
  "utm_content",
];

export function getAttributionContext(): AttributionContext {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const stored = window.sessionStorage.getItem("indexes_attribution");
  const context: AttributionContext = stored ? JSON.parse(stored) : {};

  let changed = false;
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      context[key] = value;
      changed = true;
    }
  }

  if (changed) {
    window.sessionStorage.setItem("indexes_attribution", JSON.stringify(context));
  }

  return context;
}

export function trackEvent(event: AnalyticsEvent, payload?: Record<string, any>) {
  if (typeof window === "undefined") return;

  try {
    const enrichedPayload = {
      ...getAttributionContext(),
      ...(payload || {}),
    };

    console.log(`[Analytics Event] ${event}:`, enrichedPayload);

    if ((window as any).gtag) {
      (window as any).gtag("event", event, enrichedPayload);
    }

    if ((window as any).fbq) {
      switch (event) {
        case "add_to_cart":
          (window as any).fbq("track", "AddToCart", enrichedPayload);
          break;
        case "view_product":
          (window as any).fbq("track", "ViewContent", enrichedPayload);
          break;
        case "click_search":
          (window as any).fbq("track", "Search", enrichedPayload);
          break;
        case "lead":
          (window as any).fbq("track", "Lead", enrichedPayload);
          break;
        case "contact":
          (window as any).fbq("track", "Contact", enrichedPayload);
          break;
        case "initiate_checkout":
          (window as any).fbq("track", "InitiateCheckout", enrichedPayload);
          break;
        case "purchase":
          (window as any).fbq("track", "Purchase", enrichedPayload);
          break;
        default:
          (window as any).fbq("trackCustom", event, enrichedPayload);
      }
    }
  } catch (err) {
    console.warn("Soft failure tracking analytics event:", err);
  }
}
