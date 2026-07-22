-- =========================================================
-- CMS change-history snapshots (Phase 5)
-- =========================================================
-- storefront_change_logs previously recorded only WHO / WHAT KEY / WHEN.
-- Add value snapshots so every change is fully auditable and RESTORABLE:
--   old_value       — the value being replaced (draft or published)
--   new_value       — the value written
--   changed_section — logical section name (mirrors key_changed)
--
-- restoreStorefrontVersion() writes old_value back as the live value and
-- logs the restore itself with snapshots — restores are always reversible.
-- Additive + idempotent; older log rows simply have NULL snapshots (the UI
-- disables restore for them). RLS on the table is unchanged (admin-only).

ALTER TABLE public.storefront_change_logs
  ADD COLUMN IF NOT EXISTS old_value jsonb,
  ADD COLUMN IF NOT EXISTS new_value jsonb,
  ADD COLUMN IF NOT EXISTS changed_section text;
