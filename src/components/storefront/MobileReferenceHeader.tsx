import React from "react";
import { Bell, Camera, ChevronDown, Heart, Mail, Search, ShoppingCart } from "lucide-react";

interface MobileReferenceHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSubmitSearch?: () => void;
  cartCount: number;
  unreadNotificationsCount: number;
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

const categories = [
  { id: "all", label: "كل" },
  { id: "women", label: "نساء" },
  { id: "home_appliances", label: "المنزل + الحيوانات الأليفة" },
  { id: "men", label: "رجال" },
  { id: "accessories", label: "مجوهرات وإكسسوارات" },
];

export const MobileReferenceHeader: React.FC<MobileReferenceHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSubmitSearch,
  cartCount,
  unreadNotificationsCount,
  onOpenCart,
  onOpenNotifications,
  onOpenMenu,
  onSelectCategory,
}) => {
  return (
    <header
      className="sticky top-0 z-40 hidden border-b border-white/10 bg-black text-white shadow-[0_1px_5px_rgba(0,0,0,0.22)] md:hidden"
      dir="rtl"
    >
      <div className="flex h-12 items-center gap-1 px-2" dir="ltr">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="المفضلة"
          className="grid h-10 w-9 shrink-0 place-items-center text-white"
        >
          <Heart className="h-[21px] w-[21px] stroke-[1.8]" />
        </button>

        <div
          className="flex h-9 min-w-0 flex-1 items-center border border-white bg-white"
          dir="rtl"
        >
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmitSearch?.();
            }}
            placeholder="البحث"
            aria-label="البحث عن المنتجات"
            className="min-w-0 flex-1 bg-transparent px-2 text-right text-[12px] font-medium text-black outline-none placeholder:text-neutral-500"
          />
          <button
            type="button"
            onClick={onSubmitSearch}
            aria-label="تنفيذ البحث"
            className="grid h-9 w-9 shrink-0 place-items-center border-r border-neutral-200 text-black"
          >
            <Search className="h-[18px] w-[18px] stroke-[2]" />
          </button>
          <button
            type="button"
            aria-label="البحث بالكاميرا"
            className="grid h-9 w-8 shrink-0 place-items-center text-black"
          >
            <Camera className="h-[17px] w-[17px] stroke-[1.8]" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenCart}
          aria-label="السلة"
          className="relative grid h-10 w-9 shrink-0 place-items-center text-white"
        >
          <ShoppingCart className="h-[22px] w-[22px] stroke-[1.8]" />
          {cartCount > 0 && (
            <span className="absolute right-0 top-0 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#ff2442] px-0.5 text-[8px] font-black text-white">
              {cartCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="الإشعارات"
          className="relative grid h-10 w-9 shrink-0 place-items-center text-white"
        >
          <Bell className="h-[21px] w-[21px] stroke-[1.8]" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute right-0.5 top-1 h-2 w-2 rounded-full bg-[#ff2442]" />
          )}
        </button>
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="الرسائل والقائمة"
          className="grid h-10 w-8 shrink-0 place-items-center text-white"
        >
          <Mail className="h-[20px] w-[20px] stroke-[1.8]" />
        </button>
      </div>

      <nav
        className="flex h-9 items-end gap-5 overflow-x-auto border-t border-white/10 px-3 no-scrollbar"
        aria-label="أقسام المتجر"
      >
        {categories.map((category, index) => (
          <button
            type="button"
            key={category.id}
            onClick={() => onSelectCategory?.(category.id)}
            className={`relative h-9 shrink-0 whitespace-nowrap text-[11px] font-bold ${index === 0 ? "font-black text-white" : "text-white/75"}`}
          >
            {category.label}
            {index === 0 && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-white" />}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="عرض جميع الفئات"
          className="grid h-9 shrink-0 place-items-center text-white/80"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </nav>
    </header>
  );
};
