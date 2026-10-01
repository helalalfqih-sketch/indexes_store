# Indexes Store repair — review boundaries

Base: `feadaba6856eb1a2a55c368cdc1825c271a66499`. This is a staged repair for review, not a production release. Product records and published history were not changed. No live orders, messages, migrations, merges or deployments were performed.

## Implemented

| Area | Root cause | Change |
|---|---|---|
| Cart / delivery / WhatsApp | Independent client totals and coupon state | Server quote shared with the atomic order calculation; saved quote drives WhatsApp; persisted coupon; no totals displayed while a quote is unavailable |
| Pricing / inventory | Client prices and permissive inventory assumptions | Tenant-scoped published products / Shopify variants, YER and stock checks; unknown inventory fails closed; removed synthetic old prices and fixed discount badges |
| Retry / duplicate submit | No stable intent across retries | Persisted opaque attempt key, submit lock, database advisory lock and request fingerprint, saved response on replay |
| Search | Footer rendered an unrelated second catalog; incomplete cache keys | Removed footer grid, URL-backed filters/sort, truthful loaded-result count, translated collection labels, offers limit in cache key, no cross-catalog empty-result replacement |
| Accessibility / UI | Misleading controls and incomplete dialog semantics | Correct search/account icons, semantic product links, named quantities, focus trap, suggestion keyboard handling, pause and reduced-motion behavior; dark promo text contrast fixed |
| Pages / SEO | Missing-page rendering and invented commercial metadata | Loader-level notFound, factual about fallback, search/cart/account H1 improvements, removed invented delivery/returns/price-expiry metadata |
| Events / errors | PII-capable payloads and misleading telemetry | Payload allowlist, YER, distinct order-created and WhatsApp events, order event ID/dedup, generic production errors; Sentry presence is not claimed without an actual integration |

## Release gates and remaining work

- Apply migration only in sandbox first; verify Shopify `quantityAvailable` access. Unknown inventory intentionally blocks checkout. Existing server coupon codes INDEXES10/20 were retained, not newly authorized or advertised. Replace these with an approved tenant coupon configuration if the business policy differs.
- Inventory checks are atomic for one order, but cross-order reservation/decrement, release on cancellation, and Shopify synchronization require an explicit COD inventory lifecycle. This patch does not claim to solve overselling across different orders.
- Search remains bounded to fetched candidates; global pagination/count/filter/sort beyond that window needs a unified server catalog contract.
- Complete the remaining shell/token migration, all promotional tile semantics, all footer policies, and full-site keyboard/contrast/browser-zoom coverage. Frozen before-fixtures deliberately contain historical UI.
- Verify real HTTP 404, canonicals, sitemap and Product/Offer output on an integrated preview with seeded content.
- Verify all tenant/RLS/admin paths, public rate limits, offline reconciliation and server-side concurrency in the real sandbox. The isolated SQL checks do not substitute for that integration audit.
- TikTok event delivery, consent, production Sentry delivery/alerts and COD purchase recognition at the agreed fulfillment/payment milestone remain unverified. A WhatsApp click or order creation is not emitted as purchase.

## Validation

Full unit suite, TypeScript, production build and isolated browser/SQL evidence are documented in the accompanying delivery report. Repository-wide lint has extensive existing formatting failures; changed source files are checked separately. Windows build requires a local compatibility shim for an EPERM readlink response on an ordinary directory; no production configuration was relaxed. The full integrated end-to-end suite was not claimed to pass without sandbox services.
