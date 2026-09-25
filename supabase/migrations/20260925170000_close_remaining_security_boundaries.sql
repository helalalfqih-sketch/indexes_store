-- Close the remaining authenticated RPC and tenant-isolation gaps.
-- This migration is intentionally additive to the live 2026-09-24 security
-- rollout. It must be applied only after the application changes in the same
-- pull request are deployed together.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

DO $preflight$
DECLARE
  mismatch_count bigint;
BEGIN
  IF to_regclass('public.orders') IS NULL
     OR to_regclass('public.branches') IS NULL
     OR to_regclass('public.tenant_members') IS NULL
     OR to_regclass('public.user_roles') IS NULL
     OR to_regclass('public.webhook_events') IS NULL
     OR to_regclass('public.whatsapp_inbox') IS NULL
     OR to_regclass('public.ai_daily_usage') IS NULL THEN
    RAISE EXCEPTION 'Security hardening preflight failed: required objects are missing';
  END IF;

  SELECT count(*)
    INTO mismatch_count
  FROM public.orders AS o
  JOIN public.branches AS b ON b.id = o.branch_id
  WHERE o.branch_id IS NOT NULL
    AND o.tenant_id IS DISTINCT FROM b.tenant_id;

  IF mismatch_count <> 0 THEN
    RAISE EXCEPTION
      'Security hardening preflight failed: % order(s) reference a branch from another tenant',
      mismatch_count;
  END IF;
END
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. Membership and role reads are self-only at the Data API boundary.
--    Cross-user membership administration is performed by reviewed server
--    functions using the server-only Supabase client after caller authorization.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members view their memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Owners and admins add members" ON public.tenant_members;
DROP POLICY IF EXISTS "Owners and admins remove members" ON public.tenant_members;
DROP POLICY IF EXISTS "Owners and admins update members" ON public.tenant_members;
DROP POLICY IF EXISTS "P0 members read own membership" ON public.tenant_members;

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.tenant_members FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.tenant_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenant_members TO service_role;

CREATE POLICY "P0 members read own membership"
  ON public.tenant_members
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "P0 users read own roles" ON public.user_roles;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.user_roles TO authenticated;

CREATE POLICY "P0 users read own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 2. Authorization helpers no longer run as SECURITY DEFINER and refuse to
--    answer questions about any user other than the authenticated caller.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_role(
  _user_id uuid,
  _role public.app_role
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF _user_id IS NULL
     OR (SELECT auth.uid()) IS NULL
     OR _user_id <> (SELECT auth.uid()) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles AS ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(
  _tenant_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    _tenant_id IS NOT NULL
    AND _user_id IS NOT NULL
    AND (SELECT auth.uid()) IS NOT NULL
    AND _user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.tenant_members AS tm
      WHERE tm.tenant_id = _tenant_id
        AND tm.user_id = _user_id
    );
$function$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(
  _tenant_id uuid,
  _user_id uuid,
  _role public.tenant_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    _tenant_id IS NOT NULL
    AND _user_id IS NOT NULL
    AND (SELECT auth.uid()) IS NOT NULL
    AND _user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.tenant_members AS tm
      WHERE tm.tenant_id = _tenant_id
        AND tm.user_id = _user_id
        AND tm.role = _role
    );
$function$;

CREATE OR REPLACE FUNCTION public.has_tenant_permission(
  _tenant_id uuid,
  _user_id uuid,
  _required_role public.tenant_role
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  caller_role public.tenant_role;
BEGIN
  IF _tenant_id IS NULL
     OR _user_id IS NULL
     OR (SELECT auth.uid()) IS NULL
     OR _user_id <> (SELECT auth.uid()) THEN
    RETURN false;
  END IF;

  IF public.has_role(_user_id, 'admin'::public.app_role) THEN
    RETURN true;
  END IF;

  SELECT tm.role
    INTO caller_role
  FROM public.tenant_members AS tm
  WHERE tm.tenant_id = _tenant_id
    AND tm.user_id = _user_id;

  IF caller_role IS NULL THEN
    RETURN false;
  END IF;

  RETURN CASE _required_role
    WHEN 'viewer'::public.tenant_role THEN
      caller_role IN (
        'viewer'::public.tenant_role,
        'staff'::public.tenant_role,
        'manager'::public.tenant_role,
        'owner'::public.tenant_role
      )
    WHEN 'staff'::public.tenant_role THEN
      caller_role IN (
        'staff'::public.tenant_role,
        'manager'::public.tenant_role,
        'owner'::public.tenant_role
      )
    WHEN 'manager'::public.tenant_role THEN
      caller_role IN (
        'manager'::public.tenant_role,
        'owner'::public.tenant_role
      )
    WHEN 'owner'::public.tenant_role THEN
      caller_role = 'owner'::public.tenant_role
    ELSE false
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_tenant(
  _tenant_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    _tenant_id IS NOT NULL
    AND _user_id IS NOT NULL
    AND (SELECT auth.uid()) IS NOT NULL
    AND _user_id = (SELECT auth.uid())
    AND (
      public.has_role(_user_id, 'admin'::public.app_role)
      OR public.is_tenant_member(_tenant_id, _user_id)
    );
$function$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, uuid, public.tenant_role)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_tenant_permission(uuid, uuid, public.tenant_role)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.can_manage_tenant(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

-- Public catalog policies call has_role(auth.uid(), 'admin'); anonymous callers
-- receive false before user_roles is queried.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid, public.tenant_role)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_permission(uuid, uuid, public.tenant_role)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_tenant(uuid, uuid)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Keep member reads intact, but require staff-or-higher for direct catalog
--    mutations. can_manage_tenant intentionally remains a membership/read
--    helper; it must not be used as a write authorization predicate.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Tenant members insert categories" ON public.categories;
DROP POLICY IF EXISTS "Tenant members update categories" ON public.categories;
DROP POLICY IF EXISTS "Tenant members delete categories" ON public.categories;
DROP POLICY IF EXISTS "Staff insert categories" ON public.categories;
DROP POLICY IF EXISTS "Staff update categories" ON public.categories;
DROP POLICY IF EXISTS "Staff delete categories" ON public.categories;

CREATE POLICY "Staff insert categories"
  ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "Staff update categories"
  ON public.categories
  FOR UPDATE TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  )
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "Staff delete categories"
  ON public.categories
  FOR DELETE TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );

DROP POLICY IF EXISTS "Tenant members insert products" ON public.products;
DROP POLICY IF EXISTS "Tenant members update products" ON public.products;
DROP POLICY IF EXISTS "Tenant members delete products" ON public.products;
DROP POLICY IF EXISTS "Staff insert products" ON public.products;
DROP POLICY IF EXISTS "Staff update products" ON public.products;
DROP POLICY IF EXISTS "Staff delete products" ON public.products;

CREATE POLICY "Staff insert products"
  ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "Staff update products"
  ON public.products
  FOR UPDATE TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  )
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "Staff delete products"
  ON public.products
  FOR DELETE TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );

DROP POLICY IF EXISTS "Tenant members insert product_media" ON public.product_media;
DROP POLICY IF EXISTS "Tenant members update product_media" ON public.product_media;
DROP POLICY IF EXISTS "Tenant members delete product_media" ON public.product_media;
DROP POLICY IF EXISTS "Staff insert product_media" ON public.product_media;
DROP POLICY IF EXISTS "Staff update product_media" ON public.product_media;
DROP POLICY IF EXISTS "Staff delete product_media" ON public.product_media;

CREATE POLICY "Staff insert product_media"
  ON public.product_media
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "Staff update product_media"
  ON public.product_media
  FOR UPDATE TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  )
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "Staff delete product_media"
  ON public.product_media
  FOR DELETE TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );

DROP POLICY IF EXISTS "Tenant members insert inventory" ON public.inventory_movements;
DROP POLICY IF EXISTS "Staff insert inventory" ON public.inventory_movements;
CREATE POLICY "Staff insert inventory"
  ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );

-- ---------------------------------------------------------------------------
-- 4. Order branch assignment is a server-only mutation and is protected again
--    at table level so no write path can create a cross-tenant reference.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_order_branch_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  branch_tenant_id uuid;
BEGIN
  IF NEW.branch_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT b.tenant_id
    INTO branch_tenant_id
  FROM public.branches AS b
  WHERE b.id = NEW.branch_id;

  IF branch_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Invalid branch' USING ERRCODE = '23503';
  END IF;

  IF branch_tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    RAISE EXCEPTION 'Branch tenant does not match order tenant' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_order_branch_tenant ON public.orders;
CREATE TRIGGER guard_order_branch_tenant
BEFORE INSERT OR UPDATE OF branch_id, tenant_id ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.guard_order_branch_tenant();

