import { listShopifyProductsPage } from "@/lib/shopify/catalog.functions";
import { toLegacyProduct, type LegacyProductShape } from "@/lib/data-adapter";
import { normalizeCategorySlug } from "@/lib/actions/category.actions";
import { listProducts } from "@/lib/catalog.functions";
import { isCatalogProductReady } from "@/lib/catalog-readiness";

export type CatalogPage = {
  items: LegacyProductShape[];
  endCursor: string | null;
  hasNextPage: boolean;
};

export async function fetchCatalogPage(
  input: {
    search?: string;
    categoryId?: string;
    first?: number;
    after?: string | null;
    sortBy?: "default" | "price-high" | "price-low" | "best-selling" | "newest";
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
    inStockOnly?: boolean;
  } = {},
): Promise<CatalogPage> {
  const categoryId = input.categoryId ? normalizeCategorySlug(input.categoryId) : undefined;
  const first = Math.min(input.first ?? 24, 99);

  const page = await listShopifyProductsPage({
    data: {
      search: input.search,
      categoryId,
      first,
      after: input.after ?? null,
      sortBy: input.sortBy,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      brands: input.brands,
      inStockOnly: input.inStockOnly,
    },
  });

  if (!page.configured) {
    const cursorMatch = input.after?.match(/^supabase:(\d+)$/);
    const offset = cursorMatch ? Number(cursorMatch[1]) : 0;
    const rows = await listProducts({
      data: {
        categoryId,
        search: input.search,
        limit: first + 1,
        offset,
        sortBy: input.sortBy,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        brands: input.brands,
        inStockOnly: input.inStockOnly,
      },
    });
    // `first + 1` is only a look-ahead. Advance the opaque cursor by the raw
    // rows consumed from the ordered result, even when readiness removes one
    // of them. Advancing by `readyRows.length` would overlap the next page and
    // could repeat products forever when an incomplete row is encountered.
    const consumedRows = rows.slice(0, first);
    const readyRows = consumedRows.filter(isCatalogProductReady);
    return {
      items: readyRows.map(toLegacyProduct),
      endCursor: consumedRows.length ? `supabase:${offset + consumedRows.length}` : null,
      hasNextPage: rows.length > first,
    };
  }

  return {
    items: page.items
      .filter((item) => typeof item.price === "number" && item.price > 0)
      .map(toLegacyProduct),
    endCursor: page.endCursor,
    hasNextPage: page.hasNextPage,
  };
}
