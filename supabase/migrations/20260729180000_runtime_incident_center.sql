BEGIN;

-- 1. runtime_incidents
CREATE TABLE IF NOT EXISTS public.runtime_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'HIGH',
  status TEXT NOT NULL DEFAULT 'DETECTED',
  source TEXT NOT NULL DEFAULT 'APPLICATION',
  environment TEXT NOT NULL DEFAULT 'production',
  route TEXT,
  operation TEXT,
  normalized_message TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  current_analysis_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT runtime_incidents_severity_check
    CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
  CONSTRAINT runtime_incidents_status_check
    CHECK (status IN (
      'DETECTED', 'GROUPING', 'ANALYZING', 'NEEDS_EVIDENCE', 
      'ROOT_CAUSE_IDENTIFIED', 'PLAN_READY', 'WAITING_APPROVAL', 
      'APPROVED', 'IN_PROGRESS', 'VERIFYING', 'RESOLVED', 'REGRESSED', 'IGNORED'
    ))
);

CREATE UNIQUE INDEX IF NOT EXISTS runtime_incidents_tenant_env_fp_uq 
  ON public.runtime_incidents (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), environment, fingerprint);

CREATE INDEX IF NOT EXISTS runtime_incidents_tenant_status_idx 
  ON public.runtime_incidents (tenant_id, status, last_seen_at DESC);

-- 2. runtime_incident_occurrences
CREATE TABLE IF NOT EXISTS public.runtime_incident_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.runtime_incidents(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  trace_id TEXT,
  request_id TEXT,
  deployment_id TEXT,
  branch TEXT,
  commit_sha TEXT,
  host TEXT,
  method TEXT,
  request_path TEXT,
  status_code INTEGER,
  message TEXT NOT NULL,
  sanitized_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS runtime_incident_occurrences_incident_idx 
  ON public.runtime_incident_occurrences (incident_id, occurred_at DESC);

-- 3. runtime_incident_events
CREATE TABLE IF NOT EXISTS public.runtime_incident_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.runtime_incidents(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. runtime_incident_analyses
CREATE TABLE IF NOT EXISTS public.runtime_incident_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.runtime_incidents(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL DEFAULT 1,
  root_cause TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  affected_files TEXT[] NOT NULL DEFAULT '{}',
  affected_tables TEXT[] NOT NULL DEFAULT '{}',
  affected_flows TEXT[] NOT NULL DEFAULT '{}',
  business_impact TEXT,
  assumptions TEXT[] NOT NULL DEFAULT '{}',
  missing_evidence TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. runtime_incident_plans
CREATE TABLE IF NOT EXISTS public.runtime_incident_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.runtime_incidents(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.runtime_incident_analyses(id),
  revision INTEGER NOT NULL DEFAULT 1,
  plan_hash TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  affected_files TEXT[] NOT NULL DEFAULT '{}',
  migrations TEXT[] NOT NULL DEFAULT '{}',
  required_tests TEXT[] NOT NULL DEFAULT '{}',
  risk_level TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT runtime_incident_plans_status_check
    CHECK (status IN ('DRAFT', 'WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTING', 'COMPLETED', 'FAILED'))
);

-- 6. runtime_incident_links
CREATE TABLE IF NOT EXISTS public.runtime_incident_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.runtime_incidents(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL, -- 'FILE', 'SERVER_FN', 'TABLE', 'ROUTE'
  target_value TEXT NOT NULL,
  link_confidence TEXT NOT NULL DEFAULT 'CONFIRMED_STATIC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. runtime_ingestion_cursors
CREATE TABLE IF NOT EXISTS public.runtime_ingestion_cursors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL UNIQUE,
  cursor_position TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. runtime_trace_spans
CREATE TABLE IF NOT EXISTS public.runtime_trace_spans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  parent_span_id TEXT,
  span_id TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  duration_ms NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  sanitized_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS runtime_trace_spans_trace_idx 
  ON public.runtime_trace_spans (trace_id);

-- Enable RLS & Security
ALTER TABLE public.runtime_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_incident_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_incident_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_incident_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_incident_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_incident_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_ingestion_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_trace_spans ENABLE ROW LEVEL SECURITY;

-- Revoke anon access
REVOKE ALL ON public.runtime_incidents FROM anon;
REVOKE ALL ON public.runtime_incident_occurrences FROM anon;
REVOKE ALL ON public.runtime_incident_events FROM anon;
REVOKE ALL ON public.runtime_incident_analyses FROM anon;
REVOKE ALL ON public.runtime_incident_plans FROM anon;
REVOKE ALL ON public.runtime_incident_links FROM anon;
REVOKE ALL ON public.runtime_ingestion_cursors FROM anon, authenticated;
REVOKE ALL ON public.runtime_trace_spans FROM anon;

-- Staff Read Policy for Tenant Incidents
CREATE POLICY runtime_incidents_tenant_staff_read ON public.runtime_incidents
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = runtime_incidents.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY runtime_incident_occurrences_tenant_staff_read ON public.runtime_incident_occurrences
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = runtime_incident_occurrences.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'manager', 'staff')
    )
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
