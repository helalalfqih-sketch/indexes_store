import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Product, Currency } from "./types";
import { formatPrice } from "./currency";
import {
  Bot,
  Sparkles,
  Search,
  Headphones,
  Radio,
  Camera,
  Watch,
  Gamepad2,
  Zap,
} from "lucide-react";

interface AISearchSectionProps {
  onFilteredProductsChange?: (products: Product[]) => void;
  onSelectProduct: (product: Product) => void;
  currency: Currency;
  onSearchQuerySubmit?: (query: string) => void;
  products?: Product[];
}

export const AISearchSection: React.FC<AISearchSectionProps> = ({
  onSelectProduct,
  currency,
  onSearchQuerySubmit,
  products = [],
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    aiSummary: string;
    matchedProducts: Product[];
    recommendedKeywords?: string[];
  } | null>(null);

  const presetChips = [
    { label: "سماعات بلوتوث", icon: Headphones },
    { label: "سماعات مراقبة", icon: Radio },
    { label: "كاميرات مراقبة", icon: Camera },
    { label: "ساعات ذكيه", icon: Watch },
    { label: "كروت وشحن ألعاب", icon: Gamepad2 },
    { label: "شواحن سريعه", icon: Zap },
  ];

  const handleAISearch = async (searchPrompt?: string) => {
    const textToSearch = searchPrompt || query;
    if (!textToSearch.trim()) return;

    setLoading(true);
    setAiResult(null);

    if (onSearchQuerySubmit) {
      onSearchQuerySubmit(textToSearch);
    }

    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSearch,
          products,
        }),
      });

      if (!res.ok) throw new Error("API request failed");

      const data = await res.json();

      let matchedProds: Product[] = [];
      if (Array.isArray(data.matchedProductIds) && data.matchedProductIds.length > 0) {
        matchedProds = products.filter((p) => data.matchedProductIds.includes(p.id));
      }

      if (matchedProds.length === 0) {
        const terms = textToSearch.toLowerCase().split(" ");
        matchedProds = products.filter((p) =>
          terms.some(
            (term) =>
              p.name.toLowerCase().includes(term) ||
              p.subtitle.toLowerCase().includes(term) ||
              p.description.toLowerCase().includes(term) ||
              p.category.toLowerCase().includes(term),
          ),
        );
      }

      setAiResult({
        aiSummary: data.aiSummary || `تم تحليل طلبك "${textToSearch}" وعرض المنتجات الأكثر ملاءمة.`,
        matchedProducts: matchedProds.length > 0 ? matchedProds : products.slice(0, 4),
        recommendedKeywords: data.recommendedKeywords || ["ضمان متجر إندكس", "أصلي 100%"],
      });
    } catch {
      const terms = textToSearch.toLowerCase().split(" ");
      const matchedProds = products.filter((p) =>
        terms.some(
          (term) =>
            p.name.toLowerCase().includes(term) ||
            p.subtitle.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term),
        ),
      );

      setAiResult({
        aiSummary: `نتائج البحث الذكي عن "${textToSearch}": إندكس يقدم أفضل الخيارات المتطابقة.`,
        matchedProducts: matchedProds.length > 0 ? matchedProds : products.slice(0, 3),
      });
    } finally {
      setLoading(false);
    }
  };

  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const yParallax = useTransform(scrollYProgress, [0, 1], [15, -15]);
  const y = shouldReduceMotion ? 0 : yParallax;

  return (
    <section ref={sectionRef} className="px-3 sm:px-6 my-5">
      <motion.div
        style={{ y }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-[#100B1A]/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-gray-800 shadow-md relative overflow-hidden"
      >
        {/* Subtle Ambient Background Highlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7B3FFF]/08 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row with AI Robot Graphic */}
        <div className="flex items-center justify-between mb-4 relative z-10 dir-rtl">
          {/* Header Text */}
          <div className="text-right space-y-1 max-w-xs sm:max-w-md">
            <div className="inline-flex items-center gap-1.5 bg-[#18112B] border border-gray-800 px-3 py-0.5 rounded-full text-xs font-bold text-[#7B3FFF]">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>مساعد إندكس الذكي</span>
            </div>

            <h3 className="text-lg sm:text-2xl font-black text-white leading-tight">
              <span>البحث الذكي </span>
              <span className="text-[#7B3FFF]">بالذكاء الاصطناعي</span>
            </h3>

            <p className="text-[11px] sm:text-xs text-gray-300 font-medium leading-relaxed">
              اكتب مواصفات ما تبحث عنه وسنقوم بالعثور على أفضل المنتجات فوراً
            </p>
          </div>

          {/* AI Robot Graphic */}
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#7B3FFF]/10 rounded-full blur-xl" />
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 bg-[#18112B] border border-gray-800 rounded-3xl flex flex-col items-center justify-center p-2 shadow-sm">
              {/* Antenna */}
              <div className="w-2 h-2 bg-[#7B3FFF] rounded-full mb-1" />
              {/* Robot Face / Eyes */}
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-purple-400 rounded-full" />
                <div className="w-2.5 h-2.5 bg-purple-400 rounded-full" />
              </div>
              <span className="text-[10px] font-black text-white bg-[#7B3FFF] px-1.5 py-0.2 rounded-md tracking-wider">
                AI
              </span>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAISearch();
          }}
          className="mb-4 relative z-10"
        >
          <div className="relative flex items-center bg-[#18112B] border border-gray-800 focus-within:border-[#7B3FFF] rounded-full p-1 shadow-inner backdrop-blur-md">
            {/* Robot Head Icon on Right in RTL */}
            <div className="pr-3 text-gray-400 shrink-0">
              <Bot className="w-5 h-5 text-[#7B3FFF]" />
            </div>

            {/* Input Text */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثال : أريد ساعة ذكية مقاومة للماء مع بطارية قوية"
              className="w-full bg-transparent border-none text-white text-xs sm:text-sm px-2 focus:outline-none placeholder-gray-500 font-medium text-right"
            />

            {/* Left Search Button in RTL */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#7B3FFF] hover:bg-[#682BDD] text-white px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-500/20 shrink-0"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>بحث</span>
                  <Search className="w-3.5 h-3.5 text-white" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Preset Chips Grid */}
        <div className="grid grid-cols-3 gap-2 relative z-10 max-w-xl mx-auto dir-rtl">
          {presetChips.map((chip, idx) => {
            const ChipIcon = chip.icon;
            return (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => {
                  setQuery(chip.label);
                  handleAISearch(chip.label);
                }}
                className="bg-[#18112B] hover:bg-[#201838] border border-gray-800 hover:border-[#7B3FFF] py-2 px-2.5 rounded-2xl text-gray-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 backdrop-blur-md text-[11px] font-bold shadow-sm"
              >
                <ChipIcon className="w-3.5 h-3.5 text-[#7B3FFF] shrink-0" />
                <span className="truncate">{chip.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* AI Result Box */}
        {aiResult && (
          <div className="mt-5 pt-4 border-t border-gray-800/60 animate-fadeIn relative z-10">
            <div className="bg-[#18112B] border border-gray-800 p-3.5 rounded-2xl mb-3 text-right space-y-1.5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-[#7B3FFF] text-xs font-bold">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>نتائج البحث والتوصية من مساعد إندكس الذكي:</span>
              </div>
              <p className="text-xs text-white leading-relaxed font-medium">{aiResult.aiSummary}</p>
            </div>

            {/* Matched Products */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {aiResult.matchedProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className="bg-[#18112B] hover:bg-[#201838] border border-gray-800 hover:border-[#7B3FFF] p-2.5 rounded-2xl flex items-center gap-2.5 cursor-pointer transition-all group backdrop-blur-md shadow-sm"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-800/60"
                  />
                  <div className="overflow-hidden text-right">
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-[#7B3FFF] transition-colors">
                      {p.name}
                    </h5>
                    <p className="text-[11px] text-white font-bold mt-0.5">
                      {formatPrice(p.priceYER, currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
};
