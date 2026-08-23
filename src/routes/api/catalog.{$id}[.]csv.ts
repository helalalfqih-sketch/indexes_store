import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { listProducts } from "@/lib/catalog.functions";
import type { ProductDTO } from "@/lib/domain/product";

const tenantIdSchema = z.string().uuid();

const CSV_HEADERS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  "additional_image_link",
] as const;

const RESPONSE_HEADERS = {
  "Content-Type": "text/csv; charset=utf-8",
  "Content-Disposition": 'inline; filename="catalog.csv"',
  "Cache-Control": "public, max-age=300",
} as const;

function csvCell(value: unknown): string {
  const normalized = String(value ?? "").replace(/\r\n?/g, "\n");
  return `"${normalized.replace(/"/g, '""')}"`;
}

function metaAvailability(product: ProductDTO): string {
  const availability = product.availability
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (availability === "preorder") return "preorder";
  if (availability === "available_for_order" || availability === "backorder") {
    return "available for order";
  }
  if (availability === "discontinued" || availability === "disabled") return "discontinued";
  if (availability === "out_of_stock" || product.stock <= 0) return "out of stock";
  return "in stock";
}

function metaCondition(condition?: string | null): string {
  const normalized = condition?.trim().toLowerCase();
  if (normalized === "used") return "used";
  if (normalized === "refurbished") return "refurbished";
  return "new";
}

function validHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function buildCatalogCsv(products: ProductDTO[], baseUrl: string): string {
  const rows = products.flatMap((product) => {
    const imageLink = product.images.map(validHttpsUrl).find(Boolean);
    const price = Number(product.price);

    if (!product.id || !product.slug || !product.name.trim() || !imageLink) return [];
    if (!Number.isFinite(price) || price <= 0) return [];

    const additionalImageLink = product.images
      .slice(1)
      .map(validHttpsUrl)
      .find((url) => Boolean(url) && url !== imageLink);

    return [
      [
        product.id,
        product.name,
        product.description?.trim() || product.name,
        metaAvailability(product),
        metaCondition(product.condition),
        `${price.toFixed(2)} ${product.currency || "YER"}`,
        `${baseUrl}/product/${encodeURIComponent(product.slug)}`,
        imageLink,
        product.brand?.trim() || "Indexes Store",
        additionalImageLink || "",
      ]
        .map(csvCell)
        .join(","),
    ];
  });

  return [CSV_HEADERS.join(","), ...rows].join("\n") + "\n";
}

async function catalogResponse(request: Request, tenantId: string): Promise<Response> {
  const parsedTenantId = tenantIdSchema.safeParse(tenantId);
  if (!parsedTenantId.success) {
    return new Response("Catalog not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const products = await listProducts({ data: { tenantId: parsedTenantId.data } });
    const baseUrl = new URL(request.url).origin;
    const csv = buildCatalogCsv(products, baseUrl);

    return new Response(csv, {
      status: 200,
      headers: RESPONSE_HEADERS,
    });
  } catch (error) {
    console.error("[MetaCatalogFeed] Failed to generate feed", error);
    return new Response("Catalog temporarily unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}

export const Route = createFileRoute("/api/catalog/{$id}.csv")({
  server: {
    handlers: {
      GET: ({ request, params }) => catalogResponse(request, params.id),
      HEAD: ({ request, params }) => catalogResponse(request, params.id),
    },
  },
});
