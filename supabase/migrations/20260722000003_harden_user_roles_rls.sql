-- =========================================================
-- M2 — Harden user_roles RLS: stop role enumeration
-- =========================================================
-- Before: SELECT USING (true) TO authenticated — any signed-in user could
-- enumerate who the admins are (recon for targeted attacks).
-- After: users see their own role rows; platform admins see and manage all.
--
-- Verified safe before writing:
--   * claimFirstAdmin (admin bootstrap) counts admins via the SERVICE ROLE —
--     unaffected by this policy.
--   * The storefront_settings admin-write policy checks the caller's OWN
--     user_roles row (user_id = auth.uid()) — still readable under the new
--     policy.
--   * has_role() is SECURITY DEFINER — policy evaluation does not recurse.
--   * Client code only self-reads roles (auth.functions.ts).

-- 1) Remove the permissive read policy.
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.user_roles;

-- 2) Self (+ platform admin) read. Existing admin INSERT/UPDATE/DELETE
--    policies ("Admins insert roles", etc.) are unchanged.
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Defense-in-depth against default-privilege grants.
REVOKE ALL ON public.user_roles FROM anon;
