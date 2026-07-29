/**
 * Phase 3 — Delta Engine
 * Calculates score deltas relative to previous run
 */
import { EnrichedAuditResult } from "./evidence-engine";
import { QualityReportSummary, loadLatestReport } from "./history";

export interface AuditDelta {
  auditId: string;
  previousScore: number;
  currentScore: number;
  deltaScore: number;
  symbol: "▲" | "▼" | "=";
  formattedDelta: string;
}

export interface OverallDelta {
  previousScore: number;
  currentScore: number;
  deltaScore: number;
  symbol: "▲" | "▼" | "=";
  formattedDelta: string;
  auditDeltas: Record<string, AuditDelta>;
}

export function calculateScoreDeltas(
  currentOverallScore: number,
  currentResults: EnrichedAuditResult[],
  previousReport?: QualityReportSummary | null,
): OverallDelta {
  const prev = previousReport || loadLatestReport();
  const prevOverall = prev?.overallScore ?? currentOverallScore;
  const overallDiff = currentOverallScore - prevOverall;

  const overallSymbol = overallDiff > 0 ? "▲" : overallDiff < 0 ? "▼" : "=";
  const overallFormatted =
    overallDiff > 0 ? `▲ +${overallDiff}` : overallDiff < 0 ? `▼ ${overallDiff}` : "= 0";

  const auditDeltas: Record<string, AuditDelta> = {};

  for (const current of currentResults) {
    const prevAudit = prev?.results?.find((r) => r.auditId === current.auditId);
    const prevScore = prevAudit?.score ?? current.score;
    const diff = current.score - prevScore;
    const symbol = diff > 0 ? "▲" : diff < 0 ? "▼" : "=";
    const formattedDelta = diff > 0 ? `▲ +${diff}` : diff < 0 ? `▼ ${diff}` : "= 0";

    auditDeltas[current.auditId] = {
      auditId: current.auditId,
      previousScore: prevScore,
      currentScore: current.score,
      deltaScore: diff,
      symbol,
      formattedDelta,
    };
  }

  return {
    previousScore: prevOverall,
    currentScore: currentOverallScore,
    deltaScore: overallDiff,
    symbol: overallSymbol,
    formattedDelta: overallFormatted,
    auditDeltas,
  };
}
