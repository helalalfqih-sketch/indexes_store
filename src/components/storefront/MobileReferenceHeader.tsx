import { useQuery } from "@tanstack/react-query";
import { Bell, Heart, Menu, Search, ShoppingCart } from "lucide-react";
import { categoriesQuery } from "@/lib/queries/catalog";

interface MobileReferenceHeaderProps {
  selectedCategory?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSubmitSearch?: () => void;
  cartCount: number;
  unreadNotificationsCount: number;
  onOpenCart: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu: () => void;
  onOpenWishlist?: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

export function MobileReferenceHeader({
  selectedCategory = "all",
  searchQuery,
  onSearchChange,
  onSubmitSearch,
  cartCount,
  unreadNotificationsCount,
  onOpenCart,
  onOpenNotifications,
  onOpenMenu,
  onOpenWishlist,
  onSelectCategory,
}: MobileReferenceHeaderProps) {
  const isBrowser = typeof window !== "undefined";
  const { data: categoryRows = [] } = useQuery({
    ...categoriesQuery(),
    enabled: isBrowser,
  });
  const categories = [
    { id: "all", label: "الكل" },
    ...categoryRows
      .filter((category) => category.id !== "all")
      .map((category) => ({
        id: category.id,
        label: category.id === "frontpage" ? "مختارات المتجر" : category.name,
      })),
  ];

  return (
    <header className="ix-template-mobile-header md:hidden" dir="rtl">
      <div className="ix-template-mobile-header__bar">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="القائمة"
          className="ix-template-mobile-header__icon"
        >
          <Menu aria-hidden="true" />
        </button>

        <a href="/" className="ix-template-mobile-header__brand" aria-label="اندكس ستور - الرئيسية">
          <strong>
            indexes <span>Store</span>
          </strong>
        </a>

        <div className="ix-template-mobile-header__actions">
          {onOpenWishlist && (
            <button type="button" onClick={onOpenWishlist} aria-label="المفضلة">
              <Heart aria-hidden="true" />
            </button>
          )}
          {onOpenNotifications && (
            <button type="button" onClick={onOpenNotifications} aria-label="الإشعارات">
              <Bell aria-hidden="true" />
              {unreadNotificationsCount > 0 && (
                <span className="ix-template-mobile-header__dot" aria-hidden="true" />
              )}
            </button>
          )}
          <button type="button" onClick={onOpenCart} aria-label="سلة التسوق">
            <ShoppingCart aria-hidden="true" />
            {cartCount > 0 && <span className="ix-template-mobile-header__count">{cartCount}</span>}
          </button>
        </div>
      </div>

      <form
        className="ix-template-mobile-header__search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitSearch?.();
        }}
      >
        <Search aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmitSearch?.();
            }
          }}
          placeholder="ابحث عن منتج أو قسم أو علامة تجارية..."
          aria-label="البحث عن المنتجات"
        />
        <button type="submit" aria-label="تنفيذ البحث">
          بحث
        </button>
      </form>

      <p className="ix-template-mobile-header__tagline">
        كل ما تحتاجه لمنزلك وسيارتك والعناية الشخصية
      </p>

      <nav className="ix-template-mobile-header__quick" aria-label="أقسام المتجر">
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            aria-current={category.id === selectedCategory ? "page" : undefined}
            onClick={() => onSelectCategory?.(category.id)}
            className={category.id === selectedCategory ? "is-active" : undefined}
          >
            {category.label}
          </button>
        ))}
        <button type="button" onClick={onOpenMenu} aria-label="عرض جميع الفئات">
          جميع الأقسام
        </button>
      </nav>
    </header>
  );
}
