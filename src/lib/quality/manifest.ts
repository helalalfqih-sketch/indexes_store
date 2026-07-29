/**
 * Enterprise Modular Quality Engine — Execution Manifest Generator
 */
import { ManifestReport, QualityEngineInfo, AuditResult } from "./types";

export function createExecutionManifest(
  engineInfo: QualityEngineInfo,
  results: AuditResult[],
  skippedAudits: { id: string; reason: string }[],
  totalDurationMs: number,
): ManifestReport {
  return {
    engineInfo,
    executedAudits: results.map((r) => r.auditId),
    skippedAudits,
    commitHash: process.env.GIT_COMMIT_HASH || "local-dev",
    branch: process.env.GIT_BRANCH || "main",
    completedAt: new Date().toISOString(),
    totalDurationMs,
  };
}
