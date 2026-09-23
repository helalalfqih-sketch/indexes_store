import type { Page } from "playwright-core";

/** Serialized DOM evidence only: no framework internals, cookies or input values. */
export async function readQaState(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
    };
    const safeHref = (value: string | null) => {
      if (!value) return null;
      try {
        const u = new URL(value, location.href);
        return u.origin + u.pathname;
      } catch {
        return null;
      }
    };
    const all = Array.from(
      document.querySelectorAll<HTMLElement>(
        "section,article,[role],a,button,input,select,textarea,[data-element-key],[data-testid]",
      ),
    );
    const candidates = all.map((el) => {
      const section = el.closest("section[id],[data-qa-section]");
      const scope = section?.getAttribute("data-qa-section") || section?.id || "page";
      const card = el.closest("[data-storefront-product-id]");
      const local = el.getAttribute("data-element-key") || el.getAttribute("data-testid") || el.id;
      return local
        ? `${scope}:${card?.getAttribute("data-storefront-product-id") || "ui"}:${local}`
        : null;
    });
    const counts = new Map<string, number>();
    candidates.forEach((k) => {
      if (k) counts.set(k, (counts.get(k) || 0) + 1);
    });
    const elements = all.slice(0, 1000).map((el, i) => {
      const r = el.getBoundingClientRect();
      const key = candidates[i];
      return {
        element_key: key && counts.get(key) === 1 ? key : null,
        key_status: !key ? "MISSING" : counts.get(key) === 1 ? "STABLE" : "AMBIGUOUS",
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role"),
        text: ["INPUT", "TEXTAREA"].includes(el.tagName)
          ? null
          : (el.innerText || "").trim().slice(0, 200),
        aria_label: el.getAttribute("aria-label"),
        test_id: el.getAttribute("data-testid"),
        visible: visible(el),
        disabled: el.matches(":disabled,[aria-disabled=true]"),
        selected:
          el.getAttribute("aria-selected") ??
          el.getAttribute("aria-pressed") ??
          el.getAttribute("data-state"),
        expanded: el.getAttribute("aria-expanded"),
        href: safeHref(el.getAttribute("href")),
        box: { x: r.x, y: r.y, width: r.width, height: r.height },
      };
    });
    const numeric = (el: HTMLElement, key: string) => {
      const raw = el.getAttribute(key);
      return raw !== null && raw !== "" && Number.isFinite(Number(raw)) ? Number(raw) : null;
    };
    const products = Array.from(
      document.querySelectorAll<HTMLElement>("[data-storefront-product-id]"),
    )
      .slice(0, 500)
      .map((el, index) => ({
        product_id: el.getAttribute("data-storefront-product-id"),
        section:
          el.closest("[data-qa-section],section[id]")?.getAttribute("data-qa-section") ||
          el.closest("section[id]")?.id ||
          null,
        name: el.getAttribute("data-product-name"),
        price: numeric(el, "data-price-yer"),
        previous_price: numeric(el, "data-previous-price-yer"),
        currency: "YER",
        brand: el.getAttribute("data-product-brand"),
        rating: numeric(el, "data-product-rating"),
        stock: numeric(el, "data-product-stock"),
        category: el.getAttribute("data-product-category"),
        image: safeHref(el.querySelector("img")?.getAttribute("src") ?? null),
        order: index,
        visible: visible(el),
        evidence: "rendered-card-attributes", // stock is not authoritative inventory
      }));
    const filter = document.querySelector<HTMLElement>("[data-qa-filter-state]");
    let filters: Record<string, unknown> | null = null;
    if (filter) {
      try {
        const raw = JSON.parse(filter.getAttribute("data-qa-filter-state") || "{}");
        filters = Object.fromEntries(
          ["category", "minPrice", "maxPrice", "brand", "rating", "sort", "query"].map((k) => [
            k,
            raw[k] ?? null,
          ]),
        );
      } catch {
        filters = null;
      }
    }
    return {
      url: location.origin + location.pathname,
      viewport: { width: innerWidth, height: innerHeight },
      scroll: { x: scrollX, y: scrollY },
      elements,
      products,
      filters,
      open_overlays: elements.filter(
        (e) => e.visible && ["dialog", "alertdialog"].includes(e.role || ""),
      ),
      loaded_product_count: products.filter((p) => p.visible).length,
      truncated:
        all.length > 1000 || document.querySelectorAll("[data-storefront-product-id]").length > 500,
    };
  });
}
export type QaState = Awaited<ReturnType<typeof readQaState>>;
export function diffQaState(before: QaState, after: QaState) {
  const keys = (state: QaState) =>
    new Set(state.elements.filter((e) => e.visible && e.element_key).map((e) => e.element_key));
  const a = keys(before),
    b = keys(after);
  return {
    appeared: [...b].filter((k) => !a.has(k)),
    disappeared: [...a].filter((k) => !b.has(k)),
    selected_changes: after.elements.filter(
      (e) =>
        e.element_key &&
        before.elements.some(
          (p) =>
            p.element_key === e.element_key &&
            (p.selected !== e.selected || p.expanded !== e.expanded),
        ),
    ),
    note: "Differences cover uniquely instrumented elements only; unkeyed elements remain in snapshots.",
  };
}
