import { listShopifyProductsPage } from "@/lib/shopify/catalog.functions";
import { toLegacyProduct, type LegacyProductShape } from "@/lib/data-adapter";

export type CatalogPage = {
  items: LegacyProductShape[];
  endCursor: string | null;
  hasNextPage: boolean;
};

export async function fetchCatalogPage(input: {
  search?: string;
  categoryId?: string;
  first?: number;
  after?: string | null;
} = {}): Promise<CatalogPage> {
  const page = await listShopifyProductsPage({
    data: {
      search: input.search,
      categoryId: input.categoryId,
      first: input.first ?? 24,
      after: input.after ?? null,
    },
  });

  if (!page.configured) {
    return { items: [], endCursor: null, hasNextPage: false };
  }

  return {
    items: page.items
      .filter((item) => typeof item.price === "number" && item.price > 0)
      .map(toLegacyProduct),
    endCursor: page.endCursor,
    hasNextPage: page.hasNextPage,
  };
}
