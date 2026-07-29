/**
 * Phase 7.1 — Pre-Release Deployment Safety Gate
 * Validates build readiness before production release
 */

export interface DeploymentGateCheck {
  allowedToDeploy: boolean;
  qualityScore: number;
  minScoreThreshold: number;
  criticalIssuesCount: number;
  blockingReasons: string[];
  checkedAt: string;
}

export function evaluateDeploymentGate(
  qualityScore: number,
  criticalIssuesCount: number,
): DeploymentGateCheck {
  const minScoreThreshold = 90;
  const blockingReasons: string[] = [];

  if (qualityScore < minScoreThreshold) {
    blockingReasons.push(
      `Quality Score (${qualityScore}/100) is below minimum threshold (${minScoreThreshold}/100).`,
    );
  }

  if (criticalIssuesCount > 0) {
    blockingReasons.push(
      `Found ${criticalIssuesCount} unresolved P0 CRITICAL incidents blocking release.`,
    );
  }

  const allowedToDeploy = blockingReasons.length === 0;

  return {
    allowedToDeploy,
    qualityScore,
    minScoreThreshold,
    criticalIssuesCount,
    blockingReasons,
    checkedAt: new Date().toISOString(),
  };
}
