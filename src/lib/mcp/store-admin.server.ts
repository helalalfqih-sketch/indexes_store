import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { diagnoseShopifyCatalog } from "@/lib/shopify/catalog.functions";
import { getTenant } from "@/lib/saas/tenant-context";

const MAX_SCAN = 1000;
const MAX_RESULTS = 100;

type RuntimeIncident = {
  id: string;
  level: string;
  title: string;
  message: string;
  source: string;
  occurrences_count: number;
  first_seen_at: string;
  last_seen_at: string;
  status: string;
};

type RuntimeResult = {
  data: RuntimeIncident[] | null;
  error: { message: string } | null;
};

type RuntimeQuery = {
  eq(column: string, value: string): RuntimeQuery;
  order(column: string, options: { ascending: boolean }): RuntimeQuery;
  limit(value: number): PromiseLike<RuntimeResult>;
};

type RuntimeClient = {
  from(table: "runtime_incidents"): {
    select(columns: string): RuntimeQuery;
  };
};

function fail(error: { message: string } | null, fallback: string) {
  if (error) throw new Error(fallback);
}

function maskEmail(value: string | null) {
  if (!value) return null;
  const [name, domain] = value.split("@");
  if (!domain) return "***";
  return `${name.slice(0, 2)}***@${domain}`;
}

function redactDetails(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redactDetails(item, depth + 1));
  if (!value || typeof value !== "object") {
    return typeof value === "string" && value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      /(secret|token|password|credential|api.?key)/i.test(key)
        ? "[redacted]"
        : redactDetails(item, depth + 1),
    ]),
  );
}

export interface StoreAdminAdapter {
  health(): Promise<Record<string, unknown>>;
  searchProducts(query: string, limit: number): Promise<Record<string, unknown>>;
  getProduct(productId: string): Promise<Record<string, unknown>>;
  inspectCatalog(): Promise<Record<string, unknown>>;
  inspectInventory(lowStockThreshold: number): Promise<Record<string, unknown>>;
  inspectOrders(limit: number): Promise<Record<string, unknown>>;
  inspectPages(): Promise<Record<string, unknown>>;
  inspectRuntimeErrors(limit: number): Promise<Record<string, unknown>>;
  auditLog(limit: number): Promise<Record<string, unknown>>;
}

