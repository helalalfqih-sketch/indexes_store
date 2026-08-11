import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  ArrowLeftRight,
  ShoppingCart,
  Trash2,
  Star,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  Plus,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  MinusCircle,
  Layers,
  Info,
} from "lucide-react";
import { Product, Currency } from "./types";
import { formatPrice } from "./currency";

interface ProductCompareModalProps {
  products?: Product[];
  compareList: Product[];
  currency: Currency;
  isOpen: boolean;
  onClose: () => void;
  onRemoveFromCompare: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onReorderCompareList?: (newOrder: Product[]) => void;
  onAddToCompare?: (product: Product) => void;
}

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  products = [],
  compareList,
  currency,
  isOpen,
  onClose,
  onRemoveFromCompare,
  onAddToCart,
  onReorderCompareList,
  onAddToCompare,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [highlightDiffs, setHighlightDiffs] = useState<boolean>(true);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState<boolean>(false);
  const [selectedAddProductId, setSelectedAddProductId] = useState<string>("");

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= compareList.length) return;
    const updated = [...compareList];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    if (onReorderCompareList) {
      onReorderCompareList(updated);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    handleMove(draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Collect all unique technical spec keys across all compared products
  const allSpecKeys = useMemo(() => {
    const keysSet = new Set<string>();
    compareList.forEach((product) => {
      if (product.specs) {
        Object.keys(product.specs).forEach((key) => keysSet.add(key));
      }
    });
    return Array.from(keysSet);
  }, [compareList]);

  // Check if a specific technical spec differs across compared products
  const isSpecDifferent = (specKey: string) => {
    if (compareList.length <= 1) return false;
    const firstVal = compareList[0]?.specs?.[specKey] || "";
    return compareList.some((p) => (p.specs?.[specKey] || "") !== firstVal);
  };

  // Check if standard spec fields differ
  const isPriceDifferent = useMemo(() => {
    if (compareList.length <= 1) return false;
    const first = compareList[0]?.priceYER;
    return compareList.some((p) => p.priceYER !== first);
  }, [compareList]);

  const isRatingDifferent = useMemo(() => {
    if (compareList.length <= 1) return false;
    const first = compareList[0]?.rating;
    return compareList.some((p) => p.rating !== first);
  }, [compareList]);

  const isStockDifferent = useMemo(() => {
    if (compareList.length <= 1) return false;
    const first = compareList[0]?.inStock;
    return compareList.some((p) => p.inStock !== first);
  }, [compareList]);

  const isCategoryDifferent = useMemo(() => {
    if (compareList.length <= 1) return false;
    const first = compareList[0]?.category;
    return compareList.some((p) => p.category !== first);
  }, [compareList]);

  // Filter products available to be added to comparison
  const availableToAdd = useMemo(() => {
    const existingIds = new Set(compareList.map((p) => p.id));
    return products.filter((p) => !existingIds.has(p.id));
  }, [products, compareList]);

  const handleAddSelectedProduct = (productId: string) => {
    if (!productId) return;
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      if (onAddToCompare) {
        onAddToCompare(prod);
      } else if (onReorderCompareList) {
        onReorderCompareList([...compareList, prod]);
      }
    }
    setSelectedAddProductId("");
  };

  // Filtered spec keys when showOnlyDiffs is active
  const displayedSpecKeys = showOnlyDiffs
    ? allSpecKeys.filter((key) => isSpecDifferent(key))
    : allSpecKeys;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="compare-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md"
        >
          <motion.div
            key="compare-modal-content"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0d0f12] border border-white/10 rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl dir-rtl"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#12151a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      مقارنة المنتجات والمواصفات الفنية
                    </h2>
                    <span className="text-[11px] bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold px-2.5 py-0.5 rounded-full">
                      {compareList.length} منتجات
                    </span>
                  </div>
                  <p className="text-xs text-[#A7ADB7] mt-0.5">
                    جدول مقارنة تفصيلي جانبي للمواصفات التقنية والأسعار والتقييمات
                  </p>
                </div>
              </div>

              {/* Controls & Options */}
              <div className="flex items-center gap-2 flex-wrap">
                {compareList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setHighlightDiffs(!highlightDiffs)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                        highlightDiffs
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs"
                          : "bg-white/5 text-[#A7ADB7] border-white/10 hover:text-white"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{highlightDiffs ? "إلغاء تمييز الفروقات" : "تمييز الفروقات"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOnlyDiffs(!showOnlyDiffs)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                        showOnlyDiffs
                          ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20"
                          : "bg-white/5 text-[#A7ADB7] border-white/10 hover:text-white"
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{showOnlyDiffs ? "عرض الكل" : "الاختلافات فقط"}</span>
                    </button>
                  </>
                )}

                <button
                  onClick={onClose}
                  aria-label="إغلاق"
                  className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-[#A7ADB7] hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comparison Body / Table */}
            <div className="p-3 sm:p-5 overflow-x-auto flex-1 no-scrollbar space-y-4">
              {compareList.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#717784]">
                    <ArrowLeftRight className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    لا توجد منتجات بالمقارنة حالياً
                  </h3>
                  <p className="text-xs text-[#A7ADB7] max-w-sm mx-auto">
                    يمكنك إضافة أي منتج إلى قائمة المقارنة بالنقر على زر المقارنة من تفاصيل أو كروت
                    المنتجات.
                  </p>

                  {/* Quick Add Product Dropdown */}
                  {availableToAdd.length > 0 && (
                    <div className="pt-2 max-w-xs mx-auto">
                      <select
                        value=""
                        onChange={(e) => handleAddSelectedProduct(e.target.value)}
                        className="w-full bg-[#161a21] text-xs text-white border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="" disabled>
                          + أضف منتجاً لبدء المقارنة...
                        </option>
                        {availableToAdd.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatPrice(p.priceYER, currency)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto border border-white/10 rounded-2xl bg-[#12151a]">
                  <table className="w-full text-right border-collapse min-w-[700px]">
                    <thead>
                      {/* Product Header Row */}
                      <tr className="border-b border-white/10 bg-[#161a21]">
                        <th className="p-4 w-44 sm:w-52 sticky right-0 z-30 bg-[#161a21] border-l border-white/10 shadow-lg align-top">
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                              <Layers className="w-4 h-4" />
                              المواصفات الفنية
                            </span>
                            <h3 className="text-sm font-extrabold text-white">ماتريكس المقارنة</h3>
                            <p className="text-[11px] text-[#A7ADB7]">اسحب الأعمدة لترتيب العرض</p>

                            {/* Add Product Dropdown inside Table Header */}
                            {availableToAdd.length > 0 && compareList.length < 4 && (
                              <div className="pt-2">
                                <select
                                  value={selectedAddProductId}
                                  onChange={(e) => handleAddSelectedProduct(e.target.value)}
                                  className="w-full bg-[#1c212b] text-[11px] text-blue-300 font-bold border border-blue-500/30 rounded-xl px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                  <option value="">+ إضافة منتج...</option>
                                  {availableToAdd.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </th>

                        {/* Product Column Headers */}
                        {compareList.map((product, index) => {
                          const isBeingDragged = draggedIndex === index;
                          const isTargetOver = dragOverIndex === index && draggedIndex !== index;

                          return (
                            <th
                              key={product.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDrop={(e) => handleDrop(e, index)}
                              onDragEnd={() => {
                                setDraggedIndex(null);
                                setDragOverIndex(null);
                              }}
                              className={`p-3.5 min-w-[200px] w-64 align-top transition-all duration-200 border-l border-white/5 relative ${
                                isBeingDragged
                                  ? "opacity-40 bg-blue-950/20"
                                  : isTargetOver
                                    ? "bg-blue-900/30 ring-2 ring-blue-500/50"
                                    : "hover:bg-white/[0.02]"
                              }`}
                            >
                              {/* Drag & Controls bar */}
                              <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-2 py-1 text-xs text-[#A7ADB7] mb-2.5">
                                <div className="flex items-center gap-1 text-blue-400 font-bold text-[11px] cursor-grab active:cursor-grabbing select-none">
                                  <GripVertical className="w-3.5 h-3.5" />
                                  <span>ترتيب ({index + 1})</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMove(index, index - 1)}
                                      title="تحريك لليمين"
                                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                                    >
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}
                                  {index < compareList.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMove(index, index + 1)}
                                      title="تحريك لليسار"
                                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                                    >
                                      <ChevronLeft className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onRemoveFromCompare(product.id)}
                                    title="إزالة من المقارنة"
                                    className="p-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Product Info Card */}
                              <div className="space-y-2 text-center">
                                <div className="w-full h-32 bg-[#181c22] rounded-xl p-2 flex items-center justify-center border border-white/5 relative group">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                  {product.discountBadge && (
                                    <span className="absolute top-1.5 right-1.5 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                      {product.discountBadge}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-extrabold text-xs sm:text-sm text-white line-clamp-2 h-9 flex items-center justify-center">
                                  {product.name}
                                </h4>
                                <p className="text-[11px] text-[#A7ADB7] line-clamp-1">
                                  {product.subtitle}
                                </p>

                                {/* Add to cart button */}
                                <button
                                  type="button"
                                  onClick={() => onAddToCart(product, 1)}
                                  className="w-full bg-[#2F6BFF] hover:bg-[#2458D8] text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-97 cursor-pointer mt-2"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span>إضافة للسلة</span>
                                </button>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    <tbody>
                      {/* SECTION: المعلومات العامة والأساسية */}
                      <tr className="bg-white/5 border-y border-white/10">
                        <td
                          colSpan={compareList.length + 1}
                          className="px-4 py-2 text-xs font-bold text-blue-400 bg-[#181d26]"
                        >
                          📌 المعلومات العامة والأساسية
                        </td>
                      </tr>

                      {/* Row: Price */}
                      {(!showOnlyDiffs || isPriceDifferent) && (
                        <tr
                          className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                            highlightDiffs && isPriceDifferent ? "bg-amber-500/5" : ""
                          }`}
                        >
                          <td className="p-3 text-xs font-bold text-[#A7ADB7] sticky right-0 z-20 bg-[#12151a] border-l border-white/10">
                            السعر الحالي
                          </td>
                          {compareList.map((product) => (
                            <td
                              key={`price-${product.id}`}
                              className="p-3 text-center border-l border-white/5"
                            >
                              <div className="font-extrabold text-blue-400 text-sm">
                                {formatPrice(product.priceYER, currency)}
                              </div>
                              {product.originalPriceYER > product.priceYER && (
                                <div className="text-[11px] text-[#A7ADB7] line-through mt-0.5">
                                  {formatPrice(product.originalPriceYER, currency)}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Row: Rating */}
                      {(!showOnlyDiffs || isRatingDifferent) && (
                        <tr
                          className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                            highlightDiffs && isRatingDifferent ? "bg-amber-500/5" : ""
                          }`}
                        >
                          <td className="p-3 text-xs font-bold text-[#A7ADB7] sticky right-0 z-20 bg-[#12151a] border-l border-white/10">
                            التقييم
                          </td>
                          {compareList.map((product) => (
                            <td
                              key={`rating-${product.id}`}
                              className="p-3 text-center border-l border-white/5"
                            >
                              <span className="font-bold text-amber-400 text-xs inline-flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                {product.rating} ({product.reviewsCount})
                              </span>
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Row: Stock Status */}
                      {(!showOnlyDiffs || isStockDifferent) && (
                        <tr
                          className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                            highlightDiffs && isStockDifferent ? "bg-amber-500/5" : ""
                          }`}
                        >
                          <td className="p-3 text-xs font-bold text-[#A7ADB7] sticky right-0 z-20 bg-[#12151a] border-l border-white/10">
                            حالة التوفر
                          </td>
                          {compareList.map((product) => (
                            <td
                              key={`stock-${product.id}`}
                              className="p-3 text-center border-l border-white/5"
                            >
                              <span
                                className={`text-[11px] font-bold inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${
                                  product.inStock !== false
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {product.inStock !== false ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>متوفر بالمخزن</span>
                                  </>
                                ) : (
                                  <>
                                    <MinusCircle className="w-3.5 h-3.5" />
                                    <span>غير متوفر حالياً</span>
                                  </>
                                )}
                              </span>
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Row: Category */}
                      {(!showOnlyDiffs || isCategoryDifferent) && (
                        <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 text-xs font-bold text-[#A7ADB7] sticky right-0 z-20 bg-[#12151a] border-l border-white/10">
                            الفئة
                          </td>
                          {compareList.map((product) => (
                            <td
                              key={`cat-${product.id}`}
                              className="p-3 text-center border-l border-white/5 text-xs text-white/90"
                            >
                              <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                                {product.category}
                              </span>
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Row: Colors */}
                      <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 text-xs font-bold text-[#A7ADB7] sticky right-0 z-20 bg-[#12151a] border-l border-white/10">
                          الألوان المتاحة
                        </td>
                        {compareList.map((product) => (
                          <td
                            key={`colors-${product.id}`}
                            className="p-3 text-center border-l border-white/5"
                          >
                            {product.colors && product.colors.length > 0 ? (
                              <div className="flex items-center justify-center gap-1.5">
                                {product.colors.map((c, i) => (
                                  <span
                                    key={i}
                                    className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs"
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-[#717784]">—</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* SECTION: المواصفات الفنية التفصيلية (Technical Specs) */}
                      <tr className="bg-white/5 border-y border-white/10">
                        <td
                          colSpan={compareList.length + 1}
                          className="px-4 py-2 text-xs font-bold text-amber-400 bg-[#181d26]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-400" />
                              المواصفات الفنية التفصيلية (Technical Specs Matrix)
                            </span>
                            <span className="text-[10px] text-[#A7ADB7]">
                              {displayedSpecKeys.length} خاصية تقنية
                            </span>
                          </div>
                        </td>
                      </tr>

                      {displayedSpecKeys.length === 0 ? (
                        <tr>
                          <td
                            colSpan={compareList.length + 1}
                            className="p-6 text-center text-xs text-[#717784]"
                          >
                            {showOnlyDiffs
                              ? "جميع المواصفات الفنية متطابقة بين المنتجات المحددة."
                              : "لا توجد مواصفات فنية تفصيلية مسجلة لهذه المنتجات."}
                          </td>
                        </tr>
                      ) : (
                        displayedSpecKeys.map((specKey) => {
                          const isDiff = isSpecDifferent(specKey);
                          return (
                            <tr
                              key={`spec-${specKey}`}
                              className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                                highlightDiffs && isDiff ? "bg-blue-500/5" : ""
                              }`}
                            >
                              <td className="p-3 text-xs font-bold text-white/90 sticky right-0 z-20 bg-[#12151a] border-l border-white/10">
                                <div className="flex items-center justify-between gap-1">
                                  <span>{specKey}</span>
                                  {highlightDiffs && isDiff && (
                                    <span
                                      className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                                      title="يوجد اختلاف في هذه الخاصية"
                                    />
                                  )}
                                </div>
                              </td>
                              {compareList.map((product) => {
                                const specVal = product.specs?.[specKey];
                                return (
                                  <td
                                    key={`spec-${specKey}-${product.id}`}
                                    className="p-3 text-center border-l border-white/5 text-xs"
                                  >
                                    {specVal ? (
                                      <span
                                        className={`font-semibold ${isDiff && highlightDiffs ? "text-blue-300 font-bold" : "text-white/80"}`}
                                      >
                                        {specVal}
                                      </span>
                                    ) : (
                                      <span className="text-[#717784] text-[11px]">
                                        — غير محدد —
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}

                      {/* SECTION: الوصف والملخص */}
                      <tr className="bg-white/5 border-y border-white/10">
                        <td
                          colSpan={compareList.length + 1}
                          className="px-4 py-2 text-xs font-bold text-[#A7ADB7] bg-[#181d26]"
                        >
                          📝 الوصف والملخص
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="p-3 text-xs font-bold text-[#A7ADB7] sticky right-0 z-20 bg-[#12151a] border-l border-white/10">
                          الوصف
                        </td>
                        {compareList.map((product) => (
                          <td
                            key={`desc-${product.id}`}
                            className="p-3 text-right border-l border-white/5 text-xs text-[#A7ADB7] leading-relaxed"
                          >
                            <p className="line-clamp-4">{product.description}</p>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
