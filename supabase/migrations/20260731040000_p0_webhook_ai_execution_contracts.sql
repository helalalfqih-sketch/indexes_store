-- P0: canonical webhook event schema and AI execution trust contract
-- This migration is additive/corrective and intentionally does not modify prior migrations.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Canonical webhook_events schema
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  external_event_id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'received',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS external_event_id text,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'received',
  ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS received_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.webhook_events
SET provider = COALESCE(NULLIF(provider, ''), 'whatsapp'),
    status = COALESCE(NULLIF(status, ''), 'received'),
    attempts = COALESCE(attempts, 0),
    metadata = COALESCE(metadata, '{}'::jsonb),
    received_at = COALESCE(received_at, created_at, now()),
    created_at = COALESCE(created_at, received_at, now()),
    updated_at = COALESCE(updated_at, created_at, received_at, now());

-- Orphaned legacy rows cannot be isolated safely and are removed fail-closed.
DELETE FROM public.webhook_events
WHERE tenant_id IS NULL
   OR external_event_id IS NULL
   OR btrim(external_event_id) = '';

ALTER TABLE public.webhook_events
  ALTER COLUMN provider SET NOT NULL,
  ALTER COLUMN external_event_id SET NOT NULL,
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN attempts SET NOT NULL,
  ALTER COLUMN metadata SET NOT NULL,
  ALTER COLUMN received_at SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.webhook_events'::regclass
      AND conname = 'webhook_events_provider_external_tenant_key'
  ) THEN
    ALTER TABLE public.webhook_events
      ADD CONSTRAINT webhook_events_provider_external_tenant_key
      UNIQUE (provider, external_event_id, tenant_id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant_received
  ON public.webhook_events (tenant_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON public.webhook_events (status, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_webhook_event_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_webhook_events_updated_at ON public.webhook_events;
CREATE TRIGGER trg_webhook_events_updated_at
BEFORE UPDATE ON public.webhook_events
FOR EACH ROW
EXECUTE FUNCTION public.set_webhook_event_updated_at();

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Webhook events service role full access" ON public.webhook_events;
DROP POLICY IF EXISTS "Webhook events tenant read" ON public.webhook_events;

CREATE POLICY "Webhook events service role full access"
ON public.webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Webhook events tenant read"
ON public.webhook_events
FOR SELECT
TO authenticated
USING (
  public.has_tenant_permission(
    tenant_id,
    auth.uid(),
    'viewer'::public.tenant_role
  )
);

REVOKE ALL ON public.webhook_events FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.webhook_events FROM authenticated;
GRANT SELECT ON public.webhook_events TO authenticated;
GRANT ALL ON public.webhook_events TO service_role;

REVOKE ALL ON FUNCTION public.set_webhook_event_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_webhook_event_updated_at() TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Canonical AI approval metadata
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.ai_agent_tasks') IS NULL THEN
    RAISE EXCEPTION 'P0 migration requires public.ai_agent_tasks';
  END IF;
  IF to_regclass('public.ai_agent_plans') IS NULL THEN
    RAISE EXCEPTION 'P0 migration requires public.ai_agent_plans';
  END IF;
END;
$$;

ALTER TABLE public.ai_agent_tasks
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS user_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_plan_hash text,
  ADD COLUMN IF NOT EXISTS approved_revision integer,
  ADD COLUMN IF NOT EXISTS approval_comment text,
  ADD COLUMN IF NOT EXISTS approval_source text,
  ADD COLUMN IF NOT EXISTS execution_started_at timestamptz;

ALTER TABLE public.ai_agent_plans
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_plan_hash text,
  ADD COLUMN IF NOT EXISTS approved_revision integer,
  ADD COLUMN IF NOT EXISTS plan_hash text,
  ADD COLUMN IF NOT EXISTS revision integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.ai_agent_tasks
SET approved_at = COALESCE(approved_at, user_approved_at),
    user_approved_at = COALESCE(user_approved_at, approved_at),
    approved_plan_hash = COALESCE(
      NULLIF(approved_plan_hash, ''),
      encode(digest(COALESCE(plan::text, '[]'), 'sha256'), 'hex')
    ),
    approved_revision = COALESCE(approved_revision, 1)
WHERE lower(status) = 'approved';

UPDATE public.ai_agent_plans
SET approved_plan_hash = COALESCE(NULLIF(approved_plan_hash, ''), NULLIF(plan_hash, '')),
    plan_hash = COALESCE(NULLIF(plan_hash, ''), NULLIF(approved_plan_hash, '')),
    approved_revision = COALESCE(approved_revision, revision, 1),
    revision = COALESCE(revision, approved_revision, 1),
    updated_at = COALESCE(updated_at, now())
WHERE lower(status) = 'approved';

CREATE OR REPLACE FUNCTION public.enforce_ai_task_approval_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.status := lower(NEW.status);

  IF NEW.status = 'approved' THEN
    NEW.approved_at := COALESCE(NEW.approved_at, NEW.user_approved_at, now());
    NEW.user_approved_at := NEW.approved_at;
    NEW.approved_by := COALESCE(NEW.approved_by, auth.uid());
    NEW.approved_plan_hash := COALESCE(
      NULLIF(NEW.approved_plan_hash, ''),
      encode(digest(COALESCE(NEW.plan::text, '[]'), 'sha256'), 'hex')
    );
    NEW.approved_revision := COALESCE(NEW.approved_revision, 1);

    IF NEW.approved_by IS NULL
       OR NEW.approved_at IS NULL
       OR NEW.approved_plan_hash IS NULL
       OR NEW.approved_revision IS NULL
       OR NEW.approved_revision < 1 THEN
      RAISE EXCEPTION 'AI task approval metadata is incomplete';
    END IF;
  END IF;

  IF NEW.status = 'executing' THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION 'AI task can enter executing only from approved state';
    END IF;

    IF NEW.approved_by IS NULL
       OR NEW.approved_at IS NULL
       OR NEW.approved_plan_hash IS NULL
       OR NEW.approved_revision IS NULL THEN
      RAISE EXCEPTION 'AI task execution requires complete approval metadata';
    END IF;

    NEW.execution_started_at := COALESCE(NEW.execution_started_at, now());
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_ai_task_approval_state ON public.ai_agent_tasks;
CREATE TRIGGER trg_enforce_ai_task_approval_state
BEFORE INSERT OR UPDATE OF status, approved_by, approved_at, user_approved_at,
  approved_plan_hash, approved_revision, plan
ON public.ai_agent_tasks
FOR EACH ROW
EXECUTE FUNCTION public.enforce_ai_task_approval_state();

REVOKE ALL ON FUNCTION public.enforce_ai_task_approval_state() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_ai_task_approval_state() TO service_role;

-- ---------------------------------------------------------------------------
-- 3. One atomic execution-lock RPC contract
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.acquire_ai_task_execution_lock(text, uuid, integer);
DROP FUNCTION IF EXISTS public.acquire_ai_task_execution_lock(text, uuid, text, integer);

CREATE OR REPLACE FUNCTION public.acquire_ai_task_execution_lock(
  p_task_id text,
  p_tenant_id uuid,
  p_expected_hash text,
  p_expected_revision integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task public.ai_agent_tasks%ROWTYPE;
  v_current_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT (
    public.has_tenant_permission(
      p_tenant_id,
      auth.uid(),
      'owner'::public.tenant_role
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.ai_agent_tasks
  SET status = 'executing',
      execution_started_at = COALESCE(execution_started_at, now()),
      updated_at = now()
  WHERE id = p_task_id
    AND tenant_id = p_tenant_id
    AND lower(status) = 'approved'
    AND approved_by IS NOT NULL
    AND approved_at IS NOT NULL
    AND approved_plan_hash = p_expected_hash
    AND approved_revision = p_expected_revision
  RETURNING * INTO v_task;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'task_id', v_task.id,
      'status', v_task.status,
      'approved_plan_hash', v_task.approved_plan_hash,
      'approved_revision', v_task.approved_revision
    );
  END IF;

  SELECT lower(status)
  INTO v_current_status
  FROM public.ai_agent_tasks
  WHERE id = p_task_id
    AND tenant_id = p_tenant_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'TASK_NOT_FOUND');
  END IF;

  IF v_current_status IN ('executing', 'completed', 'failed') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'EXECUTION_ALREADY_STARTED');
  END IF;

  RETURN jsonb_build_object(
    'success', false,
    'reason', 'PLAN_CHANGED_REAPPROVAL_REQUIRED',
    'status', v_current_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_ai_task_execution_lock(text, uuid, text, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acquire_ai_task_execution_lock(text, uuid, text, integer)
  TO authenticated, service_role;

COMMIT;
