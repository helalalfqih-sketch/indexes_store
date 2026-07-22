import type { Database } from "@/integrations/supabase/types";

/**
 * Order status — DISPLAY-ONLY Arabic labels.
 *
 * IMPORTANT: We never invent DB statuses. The stored values are exactly the
 * `order_status` enum from the database. Per product decision, `delivered` is
 * presented to customers as "مكتمل" (completed) — this is a label mapping only,
 * the persisted value stays `delivered`.
 */
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export const ORDER_STATUS_LABELS_AR: Record<OrderStatus, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "مكتمل", // display-only mapping (stored value remains "delivered")
  cancelled: "ملغي",
  refunded: "مُسترجع",
};

export const PAYMENT_STATUS_LABELS_AR: Record<PaymentStatus, string> = {
  pending: "بانتظار الدفع",
  paid: "مدفوع",
  failed: "فشل الدفع",
  refunded: "مُسترجع",
  cod: "الدفع عند الاستلام",
};

/** Tailwind token classes per status, for badges. Falls back to neutral. */
export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  confirmed: "bg-primary/10 text-primary",
  processing: "bg-blue-500/10 text-blue-600",
  shipped: "bg-indigo-500/10 text-indigo-600",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

export function orderStatusLabel(status: string | null | undefined): string {
  if (!status) return "غير معروف";
  return ORDER_STATUS_LABELS_AR[status as OrderStatus] ?? status;
}

export function paymentStatusLabel(status: string | null | undefined): string {
  if (!status) return "غير معروف";
  return PAYMENT_STATUS_LABELS_AR[status as PaymentStatus] ?? status;
}

export function orderStatusTone(status: string | null | undefined): string {
  if (!status) return "bg-muted text-muted-foreground";
  return ORDER_STATUS_TONE[status as OrderStatus] ?? "bg-muted text-muted-foreground";
}

/**
 * Human-friendly order number, derived deterministically from the UUID.
 * Matches the DB generated column `orders.order_number` exactly.
 * Example: "3f9a2b1c-..." -> "ORD-3F9A2B1C".
 */
export function formatOrderNumber(id: string): string {
  const head = (id ?? "").replace(/-/g, "").slice(0, 8).toUpperCase();
  return head ? `ORD-${head}` : "ORD-—";
}

/**
 * Normalize user input into a canonical order number ("ORD-XXXXXXXX").
 * Accepts: "ORD-3F9A2B1C", "ord3f9a2b1c", "3f9a2b1c", or a full order UUID.
 * Returns null when the input can't be a valid order number.
 */
export function normalizeOrderNumber(input: string): string | null {
  const s = (input ?? "").trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
    return formatOrderNumber(s);
  }
  const m = s.replace(/\s/g, "").match(/^(?:ORD-?)?([0-9a-fA-F]{8})$/);
  return m ? `ORD-${m[1].toUpperCase()}` : null;
}

/**
 * Allowed status transitions (enforced server-side in updateOrderStatus and
 * mirrored in the admin UI):
 *   pending → confirmed → processing → shipped → delivered
 *   cancellation allowed from pending/confirmed/processing/shipped
 *   delivered → refunded (post-delivery refunds)
 *   cancelled / refunded are terminal (never back to an active state)
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

const PAYMENT_PROVIDER_LABELS_AR: Record<string, string> = {
  cod: "الدفع عند الاستلام",
  "bank-transfer": "تحويل بنكي",
  bank_transfer: "تحويل بنكي",
  hawala: "حوالة",
  kuraimi: "الكريمي",
  "mtn-cash": "MTN كاش",
  "sabafon-cash": "سبأفون كاش",
};

export function paymentProviderLabel(provider?: string | null): string {
  if (!provider) return "—";
  return PAYMENT_PROVIDER_LABELS_AR[provider] ?? provider;
}
