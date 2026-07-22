// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
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

/** Zod schema per CMS key — writes are validated against these (S2). */
const SCHEMA_BY_KEY = {
  hero: HeroConfigSchema,
  theme: ThemeConfigSchema,
  products_layout: ProductsLayoutConfigSchema,
  product_page: ProductPageConfigSchema,
  cart_config: CartConfigSchema,
  checkout: CheckoutConfigSchema,
  navigation: NavigationConfigSchema,
  pages: PagesConfigSchema,
  translation: TranslationConfigSchema,
  notifications: NotificationsConfigSchema,
  sections: SectionsConfigSchema,
  seo: SeoConfigSchema,
  advanced: AdvancedConfigSchema,
};

/**
 * Validate an incoming CMS value against its key's schema.
 * Returns { ok, value } with the parsed (defaults-filled) value, or an Arabic error.
 */
function validateSettingValue(key: string, value: unknown): { ok: true; value: unknown } | { ok: false; message: string } {
  const schema = SCHEMA_BY_KEY[key];
  if (!schema) return { ok: false, message: `مفتاح إعدادات غير معروف: ${key}` };
  const parsed = schema.safeParse(value ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, message: `قيمة غير صالحة (${key}${issue?.path?.length ? "." + issue.path.join(".") : ""}): ${issue?.message ?? "خطأ تحقق"}` };
  }
  return { ok: true, value: parsed.data };
}

/**
 * Verify the caller of a public (middleware-less) server fn is a platform
 * admin, using the request bearer token verified against Supabase Auth.
 * Returns the service-role client when authorized, otherwise null.
 */
