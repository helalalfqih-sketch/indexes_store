/**
 * Shopify-native checkout input validation. Never accept a client price,
 * inventory count, total override, discount amount or tenant ID as authority.
 */
export type NativeOrderInput = {
  idempotencyKey: string;
  items: Array<{ productRef: { source: "shopify"; id: string }; quantity: number }>;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  couponCode: string;
  paymentProvider: "cod";
  turnstileToken: string;
};

const VARIANT = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED = new Set([
  "idempotencyKey",
  "items",
  "customerName",
  "customerPhone",
  "customerAddress",
  "notes",
  "couponCode",
  "paymentProvider",
  "turnstileToken",
]);

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("INVALID_CHECKOUT");
  }
  return value as Record<string, unknown>;
}

function field(value: unknown, minimum: number, maximum: number): string {
  if (typeof value !== "string") throw new Error("INVALID_CHECKOUT");
  const trimmed = value.trim();
  if (trimmed.length < minimum || trimmed.length > maximum) {
    throw new Error("INVALID_CHECKOUT");
  }
  return trimmed;
}

export function parseNativeOrder(value: unknown): NativeOrderInput {
  const raw = record(value);
  if (Object.keys(raw).some((key) => !ALLOWED.has(key))) {
    throw new Error("INVALID_CHECKOUT");
  }
  if (!UUID.test(String(raw.idempotencyKey ?? ""))) {
    throw new Error("INVALID_CHECKOUT");
  }
  if (!Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > 100) {
    throw new Error("INVALID_CHECKOUT");
  }
  const ids = new Set<string>();
  const items = raw.items.map((item) => {
    const row = record(item);
    const ref = record(row.productRef);
    if (
      Object.keys(row).some((key) => !["productRef", "quantity"].includes(key)) ||
      ref.source !== "shopify" ||
      typeof ref.id !== "string" ||
      !VARIANT.test(ref.id) ||
      ids.has(ref.id) ||
      !Number.isInteger(row.quantity) ||
      (row.quantity as number) < 1 ||
      (row.quantity as number) > 999
    ) {
      throw new Error("INVALID_CHECKOUT");
    }
    ids.add(ref.id);
    return {
      productRef: { source: "shopify" as const, id: ref.id },
      quantity: row.quantity as number,
    };
  });

  const phone = field(raw.customerPhone, 9, 32).replace(/[\s()+.-]/g, "");
  const normalized = phone.startsWith("967") ? phone : `967${phone}`;
  if (!/^9677\d{8}$/.test(normalized)) throw new Error("INVALID_CHECKOUT");
  const couponCode = raw.couponCode === undefined ? "" : field(raw.couponCode, 0, 60).toUpperCase();
  if (couponCode && !["INDEXES10", "INDEXES20"].includes(couponCode)) {
    throw new Error("INVALID_CHECKOUT");
  }
  if (raw.paymentProvider !== undefined && raw.paymentProvider !== "cod") {
    throw new Error("INVALID_CHECKOUT");
  }
  return {
    idempotencyKey: String(raw.idempotencyKey),
    items,
    customerName: field(raw.customerName, 2, 200),
    customerPhone: normalized,
    customerAddress: field(raw.customerAddress, 3, 500),
    notes: raw.notes === undefined ? undefined : field(raw.notes, 0, 1000),
    couponCode,
    paymentProvider: "cod",
    turnstileToken: field(raw.turnstileToken, 20, 2048),
  };
}
