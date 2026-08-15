/**
 * Shipping Configuration — SINGLE SOURCE OF TRUTH.
 *
 * Used by:
 *  - cart.tsx (UI display + threshold banner)
 *  - order.actions.ts / order.functions.ts (server-side calculation)
 *  - WhatsApp order message
 *  - Announcement bar
 *  - Order tracking / details pages
 *
 * The threshold and default fee can be overridden via Storefront Settings
 * (`cart_config.freeShippingThreshold`). These constants are the platform
 * defaults when no storefront setting is available.
 */

/** Default free-shipping threshold in YER (platform fallback). */
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 30_000;

/** Default shipping fee in YER when the threshold is NOT met (platform fallback). */
export const DEFAULT_SHIPPING_FEE = 3_000;

/** Currency code. */
export const SHIPPING_CURRENCY = "YER";

/**
 * Compute the shipping fee for a given subtotal.
 *
 * @param subtotal       - Cart subtotal in YER (server-recomputed, never from client).
 * @param threshold      - Free-shipping threshold (from storefront settings or default).
 * @param configuredFee  - Configured flat fee when threshold is not met.
 * @returns The shipping fee (0 when free shipping applies).
 */
export function computeShippingFee(
  subtotal: number,
  threshold: number = DEFAULT_FREE_SHIPPING_THRESHOLD,
  configuredFee: number = DEFAULT_SHIPPING_FEE,
): number {
  if (threshold > 0 && subtotal >= threshold) return 0;
  return configuredFee;
}

/**
 * How much more the customer needs to qualify for free shipping.
 * Returns 0 if already qualified or if free shipping is disabled (threshold=0).
 */
export function amountToFreeShipping(
  subtotal: number,
  threshold: number = DEFAULT_FREE_SHIPPING_THRESHOLD,
): number {
  if (threshold <= 0) return 0;
  const remaining = threshold - subtotal;
  return remaining > 0 ? remaining : 0;
}

/**
 * Normalize a Yemeni phone number to international format: 967XXXXXXXXX.
 * Handles inputs like: 771370740, 0771370740, +967771370740, 00967771370740, 967771370740.
 * Returns null if the input is not a recognizable Yemeni number.
 */
export function normalizeYemeniPhone(raw: string): string | null {
  const normalized = raw
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\s()+-]/g, "")
    .replace(/^(?:00967|967)/, "")
    .replace(/^0/, "");
  const match = normalized.match(/^(\d{7,10})$/);
  return match ? `967${match[1]}` : (normalized.length >= 7 ? normalized : null);
}
