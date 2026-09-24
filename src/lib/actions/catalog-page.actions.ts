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
  } = {},
): Promise<CatalogPage> {
  const first = Math.max(1, Math.min(99, Math.trunc(input.first ?? 24)));
  const isSupabaseCursor = input.after?.startsWith("supabase:") ?? false;
  if (!isSupabaseCursor) {
    const page = await listShopifyProductsPage({
      data: {
        search: input.search,
        categoryId: input.categoryId ? normalizeCategorySlug(input.categoryId) : undefined,
        first,
        after: input.after ?? null,
      },
    });
    if (page.configured) {
      return {
        items: page.items.filter(isCatalogProductReady).map(toLegacyProduct),
        endCursor: page.endCursor,
        hasNextPage: page.hasNextPage,
      };
    }
  }
  const offset = isSupabaseCursor ? Number(input.after?.slice("supabase:".length)) : 0;
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error("Invalid catalog cursor");
  // Read one extra row to establish continuation, scoped by the existing public
  // server function. Use the raw row count: unreadable products must not end paging.
  const rows = await listProducts({
    data: {
      search: input.search,
      categoryId: input.categoryId,
      limit: first + 1,
      offset,
    },
  });
  const hasNextPage = rows.length > first;
  return {
    items: rows.slice(0, first).filter(isCatalogProductReady).map(toLegacyProduct),
    hasNextPage,
    endCursor: hasNextPage ? `supabase:${offset + first}` : null,
  };
}
