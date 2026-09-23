# Shopify feed for Meta catalogs

The public URL is `/api/catalog/shopify.csv` on the deployed store domain.
It uses the same configured Shopify Storefront connection as the storefront and
admin product list (`CATALOG_SOURCE=shopify`, `SHOPIFY_STORE_DOMAIN`, and the
server-side `SHOPIFY_STOREFRONT_ACCESS_TOKEN`). No Meta access token is required
to fetch this feed.

The endpoint exports all published products visible to that Storefront channel,
including all variant pages. Variant IDs are the numeric Shopify variant IDs;
`item_group_id` is the numeric Shopify product ID. Repeated uploads therefore
update the same items. Prices and currency come from each variant. No pricing
markup, fallback price, or artificial inventory quantity is applied. Product
links use Shopify's canonical online-store URL when available, with a variant
query parameter; otherwise they use the storefront's product page.

Products without an eligible HTTPS image, positive price, title, or currency are
excluded. `X-Catalog-Items` and `X-Catalog-Skipped-Variants` expose the counts.
Upstream or pagination failures return 503 with `no-store`; an empty successful
replacement is never returned. Successful responses can be cached for 5 minutes.

In each intended Meta catalog, add a scheduled data feed using this same URL.
Meta pulls updates according to its configured upload schedule; this is not an
event-driven webhook integration. Keep the existing Shopify-managed Meta feed
as its own source, and do not add this feed alongside it in the same catalog
without reviewing the existing item IDs and ownership.

The older `/api/catalog/<tenant-uuid>.csv` route remains a Supabase feed and is
not the Shopify URL. Do not use `/api/catalog/default.csv`.

Validate a deployment by checking HTTP 200, `text/csv; charset=utf-8`,
`X-Catalog-Source: shopify`, item and skipped counts, and sample IDs/prices against
Shopify. A successful build does not establish a working production feed.
