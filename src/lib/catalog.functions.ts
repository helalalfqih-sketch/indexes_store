/**
 * Catalog Server Functions — thin RPC wrappers over repositories.
 * - Public reads use the server publishable client (respects RLS as anon)
 *   and are scoped to the resolved tenant (subdomain / header / default).
 * - Admin writes use requireSupabaseAuth + admin role check and require
 *   an explicit tenant context (or fall back to the user's tenant).
 */
import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { ProductDTO } from "@/lib/domain/product";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";
import { productsRepo, type ProductFilters } from "@/lib/repositories/products.repo";
import { categoriesRepo } from "@/lib/repositories/categories.repo";
import { inventoryRepo } from "@/lib/repositories/inventory.repo";
import { generateText } from "ai";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createVertex } from "@ai-sdk/google-vertex";
import {
  productInputSchema,
  productUpdateSchema,
  categoryInputSchema,
  categoryUpdateSchema,
  inventoryMovementSchema,
} from "@/lib/validators/catalog";
import { resolveTenantId } from "@/lib/saas/tenant-context";

const publicClient = () =>
  createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

const readHeaders = async (): Promise<Headers | null> => {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    return getRequest().headers;
  } catch {
    return null;
  }
};

const resolvePublicTenant = async (
  db: SupabaseClient<Database>,
  override?: string | null,
): Promise<string> => resolveTenantId(db, { override, headers: await readHeaders() });

const assertAdmin = async (ctx: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) => {
  if (process.env.NODE_ENV === "development") return;
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden: admin required");
};

const resolveAdminTenant = async (
  ctx: { supabase: SupabaseClient<Database>; userId: string },
  override?: string | null,
): Promise<string> => {
  if (process.env.NODE_ENV === "development") {
    try {
      const { data } = await ctx.supabase.from("tenants").select("id").limit(1).maybeSingle();
      if (data?.id) return data.id;
    } catch (e) {
      console.warn("Dev mode tenant resolution error:", e);
    }
  }
  return resolveTenantId(ctx.supabase, {
    override,
    headers: await readHeaders(),
    userId: ctx.userId,
  });
};

// -------- CSV Feed Parser & Helpers for storefront --------
const GLOBAL_CSV_URL = "https://firebasestorage.googleapis.com/v0/b/smartcontentcreator-d49f2.firebasestorage.app/o/catalogs%2Fglobal%2Fcatalog.csv?alt=media&token=8d793707-b96a-4ee9-bca1-0912af180138&ext=.csv";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); cur = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else cur += c;
    }
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row); }
  return rows;
}

function slugify(input: string, fallback: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return base || fallback;
}

function parsePrice(raw: string): { price: number; currency: string } {
  const s = (raw || "").trim();
  if (!s) return { price: 0, currency: "YER" };
  const m = s.match(/([\d.,]+)\s*([A-Za-z]{3})?/);
  const price = m ? Number(m[1].replace(/,/g, "")) : 0;
  return { price: Number.isFinite(price) ? price : 0, currency: (m?.[2] || "YER").toUpperCase() };
}

