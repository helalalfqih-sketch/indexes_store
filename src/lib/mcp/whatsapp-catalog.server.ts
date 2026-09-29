import {
  readBoundedJson,
  WHAPI_CHANNEL_ID,
  WHAPI_PHONE,
  WhapiError,
  type WhapiRuntime,
} from "@/lib/whapi.server";

const WHAPI_BASE = "https://gate.whapi.cloud";
const MAX_CATALOG_BYTES = 4 * 1024 * 1024;
const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

type CatalogListInput = {
  count: number;
  offset: number;
};

async function authorizedCatalogGet(path: string, runtime: WhapiRuntime = {}): Promise<unknown> {
  const token = runtime.token ?? process.env.WHAPI_TOKEN;
  if (!token?.trim()) throw new WhapiError("WHAPI_NOT_CONFIGURED", 503);
  const fetcher = runtime.fetcher ?? fetch;

  const get = async (apiPath: string, maxBytes = MAX_CATALOG_BYTES) => {
    try {
      const response = await fetcher(`${WHAPI_BASE}${apiPath}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new WhapiError(
          response.status === 429 ? "WHAPI_RATE_LIMITED" : "WHAPI_CATALOG_UPSTREAM_ERROR",
          response.status === 429 ? 429 : 502,
        );
      }
      return readBoundedJson(response, maxBytes);
    } catch (error) {
      if (error instanceof WhapiError) throw error;
      throw new WhapiError("WHAPI_CATALOG_UNAVAILABLE", 502);
    }
  };

  const health = (await get("/health", 128 * 1024)) as Record<string, unknown>;
  const status =
    health.status && typeof health.status === "object" && !Array.isArray(health.status)
      ? (health.status as Record<string, unknown>)
      : {};
  const user =
    health.user && typeof health.user === "object" && !Array.isArray(health.user)
      ? (health.user as Record<string, unknown>)
      : {};

  if (health.channel_id !== WHAPI_CHANNEL_ID) throw new WhapiError("WHAPI_CHANNEL_MISMATCH", 409);
  if (!(status.code === 4 && status.text === "AUTH"))
    throw new WhapiError("WHAPI_NOT_AUTHORIZED", 503);
  if (String(user.id) !== WHAPI_PHONE) throw new WhapiError("WHAPI_PHONE_MISMATCH", 409);

  return get(path);
}

function validatePage(input: CatalogListInput) {
  if (
    !Number.isSafeInteger(input.count) ||
    input.count < 1 ||
    input.count > 50 ||
    !Number.isSafeInteger(input.offset) ||
    input.offset < 0 ||
    input.offset > 10000
  ) {
    throw new WhapiError("INVALID_PAGINATION", 400);
  }
}

function validateId(value: string, label: string) {
  if (!ID_RE.test(value)) throw new WhapiError(`INVALID_${label}_ID`, 400);
}

export async function listWhatsAppCatalogProducts(
  input: CatalogListInput,
  runtime: WhapiRuntime = {},
) {
  validatePage(input);
  const params = new URLSearchParams({
    count: String(input.count),
    offset: String(input.offset),
  });
  return authorizedCatalogGet(`/business/products?${params}`, runtime);
}

export async function getWhatsAppCatalogProduct(productId: string, runtime: WhapiRuntime = {}) {
  validateId(productId, "PRODUCT");
  return authorizedCatalogGet(`/business/products/${encodeURIComponent(productId)}`, runtime);
}

export async function listWhatsAppCatalogCollections(
  input: CatalogListInput,
  runtime: WhapiRuntime = {},
) {
  validatePage(input);
  const params = new URLSearchParams({
    count: String(input.count),
    offset: String(input.offset),
  });
  return authorizedCatalogGet(`/business/collections?${params}`, runtime);
}

export async function getWhatsAppCatalogCollection(
  collectionId: string,
  runtime: WhapiRuntime = {},
) {
  validateId(collectionId, "COLLECTION");
  return authorizedCatalogGet(`/business/collections/${encodeURIComponent(collectionId)}`, runtime);
}

export async function listWhatsAppCatalogCollectionProducts(
  collectionId: string,
  productsCount: number,
  runtime: WhapiRuntime = {},
) {
  validateId(collectionId, "COLLECTION");
  if (!Number.isSafeInteger(productsCount) || productsCount < 1 || productsCount > 100) {
    throw new WhapiError("INVALID_PRODUCTS_COUNT", 400);
  }
  const params = new URLSearchParams({ products_count: String(productsCount) });
  return authorizedCatalogGet(
    `/business/collections/${encodeURIComponent(collectionId)}/products?${params}`,
    runtime,
  );
}
