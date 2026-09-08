-- P0 remediation: enforce tenant-scoped Storage and media mutations.
-- Forward-only and replay-safe. Apply to a non-production Supabase project first.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

DO $preflight$
DECLARE
  missing_relations text[];
BEGIN
  SELECT array_agg(required_relation)
    INTO missing_relations
  FROM (
    VALUES
      ('storage.objects'::text),
      ('public.products'),
      ('public.media_files'),
      ('public.product_media'),
      ('public.tenant_members')
  ) AS required(required_relation)
  WHERE to_regclass(required_relation) IS NULL;

  IF missing_relations IS NOT NULL THEN
    RAISE EXCEPTION 'Storage tenant-isolation migration aborted; missing relations: %',
      array_to_string(missing_relations, ', ');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_media'
      AND column_name = 'tenant_id'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_media'
      AND column_name = 'media_id'
  ) THEN
    RAISE EXCEPTION
      'Storage tenant-isolation migration aborted; product_media tenant_id/media_id contract is missing';
  END IF;
END
$preflight$;

-- Accepted application object layouts:
--   <tenant_uuid>/<file>
--   uploads/<tenant_uuid>/<file>
CREATE OR REPLACE FUNCTION public.storage_object_tenant_id(object_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = pg_catalog, public
AS $function$
DECLARE
  first_segment text;
  candidate text;
BEGIN
  first_segment := split_part(object_name, '/', 1);
  candidate := CASE
    WHEN first_segment = 'uploads' THEN split_part(object_name, '/', 2)
    ELSE first_segment
  END;

  IF candidate !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN NULL;
  END IF;

  RETURN candidate::uuid;
END;
$function$;

REVOKE ALL ON FUNCTION public.storage_object_tenant_id(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.storage_object_tenant_id(text)
  TO authenticated, service_role;

-- Remove every known bucket-wide mutation policy, including the later
-- 20260809000002 policy names that superseded the original PR.
DROP POLICY IF EXISTS "Allow Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Storage Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Products & Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Products & Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload media buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update media buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete media buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload tenant media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update tenant media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete tenant media" ON storage.objects;

-- Keep storefront delivery behavior unchanged.
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Public read media buckets" ON storage.objects;
CREATE POLICY "Public read media buckets"
  ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('product-images', 'media', 'uploads', 'public'));

CREATE POLICY "Authenticated upload tenant media"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('product-images', 'media', 'uploads')
    AND public.storage_object_tenant_id(name) IS NOT NULL
    AND public.has_tenant_permission(
      public.storage_object_tenant_id(name),
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

CREATE POLICY "Authenticated update tenant media"
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('product-images', 'media', 'uploads')
    AND public.storage_object_tenant_id(name) IS NOT NULL
    AND public.has_tenant_permission(
      public.storage_object_tenant_id(name),
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  )
  WITH CHECK (
    bucket_id IN ('product-images', 'media', 'uploads')
    AND public.storage_object_tenant_id(name) IS NOT NULL
    AND public.has_tenant_permission(
      public.storage_object_tenant_id(name),
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

CREATE POLICY "Authenticated delete tenant media"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('product-images', 'media', 'uploads')
    AND public.storage_object_tenant_id(name) IS NOT NULL
    AND public.has_tenant_permission(
      public.storage_object_tenant_id(name),
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

-- Viewers retain reads but cannot create or change product-media relations.
DROP POLICY IF EXISTS "Tenant members manage product_media" ON public.product_media;
DROP POLICY IF EXISTS "Tenant staff manage product_media" ON public.product_media;
CREATE POLICY "Tenant staff manage product_media"
  ON public.product_media
  FOR ALL TO authenticated
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

-- RLS alone cannot ensure all three relation keys belong to one tenant.
CREATE OR REPLACE FUNCTION public.enforce_product_media_tenant_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.products AS p
    JOIN public.media_files AS m ON m.id = NEW.media_id
    WHERE p.id = NEW.product_id
      AND p.tenant_id = NEW.tenant_id
      AND m.tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'product_media tenant mismatch'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_product_media_tenant_consistency()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_product_media_tenant_consistency
  ON public.product_media;
CREATE TRIGGER trg_product_media_tenant_consistency
  BEFORE INSERT OR UPDATE OF tenant_id, product_id, media_id
  ON public.product_media
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_product_media_tenant_consistency();

NOTIFY pgrst, 'reload schema';

COMMIT;
