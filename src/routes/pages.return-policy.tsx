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
    <TrustPage
      title="سياسة الإرجاع والاستبدال"
      description="كيفية الاستفسار عن الإرجاع أو الاستبدال."
    >
      <section>
        <h2>الاستفسار عن الإرجاع</h2>
        <p>
          تواصل مع المتجر واذكر رقم الطلب والمنتج وسبب طلب الإرجاع أو الاستبدال للتحقق من الشروط
          المطبقة على طلبك.
        </p>
      </section>
      <section>
        <h2>حالة المنتج</h2>
        <p>احتفظ بالمنتج ومرفقاته وتواصل مع المتجر قبل إعادة إرساله لتأكيد الإجراءات.</p>
      </section>
    </TrustPage>
  );
}
