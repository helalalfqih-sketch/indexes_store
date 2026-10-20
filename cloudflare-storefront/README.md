# Indexes Shopify catalog preview on Cloudflare

Preview: https://indexes-store-d1-preview.helalalfqih.workers.dev/

This standalone Worker applies the supplied October 19 Shopify theme export to
live Shopify product data. It preserves the custom Indexes Liquid markup,
brand artwork, CSS, Arabic translations, product gallery, carousel and RTL
navigation. LiquidJS renders the selected templates on Workers. Shopify theme
runtime, app embeds, analytics, checkout and customer authentication are not
executed outside Shopify.

## Catalog and application data

- `CATALOG_SOURCE=shopify` reads the public Storefront API for
  `indexesstore.myshopify.com`, pinned to API version `2026-10`. The preview
  requires no Shopify administrative token and performs no Shopify writes.
- On October 20, 2026, pagination verified 707 public products and 25 public
  collections, of which 24 contained products. Counts can change as the merchant
  publishes products. Listings use cursor pagination; they do not invent totals.
- Titles, descriptions, prices, currencies, images, variants and sale
  availability come from Shopify. No exchange-rate conversion or price
  correction is performed. Amounts are multiplied by 100 only for the theme's
  Liquid money contract. Totals for different currencies stay separate.
- Product/detail responses are cached for 60 seconds and collections for 300
  seconds. The cart quote bypasses these caches to recheck canonical variant
  prices, sale availability and quantity rules. Exact remaining inventory is not
  available through this tokenless integration, so the interface explicitly
  states that the requested quantity needs confirmation.
- `DB` remains bound to `indexes-store-staging`. D1 remains connected; Shopify
  products are not copied into it. The tenant-scoped, read-only D1 adapter is
  retained as a separately configured legacy source. No database migration or
  write is performed. **No Supabase products or images were migrated.**
- Search, details, collections, sorting, pagination, favorites and a browser-local
  cart are implemented. The WhatsApp link is an inquiry, not a confirmed order.
  It does not send a message, reserve stock or record a purchase. Authentication,
  order history and confirmed-order storage are not implemented.
- Removed variants and old D1 cart IDs fail validation instead of being guessed
  from names. Shopify-only contact forms and login controls use truthful guest
  shopping/contact information. Missing policy text is not fabricated.
- Preview responses include `noindex`; the main Worker and published Shopify
  theme are unchanged.

## Build, test and deploy

Use Node 24 and install dependencies with `npm ci`.

```sh
npm run build:storefront
npm run test:storefront
npm run deploy:storefront
```

The build embeds selected templates and assets in `.tmp/storefront/worker.mjs`.
It uses the browser build of LiquidJS, with no Node filesystem at runtime. Assets
use revisioned cache URLs. There is no Supabase client, private database
credential, analytics integration or external order bridge in this Worker.

`POST /api/cart/quote` accepts variant IDs and integer quantities (1–99, up to
50 unique lines). Browser-supplied prices are ignored. Invalid or stale products
produce no WhatsApp order link. Other data endpoints are read-only.

## Verification — October 20, 2026

- 15 regression tests cover Shopify variant identity, real media and currency,
  collection filtering, sorting, cursor pagination, cache freshness, fresh quote
  validation, removed variants, upstream failures, detail pagination and Worker
  integration, plus the existing D1 isolation and input-validation coverage.
- ESLint and Wrangler deployment dry-run pass. The preview is deployed with
  Shopify as the catalog source; the health route verifies its D1 connection.
- Live API checks verified the public catalog count, collections, Arabic search,
  detail pages and the three selected variants at 14,500, 23,500 and 12,500 YER.
  Their server-validated total is 50,500 YER.
- Hosted browser verification covers product images, pagination, cart and
  favorites after reload, variant details, Arabic suggestions, WhatsApp quote,
  and layout at 360, 390, 430, 768 and 1440 px. No WhatsApp message is sent.
- Customer accounts/order history are not implemented. A performance/Core Web
  Vitals audit has not been run. This is a preview, not a claim that every
  Supabase service has been replaced.

## Rollback

Deployments target only `indexes-store-d1-preview`. Revert its Worker version
if needed. There is no database rollback because this change writes no data.
The original supplied ZIP remains the design source.

References: [Storefront API and tokenless access](https://shopify.dev/docs/api/storefront/latest),
[Product variants](https://shopify.dev/docs/api/storefront/latest/objects/ProductVariant),
[D1 bindings](https://developers.cloudflare.com/workers/wrangler/configuration/#d1-databases),
[LiquidJS rendering](https://liquidjs.com/tutorials/render-file.html).
