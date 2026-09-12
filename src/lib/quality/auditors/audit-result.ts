import type { AuditResult } from "../types";

type AbortedAuditIdentity = Pick<
  AuditResult,
  "auditId" | "name" | "category" | "source" | "measuredAt"
>;

export function createAbortedAuditResult(identity: AbortedAuditIdentity): AuditResult {
  return {
    ...identity,
    status: "NOT_MEASURED",
    executionState: "SKIPPED",
    score: 0,
    metrics: {},
    durationMs: 0,
  };
}
