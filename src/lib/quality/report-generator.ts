/**
 * Phase 3 — Report Generator & Weighted Scoring Engine
 */
import { AuditResult, QualityEngineInfo, ManifestReport } from "./types";
import { DEFAULT_QUALITY_CONFIG, loadQualityConfig } from "./config";
import { enrichAuditResultWithEvidence, EnrichedAuditResult } from "./evidence-engine";
import { QualityReportSummary, saveQualityReports, loadLatestReport } from "./history";
import { calculateScoreDeltas, OverallDelta } from "./delta-engine";

export interface CompleteQualityReport {
  summary: QualityReportSummary;
  deltas: OverallDelta;
}

export function generateQualityReport(
  engineInfo: QualityEngineInfo,
  rawResults: AuditResult[],
  manifest: ManifestReport,
): CompleteQualityReport {
  const previousReport = loadLatestReport();
  const config = loadQualityConfig();

  // Enrich results with structured evidence
  const results: EnrichedAuditResult[] = rawResults.map((r) => enrichAuditResultWithEvidence(r));

  // Count statuses
  const passedCount = results.filter((r) => r.status === "PASS").length;
  const failedCount = results.filter((r) => r.status === "FAIL").length;
  const warningCount = results.filter((r) => r.status === "WARNING").length;
  const notMeasuredCount = results.filter((r) => r.status === "NOT_MEASURED").length;

  // Compute weighted score across categories
  let totalWeight = 0;
  let weightedScoreSum = 0;

  for (const r of results) {
    if (r.status === "NOT_MEASURED") continue;
    let weight = 10;
    if (r.auditId.includes("security") || r.auditId.includes("database"))
      weight = config.weights.security;
    else if (r.auditId.includes("typescript")) weight = config.weights.typescript;
    else if (r.auditId.includes("build")) weight = config.weights.build;

    weightedScoreSum += r.score * weight;
    totalWeight += weight;
  }

  const overallScore = totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 100;
  const grade: "A+" | "A" | "B" | "C" | "F" =
    overallScore >= 95
      ? "A+"
      : overallScore >= 85
        ? "A"
        : overallScore >= 70
          ? "B"
          : overallScore >= 50
            ? "C"
            : "F";

  const overallStatus: "PASS" | "FAIL" | "WARNING" =
    failedCount > 0 ? "FAIL" : warningCount > 0 ? "WARNING" : "PASS";

  const summary: QualityReportSummary = {
    schemaVersion: "1.0.0",
    overallScore,
    grade,
    status: overallStatus,
    environment: engineInfo.environment,
    lastVerifiedAt: new Date().toISOString(),
    auditsCount: results.length,
    passedCount,
    failedCount,
    warningCount,
    notMeasuredCount,
    results,
    manifest,
  };

  const deltas = calculateScoreDeltas(overallScore, results, previousReport);

  // Persist reports to disk
  saveQualityReports(summary);

  return {
    summary,
    deltas,
  };
}
