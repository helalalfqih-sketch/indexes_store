/**
 * Phase 9.5 — Production Evidence Confidence Adapter Engine
 * Assigns confidence scores (HIGH/MEDIUM/LOW) based on source origin and live connection state
 */
import { EvidenceItem } from "../evidence-engine";

export type EvidenceSourceOrigin =
  "LOCAL" | "CI" | "VERCEL" | "SUPABASE" | "BROWSER" | "USER_SESSION";

export interface ProductionEvidenceItem extends EvidenceItem {
  origin: EvidenceSourceOrigin;
  confidenceScore: number;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  liveVerifiedAt: string;
}

export function adaptEvidenceToProductionSource(
  item: EvidenceItem,
  origin: EvidenceSourceOrigin,
  isConnected = true,
): ProductionEvidenceItem {
  let confidenceLevel: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
  let confidenceScore = 98;

  if (!isConnected) {
    confidenceLevel = "LOW";
    confidenceScore = 0;
  } else if (origin === "LOCAL") {
    confidenceLevel = "MEDIUM";
    confidenceScore = 75;
  }

  return {
    ...item,
    origin,
    confidenceScore,
    confidenceLevel,
    liveVerifiedAt: new Date().toISOString(),
  };
}
