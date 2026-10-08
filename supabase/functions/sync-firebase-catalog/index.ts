import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

interface CatalogProduct {
  id?: string;
  external_id?: string;
  title?: string;
  name?: string;
  slug?: string;
  price?: number | string;
  description?: string;
  status?: string;
  images?: string[];
  image_url?: string;
}

interface SyncPayload {
  tenant_id?: string;
  catalog_url?: string;
  products?: CatalogProduct[];
}

interface NormalizedMediaUrl {
  url: string;
  storageProvider: "supabase" | null;
  storageBucket: string | null;
  objectKey: string | null;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-catalog-sync-secret",
};

const DEFAULT_TENANT_ID = "9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a";
const MAX_REQUEST_BYTES = 1024 * 1024;
const MAX_PRODUCTS_PER_REQUEST = 200;
const MAX_IMAGES_PER_PRODUCT = 8;
const MAX_MEDIA_URL_CHARS = 2_048;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class RequestTooLargeError extends Error {
  constructor() {
    super("Request payload exceeds 1MB");
    this.name = "RequestTooLargeError";
  }
}

async function readJsonBody(req: Request): Promise<SyncPayload> {
  const declaredLength = req.headers.get("content-length");
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (Number.isFinite(bytes) && bytes > MAX_REQUEST_BYTES) throw new RequestTooLargeError();
  }
  if (!req.body) return {};

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new RequestTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (total === 0) return {};
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(body)) as SyncPayload;
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    status,
  });
}

