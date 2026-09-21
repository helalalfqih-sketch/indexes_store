import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export const STORE_MCP_PROTOCOL_VERSION = "2025-06-18";

export type StoreBridgeContext = {
  db: SupabaseClient<Database>;
  tenantId: string;
  userId: string;
  access: "platform_admin" | "tenant_member";
};

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

const tenantInput = {
  tenant_id: {
    type: "string",
    format: "uuid",
    description: "Tenant UUID. Must match the authenticated x-tenant-id header.",
  },
} as const;

export const STORE_MCP_TOOLS = [
  {
    name: "store_health",
    description: "Read-only health summary for the authenticated tenant and configured integrations.",
    inputSchema: {
      type: "object",
      properties: tenantInput,
      required: ["tenant_id"],
      additionalProperties: false,
    },
  },
  {
    name: "search_products",
    description: "Search tenant-scoped products without exposing customer or secret data.",
    inputSchema: {
      type: "object",
      properties: {
        ...tenantInput,
        query: { type: "string", minLength: 1, maxLength: 100 },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
      required: ["tenant_id", "query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_product",
    description: "Get one tenant-scoped product by UUID.",
    inputSchema: {
      type: "object",
      properties: {
        ...tenantInput,
        product_id: { type: "string", format: "uuid" },
      },
      required: ["tenant_id", "product_id"],
      additionalProperties: false,
    },
  },
  {
    name: "inspect_catalog",
    description: "Inspect catalog quality: zero prices, missing images, missing SKU/category and unpublished rows.",
    inputSchema: {
      type: "object",
      properties: {
        ...tenantInput,
        sample_limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
      },
      required: ["tenant_id"],
      additionalProperties: false,
    },
  },
  {
    name: "inspect_inventory",
    description: "Inspect stock, reserved stock and oversell risks for tenant products.",
    inputSchema: {
      type: "object",
      properties: {
        ...tenantInput,
        sample_limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
      },
      required: ["tenant_id"],
      additionalProperties: false,
    },
  },
  {
    name: "inspect_orders",
    description: "Return order counts and recent non-PII order status summaries for the tenant.",
    inputSchema: {
      type: "object",
      properties: {
        ...tenantInput,
        limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
      },
      required: ["tenant_id"],
      additionalProperties: false,
    },
  },
  {
    name: "inspect_pages",
    description: "Inspect tenant CMS page publication and SEO field completeness.",
    inputSchema: {
      type: "object",
      properties: tenantInput,
      required: ["tenant_id"],
      additionalProperties: false,
    },
  },
  {
    name: "audit_log",
    description: "Read recent tenant audit actions without returning actor email or secret payloads.",
    inputSchema: {
      type: "object",
      properties: {
        ...tenantInput,
        limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
      },
      required: ["tenant_id"],
      additionalProperties: false,
    },
  },
] as const;

const baseSchema = z.object({ tenant_id: z.string().uuid() }).strict();
const searchSchema = baseSchema.extend({
  query: z.string().trim().min(1).max(100),
  limit: z.number().int().min(1).max(50).default(20),
});
const productSchema = baseSchema.extend({ product_id: z.string().uuid() });
const sampleSchema = baseSchema.extend({
  sample_limit: z.number().int().min(1).max(100).default(25),
});
const limitSchema = baseSchema.extend({
  limit: z.number().int().min(1).max(100).default(25),
});

function asToolResult(value: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

export function toolError(message: string): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

function assertTenant(inputTenantId: string, context: StoreBridgeContext): void {
  if (inputTenantId !== context.tenantId) {
    throw new Error("Forbidden: tenant_id does not match the authenticated tenant.");
  }
}

function imageCount(images: unknown): number {
  return Array.isArray(images) ? images.filter((item) => typeof item === "string" && item.trim()).length : 0;
}

export async function runStoreBridgeTool(
  name: string,
  rawArguments: unknown,
  context: StoreBridgeContext,
): Promise<ToolResult> {
  try {
    switch (name) {
      case "store_health": {
        const input = baseSchema.parse(rawArguments ?? {});
        assertTenant(input.tenant_id, context);

        const [tenantResult, productsResult, ordersResult] = await Promise.all([
          context.db
            .from("tenants")
            .select("id, slug, name, plan, status")
            .eq("id", context.tenantId)
            .maybeSingle(),
          context.db
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", context.tenantId),
          context.db
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", context.tenantId),
        ]);

        const failure = tenantResult.error ?? productsResult.error ?? ordersResult.error;
        if (failure) throw failure;
        if (!tenantResult.data) throw new Error("Tenant not found or not visible to this user.");

        return asToolResult({
          ok: true,
          mode: "read_only",
          tenant: tenantResult.data,
          access: context.access,
          database: "reachable",
          counts: {
            products: productsResult.count ?? 0,
            orders: ordersResult.count ?? 0,
          },
          integrations: {
            shopify_configured: Boolean(
              process.env.SHOPIFY_STORE_DOMAIN &&
                (process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
                  process.env.SHOPIFY_STOREFRONT_TOKEN),
            ),
            vercel_environment: process.env.VERCEL_ENV ?? "unknown",
            supabase_authenticated: true,
          },
        });
      }

      case "search_products": {
        const input = searchSchema.parse(rawArguments ?? {});
        assertTenant(input.tenant_id, context);
        const { data, error } = await context.db
          .from("products")
          .select(
            "id, slug, name, price, currency, stock, reserved_stock, is_published, sku, category_id, images, updated_at",
          )
          .eq("tenant_id", context.tenantId)
          .ilike("name", `%${input.query}%`)
          .order("updated_at", { ascending: false })
          .limit(input.limit);
        if (error) throw error;
        return asToolResult({ count: data?.length ?? 0, products: data ?? [] });
      }

      case "get_product": {
        const input = productSchema.parse(rawArguments ?? {});
        assertTenant(input.tenant_id, context);
        const { data, error } = await context.db
          .from("products")
          .select(
            "id, external_id, slug, name, description, price, old_price, compare_at_price, currency, stock, reserved_stock, is_published, sku, barcode, brand, category_id, images, tags, created_at, updated_at",
          )
          .eq("tenant_id", context.tenantId)
          .eq("id", input.product_id)
          .maybeSingle();
        if (error) throw error;
        return asToolResult({ product: data ?? null });
      }

      case "inspect_catalog": {
        const input = sampleSchema.parse(rawArguments ?? {});
        assertTenant(input.tenant_id, context);
        const { data, error } = await context.db
          .from("products")
          .select("id, name, price, currency, images, sku, category_id, is_published, stock")
          .eq("tenant_id", context.tenantId)
          .limit(5000);
        if (error) throw error;

        const products = data ?? [];
        const zeroPrice = products.filter((item) => Number(item.price) <= 0);
        const missingImages = products.filter((item) => imageCount(item.images) === 0);
        const missingSku = products.filter((item) => !item.sku?.trim());
        const missingCategory = products.filter((item) => !item.category_id);
        const unpublished = products.filter((item) => !item.is_published);
        const compact = (items: typeof products) =>
          items.slice(0, input.sample_limit).map(({ id, name }) => ({ id, name }));

        return asToolResult({
          scanned: products.length,
          issues: {
            zero_or_invalid_price: zeroPrice.length,
            missing_images: missingImages.length,
            missing_sku: missingSku.length,
            missing_category: missingCategory.length,
            unpublished: unpublished.length,
          },
          samples: {
            zero_or_invalid_price: compact(zeroPrice),
            missing_images: compact(missingImages),
            missing_sku: compact(missingSku),
            missing_category: compact(missingCategory),
          },
          truncated: products.length === 5000,
        });
      }

      case "inspect_inventory": {
        const input = sampleSchema.parse(rawArguments ?? {});
        assertTenant(input.tenant_id, context);
        const { data, error } = await context.db
          .from("products")
          .select("id, name, stock, reserved_stock, is_published, updated_at")
          .eq("tenant_id", context.tenantId)
          .limit(5000);
        if (error) throw error;

        const products = data ?? [];
        const outOfStock = products.filter((item) => Number(item.stock ?? 0) <= 0);
        const negativeStock = products.filter((item) => Number(item.stock ?? 0) < 0);
        const overReserved = products.filter(
          (item) => Number(item.reserved_stock ?? 0) > Number(item.stock ?? 0),
        );
        const publishedUnavailable = products.filter(
          (item) => item.is_published && Number(item.stock ?? 0) <= 0,
        );
        const compact = (items: typeof products) =>
          items.slice(0, input.sample_limit).map((item) => ({
            id: item.id,
            name: item.name,
            stock: item.stock,
            reserved_stock: item.reserved_stock,
            is_published: item.is_published,
          }));

        return asToolResult({
          scanned: products.length,
          issues: {
            out_of_stock: outOfStock.length,
            negative_stock: negativeStock.length,
            reserved_exceeds_stock: overReserved.length,
            published_but_unavailable: publishedUnavailable.length,
          },
          samples: {
            negative_stock: compact(negativeStock),
            reserved_exceeds_stock: compact(overReserved),
            published_but_unavailable: compact(publishedUnavailable),
          },
          truncated: products.length === 5000,
        });
      }

      case "inspect_orders": {
        const input = limitSchema.parse(rawArguments ?? {});
        assertTenant(input.tenant_id, context);
        const { data, error } = await context.db
          .from("orders")
          .select("id, order_number, status, payment_status, total, currency, created_at, updated_at")
          .eq("tenant_id", context.tenantId)
          .order("created_at", { ascending: false })
          .limit(input.limit);
        if (error) throw error;

        const orders = data ?? [];
        const byStatus = orders.reduce<Record<string, number>>((acc, order) => {
          const key = String(order.status ?? "unknown");
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});

        return asToolResult({
          returned: orders.length,
          by_status: byStatus,
          orders,
          privacy: "Customer names, phones, addresses, emails and notes are intentionally excluded.",
        });
      }

      case "inspect_pages": {
        const input = baseSchema.parse(rawArguments ?? {});
        assertTenant(input.tenant_id, context);
        const { data, error } = await context.db
          .from("cms_pages")
          .select("id, slug, title, is_published, meta_title, meta_description, canonical_url, updated_at")
          .eq("tenant_id", context.tenantId)
          .order("updated_at", { ascending: false })
          .limit(500);
        if (error) throw error;

        const pages = data ?? [];
        return asToolResult({
          total: pages.length,
          published: pages.filter((page) => page.is_published).length,
          drafts: pages.filter((page) => !page.is_published).length,
          missing_meta_title: pages.filter((page) => !page.meta_title?.trim()).map((page) => page.slug),
          missing_meta_description: pages
            .filter((page) => !page.meta_description?.trim())
            .map((page) => page.slug),
          pages,
        });
      }

      case "audit_log": {
        const input = limitSchema.parse(rawArguments ?? {});
        assertTenant(input.tenant_id, context);
        const { data, error } = await context.db
          .from("tenant_audit_logs")
          .select("id, action, created_at")
          .eq("tenant_id", context.tenantId)
          .order("created_at", { ascending: false })
          .limit(input.limit);
        if (error) throw error;
        return asToolResult({
          entries: data ?? [],
          privacy: "Actor email and details payload are intentionally excluded.",
        });
      }

      default:
        return toolError(`Unknown read-only store tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Store bridge request failed.";
    return toolError(message);
  }
}
