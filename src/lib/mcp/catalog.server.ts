import type { ProductDTO } from "@/lib/domain/product";
import { getShopifyProductBySlug, listShopifyProductsPage } from "@/lib/shopify/catalog.functions";

/** This adapter exposes only the configured Shopify Storefront's public catalog. */
export const PUBLIC_CATALOG_SOURCE = "shopify_storefront" as const;
export const PUBLIC_STORE_URL = "https://indexes-store.vercel.app";

const READ_TIMEOUT_MS = 10_000;
const MAX_PAGE_SIZE = 50;
const MAX_CURSOR_LENGTH = 2_048;
const SLUG_PATTERN = /^[\p{L}\p{N}\p{M}_-]+$/u;

function hasControlCharacters(value: string, disallowSpaces = false): boolean {
  const highestDisallowedCode = disallowSpaces ? 32 : 31;
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= highestDisallowedCode || code === 127;
  });
}

export interface PublicProduct {
  /** The public product slug, suitable for the fetch tool's id argument. */
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  available: boolean | null;
  url: string;
  imageUrl: string | null;
  updatedAt: string | null;
}

export interface CatalogAdapter {
  search(
    query: string,
    limit: number,
    cursor?: string,
  ): Promise<{ products: PublicProduct[]; nextCursor: string | null }>;
  fetch(id: string): Promise<PublicProduct | null>;
}

export class CatalogUnavailableError extends Error {
  constructor() {
    super("The public Shopify catalog is temporarily unavailable.");
    this.name = "CatalogUnavailableError";
  }
}

function validateSlug(id: string): string {
  if (typeof id !== "string" || id.length === 0 || id.length > 255 || !SLUG_PATTERN.test(id)) {
    throw new TypeError("Product id must be a public product slug.");
  }
  return id;
}

function publicImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 4_096) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function toPublicProduct(product: ProductDTO): PublicProduct | null {
  if (
    !product ||
    typeof product.slug !== "string" ||
    typeof product.name !== "string" ||
    !product.name.trim() ||
    typeof product.description !== "string" ||
    typeof product.price !== "number" ||
    !Number.isFinite(product.price) ||
    product.price < 0 ||
    typeof product.currency !== "string" ||
    !/^[A-Z]{3}$/.test(product.currency) ||
    !Array.isArray(product.images)
  ) {
    throw new CatalogUnavailableError();
  }

  let id: string;
  try {
    id = validateSlug(product.slug);
  } catch {
    throw new CatalogUnavailableError();
  }

  // The shared Storefront mapper uses 0 when a variant has no usable price.
  // Match the site's readiness rule rather than presenting that as a free item.
  if (product.price === 0) return null;

  const available =
    product.availability === "in stock"
      ? true
      : product.availability === "out of stock"
        ? false
        : null;
  const updatedAt =
    typeof product.updated_at === "string" && Number.isFinite(Date.parse(product.updated_at))
      ? product.updated_at
      : null;

  // Explicit projection is intentional: ProductDTO also has cost and operational fields.
  // Its stock property is an availability sentinel, never an inventory quantity.
  return {
    id,
    title: product.name.trim(),
    description: product.description,
    price: product.price,
    currency: product.currency,
    available,
    url: `${PUBLIC_STORE_URL}/product/${encodeURIComponent(id)}`,
    imageUrl: product.images.map(publicImageUrl).find((url) => url !== null) ?? null,
    updatedAt,
  };
}

async function readPublicCatalog<T>(read: () => Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // The existing server functions do not accept an AbortSignal. This bounds the
    // connector response time; it does not claim to cancel an in-flight request.
    return await Promise.race([
      Promise.resolve().then(read),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new CatalogUnavailableError()), READ_TIMEOUT_MS);
      }),
    ]);
  } catch {
    // Never return upstream messages, configuration details, or credentials to clients.
    throw new CatalogUnavailableError();
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

export function createCatalogAdapter(): CatalogAdapter {
  return {
    async search(query, limit, cursor) {
      if (
        typeof query !== "string" ||
        query.length > 120 ||
        hasControlCharacters(query) ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > MAX_PAGE_SIZE ||
        (cursor !== undefined &&
          (typeof cursor !== "string" ||
            cursor.length === 0 ||
            cursor.length > MAX_CURSOR_LENGTH ||
            hasControlCharacters(cursor, true)))
      ) {
        throw new TypeError("Invalid public catalog search arguments.");
      }

      const page = await readPublicCatalog(() =>
        listShopifyProductsPage({
          data: { search: query.trim() || undefined, first: limit, after: cursor },
        }),
      );
      if (
        !page ||
        page.configured !== true ||
        !Array.isArray(page.items) ||
        page.items.length > limit ||
        typeof page.hasNextPage !== "boolean"
      ) {
        throw new CatalogUnavailableError();
      }

      let nextCursor: string | null = null;
      if (page.hasNextPage) {
        if (
          typeof page.endCursor !== "string" ||
          !page.endCursor ||
          page.endCursor.length > MAX_CURSOR_LENGTH ||
          hasControlCharacters(page.endCursor, true) ||
          page.endCursor === cursor
        ) {
          throw new CatalogUnavailableError();
        }
        nextCursor = page.endCursor;
      }

      const products = page.items
        .map(toPublicProduct)
        .filter((product): product is PublicProduct => product !== null);
      return { products, nextCursor };
    },

    async fetch(id) {
      const slug = validateSlug(id);
      const result = await readPublicCatalog(() => getShopifyProductBySlug({ data: { slug } }));
      if (!result || result.configured !== true) throw new CatalogUnavailableError();
      if (result.item === null) return null;
      if (!result.item || result.item.slug !== slug) throw new CatalogUnavailableError();
      return toPublicProduct(result.item);
    },
  };
}
