export interface GridProduct {
  product_id: string | null;
  price: number | null;
  brand: string | null;
  rating: number | null;
  section_source: string | null;
}

export function duplicateProductPlacement(products: GridProduct[]) {
  const locations = new Map<string, Set<string>>();
  for (const product of products) {
    if (!product.product_id || !product.section_source) continue;
    if (!locations.has(product.product_id)) locations.set(product.product_id, new Set());
    locations.get(product.product_id)!.add(product.section_source);
  }
  return [...locations]
    .filter(([, sections]) => sections.size > 1)
    .map(([product_id, sections]) => {
      const list = [...sections];
      return {
        duplicate: true as const,
        product_id,
        locations: list,
        severity:
          list.length === 2 && list.includes("offers") && list.includes("catalog")
            ? ("EXPECTED" as const)
            : ("WARNING" as const),
      };
    });
}

export type Validation = { status: "PASS" | "FAIL" | "BLOCKED"; violations: GridProduct[] };
export function validateGrid(
  products: GridProduct[],
  rule: {
    price?: "under-20k" | "20k-50k" | "over-50k";
    brand?: string | string[];
    rating?: number;
    sort?: "price-low" | "price-high";
  },
): Validation {
  if (!products.length) return { status: "BLOCKED", violations: [] };
  const missing = products.filter(
    (p) =>
      !p.product_id ||
      p.price === null ||
      (rule.brand && p.brand === null) ||
      (rule.rating && p.rating === null),
  );
  if (missing.length) return { status: "BLOCKED", violations: missing };
  const violations = products.filter((p, i) => {
    const price = p.price!;
    return (
      (rule.price === "under-20k" && price >= 20_000) ||
      (rule.price === "20k-50k" && (price < 20_000 || price > 50_000)) ||
      (rule.price === "over-50k" && price <= 50_000) ||
      (rule.brand !== undefined &&
        !(Array.isArray(rule.brand) ? rule.brand : [rule.brand]).some(
          (b) => b.toLowerCase() === p.brand?.trim().toLowerCase(),
        )) ||
      (rule.rating !== undefined && p.rating! < rule.rating) ||
      (i > 0 && rule.sort === "price-low" && products[i - 1].price! > price) ||
      (i > 0 && rule.sort === "price-high" && products[i - 1].price! < price)
    );
  });
  return { status: violations.length ? "FAIL" : "PASS", violations };
}