async function fetchCsvProducts() {
  try {
    const res = await fetch(GLOBAL_CSV_URL);
    if (!res.ok) {
      console.error(`Failed to fetch CSV: ${res.status}`);
      return [];
    }
    const text = await res.text();
    const rows = parseCsv(text);
    if (rows.length < 2) return [];

    const header = rows[0].map((h) => h.trim());
    const col = (name: string) => header.indexOf(name);
    
    const idIdx = col("id");
    const titleIdx = col("title");
    const descIdx = col("description");
    const availIdx = col("availability");
    const condIdx = col("condition");
    const priceIdx = col("price");
    const linkIdx = col("link");
    const imageIdx = col("image_link");
    const brandIdx = col("brand");
    const qtyIdx = col("quantity_to_sell_on_facebook");

    // V2 columns
    const skuIdx = col("sku");
    const barcodeIdx = header.findIndex(h => h === "gtin" || h === "barcode");
    const salePriceIdx = col("sale_price");
    const costPriceIdx = col("cost_price");
    const colorIdx = col("color");
    const sizeIdx = col("size");
    const gcatIdx = col("google_product_category");
    const fbcatIdx = col("fb_product_category");
    const materialIdx = col("material");
    const patternIdx = col("pattern");
    const genderIdx = col("gender");
    const ageGroupIdx = col("age_group");
    const productTypeIdx = col("product_type");

    const seenSlugs = new Set<string>();
    const products: any[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every((c) => !c?.trim())) continue;
      const title = (row[titleIdx] || "").trim();
      if (!title) continue;
      const externalId = idIdx >= 0 ? (row[idIdx] || "").trim() || null : null;
      
      const { price: regPrice, currency } = parsePrice(row[priceIdx] || "");
      const { price: salePrice } = salePriceIdx >= 0 ? parsePrice(row[salePriceIdx] || "") : { price: 0 };
      const { price: costPrice } = costPriceIdx >= 0 ? parsePrice(row[costPriceIdx] || "") : { price: 0 };

      let price = regPrice;
      let compareAtPrice: number | null = null;
      if (salePrice > 0 && salePrice < regPrice) {
        price = salePrice;
        compareAtPrice = regPrice;
      }

      const image = (row[imageIdx] || "").trim();
      const stockRaw = qtyIdx >= 0 ? Number((row[qtyIdx] || "").trim()) : NaN;
      const stock = Number.isFinite(stockRaw) && stockRaw >= 0 ? Math.floor(stockRaw) : 1;

      let slug = slugify(title, externalId ?? `product-${r}`);
      let uniq = slug;
      let i = 2;
      while (seenSlugs.has(uniq)) { uniq = `${slug}-${i++}`.slice(0, 60); }
      seenSlugs.add(uniq);
      slug = uniq;

      // Extract metadata tags
      const tags: string[] = [];
      const color = colorIdx >= 0 ? (row[colorIdx] || "").trim() : "";
      const size = sizeIdx >= 0 ? (row[sizeIdx] || "").trim() : "";
      const gcat = gcatIdx >= 0 ? (row[gcatIdx] || "").trim() : "";
      const fbcat = fbcatIdx >= 0 ? (row[fbcatIdx] || "").trim() : "";
      const material = materialIdx >= 0 ? (row[materialIdx] || "").trim() : "";
      const pattern = patternIdx >= 0 ? (row[patternIdx] || "").trim() : "";
      const gender = genderIdx >= 0 ? (row[genderIdx] || "").trim() : "";
      const ageGroup = ageGroupIdx >= 0 ? (row[ageGroupIdx] || "").trim() : "";

      if (color) tags.push(`_color:${color}`);
      if (size) tags.push(`_size:${size}`);
      if (gcat) tags.push(`_gcat:${gcat}`);
      if (fbcat) tags.push(`_fbcat:${fbcat}`);
      if (material) tags.push(`_material:${material}`);
      if (pattern) tags.push(`_pattern:${pattern}`);
      if (gender) tags.push(`_gender:${gender}`);
      if (ageGroup) tags.push(`_age:${ageGroup}`);

      // Extract additional image links
      const images: string[] = [];
      if (image) images.push(image);
      header.forEach((h, idx) => {
        if (h.startsWith("additional_image_link") && row[idx]) {
          const imgUrl = row[idx].trim();
          if (imgUrl) images.push(imgUrl);
        }
      });

      // Categories mapping
      const categoryName = productTypeIdx >= 0 ? (row[productTypeIdx] || "").trim() : "أخرى";
      const categoryId = slugify(categoryName, "other");

      products.push({
        id: externalId || `product-${r}`,
        slug,
        name: title,
        description: (descIdx >= 0 ? row[descIdx] : "") || "",
        price,
        compare_at_price: compareAtPrice,
        cost_price: costPrice > 0 ? costPrice : null,
        currency: currency || "YER",
        images: images.filter(Boolean),
        stock,
        reserved_stock: 0,
        rating: 5,
        reviews_count: 0,
        tags,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        brand: (brandIdx >= 0 ? (row[brandIdx] || "").trim() : "") || null,
        availability: (availIdx >= 0 ? (row[availIdx] || "").trim() : "") || null,
        condition: (condIdx >= 0 ? (row[condIdx] || "").trim() : "") || null,
        source_url: (linkIdx >= 0 ? (row[linkIdx] || "").trim() : "") || null,
        sku: skuIdx >= 0 ? (row[skuIdx] || "").trim() || null : null,
        barcode: barcodeIdx >= 0 ? (row[barcodeIdx] || "").trim() || null : null,
        category_id: categoryId,
        category_name: categoryName,
      });
    }

    return products;
  } catch (error) {
    console.error("Error reading CSV catalog feed:", error);
    return [];
  }
}

