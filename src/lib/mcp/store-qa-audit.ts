import type { QaState } from "./store-qa-state";
import { duplicateProductPlacement, validateGrid } from "@/lib/qa/grid-validation";
import { STORE_BRANDS, RATING_OPTIONS } from "@/components/storefront/filter-options";
export type AuditStatus = "PASS" | "FAIL" | "BLOCKED" | "NOT_TESTED";
export const QA_MATRIX = [
  "page.render",
  "ui.stable_keys",
  "products.unique_placements",
  "products.prices",
  "products.grid",
  "commercial.claims",
  "filters.instrumented",
  "filters.validation",
  "sort.validation",
  "layout.horizontal_overflow",
  "journey.checkout",
  "accessibility.axe",
  "performance.field_vitals",
] as const;
export function auditState(state: QaState) {
  const visible = state.products.filter((p) => p.visible);
  const ids = visible.map((p) => p.product_id);
  const route = new URL(state.url).pathname;
  const catalog = visible.filter((p) =>
    ["catalog", "category_page"].includes(p.section_source || ""),
  );
  const placements = duplicateProductPlacement(visible);
  const placementKeys = visible.map((p) => `${p.product_id}@${p.section_source}`);
  const repeatedWithinSection = placementKeys.filter(
    (key, index) => placementKeys.indexOf(key) !== index,
  );
  const grid = catalog.length
    ? catalog
    : visible.filter((p) => p.section_source === "new_products");
  const activePrice = state.filters?.priceRange;
  const brands = Array.isArray(state.filters?.brand) ? (state.filters.brand as string[]) : [];
  const ratings = Array.isArray(state.filters?.rating) ? (state.filters.rating as string[]) : [];
  const sort = state.filters?.sort;
  const priceRule =
    activePrice === "under-20k" || activePrice === "20k-50k" || activePrice === "over-50k"
      ? activePrice
      : undefined;
  const selectedBrand =
    brands.length === 1 ? STORE_BRANDS.find((b) => b.id === brands[0]) : undefined;
  const ratingFloor = ratings.length
    ? Math.min(
        ...ratings.map((id) => RATING_OPTIONS.find((r) => r.id === id)?.minRating ?? Infinity),
      )
    : undefined;
  const priceValidation = priceRule ? validateGrid(grid, { price: priceRule }) : null;
  const brandValidation = selectedBrand
    ? validateGrid(grid, {
        brand: [selectedBrand.id, selectedBrand.name, ...selectedBrand.keywords],
      })
    : null;
  const ratingValidation = Number.isFinite(ratingFloor)
    ? validateGrid(grid, { rating: ratingFloor })
    : null;
  const activeFilterValidations = [priceValidation, brandValidation, ratingValidation].filter(
    (result) => result !== null,
  );
  const sortValidation =
    sort === "price-low" || sort === "price-high" ? validateGrid(grid, { sort }) : null;
  const critical =
    route === "/"
      ? [
          "header.cart",
          "header.search",
          "header.notifications",
          "header.wishlist",
          "header.account",
          ...(state.viewport.width >= 768 ? ["header.install_app"] : []),
          "filter.price",
          "filter.brand",
          "filter.rating",
          "filter.sort",
          ...(state.filters &&
          (state.filters.priceRange !== "all" ||
            brands.length > 0 ||
            ratings.length > 0 ||
            sort !== "default")
            ? ["filter.reset"]
            : []),
        ]
      : [];
  const missingKeys = critical.filter(
    (key) =>
      !state.elements.some(
        (el) => el.visible && el.element_key?.endsWith(`:${key}`) && el.key_selector,
      ),
  );
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
          : missingKeys.length === 0
            ? "PASS"
            : "FAIL",
      severity: "medium",
      evidence: { route, missing: missingKeys },
    },
    {
      id: "products.unique_placements",
      status: state.truncated
        ? "BLOCKED"
        : !ids.length
          ? "NOT_TESTED"
          : repeatedWithinSection.length
            ? "FAIL"
            : "PASS",
      severity: repeatedWithinSection.length
        ? "high"
        : placements.some((p) => p.severity === "WARNING")
          ? "warning"
          : "info",
      evidence: {
        loaded: ids.length,
        unique: new Set(ids).size,
        placements,
        repeatedWithinSection,
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
      id: "products.grid",
      status: state.truncated
        ? "BLOCKED"
        : route === "/" || route === "/offers" || route === "/search"
          ? !visible.length || visible.some((p) => !p.product_id || p.price === null)
            ? "FAIL"
            : "PASS"
          : visible.length
            ? "PASS"
            : "NOT_TESTED",
      severity: "high",
      evidence: {
        route,
        loaded: visible.length,
        missing: visible.filter((p) => !p.product_id || p.price === null).map((p) => p.product_id),
      },
    },
    {
      id: "commercial.claims",
      status: state.claims.some((claim) => !claim.source)
        ? "FAIL"
        : state.claims.some((claim) => !claim.verified)
          ? "BLOCKED"
          : "PASS",
      severity: "medium",
      evidence: state.claims,
    },
    {
      id: "filters.instrumented",
      status: state.filters ? "PASS" : "NOT_TESTED",
      severity: "medium",
      evidence: state.filters,
    },
    {
      id: "filters.validation",
      status: !state.filters
        ? "NOT_TESTED"
        : !activeFilterValidations.length
          ? "NOT_TESTED"
          : !grid.length
            ? "BLOCKED"
            : activeFilterValidations.some((v) => v.status === "FAIL")
              ? "FAIL"
              : activeFilterValidations.some((v) => v.status === "BLOCKED")
                ? "BLOCKED"
                : "PASS",
      severity: "high",
      evidence: {
        activePrice,
        brands,
        ratings,
        priceValidation,
        brandValidation,
        ratingValidation,
        loaded: grid.length,
      },
    },
    {
      id: "sort.validation",
      status: !sortValidation ? "NOT_TESTED" : sortValidation.status,
      severity: "high",
      evidence: { sort, result: sortValidation, prices: grid.map((p) => p.price) },
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
