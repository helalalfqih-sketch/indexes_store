export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";
export type ShippingStatus = "not_shipped" | "in_transit" | "delivered" | "returned";

export type OrderItemDTO = {
  id: string;
  product_id: string;
  name_snapshot: string;
  price_snapshot: number;
  qty: number;
  subtotal: number;
};

export type OrderDTO = {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  notes: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_status: ShippingStatus;
  tracking_number: string | null;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  currency: string;
  payment_provider: string;
  items: OrderItemDTO[];
  created_at: string;
  updated_at: string;
};
