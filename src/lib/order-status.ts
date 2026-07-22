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
 * Human-friendly order number. The schema has no dedicated order_number column,
 * so we derive a stable short code from the UUID (uppercased first segment).
 * Example: "3f9a2b1c-..." -> "ORD-3F9A2B1C".
 */
export function formatOrderNumber(id: string): string {
  const head = (id ?? "").replace(/-/g, "").slice(0, 8).toUpperCase();
  return head ? `ORD-${head}` : "ORD-—";
}
