/**
 * Runtime Incident & Log Auditor
 */
import { QualityAudit, AuditResult } from "../types";
import { fetchExecutionJournalLogs } from "@/services/ai-agent/journal.service";

export interface RuntimeIncident {
  incidentId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: "DEPLOYMENT" | "DATABASE" | "API" | "PERFORMANCE";
  rootCause: string;
  evidence: string;
  recommendation: string;
  confidence: number;
  occurrences: number;
}

export const RuntimeIncidentAuditor: QualityAudit = {
  id: "runtime-incident-audit",
  name: "Runtime Incident & Log Intelligence Audit",
  version: "1.0.0",
  category: "MEDIUM",
  timeoutMs: 15000,
  supportsParallel: true,
  environments: ["local", "ci", "production"],

  async run(signal?: AbortSignal): Promise<AuditResult> {
    const startTime = Date.now();
    const measuredAt = new Date().toISOString();

    if (signal?.aborted) {
      return {
        auditId: "runtime-incident-audit",
        name: "Runtime Incident & Log Intelligence Audit",
        status: "NOT_MEASURED",
        executionState: "SKIPPED",
        score: 0,
        category: "MEDIUM",
        source: "runtime",
        metrics: {},
        measuredAt,
        durationMs: 0,
      };
    }

    try {
      const logs = await fetchExecutionJournalLogs("default", 50);
      const failedLogs = logs.filter((l) => l.status === "FAILED");

      const incidents: RuntimeIncident[] = [];
      if (failedLogs.length > 0) {
        incidents.push({
          incidentId: `INC-${Date.now()}`,
          title: `Recorded ${failedLogs.length} failed execution attempts`,
          severity: "MEDIUM",
          category: "API",
          rootCause: failedLogs[0]?.output?.error?.message || "Execution verification error",
          evidence: `Failed action: ${failedLogs[0]?.action || "startExecution"}`,
          recommendation: "Re-run project structure verification and check DB table policies",
          confidence: 90,
          occurrences: failedLogs.length,
        });
      }

      const score = incidents.length === 0 ? 100 : Math.max(50, 100 - incidents.length * 15);
      const status = incidents.length === 0 ? "PASS" : "WARNING";

      return {
        auditId: "runtime-incident-audit",
        name: "Runtime Incident & Log Intelligence Audit",
        status,
        executionState: "COMPLETED",
        score,
        category: "MEDIUM",
        source: "runtime",
        commandOrQuery: "agent_execution_logs query",
        metrics: {
          totalLogsAnalyzed: logs.length,
          failedLogsCount: failedLogs.length,
          incidentsCount: incidents.length,
          incidents,
        },
        measuredAt,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        auditId: "runtime-incident-audit",
        name: "Runtime Incident & Log Intelligence Audit",
        status: "NOT_MEASURED",
        executionState: "COMPLETED",
        score: 0,
        category: "MEDIUM",
        source: "runtime",
        metrics: { envConfigured: false },
        error: {
          code: "INCIDENT_ENV_NOT_CONFIGURED",
          message: "Supabase DB connection not configured in runner",
        },
        measuredAt,
        durationMs: Date.now() - startTime,
      };
    }
  },
};
