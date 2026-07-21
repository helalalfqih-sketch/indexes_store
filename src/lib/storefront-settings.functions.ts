/**
 * Server functions for global storefront appearance settings.
 * - getStorefrontSettings: public read (no auth required)
 * - saveStorefrontSettings: admin-only write (JWT role = admin)
 *
 * Data is stored in `storefront_settings` table (key/value JSONB rows).
 * Falls back to DEFAULT_STOREFRONT_SETTINGS if table is empty or unavailable.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
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

function getSupabaseClient() {
  const url =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";
  if (!url || !key) return null;
  return createClient(url, key);
}

// ── Public read — anyone can read storefront layout/theme ──────────────────
export const getStorefrontSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<StorefrontSettingsShape> => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return DEFAULT_STOREFRONT_SETTINGS;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("storefront_settings")
        .select("key, value");

      if (error || !data || data.length === 0) {
        return DEFAULT_STOREFRONT_SETTINGS;
      }

      const map = new Map<string, unknown>(
        (data as { key: string; value: unknown }[]).map((r) => [r.key, r.value])
      );

      return {
        hero: HeroConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.hero).parse(
          map.get("hero") ?? {}
        ),
        theme: ThemeConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.theme).parse(
          map.get("theme") ?? {}
        ),
        products_layout: ProductsLayoutConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.products_layout
        ).parse(map.get("products_layout") ?? {}),
        product_page: ProductPageConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.product_page
        ).parse(map.get("product_page") ?? {}),
        cart_config: CartConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.cart_config
        ).parse(map.get("cart_config") ?? {}),
        checkout: CheckoutConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.checkout
        ).parse(map.get("checkout") ?? {}),
        navigation: NavigationConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.navigation
        ).parse(map.get("navigation") ?? {}),
        pages: PagesConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.pages
        ).parse(map.get("pages") ?? {}),
        translation: TranslationConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.translation
        ).parse(map.get("translation") ?? {}),
        notifications: NotificationsConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.notifications
        ).parse(map.get("notifications") ?? {}),
        sections: SectionsConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.sections
        ).parse(map.get("sections") ?? {}),
        seo: SeoConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.seo
        ).parse(map.get("seo") ?? {}),
        advanced: AdvancedConfigSchema.catch(
          DEFAULT_STOREFRONT_SETTINGS.advanced
        ).parse(map.get("advanced") ?? {}),
      };
    } catch (err) {
      console.warn("[getStorefrontSettings] fallback to defaults:", err);
      return DEFAULT_STOREFRONT_SETTINGS;
    }
  }
);

// ── Admin write — requires admin role in JWT ────────────────────────────────
export const saveStorefrontSettings = createServerFn({
  method: "POST",
})
  .validator(
    (raw: unknown): { key: keyof StorefrontSettingsShape; value: unknown } => {
      if (
        typeof raw !== "object" ||
        raw === null ||
        !("key" in raw) ||
        !("value" in raw)
      ) {
        throw new Error("Invalid payload");
      }
      return raw as { key: keyof StorefrontSettingsShape; value: unknown };
    }
  )
  .handler(
    async ({
      data,
    }: {
      data: { key: keyof StorefrontSettingsShape; value: unknown };
    }): Promise<{ success: boolean; message?: string }> => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          return { success: false, message: "تعذر الاتصال بقاعدة البيانات" };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("storefront_settings")
          .upsert(
            {
              key: data.key,
              value: data.value,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          );

        if (error) {
          return { success: false, message: error.message };
        }

        return { success: true };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "خطأ غير متوقع أثناء الحفظ";
        return { success: false, message: msg };
      }
    }
  );
