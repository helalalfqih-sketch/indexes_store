-- =====================================================================
-- INDEXES AUTONOMOUS ENGINEERING CORE — SECURE RLS MIGRATION
-- Migration: 20260801000001_harden_remaining_true_policies.sql
-- Harden ai_provider_configs and ai_agent_plans by dropping `USING (true)` bypasses.
-- =====================================================================

-- 1. ai_provider_configs
DROP POLICY IF EXISTS "ai_provider_configs_read_all" ON public.ai_provider_configs;
DROP POLICY IF EXISTS "ai_provider_configs_write_authenticated" ON public.ai_provider_configs;

CREATE POLICY "ai_provider_configs_read_tenant_or_admin" ON public.ai_provider_configs
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "ai_provider_configs_write_tenant_or_admin" ON public.ai_provider_configs
  FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 2. ai_agent_plans
DROP POLICY IF EXISTS "Allow all access to ai_agent_plans" ON public.ai_agent_plans;

CREATE POLICY "Admins and tenant owners can access ai_agent_plans"
  ON public.ai_agent_plans FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );
