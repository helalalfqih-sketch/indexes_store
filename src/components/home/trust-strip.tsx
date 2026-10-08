import { BadgeDollarSign, MessageCircle, PackageCheck, ShoppingBasket } from "lucide-react";

/**
 * Storefront order facts. Keep these labels limited to behavior implemented by
 * the local catalog/order flow; policy claims belong in verified CMS settings.
 */
const PERKS = [
  { icon: BadgeDollarSign, title: "السعر المسجل", sub: "يُراجع عند الطلب" },
  { icon: PackageCheck, title: "حالة المخزون", sub: "تُتحقق قبل التأكيد" },
  { icon: ShoppingBasket, title: "الدفع عند الاستلام", sub: "وفق تأكيد الطلب" },
  { icon: MessageCircle, title: "الطلب عبر واتساب", sub: "خيار متاح للتواصل" },
] as const;

export function TrustStrip({
  variant = "stacked",
  className = "",
}: {
  /** `stacked` = icon above label (hero); `inline` = icon beside label (list). */
  variant?: "stacked" | "inline";
  className?: string;
}) {
  const stacked = variant === "stacked";
  return (
    <section
      aria-label="مزايا المتجر"
      className={`grid grid-cols-4 items-center rounded-2xl border border-ink-line bg-ink-card ${
        stacked
          ? "gap-1.5 px-1.5 py-3.5"
          : "gap-1 px-1 py-3 lg:h-[78px] lg:gap-0 lg:divide-x lg:divide-ink-line lg:px-2 lg:py-0"
      } ${className}`}
    >
      {PERKS.map((p) => (
        <div
          key={p.title}
          className={
            stacked
              ? "flex min-w-0 flex-col items-center gap-1 px-0.5 text-center"
              : "flex min-w-0 flex-col items-center gap-1 px-0.5 text-center lg:flex-row lg:justify-center lg:gap-1.5 lg:px-1.5 lg:text-start"
          }
        >
          <p.icon
            className={`shrink-0 text-neon-2 ${stacked ? "h-[27px] w-[27px]" : "h-[25px] w-[25px] lg:h-9 lg:w-9"}`}
            strokeWidth={1.7}
          />
          <div className={`min-w-0 ${stacked ? "w-full" : "w-full lg:w-auto"}`}>
            <p
              className={`truncate font-bold leading-tight ${stacked ? "text-[12.5px]" : "text-[12px] lg:text-[16px]"}`}
            >
              {p.title}
            </p>
            <p
              className={`truncate leading-tight text-ink-muted ${stacked ? "text-[10.5px]" : "text-[10px] lg:text-[13px]"}`}
            >
              {p.sub}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
