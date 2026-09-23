import type { QaState } from "./store-qa-state";
export type AuditStatus = "PASS" | "FAIL" | "BLOCKED" | "NOT_TESTED";
export const QA_MATRIX = [
  "page.render",
  "ui.stable_keys",
  "products.unique_placements",
  "products.prices",
  "filters.instrumented",
  "layout.horizontal_overflow",
  "journey.checkout",
  "accessibility.axe",
  "performance.field_vitals",
] as const;
export function auditState(state: QaState) {
  const visible = state.products.filter((p) => p.visible);
  const ids = visible.map((p) => p.product_id);
  const checks: Array<{ id: string; status: AuditStatus; severity: string; evidence: unknown }> = [
    {
      id: "page.render",
      status: state.elements.length ? "PASS" : "FAIL",
      severity: "high",
      evidence: { elements: state.elements.length },
    },
    {
      id: "ui.stable_keys",
      status: !state.elements.length
        ? "NOT_TESTED"
        : state.truncated
          ? "BLOCKED"
          : state.elements.filter((e) => e.visible).every((e) => e.element_key)
            ? "PASS"
            : "FAIL",
      severity: "medium",
      evidence: state.elements
        .filter((e) => e.visible && !e.element_key)
        .map((e) => ({ tag: e.tag, text: e.text, key_status: e.key_status })),
    },
    {
      id: "products.unique_placements",
      status: state.truncated
        ? "BLOCKED"
        : !ids.length
          ? "NOT_TESTED"
          : new Set(ids).size === ids.length
            ? "PASS"
            : "FAIL",
      severity: "medium",
      evidence: {
        loaded: ids.length,
        unique: new Set(ids).size,
        scope: "currently loaded visible cards",
      },
    },
    {
      id: "products.prices",
      status: !visible.length
        ? "NOT_TESTED"
        : visible.some((p) => p.price === null)
          ? "BLOCKED"
          : visible.every((p) => p.price! > 0)
            ? "PASS"
            : "FAIL",
      severity: "high",
      evidence: visible.map((p) => ({ product_id: p.product_id, price: p.price })),
    },
    {
      id: "filters.instrumented",
      status: state.filters ? "PASS" : "NOT_TESTED",
      severity: "medium",
      evidence: state.filters,
    },
    ...[
      "layout.horizontal_overflow",
      "journey.checkout",
      "accessibility.axe",
      "performance.field_vitals",
    ].map((id) => ({
      id,
      status: "NOT_TESTED" as const,
      severity: "info",
      evidence: "Not implemented in this V3 foundation; no inferred pass.",
    })),
  ];
  return {
    matrix_version: "3.0-foundation",
    checks,
    summary: summarizeAudit(checks),
    scope: "one page and viewport; loaded DOM only",
  };
}
export function summarizeAudit(checks: Array<{ status: AuditStatus }>) {
  const counts = { PASS: 0, FAIL: 0, BLOCKED: 0, NOT_TESTED: 0 };
  checks.forEach((c) => counts[c.status]++);
  return {
    ...counts,
    total: checks.length,
    pass_percent_of_total: checks.length ? (100 * counts.PASS) / checks.length : null,
  };
}