// ============ PUBLIC READS ============

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        tenantId: z.string().uuid().optional(),
        categoryId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    let list = await fetchCsvProducts();
    
    if (data.categoryId) {
      list = list.filter((p) => p.category_id === data.categoryId);
    }
    if (data.search) {
      const s = data.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.description ?? "").toLowerCase().includes(s) ||
          (p.sku ?? "").toLowerCase().includes(s) ||
          (p.brand ?? "").toLowerCase().includes(s) ||
          (p.category_name ?? "").toLowerCase().includes(s)
      );
    }
    if (data.offset != null && data.limit) {
      list = list.slice(data.offset, data.offset + data.limit);
    } else if (data.limit) {
      list = list.slice(0, data.limit);
    }
    return list;
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ slug: z.string(), tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data }) => {
    const list = await fetchCsvProducts();
    return list.find((p) => p.slug === data.slug) || null;
  });

/**
 * getProductsByIds — Meta Commerce Checkout server function.
 *
 * Fetches a specific set of products by their IDs directly from the Supabase
 * `products` table. Never loads the full catalog.
 *
 * Lookup strategy (all run in parallel, results merged and deduplicated):
 *   1. UUID primary key `id`
 *   2. `external_id` column — for Meta Catalog IDs (e.g. "prd_xxx")
 *   3. `slug` column        — slug-based fallback
 *
 * Invalid / unknown IDs are silently ignored.
 * Preserves the requested ID order in the returned array.
 * Multi-tenant safe: resolves tenant from subdomain / header / default.
 */
export const getProductsByIds = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        ids: z.array(z.string().min(1)).min(1).max(50),
        tenantId: z.string().uuid().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const db = publicClient();
    const tenantId = await resolvePublicTenant(db, data.tenantId ?? null);
    const ids = data.ids;

    // Inline DTO mapper — mirrors productsRepo toDTO without an extra DB call
    type Row = Database["public"]["Tables"]["products"]["Row"];
    const rowToDTO = (r: Row): ProductDTO => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description ?? "",
      price: Number(r.price),
      currency: r.currency,
      category_id: r.category_id,
      brand: r.brand,
      images: r.images ?? [],
      model_url: r.model_url,
      stock: r.stock,
      reserved_stock: r.reserved_stock,
      rating: Number(r.rating),
      reviews_count: r.reviews_count,
      tags: r.tags ?? [],
      is_published: r.is_published,
      created_at: r.created_at,
      updated_at: r.updated_at,
      video_playback_id: r.video_playback_id,
      old_price: r.old_price != null ? Number(r.old_price) : null,
      badge: r.badge,
      sku: r.sku,
      barcode: r.barcode,
      compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : null,
      cost_price: r.cost_price != null ? Number(r.cost_price) : null,
      model_3d_url: r.model_3d_url,
      model_3d_thumbnail: r.model_3d_thumbnail,
      model_3d_status: r.model_3d_status,
      availability: r.availability,
      condition: r.condition,
      source_url: r.source_url,
      meta_sync_status: r.meta_sync_status,
    });

    // Partition: UUIDs → primary key; non-UUIDs → external_id / slug
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const uuids = ids.filter((id) => UUID_RE.test(id));
    const nonUuids = ids.filter((id) => !UUID_RE.test(id));

    // Run all queries in parallel for performance
    const [byId, byExtId, bySlug] = await Promise.all([
      uuids.length > 0
        ? db
            .from("products")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("is_published", true)
            .in("id", uuids)
        : Promise.resolve({ data: [] as Row[], error: null }),
      nonUuids.length > 0
        ? db
            .from("products")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("is_published", true)
            .in("external_id", nonUuids)
        : Promise.resolve({ data: [] as Row[], error: null }),
      nonUuids.length > 0
        ? db
            .from("products")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("is_published", true)
            .in("slug", nonUuids)
        : Promise.resolve({ data: [] as Row[], error: null }),
    ]);

    // Merge and deduplicate by product UUID
    const collected = new Map<string, ProductDTO>();
    for (const r of [...(byId.data ?? []), ...(byExtId.data ?? []), ...(bySlug.data ?? [])]) {
      if (!collected.has(r.id)) collected.set(r.id, rowToDTO(r));
    }

    const results = Array.from(collected.values());

    // Restore the caller's requested order
    const idOrder = new Map<string, number>();
    ids.forEach((id, i) => idOrder.set(id.toLowerCase(), i));

    results.sort((a, b) => {
      const rank = (p: ProductDTO) =>
        Math.min(
          idOrder.get(p.id.toLowerCase()) ?? 999,
          idOrder.get(p.slug.toLowerCase()) ?? 999,
        );
      return rank(a) - rank(b);
    });

    return results;
  });