REVOKE ALL ON FUNCTION public.guard_order_branch_tenant()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_order_branch(
  _order_id uuid,
  _branch_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  order_tenant_id uuid;
  branch_tenant_id uuid;
BEGIN
  SELECT o.tenant_id
    INTO order_tenant_id
  FROM public.orders AS o
  WHERE o.id = _order_id;

  IF order_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT b.tenant_id
    INTO branch_tenant_id
  FROM public.branches AS b
  WHERE b.id = _branch_id;

  IF branch_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Branch not found' USING ERRCODE = 'P0002';
  END IF;

  IF branch_tenant_id IS DISTINCT FROM order_tenant_id THEN
    RAISE EXCEPTION 'Branch tenant does not match order tenant' USING ERRCODE = '42501';
  END IF;

  UPDATE public.orders
  SET branch_id = _branch_id
  WHERE id = _order_id
    AND tenant_id = order_tenant_id;

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_order_branch(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_order_branch(uuid, uuid)
  TO service_role;

-- Helpful-count mutation is also a server-only primitive. A future public
-- endpoint must authenticate/rate-limit/dedupe before invoking it.
REVOKE ALL ON FUNCTION public.increment_review_helpful(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_review_helpful(uuid)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Move the AI daily quota mutation behind the server-only client. The
--    authenticated bearer token is still validated by the application first.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.consume_ai_request_for_user(target_user uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  accepted integer;
BEGIN
  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Missing user' USING ERRCODE = '22004';
  END IF;

  INSERT INTO public.ai_daily_usage(user_id, day, requests)
  VALUES (target_user, (now() AT TIME ZONE 'UTC')::date, 1)
  ON CONFLICT (user_id, day)
  DO UPDATE
    SET requests = public.ai_daily_usage.requests + 1
    WHERE public.ai_daily_usage.requests < 100
  RETURNING requests INTO accepted;

  RETURN accepted IS NOT NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_ai_request()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.consume_ai_request_for_user(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_ai_request_for_user(uuid)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Make the three service-only tables explicit instead of relying on
--    "RLS enabled with no policy". This preserves deny-by-default for clients
--    and removes ambiguous security-advisor findings.
-- ---------------------------------------------------------------------------

ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_daily_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_daily_usage TO service_role;
DROP POLICY IF EXISTS "P0 ai usage service only" ON public.ai_daily_usage;
CREATE POLICY "P0 ai usage service only"
  ON public.ai_daily_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.webhook_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webhook_events TO service_role;
DROP POLICY IF EXISTS "P0 webhook events service only" ON public.webhook_events;
CREATE POLICY "P0 webhook events service only"
  ON public.webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.whatsapp_inbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.whatsapp_inbox FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.whatsapp_inbox TO service_role;
DROP POLICY IF EXISTS "P0 whatsapp inbox service select" ON public.whatsapp_inbox;
DROP POLICY IF EXISTS "P0 whatsapp inbox service insert" ON public.whatsapp_inbox;
CREATE POLICY "P0 whatsapp inbox service select"
  ON public.whatsapp_inbox
  FOR SELECT
  TO service_role
  USING (true);
CREATE POLICY "P0 whatsapp inbox service insert"
  ON public.whatsapp_inbox
  FOR INSERT
  TO service_role
  WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 7. Close broad legacy Data API policies that exposed secrets, execution
--    journals, CMS administration, media mutation, and audit-log integrity.
-- ---------------------------------------------------------------------------

-- AI provider credentials contain API keys. No browser/client role may read
-- them directly; authenticated server functions authorize callers first and
-- then use the service-role client.
ALTER TABLE public.ai_provider_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_provider_configs_authenticated_all" ON public.ai_provider_configs;
DROP POLICY IF EXISTS "P0 ai provider configs service only" ON public.ai_provider_configs;
REVOKE ALL ON TABLE public.ai_provider_configs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_provider_configs TO service_role;
CREATE POLICY "P0 ai provider configs service only"
  ON public.ai_provider_configs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Execution journals are immutable from client roles. Authenticated users may
-- only read events that belong to their own session or tenant; all writes are
-- performed by trusted server code.
ALTER TABLE public.agent_execution_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin read execution events" ON public.agent_execution_events;
DROP POLICY IF EXISTS "P0 execution events authenticated read" ON public.agent_execution_events;
DROP POLICY IF EXISTS "P0 execution events service only" ON public.agent_execution_events;
REVOKE ALL ON TABLE public.agent_execution_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.agent_execution_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_execution_events TO service_role;
CREATE POLICY "P0 execution events authenticated read"
  ON public.agent_execution_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_agent_sessions AS session
      WHERE session.id::text = agent_execution_events.session_id
        AND session.user_id = (SELECT auth.uid())
    )
    OR CASE
      WHEN tenant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}      THEN public.can_manage_tenant(tenant_id::uuid, (SELECT auth.uid()))
      ELSE false
    END
  );
CREATE POLICY "P0 execution events service only"
  ON public.agent_execution_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin read execution logs" ON public.agent_execution_logs;
DROP POLICY IF EXISTS "P0 execution logs authenticated read" ON public.agent_execution_logs;
DROP POLICY IF EXISTS "P0 execution logs service only" ON public.agent_execution_logs;
REVOKE ALL ON TABLE public.agent_execution_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.agent_execution_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_execution_logs TO service_role;
CREATE POLICY "P0 execution logs authenticated read"
  ON public.agent_execution_logs
  FOR SELECT TO authenticated
  USING (
    CASE
      WHEN tenant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}

      THEN public.can_manage_tenant(tenant_id::uuid, (SELECT auth.uid()))
      ELSE false
    END
  );
CREATE POLICY "P0 execution logs service only"
  ON public.agent_execution_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- AI plans previously used PUBLIC ALL/true. Preserve authenticated tenant
-- workflows, but only members can read and staff-or-higher can mutate.
ALTER TABLE public.ai_agent_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to ai_agent_plans" ON public.ai_agent_plans;
DROP POLICY IF EXISTS "P0 AI plans tenant read" ON public.ai_agent_plans;
DROP POLICY IF EXISTS "P0 AI plans staff insert" ON public.ai_agent_plans;
DROP POLICY IF EXISTS "P0 AI plans staff update" ON public.ai_agent_plans;
DROP POLICY IF EXISTS "P0 AI plans staff delete" ON public.ai_agent_plans;
DROP POLICY IF EXISTS "P0 AI plans service access" ON public.ai_agent_plans;
REVOKE ALL ON TABLE public.ai_agent_plans FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_plans TO service_role;
CREATE POLICY "P0 AI plans tenant read"
  ON public.ai_agent_plans
  FOR SELECT TO authenticated
  USING (
    CASE
      WHEN tenant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}

      THEN public.can_manage_tenant(tenant_id::uuid, (SELECT auth.uid()))
      ELSE false
    END
  );
CREATE POLICY "P0 AI plans staff insert"
  ON public.ai_agent_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    CASE
      WHEN tenant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}

      THEN public.has_tenant_permission(
        tenant_id::uuid,
        (SELECT auth.uid()),
        'staff'::public.tenant_role
      )
      ELSE false
    END
  );
CREATE POLICY "P0 AI plans staff update"
  ON public.ai_agent_plans
  FOR UPDATE TO authenticated
  USING (
    CASE
      WHEN tenant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}

      THEN public.has_tenant_permission(
        tenant_id::uuid,
        (SELECT auth.uid()),
        'staff'::public.tenant_role
      )
      ELSE false
    END
  )
  WITH CHECK (
    CASE
      WHEN tenant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}

      THEN public.has_tenant_permission(
        tenant_id::uuid,
        (SELECT auth.uid()),
        'staff'::public.tenant_role
      )
      ELSE false
    END
  );
CREATE POLICY "P0 AI plans staff delete"
  ON public.ai_agent_plans
  FOR DELETE TO authenticated
  USING (
    CASE
      WHEN tenant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}

      THEN public.has_tenant_permission(
        tenant_id::uuid,
        (SELECT auth.uid()),
        'staff'::public.tenant_role
      )
      ELSE false
    END
  );
CREATE POLICY "P0 AI plans service access"
  ON public.ai_agent_plans
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Media metadata can be read publicly only when linked to a published product.
-- Tenant members may read their media; mutations require staff or higher.
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated manage media files" ON public.media_files;
DROP POLICY IF EXISTS "Allow public insert media files" ON public.media_files;
DROP POLICY IF EXISTS "Allow public to read media files" ON public.media_files;
DROP POLICY IF EXISTS "P0 published media read" ON public.media_files;
DROP POLICY IF EXISTS "P0 tenant media read" ON public.media_files;
DROP POLICY IF EXISTS "P0 staff media insert" ON public.media_files;
DROP POLICY IF EXISTS "P0 staff media update" ON public.media_files;
DROP POLICY IF EXISTS "P0 staff media delete" ON public.media_files;
DROP POLICY IF EXISTS "P0 media service access" ON public.media_files;
REVOKE ALL ON TABLE public.media_files FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.media_files TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.media_files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.media_files TO service_role;
CREATE POLICY "P0 published media read"
  ON public.media_files
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_media AS link
      JOIN public.products AS product
        ON product.id = link.product_id
       AND product.tenant_id = link.tenant_id
      WHERE link.media_id = media_files.id
        AND link.tenant_id = media_files.tenant_id
        AND product.is_published = true
    )
  );
CREATE POLICY "P0 tenant media read"
  ON public.media_files
  FOR SELECT TO authenticated
  USING (
    public.can_manage_tenant(tenant_id, (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM public.product_media AS link
      JOIN public.products AS product
        ON product.id = link.product_id
       AND product.tenant_id = link.tenant_id
      WHERE link.media_id = media_files.id
        AND link.tenant_id = media_files.tenant_id
        AND product.is_published = true
    )
  );
CREATE POLICY "P0 staff media insert"
  ON public.media_files
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
    AND (created_by IS NULL OR created_by = (SELECT auth.uid()))
  );
CREATE POLICY "P0 staff media update"
  ON public.media_files
  FOR UPDATE TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  )
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "P0 staff media delete"
  ON public.media_files
  FOR DELETE TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "P0 media service access"
  ON public.media_files
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Audit logs are append-only for authenticated staff and cannot be forged for
-- another actor/tenant. Service-role retains full operational access.
ALTER TABLE public.tenant_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage audit logs" ON public.tenant_audit_logs;
DROP POLICY IF EXISTS "P0 audit staff read" ON public.tenant_audit_logs;
DROP POLICY IF EXISTS "P0 audit staff append" ON public.tenant_audit_logs;
DROP POLICY IF EXISTS "P0 audit service access" ON public.tenant_audit_logs;
REVOKE ALL ON TABLE public.tenant_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.tenant_audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenant_audit_logs TO service_role;
CREATE POLICY "P0 audit staff read"
  ON public.tenant_audit_logs
  FOR SELECT TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "P0 audit staff append"
  ON public.tenant_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );
CREATE POLICY "P0 audit service access"
  ON public.tenant_audit_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Public CMS reads remain available only for published pages. Administrative
-- reads/writes are tenant scoped and staff gated.
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all authenticated users to manage cms pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Allow public to read published cms pages" ON public.cms_pages;
DROP POLICY IF EXISTS "P0 public published CMS read" ON public.cms_pages;
DROP POLICY IF EXISTS "P0 tenant CMS read" ON public.cms_pages;
DROP POLICY IF EXISTS "P0 staff CMS insert" ON public.cms_pages;
DROP POLICY IF EXISTS "P0 staff CMS update" ON public.cms_pages;
DROP POLICY IF EXISTS "P0 staff CMS delete" ON public.cms_pages;
DROP POLICY IF EXISTS "P0 CMS service access" ON public.cms_pages;
REVOKE ALL ON TABLE public.cms_pages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.cms_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cms_pages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cms_pages TO service_role;
CREATE POLICY "P0 public published CMS read"
  ON public.cms_pages
  FOR SELECT TO anon
  USING (is_published = true);
CREATE POLICY "P0 tenant CMS read"
  ON public.cms_pages
  FOR SELECT TO authenticated
  USING (
    is_published = true
    OR public.can_manage_tenant(tenant_id, (SELECT auth.uid()))
  );
CREATE POLICY "P0 staff CMS insert"
  ON public.cms_pages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "P0 staff CMS update"
  ON public.cms_pages
  FOR UPDATE TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  )
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "P0 staff CMS delete"
  ON public.cms_pages
  FOR DELETE TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "P0 CMS service access"
  ON public.cms_pages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.cms_page_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage cms page versions"
  ON public.cms_page_versions;
DROP POLICY IF EXISTS "P0 staff CMS versions read" ON public.cms_page_versions;
DROP POLICY IF EXISTS "P0 staff CMS versions insert" ON public.cms_page_versions;
DROP POLICY IF EXISTS "P0 CMS versions service access" ON public.cms_page_versions;
REVOKE ALL ON TABLE public.cms_page_versions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.cms_page_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cms_page_versions TO service_role;
CREATE POLICY "P0 staff CMS versions read"
  ON public.cms_page_versions
  FOR SELECT TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );
CREATE POLICY "P0 staff CMS versions insert"
  ON public.cms_page_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    edited_by = (SELECT auth.uid())
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );
CREATE POLICY "P0 CMS versions service access"
  ON public.cms_page_versions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- System runtime logs contain stack traces/context and are service-role only.
-- Server endpoints now perform their own authentication/authorization.
ALTER TABLE public.system_live_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_delete_live_logs" ON public.system_live_logs;
DROP POLICY IF EXISTS "anyone_insert_live_logs" ON public.system_live_logs;
DROP POLICY IF EXISTS "authenticated_update_live_logs" ON public.system_live_logs;
DROP POLICY IF EXISTS "authenticated_read_live_logs" ON public.system_live_logs;
DROP POLICY IF EXISTS "P0 system live logs service only" ON public.system_live_logs;
REVOKE ALL ON TABLE public.system_live_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.system_live_logs TO service_role;
CREATE POLICY "P0 system live logs service only"
  ON public.system_live_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 8. Protect AI integrity tables: audit/usage records are server-authored;
--    workspace memory remains tenant-readable but staff-writable.
-- ---------------------------------------------------------------------------

ALTER TABLE public.ai_agent_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_audit_tenant_access" ON public.ai_agent_audit_logs;
DROP POLICY IF EXISTS "P0 AI audit read" ON public.ai_agent_audit_logs;
DROP POLICY IF EXISTS "P0 AI audit service write" ON public.ai_agent_audit_logs;
REVOKE ALL ON TABLE public.ai_agent_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.ai_agent_audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_audit_logs TO service_role;
CREATE POLICY "P0 AI audit read"
  ON public.ai_agent_audit_logs
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );
CREATE POLICY "P0 AI audit service write"
  ON public.ai_agent_audit_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.ai_agent_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_usage_tenant_access" ON public.ai_agent_usage;
DROP POLICY IF EXISTS "P0 AI usage read" ON public.ai_agent_usage;
DROP POLICY IF EXISTS "P0 AI usage service write" ON public.ai_agent_usage;
REVOKE ALL ON TABLE public.ai_agent_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.ai_agent_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_usage TO service_role;
CREATE POLICY "P0 AI usage read"
  ON public.ai_agent_usage
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );
CREATE POLICY "P0 AI usage service write"
  ON public.ai_agent_usage
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.ai_agent_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_memory_tenant_access" ON public.ai_agent_memory;
DROP POLICY IF EXISTS "P0 AI memory tenant read" ON public.ai_agent_memory;
DROP POLICY IF EXISTS "P0 AI memory staff insert" ON public.ai_agent_memory;
DROP POLICY IF EXISTS "P0 AI memory staff update" ON public.ai_agent_memory;
DROP POLICY IF EXISTS "P0 AI memory staff delete" ON public.ai_agent_memory;
DROP POLICY IF EXISTS "P0 AI memory service access" ON public.ai_agent_memory;
REVOKE ALL ON TABLE public.ai_agent_memory FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_memory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_memory TO service_role;
CREATE POLICY "P0 AI memory tenant read"
  ON public.ai_agent_memory
  FOR SELECT TO authenticated
  USING (
    public.can_manage_tenant(tenant_id, (SELECT auth.uid()))
  );
