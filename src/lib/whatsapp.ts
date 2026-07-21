import type { CartLine } from "./cart-store";
import { STORE_CONTACT, CURRENCY, formatPrice, type Product } from "./store-data";

export function buildOrderMessage(
  items: CartLine[],
  total: number,
  customer?: { name?: string; phone?: string; address?: string; notes?: string },
  coupon?: string,
  discount?: number,
  customTemplate?: string
) {
  const formattedProducts = items
    .map((it, idx) => `${idx + 1}. ${it.name} (الكمية: ${it.qty}) — ${formatPrice(it.price * it.qty)}`)
    .join("\n");

  const formattedTotal = formatPrice(total);

  if (customTemplate && customTemplate.includes("{products}")) {
    return customTemplate
      .replace(/{products}/g, formattedProducts)
      .replace(/{total}/g, formattedTotal)
      .replace(/{name}/g, customer?.name || "عميل مميز")
      .replace(/{phone}/g, customer?.phone || "")
      .replace(/{address}/g, customer?.address || "غير محدد");
  }

  const lines: string[] = [];
  lines.push("🧾 *طلب جديد من المتجر*");
  lines.push("");
  items.forEach((it, idx) => {
    lines.push(`${idx + 1}. ${it.name}`);
    lines.push(`   الكمية: ${it.qty} × ${formatPrice(it.price)}`);
    lines.push(`   الإجمالي: ${formatPrice(it.qty * it.price)}`);
    lines.push("");
  });

  if (discount && discount > 0) {
    const subtotal = total + discount;
    lines.push(`💵 *المجموع الفرعي:* ${formatPrice(subtotal)}`);
    lines.push(`🏷️ *الخصم:* -${formatPrice(discount)}`);
    if (coupon) lines.push(`🎫 *الكوبون المستخدم:* ${coupon}`);
    lines.push("");
  }

  lines.push(`💰 *الإجمالي الكلي:* ${formattedTotal}`);
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
  const cleanPhone = (phone || STORE_CONTACT).replace(/[^\d+]/g, "");
  const normalized = cleanPhone.startsWith("+")
    ? cleanPhone.slice(1)
    : cleanPhone.startsWith("967")
    ? cleanPhone
    : `967${cleanPhone}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** Quick single-product order link matching the exact brand template. */
export function quickOrderLink(product: Pick<Product, "name" | "price">, phone = STORE_CONTACT) {
  const text = `مرحباً، أريد طلب ${product.name} بسعر ${formatPrice(product.price)}`;
  return whatsappLink(text, phone);
}
