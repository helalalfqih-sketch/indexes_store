# Isolated store repair preview

Run `npm ci --ignore-scripts` then `npm exec -- vite --config tests/preview/vite.config.ts`.
Open `http://127.0.0.1:4173/tests/preview/index.html?view=cart`.
Use `theme=dark`, `view=hero`, or `version=before` query parameters.

This fixture renders the actual repaired cart against synthetic products and mocked quote/order functions. It never writes to the store or sends WhatsApp messages. The `before/` components are frozen from base commit `feadaba6856eb1a2a55c368cdc1825c271a66499` for a like-for-like regression comparison, and intentionally retain old behavior. They are not application routes.

With INDEXES20 and the two initial products, the old cart shows 29,440 while delivery shows 32,440; the repaired flow shows 32,440 in both steps and retains the coupon when returning. The fixture is evidence about UI behavior, not proof that production database permissions or Shopify inventory access are configured.

The migration must be exercised on a separate sandbox before release. Confirm Shopify inventory scopes, coupon policy, cart settings and COD inventory reservation/cancellation rules. Do not dispatch production orders or open the generated WhatsApp link during automated tests.
