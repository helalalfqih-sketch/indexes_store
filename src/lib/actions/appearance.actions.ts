// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  HeroConfigSchema,
  ThemeConfigSchema,
  ProductsLayoutConfigSchema,
  ProductPageConfigSchema,
  CartConfigSchema,
  CheckoutConfigSchema,
  NavigationConfigSchema,
  PagesConfigSchema,
  TranslationConfigSchema,
  NotificationsConfigSchema,
  SectionsConfigSchema,
  SeoConfigSchema,
  AdvancedConfigSchema,
  type StorefrontSettingsShape,
} from "@/lib/domain/appearance";

// ── Helpers ─────────────────────────────────────────────────────────────────
// Validation lives in @/lib/validators/storefront (Phase 3), and ALL database
// access goes through @/lib/services/storefront.service (Phase 4 — single CMS
// data layer). This actions file keeps only: auth, validation, logging calls.
import { validateSettingValue } from "@/lib/validators/storefront";
import * as storefrontService from "@/lib/services/storefront.service";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { resolveCurrentTenant } from "@/lib/saas/tenant-resolver";

/**
 * P5 — CMS write scope resolution:
 *   platform admin → GLOBAL rows (tenant_id NULL, platform defaults)
 *   store owner    → THEIR tenant's override rows
 * Anyone else is rejected. RLS enforces the same split as backstop.
 */
async function resolveCmsScope(
  authSupabase: any,
  userId: string,
): Promise<{ allowed: boolean; scope: string | null }> {
  const { data: isAdmin } = await authSupabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (isAdmin) return { allowed: true, scope: null };

  try {
    const tenantId = await resolveCurrentTenant(authSupabase, { userId });
    const { data: isOwner } = await authSupabase.rpc("has_tenant_permission", {
      _tenant_id: tenantId,
      _user_id: userId,
      _required_role: "owner",
    });
    if (isOwner) return { allowed: true, scope: tenantId };
  } catch {
    /* fall through */
  }
  return { allowed: false, scope: null };
}

/** Resolve the storefront tenant for PUBLIC reads from request headers. */
async function resolvePublicCmsTenant(db: any): Promise<string | null> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const headers = getRequest()?.headers ?? null;
    return await resolveTenantId(db, { headers });
  } catch {
    return null;
  }
}

/**
 * Verify the caller of a public (middleware-less) server fn is a platform
 * admin, using the request bearer token verified against Supabase Auth.
 * Returns the service-role client when authorized, otherwise null.
 */
async function getAdminClientIfAuthorized() {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const authHeader = getRequest()?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token || token.split(".").length !== 3) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    return isAdmin ? supabaseAdmin : null;
  } catch {
    return null;
  }
}

/** Parse the raw DB rows into the full StorefrontSettingsShape using safe Zod defaults. */
function rowsToSettings(
  data: Array<{ key: string; value: unknown; draft_value?: unknown }>,
  previewMode = false
): StorefrontSettingsShape {
  const settingsMap = new Map<string, unknown>();
  for (const row of data) {
    // In preview mode: use draft_value if available, otherwise fall back to value
    const activeValue = previewMode && row.draft_value != null ? row.draft_value : row.value;
    settingsMap.set(row.key, activeValue);
  }

  return {
    hero: HeroConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.hero).parse(
      settingsMap.get("hero") ?? {}
    ),
    theme: ThemeConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.theme).parse(
      settingsMap.get("theme") ?? {}
    ),
    products_layout: ProductsLayoutConfigSchema.catch(
      DEFAULT_STOREFRONT_SETTINGS.products_layout
    ).parse(settingsMap.get("products_layout") ?? {}),
    product_page: ProductPageConfigSchema.catch(
      DEFAULT_STOREFRONT_SETTINGS.product_page
    ).parse(settingsMap.get("product_page") ?? {}),
    cart_config: CartConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.cart_config).parse(
      settingsMap.get("cart_config") ?? {}
    ),
    checkout: CheckoutConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.checkout).parse(
      settingsMap.get("checkout") ?? {}
    ),
    navigation: NavigationConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.navigation).parse(
      settingsMap.get("navigation") ?? {}
    ),
    pages: PagesConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.pages).parse(
      settingsMap.get("pages") ?? {}
    ),
    translation: TranslationConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.translation).parse(
      settingsMap.get("translation") ?? {}
    ),
    notifications: NotificationsConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.notifications).parse(
      settingsMap.get("notifications") ?? {}
    ),
    sections: SectionsConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.sections).parse(
      settingsMap.get("sections") ?? {}
    ),
    seo: SeoConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.seo).parse(
      settingsMap.get("seo") ?? {}
    ),
    advanced: AdvancedConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.advanced).parse(
      settingsMap.get("advanced") ?? {}
    ),
  };
}

// ── 1. Get Storefront Settings ────────────────────────────────────────────────

/**
 * Fetch all global storefront settings.
 * - previewMode=true → returns draft_value when available (for admin live preview)
 * - previewMode=false (default) → returns published value only (for public storefront)
 */
export const getStorefrontAppearance = createServerFn({ method: "GET" })
  .validator((data: { previewMode?: boolean } | undefined) => data)
  .handler(async ({ data }): Promise<StorefrontSettingsShape> => {
    const previewMode = data?.previewMode ?? false;
    try {
      let db = supabase;
      if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          if (supabaseAdmin) db = supabaseAdmin;
        } catch {
          db = supabase;
        }
      }

      if (!db) return DEFAULT_STOREFRONT_SETTINGS;

      const publicTenantId = await resolvePublicCmsTenant(db);

      if (previewMode) {
        const rows = await storefrontService.fetchRowsWithDrafts(db, publicTenantId);
        if (rows && rows.length > 0) return rowsToSettings(rows, true);
      }

      const rows = await storefrontService.fetchPublishedRows(db, publicTenantId);
      if (!rows || rows.length === 0) return DEFAULT_STOREFRONT_SETTINGS;
      return rowsToSettings(rows, false);
    } catch (err) {
      console.warn("[getStorefrontAppearance] Returning fallback defaults:", err);
      return DEFAULT_STOREFRONT_SETTINGS;
    }
  });

// ── 2. Save Draft ────────────────────────────────────────────────────────────

/**
 * Save settings as a draft (not yet visible on live storefront).
 * Writes to draft_value column. Logs action in storefront_change_logs.
 */
export const saveStorefrontDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { key: keyof StorefrontSettingsShape; value: unknown }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { supabase: authSupabase, userId } = context;

      const gate = await resolveCmsScope(authSupabase, userId);
      if (!gate.allowed) {
        return { success: false, message: "غير مسموح: يتطلب مدير المنصّة أو مالك المتجر" };
      }

      // S2: validate the payload against the key's schema before storing.
      const validated = validateSettingValue(data.key, data.value);
      if (!validated.ok) return { success: false, message: validated.message };

      // C1-safe draft save through the unified service (never touches `value`).
      const res = await storefrontService.saveDraftValue(authSupabase, data.key, validated.value, gate.scope);
      if (!res.ok) {
        console.error("[saveStorefrontDraft] Error:", res.message);
        return { success: false, message: res.message };
      }

      // Change log with value snapshots (enables version restore).
      const { data: userData } = await authSupabase.auth.getUser();
      await storefrontService.logChange(authSupabase, {
        userId,
        userEmail: userData?.user?.email ?? null,
        actionType: "save_draft",
        key: data.key,
        oldValue: res.oldValue,
        newValue: validated.value,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء حفظ المسودة";
      return { success: false, message: msg };
    }
  });

// ── 3. Publish Settings ───────────────────────────────────────────────────────

/**
 * Publish a draft: copies draft_value → value, making it live on the public storefront.
 * Logs action in storefront_change_logs.
 */
export const publishStorefrontSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { key: keyof StorefrontSettingsShape }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { supabase: authSupabase, userId } = context;

      const gate = await resolveCmsScope(authSupabase, userId);
      if (!gate.allowed) {
        return { success: false, message: "غير مسموح: يتطلب مدير المنصّة أو مالك المتجر" };
      }

      // Publish draft → live through the unified service.
      const res = await storefrontService.publishDraftKey(authSupabase, data.key, gate.scope);
      if (!res.ok) return { success: false, message: res.message };

      // Log with snapshots (old published value → newly published value).
      const { data: userData } = await authSupabase.auth.getUser();
      await storefrontService.logChange(authSupabase, {
        userId,
        userEmail: userData?.user?.email ?? null,
        actionType: "publish",
        key: data.key,
        oldValue: res.oldValue,
        newValue: res.newValue,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء النشر";
      return { success: false, message: msg };
    }
  });

// ── 4. Publish All Drafts ─────────────────────────────────────────────────────

/**
 * Publish all pending drafts at once.
 */
