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
import {
  productsRepo,
  buildProductMediaAndVideos,
  type ProductFilters,
} from "@/lib/repositories/products.repo";
import { categoriesRepo } from "@/lib/repositories/categories.repo";
import { inventoryRepo } from "@/lib/repositories/inventory.repo";
import { generateText } from "ai";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createVertex } from "@ai-sdk/google-vertex";
import {
  productInputBase,
  productUpdateBase,
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

const assertAdmin = async (ctx: { supabase: SupabaseClient<Database>; userId: string }) => {
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
    const db = publicClient();
    const tenantId = await resolvePublicTenant(db, data.tenantId ?? null);
    const products = await productsRepo.list(db, {
      tenantId,
      categoryId: data.categoryId,
      search: data.search,
    });

    if (data.offset != null && data.limit) {
      return products.slice(data.offset, data.offset + data.limit);
    }
    if (data.offset != null) return products.slice(data.offset);
    if (data.limit) return products.slice(0, data.limit);
    return products;
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ slug: z.string(), tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data }) => {
    const db = publicClient();
    const tenantId = await resolvePublicTenant(db, data.tenantId ?? null);
    return productsRepo.getBySlug(db, data.slug, tenantId);
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
    const rowToDTO = (r: Row): ProductDTO => {
      const { images, videos, media } = buildProductMediaAndVideos(r);
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description ?? "",
        price: Number(r.price),
        currency: r.currency,
        category_id: r.category_id,
        brand: r.brand,
        images,
        videos,
        media,
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
        // V3 CMS fields
        featured: r.featured ?? false,
        is_deal: r.is_deal ?? false,
        deal_start: r.deal_start ?? null,
        deal_end: r.deal_end ?? null,
      };
    };

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
        Math.min(idOrder.get(p.id.toLowerCase()) ?? 999, idOrder.get(p.slug.toLowerCase()) ?? 999);
      return rank(a) - rank(b);
    });

    return results;
  });

export const listCategories = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ tenantId: z.string().uuid().optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    const db = publicClient();
    const tenantId = await resolvePublicTenant(db, data.tenantId);
    return categoriesRepo.list(db, { tenantId, includeInactive: false });
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
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const ctx = context;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);

    // Supabase is the operational source of truth for admin catalog reads.
    let filtered = await productsRepo.list(ctx.supabase, {
      tenantId,
      search: data.search,
      categoryId: data.categoryId,
    });

    if (data.publishedOnly) filtered = filtered.filter((r) => r.is_published !== false);
    if (data.unpublishedOnly) filtered = filtered.filter((r) => r.is_published === false);
    if (data.outOfStock) filtered = filtered.filter((r) => (r.stock ?? 0) <= 0);

    const total = filtered.length;
    const isPaginated =
      data.page !== undefined ||
      data.pageSize !== undefined ||
      data.limit !== undefined ||
      data.offset !== undefined;

    let resultList = filtered;
    if (isPaginated) {
      const page = data.page ?? 1;
      const pageSize = data.pageSize ?? data.limit ?? 20;
      const offset = data.offset ?? (page - 1) * pageSize;
      resultList = filtered.slice(offset, offset + pageSize);
    }

    // Return an object instead of array with custom properties to survive JSON serialization
    return { items: resultList, total };
  });

export const adminGetProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);
    return productsRepo.getById(ctx.supabase, data.id, tenantId);
  });

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => tenantScope.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const ctx = context;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);
    return categoriesRepo.list(ctx.supabase, { tenantId, includeInactive: true });
  });

// ============ ADMIN WRITES — PRODUCTS ============

