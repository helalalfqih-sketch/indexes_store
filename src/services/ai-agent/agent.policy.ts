/**
 * Agent Policy — Execution Rules & Safety Guards
 *
 * Defines the behavioral constraints for the AI Engineering Agent:
 * - Which file paths are protected from modification
 * - Which DB tables are read-only
 * - Risk level calculation for plans
 * - Mode-based execution constraints
 */

import type { AgentMode } from "./agent.state";
import type { AgentPlanStep } from "./agent.events";

// ─────────────────────────────────────────────────
// Protected Paths (cannot be modified by agent)
// ─────────────────────────────────────────────────

export const PROTECTED_PATHS = [
  "src/integrations/supabase/client.ts",
  "src/integrations/supabase/client.server.ts",
  "src/integrations/supabase/auth-middleware.ts",
  "src/lib/saas/tenant-context.ts",
  ".env",
  ".env.local",
  ".env.production",
  ".env.staging",
  "node_modules",
  "supabase/config.toml",
  "package.json",
  "package-lock.json",
  "bun.lockb",
  "pnpm-lock.yaml",
  "smartcontentcreator-d49f2-6d78b68ea04a.json", // Service account keys
];

// ─────────────────────────────────────────────────
// Read-Only Database Tables
// ─────────────────────────────────────────────────

export const READ_ONLY_TABLES = [
  "auth.users",
  "auth.sessions",
  "storage.buckets",
  "storage.objects",
];

// ─────────────────────────────────────────────────
// Sensitive Tables (inspect schema only, no rows)
// ─────────────────────────────────────────────────

export const SENSITIVE_TABLES = [
  "ai_provider_configs", // contains encrypted API keys
  "tenants",
  "user_roles",
];

// ─────────────────────────────────────────────────
// Risk Level Calculator
// ─────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

export function calculateRiskLevel(plan: AgentPlanStep[], affectedFiles: string[]): RiskLevel {
  const mutatingSteps = plan.filter((s) => s.requiresApproval).length;
  const hasMigration = plan.some((s) => s.action === "run_migration");
  const hasProtectedFile = affectedFiles.some((f) => PROTECTED_PATHS.some((p) => f.includes(p)));
  const hasCriticalPath = affectedFiles.some(
    (f) =>
      f.includes("auth") ||
      f.includes("tenant") ||
      f.includes("supabase") ||
      f.includes("middleware"),
  );

  if (hasProtectedFile || hasCriticalPath) return "critical";
  if (hasMigration) return "high";
  if (mutatingSteps >= 3) return "medium";
  return "low";
}

// ─────────────────────────────────────────────────
// Mode-Based Execution Rules
// ─────────────────────────────────────────────────

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  requiresApproval: boolean;
}

/**
 * Decide if agent is allowed to proceed with a mutation step based on mode.
 */
export function evaluatePolicy(mode: AgentMode, step: AgentPlanStep): PolicyDecision {
  // Chat mode: only read steps allowed
  if (mode === "chat") {
    if (step.requiresApproval) {
      return {
        allowed: false,
        reason: "وضع المحادثة لا يسمح بتعديل الملفات. غير الوضع إلى Execute.",
        requiresApproval: false,
      };
    }
    return { allowed: true, requiresApproval: false };
  }

  // Plan mode: only read steps allowed (mutations generate plan but don't execute)
  if (mode === "plan") {
    if (step.requiresApproval) {
      return {
        allowed: false,
        reason: "وضع التخطيط يعرض الخطة فقط. غير الوضع إلى Execute للتنفيذ.",
        requiresApproval: false,
      };
    }
    return { allowed: true, requiresApproval: false };
  }

  // Execute mode: mutations require approval
  if (mode === "execute") {
    if (step.requiresApproval) {
      return { allowed: true, requiresApproval: true };
    }
    return { allowed: true, requiresApproval: false };
  }

  // Auto mode: mutations execute automatically within permissions (future)
  if (mode === "auto") {
    return { allowed: true, requiresApproval: false };
  }

  return { allowed: false, reason: "وضع غير معروف", requiresApproval: false };
}

/**
 * Check if a file path is protected from agent modification.
 */
export function isProtectedPath(filePath: string): boolean {
  return PROTECTED_PATHS.some((p) => filePath.endsWith(p) || filePath.includes(p));
}

/**
 * Check if a table is safe to inspect rows (not just schema).
 */
export function canInspectRows(tableName: string): boolean {
  return !SENSITIVE_TABLES.includes(tableName) && !READ_ONLY_TABLES.includes(tableName);
}

/**
 * Generate a human-readable risk label with emoji.
 */
export function riskLabel(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: "🟢 منخفض",
    medium: "🟡 متوسط",
    high: "🟠 مرتفع",
    critical: "🔴 حرج",
  };
  return map[level];
}
