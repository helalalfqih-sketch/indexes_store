import { withPage } from "./store-browser-inspection.server";
import { readQaState } from "./store-qa-state";
import { auditState, QA_MATRIX, summarizeAudit } from "./store-qa-audit";
export async function inspectQa(
  url: string,
  device: "desktop" | "mobile",
  mode: "tree" | "products" | "filters" | "audit",
) {
  const viewport =
    device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
  try {
    return await withPage(url, viewport, async (page) => {
      const state = await readQaState(page);
      if (mode === "tree") return { device, ...state };
      if (mode === "products")
        return {
          device,
          products: state.products,
          truncated: state.truncated,
          scope: "loaded cards only; attributes are UI evidence, not authoritative inventory",
        };
      if (mode === "filters")
        return {
          device,
          filters: state.filters,
          status: state.filters ? "OBSERVED" : "NOT_TESTED",
          loaded_product_count: state.loaded_product_count,
        };
      return { device, url: state.url, ...auditState(state) };
    });
  } catch (error) {
    if (mode !== "audit") throw error;
    const code =
      error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
        ? error.message
        : "INSPECTION_UNAVAILABLE";
    const checks = QA_MATRIX.map((id) => ({
      id,
      status: "BLOCKED" as const,
      severity: "unknown",
      evidence: { code },
    }));
    return { device, matrix_version: "3.0-foundation", checks, summary: summarizeAudit(checks) };
  }
}

/** Bounded release matrix. A time-budget cutoff is evidence of BLOCKED, never PASS. */
export async function fullStoreAudit(url: string) {
  const start = Date.now();
  const base = new URL(url);
  const pages = [];
  for (const path of ["/", "/search", "/offers", "/account", "/cart"]) {
    for (const device of ["desktop", "mobile"] as const) {
      if (Date.now() - start > 40_000) {
        const checks = QA_MATRIX.map((id) => ({
          id,
          status: "BLOCKED" as const,
          severity: "unknown",
          evidence: { code: "AUDIT_TIME_BUDGET" },
        }));
        pages.push({ path, device, checks });
      } else {
        const report = await inspectQa(new URL(path, base.origin).toString(), device, "audit");
        pages.push({ path, device, checks: "checks" in report ? report.checks : [] });
      }
    }
  }
  const checks = pages.flatMap((p) => p.checks);
  return {
    matrix_version: "3.0-foundation",
    pages,
    summary: summarizeAudit(checks),
    elapsed_ms: Date.now() - start,
    exclusions: [
      {
        page: "product",
        status: "NOT_TESTED",
        reason: "A real product route must be supplied in a subsequent journey.",
      },
    ],
    scope:
      "Five routes × two viewports. Currently loaded cards only. Unsupported assertions stay NOT_TESTED; no store-wide quality claim.",
  };
}
