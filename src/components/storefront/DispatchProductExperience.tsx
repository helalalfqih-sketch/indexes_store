import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Check, PackageCheck, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/store-data";

type DispatchStage = "idle" | "packing" | "loading" | "delivered";

type DispatchProduct = {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  stock?: number;
};

interface DispatchProductExperienceProps {
  product: DispatchProduct;
  onBuy: () => void;
}

const swatches = [
  { name: "مرجاني", value: "#f06b4f" },
  { name: "فيروزي", value: "#20b8a5" },
  { name: "بنفسجي", value: "#8667e8" },
  { name: "ليموني", value: "#b8dc45" },
];

export function DispatchProductExperience({
  product,
  onBuy,
}: DispatchProductExperienceProps) {
  const [stage, setStage] = useState<DispatchStage>("idle");
  const [accent, setAccent] = useState(swatches[2]);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const startDispatch = () => {
    if (stage !== "idle" && stage !== "delivered") return;
    clearTimers();
    onBuy();
    setStage("packing");
    timers.current.push(window.setTimeout(() => setStage("loading"), 2400));
    timers.current.push(window.setTimeout(() => setStage("delivered"), 5200));
  };

  const reset = () => {
    clearTimers();
    setStage("idle");
  };

  const isPacking = stage === "packing";
  const isLoading = stage === "loading";
  const isDelivered = stage === "delivered";

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-label="تجربة شراء وتغليف المنتج"
        className="relative mx-auto mt-6 w-[calc(100%-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b12] text-white shadow-2xl"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 22% 34%, rgba(97,235,213,.18), transparent 28%), radial-gradient(circle at 78% 24%, rgba(181,143,255,.22), transparent 32%)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-3 text-[11px] font-bold tracking-[0.18em] text-white/55 sm:px-8">
          <span>INDEXES · SHIP IT</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_#34d399]" />
            جاهز للشحن
          </span>
        </div>

        <div className="relative z-10 grid min-h-[560px] grid-cols-1 items-center gap-5 p-5 sm:p-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-12 lg:p-12">
          <div className="relative order-2 flex min-h-[330px] items-end justify-center lg:order-1 lg:min-h-[430px]">
            <div className="absolute bottom-10 left-0 right-0 h-14 overflow-hidden border-y border-white/10 bg-[#111b22]">
              <motion.div
                className="absolute inset-y-0 flex w-[200%] items-center gap-12 opacity-70"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                {Array.from({ length: 18 }).map((_, index) => (
                  <span key={index} className="h-1 w-14 shrink-0 rounded-full bg-white/30" />
                ))}
              </motion.div>
            </div>

            <motion.div
              className="absolute bottom-16 h-12 w-56 rounded-[50%] blur-2xl"
              animate={{ backgroundColor: accent.value, opacity: [0.25, 0.5, 0.25] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />

            <AnimatePresence mode="wait">
              {!isLoading && !isDelivered && (
                <motion.div
                  key={isPacking ? "packing" : "product"}
                  initial={{ opacity: 0, y: 18, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.72 }}
                  className="absolute bottom-[78px] z-20 flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80"
                >
                  <motion.div
                    className="absolute inset-0 rounded-full border border-white/40 bg-white/10 backdrop-blur-xl"
                    animate={{
                      boxShadow: [
                        `inset 0 0 50px ${accent.value}44, 0 0 45px ${accent.value}33`,
                        `inset 0 0 80px ${accent.value}66, 0 0 75px ${accent.value}55`,
                        `inset 0 0 50px ${accent.value}44, 0 0 45px ${accent.value}33`,
                      ],
                    }}
                    transition={{ duration: 2.6, repeat: Infinity }}
                  />

                  <motion.img
                    src={product.image}
                    alt={product.name}
                    className="relative z-10 h-[62%] w-[62%] object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,.45)]"
                    animate={
                      isPacking
                        ? { scale: [1, 0.7, 0.42], rotate: [0, -3, 0], y: [0, 20, 62] }
                        : { y: [0, -8, 0], rotate: [-1, 1, -1] }
                    }
                    transition={
                      isPacking
                        ? { duration: 1.35, ease: "easeInOut" }
                        : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                    }
                  />

                  {isPacking && (
                    <motion.div
                      className="absolute bottom-0 z-30 h-32 w-44"
                      initial={{ opacity: 0, scale: 0.6, y: 40 }}
                      animate={{ opacity: 1, scale: 1, y: 22 }}
                      transition={{ delay: 0.65, duration: 0.55 }}
                    >
                      <div className="absolute inset-0 rounded-lg border border-amber-900/50 bg-[#b47a3d] shadow-2xl" />
                      <motion.div
                        className="absolute -top-9 left-0 h-10 w-1/2 origin-bottom-right border border-amber-900/40 bg-[#c88d4d]"
                        initial={{ rotateX: 105 }}
                        animate={{ rotateX: 0 }}
                        transition={{ delay: 1.15, duration: 0.5 }}
                      />
                      <motion.div
                        className="absolute -top-9 right-0 h-10 w-1/2 origin-bottom-left border border-amber-900/40 bg-[#c88d4d]"
                        initial={{ rotateX: 105 }}
                        animate={{ rotateX: 0 }}
                        transition={{ delay: 1.35, duration: 0.5 }}
                      />
                      <motion.div
                        className="absolute left-1/2 top-0 h-full w-5 -translate-x-1/2 bg-violet-500/90"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 1.75, duration: 0.35 }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}

              {isLoading && (
                <motion.div
                  key="truck"
                  className="absolute bottom-[65px] z-30 h-36 w-[310px] sm:w-[410px]"
                  initial={{ x: "-155%", opacity: 0 }}
                  animate={{ x: ["-155%", "0%", "0%", "155%"], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2.7, times: [0, 0.3, 0.66, 1], ease: "easeInOut" }}
                >
                  <div className="absolute bottom-7 left-3 h-20 w-[70%] rounded-l-xl border border-white/15 bg-[#102d35] shadow-2xl">
                    <div className="absolute inset-x-0 bottom-3 h-2 bg-violet-500/80" />
                    <motion.div
                      className="absolute left-[42%] top-7 h-12 w-16 rounded-md bg-[#b47a3d]"
                      initial={{ y: -90, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.75, type: "spring", stiffness: 160 }}
                    >
                      <div className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 bg-violet-500" />
                    </motion.div>
                  </div>
                  <div className="absolute bottom-7 right-2 h-16 w-[32%] rounded-r-2xl rounded-tl-2xl border border-white/15 bg-[#17404a]">
                    <div className="absolute right-4 top-3 h-6 w-10 rounded bg-cyan-100/70" />
                  </div>
                  <div className="absolute bottom-0 left-12 h-14 w-14 rounded-full border-[9px] border-[#101318] bg-[#4c5660]" />
                  <div className="absolute bottom-0 right-14 h-14 w-14 rounded-full border-[9px] border-[#101318] bg-[#4c5660]" />
                </motion.div>
              )}

              {isDelivered && (
                <motion.div
                  key="delivered"
                  initial={{ opacity: 0, y: 20, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute bottom-[115px] z-30 flex flex-col items-center gap-4 text-center"
                >
                  <div className="grid h-24 w-24 place-items-center rounded-full border border-emerald-300/30 bg-emerald-400/15 shadow-[0_0_60px_rgba(52,211,153,.35)]">
                    <PackageCheck className="h-12 w-12 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-xl font-black">أصبح طلبك جاهزاً</p>
                    <p className="mt-1 text-sm text-white/55">تمت إضافته إلى السلة بنجاح</p>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10"
                  >
                    <RotateCcw className="h-4 w-4" />
                    مشاهدة الحركة مجدداً
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-5 h-12 w-48 rounded-[50%] border border-white/20 bg-gradient-to-b from-white/20 to-white/5 shadow-[0_12px_40px_rgba(0,0,0,.65)] sm:w-60" />
          </div>

          <div className="order-1 text-right lg:order-2" dir="rtl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              متوفر · يشحن اليوم
            </div>
            <p className="text-xs font-black tracking-[0.22em] text-violet-300">INDEXES SELECT</p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">{product.name}</h1>
            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-7 text-white/58">
              {product.description || "منتج مختار بعناية وجاهز للتوصيل."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3" aria-label="اختيار لون إضاءة العرض">
              {swatches.map((swatch) => (
                <button
                  key={swatch.value}
                  type="button"
                  aria-label={swatch.name}
                  aria-pressed={accent.value === swatch.value}
                  onClick={() => setAccent(swatch)}
                  className="relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{
                    backgroundColor: swatch.value,
                    borderColor: accent.value === swatch.value ? "#fff" : "transparent",
                    boxShadow: accent.value === swatch.value ? `0 0 22px ${swatch.value}` : "none",
                  }}
                >
                  {accent.value === swatch.value && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-black/70" />
                  )}
                </button>
              ))}
            </div>

            <p className="mt-7 text-4xl font-black tracking-tight">{formatPrice(product.price)}</p>

            <button
              type="button"
              disabled={isPacking || isLoading}
              onClick={isDelivered ? reset : startDispatch}
              className="mt-6 flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-black shadow-[0_14px_40px_rgba(139,92,246,.32)] transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-65"
            >
              {isPacking ? (
                <>
                  <ShoppingBag className="h-5 w-5" />
                  جاري تغليف المنتج…
                </>
              ) : isLoading ? (
                <>
                  <Truck className="h-5 w-5" />
                  جاري تحميل الشحنة…
                </>
              ) : isDelivered ? (
                <>
                  <RotateCcw className="h-5 w-5" />
                  إعادة التجربة
                </>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5" />
                  اشترِ الآن
                </>
              )}
            </button>
            <p className="mt-3 text-[10px] text-white/38">
              توصيل سريع · متابعة الطلب · إمكانية إتمام الطلب عبر واتساب
            </p>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
