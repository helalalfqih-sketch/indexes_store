import { describe, expect, it } from "vitest";
import {
  canonicalizePlan,
  computePlanHash,
} from "@/services/ai-agent/approval-contract";

describe("AI approval plan canonicalization", () => {
  it("produces the same hash for semantically identical object key order", () => {
    const left = { objective: "fix", steps: [{ id: 1, file: "a.ts" }], risk: "low" };
    const right = { risk: "low", steps: [{ file: "a.ts", id: 1 }], objective: "fix" };

    expect(canonicalizePlan(left)).toBe(canonicalizePlan(right));
    expect(computePlanHash(left)).toBe(computePlanHash(right));
  });

  it("changes the hash when the approved plan changes", () => {
    const approved = { steps: [{ file: "a.ts", action: "update" }] };
    const changed = { steps: [{ file: "a.ts", action: "delete" }] };

    expect(computePlanHash(approved)).not.toBe(computePlanHash(changed));
  });

  it("rejects unsupported or non-finite plan values", () => {
    expect(() => canonicalizePlan({ score: Number.POSITIVE_INFINITY })).toThrow(
      "non-finite",
    );
    expect(() => canonicalizePlan({ callback: () => undefined })).toThrow(
      "Unsupported plan value type",
    );
  });
});