async function getAdminClientIfAuthorized() {
  try {
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
      if (!supabase) return DEFAULT_STOREFRONT_SETTINGS;

      // Preview (drafts) is ADMIN-ONLY: draft_value is no longer readable by
      // the anon role (column-scoped grant, S1), so the preview path verifies
      // the caller's bearer token and reads via the service role. An
      // unauthorized previewMode request silently degrades to published values.
      if (previewMode) {
        const adminClient = await getAdminClientIfAuthorized();
        if (adminClient) {
          const { data: rows, error } = await adminClient
            .from("storefront_settings")
            .select("key, value, draft_value");
          if (!error && rows && rows.length > 0) {
            return rowsToSettings(rows, true);
          }
        }
        // fall through → published values
      }

      // Public storefront read: published values only (never draft_value).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows, error } = await (supabase as any)
        .from("storefront_settings")
        .select("key, value");

      if (error || !rows || rows.length === 0) {
        return DEFAULT_STOREFRONT_SETTINGS;
      }

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

      const { data: isAdmin, error: roleErr } = await authSupabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      if (roleErr || !isAdmin) {
        return { success: false, message: "غير مسموح: يجب أن تكون مديراً لتعديل الإعدادات" };
      }

      // S2: validate the payload against the key's schema before storing.
      const validated = validateSettingValue(data.key, data.value);
      if (!validated.ok) return { success: false, message: validated.message };

      // C1 FIX: never touch the published `value` when saving a draft.
      // (The previous upsert wrote value:{} on conflict, wiping the live
      // configuration for that key.) UPDATE draft_value only; INSERT a fresh
      // row (with empty published value) only when the key doesn't exist yet.
      const { data: updatedRows, error } = await authSupabase
        .from("storefront_settings")
        .update({ draft_value: validated.value, updated_at: new Date().toISOString() })
        .eq("key", data.key)
        .select("key");

      if (!error && (!updatedRows || updatedRows.length === 0)) {
        const { error: insErr } = await authSupabase.from("storefront_settings").insert({
          key: data.key,
          value: {},
          draft_value: validated.value,
          type: "json",
        });
        if (insErr) {
          return { success: false, message: insErr.message };
        }
      }

      // Insert change log entry
      const { data: userData } = await authSupabase.auth.getUser();
      await authSupabase.from("storefront_change_logs").insert({
        user_id: userId,
        user_email: userData?.user?.email ?? null,
        action_type: "save_draft",
        key_changed: data.key,
      });

      if (error) {
        console.error("[saveStorefrontDraft] Error:", error);
        return { success: false, message: error.message };
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
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { supabase: authSupabase, userId } = context;

      const { data: isAdmin, error: roleErr } = await authSupabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      if (roleErr || !isAdmin) {
        return { success: false, message: "غير مسموح: يجب أن تكون مديراً لنشر الإعدادات" };
      }

      // Read current draft_value for this key
      const { data: row, error: fetchErr } = await authSupabase
        .from("storefront_settings")
        .select("draft_value")
        .eq("key", data.key)
        .single();

      if (fetchErr || !row) {
        return { success: false, message: "المفتاح غير موجود" };
      }

      if (row.draft_value == null) {
        return { success: false, message: "لا توجد مسودة للنشر" };
      }

      // Copy draft_value → value (publish)
      const { error } = await authSupabase
        .from("storefront_settings")
        .update({
          value: row.draft_value,
          draft_value: null,
          updated_at: new Date().toISOString(),
        })
        .eq("key", data.key);

      if (error) {
        return { success: false, message: error.message };
      }

      // Log the publish action
      const { data: userData } = await authSupabase.auth.getUser();
      await authSupabase.from("storefront_change_logs").insert({
        user_id: userId,
        user_email: userData?.user?.email ?? null,
        action_type: "publish",
        key_changed: data.key,
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

      const { data: isAdmin, error: roleErr } = await authSupabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      if (roleErr || !isAdmin) {
        return { success: false, message: "غير مسموح", published: [] };
      }

      // Fetch all rows that have a pending draft
      const { data: rows, error: fetchErr } = await authSupabase
        .from("storefront_settings")
        .select("key, draft_value")
        .not("draft_value", "is", null);

      if (fetchErr || !rows || rows.length === 0) {
        return { success: true, published: [], message: "لا توجد مسودات معلقة" };
      }

      const published: string[] = [];
      const { data: userData } = await authSupabase.auth.getUser();

      for (const row of rows) {
        const { error } = await authSupabase
          .from("storefront_settings")
          .update({
            value: row.draft_value,
            draft_value: null,
            updated_at: new Date().toISOString(),
          })
          .eq("key", row.key);

        if (!error) {
          published.push(row.key);
          await authSupabase.from("storefront_change_logs").insert({
            user_id: userId,
            user_email: userData?.user?.email ?? null,
            action_type: "publish",
            key_changed: row.key,
          });
        }
      }

      return { success: true, published };
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
      const { data: logs, error } = await authSupabase
        .from("storefront_change_logs")
        .select("id, user_email, action_type, key_changed, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !logs) return [];
      return logs as ChangeLogEntry[];
    } catch {
      return [];
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

      const { data: isAdmin, error: roleErr } = await authSupabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      if (roleErr || !isAdmin) {
        return { success: false, message: "غير مسموح: يجب أن تكون مديراً لتعديل المظهر" };
      }

      // S2: validate against the key's schema before writing to the live value.
      const validated = validateSettingValue(data.key, data.value);
      if (!validated.ok) return { success: false, message: validated.message };

      const { error } = await authSupabase
        .from("storefront_settings")
        .upsert(
          {
            key: data.key,
            value: validated.value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) {
        console.error("[updateStorefrontAppearance] Upsert error:", error);
        return { success: false, message: error.message };
      }

      // Log the direct save
      const { data: userData } = await authSupabase.auth.getUser();
      await authSupabase.from("storefront_change_logs").insert({
        user_id: userId,
        user_email: userData?.user?.email ?? null,
        action_type: "save_draft",
        key_changed: data.key,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الإعدادات";
      return { success: false, message: msg };
    }
  });
