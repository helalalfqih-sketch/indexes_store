/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Store Dashboard Service — data layer for the /store/* owner workspace
 * (Tenant = Electronic Store). All database operations for the store
 * dashboard live here exclusively; callers pass the member's RLS-scoped
 * client, and RLS (can_manage_tenant / member-read policies) is the backstop.
 *
 * Orders are intentionally NOT duplicated here — /store/orders reuses the
 * existing RLS-scoped orders functions (listTenantOrders et al.).
 */

type Db = any;

const now = () => new Date().toISOString();

// ── Products ─────────────────────────────────────────────────────────────────

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  stock: number;
  is_published: boolean;
  images: string[];
  category_id: string | null;
  updated_at: string;
}

export async function listStoreProducts(
  db: Db,
  tenantId: string,
  opts: { search?: string; onlyDrafts?: boolean; onlyLow?: boolean } = {},
): Promise<StoreProduct[]> {
  let q = db
    .from("products")
    .select("id, name, slug, price, currency, stock, is_published, images, category_id, updated_at")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (opts.search) {
    const like = `%${opts.search.replace(/[%_]/g, "")}%`;
    q = q.ilike("name", like);
  }
  if (opts.onlyDrafts) q = q.eq("is_published", false);
  if (opts.onlyLow) q = q.lte("stock", 5);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as StoreProduct[];
}

export async function createStoreProduct(
  db: Db,
  tenantId: string,
  input: { name: string; price: number; stock: number; image?: string | null; is_published: boolean; description?: string },
): Promise<{ ok: boolean; message?: string; id?: string }> {
  const slugBase = input.name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  const slug = `${slugBase || "product"}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await db
    .from("products")
    .insert({
      tenant_id: tenantId,
      slug,
      name: input.name,
      description: input.description ?? "",
      price: input.price,
      stock: input.stock,
      images: input.image ? [input.image] : [],
      is_published: input.is_published,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };
  return { ok: true, id: data.id };
}

export async function updateStoreProduct(
  db: Db,
  tenantId: string,
  id: string,
  patch: Partial<{ name: string; price: number; stock: number; is_published: boolean }>,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await db
    .from("products")
    .update({ ...patch, updated_at: now() })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function deleteStoreProduct(
  db: Db,
  tenantId: string,
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await db.from("products").delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

// ── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryMovement {
  id: string;
  product_id: string;
  delta: number;
  reason: string;
  note: string | null;
  created_at: string;
  product_name?: string | null;
}

export async function listInventoryMovements(
  db: Db,
  tenantId: string,
  limit = 50,
): Promise<InventoryMovement[]> {
  const { data, error } = await db
    .from("inventory_movements")
    .select("id, product_id, delta, reason, note, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  const rows = data as InventoryMovement[];
  const ids = Array.from(new Set(rows.map((r) => r.product_id)));
  if (ids.length) {
    const { data: prods } = await db.from("products").select("id, name").in("id", ids);
    const names: Record<string, string> = {};
    for (const p of (prods ?? []) as any[]) names[p.id] = p.name;
    for (const r of rows) r.product_name = names[r.product_id] ?? null;
  }
  return rows;
}

export async function recordInventoryMovement(
  db: Db,
  tenantId: string,
  input: { productId: string; delta: number; reason: string; note?: string },
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await db.from("inventory_movements").insert({
    tenant_id: tenantId,
    product_id: input.productId,
    delta: input.delta,
    reason: input.reason,
    note: input.note ?? null,
    created_by: userId,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

// ── Customers (derived from the store's own orders; privacy-scoped) ─────────

export interface StoreCustomer {
  key: string;
  name: string | null;
  phone: string | null;
  registered: boolean;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export async function listStoreCustomers(db: Db, tenantId: string): Promise<StoreCustomer[]> {
  const { data, error } = await db
    .from("orders")
    .select("user_id, customer_name, customer_phone, total, status, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(3000);
  if (error || !data) return [];

  const map = new Map<string, StoreCustomer>();
  for (const o of data as any[]) {
    const key = o.user_id ?? `guest:${(o.customer_phone ?? "").replace(/\D/g, "") || "unknown"}`;
    const active = o.status !== "cancelled" && o.status !== "refunded";
    const existing = map.get(key);
    if (existing) {
      existing.ordersCount++;
      if (active) existing.totalSpent += Number(o.total ?? 0);
      if (!existing.name && o.customer_name) existing.name = o.customer_name;
    } else {
      map.set(key, {
        key,
        name: o.customer_name ?? null,
        phone: o.customer_phone ?? null,
        registered: Boolean(o.user_id),
        ordersCount: 1,
        totalSpent: active ? Number(o.total ?? 0) : 0,
        lastOrderAt: o.created_at,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

// ── Analytics: top products ──────────────────────────────────────────────────

export interface TopProduct {
  product_id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export async function listTopProducts(db: Db, tenantId: string, limit = 8): Promise<TopProduct[]> {
  const { data, error } = await db
    .from("order_items")
    .select("product_id, product_name_snapshot, quantity, total_price")
    .eq("tenant_id", tenantId)
    .limit(5000);
  if (error || !data) return [];

  const agg = new Map<string, TopProduct>();
  for (const it of data as any[]) {
    const e = agg.get(it.product_id);
    if (e) {
      e.quantity += it.quantity;
      e.revenue += Number(it.total_price ?? 0);
    } else {
      agg.set(it.product_id, {
        product_id: it.product_id,
        name: it.product_name_snapshot,
        quantity: it.quantity,
        revenue: Number(it.total_price ?? 0),
      });
    }
  }
  return Array.from(agg.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
