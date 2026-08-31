import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ProductDTO } from "@/lib/domain/product";
import type { LegacyCategoryShape } from "@/lib/data-adapter";

type ShopifyImage = { url: string; altText?: string | null };
type ShopifyVariant = {
  id: string;
  sku?: string | null;
  barcode?: string | null;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  compareAtPrice?: { amount: string; currencyCode: string } | null;
};
type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  availableForSale: boolean;
  featuredImage?: ShopifyImage | null;
  images: { nodes: ShopifyImage[] };
  variants: { nodes: ShopifyVariant[] };
  productType: string;
  collections: { nodes: Array<{ handle: string }> };
};

type ShopifyProductsPage = {
  products: {
    nodes: ShopifyProduct[];
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
  lines: {
    nodes: Array<{
      id: string;
      quantity: number;
      cost: { totalAmount: { amount: string; currencyCode: string } };
      merchandise: {
        id: string;
        availableForSale: boolean;
        quantityAvailable?: number | null;
        product: { id: string; handle: string; title: string; featuredImage?: ShopifyImage | null };
        price: { amount: string; currencyCode: string };
      };
    }>;
  };
};

type CartPayload = {
  cart: ShopifyCart | null;
  userErrors: Array<{ field?: string[] | null; message: string; code?: string | null }>;
  warnings: Array<{ code: string; message: string; target?: string | null }>;
};

const API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2026-07";

function config() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (process.env.CATALOG_SOURCE !== "shopify" || !domain || !token) return null;
  return { domain, token };
}

export async function diagnoseShopifyCatalog() {
  const source = process.env.CATALOG_SOURCE || null;
  const domainPresent = Boolean(process.env.SHOPIFY_STORE_DOMAIN);
  const tokenPresent = Boolean(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN);
  const cfg = config();

  if (!cfg) {
    return {
      healthy: false,
      source,
      domainPresent,
      tokenPresent,
      apiVersion: API_VERSION,
      error: "Shopify catalog is not configured",
    };
  }

  try {
    const result = await storefront<{ products: { nodes: Array<{ id: string }> } }>(
      `query CatalogHealth { products(first: 1) { nodes { id } } }`,
    );
    return {
      healthy: true,
      source,
      domainPresent,
      tokenPresent,
      apiVersion: API_VERSION,
      sampleProducts: result.products.nodes.length,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Shopify error";
    return {
      healthy: false,
      source,
      domainPresent,
      tokenPresent,
      apiVersion: API_VERSION,
      error: message.slice(0, 300),
    };
  }
}

export async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const cfg = config();
  if (!cfg) throw new Error("Shopify catalog is not configured");
  const response = await fetch(`https://${cfg.domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": cfg.token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Shopify Storefront API failed: ${response.status}`);
  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (payload.errors?.length) throw new Error(payload.errors.map((e) => e.message).join("; "));
  if (!payload.data) throw new Error("Shopify Storefront API returned no data");
  return payload.data;
}

const PRODUCT_FIELDS = `
  id handle title description vendor tags createdAt updatedAt availableForSale productType
  featuredImage { url altText }
  images(first: 20) { nodes { url altText } }
  collections(first: 1) { nodes { handle } }
  variants(first: 20) {
    nodes {
      id sku barcode availableForSale
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
    }
  }
`;

const CART_FIELDS = `
  id checkoutUrl totalQuantity
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
  }
  lines(first: 100) {
    nodes {
      id quantity
      cost { totalAmount { amount currencyCode } }
      merchandise {
        ... on ProductVariant {
          id availableForSale
          price { amount currencyCode }
          product { id handle title featuredImage { url altText } }
        }
      }
    }
  }
`;

function toNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapProduct(product: ShopifyProduct): ProductDTO {
  const variant =
    product.variants.nodes.find((v) => v.availableForSale) ?? product.variants.nodes[0];
  const images = product.images.nodes.map((image) => image.url).filter(Boolean);
  if (product.featuredImage?.url && !images.includes(product.featuredImage.url)) {
    images.unshift(product.featuredImage.url);
  }
  const price = toNumber(variant?.price.amount) ?? 0;
  const compareAt = toNumber(variant?.compareAtPrice?.amount);
  const dto: ProductDTO = {
    id: product.id,
    slug: product.handle,
    name: product.title,
    description: product.description || product.title,
    price,
    currency: variant?.price.currencyCode || "YER",
    category_id: product.collections.nodes[0]?.handle || product.productType || "all",
    brand: product.vendor || null,
    images,
    videos: [],
    media: images.map((url) => ({ type: "image" as const, url })),
    model_url: null,
    // Storefront access does not always include exact inventory quantities.
    // Use a one/zero availability sentinel and let Shopify Cart validate the
    // requested quantity instead of taking down the storefront.
    stock: variant?.availableForSale ? 1 : 0,
    reserved_stock: 0,
    rating: 0,
    reviews_count: 0,
    tags: product.tags,
    is_published: product.availableForSale,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
    video_playback_id: null,
    sku: variant?.sku ?? null,
    barcode: variant?.barcode ?? null,
    compare_at_price: compareAt,
    availability: product.availableForSale ? "in stock" : "out of stock",
    source_url: null,
    shopify_product_id: product.id,
    shopify_variant_id: variant?.id ?? null,
  };
  return dto;
}

async function fetchShopifyProductPages(
  options: {
    query?: string | null;
    maxProducts?: number;
  } = {},
): Promise<ShopifyProduct[]> {
  const maxProducts = Math.max(1, Math.min(options.maxProducts ?? 1000, 1000));
  const products: ShopifyProduct[] = [];
  let cursor: string | null = null;

  while (products.length < maxProducts) {
    const first = Math.min(100, maxProducts - products.length);
    const result: ShopifyProductsPage = await storefront<ShopifyProductsPage>(
      `query Products($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
          nodes { ${PRODUCT_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first, after: cursor, query: options.query || null },
    );

    products.push(...result.products.nodes);
    if (!result.products.pageInfo.hasNextPage || !result.products.pageInfo.endCursor) break;
    cursor = result.products.pageInfo.endCursor;
  }

  return products;
}

const listInput = z
  .object({
    search: z.string().trim().max(120).optional(),
    categoryId: z.string().trim().max(255).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
  })
  .partial();

const adminListInput = z
  .object({
    search: z.string().trim().max(120).optional(),
    categoryId: z.string().trim().max(255).optional(),
    publishedOnly: z.boolean().optional(),
    unpublishedOnly: z.boolean().optional(),
    outOfStock: z.boolean().optional(),
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
  })
  .partial();

export const listShopifyAdminProducts = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => adminListInput.parse(raw ?? {}))
  .handler(async ({ data }) => {
    if (!config()) {
      return {
        configured: false as const,
        items: [] as ProductDTO[],
        total: 0,
        productsWithPrice: 0,
        productsWithImages: 0,
      };
    }

    const products = await fetchShopifyProductPages({
      query: data.search || null,
      maxProducts: 1000,
    });
    let items = products.map(mapProduct);

    if (data.categoryId) items = items.filter((product) => product.category_id === data.categoryId);
    if (data.publishedOnly) items = items.filter((product) => product.is_published);
    if (data.unpublishedOnly) items = items.filter((product) => !product.is_published);
    if (data.outOfStock) items = items.filter((product) => product.stock <= 0);

    const total = items.length;
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    return {
      configured: true as const,
      items: items.slice(offset, offset + pageSize),
      total,
      productsWithPrice: items.filter((product) => product.price > 0).length,
      productsWithImages: items.filter((product) => product.images.length > 0).length,
    };
  });

export const listShopifyProducts = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => listInput.parse(raw ?? {}))
  .handler(async ({ data }) => {
    if (!config()) return { configured: false as const, items: [] as ProductDTO[] };
    const offset = data.offset ?? 0;
    const requested = data.limit ? offset + data.limit : 1000;
    const filters = [
      data.search?.trim() || null,
      data.categoryId && data.categoryId !== "all" ? `collection:${data.categoryId}` : null,
    ].filter(Boolean);
    const products = await fetchShopifyProductPages({
      query: filters.length ? filters.join(" AND ") : null,
      maxProducts: requested,
    });
    const items = products.map(mapProduct);
    return {
      configured: true as const,
      items: items.slice(offset, data.limit ? offset + data.limit : undefined),
    };
  });

export const getShopifyProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string().trim().min(1) }).parse(raw))
  .handler(async ({ data }) => {
    if (!config()) return { configured: false as const, item: null as ProductDTO | null };
    const result = await storefront<{ product: ShopifyProduct | null }>(
      `query Product($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }`,
      { handle: data.slug },
    );
    return { configured: true as const, item: result.product ? mapProduct(result.product) : null };
  });

export const getShopifyProductsByIds = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ ids: z.array(z.string().min(1)).max(50) }).parse(raw),
  )
  .handler(async ({ data }) => {
    if (!config()) return { configured: false as const, items: [] as ProductDTO[] };
    const products = await fetchShopifyProductPages();
    const wanted = new Set(data.ids.map((id) => id.toLowerCase()));
    return {
      configured: true as const,
      items: products
        .filter((p) => wanted.has(p.id.toLowerCase()) || wanted.has(p.handle.toLowerCase()))
        .map(mapProduct),
    };
  });

export const listShopifyCategories = createServerFn({ method: "GET" }).handler(async () => {
  if (!config()) return { configured: false as const, items: [] as LegacyCategoryShape[] };
  const result = await storefront<{
    collections: { nodes: Array<{ handle: string; title: string; image?: ShopifyImage | null }> };
  }>(
    `query Collections { collections(first: 100, sortKey: TITLE) {
      nodes { handle title image { url altText } }
    } }`,
  );
  return {
    configured: true as const,
    items: result.collections.nodes.map((collection) => ({
      id: collection.handle,
      name: collection.title,
      icon: "Package",
      color: "from-violet-500 to-purple-700",
      imageUrl: collection.image?.url ?? null,
    })),
  };
});

const cartLineInput = z.object({
  merchandiseId: z.string().startsWith("gid://shopify/ProductVariant/"),
  quantity: z.number().int().min(1).max(250),
});

const cartIdInput = z.string().startsWith("gid://shopify/Cart/").max(2048);

function assertCartPayload(payload: CartPayload): ShopifyCart {
  if (payload.userErrors.length) {
    throw new Error(payload.userErrors.map((error) => error.message).join("; "));
  }
  if (!payload.cart) throw new Error("Shopify cart was not returned");
  return payload.cart;
}

export const createShopifyCart = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ lines: z.array(cartLineInput).min(1).max(100) }).parse(raw),
  )
  .handler(async ({ data }) => {
    const result = await storefront<{ cartCreate: CartPayload }>(
      `mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart { ${CART_FIELDS} }
          userErrors { field message code }
          warnings { code message target }
        }
      }`,
      { input: { lines: data.lines } },
    );
    return { cart: assertCartPayload(result.cartCreate), warnings: result.cartCreate.warnings };
  });

export const getShopifyCart = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ cartId: cartIdInput }).parse(raw))
  .handler(async ({ data }) => {
    const result = await storefront<{ cart: ShopifyCart | null }>(
      `query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
      { id: data.cartId },
    );
    return result.cart;
  });

