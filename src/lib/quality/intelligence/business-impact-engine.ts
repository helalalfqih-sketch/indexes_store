/**
 * Phase 7.1 — Business Impact Engine
 * Evaluates business priority (P0/P1/P2) and revenue risk for incidents
 */

export interface BusinessImpactAssessment {
  incidentId: string;
  priorityLevel: "P0_CRITICAL" | "P1_HIGH" | "P2_MEDIUM" | "P3_LOW";
  blocksRevenue: boolean;
  affectedUserCount: number;
  estimatedRevenueRiskUSD: number;
  reason: string;
}

export function evaluateBusinessImpact(
  incidentId: string,
  routePath: string,
  affectedUserCount: number,
): BusinessImpactAssessment {
  const isRevenuePath = routePath.includes("checkout") || routePath.includes("payment");

  if (isRevenuePath) {
    return {
      incidentId,
      priorityLevel: "P0_CRITICAL",
      blocksRevenue: true,
      affectedUserCount,
      estimatedRevenueRiskUSD: affectedUserCount * 45,
      reason: "Blocks revenue generation and order checkout completion.",
    };
  }

  if (routePath.includes("product")) {
    return {
      incidentId,
      priorityLevel: "P1_HIGH",
      blocksRevenue: false,
      affectedUserCount,
      estimatedRevenueRiskUSD: affectedUserCount * 12,
      reason: "Reduces product conversion rates on storefront.",
    };
  }

  return {
    incidentId,
    priorityLevel: "P3_LOW",
    blocksRevenue: false,
    affectedUserCount,
    estimatedRevenueRiskUSD: 0,
    reason: "Internal administrative warning with minimal customer impact.",
  };
}
