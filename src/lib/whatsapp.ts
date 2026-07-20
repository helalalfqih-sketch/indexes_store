import type { CartLine } from "./cart-store";
import { STORE_CONTACT, CURRENCY, formatPrice, type Product } from "./store-data";

export function buildOrderMessage(
  items: CartLine[],
  total: number,
  customer?: { name?: string; phone?: string; address?: string; notes?: string },
  coupon?: string,
  discount?: number
) {
  const lines: string[] = [];
  lines.push("🧾 *طلب جديد من اندكس ستور*");
  lines.push("");
  items.forEach((it, idx) => {
    lines.push(`${idx + 1}. ${it.name}`);
    lines.push(`   الكمية: ${it.qty} × ${it.price.toLocaleString("ar-EG")} ${CURRENCY}`);
    lines.push(`   الإجمالي: ${(it.qty * it.price).toLocaleString("ar-EG")} ${CURRENCY}`);
    lines.push("");
  });

  if (discount && discount > 0) {
    const subtotal = total + discount;
    lines.push(`💵 *المجموع الفرعي:* ${subtotal.toLocaleString("ar-EG")} ${CURRENCY}`);
    lines.push(`🏷️ *الخصم:* -${discount.toLocaleString("ar-EG")} ${CURRENCY}`);
    if (coupon) lines.push(`🎫 *الكوبون المستخدم:* ${coupon}`);
    lines.push("");
  }

  lines.push(`💰 *الإجمالي الكلي:* ${total.toLocaleString("ar-EG")} ${CURRENCY}`);
  lines.push("");
  if (customer?.name) lines.push(`👤 الاسم: ${customer.name}`);
  if (customer?.phone) lines.push(`📞 الهاتف: ${customer.phone}`);
  if (customer?.address) lines.push(`📍 العنوان: ${customer.address}`);
  if (customer?.notes) lines.push(`📝 ملاحظات: ${customer.notes}`);
  lines.push("");
  lines.push("💳 طريقة الدفع: الدفع عند الاستلام");
  return lines.join("\n");
}

export function whatsappLink(message: string, phone = STORE_CONTACT) {
  const normalized = phone.startsWith("+") ? phone.slice(1) : `967${phone}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** Quick single-product order link matching the exact brand template. */
export function quickOrderLink(product: Pick<Product, "name" | "price">, phone = STORE_CONTACT) {
  const normalized = phone.startsWith("+") ? phone.slice(1) : `967${phone}`;
  const text = `مرحباً، أريد طلب ${product.name} بسعر ${formatPrice(product.price)}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
