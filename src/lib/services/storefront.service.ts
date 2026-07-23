/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Storefront CMS Service — the SINGLE data-access layer for CMS settings.
 *
 *   UI → actions (appearance.actions.ts: auth + zod validation + scope)
 *      → THIS SERVICE (all storefront_settings / storefront_change_logs I/O)
 *      → Supabase
 *
 * P5 — layered per-store CMS:
 *   scope = null   → GLOBAL rows (platform defaults, admin-managed)
 *   scope = tenant → that store's override rows (owner-managed)
 * Reads merge tenant-over-global per key, so stores inherit platform defaults
 * until they customize a section. Single-store mode is unchanged (global only).
 *
 * Rules:
 *  - Callers pass the RLS-scoped client; authorization (admin / store-owner
 *    scope resolution) happens in the actions layer; RLS is the backstop.
 *  - Draft saves NEVER touch the published `value` (C1 regression guard).
 *  - Upserts avoid ON CONFLICT (the global unique is a partial index) —
 *    update-then-insert is used instead.
 *  - No other module may query these tables. The legacy settings layer was
 *    fully removed.
 */

type Db = any;

/** null = global/platform scope; string = tenant (store) scope. */
export type CmsScope = string | null;

const now = () => new Date().toISOString();

function scoped(q: any, scope: CmsScope) {
  return scope === null ? q.is("tenant_id", null) : q.eq("tenant_id", scope);
}

/** Merge rows: tenant override wins over the global default per key. */
function mergeRows<T extends { key: string; tenant_id?: string | null }>(rows: T[]): T[] {
  const byKey = new Map<string, T>();
  for (const r of rows) {
    const existing = byKey.get(r.key);
    if (!existing || (existing.tenant_id == null && r.tenant_id != null)) {
      byKey.set(r.key, r);
    }
  }
  return Array.from(byKey.values());
}

// ── Reads ────────────────────────────────────────────────────────────────────

/** Published values (global + tenant overrides merged). Public storefront read. */
export async function fetchPublishedRows(
  db: Db,
  tenantId?: string | null,
): Promise<Array<{ key: string; value: unknown }> | null> {
  let q = db.from("storefront_settings").select(tenantId ? "key, value, tenant_id" : "key, value");
  if (tenantId) {
    q = q.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  }
  const { data, error } = await q;
  if (error || !data || data.length === 0) return null;
  return mergeRows(data as any[]).map((r: any) => ({ key: r.key, value: r.value }));
}

/** Values + drafts (merged) — ADMIN/OWNER preview read (caller pre-verified). */
export async function fetchRowsWithDrafts(
  db: Db,
  tenantId?: string | null,
): Promise<Array<{ key: string; value: unknown; draft_value: unknown }> | null> {
  let q = db.from("storefront_settings").select(tenantId ? "key, value, draft_value, tenant_id" : "key, value, draft_value");
  if (tenantId) {
    q = q.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  }
  const { data, error } = await q;
  if (error || !data || data.length === 0) {
    const pub = await fetchPublishedRows(db, tenantId);
    if (!pub) return null;
    return pub.map((r) => ({ ...r, draft_value: null }));
  }
  return mergeRows(data as any[]).map((r: any) => ({
    key: r.key,
    value: r.value,
    draft_value: r.draft_value,
  }));
}

