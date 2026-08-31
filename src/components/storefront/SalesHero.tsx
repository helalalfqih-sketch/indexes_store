import { ArrowLeft, MessageCircle, Search, Truck } from "lucide-react";
import { STORE_INFO } from "./constants";

interface SalesHeroProps {
  onShopNow: () => void;
  onFocusSearch: () => void;
}

export function SalesHero({ onShopNow, onFocusSearch }: SalesHeroProps) {
  const whatsappHref = `https://wa.me/${STORE_INFO.whatsappNumber.replace(/\D/g, "")}`;

  return (
    <section className="px-4 pb-3 pt-3 sm:px-6 sm:pb-8 sm:pt-8" aria-labelledby="store-hero-title">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--color-border-default)] bg-[var(--color-surface-1)] px-5 py-5 shadow-sm sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#2F6BFF]/10 to-transparent" />
        <div className="relative max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2F6BFF]/25 bg-[#2F6BFF]/10 px-3 py-1.5 text-xs font-bold text-[#2F6BFF]">
            <Truck className="h-4 w-4" aria-hidden="true" />
            توصيل لجميع المحافظات
          </div>
          <h1
            id="store-hero-title"
            className="text-balance text-xl font-black leading-tight text-[var(--color-text-primary)] sm:text-5xl"
          >
            منتجات مختارة وتوصيل لجميع المحافظات
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-6 text-[var(--color-text-secondary)] sm:mt-4 sm:text-base sm:leading-7">
            راجع السعر والتوفر الحقيقي، وأكمل طلبك بخطوات واضحة وآمنة.
          </p>
          <div className="mt-4 flex flex-col gap-3 min-[420px]:flex-row sm:mt-6">
            <button
              type="button"
              onClick={onShopNow}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2F6BFF] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#2458D8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2"
            >
              تسوق الآن
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-5 py-3 text-sm font-black text-emerald-500 transition-colors hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              اطلب عبر واتساب
            </a>
          </div>
          <button
            type="button"
            onClick={onFocusSearch}
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] sm:mt-5"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            أو ابحث باسم المنتج
          </button>
        </div>
      </div>
    </section>
  );
}
