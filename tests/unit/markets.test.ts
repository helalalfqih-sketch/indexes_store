import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARKET,
  MARKETS,
  canCheckoutInMarket,
  marketHreflangEntries,
  resolveActiveMarket,
} from "../../src/lib/markets";

describe("storefront markets", () => {
  it("keeps Yemen as the only active checkout market", () => {
    expect(DEFAULT_MARKET).toBe(MARKETS.YE);
    expect(canCheckoutInMarket(MARKETS.YE)).toBe(true);
    expect(MARKETS.YE.checkoutRoute).toBe("supabase_cod");
  });

  it("fails closed for planned and unknown markets", () => {
    expect(canCheckoutInMarket(MARKETS.AE)).toBe(false);
    expect(resolveActiveMarket("AE")).toBe(MARKETS.YE);
    expect(resolveActiveMarket("US")).toBe(MARKETS.YE);
    expect(resolveActiveMarket(null)).toBe(MARKETS.YE);
  });

  it("does not advertise hreflang for a market before it is active", () => {
    const entries = marketHreflangEntries("https://indexes-store.com/", "/product/example");

    expect(entries).toEqual([
      ["ar-ye", "https://indexes-store.com/ar-ye/product/example"],
      ["x-default", "https://indexes-store.com/ar-ye/product/example"],
    ]);
    expect(entries.some(([locale]) => locale === "ar-ae" || locale === "en-ae")).toBe(false);
  });
});
