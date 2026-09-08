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
        <p>التوصيل داخل صنعاء يستغرق عادةً 24–48 ساعة، وإلى المحافظات الأخرى 2–4 أيام عمل.</p>
      </section>
      <section>
        <h2>تأكيد الطلب</h2>
        <p>
          تبدأ مدة التوصيل بعد تأكيد الطلب وبيانات العنوان ورقم الهاتف. قد تتغير المدة حسب المحافظة
          وتوفر المنتج.
        </p>
      </section>
    </TrustPage>
  );
}
