/**
 * Quality API Server Functions for Dashboard & Control Center
 */
import { createServerFn } from "@tanstack/react-start";
import { runQualityAudit } from "./quality/engine";
import { loadLatestReport } from "./quality/history";
import { analyzeQualityTrends } from "./quality/trend-engine";
import { generateEvidenceRecommendations } from "./quality/ai-recommender";
import { correlateRuntimeIncidents } from "./quality/incident-correlation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getLatestQualityReportFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
  let report = loadLatestReport();
  if (!report) {
    const summary = await runQualityAudit({ environment: "local" });
    report = summary.report?.summary || null;
  }
  return report;
});

export const getQualityHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
  return analyzeQualityTrends(30);
});

export const getQualityIncidentsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
  let report = loadLatestReport();
  if (!report) {
    const summary = await runQualityAudit({ environment: "local" });
    report = summary.report?.summary || null;
  }

  const recommendations = report ? generateEvidenceRecommendations(report.results) : [];
  const incidents = report ? correlateRuntimeIncidents(report.results) : [];

  return {
    incidents,
    recommendations,
    lastVerifiedAt: report?.lastVerifiedAt || new Date().toISOString(),
  };
});

export const triggerQualityAuditFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
  const summary = await runQualityAudit({ environment: "local" });
  return summary.report;
});
