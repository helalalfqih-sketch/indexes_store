# Indexes Store Audit History

Last updated: 2026-09-07 17:57 UTC (20:57 Asia/Aden)

## Issue Register

| ID | Severity | Status | Finding |
| --- | --- | --- | --- |
| CHECKOUT-001 | P1 | OPEN | Production-visible fallback product IDs and Shopify GIDs are not compatible with the tenant-scoped Supabase product IDs required by local order creation. |

## 2026-09-07 17:57 UTC - Production Checkout Verification

- Production URL checked: `https://indexes-store.vercel.app/`
- Repository inspected: `main` at `796a97cc73016839291dd8d0bd0703c429ac8573`
- Verified: the production search crawl refreshed on 2026-09-07 and rendered the exact four fallback products and prices from `src/lib/store-data.ts` (`p1`-`p4`).
- Verified: storefront/cart IDs flow through `src/lib/cart-store.ts` and `src/components/storefront/UnifiedCartFlow2.tsx` into `submitOrder`.
- Verified: `src/lib/order.functions.ts` resolves only published products for the current tenant from Supabase and rejects missing product IDs before inserting an order.
- Confirmed findings: no P0; `CHECKOUT-001` is P1 and OPEN; no P2 confirmed.
- Fixed: none.
- Branches and pull requests: documentation branch `docs/agent-audit-history-20260907`; pull request pending creation.
- Tests and validation: PASS - production catalog output matched fallback data; PASS - default-branch checkout contract trace completed. No production POST was attempted.
- Failed or inaccessible: direct GET of `/api/catalog-health`, `/checkout`, `/order-completion`, and `/`; the web client rejected non-root routes or timed out, and direct HTTP returned `403 CONNECT tunnel failed`. Catalog-health JSON and the production deployment SHA remain unverified.
- Current blockers: direct production runtime access is unavailable; remediation requires explicit authorization.
- Current production status: storefront is indexed and displaying products, but its displayed fallback catalog is incompatible with authoritative order creation. No active P0 was confirmed.
- Next highest-priority action: authorize a dedicated remediation branch and pull request that enforces one source-compatible checkout contract and adds fallback, Supabase, and Shopify checkout contract tests.
