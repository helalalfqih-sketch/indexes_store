-- =========================================================
-- Migration: Missing Production Admin Modules (Idempotent)
-- Adds: cms_pages, cms_page_versions, media_files, tenant_members.permissions
-- =========================================================

-- 1. Extend tenant_members table with permissions column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenant_members'
      AND column_name = 'permissions'
  ) THEN
    ALTER TABLE public.tenant_members
      ADD COLUMN permissions jsonb NOT NULL DEFAULT '["products","orders","inventory","deals","cms","settings","analytics"]'::jsonb;
  END IF;
END $$;

-- 2. Create cms_pages table
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug             text NOT NULL,
  title            text NOT NULL,
  content          text NOT NULL DEFAULT '',
  is_published     boolean NOT NULL DEFAULT true,
  meta_title       text,
  meta_description text,
  og_image         text,
  canonical_url    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cms_pages_tenant_slug_key UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_tenant_slug ON public.cms_pages(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_published ON public.cms_pages(tenant_id, is_published);

-- RLS for cms_pages
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published cms pages" ON public.cms_pages;
CREATE POLICY "Public read published cms pages"
  ON public.cms_pages FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Tenant members read all cms pages" ON public.cms_pages;
CREATE POLICY "Tenant members read all cms pages"
  ON public.cms_pages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_tenant_member(tenant_id, auth.uid())
  );

DROP POLICY IF EXISTS "Tenant members manage cms pages" ON public.cms_pages;
CREATE POLICY "Tenant members manage cms pages"
  ON public.cms_pages FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_tenant_permission(tenant_id, auth.uid(), 'staff'::public.tenant_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_tenant_permission(tenant_id, auth.uid(), 'staff'::public.tenant_role)
  );

-- 3. Create cms_page_versions table for revision history & restores
CREATE TABLE IF NOT EXISTS public.cms_page_versions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id          uuid NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title_snapshot   text NOT NULL,
  content_snapshot text NOT NULL,
  edited_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  editor_email     text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_page_versions_page ON public.cms_page_versions(page_id, created_at DESC);

ALTER TABLE public.cms_page_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members view cms page versions" ON public.cms_page_versions;
CREATE POLICY "Tenant members view cms page versions"
  ON public.cms_page_versions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_tenant_member(tenant_id, auth.uid())
  );

DROP POLICY IF EXISTS "Tenant members insert cms page versions" ON public.cms_page_versions;
CREATE POLICY "Tenant members insert cms page versions"
  ON public.cms_page_versions FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_tenant_member(tenant_id, auth.uid())
  );

-- 4. Create media_files table
CREATE TABLE IF NOT EXISTS public.media_files (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  file_name    text NOT NULL,
  file_path    text NOT NULL,
  file_url     text NOT NULL,
  file_type    text NOT NULL CHECK (file_type IN ('image', 'video', 'other')),
  mime_type    text NOT NULL,
  size_bytes   bigint NOT NULL DEFAULT 0,
  dimensions   jsonb,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_files_tenant ON public.media_files(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON public.media_files(tenant_id, file_type);

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read media files" ON public.media_files;
CREATE POLICY "Public read media files"
  ON public.media_files FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Tenant members manage media files" ON public.media_files;
CREATE POLICY "Tenant members manage media files"
  ON public.media_files FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_tenant_member(tenant_id, auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_tenant_member(tenant_id, auth.uid())
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;
GRANT SELECT, INSERT ON public.cms_page_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_files TO authenticated;
GRANT SELECT ON public.cms_pages TO anon;
GRANT SELECT ON public.media_files TO anon;
