import { describe, expect, it } from "vitest";
import {
  assertExecutableApproval,
  computePlanHash,
  parseExecutionLockResult,
} from "@/services/ai-agent/approval-contract";

describe("P0 fail-closed security contract", () => {
  it("rejects execution before explicit approval", () => {
    const plan = { steps: [] };
    expect(() =>
      assertExecutableApproval({
        status: "waiting_approval",
        approvedBy: null,
        approvedAt: null,
        approvedPlanHash: computePlanHash(plan),
        approvedRevision: 1,
        plan,
      }),
    ).toThrow("PLAN_NOT_APPROVED");
  });

  it("rejects incomplete approval metadata", () => {
    const plan = { steps: [] };
    expect(() =>
      assertExecutableApproval({
        status: "approved",
        approvedBy: null,
        approvedAt: "2026-07-29T12:00:00.000Z",
        approvedPlanHash: computePlanHash(plan),
        approvedRevision: 1,
        plan,
      }),
    ).toThrow("metadata is incomplete");
  });

  it("rejects a plan modified after approval", () => {
    const approvedPlan = { steps: [{ action: "update" }] };
    const modifiedPlan = { steps: [{ action: "delete" }] };

    expect(() =>
      assertExecutableApproval({
        status: "approved",
        approvedBy: "11111111-1111-1111-1111-111111111111",
        approvedAt: "2026-07-29T12:00:00.000Z",
        approvedPlanHash: computePlanHash(approvedPlan),
        approvedRevision: 1,
        plan: modifiedPlan,
      }),
    ).toThrow("PLAN_CHANGED_REAPPROVAL_REQUIRED");
  });

  it("rejects malformed execution-lock responses", () => {
    expect(() => parseExecutionLockResult(null)).toThrow("invalid RPC response");
    expect(() => parseExecutionLockResult({ reason: "missing success" })).toThrow(
      "no success flag",
    );
  });
});
