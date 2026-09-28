import { runWhapiReadTool } from "@/lib/mcp/whapi-full-tools.server";
import {
  readBoundedJson,
  readWhapi,
  WHAPI_PHONE,
  WhapiError,
  type WhapiRuntime,
} from "@/lib/whapi.server";

const WHAPI_BASE = "https://gate.whapi.cloud";
const CATALOG_CACHE_MS = 5 * 60 * 1000;
const COLLECTION_PRODUCT_LIMIT = 30;
const MAX_CATALOG_PRODUCTS = 1000;
const DEFAULT_RESULT_LIMIT = 5;

export const WHAPI_SELF_CHAT_ID = `${WHAPI_PHONE}@s.whatsapp.net`;
export const WHAPI_SELF_SEARCH_REPLY_PREFIX = "🔎 اندكس";

type RecordLike = Record<string, unknown>;

export type WhapiCatalogSearchProduct = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  currency: string | null;
  retailerId: string | null;
  reviewStatus: string | null;
  url: string | null;
};

type CatalogCache = {
  expiresAt: number;
  products: WhapiCatalogSearchProduct[];
};

let catalogCache: CatalogCache | null = null;

function asRecord(value: unknown): RecordLike {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : {};
}

function numberValue(value: unknown): number | null {
  const numeric =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numeric) ? numeric : null;
}

function collectionPrice(value: unknown): number | null {
  const numeric = numberValue(value);
  if (numeric === null) return null;
  return numeric / 1000;
}

function directPrice(value: unknown): number | null {
  return numberValue(value);
}

function normalizeCatalogProduct(
  value: unknown,
  source: "products" | "collection",
): WhapiCatalogSearchProduct | null {
  const product = asRecord(value);
  const id = typeof product.id === "string" ? product.id.trim() : "";
  const name = typeof product.name === "string" ? product.name.trim() : "";
  if (!/^\d+$/.test(id) || !name) return null;

  const review = asRecord(product.review);
  const retailerId =
    typeof product.product_retailer_id === "string"
      ? product.product_retailer_id
      : typeof product.retailerId === "string"
        ? product.retailerId
        : null;
  const reviewStatus =
    typeof review.whatsapp === "string"
      ? review.whatsapp
      : typeof product.reviewStatus === "string"
        ? product.reviewStatus
        : null;
  const hidden = product.is_hidden === true || product.isHidden === true;
  if (hidden) return null;

  return {
    id,
    name,
    description: typeof product.description === "string" ? product.description : "",
    price: source === "collection" ? collectionPrice(product.price) : directPrice(product.price),
    currency: typeof product.currency === "string" ? product.currency : null,
    retailerId,
    reviewStatus,
    url: typeof product.url === "string" ? product.url : null,
  };
}

function extractProducts(
  payload: unknown,
  source: "products" | "collection",
): WhapiCatalogSearchProduct[] {
  const record = asRecord(payload);
  const nestedProducts = asRecord(record.data).products;
  const raw: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray(record.products)
      ? record.products
      : Array.isArray(nestedProducts)
        ? nestedProducts
        : [];
  return raw.flatMap((value) => {
    const product = normalizeCatalogProduct(value, source);
    return product ? [product] : [];
  });
}

function isRecoverableProductListError(error: unknown): boolean {
  if (!(error instanceof WhapiError)) return false;
  return ["WHAPI_UPSTREAM_ERROR", "WHAPI_UNAVAILABLE", "WHAPI_REQUEST_FAILED"].includes(error.code);
}

async function loadDirectProducts(): Promise<WhapiCatalogSearchProduct[]> {
  const products = new Map<string, WhapiCatalogSearchProduct>();
  for (let offset = 0; offset < MAX_CATALOG_PRODUCTS; offset += 50) {
    const payload = await readWhapi({ resource: "products", count: 50, offset });
    const page = extractProducts(payload, "products");
    for (const product of page) products.set(product.id, product);
    if (page.length < 50) break;
  }
  return [...products.values()];
}

