import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { CartItem, Currency, OrderStatus } from "./types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  couponDiscountPercent: number;
  onOrderPlaced: (order: OrderStatus) => void;
  onOpenOrderTracker?: (orderNumber: string) => void;
}

/**
 * Legacy compatibility adapter.
 *
 * The storefront now has one canonical editable cart: CartDrawer.
 * This component intentionally renders no second checkout UI. When legacy
 * callers request checkout, it forwards the customer to the internal order
 * completion route while preserving the coupon that was applied in the cart.
 */
export function CheckoutModal({
  isOpen,
  onClose,
  couponDiscountPercent,
}: CheckoutModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const coupon =
      couponDiscountPercent >= 20
        ? "INDEXES20"
        : couponDiscountPercent >= 10
          ? "INDEXES10"
          : undefined;

    onClose();
    void navigate({
      to: "/cart",
      search: coupon ? { coupon } : {},
    });
  }, [couponDiscountPercent, isOpen, navigate, onClose]);

  return null;
}
