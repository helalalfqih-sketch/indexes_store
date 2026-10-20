# Indexes D1 theme preview

Preview: https://indexes-store-d1-preview.helalalfqih.workers.dev/

This standalone Worker applies the supplied October 19 Shopify theme export to
the existing D1 catalog. It preserves the custom Indexes Liquid markup, supplied
brand artwork, CSS, Arabic translations, product gallery, carousel and RTL
navigation. LiquidJS renders these selected templates on Workers; Shopify theme
runtime, app embeds, analytics, checkout and customer authentication are not
executed outside Shopify.

## Data and scope

- `DB` binds to `indexes-store-staging`; `TENANT_ID` selects the active store.
- The preview currently reads 12 published products and 9 categories. Every
  product query uses both tenant and publication constraints; category queries
  also require an active tenant. No database migration or write is performed.
- Product names, descriptions, prices, currencies and inventory come from D1.
  Existing D1 monetary amounts are displayed in their recorded units/currency;
  the adapter multiplies by 100 only to satisfy the theme's Liquid money
  contract. No exchange-rate conversion, price correction or currency change is
  performed. Totals for different currencies stay separate.
- Many existing D1 product images still reference unavailable Supabase storage.
  The preview uses a clearly labeled unavailable-image fallback. **No Supabase
  products or images were migrated.** A Shopify theme ZIP contains presentation
  files, not the merchant's full product export or policy text.
- Search, published product details, collections, sorting, pagination, favorites
  and a browser-local cart are implemented. A fresh server quote checks the
  canonical price and remaining stock before offering a WhatsApp inquiry link.
  Opening that link does not create an order, reserve stock, send a message or
  record a purchase. Authentication, order history and confirmed-order storage
  are not implemented by this preview.
- Shopify-only contact forms and login controls are replaced with truthful guest
  shopping/contact information. Policy text absent from the export is not
  fabricated; the footer links to the supplied order/delivery disclosures.
- Preview responses include `noindex`; they are not a production SEO release.

## Build, test and deploy

Use Node 24 and install the repository dependencies with `npm ci`.

```sh
npm run build:storefront
npm run test:storefront
npm run deploy:storefront
```

The build embeds only the selected templates and storefront assets into
`.tmp/storefront/worker.mjs`. It uses the browser build of LiquidJS and requires
no Node filesystem at runtime. The Worker serves its small text assets with
revisioned cache URLs. It has no Supabase client, Shopify API token, private
database credential, analytics integration or external order bridge.

`POST /api/cart/quote` accepts only product IDs and integer quantities (1–99,
up to 50 unique lines). Prices supplied by the browser are ignored. All other
data endpoints are read-only. Invalid/stale products have no WhatsApp order link.

## Verification — October 20, 2026

| Gate | Result | Evidence / limit |
| --- | --- | --- |
| D1 connection and hosted routes | PASS | Hosted health, home, collections, search and cart returned HTTP 200. |
| Catalog, stock and input validation | PASS | 8 SQLite-backed regression tests cover tenant/publication isolation, live stock changes, mixed currencies, malformed quantities, escaping, pagination and failure behavior. |
| Browser shopping flow | PASS | Hosted Chromium checked menu, Arabic suggestions, product detail, adding to cart, cart/favorites after reload and the generated WhatsApp destination. No message sent. |
| Responsive RTL | PASS | Layout checked at 360, 390, 430, 768 and 1440 px; no horizontal document overflow. |
| Product media | FAIL — existing dependency | Supabase-hosted product images are unavailable; explicit fallback works. Supplied Shopify brand/banner assets load. |
| Customer accounts and order history | NOT IMPLEMENTED | Guest scope is stated on the account page; no misleading login or order-success UI. |
| Performance audit | NOT RUN | Startup and bundle size are not a Core Web Vitals audit. |
| Production release | NOT DONE | Separate Worker only. Existing main Worker, Shopify theme and D1 data are unchanged. |

This is a functional interface preview, not a declaration that all Supabase
services have been replaced. Full catalog/media source, policy content and
account/order requirements remain needed for a complete production replacement.

## Rollback

The original theme ZIP remains the design source. Deployments target only
`indexes-store-d1-preview`; the existing `indexes-store` Worker and Shopify
published theme are unaffected. Revert the preview Worker version if needed;
there is no database rollback because this change writes no data.

References: [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/),
[D1 bindings](https://developers.cloudflare.com/workers/wrangler/configuration/#d1-databases),
[LiquidJS template rendering](https://liquidjs.com/tutorials/render-file.html).
