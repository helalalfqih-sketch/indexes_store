-- Run after 20260908000000_storage_tenant_isolation.sql in a test environment.
-- Read-only catalog verification. Raises on an unsafe or incomplete policy state.

DO $verify$
DECLARE
  unsafe_policy_count integer;
  missing_policy_count integer;
  policy_definition text;
BEGIN
  SELECT count(*)
    INTO unsafe_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    AND (roles && ARRAY['public', 'anon']::name[]);

  IF unsafe_policy_count <> 0 THEN
    RAISE EXCEPTION
      'Storage isolation verification failed: % anonymous/public mutation policies remain',
      unsafe_policy_count;
  END IF;

  SELECT count(*)
    INTO missing_policy_count
  FROM (
    VALUES
      ('Authenticated upload tenant media'::text, 'INSERT'::text),
      ('Authenticated update tenant media', 'UPDATE'),
      ('Authenticated delete tenant media', 'DELETE')
  ) AS required(policy_name, policy_command)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_policies AS p
    WHERE p.schemaname = 'storage'
      AND p.tablename = 'objects'
      AND p.policyname = required.policy_name
      AND p.cmd = required.policy_command
      AND p.roles = ARRAY['authenticated']::name[]
      AND concat_ws(' ', p.qual, p.with_check)
        LIKE '%storage_object_tenant_id%'
      AND concat_ws(' ', p.qual, p.with_check)
        LIKE '%has_tenant_permission%'
  );

  IF missing_policy_count <> 0 THEN
    RAISE EXCEPTION
      'Storage isolation verification failed: % scoped mutation policies are missing or malformed',
      missing_policy_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read media buckets'
      AND cmd = 'SELECT'
      AND roles @> ARRAY['anon']::name[]
  ) THEN
    RAISE EXCEPTION
      'Storage isolation verification failed: public storefront read policy is missing';
  END IF;

  SELECT concat_ws(' ', qual, with_check)
    INTO policy_definition
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'product_media'
    AND policyname = 'Tenant staff manage product_media'
    AND cmd = 'ALL'
    AND roles = ARRAY['authenticated']::name[];

  IF policy_definition IS NULL
     OR policy_definition NOT LIKE '%has_tenant_permission%'
     OR policy_definition NOT LIKE '%staff%' THEN
    RAISE EXCEPTION
      'Storage isolation verification failed: product_media staff policy is missing or malformed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_media'
      AND policyname = 'Tenant members manage product_media'
  ) THEN
    RAISE EXCEPTION
      'Storage isolation verification failed: legacy tenant-member mutation policy remains';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.product_media'::regclass
      AND tgname = 'trg_product_media_tenant_consistency'
      AND tgenabled <> 'D'
  ) THEN
    RAISE EXCEPTION
      'Storage isolation verification failed: cross-tenant relation trigger is missing';
  END IF;
END
$verify$;