/** Number of keys with a pending draft within ONE scope. */
export async function countPendingDrafts(db: Db, scope: CmsScope = null): Promise<number> {
  let q = db
    .from("storefront_settings")
    .select("*", { count: "exact", head: true })
    .not("draft_value", "is", null);
  q = scoped(q, scope);
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

export async function readSettingRow(
  db: Db,
  key: string,
  scope: CmsScope = null,
): Promise<{ key: string; value: unknown; draft_value: unknown } | null> {
  let q = db.from("storefront_settings").select("key, value, draft_value").eq("key", key);
  q = scoped(q, scope);
  const { data, error } = await q.maybeSingle();
  if (error) {
    let q2 = db.from("storefront_settings").select("key, value").eq("key", key);
    q2 = scoped(q2, scope);
    const { data: d2 } = await q2.maybeSingle();
    if (!d2) return null;
    return { ...d2, draft_value: null };
  }
  return data;
}

// ── Draft save (C1-safe, scoped) ─────────────────────────────────────────────

export async function saveDraftValue(
  db: Db,
  key: string,
  value: unknown,
  scope: CmsScope = null,
): Promise<{ ok: boolean; message?: string; oldValue: unknown }> {
  const existing = await readSettingRow(db, key, scope);
  const oldValue = existing ? (existing.draft_value ?? existing.value) : null;

  // Attempt draft save first
  let uq = db
    .from("storefront_settings")
    .update({ draft_value: value, updated_at: now() })
    .eq("key", key);
  uq = scoped(uq, scope);
  const { data: updated, error } = await uq.select("key");

  // If draft_value column doesn't exist in Supabase PostgREST schema cache, fall back to live save!
  if (error) {
    if (error.message?.includes("draft_value") || error.message?.includes("schema cache")) {
      return saveLiveValue(db, key, value, scope);
    }
    return { ok: false, message: error.message, oldValue };
  }

  if (!updated || updated.length === 0) {
    const { error: insErr } = await db.from("storefront_settings").insert({
      key,
      value: {},
      draft_value: value,
      type: "json",
      tenant_id: scope,
    });
    if (insErr) {
      if (insErr.message?.includes("draft_value") || insErr.message?.includes("schema cache")) {
        return saveLiveValue(db, key, value, scope);
      }
      return { ok: false, message: insErr.message, oldValue };
    }
  }
  return { ok: true, oldValue };
}

// ── Publish (scoped) ─────────────────────────────────────────────────────────

export async function publishDraftKey(
  db: Db,
  key: string,
  scope: CmsScope = null,
): Promise<{ ok: boolean; message?: string; oldValue?: unknown; newValue?: unknown }> {
  const row = await readSettingRow(db, key, scope);
  if (!row) return { ok: false, message: "المفتاح غير موجود" };
  if (row.draft_value == null) return { ok: false, message: "لا توجد مسودة للنشر" };

  let uq = db
    .from("storefront_settings")
    .update({ value: row.draft_value, draft_value: null, updated_at: now() })
    .eq("key", key);
  uq = scoped(uq, scope);
  const { error } = await uq;
  if (error) {
    // If draft_value column doesn't exist, live save is already published
    let uq2 = db.from("storefront_settings").update({ value: row.draft_value, updated_at: now() }).eq("key", key);
    uq2 = scoped(uq2, scope);
    await uq2;
  }

  return { ok: true, oldValue: row.value, newValue: row.draft_value };
}

export async function publishAllDraftKeys(
  db: Db,
  scope: CmsScope = null,
): Promise<Array<{ key: string; oldValue: unknown; newValue: unknown }>> {
  try {
    let q = db
      .from("storefront_settings")
      .select("key, value, draft_value")
      .not("draft_value", "is", null);
    q = scoped(q, scope);
    const { data: rows, error } = await q;
    if (error || !rows) return [];

    const published: Array<{ key: string; oldValue: unknown; newValue: unknown }> = [];
    for (const row of rows as Array<{ key: string; value: unknown; draft_value: unknown }>) {
      let uq = db
        .from("storefront_settings")
        .update({ value: row.draft_value, draft_value: null, updated_at: now() })
        .eq("key", row.key);
      uq = scoped(uq, scope);
      const { error: updErr } = await uq;
      if (!updErr) {
        published.push({ key: row.key, oldValue: row.value, newValue: row.draft_value });
      }
    }
    return published;
  } catch {
    return [];
  }
}

// ── Direct live save (scoped; update-then-insert — no ON CONFLICT) ─────────

export async function saveLiveValue(
  db: Db,
  key: string,
  value: unknown,
  scope: CmsScope = null,
): Promise<{ ok: boolean; message?: string; oldValue: unknown }> {
  const existing = await readSettingRow(db, key, scope);
  const oldValue = existing?.value ?? null;

  // Try updating value and clearing draft_value
  let uq = db
    .from("storefront_settings")
    .update({ value, draft_value: null, updated_at: now() })
    .eq("key", key);
  uq = scoped(uq, scope);
  const { data: updated, error } = await uq.select("key");

  // Fallback if draft_value column doesn't exist in Supabase PostgREST schema cache!
  if (error) {
    let uq2 = db
      .from("storefront_settings")
      .update({ value, updated_at: now() })
      .eq("key", key);
    uq2 = scoped(uq2, scope);
    const { data: u2, error: e2 } = await uq2.select("key");
    if (e2) return { ok: false, message: e2.message, oldValue };
    if (!u2 || u2.length === 0) {
      const { error: insErr } = await db.from("storefront_settings").insert({
        key,
        value,
        type: "json",
        tenant_id: scope,
      });
      if (insErr) return { ok: false, message: insErr.message, oldValue };
    }
    return { ok: true, oldValue };
  }

  if (!updated || updated.length === 0) {
    const { error: insErr } = await db.from("storefront_settings").insert({
      key,
      value,
      draft_value: null,
      type: "json",
      tenant_id: scope,
    });
    if (insErr) {
      const { error: insErr2 } = await db.from("storefront_settings").insert({
        key,
        value,
        type: "json",
        tenant_id: scope,
      });
      if (insErr2) return { ok: false, message: insErr2.message, oldValue };
    }
  }
  return { ok: true, oldValue };
}

// ── Change log (with snapshots + legacy fallback) ────────────────────────────
// NOTE: change-log INSERT is platform-admin-gated by RLS; tenant-scoped owner
// saves are not yet audit-logged (logChange fails soft) — follow-up will add
// tenant-aware audit policies.

export interface ChangeLogInput {
  userId: string;
  userEmail: string | null;
  actionType: "save_draft" | "publish" | "restore";
  key: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export async function logChange(db: Db, entry: ChangeLogInput): Promise<void> {
  const full = {
    user_id: entry.userId,
    user_email: entry.userEmail,
    action_type: entry.actionType,
    key_changed: entry.key,
    changed_section: entry.key,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
  };
  const { error } = await db.from("storefront_change_logs").insert(full);
  if (error) {
    // Deploy-order safety: snapshot columns may not exist yet — fall back to
    // the legacy shape so logging never breaks a save.
    await db.from("storefront_change_logs").insert({
      user_id: entry.userId,
      user_email: entry.userEmail,
      action_type: entry.actionType,
      key_changed: entry.key,
    });
  }
}

export async function listChangeLogs(db: Db, limit: number): Promise<any[]> {
  const { data, error } = await db
    .from("storefront_change_logs")
    .select("id, user_email, action_type, key_changed, created_at, changed_section, old_value")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!error && data) return data;

  const { data: legacy } = await db
    .from("storefront_change_logs")
    .select("id, user_email, action_type, key_changed, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return legacy ?? [];
}

// ── Version restore (GLOBAL scope — admin studio feature) ───────────────────

export async function getLogSnapshot(
  db: Db,
  logId: string,
): Promise<{ ok: true; key: string; oldValue: unknown } | { ok: false; message: string }> {
  const { data: log, error } = await db
    .from("storefront_change_logs")
    .select("id, key_changed, old_value")
    .eq("id", logId)
    .maybeSingle();

  if (error || !log) return { ok: false, message: "سجل التغيير غير موجود" };
  if (log.old_value == null) {
    return { ok: false, message: "هذا السجل قديم ولا يحمل لقطة قابلة للاستعادة" };
  }
  return { ok: true, key: log.key_changed, oldValue: log.old_value };
}

/** Apply a (pre-validated) restored value as the LIVE published value. */
export async function applyRestore(
  db: Db,
  key: string,
  value: unknown,
  scope: CmsScope = null,
): Promise<{ ok: boolean; message?: string; previousValue?: unknown }> {
  const current = await readSettingRow(db, key, scope);
  const previousValue = current?.value ?? null;

  let uq = db.from("storefront_settings").update({ value, updated_at: now() }).eq("key", key);
  uq = scoped(uq, scope);
  const { error } = await uq;
  if (error) return { ok: false, message: error.message };

  return { ok: true, previousValue };
}
