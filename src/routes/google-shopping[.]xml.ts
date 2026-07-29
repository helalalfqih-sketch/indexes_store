/**
 * Google Merchant Center Product Feed — google-shopping.xml
 */

import { createFileRoute } from "@tanstack/react-router";
import { fetchProducts } from "@/lib/actions/product.actions";
import {
  merchantAvailability,
  merchantCondition,
  xmlEscape,
  SITE_NAME,
  STORE_CURRENCY,
  STORE_COUNTRY,
} from "@/lib/seo";

interface MerchantProduct {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  images?: string[] | null;
  stock?: number | null;
  availability?: string | null;
  condition?: string | null;
  brand?: string | null;
  sku?: string | null;
  mpn?: string | null;
  gtin14?: string | null;
  gtin13?: string | null;
  gtin12?: string | null;
  gtin8?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  is_published?: boolean | null;
}

function merchantPrice(price: number): string {
  return `${price.toFixed(2)} ${STORE_CURRENCY}`;
}

function buildProductItem(p: MerchantProduct, baseUrl: string): string {
  const productUrl = `${baseUrl}/product/${xmlEscape(p.slug)}`;
  const imageUrl = xmlEscape(p.image || p.images?.[0] || "");
  const availability = merchantAvailability(p.stock ?? 0, p.availability ?? undefined);
  const condition = merchantCondition(p.condition ?? undefined);
  const price = merchantPrice(p.price);
  const sku = xmlEscape(p.sku || p.id);
  const mpn = xmlEscape(p.mpn || p.sku || p.id);
  const gtinValue = p.gtin14 || p.gtin13 || p.gtin12 || p.gtin8 || p.barcode || null;
  const gtinField = gtinValue ? `    <g:gtin>${xmlEscape(gtinValue)}</g:gtin>\n` : "";
  const extraImages = Array.isArray(p.images)
    ? p.images
        .slice(1, 11)
        .map((img) => `    <g:additional_image_link>${xmlEscape(img)}</g:additional_image_link>`)
        .join("\n")
    : "";

  return `  <item>
    <g:id>${xmlEscape(p.id)}</g:id>
    <g:title>${xmlEscape(p.name)}</g:title>
    <g:description>${xmlEscape((p.description || "").slice(0, 5000))}</g:description>
    <g:link>${productUrl}</g:link>
    <g:image_link>${imageUrl}</g:image_link>
${extraImages ? extraImages + "\n" : ""}    <g:availability>${availability}</g:availability>
    <g:price>${price}</g:price>
    <g:condition>${condition}</g:condition>
    <g:brand>${xmlEscape(p.brand || SITE_NAME)}</g:brand>
    <g:sku>${sku}</g:sku>
    <g:mpn>${mpn}</g:mpn>
${gtinField}    <g:product_type>${xmlEscape(p.categoryId || "عام")}</g:product_type>
    <g:shipping>
      <g:country>${STORE_COUNTRY}</g:country>
      <g:service>Standard</g:service>
      <g:price>0.00 ${STORE_CURRENCY}</g:price>
    </g:shipping>
    <g:return_policy_label>free_returns</g:return_policy_label>
    <link>${productUrl}</link>
    <title>${xmlEscape(p.name)}</title>
  </item>`;
}

export const Route = createFileRoute("/google-shopping.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const baseUrl = process.env.SITE_URL || (origin !== "null" ? origin : "");

        let products: MerchantProduct[] = [];
        try {
          products = (await fetchProducts({ limit: 500 })) as unknown as MerchantProduct[];
        } catch {
          products = [];
        }

        const items = products
          .filter((p) => p.is_published !== false && p.availability !== "disabled")
          .map((p) => buildProductItem(p, baseUrl))
          .join("\n");

        const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(SITE_NAME)} — Google Shopping Feed</title>
    <link>${baseUrl}</link>
    <description>Product feed for Google Merchant Center — ${xmlEscape(SITE_NAME)}</description>
    <language>ar</language>
${items}
  </channel>
</rss>`;

        return new Response(feed, {
          status: 200,
          headers: {
            "content-type": "application/rss+xml; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
