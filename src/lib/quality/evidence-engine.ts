/**
 * Phase 3 — Evidence Engine
 * Structured Evidence Enricher & NOT_MEASURED Reason Handler
 */
import { AuditResult } from "./types";

export interface EvidenceItem {
  type: "command" | "exit_code" | "metric" | "log_snippet" | "env_check" | "query";
  key?: string;
  value: any;
  description?: string;
}

export interface EnrichedAuditResult extends AuditResult {
  evidence: EvidenceItem[];
  notMeasuredReason?: string;
  verificationConfidence?: "HIGH" | "MEDIUM" | "LOW";
}

export function enrichAuditResultWithEvidence(result: AuditResult): EnrichedAuditResult {
  const evidence: EvidenceItem[] = [];
  let notMeasuredReason: string | undefined;

  if (result.status === "NOT_MEASURED") {
    notMeasuredReason =
      result.error?.message ||
      "Required database connection or environment variables not configured in runner";
  }

  if (result.commandOrQuery) {
    evidence.push({
      type: "command",
      value: result.commandOrQuery,
      description: "Execution command or query string",
    });
  }

  if (result.metrics) {
    for (const [key, value] of Object.entries(result.metrics)) {
      evidence.push({
        type: "metric",
        key,
        value,
      });
    }
  }

  const verificationConfidence: "HIGH" | "MEDIUM" | "LOW" =
    result.status === "PASS" ? "HIGH" : result.status === "WARNING" ? "MEDIUM" : "LOW";

  return {
    ...result,
    evidence,
    notMeasuredReason,
    verificationConfidence,
  };
}
