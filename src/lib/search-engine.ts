import { fetchProducts } from "@/lib/actions/product.actions";
import type { LegacyProductShape } from "@/lib/data-adapter";

export const MIN_RELEVANCE_SCORE = 8;
export const SEARCH_PAGE_SIZE = 40;

/** Arabic Text Normalizer & Typo Tolerator */
export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ىئ]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ");
}

const SYNONYM_MAP: Record<string, string[]> = {
  كميرا: ["كاميرا", "camera", "عدسة", "تصوير"],
  كاميرا: ["كميرا", "camera", "عدسة", "تصوير"],
  camera: ["كاميرا", "كميرا", "عدسة"],
  ساعه: ["ساعة", "ساعات", "watch", "smartwatch"],
  ساعة: ["ساعه", "ساعات", "watch", "smartwatch"],
  watch: ["ساعة", "ساعات", "smartwatch"],
  جوال: ["هاتف", "موبايل", "phone", "mobile", "آيفون", "سامسونج"],
  هاتف: ["جوال", "موبايل", "phone", "mobile"],
  phone: ["هاتف", "جوال", "موبايل", "mobile"],
  منشار: ["منشار", "تقليم", "saw", "قطع", "كهربائي"],
  saw: ["منشار", "تقليم"],
  سماعه: ["سماعة", "سماعات", "speaker", "headphone", "audio"],
  سماعة: ["سماعه", "سماعات", "speaker", "headphone", "audio"],
  speaker: ["سماعة", "سماعات", "صوت"],
  شاشه: ["شاشة", "تلفزيون", "tv", "screen", "monitor"],
  شاشة: ["شاشه", "تلفزيون", "tv", "screen", "monitor"],
  tv: ["شاشة", "تلفزيون", "screen"],
};

function getExpandedTokens(query: string): string[] {
  const normalized = normalizeArabic(query);
  const rawTokens = normalized.split(" ").filter((t) => t.length > 0);
  const set = new Set<string>();
  for (const token of rawTokens) {
    set.add(token);
    SYNONYM_MAP[token]?.forEach((s) => set.add(normalizeArabic(s)));
  }
  return Array.from(set);
}

export interface SearchFilterOptions {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  dealsOnly?: boolean;
  inStockOnly?: boolean;
  brand?: string;
  sortBy?: "bestselling" | "latest" | "price_asc" | "price_desc" | "rating";
}

const STOP_WORDS = new Set([
  "no",
  "product",
  "products",
  "item",
  "items",
  "the",
  "a",
  "an",
  "in",
  "on",
  "of",
  "to",
  "for",
  "with",
  "and",
  "or",
  "is",
  "من",
  "في",
  "على",
  "عن",
  "مع",
  "لا",
  "او",
  "ام",
  "ال",
  "ما",
  "هذا",
  "هذه",
]);

function rankCandidates(products: LegacyProductShape[], query: string): LegacyProductShape[] {
  if (!query.trim()) return products;
  const contentTokens = getExpandedTokens(query).filter((t) => !STOP_WORDS.has(t) && t.length >= 3);
  if (contentTokens.length === 0) return [];

  return products
    .map((p) => {
      let score = 0;
      const rec = p as Record<string, unknown>;
      const normName = normalizeArabic(p.name);
      const normDesc = normalizeArabic(p.description || "");
      const normBrand = normalizeArabic(String(rec.brand || ""));
      const normCat = normalizeArabic(String(rec.category_name || p.categoryId || ""));
      const normSku = normalizeArabic(String(rec.sku || ""));
      const normBarcode = normalizeArabic(String(rec.barcode || ""));
      const tags = Array.isArray(rec.tags) ? rec.tags.join(" ") : String(rec.tags || "");
      const normTags = normalizeArabic(tags);

      for (const token of contentTokens) {
        if (normName.includes(token)) score += 10;
        if (normSku.includes(token) || normBarcode.includes(token)) score += 8;
        if (normBrand.includes(token)) score += 6;
        if (normCat.includes(token)) score += 5;
        if (normTags.includes(token)) score += 4;
        if (normDesc.includes(token)) score += 2;
      }
      return { product: p, score };
    })
    .filter((entry) => entry.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);
}