CREATE POLICY "P0 AI memory staff insert"
  ON public.ai_agent_memory
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );
CREATE POLICY "P0 AI memory staff update"
  ON public.ai_agent_memory
  FOR UPDATE TO authenticated
  USING (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  )
  WITH CHECK (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );
CREATE POLICY "P0 AI memory staff delete"
  ON public.ai_agent_memory
  FOR DELETE TO authenticated
  USING (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );
CREATE POLICY "P0 AI memory service access"
  ON public.ai_agent_memory
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 9. Remove unnecessary anonymous grants and make ownership policies explicit
--    for AI sessions/messages while preserving public active-tenant lookup.
-- ---------------------------------------------------------------------------

ALTER TABLE public.ai_agent_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_sessions_user_access" ON public.ai_agent_sessions;
DROP POLICY IF EXISTS "P0 AI sessions own select" ON public.ai_agent_sessions;
DROP POLICY IF EXISTS "P0 AI sessions own insert" ON public.ai_agent_sessions;
DROP POLICY IF EXISTS "P0 AI sessions own update" ON public.ai_agent_sessions;
DROP POLICY IF EXISTS "P0 AI sessions own delete" ON public.ai_agent_sessions;
DROP POLICY IF EXISTS "P0 AI sessions service access" ON public.ai_agent_sessions;
REVOKE ALL ON TABLE public.ai_agent_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_sessions TO service_role;
CREATE POLICY "P0 AI sessions own select"
  ON public.ai_agent_sessions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "P0 AI sessions own insert"
  ON public.ai_agent_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.can_manage_tenant(tenant_id, (SELECT auth.uid()))
  );
CREATE POLICY "P0 AI sessions own update"
  ON public.ai_agent_sessions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.can_manage_tenant(tenant_id, (SELECT auth.uid()))
  );
CREATE POLICY "P0 AI sessions own delete"
  ON public.ai_agent_sessions
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "P0 AI sessions service access"
  ON public.ai_agent_sessions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.ai_agent_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_messages_user_access" ON public.ai_agent_messages;
DROP POLICY IF EXISTS "P0 AI messages own select" ON public.ai_agent_messages;
DROP POLICY IF EXISTS "P0 AI messages own insert" ON public.ai_agent_messages;
DROP POLICY IF EXISTS "P0 AI messages own update" ON public.ai_agent_messages;
DROP POLICY IF EXISTS "P0 AI messages own delete" ON public.ai_agent_messages;
DROP POLICY IF EXISTS "P0 AI messages service access" ON public.ai_agent_messages;
REVOKE ALL ON TABLE public.ai_agent_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_messages TO service_role;
CREATE POLICY "P0 AI messages own select"
  ON public.ai_agent_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_agent_sessions AS session
      WHERE session.id = ai_agent_messages.session_id
        AND session.user_id = (SELECT auth.uid())
        AND session.tenant_id = ai_agent_messages.tenant_id
    )
  );
CREATE POLICY "P0 AI messages own insert"
  ON public.ai_agent_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ai_agent_sessions AS session
      WHERE session.id = ai_agent_messages.session_id
        AND session.user_id = (SELECT auth.uid())
        AND session.tenant_id = ai_agent_messages.tenant_id
    )
  );
CREATE POLICY "P0 AI messages own update"
  ON public.ai_agent_messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_agent_sessions AS session
      WHERE session.id = ai_agent_messages.session_id
        AND session.user_id = (SELECT auth.uid())
        AND session.tenant_id = ai_agent_messages.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ai_agent_sessions AS session
      WHERE session.id = ai_agent_messages.session_id
        AND session.user_id = (SELECT auth.uid())
        AND session.tenant_id = ai_agent_messages.tenant_id
    )
  );
CREATE POLICY "P0 AI messages own delete"
  ON public.ai_agent_messages
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_agent_sessions AS session
      WHERE session.id = ai_agent_messages.session_id
        AND session.user_id = (SELECT auth.uid())
        AND session.tenant_id = ai_agent_messages.tenant_id
    )
  );
CREATE POLICY "P0 AI messages service access"
  ON public.ai_agent_messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Active tenant metadata is needed to resolve the public storefront, but
-- anonymous mutation privileges are never needed.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.tenants FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.tenants TO anon;

-- WhatsApp inbox messages are written by trusted integrations. Browser users
-- need only staff-scoped reads; configuration management remains staff-scoped.
REVOKE ALL ON TABLE public.whatsapp_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.whatsapp_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.whatsapp_messages TO service_role;

REVOKE ALL ON TABLE public.whatsapp_configs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.whatsapp_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.whatsapp_configs TO service_role;

-- ---------------------------------------------------------------------------
-- 10. Reviews: the live table is public.reviews (not product_reviews).
--     Customer inserts are pending/unverified only. Moderation and deletion
--     remain server-only after an explicit manager authorization check.
-- ---------------------------------------------------------------------------

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending';

UPDATE public.reviews
SET moderation_status = CASE WHEN is_approved THEN 'approved' ELSE 'pending' END
WHERE moderation_status IS DISTINCT FROM
      CASE WHEN is_approved THEN 'approved' ELSE 'pending' END;

DO $reviews_status_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.reviews'::regclass
      AND conname = 'reviews_moderation_status_check'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_moderation_status_check
      CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
  END IF;
END
$reviews_status_constraint$;

DO $reviews_link_preflight$
DECLARE
  product_mismatches bigint;
  order_mismatches bigint;
BEGIN
  SELECT count(*)
    INTO product_mismatches
  FROM public.reviews AS review
  LEFT JOIN public.products AS product ON product.id = review.product_id
  WHERE product.id IS NULL
     OR product.tenant_id IS DISTINCT FROM review.tenant_id;

  SELECT count(*)
    INTO order_mismatches
  FROM public.reviews AS review
  LEFT JOIN public.orders AS managed_order ON managed_order.id = review.order_id
  WHERE review.order_id IS NOT NULL
    AND (
      managed_order.id IS NULL
      OR managed_order.tenant_id IS DISTINCT FROM review.tenant_id
    );

  IF product_mismatches <> 0 OR order_mismatches <> 0 THEN
    RAISE EXCEPTION
      'Review tenant-link preflight failed: % product mismatch(es), % order mismatch(es)',
      product_mismatches,
      order_mismatches;
  END IF;
END
$reviews_link_preflight$;

CREATE OR REPLACE FUNCTION public.guard_review_tenant_links()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.products AS product
    WHERE product.id = NEW.product_id
      AND product.tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'Review product tenant does not match review tenant'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.order_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.orders AS managed_order
       WHERE managed_order.id = NEW.order_id
         AND managed_order.tenant_id = NEW.tenant_id
     ) THEN
    RAISE EXCEPTION 'Review order tenant does not match review tenant'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_review_tenant_links ON public.reviews;
CREATE TRIGGER guard_review_tenant_links
BEFORE INSERT OR UPDATE OF tenant_id, product_id, order_id ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.guard_review_tenant_links();

REVOKE ALL ON FUNCTION public.guard_review_tenant_links()
  FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Tenant members view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Staff manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "P0 public approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "P0 authenticated reviews read" ON public.reviews;
DROP POLICY IF EXISTS "P0 customer reviews insert" ON public.reviews;
DROP POLICY IF EXISTS "P0 reviews service access" ON public.reviews;

REVOKE ALL ON TABLE public.reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.reviews TO anon, authenticated;
GRANT INSERT ON TABLE public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reviews TO service_role;

CREATE POLICY "P0 public approved reviews"
  ON public.reviews
  FOR SELECT TO anon
  USING (
    moderation_status = 'approved'
    AND is_approved = true
  );

CREATE POLICY "P0 authenticated reviews read"
  ON public.reviews
  FOR SELECT TO authenticated
  USING (
    (moderation_status = 'approved' AND is_approved = true)
    OR public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'viewer'::public.tenant_role
    )
  );

CREATE POLICY "P0 customer reviews insert"
  ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND moderation_status = 'pending'
    AND is_approved = false
    AND is_verified_purchase = false
    AND helpful_count = 0
    AND order_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.products AS product
      WHERE product.id = reviews.product_id
        AND product.tenant_id = reviews.tenant_id
        AND product.is_published = true
    )
  );

CREATE POLICY "P0 reviews service access"
  ON public.reviews
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 11. Agent task state/memory had logically cross-tenant legacy policies but
--     no grants. Make the intended server-only boundary explicit so a future
--     GRANT cannot silently reactivate those predicates.
-- ---------------------------------------------------------------------------

ALTER TABLE public.ai_agent_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_agent_tasks_tenant_isolation" ON public.ai_agent_tasks;
DROP POLICY IF EXISTS "P0 AI agent tasks service only" ON public.ai_agent_tasks;
REVOKE ALL ON TABLE public.ai_agent_tasks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_agent_tasks TO service_role;
CREATE POLICY "P0 AI agent tasks service only"
  ON public.ai_agent_tasks
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.ai_task_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_task_memory_tenant_isolation" ON public.ai_task_memory;
DROP POLICY IF EXISTS "P0 AI task memory service only" ON public.ai_task_memory;
REVOKE ALL ON TABLE public.ai_task_memory FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_task_memory TO service_role;
CREATE POLICY "P0 AI task memory service only"
  ON public.ai_task_memory
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 12. Move AI provider credentials from reversible ENC:Base64 storage into
--     Supabase Vault. Existing rows are migrated transactionally, the legacy
--     api_key column is scrubbed, and only service_role can resolve or rotate
--     the encrypted secret.
-- ---------------------------------------------------------------------------