async function loadCollectionProducts(): Promise<WhapiCatalogSearchProduct[]> {
  const catalog = await runWhapiReadTool("getCollectionsList", { count: 50, offset: 0 });
  const collections = Array.isArray(asRecord(catalog).collections)
    ? (asRecord(catalog).collections as unknown[])
    : [];
  const ids = collections.flatMap((value) => {
    const collection = asRecord(value);
    const id = typeof collection.id === "string" ? collection.id : null;
    return id && /^\d+$/.test(id) ? [id] : [];
  });
  if (ids.length === 0) throw new WhapiError("WHAPI_COLLECTIONS_EMPTY", 502);

  const products = new Map<string, WhapiCatalogSearchProduct>();
  let successfulCollections = 0;

  for (let index = 0; index < ids.length; index += 4) {
    const batch = ids.slice(index, index + 4);
    const pages = await Promise.allSettled(
      batch.map((CollectionID) =>
        runWhapiReadTool("getCollectionProductList", {
          CollectionID,
          products_count: COLLECTION_PRODUCT_LIMIT,
        }),
      ),
    );
    for (const page of pages) {
      if (page.status !== "fulfilled") continue;
      successfulCollections += 1;
      for (const product of extractProducts(page.value, "collection")) {
        products.set(product.id, product);
      }
    }
  }

  if (successfulCollections === 0 || products.size === 0) {
    throw new WhapiError("WHAPI_COLLECTION_SEARCH_UNAVAILABLE", 502);
  }
  return [...products.values()];
}

export async function loadWhapiSearchCatalog(): Promise<WhapiCatalogSearchProduct[]> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache.products;

  await readWhapi({ resource: "health", count: 1, offset: 0 });

  let products: WhapiCatalogSearchProduct[];
  try {
    products = await loadDirectProducts();
    if (products.length === 0) throw new WhapiError("WHAPI_PRODUCTS_EMPTY", 502);
  } catch (error) {
    if (error instanceof WhapiError && error.code === "WHAPI_PRODUCTS_EMPTY") {
      products = await loadCollectionProducts();
    } else if (isRecoverableProductListError(error)) {
      products = await loadCollectionProducts();
    } else {
      throw error;
    }
  }

  catalogCache = {
    expiresAt: Date.now() + CATALOG_CACHE_MS,
    products,
  };
  return products;
}

export function normalizeWhapiCatalogSearch(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[،,؛;:!?؟()[\]{}"'“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ar");
}

function normalizeDigits(value: string): string {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return [...value]
    .map((char) => {
      const a = arabic.indexOf(char);
      if (a >= 0) return String(a);
      const e = eastern.indexOf(char);
      return e >= 0 ? String(e) : char;
    })
    .join("");
}

function requestedPrice(query: string): number | null {
  const normalized = normalizeDigits(query).replace(/[٬,]/g, "");
  const match = normalized.match(/(?:^|\s)(?:سعر|بسعر)?\s*(\d{2,9})(?:\s|$)/);
  if (!match) return null;
  const price = Number(match[1]);
  return Number.isSafeInteger(price) ? price : null;
}

function searchableQuery(query: string): string {
  return normalizeWhapiCatalogSearch(
    query
      .replace(/^\s*(?:ابحث\s+عن|ابحث|بحث)\s*[:：-]?\s*/i, "")
      .replace(/^\s*(?:سعر|بسعر)\s*[:：-]?\s*/i, ""),
  );
}

function scoreProduct(product: WhapiCatalogSearchProduct, query: string): number {
  const normalized = searchableQuery(query);
  const rawDigits = normalizeDigits(query).replace(/\D/g, "");
  const price = requestedPrice(query);
  const name = normalizeWhapiCatalogSearch(product.name);
  const description = normalizeWhapiCatalogSearch(product.description);
  let score = 0;

  if (rawDigits && (rawDigits === product.id || rawDigits === product.retailerId)) score += 1200;
  if (price !== null && product.price !== null && Math.round(product.price) === price) score += 800;

  if (normalized) {
    if (name === normalized) score += 700;
    else if (name.startsWith(normalized)) score += 520;
    else if (name.includes(normalized)) score += 420;

    const tokens = normalized
      .split(" ")
      .filter((token) => token.length >= 2 || /\p{Extended_Pictographic}/u.test(token));
    if (tokens.length) {
      const nameMatches = tokens.filter((token) => name.includes(token)).length;
      const descriptionMatches = tokens.filter((token) => description.includes(token)).length;
      score += nameMatches * 90 + descriptionMatches * 20;
      if (nameMatches === tokens.length) score += 180;
    }

    if (description.includes(normalized)) score += 70;
  }
  return score;
}

