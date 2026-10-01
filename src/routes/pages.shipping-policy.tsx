import { createFileRoute } from "@tanstack/react-router";
import { TrustPage } from "@/components/trust-page";

export const Route = createFileRoute("/pages/shipping-policy")({
  head: () => ({
    meta: [
      { title: "سياسة الشحن والتوصيل — اندكس ستور" },
      { name: "description", content: "تفاصيل مدة وتغطية خدمات الشحن والتوصيل في اندكس ستور." },
    ],
  }),
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
  return (
    <TrustPage
      title="سياسة الشحن والتوصيل"
      description="معلومات الشحن والتوصيل للطلبات داخل اليمن."
    >
      <section>
        <h2>مدة التوصيل</h2>
        <p>تواصل مع المتجر عبر واتساب لتحديد موعد التسليم المناسب لعنوانك قبل تأكيد الطلب.</p>
      </section>
      <section>
        <h2>تأكيد الطلب</h2>
        <p>
          راجع العنوان ورقم الهاتف وتكلفة الشحن الظاهرة في ملخص السلة، ثم أكمل تأكيد الطلب عبر
          واتساب.
        </p>
      </section>
    </TrustPage>
  );
}
