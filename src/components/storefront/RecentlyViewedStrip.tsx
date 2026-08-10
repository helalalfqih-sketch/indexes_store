import React from "react";
import { Clock } from "lucide-react";
import type { Product, Currency } from "./types";
import { formatPrice } from "./currency";

interface RecentlyViewedStripProps {
  products: Product[];
  currency: Currency;
  onSelectProduct: (product: Product) => void;
  onClearHistory?: () => void;
}

export const RecentlyViewedStrip: React.FC<RecentlyViewedStripProps> = ({
  products,
  currency,
  onSelectProduct,
  onClearHistory,
}) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="dir-rtl border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/30 px-3 py-4 sm:px-6">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-[#2F6BFF]" />
          <h4 className="text-xs font-bold text-[var(--color-text-primary)] sm:text-sm">
            تابع من حيث توقفت
          </h4>
        </div>
        {onClearHistory ? (
          <button
            type="button"
            onClick={onClearHistory}
            className="cursor-pointer text-[10px] text-[var(--color-text-muted)] transition-colors hover:text-rose-400"
          >
            مسح السجل
          </button>
        ) : null}
      </div>

      <div
        className="no-scrollbar flex items-center gap-2.5 overflow-x-auto py-1"
        style={{ touchAction: "pan-x pan-y", scrollbarWidth: "none" }}
      >
        {products.map((product) => (
          <button
            type="button"
            key={product.id}
            onClick={() => onSelectProduct(product)}
            className="flex min-w-[170px] max-w-[210px] shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-1)] p-2 text-right transition-all hover:border-[#2F6BFF]/50 hover:scale-[1.02]"
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-10 w-10 shrink-0 rounded-lg bg-[var(--color-surface-2)] object-contain p-1"
            />
            <div className="overflow-hidden">
              <h5 className="line-clamp-1 text-[11px] font-bold text-[var(--color-text-primary)]">
                {product.name}
              </h5>
              <div className="mt-0.5 text-[11px] font-black text-[#2F6BFF]">
                {formatPrice(product.priceYER, currency)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
