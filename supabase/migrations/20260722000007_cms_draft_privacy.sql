-- =========================================================
-- CMS hardening (S1): hide unpublished drafts from the public
-- =========================================================
-- storefront_settings is intentionally world-readable (theme/layout must be
-- public), but that table-level grant also exposed `draft_value` — letting any
-- visitor read UNPUBLISHED admin drafts — and `updated_by` (a user uuid).
--
-- Fix: replace anon's table-level SELECT with a column-scoped grant that
-- excludes draft_value and updated_by. The RLS row policy (public read) is
-- unchanged; this is column-level privilege only.
--
-- authenticated keeps full column access: the admin preview path reads
-- draft_value through RLS/service-role after an explicit admin check in the
-- server function (see appearance.actions.ts), and admin CMS pages need it.
--
-- NOTE: the storefront's public fetch was updated in the same PR to select
-- only (key, value) — anon clients selecting draft_value would now get a
-- permission error, which is exactly the point.

REVOKE SELECT ON public.storefront_settings FROM anon;
GRANT SELECT (id, key, value, type, updated_at) ON public.storefront_settings TO anon;

-- =========================================================
-- End CMS draft privacy migration
-- =========================================================
