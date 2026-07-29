-- P0: close public Storage writes and enforce tenant-scoped media mutations.
-- Additive/idempotent remediation; do not edit previously applied migrations.

BEGIN;

-- Resolve the tenant encoded by supported object paths:
--   <tenant_uuid>/<file>
--   uploads/<tenant_uuid>/<file>  (legacy application path)
CREATE OR REPLACE FUNCTION public.storage_object_tenant_id(object_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = public
AS $$
DECLARE
  parts text[];
  candidate text;
BEGIN
  parts := string_to_array(object_name, '/');
  candidate := CASE
    WHEN parts[1] = 'uploads' THEN parts[2]
    ELSE parts[1]
  END;

  IF candidate IS NULL OR candidate !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN NULL;
  END IF;

  RETURN candidate::uuid;
END;
$$;

REVOKE ALL ON FUNCTION public.storage_object_tenant_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.storage_object_tenant_id(text) TO authenticated, service_role;

-- Remove every known broad policy name before creating restrictive replacements.
DROP POLICY IF EXISTS "Allow Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Allow Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Storage Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read media buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload media buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update media buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete media buckets" ON storage.objects;

-- Storefront assets remain publicly readable. Writes require an authenticated
-- staff-or-higher member of the tenant encoded in the object path.
CREATE POLICY "Public read media buckets"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('product-images', 'media', 'uploads', 'product-videos'));

CREATE POLICY "Authenticated upload tenant media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('product-images', 'media', 'uploads', 'product-videos')
    AND public.storage_object_tenant_id(name) IS NOT NULL
    AND public.has_tenant_permission(
      public.storage_object_tenant_id(name),
      auth.uid(),
      'staff'::public.tenant_role
    )
  );

CREATE POLICY "Authenticated update tenant media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('product-images', 'media', 'uploads', 'product-videos')
    AND public.storage_object_tenant_id(name) IS NOT NULL
    AND public.has_tenant_permission(
      public.storage_object_tenant_id(name),
      auth.uid(),
      'staff'::public.tenant_role
    )
  )
  WITH CHECK (
    bucket_id IN ('product-images', 'media', 'uploads', 'product-videos')
    AND public.storage_object_tenant_id(name) IS NOT NULL
    AND public.has_tenant_permission(
      public.storage_object_tenant_id(name),
      auth.uid(),
      'staff'::public.tenant_role
    )
  );

CREATE POLICY "Authenticated delete tenant media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('product-images', 'media', 'uploads', 'product-videos')
    AND public.storage_object_tenant_id(name) IS NOT NULL
    AND public.has_tenant_permission(
      public.storage_object_tenant_id(name),
      auth.uid(),
      'staff'::public.tenant_role
    )
  );

-- Viewers may read public media metadata but cannot mutate it.
DROP POLICY IF EXISTS "Tenant members manage media files" ON public.media_files;
DROP POLICY IF EXISTS "Tenant staff manage media files" ON public.media_files;
CREATE POLICY "Tenant staff manage media files"
  ON public.media_files FOR ALL TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, auth.uid(), 'staff'::public.tenant_role)
  )
  WITH CHECK (
    public.has_tenant_permission(tenant_id, auth.uid(), 'staff'::public.tenant_role)
  );

DROP POLICY IF EXISTS "Tenant members manage product_media" ON public.product_media;
DROP POLICY IF EXISTS "Tenant staff manage product_media" ON public.product_media;
CREATE POLICY "Tenant staff manage product_media"
  ON public.product_media FOR ALL TO authenticated
  USING (
    public.has_tenant_permission(tenant_id, auth.uid(), 'staff'::public.tenant_role)
  )
  WITH CHECK (
    public.has_tenant_permission(tenant_id, auth.uid(), 'staff'::public.tenant_role)
  );

-- Enforce that a product-media relation cannot cross tenant boundaries.
CREATE OR REPLACE FUNCTION public.enforce_product_media_tenant_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.media_files m ON m.id = NEW.media_id
    WHERE p.id = NEW.product_id
      AND p.tenant_id = NEW.tenant_id
      AND m.tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'product_media tenant mismatch' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_product_media_tenant_consistency() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_product_media_tenant_consistency ON public.product_media;
CREATE TRIGGER trg_product_media_tenant_consistency
  BEFORE INSERT OR UPDATE OF tenant_id, product_id, media_id
  ON public.product_media
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_product_media_tenant_consistency();

NOTIFY pgrst, 'reload schema';

COMMIT;
