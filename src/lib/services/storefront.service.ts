/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Storefront CMS Service — the SINGLE data-access layer for CMS settings.
 *
 *   UI → actions (appearance.actions.ts: auth + zod validation)
 *      → THIS SERVICE (all storefront_settings / storefront_change_logs I/O)
 *      → Supabase
 *
 * Rules:
 *  - Every function receives the CALLER's Supabase client (the RLS-scoped
 *    authenticated client from server functions). Authorization (admin
 *    checks) happens in the actions layer; RLS is the database backstop.
 *  - Draft saves NEVER touch the published `value` (C1 regression guard).
 *  - Every mutation records a change-log entry WITH value snapshots
 *    (old_value / new_value / changed_section) — enabling version restore.
 *  - Snapshot columns are written with a legacy fallback so the code keeps
 *    working if it deploys before migration 20260722000008 is applied.
 *
 * The legacy `storefront-settings.functions.ts` layer is deprecated and has
 * zero consumers; do not add new callers to it.
 */

type Db = any;

const now = () => new Date().toISOString();

// ── Reads ────────────────────────────────────────────────────────────────────

export async function readSettingRow(
  db: Db,
  key: string,
): Promise<{ key: string; value: unknown; draft_value: unknown } | null> {
  const { data, error } = await db
    .from("storefront_settings")
    .select("key, value, draft_value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

// ── Draft save (C1-safe) ─────────────────────────────────────────────────────

export async function saveDraftValue(
  db: Db,
  key: string,
  value: unknown,
): Promise<{ ok: boolean; message?: string; oldValue: unknown }> {
  // Snapshot the state being replaced (previous draft, else published value).
  const existing = await readSettingRow(db, key);
  const oldValue = existing ? (existing.draft_value ?? existing.value) : null;

  // NEVER touch the published `value` when saving a draft.
  const { data: updated, error } = await db
    .from("storefront_settings")
    .update({ draft_value: value, updated_at: now() })
    .eq("key", key)
    .select("key");

  if (error) return { ok: false, message: error.message, oldValue };

  if (!updated || updated.length === 0) {
    const { error: insErr } = await db.from("storefront_settings").insert({
      key,
      value: {},
      draft_value: value,
      type: "json",
    });
    if (insErr) return { ok: false, message: insErr.message, oldValue };
  }
  return { ok: true, oldValue };
}

// ── Publish ──────────────────────────────────────────────────────────────────

export async function publishDraftKey(
  db: Db,
  key: string,
): Promise<{ ok: boolean; message?: string; oldValue?: unknown; newValue?: unknown }> {
  const row = await readSettingRow(db, key);
  if (!row) return { ok: false, message: "المفتاح غير موجود" };
  if (row.draft_value == null) return { ok: false, message: "لا توجد مسودة للنشر" };

  const { error } = await db
    .from("storefront_settings")
    .update({ value: row.draft_value, draft_value: null, updated_at: now() })
    .eq("key", key);
  if (error) return { ok: false, message: error.message };

  return { ok: true, oldValue: row.value, newValue: row.draft_value };
}

export async function publishAllDraftKeys(
  db: Db,
): Promise<Array<{ key: string; oldValue: unknown; newValue: unknown }>> {
  const { data: rows, error } = await db
    .from("storefront_settings")
    .select("key, value, draft_value")
    .not("draft_value", "is", null);
  if (error || !rows) return [];

  const published: Array<{ key: string; oldValue: unknown; newValue: unknown }> = [];
  for (const row of rows as Array<{ key: string; value: unknown; draft_value: unknown }>) {
    const { error: updErr } = await db
      .from("storefront_settings")
      .update({ value: row.draft_value, draft_value: null, updated_at: now() })
      .eq("key", row.key);
    if (!updErr) {
      published.push({ key: row.key, oldValue: row.value, newValue: row.draft_value });
    }
  }
  return published;
}

// ── Direct live save (used by the CMS "save" buttons) ───────────────────────

export async function saveLiveValue(
  db: Db,
  key: string,
  value: unknown,
): Promise<{ ok: boolean; message?: string; oldValue: unknown }> {
  const existing = await readSettingRow(db, key);
  const oldValue = existing?.value ?? null;

  const { error } = await db
    .from("storefront_settings")
    .upsert({ key, value, updated_at: now() }, { onConflict: "key" });
  if (error) return { ok: false, message: error.message, oldValue };
  return { ok: true, oldValue };
}

// ── Change log (with snapshots + legacy fallback) ────────────────────────────

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

  // Legacy fallback (snapshot columns not applied yet).
  const { data: legacy } = await db
    .from("storefront_change_logs")
    .select("id, user_email, action_type, key_changed, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return legacy ?? [];
}

// ── Version restore (Phase 5) ────────────────────────────────────────────────

/**
 * Restore a previous version from a change-log snapshot: writes the log's
 * old_value back as the LIVE published value (immediately visible), and the
 * restore itself is snapshotted — so a restore is always reversible via its
 * own log entry.
 */
export async function restoreVersion(
  db: Db,
  logId: string,
): Promise<{ ok: boolean; message?: string; key?: string; previousValue?: unknown; restoredValue?: unknown }> {
  const { data: log, error } = await db
    .from("storefront_change_logs")
    .select("id, key_changed, old_value")
    .eq("id", logId)
    .maybeSingle();

  if (error || !log) return { ok: false, message: "سجل التغيير غير موجود" };
  if (log.old_value == null) {
    return { ok: false, message: "هذا السجل قديم ولا يحمل لقطة قابلة للاستعادة" };
  }

  const current = await readSettingRow(db, log.key_changed);
  const previousValue = current?.value ?? null;

  const { error: updErr } = await db
    .from("storefront_settings")
    .update({ value: log.old_value, updated_at: now() })
    .eq("key", log.key_changed);
  if (updErr) return { ok: false, message: updErr.message };

  return { ok: true, key: log.key_changed, previousValue, restoredValue: log.old_value };
}
