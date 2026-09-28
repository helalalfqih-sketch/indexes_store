type PageInfo = { hasNextPage: boolean; endCursor: string | null };
type Connection<T> = { nodes: T[]; pageInfo: PageInfo };
type Image = { url: string };
type FeedMedia = {
  __typename: string;
  sources?: Array<{ url: string; format: string; mimeType: string }>;
  originUrl?: string | null;
};

export type FeedVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  image: Image | null;
};

export type FeedProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  onlineStoreUrl: string | null;
  featuredImage: Image | null;
  images: { nodes: Image[] };
  media: { nodes: FeedMedia[] };
  variants: Connection<FeedVariant>;
};

export type StorefrontQuery = <T>(query: string, variables: Record<string, unknown>) => Promise<T>;

const VARIANT_FIELDS = `
  id title availableForSale
  price { amount currencyCode }
  image { url }
`;

export const FEED_PRODUCTS_QUERY = `
  query MetaCatalogProducts($after: String) {
    products(first: 50, after: $after, sortKey: ID) {
      nodes {
        id handle title description vendor onlineStoreUrl
        featuredImage { url }
        images(first: 10) { nodes { url } }
        media(first: 10) {
          nodes {
            __typename
            ... on Video {
              sources { url format mimeType }
            }
            ... on ExternalVideo {
              originUrl
            }
          }
        }
        variants(first: 20) {
          nodes { ${VARIANT_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const FEED_VARIANTS_QUERY = `
  query MetaCatalogVariants($id: ID!, $after: String) {
    product(id: $id) {
      variants(first: 100, after: $after) {
        nodes { ${VARIANT_FIELDS} }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

const ADDITIONAL_IMAGE_HEADERS = Array.from(
  { length: 10 },
  (_, index) => `additional_image_link[${index}]`,
);

const HEADERS = [
  "id",
  "item_group_id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  ...ADDITIONAL_IMAGE_HEADERS,
  "video[0].url",
  "video[0].tag[0]",
];

function httpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function httpsImage(image: Image | null | undefined): string | null {
  return httpsUrl(image?.url);
}

function productVideoUrl(media: FeedMedia[] | null | undefined): string | null {
  for (const item of media ?? []) {
    if (item.__typename === "Video") {
      const sources = item.sources ?? [];
      const source =
        sources.find((candidate) => candidate.mimeType === "video/mp4") ??
        sources.find((candidate) => candidate.format.toLowerCase() === "mp4") ??
        sources[0];
      const url = httpsUrl(source?.url);
      if (url) return url;
    }
    if (item.__typename === "ExternalVideo") {
      const url = httpsUrl(item.originUrl);
      if (url) return url;
    }
  }
  return null;
}

function numericId(id: string, kind: "Product" | "ProductVariant"): string {
  const prefix = `gid://shopify/${kind}/`;
  const value = id.startsWith(prefix) ? id.slice(prefix.length) : "";
  if (!/^\d+$/.test(value)) throw new Error("Invalid Shopify catalog identifier");
  return value;
}

function nextCursor(page: PageInfo, previous: string | null): string | null {
  if (!page.hasNextPage) return null;
  if (!page.endCursor || page.endCursor === previous) {
    throw new Error("Incomplete Shopify catalog pagination");
  }
  return page.endCursor;
}

/** Public Storefront products only; never substitutes legacy or sample data. */
export async function buildShopifyMetaFeed(query: StorefrontQuery, baseUrl: string) {
  const rows: string[][] = [];
  const ids = new Set<string>();
  let skippedVariants = 0;
  let after: string | null = null;

  do {
    const page = await query<{ products: Connection<FeedProduct> }>(FEED_PRODUCTS_QUERY, { after });

    for (const product of page.products.nodes) {
      const groupId = numericId(product.id, "Product");
      const variants = [...product.variants.nodes];
      let variantCursor = nextCursor(product.variants.pageInfo, null);
      while (variantCursor) {
        const more = await query<{ product: { variants: Connection<FeedVariant> } | null }>(
          FEED_VARIANTS_QUERY,
          { id: product.id, after: variantCursor },
        );
        if (!more.product) throw new Error("Shopify product changed during export");
        variants.push(...more.product.variants.nodes);
        variantCursor = nextCursor(more.product.variants.pageInfo, variantCursor);
      }

      for (const variant of variants) {
        const id = numericId(variant.id, "ProductVariant");
        if (ids.has(id)) throw new Error("Duplicate Shopify variant in catalog export");
        ids.add(id);
        const images = [
          ...new Set(
            [variant.image, product.featuredImage, ...product.images.nodes]
              .map(httpsImage)
              .filter((url): url is string => Boolean(url)),
          ),
        ];
        const additionalImages = Array.from({ length: 10 }, (_, index) => images[index + 1] ?? "");
        const videoUrl = productVideoUrl(product.media?.nodes);
        const price = Number(variant.price.amount);
        if (
          !product.title.trim() ||
          !product.handle ||
          !images.length ||
          !Number.isFinite(price) ||
          price <= 0 ||
          !/^[A-Z]{3}$/.test(variant.price.currencyCode)
        ) {
          skippedVariants++;
          continue;
        }
        const title =
          variant.title && variant.title !== "Default Title"
            ? `${product.title} — ${variant.title}`
            : product.title;
        const canonicalUrl = httpsImage(
          product.onlineStoreUrl ? { url: product.onlineStoreUrl } : null,
        );
        const url = new URL(
          canonicalUrl || `/product/${encodeURIComponent(product.handle)}`,
          baseUrl,
        );
        // Stable numeric variant IDs match the existing Shopify Meta catalog.
        url.searchParams.set("variant", id);
        rows.push([
          id,
          groupId,
          title,
          product.description.trim() || product.title,
          variant.availableForSale ? "in stock" : "out of stock",
          "new",
          `${price.toFixed(2)} ${variant.price.currencyCode}`,
          url.href,
          images[0],
          product.vendor.trim() || "Indexes Store",
          ...additionalImages,
          videoUrl ?? "",
          "",
        ]);
      }
    }
    after = nextCursor(page.products.pageInfo, after);
  } while (after);

  // Do not serve a successful empty replacement that could clear Meta catalogs.
  if (!rows.length) throw new Error("No eligible Shopify catalog items");
  const csv =
    [
      HEADERS.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${value.replace(/\r\n?/g, "\n").replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n") + "\n";
  return { csv, itemCount: rows.length, skippedVariants };
}
