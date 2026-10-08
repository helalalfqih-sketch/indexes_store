-- Read-only post-migration assertions for
-- 20261008190000_database_advisor_safe_remediation.sql.
-- Run against a preview/shadow database after applying the migration.

BEGIN READ ONLY;

DO $test$
DECLARE
  target_constraint_count integer;
  missing_index_names text[];
  redundant_index regclass;
  legacy_policy_count integer;
  replacement_policy_count integer;
  initplan_policy_count integer;
BEGIN
  SELECT count(*)
  INTO target_constraint_count
  FROM pg_constraint
  WHERE conname = ANY (ARRAY[
    'ai_task_memory_task_id_fkey',
    'cms_page_versions_edited_by_fkey',
    'cms_page_versions_tenant_id_fkey',
    'inventory_movements_created_by_fkey',
    'inventory_product_tenant_fkey',
    'media_files_created_by_fkey',
    'order_items_product_id_fkey',
    'order_status_history_changed_by_fkey',
    'order_status_history_tenant_id_fkey',
    'orders_user_id_fkey',
    'reviews_order_id_fkey',
    'sales_analytics_order_id_fkey',
    'storefront_settings_updated_by_fkey',
    'system_live_logs_tenant_id_fkey',
    'tenant_audit_logs_actor_id_fkey',
    'tiktok_oauth_states_tenant_id_fkey',
    'webhook_events_tenant_id_fkey',
    'whatsapp_configs_branch_id_fkey',
    'whatsapp_integrations_tenant_id_fkey',
    'whatsapp_messages_config_id_fkey'
  ]);

  IF target_constraint_count <> 20 THEN
    RAISE EXCEPTION 'Expected 20 target foreign keys, found %', target_constraint_count;
  END IF;

  WITH target_constraints(constraint_name) AS (
    VALUES
      ('ai_task_memory_task_id_fkey'),
      ('cms_page_versions_edited_by_fkey'),
      ('cms_page_versions_tenant_id_fkey'),
      ('inventory_movements_created_by_fkey'),
      ('inventory_product_tenant_fkey'),
      ('media_files_created_by_fkey'),
      ('order_items_product_id_fkey'),
      ('order_status_history_changed_by_fkey'),
      ('order_status_history_tenant_id_fkey'),
      ('orders_user_id_fkey'),
      ('reviews_order_id_fkey'),
      ('sales_analytics_order_id_fkey'),
      ('storefront_settings_updated_by_fkey'),
      ('system_live_logs_tenant_id_fkey'),
      ('tenant_audit_logs_actor_id_fkey'),
      ('tiktok_oauth_states_tenant_id_fkey'),
      ('webhook_events_tenant_id_fkey'),
      ('whatsapp_configs_branch_id_fkey'),
      ('whatsapp_integrations_tenant_id_fkey'),
      ('whatsapp_messages_config_id_fkey')
  )
  SELECT array_agg(constraint_record.conname ORDER BY constraint_record.conname)
  INTO missing_index_names
  FROM pg_constraint AS constraint_record
  JOIN target_constraints AS target
    ON target.constraint_name = constraint_record.conname
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_index AS index_record
    WHERE index_record.indrelid = constraint_record.conrelid
      AND index_record.indisvalid
      AND index_record.indisready
      AND index_record.indpred IS NULL
      AND (
        SELECT array_agg(index_key.key ORDER BY index_key.ordinality)::smallint[]
        FROM unnest(index_record.indkey::smallint[])
          WITH ORDINALITY AS index_key(key, ordinality)
        WHERE index_key.ordinality <= cardinality(constraint_record.conkey)
      ) = constraint_record.conkey
  );

  IF missing_index_names IS NOT NULL THEN
    RAISE EXCEPTION 'Foreign keys still missing covering indexes: %', missing_index_names;
  END IF;

  redundant_index := to_regclass('public.products_tenant_id_id_security_key');
  IF redundant_index IS NOT NULL THEN
    RAISE EXCEPTION 'Redundant products index still exists: %', redundant_index;
  END IF;

  SELECT count(*)
  INTO legacy_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (tablename, policyname) IN (
      ('branches', 'Tenant members view branches'),
      ('branches', 'Staff manage branches'),
      ('media_files', 'Allow authenticated manage media files'),
      ('media_files', 'Allow all authenticated users to manage media files'),
      ('media_files', 'Tenant members manage media files'),
      ('media_files', 'Allow public insert media files'),
      ('media_files', 'Allow public to read media files'),
      ('media_files', 'media_files_authenticated_select'),
      ('media_files', 'media_files_authenticated_update'),
      ('media_files', 'media_files_authenticated_delete'),
      ('storefront_settings', 'Public view storefront settings'),
      ('storefront_settings', 'Staff manage storefront settings'),
      ('storefront_settings', 'storefront_settings_admin_write'),
      ('storefront_settings', 'Store owners manage own CMS rows'),
      ('tenants', 'Members and admins can view their tenant'),
      ('tenants', 'Storefront resolution — active tenants visible to authenticat')
    );

  IF legacy_policy_count <> 0 THEN
    RAISE EXCEPTION 'Found % legacy permissive policies after consolidation', legacy_policy_count;
  END IF;

  SELECT count(*)
  INTO replacement_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (tablename, policyname) IN (
      ('branches', 'branches_select_members_and_staff'),
      ('branches', 'branches_staff_insert'),
      ('branches', 'branches_staff_update'),
      ('branches', 'branches_staff_delete'),
      ('media_files', 'Public read media files'),
      ('media_files', 'P0 media staff insert'),
      ('media_files', 'P0 media staff update'),
      ('media_files', 'P0 media owner delete'),
      ('storefront_settings', 'storefront_settings_admin_insert'),
      ('storefront_settings', 'storefront_settings_admin_update'),
      ('storefront_settings', 'storefront_settings_admin_delete'),
      ('tenants', 'tenants_authenticated_select')
    );

  IF replacement_policy_count <> 12 THEN
    RAISE EXCEPTION 'Expected 12 replacement policies, found %', replacement_policy_count;
  END IF;

  -- Every policy changed for auth_rls_initplan must now contain a SubLink node.
  -- The Supabase advisor remains the authoritative check for zero findings.
  SELECT count(*)
  INTO initplan_policy_count
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
      ('product_comparisons', 'Users manage own comparisons'),
      ('branches', 'branches_select_members_and_staff'),
      ('branches', 'branches_staff_insert'),
      ('branches', 'branches_staff_update'),
      ('branches', 'branches_staff_delete'),
      ('storefront_settings', 'storefront_settings_admin_insert'),
      ('storefront_settings', 'storefront_settings_admin_update'),
      ('storefront_settings', 'storefront_settings_admin_delete'),
      ('tenants', 'tenants_authenticated_select')
  ) AS target(table_name, policy_name)
    ON target.table_name = relation.relname
   AND target.policy_name = policy.polname
  WHERE namespace.nspname = 'public'
    AND position(
      'SUBLINK' IN upper(
        coalesce(policy.polqual::text, '') || ' ' || coalesce(policy.polwithcheck::text, '')
      )
    ) > 0;

  IF initplan_policy_count <> 48 THEN
    RAISE EXCEPTION 'Expected 48 optimized auth policies, found %', initplan_policy_count;
  END IF;
END;
$test$;

ROLLBACK;
