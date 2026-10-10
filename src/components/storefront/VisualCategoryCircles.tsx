import { useQuery } from "@tanstack/react-query";
import {
  Baby,
  BriefcaseBusiness,
  Camera,
  Car,
  Dumbbell,
  Gift,
  Grid3X3,
  Home,
  Package,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { categoriesQuery } from "@/lib/queries/catalog";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import type { Product } from "./types";

interface VisualCategoryCirclesProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  products?: Product[];
}

const iconForCategory = (id: string, name: string): LucideIcon => {
  const value = `${id} ${name}`.toLowerCase();
  if (/سيار|automotive|auto/.test(value)) return Car;
  if (/منزل|مطبخ|kitchen|home|storage/.test(value)) return Home;
  if (/صحة|جمال|عناية|beauty|health/.test(value)) return Sparkles;
  if (/رياض|لياقة|sport|fitness/.test(value)) return Dumbbell;
  if (/أطفال|ألعاب|kids|toy|baby/.test(value)) return Baby;
  if (/أدوات|معدات|tool|hardware/.test(value)) return Wrench;
  if (/كامير|أمن|camera|security/.test(value)) return Camera;
  if (/مكتب|قرطاس|office/.test(value)) return BriefcaseBusiness;
  if (/هدايا|هوايات|gift|hobb/.test(value)) return Gift;
  if (/أزياء|حقائب|fashion|bag/.test(value)) return ShoppingBag;
  if (/إلكترون|هواتف|electronic|phone/.test(value)) return Smartphone;
  return Package;
};

const categoryTerms = (id: string): string[] => {
  const normalized = id.toLowerCase();
  const aliases: Record<string, string[]> = {
    "السيارات-وملحقاتها": ["automotive", "auto", "سيارات"],
    "المنزل-والمطبخ": ["kitchen", "home", "storage", "منزل", "مطبخ"],
    "الصحة-والجمال": ["beauty", "health", "care", "صحة", "جمال"],
    "الأدوات-والمعدات": ["tools", "hardware", "أدوات", "معدات"],
    "الإلكترونيات-والهواتف": ["electronics", "phone", "إلكترون", "هواتف"],
    "الرياضة-واللياقة": ["sports", "fitness", "رياض", "لياقة"],
    "الألعاب-والأطفال": ["kids", "toys", "baby", "أطفال", "ألعاب"],
  };
  return [normalized, ...(aliases[normalized] ?? [])];
};

const categoryProduct = (products: Product[], categoryId: string): Product | undefined => {
  if (categoryId === "all") return products.find((product) => product.image);
  const terms = categoryTerms(categoryId);
  return products.find((product) => {
    const value = product.category.toLowerCase();
    return terms.some((term) => value === term || value.includes(term));
  });
};

export function VisualCategoryCircles({
  selectedCategoryId,
  onSelectCategory,
  products = [],
}: VisualCategoryCirclesProps) {
  const isBrowser = useClientHydrated();
  const query = useQuery({
    ...categoriesQuery(),
    enabled: isBrowser,
  });
  const categories = [
    { id: "all", name: "كل المنتجات", imageUrl: null },
    ...(query.data ?? [])
      .filter((category) => category.id !== "all")
      .map((category) => ({
        id: category.id,
        name: category.id === "frontpage" ? "مختارات المتجر" : category.name,
        imageUrl: category.imageUrl ?? null,
      })),
  ];

  return (
    <section className="ix-template-categories" aria-labelledby="ix-template-categories-title">
      <div className="ix-template-section-heading">
        <div>
          <h2 id="ix-template-categories-title">تصفح الأقسام</h2>
          <p>الأقسام الفعلية المسجلة في كتالوج المتجر</p>
        </div>
      </div>

      {!isBrowser || query.isLoading ? (
        <div className="ix-template-category-grid" aria-label="جارٍ تحميل الأقسام">
          {Array.from({ length: 6 }, (_, index) => (
            <span className="ix-template-category-skeleton" key={index} />
          ))}
        </div>
      ) : (
        <div className="ix-template-category-grid">
          {categories.map((category, index) => {
            const selected = selectedCategoryId === category.id;
            const product = categoryProduct(products, category.id);
            const image = category.imageUrl || product?.image;
            const Icon =
              category.id === "all" ? Grid3X3 : iconForCategory(category.id, category.name);

            return (
              <button
                type="button"
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                aria-pressed={selected}
                className={`ix-template-category-card ix-template-category-card--${(index % 6) + 1}${selected ? " is-selected" : ""}`}
              >
                <span className="ix-template-category-card__media" aria-hidden="true">
                  {image ? <img src={image} alt="" loading="lazy" /> : <Icon />}
                </span>
                <strong>{category.name}</strong>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
