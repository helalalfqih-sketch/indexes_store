import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  HeroConfigSchema,
  ThemeConfigSchema,
  ProductsLayoutConfigSchema,
  CartConfigSchema,
  NavigationConfigSchema,
  type StorefrontSettingsShape,
} from "@/lib/domain/appearance";

/**
 * Fetch all global storefront settings from Supabase `storefront_settings` table.
 * Falls back gracefully to DEFAULT_STOREFRONT_SETTINGS if DB query fails or table does not exist yet.
 */
export const getStorefrontAppearance = createServerFn({ method: "GET" })
  .handler(async (): Promise<StorefrontSettingsShape> => {
    try {
      if (!supabase) return DEFAULT_STOREFRONT_SETTINGS;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("storefront_settings")
        .select("key, value");

      if (error || !data || data.length === 0) {
        return DEFAULT_STOREFRONT_SETTINGS;
      }

      const settingsMap = new Map<string, unknown>();
      data.forEach((row: { key: string; value: unknown }) => {
        settingsMap.set(row.key, row.value);
      });

      const heroRaw = settingsMap.get("hero") ?? {};
      const themeRaw = settingsMap.get("theme") ?? {};
      const productsLayoutRaw = settingsMap.get("products_layout") ?? {};
      const cartConfigRaw = settingsMap.get("cart_config") ?? {};
      const navigationRaw = settingsMap.get("navigation") ?? {};

      return {
        hero: HeroConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.hero).parse(heroRaw),
        theme: ThemeConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.theme).parse(themeRaw),
        products_layout: ProductsLayoutConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.products_layout).parse(productsLayoutRaw),
        cart_config: CartConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.cart_config).parse(cartConfigRaw),
        navigation: NavigationConfigSchema.catch(DEFAULT_STOREFRONT_SETTINGS.navigation).parse(navigationRaw),
      };
    } catch (err) {
      console.warn("[getStorefrontAppearance] Returning fallback defaults:", err);
      return DEFAULT_STOREFRONT_SETTINGS;
    }
  });

/**
 * Update a specific key in `storefront_settings` table.
 */
export const updateStorefrontAppearance = createServerFn({ method: "POST" })
  .validator((data: { key: keyof StorefrontSettingsShape; value: unknown }) => data)
  .handler(async ({ data }: { data: { key: keyof StorefrontSettingsShape; value: unknown } }): Promise<{ success: boolean; message?: string }> => {
    try {
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
        console.error("[updateStorefrontAppearance] Upsert error:", error);
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الإعدادات";
      return { success: false, message: msg };
    }
  });