export function searchWhapiCatalogProducts(
  products: WhapiCatalogSearchProduct[],
  query: string,
  limit = DEFAULT_RESULT_LIMIT,
): WhapiCatalogSearchProduct[] {
  const boundedLimit = Math.max(1, Math.min(limit, 10));
  return products
    .map((product) => ({ product, score: scoreProduct(product, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "ar"))
    .slice(0, boundedLimit)
    .map((entry) => entry.product);
}

export async function searchWhapiCatalog(
  query: string,
  limit = DEFAULT_RESULT_LIMIT,
): Promise<WhapiCatalogSearchProduct[]> {
  const text = query.trim();
  if (!text || text.length > 120) throw new WhapiError("INVALID_CATALOG_SEARCH", 400);
  return searchWhapiCatalogProducts(await loadWhapiSearchCatalog(), text, limit);
}

function displayPrice(product: WhapiCatalogSearchProduct): string {
  if (product.price === null) return "غير محدد";
  const amount = Math.round(product.price).toLocaleString("en-US");
  return product.currency === "YER" || !product.currency
    ? `${amount} ر.ي`
    : `${amount} ${product.currency}`;
}

function statusLine(status: string | null): string {
  if (status === "APPROVED") return "✅ APPROVED";
  if (status === "OUTDATED") return "⚠️ OUTDATED";
  return status ? `ℹ️ ${status}` : "ℹ️ الحالة غير متاحة";
}

export function formatWhapiSelfSearchReply(
  query: string,
  products: WhapiCatalogSearchProduct[],
): string {
  const header = `${WHAPI_SELF_SEARCH_REPLY_PREFIX} — بحث: ${query.trim()}`;
  if (products.length === 0) return `${header}\n\nلم أجد منتجًا مطابقًا في كتالوج واتساب الحالي.`;

  const blocks = products.map(
    (product, index) =>
      `${index + 1}) ${product.name}\n💰 ${displayPrice(product)}\n${statusLine(product.reviewStatus)}\n🔗 https://wa.me/p/${product.id}/${WHAPI_PHONE}`,
  );
  return `${header}\n\n${blocks.join("\n\n")}`;
}

export function shouldHandleWhapiSelfSearch(input: {
  chatId: string;
  text: string | null;
}): boolean {
  const text = input.text?.trim() ?? "";
  return (
    input.chatId === WHAPI_SELF_CHAT_ID &&
    text.length > 0 &&
    text.length <= 120 &&
    !text.startsWith(WHAPI_SELF_SEARCH_REPLY_PREFIX)
  );
}

export async function sendWhapiSelfSearchText(
  body: string,
  runtime: WhapiRuntime = {},
): Promise<{ sent: true; messageId: string }> {
  const text = body.trim();
  if (!text || text.length > 4000) throw new WhapiError("INVALID_MESSAGE_BODY", 400);
  const token = runtime.token ?? process.env.WHAPI_TOKEN;
  if (!token?.trim()) throw new WhapiError("WHAPI_NOT_CONFIGURED", 503);
  const fetcher = runtime.fetcher ?? fetch;

  await readWhapi({ resource: "health", count: 1, offset: 0 }, { token, fetcher });

  let response: Response;
  try {
    response = await fetcher(`${WHAPI_BASE}/messages/text`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: WHAPI_SELF_CHAT_ID, body: text, typing_time: 0 }),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new WhapiError("WHAPI_SELF_SEARCH_SEND_UNKNOWN", 502);
  }

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new WhapiError(
      response.status === 429 ? "WHAPI_RATE_LIMITED" : "WHAPI_SELF_SEARCH_SEND_FAILED",
      response.status === 429 ? 429 : 502,
    );
  }

  const result = asRecord(await readBoundedJson(response, 64 * 1024));
  const message = asRecord(result.message);
  if (
    result.sent !== true ||
    typeof message.id !== "string" ||
    message.chat_id !== WHAPI_SELF_CHAT_ID
  ) {
    throw new WhapiError("WHAPI_SELF_SEARCH_SEND_UNCONFIRMED", 502);
  }
  return { sent: true, messageId: message.id };
}

export async function handleWhapiSelfSearchMessage(
  input: { id: string; chatId: string; text: string | null },
  dependencies: {
    search?: (query: string, limit?: number) => Promise<WhapiCatalogSearchProduct[]>;
    send?: (body: string) => Promise<unknown>;
  } = {},
): Promise<boolean> {
  if (!shouldHandleWhapiSelfSearch(input)) return false;
  const search = dependencies.search ?? searchWhapiCatalog;
  const send = dependencies.send ?? sendWhapiSelfSearchText;
  const results = await search(input.text!.trim(), DEFAULT_RESULT_LIMIT);
  await send(formatWhapiSelfSearchReply(input.text!.trim(), results));
  return true;
}
