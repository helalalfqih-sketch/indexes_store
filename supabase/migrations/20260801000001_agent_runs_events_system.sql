-- ============================================================================
-- Migration: agent_runs_events_system
-- Description: Creates durable run/event/artifact/checkpoint tables for the
--              NOQTA AI Developer Gen 2 autonomous agentic workspace.
--
-- Tables created:
--   - agent_runs          : one row per user-initiated agent task run
--   - agent_events        : ordered event stream per run
--   - agent_artifacts     : stored outputs (plan, diff, build, PR, etc.)
--   - agent_file_changes  : per-file diffs and before/after content
--   - agent_checkpoints   : full workspace snapshots before/after execution
--
-- Requirements:
--   - Idempotent (uses IF NOT EXISTS)
--   - Complete RLS policies with tenant isolation
--   - Indexes on hot query paths
--   - Foreign keys with CASCADE DELETE
--   - created_at / updated_at auto-handled
--
-- Rollback Instructions:
--   DROP TABLE IF EXISTS agent_checkpoints CASCADE;
--   DROP TABLE IF EXISTS agent_file_changes CASCADE;
--   DROP TABLE IF EXISTS agent_artifacts CASCADE;
--   DROP TABLE IF EXISTS agent_events CASCADE;
--   DROP TABLE IF EXISTS agent_runs CASCADE;
--
-- Validation:
--   Run on staging first. Verify row counts and RLS by connecting as
--   a non-service-role user and attempting cross-tenant queries.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. agent_runs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID        REFERENCES public.ai_agent_sessions(id) ON DELETE CASCADE,
  tenant_id      UUID        NOT NULL,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         TEXT        NOT NULL DEFAULT 'queued'
                             CHECK (status IN ('queued','running','waiting_approval','success','failed','cancelled')),
  prompt         TEXT,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  cancelled_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching active runs per session
CREATE INDEX IF NOT EXISTS idx_agent_runs_session_id  ON public.agent_runs (session_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_tenant_id   ON public.agent_runs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status      ON public.agent_runs (status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at  ON public.agent_runs (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_agent_runs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_agent_runs_updated_at ON public.agent_runs;
CREATE TRIGGER trg_agent_runs_updated_at
  BEFORE UPDATE ON public.agent_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_agent_runs_updated_at();

-- RLS
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "agent_runs_tenant_select"
  ON public.agent_runs FOR SELECT
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY IF NOT EXISTS "agent_runs_tenant_insert"
  ON public.agent_runs FOR INSERT
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY IF NOT EXISTS "agent_runs_tenant_update"
  ON public.agent_runs FOR UPDATE
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY IF NOT EXISTS "agent_runs_tenant_delete"
  ON public.agent_runs FOR DELETE
  USING (tenant_id = public.get_tenant_id());

-- Service role bypass
CREATE POLICY IF NOT EXISTS "agent_runs_service_role_all"
  ON public.agent_runs FOR ALL
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. agent_events
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       UUID        NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  sequence     INT         NOT NULL,
  event_type   TEXT        NOT NULL,
  state        TEXT        NOT NULL DEFAULT 'running'
                           CHECK (state IN ('queued','running','waiting_approval','success','failed','cancelled')),
  title        TEXT,
  payload      JSONB       NOT NULL DEFAULT '{}',
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms  INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate events per run sequence
  UNIQUE (run_id, sequence)
);

-- Indexes for Supabase Realtime + ordered polling
CREATE INDEX IF NOT EXISTS idx_agent_events_run_id    ON public.agent_events (run_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_sequence  ON public.agent_events (run_id, sequence ASC);
CREATE INDEX IF NOT EXISTS idx_agent_events_type      ON public.agent_events (event_type);

-- RLS — join through agent_runs for tenant isolation
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "agent_events_tenant_select"
  ON public.agent_events FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs WHERE tenant_id = public.get_tenant_id()
    )
  );

CREATE POLICY IF NOT EXISTS "agent_events_tenant_insert"
  ON public.agent_events FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs WHERE tenant_id = public.get_tenant_id()
    )
  );

CREATE POLICY IF NOT EXISTS "agent_events_service_role_all"
  ON public.agent_events FOR ALL
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. agent_artifacts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_artifacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        UUID        NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  artifact_type TEXT        NOT NULL
                            CHECK (artifact_type IN (
                              'plan','file_list','diff','build_output','test_output',
                              'screenshot','preview_url','deployment_url','commit',
                              'pull_request','checkpoint'
                            )),
  title         TEXT,
  content       TEXT,
  metadata      JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_artifacts_run_id ON public.agent_artifacts (run_id);
CREATE INDEX IF NOT EXISTS idx_agent_artifacts_type   ON public.agent_artifacts (artifact_type);

ALTER TABLE public.agent_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "agent_artifacts_tenant_select"
  ON public.agent_artifacts FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs WHERE tenant_id = public.get_tenant_id()
    )
  );

CREATE POLICY IF NOT EXISTS "agent_artifacts_tenant_insert"
  ON public.agent_artifacts FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs WHERE tenant_id = public.get_tenant_id()
    )
  );

CREATE POLICY IF NOT EXISTS "agent_artifacts_service_role_all"
  ON public.agent_artifacts FOR ALL
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. agent_file_changes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_file_changes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         UUID        NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  file_path      TEXT        NOT NULL,
  change_type    TEXT        NOT NULL DEFAULT 'modify'
                             CHECK (change_type IN ('create','modify','delete')),
  diff           TEXT,
  before_content TEXT,
  after_content  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_file_changes_run_id    ON public.agent_file_changes (run_id);
CREATE INDEX IF NOT EXISTS idx_agent_file_changes_file_path ON public.agent_file_changes (file_path);

ALTER TABLE public.agent_file_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "agent_file_changes_tenant_select"
  ON public.agent_file_changes FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs WHERE tenant_id = public.get_tenant_id()
    )
  );

CREATE POLICY IF NOT EXISTS "agent_file_changes_tenant_insert"
  ON public.agent_file_changes FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs WHERE tenant_id = public.get_tenant_id()
    )
  );

CREATE POLICY IF NOT EXISTS "agent_file_changes_service_role_all"
  ON public.agent_file_changes FOR ALL
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. agent_checkpoints
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_checkpoints (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           UUID        NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  checkpoint_type  TEXT        NOT NULL
                               CHECK (checkpoint_type IN (
                                 'pre_execution','post_backend','post_frontend',
                                 'post_build','pre_deployment','manual'
                               )),
  -- JSONB map of { filePath: fileContent } for all snapshotted files
  files            JSONB       NOT NULL DEFAULT '{}',
  metadata         JSONB       NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_run_id ON public.agent_checkpoints (run_id);
CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_type   ON public.agent_checkpoints (checkpoint_type);

ALTER TABLE public.agent_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "agent_checkpoints_tenant_select"
  ON public.agent_checkpoints FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs WHERE tenant_id = public.get_tenant_id()
    )
  );

CREATE POLICY IF NOT EXISTS "agent_checkpoints_tenant_insert"
  ON public.agent_checkpoints FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs WHERE tenant_id = public.get_tenant_id()
    )
  );

CREATE POLICY IF NOT EXISTS "agent_checkpoints_service_role_all"
  ON public.agent_checkpoints FOR ALL
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────────────────────
-- Enable Supabase Realtime on agent_events for live streaming
-- ─────────────────────────────────────────────────────────────────────────────
-- Note: Run this in the Supabase dashboard → Database → Replication
-- or via the CLI: supabase db push after enabling realtime on this table.
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_events;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_runs;
