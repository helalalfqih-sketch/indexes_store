# Indexes Store: Shopify-native WhatsApp order bridge (staging only)

## Status

This directory now contains a **staging-only order implementation**, disabled by
all default settings. It reuses the web bridge's runtime-independent draft service,
checks shop identity and tenant/schema, applies durable rate limits, resolves
existing catalog mappings without editing products, commits through
`create_checkout_order_v2`, then verifies/persists a Shopify Draft Order.
Unknown mutation outcomes retain the unique claim and require reconciliation.

This is **not deployed or operationally verified**. The known production Supabase
URL is explicitly rejected even if the write switch is enabled. Do not enable the
unpublished theme until isolated staging and an approved test order pass.
Direct WhatsApp links remain unchanged.

### Private staging configuration

- `INDEXES_NATIVE_ORDER_WRITES_ENABLED=true`
- `INDEXES_ORDER_ENVIRONMENT=staging`
- `INDEXES_SHOPIFY_DOMAIN=ubhd8d-iz.myshopify.com`
- `INDEXES_STAGING_TENANT_ID`: independently verified active staging tenant UUID
- `SUPABASE_URL` and `INDEXES_EXPECTED_STAGING_URL`: identical isolated project URL
- `SUPABASE_SERVICE_ROLE_KEY`: that staging project's server-only credential
- `SHOPIFY_ADMIN_ACCESS_TOKEN`: app credential for the verified Shopify shop
- `SHOPIFY_APP_CLIENT_SECRET`: secret of the app that signs the proxy requests
- `SHOPIFY_ORDER_TURNSTILE_SECRET`: challenge secret restricted to the shop/action

Never commit values or place private credentials in Liquid. The function's
`deno.json` pins the Supabase dependency. Configure the signed app proxy upstream
to this staging function; do not expose an unsigned alternate checkout endpoint.
The request still passes signature and challenge checks before backend invocation.

Apply `20261012153000_native_checkout_rate_limit.sql` after the existing checkout
and draft-link migrations in staging. Limits are 5 attempts per phone-derived
HMAC and 100 per tenant within a 10-minute window, enforced atomically in SQL.
These conservative staging limits are not a production capacity policy. A future
production release also needs expiry cleanup for old limiter keys and load tests.


## Why a Shopify App Proxy?

The storefront itself stays on Shopify (Liquid, Shopify product/media catalog,
Shopify Cart Ajax API). A native Shopify App Proxy exposes an authenticated
same-origin `/apps/indexes-orders` route whose upstream can be a **Supabase
Edge Function**, not the Vercel storefront. The Shopify theme never contains
a Shopify Admin token, Supabase service-role key, or Turnstile secret.

## Install/configure separately from the Shopify theme

1. Prepare an isolated Supabase Staging project or development branch. Never
   target the existing production project `wtudcippyxbaobqzbmok` for trials.
2. Create/configure an appropriate Shopify app with the exact scopes needed
   for product verification, Draft Order creation/readback and an App Proxy.
   The presently connected ChatGPT Shopify app has
   `read_products`, `read_draft_orders`, `write_draft_orders`, but does
   **not** have `write_app_proxy`; it cannot configure the proxy.
3. In the Shopify app's version configuration, assign
   `prefix = "apps"`, `subpath = "indexes-orders"`, and point the proxy
   upstream to the isolated staging Edge Function. Version/release this app
   configuration only after the user explicitly approves that action.
4. Put the Shopify app shared secret, the exact `ubhd8d-iz.myshopify.com`
   shop domain, Supabase staging credentials, Shopify Admin token and
   Turnstile *secret* into the private staging environment only.
5. Do not expose the Edge Function directly as an unsigned public order
   endpoint; Shopify signature verification, timestamp freshness,
   one-time Turnstile and rate limits must all be enforced. Supabase may
   need JWT verification disabled for the *app proxy route only*, because
   Shopify's proxied requests are not Supabase user JWTs.
6. Apply and verify the shared checkout quote/idempotency migration and
   `shopify_whatsapp_draft_links` migration to **staging only**. Test that
   these migrations provide tenant isolation and cannot be called by
   anonymous clients.
7. Verify the implemented protected backend's authoritative steps: validate payload;
   compare variant prices/availability to Shopify Admin; resolve only
   existing tenant-owned Supabase product mappings; atomically commit or
   reuse a local order; `draftOrderCalculate`; acquire unique creation
   claim; `draftOrderCreate`; re-read/verify ID and YER total; persist
   draft reference; return `whatsappReady:true` only on verified success.
   Never automatically retry a Shopify mutation after an ambiguous response.
8. Test duplicate submissions, stale prices, insufficient inventory, slow
   network responses, corrupted Draft Orders and recovery from incomplete
   claims. Preserve customer data and avoid logs containing phone/address.
9. Only then update the **unpublished** theme's registered-checkout settings:
   proxy path `/apps/indexes-orders`, public Turnstile site key and
   `enable_order_bridge=true`. Keep direct WhatsApp links intact.
10. Do not publish the theme or merge app/backend changes merely because
    code checks succeed. Have a merchant-approved preview order completed
    and reconciled before production review.

## Relevant official references

- Shopify App Proxy setup:
  https://shopify.dev/docs/apps/build/online-store/app-proxies
- Shopify App Proxy signed request verification:
  https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies

## Prior infrastructure snapshot (2026-10-12; re-check before deployment)

- Shopify store: `ubhd8d-iz.myshopify.com`, `YER`.
- Preview theme: `Indexes Shopify — WhatsApp Preview — 2026-10-12`,
  ID `161543651413`, unpublished; the original saved theme and MAIN
  theme remain unchanged.
- The production Supabase database currently lacks
  `checkout_totals_v1`, `checkout_fingerprint`, `checkout_quote` and
  `shopify_whatsapp_draft_links`. The database CI fixture is not a staging
  project and does not establish deployment readiness.
