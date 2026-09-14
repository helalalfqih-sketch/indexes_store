/**
 * Market configuration for the public storefront.
 *
 * A market is intentionally not "live" until both catalog and checkout are
 * operational for that country. Planned markets remain discoverable to the
 * admin/application code but can never be selected for customer checkout.
 */

export type MarketCode = "YE" | "AE";
export type MarketStatus = "active" | "planned";
export type CheckoutRoute = "supabase_cod" | "shopify_checkout" | "disabled";

export interface StoreMarket {
  code: MarketCode;
  countryCode: "YE" | "AE";
  currency: "YER" | "AED";
  defaultLocale: "ar-YE" | "ar-AE";
  openGraphLocale: "ar_YE" | "ar_AE";
  supportedLocales: readonly ("ar-YE" | "ar-AE" | "en-AE")[];
  status: MarketStatus;
  checkoutRoute: CheckoutRoute;
  pathPrefix: "/ar-ye" | "/ar-ae";
}

export const MARKETS = {
  YE: {
    code: "YE",
    countryCode: "YE",
    currency: "YER",
    defaultLocale: "ar-YE",
    openGraphLocale: "ar_YE",
    supportedLocales: ["ar-YE"],
    status: "active",
    checkoutRoute: "supabase_cod",
    pathPrefix: "/ar-ye",
  },
  AE: {
    code: "AE",
    countryCode: "AE",
    currency: "AED",
    defaultLocale: "ar-AE",
    openGraphLocale: "ar_AE",
    supportedLocales: ["ar-AE", "en-AE"],
    status: "planned",
    checkoutRoute: "disabled",
    pathPrefix: "/ar-ae",
  },
} as const satisfies Record<MarketCode, StoreMarket>;

export const DEFAULT_MARKET: StoreMarket = MARKETS.YE;

export function isActiveMarket(market: StoreMarket): boolean {
  return market.status === "active" && market.checkoutRoute !== "disabled";
}

/**
 * Resolve only active customer markets. Unknown and planned markets fail
 * closed to the active default market instead of enabling a checkout route.
 */
export function resolveActiveMarket(code?: string | null): StoreMarket {
  const normalized = code?.trim().toUpperCase() as MarketCode | undefined;
  const market = normalized ? MARKETS[normalized] : undefined;
  return market && isActiveMarket(market) ? market : DEFAULT_MARKET;
}

export function canCheckoutInMarket(market: StoreMarket): boolean {
  return isActiveMarket(market);
}

export function marketHreflangEntries(baseUrl: string, pathname = ""): Array<[string, string]> {
  const origin = baseUrl.replace(/\/$/, "");
  const suffix = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const entries = Object.values(MARKETS)
    .filter(isActiveMarket)
    .flatMap((market) =>
      market.supportedLocales.map(
        (locale) =>
          [
            locale.toLowerCase(),
            `${origin}${market.pathPrefix}${suffix === "/" ? "" : suffix}`,
          ] as [string, string],
      ),
    );

  return [
    ...entries,
    ["x-default", `${origin}${DEFAULT_MARKET.pathPrefix}${suffix === "/" ? "" : suffix}`],
  ];
}
