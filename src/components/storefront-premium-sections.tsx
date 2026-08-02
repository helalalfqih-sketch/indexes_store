import { Link } from "@tanstack/react-router";
import {
  Gem,
  Grid2X2,
  Headphones,
  HeartPulse,
  Home,
  Package,
  RotateCcw,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  SprayCan,
  Truck,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { LegacyCategoryShape } from "@/lib/data-adapter";

const shortcutIcons = [Home, Smartphone, HeartPulse, SprayCan, Shirt, Grid2X2];

export function StorefrontCategoryShortcuts({
  categories,
}: {
  categories: LegacyCategoryShape[];
}) {
  const visible = categories.slice(0, 6);
  if (visible.length === 0) return null;

  return (
    <section aria-label="اختصارات التصنيفات" className="relative z-10 px-4">
      <div
        dir="rtl"
        className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3"
      >
        {visible.map((category, index) => {
          const Icon = shortcutIcons[index] ?? Package;
          return (
            <Link
              key={category.id}
              to="/category/$id"
              params={{ id: category.id }}
              className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-[22px] border border-violet-400/20 bg-[#080d1a] px-2 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-violet-400/55 hover:bg-violet-500/10"
            >
              <Icon className="h-7 w-7 text-violet-300 transition group-hover:scale-110 group-hover:text-fuchsia-300" />
              <span className="line-clamp-1 text-[11px] font-bold text-slate-100 sm:text-xs">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const benefits = [
  {
    icon: ShieldCheck,
    title: "ضمان الجودة",
    subtitle: "على المنتجات المؤهلة",
  },
  {
    icon: Truck,
    title: "شحن مجاني",
    subtitle: "فوق 30,000 ريال",
  },
  {
    icon: RotateCcw,
    title: "إرجاع سهل",
    subtitle: "حسب سياسة المتجر",
  },
  {
    icon: Headphones,
    title: "دعم العملاء",
    subtitle: "خدمة سريعة عبر واتساب",
  },
];

export function StorefrontBenefits() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      className="relative z-10 mx-4 grid grid-cols-2 overflow-hidden rounded-[26px] border border-violet-400/15 bg-[#080d19] md:grid-cols-4"
    >
      {benefits.map(({ icon: Icon, title, subtitle }, index) => (
        <div
          key={title}
          className={`flex min-h-24 items-center gap-3 px-4 py-4 ${
            index > 0 ? "border-violet-300/10 md:border-r" : ""
          } ${index > 1 ? "border-t md:border-t-0" : ""}`}
        >
          <Icon className="h-7 w-7 shrink-0 text-violet-300" />
          <div className="text-start">
            <h3 className="text-xs font-black text-white">{title}</h3>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">{subtitle}</p>
          </div>
        </div>
      ))}
    </motion.section>
  );
}

export function StorefrontRewards() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      className="relative z-10 mx-4 overflow-hidden rounded-[30px] border border-violet-400/25 bg-[radial-gradient(circle_at_15%_50%,rgba(124,58,237,0.32),transparent_34%),linear-gradient(120deg,#090b1a,#100926_58%,#080b16)] p-5 shadow-[0_24px_80px_rgba(75,20,160,0.2)] sm:p-7"
    >
      <div className="pointer-events-none absolute -start-12 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full border border-fuchsia-400/25" />
      <div className="relative grid items-center gap-5 sm:grid-cols-[180px_1fr_auto]">
        <div className="relative mx-auto grid h-28 w-28 place-items-center">
          <div className="absolute inset-2 rotate-45 rounded-[26px] border border-fuchsia-300/50 bg-gradient-to-br from-fuchsia-300 via-violet-600 to-indigo-950 shadow-[0_0_40px_rgba(168,85,247,0.5)]" />
          <Gem className="relative h-12 w-12 text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.8)]" />
          <Sparkles className="absolute end-0 top-1 h-6 w-6 text-amber-300" />
        </div>

        <div className="text-center sm:text-start">
          <p className="text-[10px] font-bold tracking-[0.24em] text-fuchsia-300">
            مكافآت حصرية
          </p>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
            برنامج <span className="text-violet-300">INDEXES</span> المميز
          </h2>
          <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300">
            اكسب نقاطاً مع الطلبات المؤهلة واستبدلها بمزايا وعروض خاصة عند تفعيلها لحسابك.
          </p>
        </div>

        <Link
          to="/account"
          className="mx-auto inline-flex min-h-11 items-center justify-center rounded-full border border-violet-300/35 bg-violet-500/15 px-6 text-xs font-black text-white transition hover:bg-violet-500/30 sm:mx-0"
        >
          اكتشف المزايا
        </Link>
      </div>
    </motion.section>
  );
}
