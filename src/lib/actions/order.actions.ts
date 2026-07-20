/**
 * Order Actions — placeholder for Phase 4C (Orders + Cart Backend).
 *
 * Contract will match the other actions files:
 *   UI ──► order.actions ──► order.functions ──► orders.repo ──► DB
 *
 * Not yet implemented — orders/order_items schema lands in Phase 4C.
 */
export const ORDERS_MODULE_STATUS = "pending-phase-4c" as const;

export interface CreateOrderInput {
  items: { productId: string; quantity: number }[];
  customerName?: string;
  customerPhone: string;
  customerAddress?: string;
  notes?: string;
  couponCode?: string;
  discountAmount?: number;
  paymentProvider?: string;
}

export async function submitOrder(input: CreateOrderInput): Promise<{ orderId: string }> {
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  return { orderId };
}
