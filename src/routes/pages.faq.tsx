import { createFileRoute } from "@tanstack/react-router";
import { TrustPage } from "@/components/trust-page";

export const Route = createFileRoute("/pages/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة — اندكس ستور" },
      { name: "description", content: "إجابات عن الطلب والدفع والشحن في اندكس ستور." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <TrustPage title="الأسئلة الشائعة" description="إجابات سريعة عن الشراء من اندكس ستور.">
      <section>
        <h2>كيف يمكنني الطلب؟</h2>
        <p>أضف المنتجات إلى السلة، ثم أدخل بيانات التوصيل وأكمل تأكيد الطلب.</p>
      </section>
      <section>
        <h2>ما طرق الدفع المتاحة؟</h2>
        <p>يعرض مسار إتمام الطلب طرق الدفع المتاحة للعنوان والسوق المختارين.</p>
      </section>
      <section>
        <h2>كيف أتابع طلبي؟</h2>
        <p>استخدم صفحة تتبع الطلب برقم الطلب وآخر أربعة أرقام من رقم الهاتف.</p>
      </section>
    </TrustPage>
  );
}
