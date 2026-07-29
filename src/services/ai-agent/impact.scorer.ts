/**
 * Impact Scorer Service — Phase 7.5 ⚖️
 *
 * Evaluates risk score, database involvement, auth/security impact, and overall risk level
 * for proposed engineering changes.
 */

import { findImpactAnalysis } from "./code-intelligence.service";

export interface ImpactScore {
  affectedFilesCount: number;
  hasDatabaseChange: boolean;
  hasSecurityImpact: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number; // 0 - 100
  reasons: string[];
}

/**
 * Compute Impact Score for target files and proposed modifications
 */
export async function calculateImpactScore(targetFiles: string[]): Promise<ImpactScore> {
  const analysis = await findImpactAnalysis(targetFiles);
  const reasons: string[] = [];
  let score = 10; // Base score

  const affectedFilesCount = targetFiles.length;
  score += affectedFilesCount * 5;

  const hasDatabaseChange = analysis.affectedDatabaseTables.length > 0;
  if (hasDatabaseChange) {
    score += 25;
    reasons.push(
      `تغييرات مرتقبة على جداول قواعد البيانات: ${analysis.affectedDatabaseTables.join(", ")}`,
    );
  }

  // Security check: Auth, RBAC, Policy, Migrations
  const hasSecurityImpact = targetFiles.some(
    (f) =>
      f.includes("rbac") ||
      f.includes("auth") ||
      f.includes("policy") ||
      f.includes("supabase/migrations") ||
      f.includes("admin-shell"),
  );

  if (hasSecurityImpact) {
    score += 35;
    reasons.push("تأثير مباشر على طبقة الأمان، الصلاحيات RBAC أو حماية الإدارة.");
  }

  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  if (score >= 70) {
    riskLevel = "critical";
  } else if (score >= 45) {
    riskLevel = "high";
  } else if (score >= 25) {
    riskLevel = "medium";
  }

  return {
    affectedFilesCount,
    hasDatabaseChange,
    hasSecurityImpact,
    riskLevel,
    riskScore: Math.min(score, 100),
    reasons,
  };
}
