import { ArrowLeft, BadgeDollarSign, Headphones, Truck } from "lucide-react";
import type { Currency, Product } from "./types";
import { OptimizedImage } from "@/components/optimized-image";

interface SheinPromoGridProps {
  products?: Product[];
  currency?: Currency;
  onShopNow: (categoryId?: string) => void;
  onSelectCategory?: (categoryId: string) => void;
  onSelectProduct?: (product: Product) => void;
}

const hasCatalogImage = (product: Product): boolean =>
  Boolean(product.image) && !product.image.includes("data:image/svg");

const matchesCategory = (product: Product, terms: string[]): boolean => {
  const category = product.category.toLowerCase();
  return terms.some((term) => category.includes(term));
};

export function SheinPromoGrid({
  products = [],
  onShopNow,
  onSelectCategory,
  onSelectProduct,
}: SheinPromoGridProps) {
  const availableProducts = products.filter(
    (product) => product.priceYER > 0 && product.inStock && hasCatalogImage(product),
  );
  const heroProducts = availableProducts.slice(0, 3);
  const automotiveProduct = availableProducts.find((product) =>
    matchesCategory(product, ["automotive", "سيارات", "السيارات"]),
  );
  const homeProduct = availableProducts.find((product) =>
    matchesCategory(product, ["kitchen", "storage", "home", "المنزل", "مطبخ"]),
  );

  const openCategory = (categoryId?: string) => {
    if (categoryId) onSelectCategory?.(categoryId);
    onShopNow(categoryId);
  };

  return (
    <section className="ix-template-showcase" aria-labelledby="ix-template-hero-title">
      <div className="ix-template-hero">
        <div className="ix-template-hero__copy">
          <p className="ix-template-hero__eyebrow">اختيارات ذكية لكل احتياجاتك</p>
          <h1 id="ix-template-hero-title">
            منتجات مختارة
            <br />
            لحياة أسهل
          </h1>
          <p className="ix-template-hero__description">
            مستلزمات المنزل والسيارات والعناية الشخصية والإلكترونيات في مكان واحد.
          </p>
          <button type="button" className="ix-template-hero__cta" onClick={() => openCategory()}>
            تسوق الآن
            <ArrowLeft aria-hidden="true" />
          </button>

          <ul className="ix-template-hero__trust" aria-label="مزايا الطلب">
            <li>
              <Truck aria-hidden="true" />
              <span>خيارات التوصيل عند الطلب</span>
            </li>
            <li>
              <BadgeDollarSign aria-hidden="true" />
              <span>السعر والتوفر من الكتالوج</span>
            </li>
            <li>
              <Headphones aria-hidden="true" />
              <span>دعم عبر واتساب</span>
            </li>
          </ul>
        </div>

        <div className="ix-template-hero__products" aria-label="منتجات مختارة">
          {heroProducts.map((product, index) => (
            <button
              type="button"
              key={product.id}
              className={`ix-template-hero__product ix-template-hero__product--${index + 1}`}
              onClick={() => onSelectProduct?.(product)}
              aria-label={`عرض ${product.name}`}
            >
              <OptimizedImage
                src={product.image}
                alt=""
                size="large"
                eager={index === 0}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      </div>

      {(automotiveProduct || homeProduct) && (
        <div className="ix-template-promos" aria-label="أقسام مختارة">
          {automotiveProduct && (
            <button
              type="button"
              className="ix-template-promo ix-template-promo--cars"
              onClick={() => openCategory(automotiveProduct.category)}
            >
              <OptimizedImage
                src={automotiveProduct.image}
                alt=""
                size="large"
                className="ix-template-promo__image"
              />
              <span className="ix-template-promo__overlay" aria-hidden="true" />
              <span className="ix-template-promo__content">
                <strong>مستلزمات السيارات</strong>
                <small>منتجات عملية لراحتك على الطريق</small>
                <b>تصفح القسم</b>
              </span>
            </button>
          )}
          {homeProduct && (
            <button
              type="button"
              className="ix-template-promo ix-template-promo--home"
              onClick={() => openCategory(homeProduct.category)}
            >
              <OptimizedImage
                src={homeProduct.image}
                alt=""
                size="large"
                className="ix-template-promo__image"
              />
              <span className="ix-template-promo__overlay" aria-hidden="true" />
              <span className="ix-template-promo__content">
                <strong>أدوات المنزل الذكية</strong>
                <small>حلول تساعدك في التنظيم والمهام اليومية</small>
                <b>تصفح القسم</b>
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