export function createStoreAdminAdapter(tenantId: string): StoreAdminAdapter {
  const db = getSupabaseAdmin();

  return {
    async health() {
      const [tenant, products, orders, pages, shopify] = await Promise.all([
        getTenant(db, tenantId),
        db.from("products").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
        db.from("orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
        db.from("cms_pages").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
        diagnoseShopifyCatalog(),
      ]);
      if (!tenant) throw new Error("TENANT_NOT_FOUND");
      fail(products.error, "PRODUCT_HEALTH_UNAVAILABLE");
      fail(orders.error, "ORDER_HEALTH_UNAVAILABLE");
      fail(pages.error, "PAGE_HEALTH_UNAVAILABLE");
      return {
        tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, status: tenant.status },
        database: {
          healthy: true,
          products: products.count ?? 0,
          orders: orders.count ?? 0,
          pages: pages.count ?? 0,
        },
        shopify: {
          healthy: shopify.healthy,
          configured: shopify.domainPresent && shopify.tokenPresent,
          source: shopify.source,
          apiVersion: shopify.apiVersion,
        },
        mode: "read-only",
        checkedAt: new Date().toISOString(),
      };
    },

    async searchProducts(query, limit) {
      let request = db
        .from("products")
        .select(
          "id, slug, name, description, price, currency, stock, reserved_stock, is_published, sku, external_id, images, updated_at",
        )
        .eq("tenant_id", tenantId)
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (query) request = request.ilike("name", `%${query.replace(/[%,]/g, "")}%`);
      const { data, error } = await request;
      fail(error, "PRODUCT_SEARCH_UNAVAILABLE");
      return { tenantId, source: "supabase", products: data ?? [], count: data?.length ?? 0 };
    },

    async getProduct(productId) {
      const { data, error } = await db
        .from("products")
        .select(
          "id, slug, name, description, price, currency, stock, reserved_stock, is_published, sku, barcode, external_id, images, videos, category_id, brand, availability, updated_at",
        )
        .eq("tenant_id", tenantId)
        .eq("id", productId)
        .maybeSingle();
      fail(error, "PRODUCT_READ_UNAVAILABLE");
      return { tenantId, found: Boolean(data), product: data ?? null };
    },

    async inspectCatalog() {
      const { data, error } = await db
        .from("products")
        .select("id, slug, name, description, price, stock, images, is_published, sku, external_id")
        .eq("tenant_id", tenantId)
        .limit(MAX_SCAN);
      fail(error, "CATALOG_INSPECTION_UNAVAILABLE");
      const products = data ?? [];
      const slugCounts = new Map<string, number>();
      const skuCounts = new Map<string, number>();
      products.forEach((product) => {
        slugCounts.set(product.slug, (slugCounts.get(product.slug) ?? 0) + 1);
        if (product.sku) skuCounts.set(product.sku, (skuCounts.get(product.sku) ?? 0) + 1);
      });
      const issues = products.flatMap((product) => {
        const found: Array<{ productId: string; name: string; issue: string }> = [];
        if (!Number.isFinite(product.price) || product.price <= 0)
          found.push({ productId: product.id, name: product.name, issue: "invalid_or_zero_price" });
        if (!Array.isArray(product.images) || product.images.length === 0)
          found.push({ productId: product.id, name: product.name, issue: "missing_images" });
        if (!product.description?.trim())
          found.push({ productId: product.id, name: product.name, issue: "missing_description" });
        if ((slugCounts.get(product.slug) ?? 0) > 1)
          found.push({ productId: product.id, name: product.name, issue: "duplicate_slug" });
        if (product.sku && (skuCounts.get(product.sku) ?? 0) > 1)
          found.push({ productId: product.id, name: product.name, issue: "duplicate_sku" });
        return found;
      });
      return {
        tenantId,
        source: "supabase",
        scanned: products.length,
        scanLimit: MAX_SCAN,
        truncatedScan: products.length === MAX_SCAN,
        issueCount: issues.length,
        issues: issues.slice(0, MAX_RESULTS),
        truncatedIssues: issues.length > MAX_RESULTS,
      };
    },

    async inspectInventory(lowStockThreshold) {
      const { data, error } = await db
        .from("products")
        .select(
          "id, slug, name, sku, stock, reserved_stock, availability, is_published, external_id",
        )
        .eq("tenant_id", tenantId)
        .order("stock", { ascending: true })
        .limit(MAX_SCAN);
      fail(error, "INVENTORY_INSPECTION_UNAVAILABLE");
      const products = data ?? [];
      const issues = products
        .map((product) => ({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          reservedStock: product.reserved_stock,
          availableStock: product.stock - product.reserved_stock,
          published: product.is_published,
          externalId: product.external_id,
        }))
        .filter((product) => product.availableStock <= lowStockThreshold);
      return {
        tenantId,
        source: "supabase",
        scanned: products.length,
        lowStockThreshold,
        lowOrOutOfStockCount: issues.length,
        products: issues.slice(0, MAX_RESULTS),
        truncated: issues.length > MAX_RESULTS,
        comparisonNote:
          "Shopify Storefront exposes sale availability, not an exact inventory quantity; exact quantity comparison is intentionally not inferred.",
      };
    },

    async inspectOrders(limit) {
      const { data, error } = await db
        .from("orders")
        .select("id, order_number, status, payment_status, total, currency, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);
      fail(error, "ORDER_INSPECTION_UNAVAILABLE");
      const orders = data ?? [];
      const byStatus = orders.reduce<Record<string, number>>((acc, order) => {
        acc[order.status] = (acc[order.status] ?? 0) + 1;
        return acc;
      }, {});
      return { tenantId, count: orders.length, byStatus, orders, piiIncluded: false };
    },

    async inspectPages() {
      const { data, error } = await db
        .from("cms_pages")
        .select(
          "id, slug, title, is_published, meta_title, meta_description, og_image, canonical_url, updated_at",
        )
        .eq("tenant_id", tenantId)
        .order("updated_at", { ascending: false })
        .limit(MAX_RESULTS);
      fail(error, "PAGE_INSPECTION_UNAVAILABLE");
      const pages = data ?? [];
      return {
        tenantId,
        count: pages.length,
        pages: pages.map((page) => ({
          ...page,
          issues: [
            !page.meta_title ? "missing_meta_title" : null,
            !page.meta_description ? "missing_meta_description" : null,
            !page.canonical_url ? "missing_canonical_url" : null,
          ].filter(Boolean),
        })),
      };
    },

    async inspectRuntimeErrors(limit) {
      const runtimeDb = db as unknown as RuntimeClient;
      const { data, error } = await runtimeDb
        .from("runtime_incidents")
        .select(
          "id, level, title, message, source, occurrences_count, first_seen_at, last_seen_at, status",
        )
        .eq("tenant_id", tenantId)
        .order("last_seen_at", { ascending: false })
        .limit(limit);
      fail(error, "RUNTIME_INSPECTION_UNAVAILABLE");
      const incidents = data ?? [];
      return {
        tenantId,
        count: incidents.length,
        open: incidents.filter((item) => item.status === "open").length,
        fatal: incidents.filter((item) => item.level === "fatal").length,
        incidents,
      };
    },

    async auditLog(limit) {
      const { data, error } = await db
        .from("tenant_audit_logs")
        .select("id, actor_email, action, details, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);
      fail(error, "AUDIT_LOG_UNAVAILABLE");
      return {
        tenantId,
        entries: (data ?? []).map((entry) => ({
          id: entry.id,
          actor: maskEmail(entry.actor_email),
          action: entry.action,
          details: redactDetails(entry.details),
          createdAt: entry.created_at,
        })),
      };
    },
  };
}
