/**
 * Phase 8.1 — Approval Manager
 * Manages human approval requests for engineering tasks and patches
 */
import { EngineeringTask } from "./task-orchestrator";
import { QualityRole, assertQualityPermission } from "../security/rbac";

export interface ApprovalDecision {
  taskId: string;
  approved: boolean;
  approvedByRole: QualityRole;
  notes?: string;
  decidedAt: string;
}

export function requestHumanApproval(
  task: EngineeringTask,
  role: QualityRole,
  approve: boolean,
  notes?: string,
): ApprovalDecision {
  const canApprove = assertQualityPermission(role, "canExecutePatches");
  if (!canApprove) {
    throw new Error(
      `Permission Denied: Role '${role}' is not authorized to approve task execution.`,
    );
  }

  return {
    taskId: task.taskId,
    approved: approve,
    approvedByRole: role,
    notes: notes || (approve ? "Approved by human engineer" : "Rejected during review"),
    decidedAt: new Date().toISOString(),
  };
}
