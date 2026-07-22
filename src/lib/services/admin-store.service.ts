/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Store Service — platform-level store management data layer
 * (Tenant = Electronic Store). All /admin/stores database operations live
 * here exclusively.
 *
 * Auth model: functions receive the PLATFORM ADMIN's RLS-scoped client — the
 * caller is verified as app_role.admin in the actions layer, and every table
 * touched here has admin-inclusive policies (has_role / has_tenant_permission
 * short-circuit for platform admins). No service role needed.
 */
import { getStoreProfile, type StoreProfileRow } from "@/lib/services/store.service";

type Db = any;

const now = () => new Date().toISOString();

export interface StoreListItem {
  tenantId: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  ownerUserId: string | null;
  ownerName: string | null;
  displayName: string | null;
  logoUrl: string | null;
  createdAt: string;
  productsCount: number;
  ordersCount: number;
  revenue: number;
  subscriptionEnd: string | null;
  expired: boolean;
}

export interface StoreStats {
  productsCount: number;
  publishedCount: number;
  ordersCount: number;
  pendingOrders: number;
  revenue: number;
  customersCount: number;
  branchesCount: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor_email: string | null;
  details: Record<string, any>;
  created_at: string;
}

// ── internal helpers ─────────────────────────────────────────────────────────

async function computeOrderStats(db: Db, tenantId: string): Promise<{ ordersCount: number; pendingOrders: number; revenue: number; customers: Set<string> }> {
  const { data } = await db
    .from("orders")
    .select("total, status, user_id")
    .eq("tenant_id", tenantId)
    .limit(5000);
  const rows = (data ?? []) as Array<{ total: number; status: string; user_id: string | null }>;
  const customers = new Set<string>();
  let revenue = 0;
  let pendingOrders = 0;
  for (const o of rows) {
    if (o.user_id) customers.add(o.user_id);
    if (o.status === "pending") pendingOrders++;
    if (o.status !== "cancelled" && o.status !== "refunded") revenue += Number(o.total ?? 0);
  }
  return { ordersCount: rows.length, pendingOrders, revenue, customers };
}

async function headCount(db: Db, table: string, tenantId: string, extra?: (q: any) => any): Promise<number> {
  let q = db.from(table).select("*", { count: "exact", head: true }).eq("tenant_id", tenantId);
  if (extra) q = extra(q);
  const { count } = await q;
  return count ?? 0;
}

export async function logAudit(
  db: Db,
  entry: { tenantId: string; actorId: string; actorEmail: string | null; action: string; details?: Record<string, any> },
): Promise<void> {
  const { error } = await db.from("tenant_audit_logs").insert({
    tenant_id: entry.tenantId,
    actor_id: entry.actorId,
    actor_email: entry.actorEmail,
    action: entry.action,
    details: entry.details ?? {},
  });
  if (error) console.warn("[admin-store] audit notice:", error.message);
}

// ── list stores (overview) ───────────────────────────────────────────────────