export const adminCreateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    productInputBase.extend({ tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context;
    await assertAdmin(ctx);
    const { tenantId: overrideTenant, ...input } = data;
    const tenantId = await resolveAdminTenant(ctx, overrideTenant);
    return productsRepo.create(ctx.supabase, tenantId, input);
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    productUpdateBase.extend({ tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context;
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
    const ctx = context;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);
    await productsRepo.remove(ctx.supabase, tenantId, data.id);
    return { ok: true };
  });

export function inferCategorySlug(
  title: string,
  tags: string[] = [],
  description: string = "",
): string {
  const text = `${title} ${tags.join(" ")} ${description}`.toLowerCase();

  if (
    text.includes("_gcat:electronics") ||
    text.includes("_gcat:cell phones") ||
    text.includes("_gcat:cameras")
  )
    return "electronics";
  if (text.includes("_gcat:beauty") || text.includes("_gcat:personal care")) return "beauty-care";
  if (text.includes("_gcat:kitchen") || text.includes("_gcat:cookware")) return "kitchen";
  if (text.includes("_gcat:home") || text.includes("storage") || text.includes("organization"))
    return "storage-organization";
  if (text.includes("_gcat:health") || text.includes("massage")) return "health-massage";
  if (text.includes("_gcat:sports") || text.includes("fitness")) return "sports-fitness";
  if (text.includes("_gcat:automotive") || text.includes("car")) return "automotive";
  if (text.includes("_gcat:toys") || text.includes("baby") || text.includes("kids"))
    return "kids-toys";

  if (
    /سيار|طلاء|سيارات|داش|كشاف سيارة|صنفرة|فحص سمك|مسدس غسيل|ملمع|خدوش|إطارات|عزم|رافع|رافعة|طوارئ|مكشاف/i.test(
      text,
    )
  )
    return "automotive";
  if (
    /مساج|تدليك|رقبة|كتف|مشد|صحة|أنف|تنفس|موسع|قفاز|تأهيل|ركبة|راحة|استرخاء|مرتبة هوائية|طوق|كهربائي للمقاعد/i.test(
      text,
    )
  )
    return "health-massage";
  if (
    /مطبخ|مطابخ|خبازة|قهوة|شواية|برجر|ثلج|فرن|قطاعة|موقد|عصارة|ساندويتش|طعام|أواني|قلاية|خلاط|حافظة طعام|صانع ثلج|صانعة الثلج|صانع البرجر/i.test(
      text,
    )
  )
    return "kitchen";
  if (
    /حلاقة|شعر|مجفف|تبييض|ليزر|تجميل|بشرة|العين|رموش|ساونا|مربط|استحمام|فوارة|تصفيف|تمليس|تنعيم|شفط الدهون|حب الشباب|مكينة حلاقة/i.test(
      text,
    )
  )
    return "beauty-care";
  if (
    /رف|رفوف|ستارة|منظم|دولاب|حامل|تخزين|منشر|ممسحة|لاصق|معجون|سيليكون|عازل|سحري|قماشي|محفظة|مثبتات/i.test(
      text,
    )
  )
    return "storage-organization";
  if (
    /رياض|لياقة|قبضة|تمرين|تمارين|سير|دراجة|عصا القوة|الة رياضة|تسلق|واقي ركبة|بدلة ساونا/i.test(
      text,
    )
  )
    return "sports-fitness";
  if (
    /طفل|أطفال|لعبة|العاب|سرير أطفال|ناموسية|أسد|يوفو|كرسي أطفال|سيارة التحكم|مقياس طول الأرنب/i.test(
      text,
    )
  )
    return "kids-toys";

  return "electronics";
}

export const adminAutoCategorizeProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ tenantId: z.string().uuid().optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const ctx = context;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);

    let dbCategories = await categoriesRepo.list(ctx.supabase, {
      tenantId,
      includeInactive: true,
    });

    if (!dbCategories || dbCategories.length === 0) {
      const defaultCats = [
        { name: "إلكترونيات", slug: "electronics", icon: "Smartphone", color: "purple" },
        { name: "الجمال والعناية", slug: "beauty-care", icon: "Sparkles", color: "pink" },
        { name: "المطبخ والأواني", slug: "kitchen", icon: "Utensils", color: "orange" },
        {
          name: "التنظيم والتخزين",
          slug: "storage-organization",
          icon: "Archive",
          color: "yellow",
        },
        { name: "الصحة والمساج", slug: "health-massage", icon: "Activity", color: "red" },
        { name: "الرياضة واللياقة", slug: "sports-fitness", icon: "Flame", color: "emerald" },
        { name: "السيارات والإكسسوارات", slug: "automotive", icon: "Car", color: "blue" },
        { name: "الأطفال والألعاب", slug: "kids-toys", icon: "Baby", color: "cyan" },
      ];
      for (let i = 0; i < defaultCats.length; i++) {
        const cat = defaultCats[i];
        try {
          await categoriesRepo.create(ctx.supabase, tenantId, {
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            color: cat.color,
            is_active: true,
            sort: i,
          });
        } catch {
          // Category may already exist; refresh below.
        }
      }
      dbCategories = await categoriesRepo.list(ctx.supabase, {
        tenantId,
        includeInactive: true,
      });
    }

    const catMap = new Map<string, string>();
    for (const category of dbCategories) {
      catMap.set(category.slug.toLowerCase(), category.id);
    }
    const defaultCatId = dbCategories[0]?.id;
    const products = await productsRepo.list(ctx.supabase, { tenantId });
    let categorizedCount = 0;

    for (const product of products) {
      const slugMatch = inferCategorySlug(
        product.name,
        product.tags ?? [],
        product.description ?? "",
      );
      const categoryId = catMap.get(slugMatch) ?? defaultCatId;
      if (!categoryId || product.category_id === categoryId) continue;
      await productsRepo.update(ctx.supabase, tenantId, product.id, {
        category_id: categoryId,
      });
      categorizedCount++;
    }

    return { total: products.length, categorizedCount };
  });

export const adminBulkAssignCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        productIds: z.array(z.string()),
        categoryId: z.string().uuid(),
        tenantId: z.string().uuid().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context;
    await assertAdmin(ctx);
    const tenantId = await resolveAdminTenant(ctx, data.tenantId);

    const { error } = await ctx.supabase
      .from("products")
      .update({ category_id: data.categoryId })
      .eq("tenant_id", tenantId)
      .in("id", data.productIds);

    if (error) throw error;
    return { ok: true, count: data.productIds.length };
  });

// ============ ADMIN WRITES — CATEGORIES ============

export const adminCreateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    categoryInputSchema.extend({ tenantId: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context;
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
    const ctx = context;
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
    const ctx = context;
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
    const ctx = context;
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
    const ctx = context;
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
  } catch (vertexErr: unknown) {
    const vertexMessage = vertexErr instanceof Error ? vertexErr.message : String(vertexErr);
    console.warn(
      "⚠️ [Web-AI-Gateway] Vertex failed, falling back to Gemini Key Pool:",
      vertexMessage,
    );

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

const requireAuthWithClient = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});

export const aiAnalyzeImage = createServerFn({ method: "POST" })
  .middleware([requireAuthWithClient, requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ image: z.string() }).parse(raw))
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
  .inputValidator((raw: unknown) => z.object({ text: z.string() }).parse(raw))
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
