/**
 * Phase 3 — AI Recommendation Engine
 * Evidence-Backed Recommendation Engine
 */
import { EnrichedAuditResult } from "./evidence-engine";

export interface EvidenceBackedRecommendation {
  auditId: string;
  auditName: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  fact: string;
  potentialCause: string;
  recommendation: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  requiresUserApproval: boolean;
}

export function generateEvidenceRecommendations(
  results: EnrichedAuditResult[],
): EvidenceBackedRecommendation[] {
  const recommendations: EvidenceBackedRecommendation[] = [];

  for (const r of results) {
    if (r.status === "PASS") continue;

    if (r.status === "NOT_MEASURED") {
      recommendations.push({
        auditId: r.auditId,
        auditName: r.name,
        priority: "LOW",
        fact: `Audit '${r.name}' returned NOT_MEASURED status.`,
        potentialCause:
          r.notMeasuredReason || "Environment variables or runtime DB connectivity not configured",
        recommendation:
          "Configure runtime environment variables or verify database connection credentials.",
        confidence: "HIGH",
        requiresUserApproval: false,
      });
      continue;
    }

    if (r.status === "FAIL" || r.status === "WARNING") {
      recommendations.push({
        auditId: r.auditId,
        auditName: r.name,
        priority: r.status === "FAIL" ? "HIGH" : "MEDIUM",
        fact: `Audit '${r.name}' failed with score ${r.score}/100.`,
        potentialCause: r.error?.message || "Policy threshold breached or failed metrics detected",
        recommendation: `Run targeted verification for ${r.name} and review affected code files.`,
        confidence: r.verificationConfidence || "MEDIUM",
        requiresUserApproval: true,
      });
    }
  }

  return recommendations;
}
