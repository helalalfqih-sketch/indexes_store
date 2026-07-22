/**
 * Storefront CMS validators — every CMS write is validated here before it
 * touches the database (no corrupted/unknown structures can be stored).
 *
 * The schemas themselves live in `@/lib/domain/appearance` (single source of
 * shape truth); this module maps them to their storage keys and exposes a
 * uniform validate helper with Arabic error messages.
 */
import {
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
} from "@/lib/domain/appearance";

/** Zod schema per CMS storage key. */
export const SCHEMA_BY_KEY: Record<string, { safeParse: (v: unknown) => any }> = {
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

export type ValidationResult =
  | { ok: true; value: unknown }
  | { ok: false; message: string };

/**
 * Validate an incoming CMS value against its key's schema.
 * Returns the parsed (defaults-filled) value, or an Arabic error message.
 */
export function validateSettingValue(key: string, value: unknown): ValidationResult {
  const schema = SCHEMA_BY_KEY[key];
  if (!schema) return { ok: false, message: `مفتاح إعدادات غير معروف: ${key}` };
  const parsed = schema.safeParse(value ?? {});
  if (!parsed.success) {
    const issue = parsed.error?.issues?.[0];
    const path = issue?.path?.length ? `.${issue.path.join(".")}` : "";
    return {
      ok: false,
      message: `قيمة غير صالحة (${key}${path}): ${issue?.message ?? "خطأ تحقق"}`,
    };
  }
  return { ok: true, value: parsed.data };
}
