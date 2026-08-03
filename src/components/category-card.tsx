import { Link } from "@tanstack/react-router";
import { Eye, Package, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { OptimizedImage } from "@/components/optimized-image";
import type { LegacyCategoryShape } from "@/lib/data-adapter";

type ExtendedCategory = {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  image_url?: string | null;
  products_count?: number;
  count?: number;
  badge?: string;
  is_new?: boolean;
};

export interface CategoryCardProps {
  category: LegacyCategoryShape | ExtendedCategory;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const reducedMotion = useReducedMotion();
  const imageUrl = category.imageUrl || ("image_url" in category ? category.image_url : null) || "";
  const count =
    ("products_count" in category ? category.products_count : undefined) ??
    ("count" in category ? category.count : undefined) ??
    null;
  const description =
    ("description" in category ? category.description : undefined) ||
    "تشكيلة واسعة بأفضل الأسعار والعروض";
  const badge =
    ("badge" in category ? category.badge : undefined) ||
    ("is_new" in category && category.is_new ? "جديد" : null);

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={reducedMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group relative h-full w-full overflow-hidden rounded-[30px] border border-violet-400/20 bg-[#080d1a] p-2 shadow-[0_22px_70px_rgba(0,0,0,0.34)] transition-colors hover:border-violet-400/55"
    >
      <Link to="/category/$id" params={{ id: category.id }} className="flex h-full flex-col">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] bg-[#040713]">
          {imageUrl ? (
            <OptimizedImage
              src={imageUrl}
              alt={category.name}
              size="large"
              className="h-full w-full transition-transform duration-500 group-hover:scale-[1.025]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.28),transparent_56%),linear-gradient(135deg,#11102a,#050815)] text-violet-300">
              <Package className="h-14 w-14" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080d1a] via-transparent to-transparent" />
          <span className="absolute start-4 top-4 grid h-12 w-12 place-items-center rounded-full border border-violet-300/25 bg-black/50 text-violet-200">
            <Package className="h-5 w-5" />
          </span>
          {badge && (
            <span className="absolute end-4 top-4 inline-flex items-center gap-1 rounded-full bg-violet-600/90 px-3 py-1 text-[10px] font-black text-white">
              <Sparkles className="h-3 w-3" />
              {badge}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-5 text-start">
          <div>
            <h3 className="text-xl font-black text-white transition-colors group-hover:text-violet-200 sm:text-2xl">
              {category.name}
            </h3>
            <span className="mt-2 block h-1 w-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" />
          </div>
          <p className="line-clamp-2 text-xs leading-6 text-slate-400">
            {count != null ? `+${count} منتج · ` : ""}
            {description}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 text-[11px] font-bold text-slate-200">
              <Eye className="h-4 w-4" />
              مشاهدة
            </span>
            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 text-[11px] font-bold text-violet-300">
              <Package className="h-4 w-4" />
              المنتجات
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
