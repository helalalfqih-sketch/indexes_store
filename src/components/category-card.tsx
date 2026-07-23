import { Link } from "@tanstack/react-router";
import { Eye, Package, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { OptimizedImage } from "@/components/optimized-image";
import type { LegacyCategoryShape } from "@/lib/data-adapter";

export interface CategoryCardProps {
  category: LegacyCategoryShape | {
    id: string;
    slug?: string;
    name: string;
    description?: string;
    imageUrl?: string;
    image_url?: string;
    products_count?: number;
    count?: number;
    badge?: string;
    is_new?: boolean;
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  const imageUrl = (category as any).imageUrl || (category as any).image_url || "";
  const count = (category as any).products_count ?? (category as any).count ?? 120;
  const description = (category as any).description || "تشكيلة واسعة بأفضل الأسعار والعروض";
  const badge = (category as any).badge || ((category as any).is_new ? "جديد" : null);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-[#091522]/80 backdrop-blur-xl p-3.5 shadow-2xl transition-all duration-300 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(56,189,248,0.25)]"
    >
      <Link
        to="/category/$id"
        params={{ id: category.id }}
        className="flex flex-col h-full justify-between gap-3"
      >
        {/* Top Image Cover Area */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/40">
          {imageUrl ? (
            <OptimizedImage
              src={imageUrl}
              alt={category.name}
              size="card"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-950/40 to-slate-900 text-cyan-400/60">
              <Package className="h-10 w-10 animate-pulse" />
            </div>
          )}

          {/* Top Badge (e.g. جديد) */}
          {badge && (
            <span className="absolute end-2 top-2 z-10 flex items-center gap-1 rounded-full bg-cyan-500/90 px-2.5 py-0.5 text-[10px] font-black text-cyan-950 shadow-md backdrop-blur-md">
              <Sparkles className="h-3 w-3 fill-cyan-950" />
              {badge}
            </span>
          )}

          {/* Bottom gradient overlay inside image */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        {/* Category Information */}
        <div className="flex flex-col gap-1 text-start px-1">
          <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
            {category.name}
          </h3>
          <p className="text-[11px] font-medium text-slate-400 line-clamp-1">
            +{count} منتج | {description}
          </p>
        </div>

        {/* Small Bottom Action Bar */}
        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 transition group-hover:bg-cyan-500/10 group-hover:text-cyan-300">
              <Eye className="h-3 w-3" />
              مشاهدة
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 transition group-hover:bg-white/10">
              <Package className="h-3 w-3" />
              منتجات
            </span>
          </div>

          <span className="text-[11px] font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
            استكشف ➔
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