/**
 * Advanced storefront search.
 * Search the source first, then scan matching pages before applying secondary
 * filters. A price filter must not hide matches beyond the first candidate page.
 * React Query owns caching; no module cache can survive stock changes forever.
 */
export async function searchProductsAdvanced(
  options: SearchFilterOptions = {},
  signal?: AbortSignal,
): Promise<LegacyProductShape[]> {
  const {
    search = "",
    categoryId,
    minPrice,
    maxPrice,
    dealsOnly,
    inStockOnly,
    brand,
    sortBy,
  } = options;
  const candidates: LegacyProductShape[] = [];
  const seen = new Set<string>();
  for (let offset = 0; ; offset += 100) {
    if (signal?.aborted) throw new DOMException("Search aborted", "AbortError");
    const page = await fetchProducts({
      search: search.trim() || undefined,
      categoryId: categoryId && categoryId !== "all" ? categoryId : undefined,
      limit: 100,
      offset,
    });
    let added = 0;
    for (const product of page) {
      if (!seen.has(product.id)) {
        candidates.push(product);
        seen.add(product.id);
        added += 1;
      }
    }
    if (page.length < 100 || added === 0) break;
  }
  if (signal?.aborted) throw new DOMException("Search aborted", "AbortError");

  let filtered = candidates.filter((p) => {
    const rec = p as Record<string, unknown>;
    if (brand && brand !== "all" && String(rec.brand || "").toLowerCase() !== brand.toLowerCase())
      return false;
    if (minPrice !== undefined && p.price < minPrice) return false;
    if (maxPrice !== undefined && p.price > maxPrice) return false;
    if (dealsOnly) {
      const isOffer =
        p.isDeal ||
        (typeof p.oldPrice === "number" && p.oldPrice > p.price) ||
        Boolean(p.badge && (p.badge.includes("عرض") || p.badge.includes("خصم")));
      if (!isOffer) return false;
    }
    if (inStockOnly) {
      const stock = rec.stock;
      if (stock !== undefined && Number(stock) <= 0) return false;
    }
    return true;
  });

  filtered = rankCandidates(filtered, search);

  switch (sortBy) {
    case "price_asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "latest":
      filtered.sort((a, b) => {
        const ar = a as Record<string, unknown>;
        const br = b as Record<string, unknown>;
        return (
          new Date(String(br.created_at || 0)).getTime() -
          new Date(String(ar.created_at || 0)).getTime()
        );
      });
      break;
    case "rating":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case "bestselling":
    default:
      // Preserve source/relevance order; review counts are not sales figures.
      break;
  }

  if (signal?.aborted) throw new DOMException("Search aborted", "AbortError");
  return filtered;
}

export async function getRecommendations(limit = 8): Promise<LegacyProductShape[]> {
  const products = await fetchProducts({ limit: Math.min(Math.max(limit, 1), 24) });
  return [...products]
    .sort((a, b) => (b.rating ?? 0) * (b.reviews ?? 0) - (a.rating ?? 0) * (a.reviews ?? 0))
    .slice(0, limit);
}

export function rankSearchResults(
  products: LegacyProductShape[],
  query: string,
): LegacyProductShape[] {
  return rankCandidates([...products], query);
}

export interface SearchSuggestionItem {
  id: string;
  type: "product" | "category" | "keyword";
  title: string;
  subtitle?: string;
  image?: string;
  price?: number;
  count?: number;
  slug?: string;
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestionItem[]> {
  const q = query.trim();
  if (!q) return [];

  const matched = await searchProductsAdvanced({ search: q });
  const suggestions: SearchSuggestionItem[] = matched.slice(0, 4).map((p) => ({
    id: p.id,
    type: "product" as const,
    title: p.name,
    subtitle: String((p as Record<string, unknown>).category_name || "منتج"),
    image: p.image,
    price: p.price,
    slug: p.slug,
  }));

  if (matched.length > 0) {
    suggestions.push({
      id: `keyword-${q}`,
      type: "keyword",
      title: `البحث عن "${q}" في جميع الأقسام`,
      subtitle: `عرض أول ${matched.length} نتيجة`,
      count: matched.length,
    });
  }

  return suggestions;
}
