import React from "react";
import { Bell, CalendarDays, Camera, Heart, Mail, Menu, Search, ShoppingCart } from "lucide-react";
import type { Product } from "./types";

interface MobileReferenceHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  unreadNotificationsCount: number;
  products?: Product[];
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

const categories = [
  { id: "all", label: "كل" },
  { id: "home_appliances", label: "المنزل + الحيوانات الأليفة" },
  { id: "automotive", label: "رجال" },
  { id: "health_fitness", label: "الجمال والصحة" },
  { id: "perfumes", label: "مجوهرات وإكسسوارات" },
];

export const MobileReferenceHeader: React.FC<MobileReferenceHeaderProps> = ({
  searchQuery,
  onSearchChange,
  cartCount,
  unreadNotificationsCount,
  onOpenCart,
  onOpenNotifications,
  onOpenMenu,
  onSelectCategory,
}) => {
  return (
    <header className="md:hidden relative z-40 bg-[#7bb6dc] text-white shadow-sm" dir="rtl">
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <button
          type="button"
          aria-label="المفضلة"
          className="flex h-10 w-9 shrink-0 items-center justify-center"
          title="المفضلة"
        >
          <Heart className="h-7 w-7 stroke-[1.5]" />
        </button>

        <div className="flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-lg bg-white text-neutral-700 shadow-sm">
          <button
            type="button"
            aria-label="البحث"
            className="flex h-full w-12 shrink-0 items-center justify-center bg-white text-[#6aa8d2]"
          >
            <Search className="h-7 w-7" />
          </button>
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="ابحث عن منتج، قسم أو علامة"
            aria-label="ابحث عن منتج"
            className="min-w-0 flex-1 bg-transparent px-1 text-right text-xs text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            aria-label="البحث بالكاميرا"
            className="flex h-full w-10 shrink-0 items-center justify-center text-neutral-500"
          >
            <Camera className="h-6 w-6" />
          </button>
        </div>

        <button
          type="button"
          aria-label="التقويم"
          className="hidden h-10 w-9 shrink-0 items-center justify-center min-[360px]:flex"
        >
          <CalendarDays className="h-7 w-7 stroke-[1.5]" />
        </button>
        <button
          type="button"
          aria-label="الرسائل"
          className="hidden h-10 w-9 shrink-0 items-center justify-center min-[420px]:flex"
        >
          <Mail className="h-7 w-7 stroke-[1.5]" />
        </button>
      </div>

      <div className="flex items-center justify-between px-3 pb-2">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="القائمة"
          className="flex h-8 w-8 items-center justify-center"
        >
          <Menu className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="الإشعارات"
          className="relative flex h-8 w-8 items-center justify-center"
        >
          <Bell className="h-6 w-6" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-red-500" />
          )}
        </button>
        <button
          type="button"
          onClick={onOpenCart}
          aria-label="السلة"
          className="relative flex h-8 w-8 items-center justify-center"
        >
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <nav
        className="flex gap-5 overflow-x-auto border-t border-white/25 px-4 py-2 text-[13px] font-bold whitespace-nowrap no-scrollbar"
        aria-label="الأقسام السريعة"
      >
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            onClick={() => onSelectCategory?.(category.id)}
            className={`relative shrink-0 pb-1 ${category.id === "all" ? "border-b-4 border-white" : ""}`}
          >
            {category.label}
          </button>
        ))}
      </nav>
    </header>
  );
};
