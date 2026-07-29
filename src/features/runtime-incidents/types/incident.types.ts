export type IncidentSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type IncidentStatus =
  | "DETECTED"
  | "GROUPING"
  | "ANALYZING"
  | "NEEDS_EVIDENCE"
  | "ROOT_CAUSE_IDENTIFIED"
  | "PLAN_READY"
  | "WAITING_APPROVAL"
  | "APPROVED"
  | "IN_PROGRESS"
  | "VERIFYING"
  | "RESOLVED"
  | "REGRESSED"
  | "IGNORED";

export type IncidentSource =
  | "APPLICATION"
  | "VERCEL_LOGS"
  | "SERVER_FUNCTION"
  | "BROWSER_ERROR"
  | "POSTGREST"
  | "WHATSAPP_WEBHOOK"
  | "AI_PROVIDER";

export interface IncidentRecord {
  id: string;
  tenant_id: string | null;
  fingerprint: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;
  environment: string;
  route: string | null;
  operation: string | null;
  normalized_message: string;
  first_seen_at: string;
  last_seen_at: string;
  occurrence_count: number;
  current_analysis_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentOccurrenceRecord {
  id: string;
  incident_id: string;
  tenant_id: string | null;
  trace_id: string | null;
  request_id: string | null;
  deployment_id: string | null;
  branch: string | null;
  commit_sha: string | null;
  host: string | null;
  method: string | null;
  request_path: string | null;
  status_code: number | null;
  message: string;
  sanitized_evidence: Record<string, any>;
  occurred_at: string;
}

export interface IncidentIngestionPayload {
  tenantId?: string | null;
  environment?: string;
  source?: IncidentSource;
  route?: string;
  operation?: string;
  method?: string;
  statusCode?: number;
  message: string;
  stack?: string;
  traceId?: string;
  requestId?: string;
  deploymentId?: string;
  evidence?: Record<string, any>;
}

export interface IncidentStats {
  openCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lastSyncTime: string;
  ingestionStatus: "ACTIVE" | "IDLE" | "ERROR";
}
