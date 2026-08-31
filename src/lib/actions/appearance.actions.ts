// Security-critical CMS file — no @ts-nocheck allowed
import { z } from "zod";
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
  StoreIdentitySchema,
  BrandSettingsSchema,
  SocialLinksSettingsSchema,
  GeneralStoreSettingsSchema,
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
 * P5 — CMS write scope resolution (Fail-Closed):
 *   platform admin → GLOBAL rows (tenant_id NULL, platform defaults)
 *   store owner    → THEIR tenant's override rows
 * Anyone else is REJECTED (allowed: false, scope: null).
 */
async function resolveCmsScope(
  authSupabase: any,
  userId: string,
): Promise<{ allowed: boolean; scope: string | null }> {
  if (!userId) return { allowed: false, scope: null };

  try {
    const { data: isAdmin } = await authSupabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin) return { allowed: true, scope: null };

    const tenantId = await resolveCurrentTenant(authSupabase, { userId });
    if (tenantId) {
      const { data: isOwner } = await authSupabase.rpc("has_tenant_permission", {
        _tenant_id: tenantId,
        _user_id: userId,
        _required_role: "owner",
      });
      if (isOwner) return { allowed: true, scope: tenantId };
    }
  } catch {
    /* fail-closed on any error */
  }
  return { allowed: false, scope: null };
}

const MAX_PUBLIC_DATA_URI_LENGTH = 64_000;

/** Remove oversized inline images from public settings so SSR stays lightweight. */
function stripOversizedPublicDataUris(value: unknown): unknown {
  if (typeof value === "string") {
    return value.startsWith("data:") && value.length > MAX_PUBLIC_DATA_URI_LENGTH ? undefined : value;
  }
  if (Array.isArray(value)) return value.map(stripOversizedPublicDataUris);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        stripOversizedPublicDataUris(nested),
      ]),
    );
  }
  return value;
}

function sanitizePublicSettings(settings: StorefrontSettingsShape): StorefrontSettingsShape {
  return stripOversizedPublicDataUris(settings) as StorefrontSettingsShape;
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

function parseSection<T>(schema: z.ZodType<T, any, any>, raw: unknown, fallback: T): T {
  try {
    const res = schema.safeParse(raw ?? {});
    if (res.success) return res.data;
    return fallback;
  } catch {
    return fallback;
  }
}

/** Parse the raw DB rows into the full StorefrontSettingsShape using safe Zod defaults. */
function rowsToSettings(
  data: Array<{ key: string; value: unknown; draft_value?: unknown }>,
  previewMode = false
): StorefrontSettingsShape {
  const settingsMap = new Map<string, unknown>();
  for (const row of data) {
    const activeValue = previewMode && row.draft_value != null ? row.draft_value : row.value;
    settingsMap.set(row.key, activeValue);
  }

  return {
    hero: parseSection(HeroConfigSchema, settingsMap.get("hero"), DEFAULT_STOREFRONT_SETTINGS.hero),
    theme: parseSection(ThemeConfigSchema, settingsMap.get("theme"), DEFAULT_STOREFRONT_SETTINGS.theme),
    products_layout: parseSection(
      ProductsLayoutConfigSchema,
      settingsMap.get("products_layout"),
      DEFAULT_STOREFRONT_SETTINGS.products_layout
    ),
    product_page: parseSection(
      ProductPageConfigSchema,
      settingsMap.get("product_page"),
      DEFAULT_STOREFRONT_SETTINGS.product_page
    ),
    cart_config: parseSection(
      CartConfigSchema,
      settingsMap.get("cart_config"),
      DEFAULT_STOREFRONT_SETTINGS.cart_config
    ),
    checkout: parseSection(
      CheckoutConfigSchema,
      settingsMap.get("checkout"),
      DEFAULT_STOREFRONT_SETTINGS.checkout
    ),
    navigation: parseSection(
      NavigationConfigSchema,
      settingsMap.get("navigation"),
      DEFAULT_STOREFRONT_SETTINGS.navigation
    ),
    pages: parseSection(PagesConfigSchema, settingsMap.get("pages"), DEFAULT_STOREFRONT_SETTINGS.pages),
    translation: parseSection(
      TranslationConfigSchema,
      settingsMap.get("translation"),
      DEFAULT_STOREFRONT_SETTINGS.translation
    ),
    notifications: parseSection(
      NotificationsConfigSchema,
      settingsMap.get("notifications"),
      DEFAULT_STOREFRONT_SETTINGS.notifications
    ),
    sections: parseSection(
      SectionsConfigSchema,
      settingsMap.get("sections"),
      DEFAULT_STOREFRONT_SETTINGS.sections
    ),
    seo: parseSection(SeoConfigSchema, settingsMap.get("seo"), DEFAULT_STOREFRONT_SETTINGS.seo),
    advanced: parseSection(
      AdvancedConfigSchema,
      settingsMap.get("advanced"),
      DEFAULT_STOREFRONT_SETTINGS.advanced
    ),
    store_identity: parseSection(
      StoreIdentitySchema,
      settingsMap.get("store_identity"),
      DEFAULT_STOREFRONT_SETTINGS.store_identity
    ),
    brand_settings: parseSection(
      BrandSettingsSchema,
      settingsMap.get("brand_settings"),
      DEFAULT_STOREFRONT_SETTINGS.brand_settings
    ),
    social_links: parseSection(
      SocialLinksSettingsSchema,
      settingsMap.get("social_links"),
      DEFAULT_STOREFRONT_SETTINGS.social_links
    ),
    general_settings: parseSection(
      GeneralStoreSettingsSchema,
      settingsMap.get("general_settings"),
      DEFAULT_STOREFRONT_SETTINGS.general_settings
    ),
  };
}

// ── 1. Get Published Storefront Settings (Public — No Auth & No Service Role) ──

/**
 * Fetch published storefront settings.
 * Publicly accessible — reads published "value" column ONLY. Never uses Service Role.
 */
export const getPublishedStorefrontAppearance = createServerFn({ method: "GET" })
  .handler(async (): Promise<StorefrontSettingsShape> => {
    try {
      const publicTenantId = await resolvePublicCmsTenant(supabase);
      const rows = await storefrontService.fetchPublishedRows(supabase, publicTenantId);
      if (!rows || rows.length === 0) return sanitizePublicSettings(DEFAULT_STOREFRONT_SETTINGS);
      return sanitizePublicSettings(rowsToSettings(rows, false));
    } catch (err) {
      console.warn("[getPublishedStorefrontAppearance] Returning fallback defaults:", err);
      return sanitizePublicSettings(DEFAULT_STOREFRONT_SETTINGS);
    }
  });

/**
 * Fetch draft preview storefront settings (Protected — Auth & CMS Scope Gated).
 * Reads draft_value for authorized tenant/platform admin callers only.
 */
export const getStorefrontDraftPreview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StorefrontSettingsShape> => {
    const { supabase: authSupabase, userId } = context as any;
    const gate = await resolveCmsScope(authSupabase, userId);
    if (!gate.allowed) {
      throw new Error("403: Forbidden — CMS draft preview requires tenant membership or admin role.");
    }

    // Fail-closed: admin preview must expose truthful errors, never silently return defaults
    const rows = await storefrontService.fetchRowsWithDrafts(authSupabase, gate.scope);
    if (rows && rows.length > 0) return rowsToSettings(rows, true);
    const published = await storefrontService.fetchPublishedRows(authSupabase, gate.scope);
    if (published && published.length > 0) return rowsToSettings(published, false);
    return DEFAULT_STOREFRONT_SETTINGS;
  });

