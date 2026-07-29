import { createHash } from "node:crypto";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function normalizeJson(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Plan contains a non-finite number");
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeJson);
  }

  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const item = source[key];
      if (typeof item !== "undefined") {
        normalized[key] = normalizeJson(item);
      }
    }
    return normalized;
  }

  throw new Error(`Unsupported plan value type: ${typeof value}`);
}

export function canonicalizePlan(plan: unknown): string {
  return JSON.stringify(normalizeJson(plan));
}

export function computePlanHash(plan: unknown): string {
  return createHash("sha256").update(canonicalizePlan(plan)).digest("hex");
}

export interface ApprovalSnapshot {
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  approvedPlanHash: string | null;
  approvedRevision: number | null;
  plan: unknown;
}

export function assertExecutableApproval(snapshot: ApprovalSnapshot): void {
  if (snapshot.status.toLowerCase() !== "approved") {
    throw new Error(`PLAN_NOT_APPROVED: task status is '${snapshot.status}'`);
  }

  if (
    !snapshot.approvedBy ||
    !snapshot.approvedAt ||
    !snapshot.approvedPlanHash ||
    !snapshot.approvedRevision ||
    snapshot.approvedRevision < 1
  ) {
    throw new Error("PLAN_NOT_APPROVED: approval metadata is incomplete");
  }

  const currentHash = computePlanHash(snapshot.plan);
  if (currentHash !== snapshot.approvedPlanHash) {
    throw new Error("PLAN_CHANGED_REAPPROVAL_REQUIRED: plan hash mismatch");
  }
}

export interface ExecutionLockResult {
  success: boolean;
  reason?: string;
  task_id?: string;
  status?: string;
  approved_plan_hash?: string;
  approved_revision?: number;
}

export function parseExecutionLockResult(value: unknown): ExecutionLockResult {
  if (!value || typeof value !== "object") {
    throw new Error("EXECUTION_LOCK_FAILED: invalid RPC response");
  }

  const record = value as Record<string, unknown>;
  if (typeof record.success !== "boolean") {
    throw new Error("EXECUTION_LOCK_FAILED: RPC response has no success flag");
  }

  return {
    success: record.success,
    reason: typeof record.reason === "string" ? record.reason : undefined,
    task_id: typeof record.task_id === "string" ? record.task_id : undefined,
    status: typeof record.status === "string" ? record.status : undefined,
    approved_plan_hash:
      typeof record.approved_plan_hash === "string" ? record.approved_plan_hash : undefined,
    approved_revision:
      typeof record.approved_revision === "number" ? record.approved_revision : undefined,
  };
}
