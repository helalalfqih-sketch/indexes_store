/**
 * Phase 5 — AI Root Cause Engine
 * Generates evidence-backed Root Cause Reports
 */
import { PersistedRuntimeEvent } from "../runtime/persistence";
import { AnalyzedCodeContext } from "./code-context-analyzer";

export interface RootCauseReport {
  incidentId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  empiricalFact: string;
  potentialCause: string;
  confidenceGrade: "HIGH" | "MEDIUM" | "LOW";
  evidenceTrace: string[];
  targetFile: string;
  componentName?: string;
  recommendedAction: string;
}

export function generateRootCauseReport(
  event: PersistedRuntimeEvent,
  context: AnalyzedCodeContext,
): RootCauseReport {
  const empiricalFact = `Runtime event '${event.type}' triggered ${event.occurrences} times on route '${event.route || "unknown"}'.`;
  let potentialCause =
    "Asset missing from deployment build output chunk or missing API schema property.";

  if (event.type === "NETWORK_404") {
    potentialCause = `Static asset bundle or route chunk chunk missing from build deployment: ${event.message}`;
  } else if (event.type === "CONSOLE_ERROR") {
    potentialCause = `Property access mismatch or unhandled exception in ${context.componentName}`;
  }

  return {
    incidentId: event.id,
    title: `Root Cause Analysis: ${event.type} in ${context.componentName || context.targetFile}`,
    severity: event.severity,
    empiricalFact,
    potentialCause,
    confidenceGrade: event.occurrences > 5 ? "HIGH" : "MEDIUM",
    evidenceTrace: [
      event.evidence,
      `First Seen: ${event.firstSeenAt}`,
      `Occurrences: ${event.occurrences}`,
    ],
    targetFile: context.targetFile,
    componentName: context.componentName,
    recommendedAction:
      "Review code diff proposal, verify asset chunk path, and request approval for patch execution.",
  };
}
