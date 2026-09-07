export const STOREFRONT_COUPON_DISCOUNTS = {
  INDEXES10: 10,
  INDEXES20: 20,
} as const;

export function discountPercentForCoupon(couponCode?: string | null): number {
  if (!couponCode) return 0;
  const normalized = couponCode.trim().toUpperCase();
  return (
    STOREFRONT_COUPON_DISCOUNTS[
      normalized as keyof typeof STOREFRONT_COUPON_DISCOUNTS
    ] ?? 0
  );
}

export function discountAmountForCoupon(
  subtotal: number,
  couponCode?: string | null,
): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return Math.round((subtotal * discountPercentForCoupon(couponCode)) / 100);
}
