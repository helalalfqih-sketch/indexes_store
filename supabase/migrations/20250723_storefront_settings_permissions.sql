-- Migration: Grant table permissions for storefront_settings table
-- Resolves "permission denied for table storefront_settings" when anon/authenticated roles try to query/update it.

-- 1. Grant SELECT to all users (public storefront visitors and admins)
GRANT SELECT ON public.storefront_settings TO anon, authenticated;

-- 2. Grant write/modification access to authenticated role (specific policies like admin checks are handled by RLS)
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.storefront_settings TO authenticated;

-- 3. Grant full privileges to postgres and service_role
GRANT ALL ON public.storefront_settings TO postgres, service_role;
