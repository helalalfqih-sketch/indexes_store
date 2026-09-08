import { createFileRoute } from "@tanstack/react-router";
import { TrustPage } from "@/components/trust-page";

export const Route = createFileRoute("/pages/return-policy")({
  head: () => ({
    meta: [
      { title: "سياسة الإرجاع والاستبدال — اندكس ستور" },
      { name: "description", content: "شروط وإجراءات إرجاع واستبدال المنتجات في اندكس ستور." },
    ],
  }),
  component: ReturnPolicyPage,
});

function ReturnPolicyPage() {
  return (
    <TrustPage title="سياسة الإرجاع والاستبدال" description="الشروط الأساسية لطلب الإرجاع أو الاستبدال.">
      <section>
        <h2>مدة تقديم الطلب</h2>
        <p>يمكن طلب الإرجاع أو الاستبدال خلال 7 أيام من تاريخ الاستلام.</p>
      </section>
      <section>
        <h2>حالة المنتج</h2>
        <p>يجب أن يكون المنتج بحالته الأصلية، غير مستخدم، وفي عبوته الأصلية. تواصل معنا قبل إعادة المنتج لتأكيد الخطوات.</p>
      </section>
    </TrustPage>
  );
}
