import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Ticket, MessageCircle, Mail, Star } from "lucide-react";

export const Route = createFileRoute("/store/marketing")({
  component: StoreMarketingPage,
});

/**
 * Marketing hub — structured for upcoming campaign systems. Coupons require a
 * server-side coupon service (planned; discounts are currently disabled at
 * checkout by security policy F1), so modules ship as prepared surfaces.
 */
function StoreMarketingPage() {
  const modules = [
    {
      icon: Ticket,
      title: "كوبونات الخصم",
      desc: "إنشاء أكواد خصم بنسبة أو مبلغ ثابت مع حدود استخدام وصلاحية.",
      status: "يتطلب تفعيل خدمة الكوبونات على الخادم",
    },
    {
      icon: Star,
      title: "المنتجات المميزة",
      desc: "إبراز منتجات مختارة في واجهة متجرك.",
      status: "متاح حالياً عبر أقسام الرئيسية في CMS المنصّة",
    },
    {
      icon: MessageCircle,
      title: "حملات واتساب",
      desc: "رسائل جماعية لعملائك بالعروض الجديدة.",
      status: "قريباً — البنية جاهزة (whatsapp_configs لكل متجر)",
    },
    {
      icon: Mail,
      title: "حملات البريد",
      desc: "نشرات بريدية للعملاء المسجَّلين.",
      status: "قريباً",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Megaphone className="h-6 w-6 text-primary" /> التسويق
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">أدوات نمو متجرك — تُفعَّل تباعاً</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.title} className="rounded-2xl glass p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-sm font-black">{m.title}</h2>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{m.desc}</p>
              <span className="mt-3 inline-block rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                {m.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