function truncate(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function secretsMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeMediaUrl(value: string): NormalizedMediaUrl | null {
  const raw = value.trim();
  if (!raw || raw.length > MAX_MEDIA_URL_CHARS) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
  parsed.hash = "";

  const isSupabaseHost =
    parsed.hostname === "supabase.co" || parsed.hostname.endsWith(".supabase.co");
  const storageMatch = isSupabaseHost
    ? parsed.pathname.match(/^\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/)
    : null;

  if (storageMatch?.[1] && storageMatch[2]) {
    const bucket = safeDecode(storageMatch[1]).slice(0, 255);
    const objectKey = safeDecode(storageMatch[2]).slice(0, 1_024);
    if (!bucket || !objectKey) return null;

    parsed.pathname = `/storage/v1/object/public/${storageMatch[1]}/${storageMatch[2]}`;
    parsed.search = "";
    return {
      url: parsed.toString(),
      storageProvider: "supabase",
      storageBucket: bucket,
      objectKey,
    };
  }

  return {
    url: parsed.toString(),
    storageProvider: null,
    storageBucket: null,
    objectKey: null,
  };
}

function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = safeDecode(pathname.split("/").filter(Boolean).pop() || "media");
    const safeName = Array.from(lastSegment, (character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint < 32 || codePoint === 127 ? "_" : character;
    }).join("");
    return safeName.slice(0, 255) || "media";
  } catch {
    return "media";
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

async function deterministicProductSlug(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value.normalize("NFKC")),
  );
  const token = Array.from(new Uint8Array(digest).slice(0, 12), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `prod-${token}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" },
      status: 405,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const expectedSyncSecret = Deno.env.get("CATALOG_SYNC_SECRET") || "";
    if (!supabaseUrl || !supabaseServiceKey || !expectedSyncSecret) {
      throw new Error("Missing Supabase configuration");
    }
    const providedSyncSecret = req.headers.get("x-catalog-sync-secret") || "";
    if (!secretsMatch(providedSyncSecret, expectedSyncSecret)) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const payload = await readJsonBody(req);
    const tenantId = truncate(payload.tenant_id || DEFAULT_TENANT_ID, 64);
    if (!UUID_PATTERN.test(tenantId)) throw new TypeError("Invalid tenant_id");

    const products = Array.isArray(payload.products) ? payload.products : [];
    if (products.length > MAX_PRODUCTS_PER_REQUEST) {
      return jsonResponse(
        { success: false, error: `At most ${MAX_PRODUCTS_PER_REQUEST} products are allowed` },
        413,
      );
    }

    // Legacy catalog_url used to download the entire CSV and then discard it.
    // Inline, bounded products are the only supported input until a real
    // streaming CSV parser is deployed. This avoids an hourly no-op download.
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let syncedProductsCount = 0;
    let syncedMediaCount = 0;
    let syncedProductMediaCount = 0;
    let skippedProductsCount = 0;
    let skippedMediaCount = 0;
    let failedWritesCount = 0;

    for (let productIndex = 0; productIndex < products.length; productIndex++) {
      const item = products[productIndex];
      if (!item || typeof item !== "object") {
        skippedProductsCount++;
        continue;
      }

      const title = truncate(item.title || item.name, 300);
      if (!title) {
        skippedProductsCount++;
        continue;
      }

      const externalId = truncate(item.external_id || item.id, 255) || null;
      const suppliedSlug = truncate(item.slug, 160);
      const slug =
        slugify(suppliedSlug || title) ||
        slugify(externalId || "") ||
        (await deterministicProductSlug(externalId || suppliedSlug || title));
      const parsedPrice = Number(item.price ?? 0);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        skippedProductsCount++;
        continue;
      }

      let productId: string | null = null;
      if (externalId) {
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("external_id", externalId)
          .limit(1);
        productId = existing?.[0]?.id ?? null;
      }

      if (!productId) {
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("slug", slug)
          .limit(1);
        productId = existing?.[0]?.id ?? null;
      }

      if (!productId) {
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({
            tenant_id: tenantId,
            name: title,
            slug,
            external_id: externalId,
            price: parsedPrice,
            currency: "YER",
            description: truncate(item.description, 10_000),
            images: [],
            is_published: !["draft", "inactive", "archived"].includes(
              truncate(item.status, 32).toLowerCase(),
            ),
          })
          .select("id")
          .single();

        if (error || !newProduct?.id) {
          failedWritesCount++;
          continue;
        }
        productId = newProduct.id;
        syncedProductsCount++;
      }

      const rawImageUrls = Array.isArray(item.images)
        ? item.images
        : typeof item.image_url === "string"
          ? [item.image_url]
          : [];
      if (rawImageUrls.length > MAX_IMAGES_PER_PRODUCT) {
        skippedMediaCount += rawImageUrls.length - MAX_IMAGES_PER_PRODUCT;
      }

      const normalizedImages = new Map<string, { raw: string; media: NormalizedMediaUrl }>();
      for (const rawUrl of rawImageUrls.slice(0, MAX_IMAGES_PER_PRODUCT)) {
        if (typeof rawUrl !== "string") {
          skippedMediaCount++;
          continue;
        }
        const media = normalizeMediaUrl(rawUrl);
        if (!media) {
          skippedMediaCount++;
          continue;
        }
        if (!normalizedImages.has(media.url))
          normalizedImages.set(media.url, { raw: rawUrl, media });
      }

      let sortOrder = 0;
      for (const { raw, media } of normalizedImages.values()) {
        let mediaId: string | null = null;
        const historicalUrls = [...new Set([media.url, raw.trim()])];
        const { data: existingMedia } = await supabase
          .from("media_files")
          .select("id")
          .eq("tenant_id", tenantId)
          .in("file_url", historicalUrls)
          .order("created_at", { ascending: true })
          .limit(1);

        mediaId = existingMedia?.[0]?.id ?? null;
        if (!mediaId) {
          const { data: insertedMedia, error } = await supabase
            .from("media_files")
            .insert({
              tenant_id: tenantId,
              file_name: fileNameFromUrl(media.url),
              file_url: media.url,
              file_path: media.objectKey || media.url,
              file_type: "image",
              source: "firebase_catalog",
              storage_provider: media.storageProvider,
              storage_bucket: media.storageBucket,
              object_key: media.objectKey,
            })
            .select("id")
            .single();

          if (error || !insertedMedia?.id) {
            failedWritesCount++;
            continue;
          }
          mediaId = insertedMedia.id;
          syncedMediaCount++;
        }

        const { data: existingLink } = await supabase
          .from("product_media")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("product_id", productId)
          .eq("media_id", mediaId)
          .limit(1);

        if (!existingLink?.length) {
          const { error } = await supabase.from("product_media").insert({
            tenant_id: tenantId,
            product_id: productId,
            media_id: mediaId,
            sort_order: sortOrder,
          });
          if (error) failedWritesCount++;
          else syncedProductMediaCount++;
        }
        sortOrder++;
      }
    }

    if (failedWritesCount > 0) {
      console.warn("[sync-firebase-catalog] partial_write_failure", {
        failures: failedWritesCount,
      });
    }

    return jsonResponse(
      {
        success: true,
        tenant_id: tenantId,
        synced_products: syncedProductsCount,
        synced_media: syncedMediaCount,
        synced_product_media: syncedProductMediaCount,
        ...(skippedProductsCount > 0 ? { skipped_products: skippedProductsCount } : {}),
        ...(skippedMediaCount > 0 ? { skipped_media: skippedMediaCount } : {}),
        ...(failedWritesCount > 0 ? { failed_writes: failedWritesCount } : {}),
      },
      200,
    );
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return jsonResponse({ success: false, error: error.message }, 413);
    }
    const status = error instanceof SyntaxError || error instanceof TypeError ? 400 : 500;
    console.error("[sync-firebase-catalog] request_failed", {
      kind: error instanceof Error ? error.name : "unknown",
    });
    return jsonResponse(
      { success: false, error: status === 400 ? "Invalid sync request" : "Sync failed" },
      status,
    );
  }
});
