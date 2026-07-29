/**
 * Enterprise Modular Quality Engine — Type Definitions
 */

export type AuditStatus = "PASS" | "FAIL" | "WARNING" | "NOT_MEASURED";
export type ExecutionState = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
export type AuditCategory = "FAST" | "MEDIUM" | "HEAVY";
export type AuditEnvironment = "local" | "ci" | "production";
export type AuditSource =
  "typescript" | "vite" | "supabase" | "postgres" | "lighthouse" | "ci" | "runtime";

export interface AuditError {
  code: string;
  message: string;
  stack?: string;
}

export interface AuditResult {
  auditId: string;
  name: string;
  status: AuditStatus;
  executionState: ExecutionState;
  score: number; // 0 - 100
  category: AuditCategory;
  source: AuditSource;
  commandOrQuery?: string;
  metrics: Record<string, any>;
  error?: AuditError;
  measuredAt: string;
  durationMs: number;
}

export interface QualityAudit {
  id: string;
  name: string;
  version: string;
  category: AuditCategory;
  timeoutMs: number;
  supportsParallel: boolean;
  environments: AuditEnvironment[];
  run(signal?: AbortSignal): Promise<AuditResult>;
}

export interface QualityEngineInfo {
  name: string;
  version: string;
  schemaVersion: string;
  startedAt: string;
  environment: AuditEnvironment;
}

export interface EngineRunOptions {
  category?: AuditCategory;
  environment?: AuditEnvironment;
  signal?: AbortSignal;
}

export interface ManifestReport {
  engineInfo: QualityEngineInfo;
  executedAudits: string[];
  skippedAudits: { id: string; reason: string }[];
  commitHash?: string;
  branch?: string;
  completedAt: string;
  totalDurationMs: number;
}
