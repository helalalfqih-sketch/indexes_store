BEGIN;

SELECT plan(14);

SELECT ok(
  to_regclass('public.webhook_events') IS NOT NULL,
  'webhook_events exists after a clean reset'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.webhook_events'::regclass),
  'webhook_events has RLS enabled'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.webhook_events'::regclass
      AND conname = 'webhook_events_provider_external_tenant_key'
  ),
  'webhook_events has the canonical idempotency constraint'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.webhook_events', 'INSERT'),
  'anon cannot insert webhook events'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.webhook_events', 'INSERT'),
  'authenticated users cannot insert webhook events directly'
);

SELECT ok(
  has_table_privilege('authenticated', 'public.webhook_events', 'SELECT'),
  'authenticated users can read through tenant-scoped RLS'
);

SELECT ok(
  to_regprocedure(
    'public.acquire_ai_task_execution_lock(text,uuid,text,integer)'
  ) IS NOT NULL,
  'canonical four-argument execution lock exists'
);

SELECT ok(
  to_regprocedure(
    'public.acquire_ai_task_execution_lock(text,uuid,integer)'
  ) IS NULL,
  'legacy three-argument execution lock is removed'
);

SELECT ok(
  has_function_privilege(
    'authenticated',
    'public.acquire_ai_task_execution_lock(text,uuid,text,integer)',
    'EXECUTE'
  ),
  'authenticated callers can invoke the guarded lock RPC'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.acquire_ai_task_execution_lock(text,uuid,text,integer)',
    'EXECUTE'
  ),
  'anon cannot invoke the execution lock RPC'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ai_agent_tasks'
      AND column_name = 'approved_at'
  ),
  'ai_agent_tasks has canonical approved_at'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ai_agent_tasks'
      AND column_name = 'approved_plan_hash'
  ),
  'ai_agent_tasks has approved_plan_hash'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ai_agent_tasks'
      AND column_name = 'approved_revision'
  ),
  'ai_agent_tasks has approved_revision'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.ai_agent_tasks'::regclass
      AND tgname = 'trg_enforce_ai_task_approval_state'
      AND NOT tgisinternal
  ),
  'AI task state-machine trigger is installed'
);

SELECT * FROM finish();

ROLLBACK;