export const publishAllStorefrontSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ success: boolean; message?: string; published: string[] }> => {
    try {
      const { supabase: authSupabase, userId } = context;

      const gate = await resolveCmsScope(authSupabase, userId);
      if (!gate.allowed) {
        return { success: false, message: "غير مسموح", published: [] };
      }

      // Publish every pending draft (within the caller's scope only).
      const results = await storefrontService.publishAllDraftKeys(authSupabase, gate.scope);
      if (results.length === 0) {
        return { success: true, published: [], message: "لا توجد مسودات معلقة" };
      }

      const { data: userData } = await authSupabase.auth.getUser();
      for (const r of results) {
        await storefrontService.logChange(authSupabase, {
          userId,
          userEmail: userData?.user?.email ?? null,
          actionType: "publish",
          key: r.key,
          oldValue: r.oldValue,
          newValue: r.newValue,
        });
      }

      return { success: true, published: results.map((r) => r.key) };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      return { success: false, message: msg, published: [] };
    }
  });

// ── 5. Get Change Logs ────────────────────────────────────────────────────────

export type ChangeLogEntry = {
  id: string;
  user_email: string | null;
  action_type: string;
  key_changed: string;
  created_at: string;
  /** Present after migration 20260722000008 — snapshot of the replaced value. */
  changed_section?: string | null;
  old_value?: unknown;
};

/**
 * Fetch recent storefront change log entries (admin only).
 */
export const getStorefrontChangeLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { limit?: number } | undefined) => data)
  .handler(async ({ data, context }): Promise<ChangeLogEntry[]> => {
    try {
      const { supabase: authSupabase, userId } = context;

      const { data: isAdmin } = await authSupabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!isAdmin) return [];

      const limit = data?.limit ?? 20;
      const logs = await storefrontService.listChangeLogs(authSupabase, limit);
      return logs as ChangeLogEntry[];
    } catch {
      return [];
    }
  });

// ── 6. Restore a previous version (Phase 5) ──────────────────────────────────

/**
 * Restore a CMS key to a previous version from a change-log snapshot.
 * The restored value goes LIVE immediately; the restore itself is logged with
 * snapshots, so it is always reversible via its own log entry. Admin only.
 */
export const restoreStorefrontVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { logId: string }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string; key?: string }> => {
    try {
      const { supabase: authSupabase, userId } = context;

      const { data: isAdmin, error: roleErr } = await authSupabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (roleErr || !isAdmin) {
        return { success: false, message: "غير مسموح: يجب أن تكون مديراً لاستعادة النسخ" };
      }

      // 1) Read the snapshot, 2) zod-validate it against the key's CURRENT
      // schema (corrupt/legacy snapshots are rejected before any write),
      // 3) apply as the live value.
      const snap = await storefrontService.getLogSnapshot(authSupabase, data.logId);
      if (!snap.ok) return { success: false, message: snap.message };

      const validated = validateSettingValue(snap.key, snap.oldValue);
      if (!validated.ok) {
        return {
          success: false,
          message: `تعذّرت الاستعادة — اللقطة لا تطابق مخطط الإعدادات الحالي: ${validated.message}`,
        };
      }

      const res = await storefrontService.applyRestore(authSupabase, snap.key, validated.value);
      if (!res.ok) return { success: false, message: res.message };

      const { data: userData } = await authSupabase.auth.getUser();
      await storefrontService.logChange(authSupabase, {
        userId,
        userEmail: userData?.user?.email ?? null,
        actionType: "restore",
        key: snap.key,
        oldValue: res.previousValue,
        newValue: validated.value,
      });

      return { success: true, key: snap.key };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء الاستعادة";
      return { success: false, message: msg };
    }
  });

// ── 6. Legacy: Update Storefront Appearance (write directly to live value) ───
// Kept for backward compatibility with existing admin.appearance.tsx

export const updateStorefrontAppearance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { key: keyof StorefrontSettingsShape; value: unknown }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { supabase: authSupabase, userId } = context;

      const gate = await resolveCmsScope(authSupabase, userId);
      if (!gate.allowed) {
        return { success: false, message: "غير مسموح: يتطلب مدير المنصّة أو مالك المتجر" };
      }

      // S2: validate against the key's schema before writing to the live value.
      const validated = validateSettingValue(data.key, data.value);
      if (!validated.ok) return { success: false, message: validated.message };

      // Direct live save through the unified service (snapshots the old value).
      const res = await storefrontService.saveLiveValue(authSupabase, data.key, validated.value, gate.scope);
      if (!res.ok) {
        console.error("[updateStorefrontAppearance] Error:", res.message);
        return { success: false, message: res.message };
      }

      // This write goes LIVE immediately → log it as a publish, with snapshots.
      const { data: userData } = await authSupabase.auth.getUser();
      await storefrontService.logChange(authSupabase, {
        userId,
        userEmail: userData?.user?.email ?? null,
        actionType: "publish",
        key: data.key,
        oldValue: res.oldValue,
        newValue: validated.value,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الإعدادات";
      return { success: false, message: msg };
    }
  });
