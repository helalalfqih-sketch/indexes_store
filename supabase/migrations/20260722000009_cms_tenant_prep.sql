-- =========================================================
-- CMS multi-tenant PREPARATION (Phase 6) — schema only, no behavior change
-- =========================================================
-- storefront_settings is currently GLOBAL (key UNIQUE, no tenant scoping).
-- This migration prepares — WITHOUT activating — per-tenant CMS settings:
--
--   * tenant_id uuid NULL   → NULL means "global/default" (all current rows)
--   * partial unique (tenant_id, key) for future tenant-scoped rows
--   * the existing global UNIQUE(key) constraint is KEPT untouched
--
-- Nothing reads or writes tenant_id yet: reads/writes keep using key only,
-- so current storefront behavior is 100% unchanged.
--
-- ── Activation plan (future PR, in order) ──────────────────────────────────
-- 1. Backfill: copy global rows per active tenant (or resolve NULL as
--    fallback in the read path — preferred, no data duplication).
-- 2. Service layer: resolveCurrentTenant() in reads/writes; read searches
--    (tenant_id = current) then falls back to (tenant_id IS NULL).
-- 3. RLS: tenant owner/staff write own-tenant rows via can_manage_tenant;
--    platform admin keeps writing global rows. Public read stays column-
--    scoped (no draft_value for anon).
-- 4. Only after verification: consider dropping the global UNIQUE(key) and
--    making tenant_id NOT NULL with a default-tenant backfill.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.storefront_settings
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_storefront_settings_tenant
  ON public.storefront_settings(tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS storefront_settings_tenant_key_uniq
  ON public.storefront_settings(tenant_id, key)
  WHERE tenant_id IS NOT NULL;
