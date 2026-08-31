/**
 * Category Actions — UI-facing entry point for category data.
 * See product.actions.ts for the layering contract.
 */
import { z } from "zod";
import { listCategories, getCategoryBySlug as getCategoryBySlugFn } from "@/lib/catalog.functions";
import { fallbackCategories, toLegacyCategory, type LegacyCategoryShape } from "@/lib/data-adapter";
import type { CategoryWithMetaDTO } from "@/lib/repositories/categories.repo";
import { diagnoseShopifyCatalog, listShopifyCategories } from "@/lib/shopify/catalog.functions";
import { categories as seedCategories } from "@/lib/store-data";

const seedByKey = new Map<string, (typeof seedCategories)[number]>();
for (const c of seedCategories) seedByKey.set(c.id, c);

const enrich = (c: LegacyCategoryShape): LegacyCategoryShape => {
  const seed = seedByKey.get(c.id);
  if (!seed) return c;
  return {
    ...c,
    icon: c.icon || seed.icon,
    color: c.color || seed.color,
  };
};

const mapMany = (rows: CategoryWithMetaDTO[]): LegacyCategoryShape[] =>
  rows.map((r) => enrich(toLegacyCategory(r)));

const CATEGORY_ALIASES: Record<string, string> = {
  tools_hardware: "tools",
  "tools-hardware": "tools",
};

export const normalizeCategorySlug = (slug: string): string => {
  const normalized = slug.trim().toLowerCase().replace(/\s+/g, "-");
  return CATEGORY_ALIASES[normalized] ?? normalized.replace(/_/g, "-");
};

export async function fetchCategories(): Promise<LegacyCategoryShape[]> {
  try {
    const shopify = await listShopifyCategories();
    if (shopify.configured) return shopify.items;
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[category.actions] Shopify collections fallback:", err);
    const status = await diagnoseShopifyCatalog();
    if (status.source === "shopify") throw err;
  }
  try {
    const rows = await listCategories({});
    if (rows.length === 0) return fallbackCategories().map(toLegacyCategory).map(enrich);
    return mapMany(rows);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[category.actions] fetchCategories fallback:", err);
    return fallbackCategories().map(toLegacyCategory).map(enrich);
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<LegacyCategoryShape | null> {
  const parsed = z.string().trim().min(1).parse(slug);
  const normalized = normalizeCategorySlug(parsed);
  try {
    const shopify = await listShopifyCategories();
    if (shopify.configured) {
      return (
        shopify.items.find((category) => normalizeCategorySlug(category.id) === normalized) ?? null
      );
    }
  } catch (err) {
    if (import.meta.env.DEV)
      console.warn("[category.actions] Shopify category lookup failed:", err);
    const status = await diagnoseShopifyCatalog();
    if (status.source === "shopify") throw err;
  }
  try {
    const dto = await getCategoryBySlugFn({ data: { slug: normalized } });
    if (dto) return enrich(toLegacyCategory(dto));
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[category.actions] fetchCategoryBySlug fallback:", err);
  }
  const seed = fallbackCategories().find((c) => normalizeCategorySlug(c.slug) === normalized);
  return seed ? enrich(toLegacyCategory(seed)) : null;
}
