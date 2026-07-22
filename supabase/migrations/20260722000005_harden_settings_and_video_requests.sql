-- =========================================================
-- M1 + M3 — storefront_settings TRUNCATE + product_video_requests hardening
-- =========================================================

-- ---------------------------------------------------------
-- M1: TRUNCATE bypasses RLS entirely in Postgres. The grant from
-- 20250723_storefront_settings_permissions.sql let ANY signed-in user wipe
-- the whole storefront configuration. Remove it. Admin-only writes remain
-- enforced by the existing RLS policies (INSERT/UPDATE/DELETE stay granted —
-- those verbs ARE policy-gated).
-- ---------------------------------------------------------
REVOKE TRUNCATE ON public.storefront_settings FROM authenticated;

-- ---------------------------------------------------------
-- M3: product_video_requests was world-writable (INSERT TO public WITH
-- CHECK (true)) with a free-text product_id, and readable by every signed-in
-- user. Harden:
--   * INSERT: authenticated only, and the product must actually exist
--     (policy-level referential check — a real FK is not safe to add yet
--     because product_id is text and pre-existing rows may hold junk).
--   * SELECT: platform admins only (it is an admin work-queue).
--   * anon loses all table privileges.
-- Note: the storefront button remains fire-and-forget in a try/catch, so the
-- UI is unaffected; anonymous visitors' requests are now silently dropped —
-- an accepted, intended behavior change.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS product_video_requests_insert ON public.product_video_requests;
CREATE POLICY product_video_requests_insert ON public.product_video_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id::text = product_video_requests.product_id
    )
  );

DROP POLICY IF EXISTS product_video_requests_read ON public.product_video_requests;
CREATE POLICY product_video_requests_read ON public.product_video_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON public.product_video_requests FROM anon;
