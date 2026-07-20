# SaaS Layer

Multi-tenant primitives sitting **above** the repository layer.
Nothing in `src/lib/saas/` is UI-aware; import from server fns only.

## Files
- `tenant-context.ts` — `resolveTenantId(db, {override, headers, userId})` with fallback to `default` tenant.
- `tenant-resolver.ts` — request-scoped wrapper that reads `getRequest().headers` automatically inside server handlers.
- `tenant.service.ts` — create / update / status / plan / usage counters.
- `plan.service.ts` — plan limit matrix (free 50 · pro 1000 · enterprise ∞) + entitlement checks.
- `billing.service.ts` — placeholder `BillingProvider` interface. Noop adapter until Phase D.

## Rules
1. Every write repository call MUST pass an explicit `tenantId`; repositories throw otherwise.
2. Public reads (storefront) go through `resolveTenantId` — resolution order:
   `explicit override → x-tenant-id header → x-tenant-slug / subdomain → user's own tenant → default`.
3. `default` tenant guarantees backward compatibility: pre-existing data was backfilled to it, so single-store UI keeps working with zero code changes.
4. Platform admin (`app_role = 'admin'`) sees & manages **all** tenants; tenant staff only sees their own via RLS.
