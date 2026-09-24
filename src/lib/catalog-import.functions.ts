import { uniqueCatalogSlug } from "@/lib/catalog-slug";
/**
 * Admin-only server function: import products from a remote CSV catalog.
 * Upserts on (tenant_id, external_id). Uses context.supabase (RLS as admin/tenant member).
 *
 * Features:
 * - Full media import: primary image + additional_image_link[0..3] + video
 * - Per-row typed result (inserted/updated/skipped/failed)
 * - Batched upserts (max 50 per batch)
 * - Idempotent: re-import creates no duplicates
 * - Currency preserved from CSV
 * - SSRF protection on fetch URL
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { getRequest } from "@tanstack/react-start/server";
import { mergeImportedImages, parseCatalogCsv, slugify } from "@/lib/catalog/catalog-csv";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImportFailure {
  rowNumber: number;
  externalId: string | null;
  title?: string;
  code: string;
  message: string;
}

export interface ImportResult {
  csvRows: number;
  validRows: number;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  productsProcessed: number;
  primaryImagesImported: number;
  additionalImagesImported: number;
  videosDiscovered: number;
  videosImported: number;
  mediaWarnings: number;
  failures: ImportFailure[];
}

// ─── SSRF / URL Safety ────────────────────────────────────────────────────────

const ALLOWED_FETCH_HOSTS = new Set(["firebasestorage.googleapis.com", "storage.googleapis.com"]);
const MAX_RESPONSE_BYTES = 25 * 1024 * 1024; // 25 MB
const FETCH_TIMEOUT_MS = 30_000;

function validateFetchUrl(rawUrl: string): URL {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new Error("رابط الاستيراد غير صالح");
  }
  if (u.protocol !== "https:") {
    throw new Error("يجب أن يكون رابط الاستيراد HTTPS");
  }
  const host = u.hostname.toLowerCase();
  // Reject loopback / private ranges
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.16.")
  ) {
    throw new Error("رابط الاستيراد يشير إلى عنوان داخلي غير مسموح به");
  }
  if (!ALLOWED_FETCH_HOSTS.has(host)) {
    // Allow only trusted hosts; log safe host name (no token)
    throw new Error(`المضيف '${host}' غير مدرج في القائمة المسموح بها لروابط الاستيراد`);
  }
  return u;
}

// ─── Batch upsert helper ──────────────────────────────────────────────────────

export const CATALOG_IMPORT_BATCH_SIZE = 50;

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ExistingProductMedia = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "external_id" | "slug" | "images" | "video_playback_id"
>;

type PreparedProduct = ProductInsert & {
  _rowNumber: number;
  _imageCount: number;
  _hasVideo: boolean;
  _importedImages: string[];
  _importedVideoUrl: string | null;
  _wasExisting: boolean;
};

async function loadExistingProductMedia(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  column: "external_id" | "slug",
  values: string[],
): Promise<ExistingProductMedia[]> {
  const uniqueValues = [...new Set(values)];
  const existing: ExistingProductMedia[] = [];

  for (let start = 0; start < uniqueValues.length; start += CATALOG_IMPORT_BATCH_SIZE) {
    const batch = uniqueValues.slice(start, start + CATALOG_IMPORT_BATCH_SIZE);
    const { data, error } = await supabase
      .from("products")
      .select("external_id,slug,images,video_playback_id")
      .eq("tenant_id", tenantId)
      .in(column, batch);
    if (error) throw error;
    existing.push(...(data ?? []));
  }

  return existing;
}

async function upsertBatch(
  supabase: SupabaseClient<Database>,
  batch: ProductInsert[],
): Promise<{ upserted: number; error: string | null }> {
  if (batch.length === 0) return { upserted: 0, error: null };
  const { error, count } = await supabase.from("products").upsert(batch as ProductInsert[], {
    onConflict: "tenant_id,external_id",
    count: "exact",
  });
  if (error) return { upserted: 0, error: error.message };
  return { upserted: count ?? batch.length, error: null };
}

// ─── Resolve tenant ───────────────────────────────────────────────────────────

const resolveAdminTenant = async (
  ctx: { supabase: SupabaseClient<Database>; userId: string },
  override?: string | null,
): Promise<string> => {
  let headers: Headers | null = null;
  try {
    headers = getRequest().headers;
  } catch {
    /* no request context */
  }
  return resolveTenantId(ctx.supabase, { override, headers, userId: ctx.userId });
};