ALTER TABLE public.ai_provider_configs
  ADD COLUMN IF NOT EXISTS vault_secret_id uuid;

DO $provider_vault_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.ai_provider_configs'::regclass
      AND conname = 'ai_provider_configs_vault_secret_id_fkey'
  ) THEN
    ALTER TABLE public.ai_provider_configs
      ADD CONSTRAINT ai_provider_configs_vault_secret_id_fkey
      FOREIGN KEY (vault_secret_id)
      REFERENCES vault.secrets(id)
      ON DELETE SET NULL;
  END IF;
END
$provider_vault_fk$;

CREATE UNIQUE INDEX IF NOT EXISTS ai_provider_configs_vault_secret_id_key
  ON public.ai_provider_configs(vault_secret_id)
  WHERE vault_secret_id IS NOT NULL;

REVOKE ALL ON TABLE vault.secrets FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE vault.decrypted_secrets FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_ai_provider_secret(_config_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT decrypted.decrypted_secret
  FROM public.ai_provider_configs AS config
  JOIN vault.decrypted_secrets AS decrypted
    ON decrypted.id = config.vault_secret_id
  WHERE config.id = _config_id;
$function$;

REVOKE ALL ON FUNCTION public.get_ai_provider_secret(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_provider_secret(uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.set_ai_provider_secret(
  _config_id uuid,
  _secret text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  secret_id uuid;
BEGIN
  IF _secret IS NULL OR btrim(_secret) = '' THEN
    RAISE EXCEPTION 'AI provider secret must not be empty'
      USING ERRCODE = '22023';
  END IF;

  SELECT config.vault_secret_id
    INTO secret_id
  FROM public.ai_provider_configs AS config
  WHERE config.id = _config_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AI provider configuration not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF secret_id IS NULL THEN
    secret_id := vault.create_secret(
      _secret,
      'indexes_ai_provider_' || _config_id::text,
      'Indexes Store AI provider credential'
    );

    UPDATE public.ai_provider_configs
    SET vault_secret_id = secret_id,
        api_key = NULL,
        updated_at = now()
    WHERE id = _config_id;
  ELSE
    PERFORM vault.update_secret(secret_id, _secret);

    UPDATE public.ai_provider_configs
    SET api_key = NULL,
        updated_at = now()
    WHERE id = _config_id;
  END IF;

  RETURN secret_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_ai_provider_secret(uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_ai_provider_secret(uuid, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_ai_provider_vault_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  IF OLD.vault_secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets
    WHERE id = OLD.vault_secret_id;
  END IF;
  RETURN OLD;
END;
$function$;

REVOKE ALL ON FUNCTION public.cleanup_ai_provider_vault_secret()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS cleanup_ai_provider_vault_secret
  ON public.ai_provider_configs;
CREATE TRIGGER cleanup_ai_provider_vault_secret
AFTER DELETE ON public.ai_provider_configs
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_ai_provider_vault_secret();

DO $migrate_provider_secrets$
DECLARE
  config record;
  decoded text;
  plain_secret text;
  secret_id uuid;
  legacy_prefix constant text := 'indexes-ai-secret-key-salt-2026:';
BEGIN
  FOR config IN
    SELECT id, api_key
    FROM public.ai_provider_configs
    WHERE vault_secret_id IS NULL
      AND api_key IS NOT NULL
      AND btrim(api_key) <> ''
    FOR UPDATE
  LOOP
    IF config.api_key LIKE 'ENC:%' THEN
      BEGIN
        decoded := convert_from(
          decode(substr(config.api_key, 5), 'base64'),
          'UTF8'
        );
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION
          'AI provider credential migration failed for config %: invalid legacy encoding',
          config.id;
      END;

      IF left(decoded, length(legacy_prefix)) <> legacy_prefix THEN
        RAISE EXCEPTION
          'AI provider credential migration failed for config %: unexpected legacy prefix',
          config.id;
      END IF;

      plain_secret := substr(decoded, length(legacy_prefix) + 1);
    ELSE
      plain_secret := config.api_key;
    END IF;

    IF plain_secret IS NULL OR btrim(plain_secret) = '' THEN
      RAISE EXCEPTION
        'AI provider credential migration failed for config %: empty secret',
        config.id;
    END IF;

    secret_id := vault.create_secret(
      plain_secret,
      'indexes_ai_provider_' || config.id::text,
      'Indexes Store AI provider credential'
    );

    UPDATE public.ai_provider_configs
    SET vault_secret_id = secret_id,
        api_key = NULL,
        updated_at = now()
    WHERE id = config.id;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM public.ai_provider_configs
    WHERE api_key IS NOT NULL
      AND btrim(api_key) <> ''
  ) THEN
    RAISE EXCEPTION
      'AI provider credential migration did not scrub every legacy api_key';
  END IF;
END
$migrate_provider_secrets$;

NOTIFY pgrst, 'reload schema';

COMMIT;