export const listCategories = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ tenantId: z.string().uuid().optional() }).parse(raw ?? {}),
  )
  .handler(async () => {
    const products = await fetchCsvProducts();
    const categoriesMap = new Map<string, any>();
    
    products.forEach((p) => {
      if (p.category_name && p.category_id) {
        if (!categoriesMap.has(p.category_id)) {
          categoriesMap.set(p.category_id, {
            id: p.category_id,
            slug: p.category_id,
            name: p.category_name,
            description: "",
            image_url: p.images[0] || null,
            parent_id: null,
            sort: 0,
            icon: "shopping-bag",
            color: null,
            is_active: true,
          });
        }
      }
    });
    
    return Array.from(categoriesMap.values());
  });

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ slug: z.string(), tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data }) => {
    const categories = await listCategories();
    return categories.find((c) => c.slug === data.slug) || null;
  });

// ============ ADMIN READS ============

const tenantScope = z.object({ tenantId: z.string().uuid().optional() });

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        tenantId: z.string().uuid().optional(),
        search: z.string().trim().max(120).optional(),
        categoryId: z.string().uuid().optional(),
        publishedOnly: z.boolean().optional(),
        unpublishedOnly: z.boolean().optional(),
        outOfStock: z.boolean().optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);

    // ── Step 1: CSV catalog = source of truth for product listings ──────────
    let csvList = await fetchCsvProducts();

    // Apply text search and category filters on CSV data
    if (data.search) {
      const s = data.search.toLowerCase();
      csvList = csvList.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.description ?? "").toLowerCase().includes(s),
      );
    }
    // Note: data.categoryId is a UUID but CSV category_id is a slug —
    // skip UUID-based category filter here (handled client-side in admin page).

    // ── Step 2: Fetch Supabase rows (admin metadata only) ───────────────────
    // We only need fields used in the admin UI: UUID, sync status, publish state.
    const { data: dbRows } = await ctx.supabase
      .from("products")
      .select(
        "id, external_id, slug, meta_sync_status, is_published, updated_at, old_price, badge, video_playback_id, model_url, model_3d_url, model_3d_thumbnail, model_3d_status, sku, barcode, compare_at_price, cost_price, availability, condition, source_url, tags, currency, category_id, brand",
      )
      .eq("tenant_id", tenantId);

    // Build quick-lookup maps: external_id → row, slug → row
    const dbByExtId = new Map<string, any>();
    const dbBySlug = new Map<string, any>();
    for (const row of dbRows ?? []) {
      if (row.external_id) dbByExtId.set(row.external_id, row);
      if (row.slug) dbBySlug.set(row.slug, row);
    }

    // ── Step 3: Merge CSV + Supabase metadata ───────────────────────────────
    const merged = csvList.map((csv) => {
      // Match by external_id first, then by slug
      const db = dbByExtId.get(csv.id) ?? dbBySlug.get(csv.slug) ?? null;

      return {
        // Core product data from CSV
        id: db?.id ?? csv.id,          // Use Supabase UUID when available (for edit/delete)
        slug: csv.slug,
        name: csv.name,
        description: csv.description ?? "",
        price: csv.price,
        currency: db?.currency ?? csv.currency ?? "YER",
        images: csv.images ?? [],
        stock: csv.stock ?? 0,
        reserved_stock: csv.reserved_stock ?? 0,
        rating: csv.rating ?? 5,
        reviews_count: csv.reviews_count ?? 0,
        tags: db?.tags ?? csv.tags ?? [],
        category_id: db?.category_id ?? null,
        brand: db?.brand ?? csv.brand ?? null,
        availability: db?.availability ?? csv.availability ?? null,
        condition: db?.condition ?? csv.condition ?? null,
        source_url: db?.source_url ?? csv.source_url ?? null,
        sku: db?.sku ?? csv.sku ?? null,
        barcode: db?.barcode ?? csv.barcode ?? null,
        compare_at_price: db?.compare_at_price ?? csv.compare_at_price ?? null,
        cost_price: db?.cost_price ?? csv.cost_price ?? null,
        model_url: db?.model_url ?? null,
        model_3d_url: db?.model_3d_url ?? null,
        model_3d_thumbnail: db?.model_3d_thumbnail ?? null,
        model_3d_status: db?.model_3d_status ?? null,
        video_playback_id: db?.video_playback_id ?? null,
        old_price: db?.old_price ?? null,
        badge: db?.badge ?? null,
        // Admin metadata from Supabase (or defaults for CSV-only products)
        is_published: db?.is_published ?? true,
        meta_sync_status: db?.meta_sync_status ?? "not_synced",
        created_at: csv.created_at,
        updated_at: db?.updated_at ?? csv.updated_at,
        tenant_id: tenantId,
      };
    });

    // ── Step 4: Apply publish/stock filters ─────────────────────────────────
    let filtered = merged;
    if (data.publishedOnly) filtered = filtered.filter((r) => r.is_published);
    if (data.unpublishedOnly) filtered = filtered.filter((r) => !r.is_published);
    if (data.outOfStock) filtered = filtered.filter((r) => r.stock <= 0);

    return filtered;
  });


