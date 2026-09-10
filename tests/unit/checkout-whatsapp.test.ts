import { describe, expect, it } from "vitest";
import { buildCheckoutWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";

describe("checkout WhatsApp handoff", () => {
  it("includes the committed order, totals, delivery details, and COD method", () => {
    const message = buildCheckoutWhatsAppMessage({
      orderId: "11111111-1111-4111-8111-111111111111",
      items: [{ name: "منتج تجريبي", quantity: 2, unitPrice: 1000 }],
      subtotal: 2000,
      discount: 200,
      shipping: 3000,
      total: 4800,
      customer: {
        name: "عميل تجريبي",
        phone: "771234567",
        address: "صنعاء",
        notes: "اتصل قبل الوصول",
      },
      couponCode: "INDEXES10",
    });

    expect(message).toContain("11111111-1111-4111-8111-111111111111");
    expect(message).toContain("منتج تجريبي — 2 ×");
    expect(message).toContain("الإجمالي: ٤٬٨٠٠ ريال");
    expect(message).toContain("عميل تجريبي");
    expect(message).toContain("771234567");
    expect(message).toContain("الدفع عند الاستلام");
  });

  it("targets the official store WhatsApp number with encoded text", () => {
    const url = whatsappLink("طلب رقم 123", "967771370740");
    expect(url).toBe(`https://wa.me/967771370740?text=${encodeURIComponent("طلب رقم 123")}`);
  });
});
