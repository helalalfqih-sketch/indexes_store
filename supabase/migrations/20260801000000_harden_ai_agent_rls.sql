-- =====================================================================
-- INDEXES AUTONOMOUS ENGINEERING CORE — SECURE RLS MIGRATION
-- Migration: 20260801000000_harden_ai_agent_rls.sql
-- Harden AI Agent tables by dropping `USING (true)` bypasses and enforcing tenant_id / admin checks.
-- =====================================================================

-- 1. Drop ALL permissive policies from the agent tables
DROP POLICY IF EXISTS "Allow all full access to ai_agent_tasks" ON public.ai_agent_tasks;
DROP POLICY IF EXISTS "Allow all access to ai_agent_tasks" ON public.ai_agent_tasks;

DROP POLICY IF EXISTS "Allow all full access to ai_agent_sessions" ON public.ai_agent_sessions;
DROP POLICY IF EXISTS "Allow all access to ai_agent_sessions" ON public.ai_agent_sessions;

DROP POLICY IF EXISTS "Allow all full access to agent_execution_logs" ON public.agent_execution_logs;
DROP POLICY IF EXISTS "Allow all access to agent_execution_logs" ON public.agent_execution_logs;

DROP POLICY IF EXISTS "Allow all full access to agent_execution_steps" ON public.agent_execution_steps;
DROP POLICY IF EXISTS "Allow all access to agent_execution_steps" ON public.agent_execution_steps;

DROP POLICY IF EXISTS "Allow all full access to agent_execution_events" ON public.agent_execution_events;
DROP POLICY IF EXISTS "Allow all access to agent_execution_events" ON public.agent_execution_events;

DROP POLICY IF EXISTS "Allow all access to agent_execution_artifacts" ON public.agent_execution_artifacts;

DROP POLICY IF EXISTS "Allow all access to agent_tool_calls" ON public.agent_tool_calls;

-- 2. Create secure tenant-isolated or admin-only policies
-- Since these are internal AI developer workspace tools, we only allow access to authenticated users who are either admins, or owners of the tenant_id.

-- For ai_agent_sessions
CREATE POLICY "Admins and tenant owners can access ai_agent_sessions"
  ON public.ai_agent_sessions FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- For ai_agent_tasks
CREATE POLICY "Admins and tenant owners can access ai_agent_tasks"
  ON public.ai_agent_tasks FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- For agent_execution_logs
CREATE POLICY "Admins and tenant owners can access agent_execution_logs"
  ON public.agent_execution_logs FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- For agent_execution_steps (Assuming task_id links to ai_agent_tasks, but we can't easily join in RLS without performance issues. We will rely on application-level task ID checks, but restrict to authenticated/admin)
-- Wait, we added tenant_id to agent_execution_events and artifacts in 20260731_ai_agent_execution_complete.sql
-- But agent_execution_steps does not have tenant_id. So we restrict it to admin role.
CREATE POLICY "Admins can access agent_execution_steps"
  ON public.agent_execution_steps FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- For agent_execution_events
CREATE POLICY "Admins and tenant owners can access agent_execution_events"
  ON public.agent_execution_events FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- For agent_execution_artifacts
CREATE POLICY "Admins and tenant owners can access agent_execution_artifacts"
  ON public.agent_execution_artifacts FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id() 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- For agent_tool_calls (No tenant_id, session_id links to sessions)
CREATE POLICY "Admins can access agent_tool_calls"
  ON public.agent_tool_calls FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
