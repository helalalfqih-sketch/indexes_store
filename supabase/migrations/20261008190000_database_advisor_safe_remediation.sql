-- Safe, semantics-preserving remediation for the Supabase database advisors.
--
-- Scope:
--   * add covering indexes for the 20 foreign keys reported on 2026-10-08;
--   * remove a duplicate products index only when it is demonstrably identical
--     to the retained index and has no constraint/dependency;
--   * make auth helpers in the reported RLS policies init-plan subqueries;
--   * consolidate permissive policies without narrowing their effective access.
--
-- Intentionally not changed here:
--   * server-only tables with RLS and no policies (deny-by-default is deliberate);
--   * SECURITY DEFINER RPC grants that are required by RLS or contain their own
--     authorization checks;
--   * indexes reported unused from a short statistics window (usage evidence is
--     required before removing an index that may protect a production path);
--   * leaked-password protection, which is an Auth project setting rather than DDL.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

-- Foreign-key indexes. Production statistics showed the largest affected table
-- is about 50 MB, so ordinary transactional index creation is appropriate here.
CREATE INDEX IF NOT EXISTS idx_ai_task_memory_task_id_fk
  ON public.ai_task_memory (task_id);
CREATE INDEX IF NOT EXISTS idx_cms_page_versions_edited_by_fk
  ON public.cms_page_versions (edited_by);
CREATE INDEX IF NOT EXISTS idx_cms_page_versions_tenant_id_fk
  ON public.cms_page_versions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_by_fk
  ON public.inventory_movements (created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_product_fk
  ON public.inventory_movements (tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_media_files_created_by_fk
  ON public.media_files (created_by);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id_fk
  ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by_fk
  ON public.order_status_history (changed_by);
CREATE INDEX IF NOT EXISTS idx_order_status_history_tenant_id_fk
  ON public.order_status_history (tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_fk
  ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id_fk
  ON public.reviews (order_id);
CREATE INDEX IF NOT EXISTS idx_sales_analytics_order_id_fk
  ON public.sales_analytics (order_id);
CREATE INDEX IF NOT EXISTS idx_storefront_settings_updated_by_fk
  ON public.storefront_settings (updated_by);
CREATE INDEX IF NOT EXISTS idx_system_live_logs_tenant_id_fk
  ON public.system_live_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_logs_actor_id_fk
  ON public.tenant_audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_oauth_states_tenant_id_fk
  ON public.tiktok_oauth_states (tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant_id_fk
  ON public.webhook_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_branch_id_fk
  ON public.whatsapp_configs (branch_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_integrations_tenant_id_fk
  ON public.whatsapp_integrations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_config_id_fk
  ON public.whatsapp_messages (config_id);

-- products_tenant_id_id_security_key duplicates the unique constraint-backed
-- products_tenant_id_id_key in production. Only remove it after comparing the
-- complete index shape and confirming nothing depends on the redundant index.
DO $migration$
DECLARE
  retained_index oid := to_regclass('public.products_tenant_id_id_key');
  redundant_index oid := to_regclass('public.products_tenant_id_id_security_key');
BEGIN
  IF retained_index IS NOT NULL
     AND redundant_index IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_index retained
       JOIN pg_index redundant
         ON redundant.indexrelid = redundant_index
       WHERE retained.indexrelid = retained_index
         AND retained.indrelid = redundant.indrelid
         AND retained.indnatts = redundant.indnatts
         AND retained.indnkeyatts = redundant.indnkeyatts
         AND retained.indisunique = redundant.indisunique
         AND retained.indkey = redundant.indkey
         AND retained.indcollation = redundant.indcollation
         AND retained.indclass = redundant.indclass
         AND retained.indoption = redundant.indoption
         AND retained.indexprs IS NOT DISTINCT FROM redundant.indexprs
         AND retained.indpred IS NOT DISTINCT FROM redundant.indpred
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conindid = redundant_index
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_depend
       WHERE refobjid = redundant_index
         AND deptype IN ('a', 'n')
     )
  THEN
    EXECUTE 'DROP INDEX public.products_tenant_id_id_security_key';
  END IF;
END;
$migration$;

-- Consolidate branches policies. The SELECT policy preserves the union of the
-- previous viewer and staff predicates; write policies preserve the old ALL
-- policy one command at a time, so authenticated access is unchanged.
DROP POLICY IF EXISTS "Tenant members view branches" ON public.branches;
DROP POLICY IF EXISTS "Staff manage branches" ON public.branches;

CREATE POLICY branches_select_members_and_staff
  ON public.branches
  FOR SELECT
  TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'viewer'::public.tenant_role)
    OR public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );

CREATE POLICY branches_staff_insert
  ON public.branches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );

CREATE POLICY branches_staff_update
  ON public.branches
  FOR UPDATE
  TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  )
  WITH CHECK (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );

CREATE POLICY branches_staff_delete
  ON public.branches
  FOR DELETE
  TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, (SELECT auth.uid()), 'staff'::public.tenant_role)
  );

-- Remove the legacy unrestricted authenticated policy and re-assert the
-- tenant-scoped write policies from the production hardening migration. The
-- canonical read policy covers both storefront roles without duplicate
-- permissive policies. Anonymous inserts are removed because they cannot prove
-- tenant membership and bypass the hardened upload path.
DROP POLICY IF EXISTS "Allow authenticated manage media files" ON public.media_files;
DROP POLICY IF EXISTS "Allow all authenticated users to manage media files" ON public.media_files;
DROP POLICY IF EXISTS "Tenant members manage media files" ON public.media_files;
DROP POLICY IF EXISTS "Allow public insert media files" ON public.media_files;
DROP POLICY IF EXISTS "Allow public to read media files" ON public.media_files;
DROP POLICY IF EXISTS "Public read media files" ON public.media_files;
DROP POLICY IF EXISTS media_files_authenticated_select ON public.media_files;
DROP POLICY IF EXISTS media_files_authenticated_update ON public.media_files;
DROP POLICY IF EXISTS media_files_authenticated_delete ON public.media_files;
DROP POLICY IF EXISTS "P0 media staff insert" ON public.media_files;
DROP POLICY IF EXISTS "P0 media staff update" ON public.media_files;
DROP POLICY IF EXISTS "P0 media owner delete" ON public.media_files;

CREATE POLICY "Public read media files"
  ON public.media_files
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "P0 media staff insert"
  ON public.media_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

CREATE POLICY "P0 media staff update"
  ON public.media_files
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

CREATE POLICY "P0 media owner delete"
  ON public.media_files
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'owner'::public.tenant_role
    )
  );

-- storefront_settings had two identical public-read policies and two admin ALL
-- policies. Fold the tenant-owner ALL policy into command-specific writes so
-- each command has one permissive policy while preserving the prior union.
DROP POLICY IF EXISTS "Public view storefront settings" ON public.storefront_settings;
DROP POLICY IF EXISTS "Staff manage storefront settings" ON public.storefront_settings;
DROP POLICY IF EXISTS storefront_settings_admin_write ON public.storefront_settings;
DROP POLICY IF EXISTS "Store owners manage own CMS rows" ON public.storefront_settings;

CREATE POLICY storefront_settings_admin_insert
  ON public.storefront_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT auth.jwt()) ->> 'role') = 'admin'
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR (
      tenant_id IS NOT NULL
      AND public.has_tenant_permission(
        tenant_id,
        (SELECT auth.uid()),
        'owner'::public.tenant_role
      )
    )
  );

CREATE POLICY storefront_settings_admin_update
  ON public.storefront_settings
  FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt()) ->> 'role') = 'admin'
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR (
      tenant_id IS NOT NULL
      AND public.has_tenant_permission(
        tenant_id,
        (SELECT auth.uid()),
        'owner'::public.tenant_role
      )
    )
  )
  WITH CHECK (
    ((SELECT auth.jwt()) ->> 'role') = 'admin'
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR (
      tenant_id IS NOT NULL
      AND public.has_tenant_permission(
        tenant_id,
        (SELECT auth.uid()),
        'owner'::public.tenant_role
      )
    )
  );

CREATE POLICY storefront_settings_admin_delete
  ON public.storefront_settings
  FOR DELETE
  TO authenticated
  USING (
    ((SELECT auth.jwt()) ->> 'role') = 'admin'
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR (
      tenant_id IS NOT NULL
      AND public.has_tenant_permission(
        tenant_id,
        (SELECT auth.uid()),
        'owner'::public.tenant_role
      )
    )
  );

-- Authenticated tenant reads previously used two permissive policies. Preserve
-- their OR semantics in one policy and leave the anonymous policy untouched.
DROP POLICY IF EXISTS "Members and admins can view their tenant" ON public.tenants;
DROP POLICY IF EXISTS "Storefront resolution — active tenants visible to authenticat" ON public.tenants;

CREATE POLICY tenants_authenticated_select
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'::public.tenant_status
    OR public.can_manage_tenant(id, (SELECT auth.uid()))
  );

