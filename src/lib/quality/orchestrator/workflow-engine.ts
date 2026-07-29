/**
 * Phase 10.2 — 10-State Execution Machine
 * Orchestrates engineering task state transitions cleanly
 */

export type ExecutionLifecycleState =
  | "DETECTED"
  | "ANALYZING"
  | "PLANNING"
  | "WAITING_APPROVAL"
  | "APPROVED"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "ROLLED_BACK";

export interface ExecutionTaskStateRecord {
  taskId: string;
  currentState: ExecutionLifecycleState;
  updatedAt: string;
}

const allowedLifecycleTransitions: Record<ExecutionLifecycleState, ExecutionLifecycleState[]> = {
  DETECTED: ["ANALYZING"],
  ANALYZING: ["PLANNING"],
  PLANNING: ["WAITING_APPROVAL"],
  WAITING_APPROVAL: ["APPROVED", "FAILED"],
  APPROVED: ["EXECUTING"],
  EXECUTING: ["VERIFYING", "FAILED"],
  VERIFYING: ["COMPLETED", "ROLLED_BACK"],
  COMPLETED: [],
  FAILED: ["PLANNING", "DETECTED"],
  ROLLED_BACK: ["PLANNING", "DETECTED"],
};

export function transitionExecutionState(
  currentState: ExecutionLifecycleState,
  nextState: ExecutionLifecycleState,
): ExecutionLifecycleState {
  const allowed = allowedLifecycleTransitions[currentState] || [];
  if (!allowed.includes(nextState)) {
    throw new Error(
      `Invalid state transition: Cannot transition from ${currentState} to ${nextState}`,
    );
  }
  return nextState;
}