/** Backward compatibility alias for public appearance reads */
export const getStorefrontAppearance = getPublishedStorefrontAppearance;

// ── 2. Save Draft ────────────────────────────────────────────────────────────

/**
 * Save settings as a draft (not yet visible on live storefront).
 * Writes to draft_value column. Logs action in storefront_change_logs.
 */
export const saveStorefrontDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { key: keyof StorefrontSettingsShape; value: unknown }) => data)
  .handler(async ({ data, context }: { data: any; context: any }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { supabase: authSupabase, userId } = context;

      const gate = await resolveCmsScope(authSupabase, userId);
      if (!gate.allowed) {
        return { success: false, message: "غير مسموح: يتطلب تسجيل الدخول للوحة التحكم" };
      }

      // S2: validate the payload against the key's schema before storing.
      const validated = validateSettingValue(data.key, data.value);
      if (!validated.ok) return { success: false, message: validated.message };

      // CMS writes use the authenticated user's client — no Service Role escalation
      const db = authSupabase;

      // C1-safe draft save through the unified service (never touches `value`).
      const res = await storefrontService.saveDraftValue(db, data.key, validated.value, gate.scope);
      if (!res.ok) {
        console.error("[saveStorefrontDraft] Error:", res.message);
        return { success: false, message: res.message };
      }

      // Change log with value snapshots (enables version restore).
      try {
        const { data: userData } = await authSupabase.auth.getUser();
        await storefrontService.logChange(db, {
          userId,
          userEmail: userData?.user?.email ?? null,
          actionType: "save_draft",
          key: data.key,
          oldValue: res.oldValue,
          newValue: validated.value,
        });
      } catch {
        /* soft log failure */
      }

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
  .handler(async ({ data, context }: { data: any; context: any }): Promise<{ success: boolean; message?: string }> => {
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
  .handler(async ({ context }: { context: any }): Promise<{ success: boolean; message?: string; published: string[] }> => {
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
  old_value?: any;
};

/**
 * Fetch recent storefront change log entries (admin only).
 */
export const getStorefrontChangeLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { limit?: number } | undefined) => data)
  .handler(async ({ data, context }: { data: any; context: any }): Promise<ChangeLogEntry[]> => {
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
  .handler(async ({ data, context }: { data: any; context: any }): Promise<{ success: boolean; message?: string; key?: string }> => {
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
  .handler(async ({ data, context }: { data: any; context: any }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { supabase: authSupabase, userId } = context;

      const gate = await resolveCmsScope(authSupabase, userId);
      if (!gate.allowed) {
        return { success: false, message: "غير مسموح: يتطلب تسجيل الدخول للوحة التحكم" };
      }

      // S2: validate against the key's schema before writing to the live value.
      const validated = validateSettingValue(data.key, data.value);
      if (!validated.ok) return { success: false, message: validated.message };

      // CMS writes use the authenticated user's client — no Service Role escalation
      const db = authSupabase;

      // Direct live save through the unified service (snapshots the old value).
      const res = await storefrontService.saveLiveValue(db, data.key, validated.value, gate.scope);
      if (!res.ok) {
        console.error("[updateStorefrontAppearance] Error:", res.message);
        return { success: false, message: res.message };
      }

      // This write goes LIVE immediately → log it as a publish, with snapshots.
      try {
        const { data: userData } = await authSupabase.auth.getUser();
        await storefrontService.logChange(db, {
          userId,
          userEmail: userData?.user?.email ?? null,
          actionType: "publish",
          key: data.key,
          oldValue: res.oldValue,
          newValue: validated.value,
        });
      } catch {
        /* soft log failure */
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الإعدادات";
      return { success: false, message: msg };
    }
  });
