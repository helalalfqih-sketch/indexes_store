import { describe, it, expect } from "vitest";
import { auditState, summarizeAudit } from "@/lib/mcp/store-qa-audit";
import { diffQaState, type QaState } from "@/lib/mcp/store-qa-state";
const base: QaState = {
  url: "https://indexes-store.vercel.app/",
  viewport: { width: 390, height: 844 },
  scroll: { x: 0, y: 0 },
  elements: [],
  products: [],
  filters: null,
  open_overlays: [],
  loaded_product_count: 0,
  truncated: false,
};
describe("V3 audit evidence", () => {
  it("never gives empty product grids or missing instrumentation an inferred pass", () => {
    const result = auditState(base);
    expect(result.checks.find((c) => c.id === "products.prices")?.status).toBe("NOT_TESTED");
    expect(result.checks.find((c) => c.id === "filters.instrumented")?.status).toBe("NOT_TESTED");
    expect(result.checks.find((c) => c.id === "journey.checkout")?.status).toBe("NOT_TESTED");
  });
  it("counts blocked and untested checks in the stated denominator", () => {
    expect(
      summarizeAudit([
        { status: "PASS" },
        { status: "FAIL" },
        { status: "BLOCKED" },
        { status: "NOT_TESTED" },
      ]),
    ).toEqual({ PASS: 1, FAIL: 1, BLOCKED: 1, NOT_TESTED: 1, total: 4, pass_percent_of_total: 25 });
  });
  it("reports truncation as blocked instead of claiming exhaustive uniqueness", () => {
    expect(
      auditState({ ...base, truncated: true }).checks.find(
        (c) => c.id === "products.unique_placements",
      )?.status,
    ).toBe("BLOCKED");
  });
  it("does not invent element changes in identical snapshots", () => {
    expect(diffQaState(base, base)).toMatchObject({
      appeared: [],
      disappeared: [],
      selected_changes: [],
    });
  });
});
