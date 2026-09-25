import { createFileRoute, Link } from "@tanstack/react-router";
import { VStack } from "@astryxdesign/core/VStack";
import { useAppearance } from "@/components/appearance-provider";
export const Route = createFileRoute("/pages/faq")({
  head: () => ({ meta: [{ title: "مركز المساعدة — اندكس ستور" }] }),
  component: FaqPage,
});
function FaqPage() {
  const { settings } = useAppearance();
  return (
    <VStack as="section" gap={5} className="sf-page sf-information-page">
      <header className="sf-page-heading">
        <h1>مركز المساعدة</h1>
        <p>كل ما تحتاجه للطلب ومتابعة التسليم</p>
      </header>
      <section className="sf-faq">
        <details>
          <summary>كيف أطلب من المتجر؟</summary>
          <p>
            أضف المنتجات إلى السلة، راجع الكميات والإجمالي، ثم أدخل الاسم ورقم الهاتف والعنوان. عند
            تأكيد الطلب يتم حفظه وإكمال التواصل عبر واتساب.
          </p>
        </details>
        <details>
          <summary>كيف أتابع طلبي؟</summary>
          <p>أدخل رقم الطلب وآخر أربعة أرقام من هاتفك في صفحة التتبع.</p>
          <Link to="/track" className="sf-text-button">
            تتبع الطلب
          </Link>
        </details>
        <details>
          <summary>ما تكلفة الشحن؟</summary>
          <p>تظهر تكلفة الشحن في ملخص السلة قبل تأكيد الطلب، وفق إعدادات المتجر الحالية.</p>
          <Link to="/cart" className="sf-text-button">
            عرض السلة
          </Link>
        </details>
        <details>
          <summary>كيف أحفظ المنتجات للمرة القادمة؟</summary>
          <p>اضغط على رمز القلب بجانب المنتج. تبقى المفضلة محفوظة في هذا المتصفح.</p>
          <Link to="/favorites" className="sf-text-button">
            عرض المفضلة
          </Link>
        </details>
        <details>
          <summary>كيف أستفسر عن منتج أو طلب؟</summary>
          <p>تواصل مع المتجر عبر واتساب، واذكر اسم المنتج أو رقم الطلب إن وجد.</p>
        </details>
      </section>
      <a
        className="sf-primary-button"
        href={`https://wa.me/${settings.cart_config.whatsappPhone.replace(/\D/g, "")}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        تواصل معنا عبر واتساب
      </a>
    </VStack>
  );
}
