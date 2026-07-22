/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Store Service — the SINGLE data-access layer for the store domain tables
 * (Tenant = Electronic Store):
 *   tenant_store_profiles / tenant_store_settings /
 *   tenant_subscriptions / tenant_commissions / tenant_commission_calculations
 *
 * Rules (mirroring storefront.service):
 *  - Functions receive the CALLER's RLS-scoped Supabase client; authorization
 *    lives in the actions layer, RLS is the database backstop.
 *  - No other module may query these tables directly.
 */

type Db = any;

const now = () => new Date().toISOString();

// ── Store profile (Phase 1) ─────────────────────────────────────────────────

export interface StoreProfileRow {
  id: string;
  tenant_id: string;
  display_name: string;
  slug: string | null;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  social_links: Record<string, string>;
  branding: Record<string, any>;
  updated_at: string;
}

export async function getStoreProfile(db: Db, tenantId: string): Promise<StoreProfileRow | null> {
  const { data, error } = await db
    .from("tenant_store_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as StoreProfileRow;
}

export async function upsertStoreProfile(
  db: Db,
  tenantId: string,
  profile: Record<string, any>,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await db
    .from("tenant_store_profiles")
    .upsert({ tenant_id: tenantId, ...profile, updated_at: now() }, { onConflict: "tenant_id" });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

// ── Store settings (Phase 2) ────────────────────────────────────────────────

export interface StoreSettingRow {
  key: string;
  value: Record<string, any>;
  updated_at: string;
}

export async function listStoreSettings(db: Db, tenantId: string): Promise<StoreSettingRow[]> {
  const { data, error } = await db
    .from("tenant_store_settings")
    .select("key, value, updated_at")
    .eq("tenant_id", tenantId);
  if (error || !data) return [];
  return data as StoreSettingRow[];
}

export async function upsertStoreSetting(
  db: Db,
  tenantId: string,
  key: string,
  value: Record<string, any>,
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await db
    .from("tenant_store_settings")
    .upsert(
      { tenant_id: tenantId, key, value, updated_by: userId, updated_at: now() },
      { onConflict: "tenant_id,key" },
    );
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

// ── Members (Phase 3 — reads; membership writes stay on tenant_members RLS) ─

export interface StoreMemberRow {
  user_id: string;
  role: string;
  created_at: string;
}

export async function listStoreMembers(db: Db, tenantId: string): Promise<StoreMemberRow[]> {
  const { data, error } = await db
    .from("tenant_members")
    .select("user_id, role, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as StoreMemberRow[];
}

// ── Marketplace prep reads (Phase 7) ────────────────────────────────────────

export async function getLatestSubscription(db: Db, tenantId: string): Promise<any | null> {
  const { data } = await db
    .from("tenant_subscriptions")
    .select("plan, status, current_period_start, current_period_end")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Applicable commission rules: the store's own rules + the platform default. */
export async function listApplicableCommissionRules(db: Db, tenantId: string): Promise<any[]> {
  const { data, error } = await db
    .from("tenant_commissions")
    .select("id, tenant_id, type, value, active, effective_from")
    .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    .eq("active", true)
    .order("effective_from", { ascending: false });
  if (error || !data) return [];
  return data;
}