export async function listStoresWithStats(db: Db): Promise<StoreListItem[]> {
  const { data: tenants, error } = await db
    .from("tenants")
    .select("id, name, slug, status, plan, owner_user_id, created_at")
    .order("created_at", { ascending: true });
  if (error || !tenants) return [];

  const items: StoreListItem[] = [];
  for (const t of tenants as any[]) {
    const [productsCount, orderStats, profile, sub, ownerProfile] = await Promise.all([
      headCount(db, "products", t.id),
      computeOrderStats(db, t.id),
      getStoreProfile(db, t.id),
      db
        .from("tenant_subscriptions")
        .select("current_period_end, status")
        .eq("tenant_id", t.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then((r: any) => r.data ?? null),
      t.owner_user_id
        ? db.from("profiles").select("full_name").eq("id", t.owner_user_id).maybeSingle().then((r: any) => r.data ?? null)
        : Promise.resolve(null),
    ]);

    const subscriptionEnd = sub?.current_period_end ?? null;
    const expired = Boolean(subscriptionEnd && new Date(subscriptionEnd).getTime() < Date.now());

    items.push({
      tenantId: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      plan: t.plan,
      ownerUserId: t.owner_user_id,
      ownerName: ownerProfile?.full_name ?? null,
      displayName: profile?.display_name ?? null,
      logoUrl: profile?.logo_url ?? null,
      createdAt: t.created_at,
      productsCount,
      ordersCount: orderStats.ordersCount,
      revenue: orderStats.revenue,
      subscriptionEnd,
      expired,
    });
  }
  return items;
}

// ── store details ────────────────────────────────────────────────────────────

export interface StoreDetails {
  tenantId: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  ownerUserId: string | null;
  createdAt: string;
  profile: StoreProfileRow | null;
  subscription: any | null;
  members: Array<{ user_id: string; role: string; created_at: string; full_name: string | null }>;
  stats: StoreStats;
  audit: AuditEntry[];
}

export async function getStoreDetails(db: Db, tenantId: string): Promise<StoreDetails | null> {
  const { data: tenant, error } = await db
    .from("tenants")
    .select("id, name, slug, status, plan, owner_user_id, created_at")
    .eq("id", tenantId)
    .maybeSingle();
  if (error || !tenant) return null;

  const [profile, subscription, membersRaw, orderStats, productsCount, publishedCount, branchesCount, auditRaw] =
    await Promise.all([
      getStoreProfile(db, tenantId),
      db
        .from("tenant_subscriptions")
        .select("plan, status, current_period_start, current_period_end, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then((r: any) => r.data ?? null),
      db
        .from("tenant_members")
        .select("user_id, role, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true })
        .then((r: any) => r.data ?? []),
      computeOrderStats(db, tenantId),
      headCount(db, "products", tenantId),
      headCount(db, "products", tenantId, (q) => q.eq("is_published", true)),
      headCount(db, "branches", tenantId),
      db
        .from("tenant_audit_logs")
        .select("id, action, actor_email, details, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(25)
        .then((r: any) => r.data ?? []),
    ]);

  // Enrich member names (platform admin can read profiles).
  const memberIds = (membersRaw as any[]).map((m) => m.user_id);
  let namesById: Record<string, string | null> = {};
  if (memberIds.length > 0) {
    const { data: profs } = await db.from("profiles").select("id, full_name").in("id", memberIds);
    for (const p of (profs ?? []) as any[]) namesById[p.id] = p.full_name;
  }

  return {
    tenantId: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    plan: tenant.plan,
    ownerUserId: tenant.owner_user_id,
    createdAt: tenant.created_at,
    profile,
    subscription,
    members: (membersRaw as any[]).map((m) => ({ ...m, full_name: namesById[m.user_id] ?? null })),
    stats: {
      productsCount,
      publishedCount,
      ordersCount: orderStats.ordersCount,
      pendingOrders: orderStats.pendingOrders,
      revenue: orderStats.revenue,
      customersCount: orderStats.customers.size,
      branchesCount,
    },
    audit: auditRaw as AuditEntry[],
  };
}

// ── mutations (all audited) ──────────────────────────────────────────────────

export async function updateStoreStatus(
  db: Db,
  tenantId: string,
  status: "active" | "suspended" | "pending",
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await db.from("tenants").update({ status, updated_at: now() }).eq("id", tenantId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function updateStorePlan(
  db: Db,
  tenantId: string,
  plan: "free" | "pro" | "enterprise",
  periodEnd?: string | null,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await db.from("tenants").update({ plan, updated_at: now() }).eq("id", tenantId);
  if (error) return { ok: false, message: error.message };
  // Subscription history row (best-effort).
  const { error: subErr } = await db.from("tenant_subscriptions").insert({
    tenant_id: tenantId,
    plan,
    status: "active",
    current_period_start: now(),
    current_period_end: periodEnd ?? null,
  });
  if (subErr) console.warn("[admin-store] subscription notice:", subErr.message);
  return { ok: true };
}

export async function upsertStoreMember(
  db: Db,
  tenantId: string,
  userId: string,
  role: "owner" | "manager" | "staff" | "viewer",
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await db
    .from("tenant_members")
    .upsert({ tenant_id: tenantId, user_id: userId, role }, { onConflict: "tenant_id,user_id" });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function removeStoreMember(
  db: Db,
  tenantId: string,
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await db
    .from("tenant_members")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
