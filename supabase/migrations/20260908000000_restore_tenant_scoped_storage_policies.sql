-- Restore tenant isolation after 20260809000002 reintroduced broad Storage
-- policies. Public buckets do not need a storage.objects SELECT policy for
-- direct public-URL delivery, and authenticated writes must stay under the
-- canonical product-images path: uploads/{tenant_id}/...

BEGIN;

DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Read Products & Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Products & Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Products & Media" ON storage.objects;
-- These are the active production policy names as of 2026-09-08. A global
-- application admin role is not tenant ownership, so these policies allowed
-- cross-tenant object replacement and deletion.
DROP POLICY IF EXISTS "Admin storage insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin storage update" ON storage.objects;
DROP POLICY IF EXISTS "Admin storage delete" ON storage.objects;
DROP POLICY IF EXISTS "Public storage select" ON storage.objects;

-- Recreate the canonical policies so this migration is safe even when an
-- environment was provisioned without 20260731000001.
DROP POLICY IF EXISTS "P0 product images staff list" ON storage.objects;
DROP POLICY IF EXISTS "P0 product images staff insert" ON storage.objects;
DROP POLICY IF EXISTS "P0 product images staff update" ON storage.objects;
DROP POLICY IF EXISTS "P0 product images owner delete" ON storage.objects;

CREATE POLICY "P0 product images staff list"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'uploads'
    AND CASE
      WHEN (storage.foldername(name))[2] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN public.has_tenant_permission(
        ((storage.foldername(name))[2])::uuid,
        (SELECT auth.uid()),
        'staff'::public.tenant_role
      )
      ELSE false
    END
  );

CREATE POLICY "P0 product images staff insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'uploads'
    AND CASE
      WHEN (storage.foldername(name))[2] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN public.has_tenant_permission(
        ((storage.foldername(name))[2])::uuid,
        (SELECT auth.uid()),
        'staff'::public.tenant_role
      )
      ELSE false
    END
  );

CREATE POLICY "P0 product images staff update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'uploads'
    AND CASE
      WHEN (storage.foldername(name))[2] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN public.has_tenant_permission(
        ((storage.foldername(name))[2])::uuid,
        (SELECT auth.uid()),
        'staff'::public.tenant_role
      )
      ELSE false
    END
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'uploads'
    AND CASE
      WHEN (storage.foldername(name))[2] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN public.has_tenant_permission(
        ((storage.foldername(name))[2])::uuid,
        (SELECT auth.uid()),
        'staff'::public.tenant_role
      )
      ELSE false
    END
  );

CREATE POLICY "P0 product images owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'uploads'
    AND CASE
      WHEN (storage.foldername(name))[2] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN public.has_tenant_permission(
        ((storage.foldername(name))[2])::uuid,
        (SELECT auth.uid()),
        'owner'::public.tenant_role
      )
      ELSE false
    END
  );

COMMIT;
