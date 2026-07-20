import type { OrderDTO } from "@/lib/domain/order";
import { CURRENCY } from "@/lib/store-data";
import type { WhatsAppProvider, WhatsAppSendResult } from "./types";

/** Default fallback: builds wa.me links only, no server-side push. */
export const waMeAdapter: WhatsAppProvider = {
  name: "wa.me",
  canSend: false,

  buildOrderMessage(order: OrderDTO): string {
    const lines: string[] = [];
    lines.push("🧾 *طلب جديد من اندكس ستور*");
    lines.push("");
    order.items.forEach((it, idx) => {
      lines.push(`${idx + 1}. ${it.name_snapshot}`);
      lines.push(`   الكمية: ${it.qty} × ${it.price_snapshot.toLocaleString("ar-EG")} ${CURRENCY}`);
      lines.push(`   الإجمالي: ${it.subtotal.toLocaleString("ar-EG")} ${CURRENCY}`);
      lines.push("");
    });
    lines.push(`💰 *الإجمالي الكلي:* ${order.total.toLocaleString("ar-EG")} ${CURRENCY}`);
    lines.push("");
    if (order.customer_name) lines.push(`👤 الاسم: ${order.customer_name}`);
    if (order.customer_phone) lines.push(`📞 الهاتف: ${order.customer_phone}`);
    if (order.customer_address) lines.push(`📍 العنوان: ${order.customer_address}`);
    if (order.notes) lines.push(`📝 ملاحظات: ${order.notes}`);
    lines.push("");
    lines.push(`💳 طريقة الدفع: ${order.payment_provider}`);
    if (order.id) lines.push(`🆔 رقم الطلب: ${order.id}`);
    return lines.join("\n");
  },

  buildQuickOrderMessage(productName: string, price: string): string {
    return `مرحباً، أريد طلب ${productName} بسعر ${price}`;
  },

  buildLink(phone: string, message: string): string {
    const normalized = phone.startsWith("+") ? phone.slice(1) : phone.startsWith("967") ? phone : `967${phone}`;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  },

  async send(phone: string, message: string): Promise<WhatsAppSendResult> {
    return { kind: "link", url: this.buildLink(phone, message) };
  },
};
