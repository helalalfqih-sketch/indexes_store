import { describe, expect, it } from "vitest";
import {
  assertExecutableApproval,
  computePlanHash,
  parseExecutionLockResult,
} from "@/services/ai-agent/approval-contract";

describe("AI execution approval integration contract", () => {
  it("accepts a fully approved, unchanged plan", () => {
    const plan = { steps: [{ file: "src/a.ts", action: "update" }] };

    expect(() =>
      assertExecutableApproval({
        status: "approved",
        approvedBy: "11111111-1111-1111-1111-111111111111",
        approvedAt: "2026-07-29T12:00:00.000Z",
        approvedPlanHash: computePlanHash(plan),
        approvedRevision: 3,
        plan,
      }),
    ).not.toThrow();
  });

  it("parses the canonical atomic lock response", () => {
    expect(
      parseExecutionLockResult({
        success: true,
        task_id: "TASK-001",
        status: "executing",
        approved_plan_hash: "abc",
        approved_revision: 2,
      }),
    ).toEqual({
      success: true,
      task_id: "TASK-001",
      status: "executing",
      approved_plan_hash: "abc",
      approved_revision: 2,
      reason: undefined,
    });
  });

  it("preserves a deterministic lock-conflict reason", () => {
    expect(
      parseExecutionLockResult({
        success: false,
        reason: "EXECUTION_ALREADY_STARTED",
      }),
    ).toEqual({
      success: false,
      reason: "EXECUTION_ALREADY_STARTED",
      task_id: undefined,
      status: undefined,
      approved_plan_hash: undefined,
      approved_revision: undefined,
    });
  });
});
