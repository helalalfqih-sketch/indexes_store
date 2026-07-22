-- =========================================================
-- H3 — user_addresses: canonical definition + owner-only RLS
-- =========================================================
-- The client code (src/lib/actions/order.actions.ts) reads/writes
-- public.user_addresses, but NO migration in the repository ever defined it —
-- meaning its live schema/RLS state was unmanaged and unauditable. This
-- migration makes the table canonical and locks it to its owner.
--
-- Column set follows WHAT THE CODE ACTUALLY USES (title / city / address_line /
-- phone / is_default), not the looser spec sketch (full_name / address) — the
-- code is the contract. If the table already exists, CREATE TABLE IF NOT
-- EXISTS is a no-op and the policies below still apply.

-- 1) Table (as required by existing code).
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT 'المنزل',
  city         text,
  address_line text NOT NULL DEFAULT '',
  phone        text,
  is_default   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON public.user_addresses(user_id);

-- 2) RLS: owner-only for every verb. No anon access of any kind.
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own addresses" ON public.user_addresses;
CREATE POLICY "Users view own addresses"
  ON public.user_addresses FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own addresses" ON public.user_addresses;
CREATE POLICY "Users insert own addresses"
  ON public.user_addresses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own addresses" ON public.user_addresses;
CREATE POLICY "Users update own addresses"
  ON public.user_addresses FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own addresses" ON public.user_addresses;
CREATE POLICY "Users delete own addresses"
  ON public.user_addresses FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 3) Grants: authenticated only (RLS scopes rows); nothing for anon.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_addresses TO authenticated;
GRANT ALL ON public.user_addresses TO service_role;
REVOKE ALL ON public.user_addresses FROM anon;

-- 4) updated_at maintenance (reuses the project-wide helper).
DROP TRIGGER IF EXISTS trg_user_addresses_updated ON public.user_addresses;
CREATE TRIGGER trg_user_addresses_updated
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
