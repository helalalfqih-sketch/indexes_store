/**
 * Enterprise Modular Quality Engine — Configurable Thresholds & Weights
 */

export interface QualityPolicyConfig {
  thresholds: {
    typescript: { maxErrors: number };
    build: { minScore: number; maxBundleSizeKb: number };
    security: { allowHigh: boolean; allowCritical: boolean };
    database: { minScore: number };
    performance: { minScore: number };
  };
  weights: {
    security: number; // 25%
    performance: number; // 20%
    tests: number; // 20%
    build: number; // 10%
    typescript: number; // 10%
    database: number; // 10%
    codeQuality: number; // 5%
  };
}

export const DEFAULT_QUALITY_CONFIG: QualityPolicyConfig = {
  thresholds: {
    typescript: { maxErrors: 0 },
    build: { minScore: 100, maxBundleSizeKb: 2048 },
    security: { allowHigh: false, allowCritical: false },
    database: { minScore: 100 },
    performance: { minScore: 90 },
  },
  weights: {
    security: 25,
    performance: 20,
    tests: 20,
    build: 10,
    typescript: 10,
    database: 10,
    codeQuality: 5,
  },
};

export function loadQualityConfig(overrides?: Partial<QualityPolicyConfig>): QualityPolicyConfig {
  if (!overrides) return DEFAULT_QUALITY_CONFIG;
  return {
    thresholds: { ...DEFAULT_QUALITY_CONFIG.thresholds, ...overrides.thresholds },
    weights: { ...DEFAULT_QUALITY_CONFIG.weights, ...overrides.weights },
  };
}