// ─── Server Function ──────────────────────────────────────────────────────────

export const adminImportCatalogFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        url: z.string().url().optional(),
        tenantId: z.string().uuid().optional(),
        publish: z.boolean().default(true),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }): Promise<ImportResult> => {
    const { supabase, userId } = context;

    // ── Admin authorization ──────────────────────────────────────────────────
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw roleErr;
    if (!isAdmin) throw new Error("Forbidden: admin required");

    const tenantId = await resolveAdminTenant({ supabase, userId }, data.tenantId);

    // ── Fetch CSV ────────────────────────────────────────────────────────────
    const importUrl = data.url || process.env.CATALOG_IMPORT_URL;
    if (!importUrl) {
      throw new Error("No catalog URL provided and CATALOG_IMPORT_URL is not set.");
    }

    // Validate URL for SSRF safety
    validateFetchUrl(importUrl);

    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let csvText: string;
    try {
      const res = await fetch(importUrl, { signal: controller.signal });
      if (!res.ok) throw new Error(`فشل تحميل ملف CSV (${res.status})`);
      // Guard response size
      const contentLength = Number(res.headers.get("content-length") ?? 0);
      if (contentLength > MAX_RESPONSE_BYTES) {
        throw new Error("حجم ملف CSV يتجاوز الحد المسموح به (25 MB)");
      }
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > MAX_RESPONSE_BYTES) {
        throw new Error("حجم ملف CSV يتجاوز الحد المسموح به (25 MB)");
      }
      csvText = new TextDecoder("utf-8").decode(buffer);
    } finally {
      clearTimeout(fetchTimeout);
    }

    // ── Parse CSV ────────────────────────────────────────────────────────────
    const { csvRows, validRows, skippedRows } = parseCatalogCsv(csvText);

    if (csvRows === 0) {
      return {
        csvRows: 0,
        validRows: 0,
        inserted: 0,
        updated: 0,
        unchanged: 0,
        skipped: 0,
        failed: 0,
        productsProcessed: 0,
        primaryImagesImported: 0,
        additionalImagesImported: 0,
        videosDiscovered: 0,
        videosImported: 0,
        mediaWarnings: 0,
        failures: [],
      };
    }

    // ── Prepare insert records ────────────────────────────────────────────────
    const seenSlugs = new Set<string>();
    const failures: ImportFailure[] = [];

    // Add already-skipped rows to failures list for visibility
    for (const s of skippedRows) {
      failures.push({
        rowNumber: s.rowNumber,
        externalId: s.externalId,
        code: s.code,
        message: s.code === "MISSING_TITLE" ? "المنتج لا يحتوي على عنوان (title)" : s.code,
      });
    }

    const records: PreparedProduct[] = [];

    for (const row of validRows) {
      const slug = uniqueCatalogSlug(
        slugify(row.title, row.externalId ?? `product-${row.rowNumber}`),
        seenSlugs,
      );

      const videoItems = row.media.filter((m) => m.type === "video");
      const importedVideoUrl = videoItems[0]?.url ?? null;
      const hasVideo = importedVideoUrl !== null;

      records.push({
        _rowNumber: row.rowNumber,
        _imageCount: row.images.length,
        _hasVideo: hasVideo,
        _importedImages: row.images,
        _importedVideoUrl: importedVideoUrl,
        _wasExisting: false,
        tenant_id: tenantId,
        slug,
        name: row.title,
        description: row.description,
        price: row.price,
        compare_at_price: row.salePrice,
        cost_price: row.costPrice,
        currency: row.currency,
        images: row.images,
        stock: row.stock,
        brand: row.brand,
        is_published: data.publish,
        external_id: row.externalId,
        availability: row.availability,
        condition: row.condition,
        source_url: row.sourceUrl,
        sku: row.sku,
        barcode: row.barcode,
        tags: row.tags,
      });
    }

    // Read existing media first so re-imports merge rather than erase it.
    const existingByExternalId = new Map<string, ExistingProductMedia>();
    const existingBySlug = new Map<string, ExistingProductMedia>();
    const existingProducts = [
      ...(await loadExistingProductMedia(
        supabase,
        tenantId,
        "external_id",
        records.flatMap((record) => (record.external_id ? [record.external_id] : [])),
      )),
      ...(await loadExistingProductMedia(
        supabase,
        tenantId,
        "slug",
        records.flatMap((record) => (record.external_id ? [] : [record.slug])),
      )),
    ];

    for (const existing of existingProducts) {
      if (existing.external_id) existingByExternalId.set(existing.external_id, existing);
      existingBySlug.set(existing.slug, existing);
    }

    for (const record of records) {
      const existing = record.external_id
        ? existingByExternalId.get(record.external_id)
        : existingBySlug.get(record.slug);
      record._wasExisting = existing !== undefined;
      record.images = mergeImportedImages(record._importedImages, existing?.images ?? []);
      record.video_playback_id = record._importedVideoUrl ?? existing?.video_playback_id ?? null;
    }

    // ── Batched upserts ───────────────────────────────────────────────────────
    let inserted = 0;
    let updated = 0;
    let primaryImagesImported = 0;
    let additionalImagesImported = 0;
    let videosDiscovered = 0;
    let videosImported = 0;
    const mediaWarnings = 0;

    // Separate records with external_id (upsertable by stable key) from those without
    const withExt = records.filter((r) => r.external_id);
    const withoutExt = records.filter((r) => !r.external_id);

    // Process withExt in batches
    for (let start = 0; start < withExt.length; start += CATALOG_IMPORT_BATCH_SIZE) {
      const batch = withExt.slice(start, start + CATALOG_IMPORT_BATCH_SIZE);
      const cleanBatch = batch.map(
        ({
          _rowNumber,
          _imageCount,
          _hasVideo,
          _importedImages,
          _importedVideoUrl,
          _wasExisting,
          ...rest
        }) => rest,
      );
      const { upserted, error } = await upsertBatch(supabase, cleanBatch as ProductInsert[]);
      if (error) {
        // Mark all rows in this batch as failed
        for (const r of batch) {
          failures.push({
            rowNumber: r._rowNumber,
            externalId: r.external_id ?? null,
            title: r.name ?? undefined,
            code: "UPSERT_ERROR",
            message: error,
          });
        }
      } else {
        if (upserted !== batch.length) {
          throw new Error("تعذر تأكيد عدد المنتجات المعالجة في دفعة الاستيراد");
        }
        for (const r of batch) {
          if (r._wasExisting) updated++;
          else inserted++;
          if (r._imageCount > 0) primaryImagesImported++;
          if (r._imageCount > 1) additionalImagesImported += r._imageCount - 1;
          if (r._hasVideo) {
            videosDiscovered++;
            videosImported++;
          }
        }
      }
    }

    // Process withoutExt in batches (no external_id → conflict on slug)
    for (let start = 0; start < withoutExt.length; start += CATALOG_IMPORT_BATCH_SIZE) {
      const batch = withoutExt.slice(start, start + CATALOG_IMPORT_BATCH_SIZE);
      const cleanBatch = batch.map(
        ({
          _rowNumber,
          _imageCount,
          _hasVideo,
          _importedImages,
          _importedVideoUrl,
          _wasExisting,
          ...rest
        }) => rest,
      );
      const { error, count } = await supabase
        .from("products")
        .upsert(cleanBatch as ProductInsert[], {
          onConflict: "tenant_id,slug",
          count: "exact",
        });
      if (error) {
        for (const r of batch) {
          failures.push({
            rowNumber: r._rowNumber,
            externalId: null,
            title: r.name ?? undefined,
            code: "UPSERT_ERROR",
            message: error.message,
          });
        }
      } else {
        if ((count ?? batch.length) !== batch.length) {
          throw new Error("تعذر تأكيد عدد المنتجات المعالجة في دفعة الاستيراد");
        }
        for (const r of batch) {
          if (r._wasExisting) updated++;
          else inserted++;
          if (r._imageCount > 0) primaryImagesImported++;
          if (r._imageCount > 1) additionalImagesImported += r._imageCount - 1;
          if (r._hasVideo) {
            videosDiscovered++;
            videosImported++;
          }
        }
      }
    }

    const failedCount = failures.filter((f) => f.code === "UPSERT_ERROR").length;
    const productsProcessed = inserted + updated;

    return {
      csvRows,
      validRows: validRows.length,
      inserted,
      updated,
      unchanged: 0,
      skipped: skippedRows.length,
      failed: failedCount,
      productsProcessed,
      primaryImagesImported,
      additionalImagesImported,
      videosDiscovered,
      videosImported,
      mediaWarnings,
      failures,
    };
  });