export const adminGetProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);
    return productsRepo.getById(ctx.supabase, data.id, tenantId);
  });

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => tenantScope.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);
    return categoriesRepo.list(ctx.supabase, { tenantId, includeInactive: true });
  });

// ============ ADMIN WRITES — PRODUCTS ============

export const adminCreateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    productInputSchema.extend({ tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const { tenantId: overrideTenant, ...input } = data;
    const tenantId = await resolveAdminTenant(ctx, overrideTenant);
    return productsRepo.create(ctx.supabase, tenantId, input);
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    productUpdateSchema.extend({ tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const { id, tenantId: overrideTenant, ...patch } = data;
    const tenantId = await resolveAdminTenant(ctx, overrideTenant);
    return productsRepo.update(ctx.supabase, tenantId, id, patch);
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);
    await productsRepo.remove(ctx.supabase, tenantId, data.id);
    return { ok: true };
  });

// ============ ADMIN WRITES — CATEGORIES ============

export const adminCreateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    categoryInputSchema.extend({ tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const { tenantId: overrideTenant, ...input } = data;
    const tenantId = await resolveAdminTenant(ctx, overrideTenant);
    return categoriesRepo.create(ctx.supabase, tenantId, input);
  });

export const adminUpdateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    categoryUpdateSchema.extend({ tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const { id, tenantId: overrideTenant, ...patch } = data;
    const tenantId = await resolveAdminTenant(ctx, overrideTenant);
    return categoriesRepo.update(ctx.supabase, tenantId, id, patch);
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);
    await categoriesRepo.remove(ctx.supabase, tenantId, data.id);
    return { ok: true };
  });

// ============ ADMIN WRITES — INVENTORY ============

export const adminRecordInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    inventoryMovementSchema.extend({ tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const { tenantId: overrideTenant, ...input } = data;
    const tenantId = await resolveAdminTenant(ctx, overrideTenant);
    return inventoryRepo.record(ctx.supabase, tenantId, {
      ...input,
      created_by: ctx.userId,
    });
  });

export const adminListInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ productId: z.string().uuid(), tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);
    return inventoryRepo.listByProduct(ctx.supabase, tenantId, data.productId);
  });

