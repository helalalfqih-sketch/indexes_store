import { listShopifyProductsPage } from "@/lib/shopify/catalog.functions";
import { toLegacyProduct, type LegacyProductShape } from "@/lib/data-adapter";
import { normalizeCategorySlug } from "@/lib/actions/category.actions";
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
  const categoryId = input.categoryId ? normalizeCategorySlug(input.categoryId) : undefined;

  const page = await listShopifyProductsPage({
    data: {
      search: input.search,
      categoryId,
      first: input.first ?? 24,
      after: input.after ?? null,
    },
  });

  if (!page.configured) {
    return { items: [], endCursor: null, hasNextPage: false };
  }

  return {
    items: page.items.filter(isCatalogProductReady).map(toLegacyProduct),
    endCursor: page.endCursor,
    hasNextPage: page.hasNextPage,
  };
}
