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

export function isMerchantEligible(product: MerchantProduct): boolean {
  const image = (product.image || product.images?.[0] || "").trim();
  return (
    product.is_published !== false &&
    product.availability !== "disabled" &&
    Number.isFinite(product.price) &&
    product.price > 0 &&
    Boolean(product.id?.trim()) &&
    Boolean(product.slug?.trim()) &&
    Boolean(product.name?.trim()) &&
    /^https?:\/\//i.test(image)
  );
}

function merchantPrice(price: number): string {
  return `${price.toFixed(2)} ${STORE_CURRENCY}`;
}

function buildProductItem(product: MerchantProduct, baseUrl: string): string {
  const productUrl = `${baseUrl}/product/${xmlEscape(product.slug)}`;
  const imageUrl = xmlEscape(product.image || product.images?.[0] || "");
  const availability = merchantAvailability(
    product.stock ?? 0,
    product.availability ?? undefined,
  );
  const condition = merchantCondition(product.condition ?? undefined);
  const sku = xmlEscape(product.sku || product.id);
  const mpn = xmlEscape(product.mpn || product.sku || product.id);
  const gtin = product.gtin14 || product.gtin13 || product.gtin12 || product.gtin8 || product.barcode;
  const extraImages = (product.images || [])
    .slice(1, 11)
    .filter((image) => /^https?:\/\//i.test(image))
    .map((image) => `    <g:additional_image_link>${xmlEscape(image)}</g:additional_image_link>`)
    .join("\n");

  return `  <item>
    <g:id>${xmlEscape(product.id)}</g:id>
    <g:title>${xmlEscape(product.name)}</g:title>
    <g:description>${xmlEscape((product.description || "").slice(0, 5000))}</g:description>
    <g:link>${productUrl}</g:link>
    <g:image_link>${imageUrl}</g:image_link>
${extraImages ? extraImages + "\n" : ""}    <g:availability>${availability}</g:availability>
    <g:price>${merchantPrice(product.price)}</g:price>
    <g:condition>${condition}</g:condition>
    <g:brand>${xmlEscape(product.brand || SITE_NAME)}</g:brand>
    <g:sku>${sku}</g:sku>
    <g:mpn>${mpn}</g:mpn>
${gtin ? `    <g:gtin>${xmlEscape(gtin)}</g:gtin>\n` : ""}    <g:product_type>${xmlEscape(product.categoryId || "عام")}</g:product_type>
    <g:shipping>
      <g:country>${STORE_COUNTRY}</g:country>
      <g:service>Standard</g:service>
      <g:price>0.00 ${STORE_CURRENCY}</g:price>
    </g:shipping>
    <link>${productUrl}</link>
    <title>${xmlEscape(product.name)}</title>
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
          .filter(isMerchantEligible)
          .map((product) => buildProductItem(product, baseUrl))
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