const callBack4AppVertexGateway = async (params: {
  prompt: string;
  systemPersona?: string;
  imageBase64?: string;
  mimeType?: string;
  maxTokens?: number;
}) => {
  const primaryUrl = "https://parseapi.back4app.com/functions/aiVertexGateway";
  const fallbackUrl = "https://parseapi.back4app.com/functions/aiGateway";

  const body = {
    prompt: params.prompt,
    model: "gemini-2.5-flash",
    max_tokens: params.maxTokens || 4096,
    temperature: 0.7,
    system_persona: params.systemPersona,
    image: params.imageBase64,
    mimeType: params.mimeType,
  };

  const headers = {
    "X-Parse-Application-Id": "uWUMmdbdRjcuOKuCcl9Pg7zEYxnYGVaLXjmveGF2",
    "X-Parse-REST-API-Key": "Zsvk14ko9rvXD25G1hflNeY2Dg2hJtkocPvh6tMp",
    "X-Parse-Master-Key": "8qRzu0pBFkDo0urIjpXeFGb23xR5C23JoOlD05ze",
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(primaryUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Vertex HTTP ${response.status}: ${errText}`);
    }

    const json = await response.json();
    if (json.result && json.result.success === true) {
      return json.result.data || "";
    } else {
      throw new Error(json.result?.error || "Unknown Vertex error");
    }
  } catch (vertexErr: any) {
    console.warn("⚠️ [Web-AI-Gateway] Vertex failed, falling back to Gemini Key Pool:", vertexErr.message || vertexErr);

    const response = await fetch(fallbackUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fallback Gateway Error (${response.status}): ${errText}`);
    }

    const json = await response.json();
    if (json.result && json.result.success === true) {
      return json.result.data || "";
    } else {
      throw new Error(json.result?.error || "Unknown Fallback Gateway error");
    }
  }
};

const catalogPrompt = `
أنت خبير تحليل منتجات للكتالوج التجاري.
انظر إلى هذه الصورة وأعطني المعلومات التالية بدقة شديدة.

قواعد إلزامية:
- جميع النصوص في الرد بالعربية فقط (ما عدا فئات Google وFacebook تبقى إنجليزية).
- لا تخترع معلومات غير موجودة في الصورة.
- إذا لم تجد معلومة اكتب: فارغ

أعد الرد بهذا الشكل الحرفي فقط:
===TITLE===
[اسم المنتج بالعربية - مختصر واحترافي]
===DESCRIPTION===
[اكتب وصفاً تسويقياً إعلانياً جذاباً واحترافياً للمنتج بالعربية بأسلوب منشور فيسبوك/تيك توك يجمع بين الخطاف القوي والفوائد والميزات الرائعة بشكل منسق مع الإيموجي المناسب وفواصل السطور، بدون أرقام هواتف أو معلومات تواصل أو روابط]
===BRAND===
[العلامة التجارية أو: فارغ]
===COLOR===
[اللون الرئيسي أو: فارغ]
===SIZE===
[المقاس أو الحجم أو: فارغ]
===PRICE===
[السعر بالريال اليمني كعدد رقمي فقط في حال كان مكتوباً أو معروفاً، أو: فارغ]
===SAR===
[السعر بالريال السعودي كعدد رقمي فقط في حال كان مكتوباً أو معروفاً، أو: فارغ]
===G_CAT===
[فئة Google المناسبة بالإنجليزية مثل: Apparel & Accessories > Clothing أو: فارغ]
===FB_CAT===
[فئة Facebook المناسبة بالإنجليزية مثل: Clothing & Accessories > Clothing أو: فارغ]
===CONDITION===
[new أو used]
`;

const requireAuthWithClient = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  });

export const aiAnalyzeImage = createServerFn({ method: "POST" })
  .middleware([requireAuthWithClient, requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ image: z.string() }).parse(raw)
  )
  .handler(async ({ data }) => {
    let cleanBase64 = data.image;
    let mimeType = "image/jpeg";

    if (data.image.startsWith("data:image/")) {
      const matches = data.image.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        cleanBase64 = matches[2];
      }
    }

    const text = await callBack4AppVertexGateway({
      prompt: catalogPrompt,
      imageBase64: cleanBase64,
      mimeType,
      maxTokens: 1200,
    });

    return { text };
  });

