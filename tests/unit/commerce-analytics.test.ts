import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "../../src/lib/analytics";

describe("commerce analytics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("emits a vendor-neutral begin_checkout event", () => {
    const analyticsWindow = { dataLayer: [] as Array<Record<string, unknown>> };
    vi.stubGlobal("window", analyticsWindow);

    trackEvent("begin_checkout", { currency: "YER", value: 12_000, item_count: 2 });

    expect(analyticsWindow.dataLayer).toEqual([
      { event: "begin_checkout", currency: "YER", value: 12_000, item_count: 2 },
    ]);
  });

  it("maps completed local orders to GA and Meta purchase events", () => {
    const gtag = vi.fn();
    const fbq = vi.fn();
    vi.stubGlobal("window", { dataLayer: [], gtag, fbq });
    const payload = { transaction_id: "order-1", currency: "YER", value: 15_000 };

    trackEvent("purchase", payload);

    expect(gtag).toHaveBeenCalledWith("event", "purchase", payload);
    expect(fbq).toHaveBeenCalledWith("track", "Purchase", payload);
  });

  it("records checkout errors without requiring an analytics SDK", () => {
    const analyticsWindow = { dataLayer: [] as Array<Record<string, unknown>> };
    vi.stubGlobal("window", analyticsWindow);

    expect(() =>
      trackEvent("checkout_error", {
        checkout_source: "supabase",
        error_type: "Error",
      }),
    ).not.toThrow();
    expect(analyticsWindow.dataLayer[0]).toMatchObject({
      event: "checkout_error",
      checkout_source: "supabase",
      error_type: "Error",
    });
  });
});