export const addShopifyCartLines = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ cartId: cartIdInput, lines: z.array(cartLineInput).min(1).max(100) }).parse(raw),
  )
  .handler(async ({ data }) => {
    const result = await storefront<{ cartLinesAdd: CartPayload }>(
      `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { field message code }
          warnings { code message target }
        }
      }`,
      data,
    );
    return { cart: assertCartPayload(result.cartLinesAdd), warnings: result.cartLinesAdd.warnings };
  });

export const updateShopifyCartLines = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        cartId: cartIdInput,
        lines: z
          .array(
            z.object({
              id: z.string().startsWith("gid://shopify/CartLine/").max(2048),
              quantity: z.number().int().min(0).max(250),
            }),
          )
          .min(1)
          .max(100),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const result = await storefront<{ cartLinesUpdate: CartPayload }>(
      `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { field message code }
          warnings { code message target }
        }
      }`,
      data,
    );
    return {
      cart: assertCartPayload(result.cartLinesUpdate),
      warnings: result.cartLinesUpdate.warnings,
    };
  });

export const removeShopifyCartLines = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        cartId: cartIdInput,
        lineIds: z
          .array(z.string().startsWith("gid://shopify/CartLine/").max(2048))
          .min(1)
          .max(100),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const result = await storefront<{ cartLinesRemove: CartPayload }>(
      `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ${CART_FIELDS} }
          userErrors { field message code }
          warnings { code message target }
        }
      }`,
      data,
    );
    return {
      cart: assertCartPayload(result.cartLinesRemove),
      warnings: result.cartLinesRemove.warnings,
    };
  });