export const aiOptimizeDescription = createServerFn({ method: "POST" })
  .middleware([requireAuthWithClient, requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ text: z.string() }).parse(raw)
  )
  .handler(async ({ data }) => {
    const cleanedText = data.text;
    const promptText = `
تصرّف كخبير تسويق وتنظيم أوصاف منتجات.

سأرسل لك وصف منتج جاهز يحتوي على كلام غير مرتب + مميزات + سعر أو أكثر.
مهمتك تنفيذ الخطوات التالية بدقة شديدة دون إضافة أو اختراع أي معلومة جديدة.

⚠️ شروط إلزامية عامة:
- جميع الكلمات في الناتج النهائي تكون بدون أي علامات تشكيل (بدون حركات نهائيًا)
- استخرج السعر وطبق معادلة السعر المحددة بالأسفل.
- حدد فئة المنتج المناسبة لـ Google Product Category و Facebook Product Category.
- استخرج السمات الأخرى (الشركة المصنعة/العلامة التجارية، اللون، المقاس) إن وجدت.
- احذف تلقائياً أي أرقام هواتف أو معلومات تواصل أو أسماء متاجر من الوصف النهائي.
- احذف أي عبارات مثل "للتواصل"، "للطلب"، "واتساب"، "أرقام تليفون" من الوصف نهائياً.

المهمة الأولى: العنوان والهوك
1. أنشئ عنوانًا احترافيًا مختصرًا (Hook):
   - جذاب ومناسب للبيع
   - مستخرج من نفس الوصف فقط
2. تحت العنوان مباشرة:
   - ضع أهم وأقوى ميزة واحدة فقط تشد الانتباه.

المهمة الثانية: اعادة الصياغة والتنظيم للوصف
1. اعد صياغة الوصف ليكون مرتب، واضح، ومخترص.
2. يمنع منعًا باتًا اضافة اي معلومة جديدة او اختراع مميزات غير موجودة.
3. احذف اي كلام مكرر، غير مهم، او انشائي بلا فائدة.
4. استخرج مميزات المنتج فقط كقائمة نقاط واضحة.

المهمة الثالثة: معالجة السعر
1. اذا وجد سعر خاص بـ "الجنوب" → احذفه نهائيًا وتجاهله.
2. اذا وجد اكثر من سعر: اختر اقل سعر فقط.
3. طبق الزيادة على السعر المستخرج بالريال اليمني (YER) حسب الشرائح التالية:
   - من 500 الى 2500 ريال يمني ➜ اضف 1900
   - اكثر من 3000 الى 10000 ريال يمني ➜ اضف 2900
   - 10000 ريال يمني او اكثر ➜ اضف 3900
4. بعد الحساب والزيادة: حول السعر الناتج إلى رقم نفسي ينتهي بـ 900 (مثال: 6000 يصبح 5900، 7200 يصبح 6900، 10000 يصبح 9900، 12000 يصبح 11900 وهكذا).

المهمة الرابعة: التحويل للعملات
1. احسب السعر بالريال السعودي (SAR) بناءً على السعر النهائي بالريال اليمني بعد الزيادة والتقريب النفسي:
   - التحويل يكون على الأساس: 1 ريال سعودي = 140 ريال يمني (أي اقسم السعر اليمني على 140).
   - احذف الكسور تمامًا واكتب الرقم الصحيح فقط للسعودي.

أرجِع النتيجة بالصيغة النصية التالية بدقة بالغة وبنفس الترتيب دائماً. يجب كتابة كل قسم، وإذا لم تجد قيمته اكتب: فارغ

===TITLE===
[العنوان المستخرج بدون حركات، أو: فارغ]
===HOOK===
[الهوك/الميزة القوية بدون حركات، أو: فارغ]
===BODY===
[اكتب وصفاً تسويقياً إعلانياً جذاباً واحترافياً ومفصلاً للمنتج بالعربية بأسلوب منشور فيسبوك/تيك توك يجمع بين الفوائد والميزات الرائعة بشكل منسق مع الإيموجي المناسب وفواصل السطور، بدون حركات وبدون أرقام هواتف، أو: فارغ]
===FEATURES===
[ميزة 1 بدون حركات، ميزة 2 بدون حركات، أو: فارغ]
===PRICE===
[السعر اليمني النهائي كعدد رقمي فقط، أو: فارغ]
===SAR===
[السعر السعودي النهائي كعدد رقمي فقط، أو: فارغ]
===G_CAT===
[فئة جوجل المناسبة للمنتج بالإنجليزية، مثل: Apparel & Accessories > Clothing، أو: فارغ]
===FB_CAT===
[فئة فيسبوك المناسبة للمنتج بالإنجليزية، مثل: Apparel & Accessories > Clothing، أو: فارغ]
===BRAND===
[الماركة، أو: فارغ]
===COLOR===
[اللون، أو: فارغ]
===SIZE===
[المقاس، أو: فارغ]

النص المراد تحليله:
"""
${cleanedText}
"""
`;

    const text = await callBack4AppVertexGateway({
      prompt: promptText,
      maxTokens: 4096,
    });

    return { text };
  });
