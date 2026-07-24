-- Fix: Grant full permissions to media_files, cms_pages, cms_page_versions, tenant_audit_logs
-- Run this in Supabase Dashboard → SQL Editor

-- MEDIA FILES
GRANT ALL ON public.media_files TO postgres;
GRANT ALL ON public.media_files TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_files TO authenticated;
GRANT SELECT ON public.media_files TO anon;

-- Drop restrictive policies and replace with open ones for single-tenant store
DROP POLICY IF EXISTS "Tenant members manage media files" ON public.media_files;
DROP POLICY IF EXISTS "Public read media files" ON public.media_files;

CREATE POLICY "Allow all authenticated users to manage media files"
  ON public.media_files FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to read media files"
  ON public.media_files FOR SELECT TO anon
  USING (true);

-- CMS PAGES
GRANT ALL ON public.cms_pages TO postgres;
GRANT ALL ON public.cms_pages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;
GRANT SELECT ON public.cms_pages TO anon;

DROP POLICY IF EXISTS "Tenant members manage cms pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Public read published cms pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Tenant members read all cms pages" ON public.cms_pages;

CREATE POLICY "Allow all authenticated users to manage cms pages"
  ON public.cms_pages FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to read published cms pages"
  ON public.cms_pages FOR SELECT TO anon
  USING (is_published = true);

-- CMS PAGE VERSIONS
GRANT ALL ON public.cms_page_versions TO postgres;
GRANT ALL ON public.cms_page_versions TO service_role;
GRANT SELECT, INSERT ON public.cms_page_versions TO authenticated;

DROP POLICY IF EXISTS "Tenant members manage cms page versions" ON public.cms_page_versions;
DROP POLICY IF EXISTS "Tenant members view cms page versions" ON public.cms_page_versions;
DROP POLICY IF EXISTS "Tenant members insert cms page versions" ON public.cms_page_versions;

CREATE POLICY "Allow authenticated users to manage cms page versions"
  ON public.cms_page_versions FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- TENANT AUDIT LOGS
GRANT ALL ON public.tenant_audit_logs TO postgres;
GRANT ALL ON public.tenant_audit_logs TO service_role;
GRANT SELECT, INSERT ON public.tenant_audit_logs TO authenticated;

DROP POLICY IF EXISTS "Tenant admins read audit logs" ON public.tenant_audit_logs;
DROP POLICY IF EXISTS "System insert audit logs" ON public.tenant_audit_logs;

CREATE POLICY "Allow authenticated users to manage audit logs"
  ON public.tenant_audit_logs FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
