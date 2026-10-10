# Shopify → Supabase → WhatsApp COD handoff (staging runbook)

## Scope and rollout order

1. Keep `main` and the published Shopify theme unchanged. Preview branch PR #175 (SSR fix) precedes PR #174 (order bridge).
2. Confirm the canonical shop through **Shopify Admin API**: `shop.myshopifyDomain` must be `ubhd8d-iz.myshopify.com`, shop currency `YER`, and the server's app must have `read_products`, `read_draft_orders` and `write_draft_orders`.
3. Connect the **correct Indexes Store staging Supabase project** and verify that the existing atomic `create_checkout_order_v2` and shared quote migration are deployed. Do not assume the active Supabase connector refers to the production project. Never apply migrations to an unidentified project.
4. Apply `supabase/migrations/20261010194000_shopify_whatsapp_draft_links.sql` to staging and verify its RLS, unique order claim, and composite `(order_id, tenant_id)` foreign key.
5. In Vercel **Preview branch only**, configure `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_DRAFT_ORDER_EXPECTED_DOMAIN`, `SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `CATALOG_SOURCE=shopify`, and `SHOPIFY_ORDER_TURNSTILE_SECRET`. Keep `SHOPIFY_DRAFT_ORDER_WRITES_ENABLED=false` until fully ready.
6. In the unpublished Shopify theme Preview only, add the public Cloudflare Turnstile widget and request its action `indexes_whatsapp_order`. Submit a fresh, single-use `turnstileToken` with the existing validated checkout payload and UUID `idempotencyKey` to `/api/shopify-orders` from an allowed HTTPS origin. Never embed Admin, service-role, or Turnstile secret keys in theme Liquid/JS.
7. After review, set the Preview-only write flag to `true`, redeploy the *specific* approved commit and test with an explicitly approved non-customer test purchase. Never submit a real test request against a production Shopify store while merely verifying code.
8. Only when the API returns HTTP 200 with `whatsappReady: true` and both `orderId` and `draftOrderId` should the storefront open WhatsApp. Use the server-confirmed order number, price and shipping, not untrusted cart totals. If the response fails, show a recoverable error and stay on checkout.

## Safe retry and reconciliation

- The browser must retain the *same* `idempotencyKey` for one logical checkout; request a **new** Turnstile token on each HTTP retry.
- Supabase's `create_checkout_order_v2` is the price, availability and tenant authority. The Shopify Admin API independently validates each variant's current price and stock.
- `shopify_whatsapp_draft_links.order_id` uniquely claims the local order before the first non-idempotent Shopify mutation.
- A retry with an existing ready claim reads Shopify; verify draft **OPEN** state, local-order marker, exact variant IDs, line quantities, original unit prices, YER currency and final total. No second draft is created.
- Any failed/unknown Shopify mutation or incomplete link update leaves the claim blocked; **never** blindly retry `draftOrderCreate`.
- The staff reconciliation procedure is to find drafts with tag `indexes-local-<local UUID>`, verify the customer/cart and precise `draftOrderId` against the Supabase local order, and resolve the database linkage only through an authenticated administrative procedure. Do not release/delete claims automatically on timeouts.
- Shopify draft creation does **not** automatically reserve inventory. The implementation checks stock before creation; no guarantee can be made against concurrent stock movement without a reviewed reservation/fulfillment policy.
- Creating a local Supabase order before the Shopify mutation is not distributed atomicity. A Shopify error can leave a pending local record and requires follow-up; it must never be presented to the customer as a completed handoff.

## Remaining production safety gates

- Install a server-side rate limit or equivalent verified WAF abuse controls in addition to Turnstile. CORS and the Origin header are not authentication.
- Add traceability/alerting for stuck `creating`/`verifying` claims without logging customer personal information or credentials.
- Validate a complete preview-only end-to-end flow with a merchant-approved test shop, including success, quantity/price change, double-click, network timeout, and unknown mutation outcomes.
- Confirm existing Shopify theme content, images, products and prices are untouched.
- Do not merge PRs or enable the Production flag until those checks are demonstrated; passing unit/E2E CI alone is insufficient.
