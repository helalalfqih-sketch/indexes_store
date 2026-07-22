import { supabase } from "@/integrations/supabase/client";
import { createOrder, type CreateOrderPayload } from "@/lib/order.functions";

/**
 * Order Actions — Real execution layer for user orders and checkout.
 */
export const ORDERS_MODULE_STATUS = "active" as const;

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

export interface UserAddress {
  id: string;
  user_id: string;
  title: string;
  city: string;
  address_line: string;
  phone: string;
  is_default: boolean;
}

export async function submitOrder(input: CreateOrderInput): Promise<{ orderId: string }> {
  // Delegates to the secure `createOrder` server function. user_id is derived
  // server-side from the verified session (guests → null); prices and totals are
  // recomputed from the database. The client never sets user_id or prices.
  const payload: CreateOrderPayload = {
    items: input.items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    notes: input.notes,
    couponCode: input.couponCode,
    discountAmount: input.discountAmount,
    paymentProvider: input.paymentProvider,
  };
  const res = await createOrder({ data: payload });
  return { orderId: res.orderId };
}

export async function getUserAddresses(): Promise<UserAddress[]> {
  try {
    if (!supabase) return [];
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const { data, error } = await (supabase as any)
      .from("user_addresses")
      .select("id, user_id, title, city, address_line, phone, is_default")
      .eq("user_id", userData.user.id);

    if (error || !data) return [];
    return data as UserAddress[];
  } catch (err) {
    console.warn("[getUserAddresses] fetch notice:", err);
    return [];
  }
}

export async function saveUserAddress(addr: Omit<UserAddress, "id" | "user_id"> & { id?: string }): Promise<boolean> {
  try {
    if (!supabase) return false;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;

    const payload = {
      ...addr,
      user_id: userData.user.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as any)
      .from("user_addresses")
      .upsert(payload);

    return !error;
  } catch (err) {
    console.warn("[saveUserAddress] save notice:", err);
    return false;
  }
}

export async function deleteUserAddress(id: string): Promise<boolean> {
  try {
    if (!supabase) return false;
    const { error } = await (supabase as any)
      .from("user_addresses")
      .delete()
      .eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