-- Rewrite only the remaining policies reported by auth_rls_initplan. ALTER
-- POLICY retains each command, role list, and permissive/restrictive setting;
-- only direct auth helper calls become one-time init-plan subqueries.
DO $migration$
DECLARE
  policy_record record;
  optimized_using text;
  optimized_check text;
  statement text;
BEGIN
  FOR policy_record IN
    SELECT
      namespace.nspname AS schema_name,
      relation.relname AS table_name,
      policy.polname AS policy_name,
      pg_get_expr(policy.polqual, policy.polrelid) AS using_expression,
      pg_get_expr(policy.polwithcheck, policy.polrelid) AS check_expression
    FROM pg_policy AS policy
    JOIN pg_class AS relation ON relation.oid = policy.polrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    JOIN (
      VALUES
        ('profiles', 'Users insert own profile'),
        ('profiles', 'Users update own profile'),
        ('profiles', 'profiles_select_own_or_admin'),
        ('user_roles', 'Admins insert roles'),
        ('user_roles', 'Admins update roles'),
        ('user_roles', 'Admins delete roles'),
        ('categories', 'Public can view active categories'),
        ('categories', 'Tenant members insert categories'),
        ('categories', 'Tenant members update categories'),
        ('categories', 'Tenant members delete categories'),
        ('products', 'Public can view published products'),
        ('products', 'Tenant members insert products'),
        ('products', 'Tenant members update products'),
        ('products', 'Tenant members delete products'),
        ('tenants', 'Only platform admins insert tenants'),
        ('tenants', 'Owner or platform admin can update tenant'),
        ('tenants', 'Only platform admins delete tenants'),
        ('tenant_members', 'Members view their memberships'),
        ('tenant_members', 'Owners and admins add members'),
        ('tenant_members', 'Owners and admins update members'),
        ('tenant_members', 'Owners and admins remove members'),
        ('inventory_movements', 'Tenant members view inventory'),
        ('inventory_movements', 'Tenant members insert inventory'),
        ('ai_task_memory', 'ai_task_memory_tenant_isolation'),
        ('ai_agent_tasks', 'ai_agent_tasks_tenant_isolation'),
        ('ai_agent_sessions', 'ai_sessions_user_access'),
        ('ai_agent_messages', 'ai_messages_user_access'),
        ('ai_agent_memory', 'ai_memory_tenant_access'),
        ('ai_agent_audit_logs', 'ai_audit_tenant_access'),
        ('ai_agent_usage', 'ai_usage_tenant_access'),
        ('reviews', 'Tenant members view all reviews'),
        ('reviews', 'Users create reviews'),
        ('reviews', 'Staff manage reviews'),
        ('notifications', 'Users view own notifications'),
        ('notifications', 'Staff create notifications'),
        ('notifications', 'Users mark notifications read'),
        ('sales_analytics', 'Staff view analytics'),
        ('whatsapp_configs', 'Staff manage whatsapp configs'),
        ('whatsapp_messages', 'Staff view whatsapp messages'),
        ('product_comparisons', 'Users manage own comparisons')
    ) AS target(table_name, policy_name)
      ON target.table_name = relation.relname
     AND target.policy_name = policy.polname
    WHERE namespace.nspname = 'public'
  LOOP
    optimized_using := policy_record.using_expression;
    optimized_check := policy_record.check_expression;

    IF optimized_using IS NOT NULL THEN
      optimized_using := replace(optimized_using, 'auth.uid()', '(SELECT auth.uid())');
      optimized_using := replace(optimized_using, 'auth.jwt()', '(SELECT auth.jwt())');
      optimized_using := replace(optimized_using, 'auth.role()', '(SELECT auth.role())');
      optimized_using := replace(optimized_using, 'auth.email()', '(SELECT auth.email())');
    END IF;

    IF optimized_check IS NOT NULL THEN
      optimized_check := replace(optimized_check, 'auth.uid()', '(SELECT auth.uid())');
      optimized_check := replace(optimized_check, 'auth.jwt()', '(SELECT auth.jwt())');
      optimized_check := replace(optimized_check, 'auth.role()', '(SELECT auth.role())');
      optimized_check := replace(optimized_check, 'auth.email()', '(SELECT auth.email())');
    END IF;

    statement := format(
      'ALTER POLICY %I ON %I.%I',
      policy_record.policy_name,
      policy_record.schema_name,
      policy_record.table_name
    );

    IF optimized_using IS NOT NULL THEN
      statement := statement || format(' USING (%s)', optimized_using);
    END IF;

    IF optimized_check IS NOT NULL THEN
      statement := statement || format(' WITH CHECK (%s)', optimized_check);
    END IF;

    EXECUTE statement;
  END LOOP;
END;
$migration$;

COMMIT;
