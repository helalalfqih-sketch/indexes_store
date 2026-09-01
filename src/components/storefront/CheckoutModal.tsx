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
 * CartDrawer is the only cart UI. This adapter renders nothing and only
 * forwards legacy checkout calls to the internal delivery/order step.
 */
export function CheckoutModal({ isOpen, onClose, couponDiscountPercent }: CheckoutModalProps) {
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
      to: "/order-completion",
      search: coupon ? { coupon } : {},
    });
  }, [couponDiscountPercent, isOpen, navigate, onClose]);

  return null;
}
