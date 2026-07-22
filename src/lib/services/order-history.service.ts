import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { formatOrderNumber } from "@/lib/order-status";

/**
 * Order History Service — business logic for customer-facing order reads.
 *
 * Security model:
 *   - Every function receives a Supabase client from the caller (dependency
 *     injection). Server functions pass an RLS-scoped client (the signed-in
 *     customer) for `getMyOrders`/`getMyOrderDetails`, so the database itself
 *     enforces "own rows only". We ALSO filter by user_id in SQL as
 *     defense-in-depth.
 *   - `getGuestOrder` receives the service-role client (RLS bypassed) and MUST
 *     therefore enforce ownership itself (user_id IS NULL + matching phone).
 *   - This module never imports a Supabase client directly — it cannot leak the
 *     service role into the browser bundle.
 */

type DB = SupabaseClient<Database>;
type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export interface MyOrderSummary {
  id: string;
  order_number: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  currency: string;
  items_count: number;
}

export interface MyOrderItem {
  id: string;
  product_id: string;
  name: string;
  image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderTimelineEntry {
  id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface MyOrderDetails {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  total: number;
  currency: string;
  items: MyOrderItem[];
  history: OrderTimelineEntry[];
}

/** Staff-facing details: customer contact fields included (RLS-gated to tenant staff). */
export interface StaffOrderDetails extends MyOrderDetails {
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  customer_email: string | null;
  notes: string | null;
  user_id: string | null;
  tenant_id: string;
  discount_amount: number;
  coupon_code: string | null;
}

/** Count items per order id without relying on fragile aggregate embeds. */
async function countItemsByOrder(db: DB, orderIds: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (orderIds.length === 0) return counts;
  const { data, error } = await db
    .from("order_items")
    .select("order_id")
    .in("order_id", orderIds);
  if (error || !data) return counts;
  for (const row of data as { order_id: string }[]) {
    counts[row.order_id] = (counts[row.order_id] ?? 0) + 1;
  }
  return counts;
}

/** Resolve the first image for a set of product ids. */
async function imagesByProduct(db: DB, productIds: string[]): Promise<Record<string, string | null>> {
  const images: Record<string, string | null> = {};
  if (productIds.length === 0) return images;
  const { data } = await db
    .from("products")
    .select("id, images")
    .in("id", productIds);
  for (const row of (data ?? []) as { id: string; images: string[] | null }[]) {
    images[row.id] = row.images?.[0] ?? null;
  }
  return images;
}

/**
 * List the signed-in customer's orders, newest first.
 * `db` must be RLS-scoped to the customer; `userId` is the verified auth uid.
 */
export async function getMyOrders(db: DB, userId: string): Promise<MyOrderSummary[]> {
  const { data, error } = await db
    .from("orders")
    .select("id, created_at, status, total, currency")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as Array<{
    id: string;
    created_at: string;
    status: OrderStatus;
    total: number;
    currency: string;
  }>;

  const counts = await countItemsByOrder(db, rows.map((r) => r.id));

  return rows.map((r) => ({
    id: r.id,
    order_number: formatOrderNumber(r.id),
    created_at: r.created_at,
    status: r.status,
    total: Number(r.total ?? 0),
    currency: r.currency ?? "YER",
    items_count: counts[r.id] ?? 0,
  }));
}

/**
 * Full details for ONE of the customer's own orders. Returns null if the order
 * does not exist or is not owned by the caller (RLS + explicit user_id filter).
 */
export async function getMyOrderDetails(
  db: DB,
  userId: string,
  orderId: string,
): Promise<MyOrderDetails | null> {
  const { data: order, error } = await db
    .from("orders")
    .select("id, status, payment_status, created_at, total, currency")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !order) return null;

  const [items, history] = await Promise.all([loadItems(db, orderId), loadHistory(db, orderId)]);
  return buildDetails(order as OrderHead, items, history);
}

/**
 * Staff-facing order details (items + timeline + customer contact fields).
 * `db` MUST be an RLS-scoped client — the staff SELECT policies
 * (can_manage_tenant) are the authorization layer. Returns null when the
 * caller has no access to the order.
 */
export async function getOrderDetailsForStaff(
  db: DB,
  orderId: string,
): Promise<StaffOrderDetails | null> {
  const { data: order, error } = await db
    .from("orders")
    .select(
      "id, status, payment_status, created_at, total, currency, customer_name, customer_phone, customer_address, customer_email, notes, user_id, tenant_id, discount_amount, coupon_code",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) return null;

  const [items, history] = await Promise.all([loadItems(db, orderId), loadHistory(db, orderId)]);
  const base = buildDetails(order as OrderHead, items, history);
  const o = order as OrderHead & {
    customer_name: string | null;
    customer_phone: string | null;
    customer_address: string | null;
    customer_email: string | null;
    notes: string | null;
    user_id: string | null;
    tenant_id: string;
    discount_amount: number;
    coupon_code: string | null;
  };
  return {
    ...base,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    customer_address: o.customer_address,
    customer_email: o.customer_email,
    notes: o.notes,
    user_id: o.user_id,
    tenant_id: o.tenant_id,
    discount_amount: Number(o.discount_amount ?? 0),
    coupon_code: o.coupon_code,
  };
}

/**
 * Guest order lookup for the confirmation flow. Uses the SERVICE-ROLE client
 * (RLS bypassed) so it MUST enforce ownership itself:
 *   - the order must be a guest order (user_id IS NULL), and
 *   - the caller must supply the matching customer phone.
 * This avoids opening a permissive RLS read for anonymous users.
 * NOTE: phone-matching mitigates but does not fully prevent id+phone guessing;
 * a per-order opaque confirmation token is a recommended future hardening.
 */
export async function getGuestOrder(
  admin: DB,
  orderId: string,
  phone: string,
): Promise<MyOrderDetails | null> {
  const normalizedPhone = (phone ?? "").trim();
  if (!orderId || !normalizedPhone) return null;

  const { data: order, error } = await admin
    .from("orders")
    .select("id, status, payment_status, created_at, total, currency, customer_phone, user_id")
    .eq("id", orderId)
    .is("user_id", null)
    .eq("customer_phone", normalizedPhone)
    .maybeSingle();

  if (error || !order) return null;

  const [items, history] = await Promise.all([loadItems(admin, orderId), loadHistory(admin, orderId)]);
  return buildDetails(order as OrderHead, items, history);
}

// ---------- internal helpers ----------

interface OrderHead {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  total: number;
  currency: string;
}

async function loadItems(db: DB, orderId: string): Promise<MyOrderItem[]> {
  const { data, error } = await db
    .from("order_items")
    .select("id, product_id, quantity, unit_price, total_price, product_name_snapshot")
    .eq("order_id", orderId);

  if (error || !data) return [];

  const rows = data as Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name_snapshot: string;
  }>;

  const images = await imagesByProduct(db, rows.map((r) => r.product_id));

  return rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    name: r.product_name_snapshot,
    image: images[r.product_id] ?? null,
    quantity: r.quantity,
    unit_price: Number(r.unit_price ?? 0),
    total_price: Number(r.total_price ?? 0),
  }));
}

async function loadHistory(db: DB, orderId: string): Promise<OrderTimelineEntry[]> {
  const { data, error } = await db
    .from("order_status_history")
    .select("id, from_status, to_status, note, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as OrderTimelineEntry[];
}

function buildDetails(
  order: OrderHead,
  items: MyOrderItem[],
  history: OrderTimelineEntry[] = [],
): MyOrderDetails {
  return {
    id: order.id,
    order_number: formatOrderNumber(order.id),
    status: order.status,
    payment_status: order.payment_status,
    created_at: order.created_at,
    total: Number(order.total ?? 0),
    currency: order.currency ?? "YER",
    items,
    history,
  };
}
