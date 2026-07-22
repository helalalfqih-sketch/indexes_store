-- =========================================================
-- H2 — Harden profiles RLS: stop exposing all users' PII
-- =========================================================
-- Before: SELECT USING (true) TO authenticated — any signed-in user could
-- read EVERY user's full_name / phone / avatar_url.
-- After: users read their own profile; platform admins keep access via the
-- existing admin permission model (has_role). No USING(true) anywhere.
--
-- Verified against the codebase before writing: the only client reads of
-- profiles are self-reads (auth.functions.ts: .eq("id", userId)), so this
-- change breaks nothing.

-- 1) Remove the permissive read policy.
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;

-- 2) Owner (+ platform admin) read.
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Re-assert owner-only INSERT / UPDATE (idempotent — same semantics as the
--    original policies, restated here so this file fully defines the table's
--    access model).
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4) Defense-in-depth: Supabase default privileges may have granted table
--    rights to anon at creation time even though no anon policy ever existed.
REVOKE ALL ON public.profiles FROM anon;
