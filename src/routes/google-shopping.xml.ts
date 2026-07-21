/**
 * Google Merchant Center Product Feed — google-shopping.xml
 * ──────────────────────────────────────────────────────────
 * Generates a complete RSS 2.0 / Google Shopping XML feed using
 * Google's required Product Data Specification fields:
 *
 *   Required:
 *     g:id, g:title, g:description, g:link, g:image_link,
 *     g:availability, g:price, g:condition
 *
 *   Recommended:
 *     g:brand, g:mpn, g:gtin (gtin8/12/13/14), g:sku,
 *     g:product_type, g:google_product_category,
 *     g:additional_image_link, g:shipping
 *
 * Merchant Center submission:
 *   Submit this URL in Merchant Center → Feeds → RSS 2.0
 *   URL: https://indexes-store.com/google-shopping.xml
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

/** Format price for Google Merchant: "1234.00 YER" */
function merchantPrice(price: number): string {
  return `${price.toFixed(2)} ${STORE_CURRENCY}`;
}

/** Build a single <item> block for the Google feed */
function buildProductItem(p: any, baseUrl: string): string {
  const productUrl = `${baseUrl}/product/${xmlEscape(p.slug)}`;
  const imageUrl = xmlEscape(p.image || "");
  const availability = merchantAvailability(p.stock, p.availability);
  const condition = merchantCondition(p.condition);
  const price = merchantPrice(p.price);

  const sku = xmlEscape(p.sku || p.id);
  const mpn = xmlEscape(p.mpn || p.sku || p.id);
  
  // GTIN resolution (explicit fields take priority over barcode, no fallback to id)
  const gtinValue = p.gtin14 || p.gtin13 || p.gtin12 || p.gtin8 || p.barcode || null;
  const gtinField = gtinValue ? `    <g:gtin>${xmlEscape(gtinValue)}</g:gtin>\n` : "";

  // Additional images (all except the primary)
  const extraImages = Array.isArray(p.images)
    ? p.images
        .slice(1, 11) // Merchant Center supports up to 10 additional images
        .map((img: string) => `    <g:additional_image_link>${xmlEscape(img)}</g:additional_image_link>`)
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

// @ts-ignore — Route registered after vite build generates routeTree.gen.ts
export const Route = createFileRoute("/google-shopping/xml")({

  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const baseUrl = process.env.SITE_URL || (origin !== "null" ? origin : "");

        let products: any[] = [];
        try {
          products = await fetchProducts({ limit: 500 });
        } catch {
          products = [];
        }

        const items = products
          .filter((p) => p.stock > 0 || p.availability !== "out_of_stock")
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
            "x-robots-tag": "noindex",
          },
        });
      },
    },
  },
});
