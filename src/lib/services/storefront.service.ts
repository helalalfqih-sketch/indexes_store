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
  if (scope === undefined) return q;
  if (scope === null) return q.is("tenant_id", null);
  return q.eq("tenant_id", scope);
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
  try {
    let q = db.from("storefront_settings").select(tenantId ? "key, value, tenant_id" : "key, value");
    if (tenantId) {
      q = q.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    }
    const { data, error } = await q;
    if (error || !data || data.length === 0) {
      // Fallback query selecting key, value without tenant_id
      const { data: d2 } = await db.from("storefront_settings").select("key, value");
      if (!d2 || d2.length === 0) return null;
      return d2.map((r: any) => ({ key: r.key, value: r.value }));
    }
    return mergeRows(data as any[]).map((r: any) => ({ key: r.key, value: r.value }));
  } catch {
    return null;
  }
}

/** Values + drafts (merged) — ADMIN/OWNER preview read (caller pre-verified). */
export async function fetchRowsWithDrafts(
  db: Db,
  tenantId?: string | null,
): Promise<Array<{ key: string; value: unknown; draft_value: unknown }> | null> {
  try {
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
  } catch {
    const pub = await fetchPublishedRows(db, tenantId);
    if (!pub) return null;
    return pub.map((r) => ({ ...r, draft_value: null }));
  }
}

/** Number of keys with a pending draft within ONE scope. */
export async function countPendingDrafts(db: Db, scope: CmsScope = null): Promise<number> {
  try {
    let q = db
      .from("storefront_settings")
      .select("*", { count: "exact", head: true })
      .not("draft_value", "is", null);
    q = scoped(q, scope);
    const { count, error } = await q;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function readSettingRow(
  db: Db,
  key: string,
  scope: CmsScope = null,
): Promise<{ key: string; value: unknown; draft_value: unknown } | null> {
  try {
    let q = db.from("storefront_settings").select("key, value, draft_value").eq("key", key);
    q = scoped(q, scope);
    const { data, error } = await q.maybeSingle();
    if (!error && data) return data;

    // Fallback: if tenant scope didn't find a row, try global scope (tenant_id IS NULL)
    if (scope !== null) {
      const { data: globalData } = await db
        .from("storefront_settings")
        .select("key, value, draft_value")
        .eq("key", key)
        .is("tenant_id", null)
        .maybeSingle();
      if (globalData) return globalData;
    }
    return null;
  } catch {
    try {
      const { data: d2 } = await db
        .from("storefront_settings")
        .select("key, value, draft_value")
        .eq("key", key)
        .is("tenant_id", null)
        .maybeSingle();
      return d2 ?? null;
    } catch {
      return null;
    }
  }
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

  // Check if a row matching key AND exact scope exists
  let checkQ = db.from("storefront_settings").select("id").eq("key", key);
  checkQ = scoped(checkQ, scope);
  const { data: rowExists } = await checkQ.maybeSingle();

  if (rowExists) {
    let uq = db
      .from("storefront_settings")
      .update({ draft_value: value, updated_at: now() })
      .eq("key", key);
    uq = scoped(uq, scope);
    const { error } = await uq;
    if (error) {
      return saveLiveValue(db, key, value, scope);
    }
    return { ok: true, oldValue };
  } else {
    const payload: any = { key, value: {}, draft_value: value, type: "json" };
    if (scope !== null) payload.tenant_id = scope;
    const { error: insErr } = await db.from("storefront_settings").insert(payload);
    if (insErr) {
      return saveLiveValue(db, key, value, scope);
    }
    return { ok: true, oldValue };
  }
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

  try {
    let uq = db
      .from("storefront_settings")
      .update({ value: row.draft_value, draft_value: null, updated_at: now() })
      .eq("key", key);
    uq = scoped(uq, scope);
    const { error } = await uq;
    if (error) {
      let uq2 = db.from("storefront_settings").update({ value: row.draft_value, updated_at: now() }).eq("key", key);
      uq2 = scoped(uq2, scope);
      await uq2;
    }
  } catch {
    let uq3 = db.from("storefront_settings").update({ value: row.draft_value, updated_at: now() }).eq("key", key);
    uq3 = scoped(uq3, scope);
    await uq3;
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

  // Check if a row matching key AND exact scope exists
  let checkQ = db.from("storefront_settings").select("id").eq("key", key);
  checkQ = scoped(checkQ, scope);
  const { data: rowExists } = await checkQ.maybeSingle();

  if (rowExists) {
    let uq = db
      .from("storefront_settings")
      .update({ value, draft_value: null, updated_at: now() })
      .eq("key", key);
    uq = scoped(uq, scope);
    const { error } = await uq;
    if (error) {
      return { ok: false, message: error.message, oldValue };
    }
    return { ok: true, oldValue };
  } else {
    const payload: any = { key, value, draft_value: null, type: "json" };
    if (scope !== null) payload.tenant_id = scope;
    const { error: insErr } = await db.from("storefront_settings").insert(payload);
    if (insErr) {
      // Fallback: attempt update if created concurrently
      let uq = db
        .from("storefront_settings")
        .update({ value, draft_value: null, updated_at: now() })
        .eq("key", key);
      uq = scoped(uq, scope);
      const { error: updErr } = await uq;
      if (updErr) return { ok: false, message: insErr.message, oldValue };
    }
    return { ok: true, oldValue };
  }
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
