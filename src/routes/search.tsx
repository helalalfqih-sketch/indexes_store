import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Search as SearchIcon,
  Loader2,
  PackageX,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Tag,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { ProductCard } from "@/components/product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import type { LegacyProductShape } from "@/lib/data-adapter";
import type { Product } from "@/lib/store-data";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";
import {
  searchProductsAdvanced,
  getRecommendations,
  type SearchSuggestionItem,
} from "@/lib/search-engine";
import { fetchCategories } from "@/lib/actions/category.actions";
import { formatPrice } from "@/lib/store-data";

const searchParamsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  dealsOnly: z.boolean().optional(),
  inStockOnly: z.boolean().optional(),
  sortBy: z.enum(["bestselling", "latest", "price_asc", "price_desc", "rating"]).optional(),
});

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "البحث في المنتجات والكتالوجات — اندكس ستور" },
      { name: "description", content: "ابحث عن الأجهزة الذكية والمنتجات الفاخرة بالاسم والنوع." },
    ],
  }),
  validateSearch: (search) => searchParamsSchema.parse(search),
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/search" });

  const [q, setQ] = useState(searchParams.q || "");
  const [selectedCat, setSelectedCat] = useState(searchParams.category || "all");
  const [minPrice, setMinPrice] = useState<number | undefined>(searchParams.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(searchParams.maxPrice);
  const [dealsOnly, setDealsOnly] = useState<boolean>(!!searchParams.dealsOnly);
  const [inStockOnly, setInStockOnly] = useState<boolean>(!!searchParams.inStockOnly);
  const [sortBy, setSortBy] = useState<
    "bestselling" | "latest" | "price_asc" | "price_desc" | "rating"
  >(searchParams.sortBy || "bestselling");

  const [results, setResults] = useState<LegacyProductShape[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<LegacyProductShape[]>([]);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);


  // Fetch Categories for Filter
  useEffect(() => {
    fetchCategories()
      .then((cats) => setCategoriesList(cats))
      .catch(() => {});
  }, []);

  // Sync state with URL params
  useEffect(() => {
    if (searchParams.q !== undefined && searchParams.q !== q) setQ(searchParams.q);
    if (searchParams.category) setSelectedCat(searchParams.category);
    if (searchParams.sortBy) setSortBy(searchParams.sortBy);
  }, [searchParams]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Execute Search with AbortController & error handling
  useEffect(() => {
    const controller = new AbortController();
    setErrorMsg(null);

    const t = setTimeout(async () => {
      setSearchState("loading");
      try {
        if (q.trim()) {
          trackEvent("click_search", { query: q });
        }

        const data = await searchProductsAdvanced(
          {
            search: q,
            categoryId: selectedCat,
            minPrice,
            maxPrice,
            dealsOnly,
            inStockOnly,
            sortBy,
          },
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setResults(data);
          setSuggestions(
            data.slice(0, 5).map((product) => ({
              id: product.id,
              type: "product" as const,
              title: product.name,
              subtitle: product.categoryId || "منتج",
              image: product.image,
              price: product.price,
              slug: product.slug,
            })),
          );
          setRecommendations(q.trim() && data.length === 0 ? await getRecommendations(8) : []);
          setSearchState("done");
        }
      } catch (err) {
        if (
          !controller.signal.aborted &&
          !(err instanceof DOMException && err.name === "AbortError")
        ) {
          console.error("Search failed:", err);
          setErrorMsg("حدث خطأ أثناء تحميل نتائج البحث. الرجاء المحاولة مرة أخرى.");
          setSearchState("error");
        }
      }
    }, 300);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, selectedCat, minPrice, maxPrice, dealsOnly, inStockOnly, sortBy]);

  useEffect(() => {
    setShowSuggestions(Boolean(q.trim() && suggestions.length > 0));
  }, [q, suggestions]);

  const handleSelectSuggestion = (s: SearchSuggestionItem) => {
    setShowSuggestions(false);
    if (s.type === "product" && s.slug) {
      navigate({ to: "/product/$slug", params: { slug: s.slug } });
    } else {
      setQ(q);
    }
  };

  const handleResetFilters = () => {
    setSelectedCat("all");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setDealsOnly(false);
    setInStockOnly(false);
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-16 max-w-7xl mx-auto" dir="rtl">
      {/* Header Search Input with Auto Suggestions */}
      <div ref={searchContainerRef} className="relative z-30">
        <div className="flex items-center gap-3 rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 backdrop-blur-md px-4 py-3 shadow-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
          <SearchIcon className="h-5 w-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setShowSuggestions(false);
              if (event.key === "Enter") setShowSuggestions(false);
            }}
            placeholder="ابحث باسم المنتج، التصنيف، الكود (SKU)، أو الوسوم..."
            aria-label="مربع البحث عن المنتجات"
            className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-showcase-muted text-showcase-foreground"
          />
          {q && (
            <button
              onClick={() => {
                setQ("");
                setShowSuggestions(false);
              }}
              aria-label="مسح نص البحث"
              className="text-showcase-muted hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {searchState === "loading" && (
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          )}
        </div>

        {/* Live Auto-Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute inset-x-0 top-full mt-2 z-40 rounded-2xl border border-white/10 bg-[#0c1a29]/95 p-3 shadow-2xl backdrop-blur-xl space-y-2">
            <div className="text-[10px] font-bold text-muted-foreground px-2">
              اقتراحات البحث الذكي:
            </div>
            <ul role="listbox" aria-label="اقتراحات البحث" className="space-y-2">
              {suggestions.map((s) => (
                <li key={s.id} role="option" aria-selected="false">
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(s);
                    }}
                    className="flex w-full items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {s.image ? (
                        <img
                          src={s.image}
                          alt=""
                          className="h-8 w-8 rounded-lg object-cover bg-black"
                        />
                      ) : (
                        <SearchIcon className="h-4 w-4 text-neon" />
                      )}
                      <div className="truncate text-xs">
                        <p className="font-bold text-white truncate">{s.title}</p>
                        {s.subtitle && (
                          <p className="text-[10px] text-showcase-muted">{s.subtitle}</p>
                        )}
                      </div>
                    </div>
                    {s.price && (
                      <span className="text-xs font-bold text-cyan-400 shrink-0">
                        {formatPrice(s.price)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Control Bar: Filters & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface/50 border border-border/40 p-3 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-showcase-muted">
          <span>{q ? `نتائج البحث عن "${q}"` : "عرض جميع الكتالوجات"}</span>
          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-md text-[11px]">
            {searchState === "loading"
              ? "جاري البحث..."
              : searchState === "done"
                ? `${results.length} منتج`
                : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              setShowSuggestions(false);
            }}
            onClick={() => {
              setShowSuggestions(false);
              setShowFilterDrawer((open) => !open);
            }}
            aria-label="تصفية النتائج"
            aria-controls="search-filter-drawer"
            aria-expanded={showFilterDrawer}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold transition hover:bg-accent min-h-[44px]"
          >
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span>الفلاتر</span>
            {(selectedCat !== "all" || dealsOnly || inStockOnly || minPrice || maxPrice) && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold min-h-[44px]">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="ترتيب النتائج حسب"
              className="bg-transparent text-foreground font-bold outline-none text-xs"
            >
              <option value="bestselling" className="bg-slate-900 text-white">
                الأكثر مبيعاً
              </option>
              <option value="latest" className="bg-slate-900 text-white">
                الأحدث
              </option>
              <option value="price_asc" className="bg-slate-900 text-white">
                السعر: الأقل إلى الأعلى
              </option>
              <option value="price_desc" className="bg-slate-900 text-white">
                السعر: الأعلى إلى الأقل
              </option>
              <option value="rating" className="bg-slate-900 text-white">
                الأعلى تقييماً
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Drawer / Bar (Collapsible) */}
      {showFilterDrawer && (
        <div
          id="search-filter-drawer"
          className="rounded-2xl border border-primary/30 bg-surface/90 p-4 space-y-4 shadow-lg text-xs"
          dir="rtl"
        >
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h4 className="font-black text-sm flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> فلاتر البحث المتقدم
            </h4>
            <button
              onClick={handleResetFilters}
              className="text-muted-foreground hover:text-primary underline text-[11px]"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground" htmlFor="search-cat-select">
                التصنيف:
              </label>
              <select
                id="search-cat-select"
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2 font-bold focus:outline-none"
              >
                <option value="all">جميع التصنيفات</option>
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground" htmlFor="search-min-price">
                نطاق السعر (ريال):
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="search-min-price"
                  type="number"
                  placeholder="الحد الأقل"
                  value={minPrice || ""}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-xl border border-border bg-background p-2 font-bold focus:outline-none"
                />
                <span>-</span>
                <input
                  id="search-max-price"
                  type="number"
                  placeholder="الحد الأعلى"
                  value={maxPrice || ""}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-xl border border-border bg-background p-2 font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Special Toggles */}
            <div className="flex items-center gap-3 pt-4 sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={dealsOnly}
                  onChange={(e) => setDealsOnly(e.target.checked)}
                  className="rounded accent-primary h-4 w-4"
                />
                <Tag className="h-3.5 w-3.5 text-warning" /> العروض والصفقات فقط
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4 sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded accent-primary h-4 w-4"
                />
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> المتوفر في المخزون فقط
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {errorMsg ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm font-bold text-destructive">{errorMsg}</p>
          <button
            onClick={() => {
              setErrorMsg(null);
              setSearchState("loading");
              searchProductsAdvanced({
                search: q,
                categoryId: selectedCat,
                minPrice,
                maxPrice,
                dealsOnly,
                inStockOnly,
                sortBy,
              })
                .then((data) => {
                  setResults(data);
                  setSearchState("done");
                })
                .catch((error: unknown) => {
                  setErrorMsg(error instanceof Error ? error.message : "تعذر إكمال البحث.");
                  setSearchState("error");
                });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" /> إعادة المحاولة
          </button>
        </div>
      ) : searchState === "loading" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      ) : q.trim() && results.length === 0 ? (
        <div className="space-y-8">
          <div
            role="status"
            aria-live="polite"
            className="rounded-3xl border border-showcase-border/50 bg-showcase-foreground/5 backdrop-blur-md p-8 sm:p-12 text-center space-y-4"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-showcase-foreground/10 text-showcase-muted">
              <PackageX className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-black text-showcase-foreground">
                لم نجد منتجًا مطابقًا لـ «{q}»
              </p>
              <p className="text-xs text-showcase-muted">
                تأكد من صحة كلمة البحث، أو اختَر أحد التصنيفات السريعة أدناه:
              </p>
            </div>

            {/* Quick Category Suggestions in Empty State */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {categoriesList.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCat(cat.id);
                    setQ("");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-showcase-foreground hover:bg-primary/20 hover:border-primary/40 transition"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          {recommendations.length > 0 && (
            <section aria-label="قد يناسبك أيضًا" className="space-y-4">
              <h2 className="text-base font-semibold">قد يناسبك أيضًا</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {recommendations.map((product) => (
                  <ProductCard key={product.id} product={product as unknown as Product} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p as unknown as Product} />
          ))}
        </div>
      )}
    </div>
  );
}
