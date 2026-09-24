import { AppShell as AstryxAppShell } from "@astryxdesign/core/AppShell";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Theme } from "@astryxdesign/core/theme";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Grid2X2, Heart, Home, Search, ShoppingCart, Tag, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useCart, useHydrateCart } from "@/lib/cart-store";
import { categoriesQuery } from "@/lib/queries/catalog";
import { useAppearance } from "@/components/appearance-provider";
import { SiteFooter } from "@/components/site-footer";
import { indexesStorefrontTheme } from "@/themes/indexes-storefront";

export function StorefrontBrand() {
  const { settings } = useAppearance();
  const name = settings.navigation.storeName || "اندكس ستور";
  return (
    <Link to="/" className="sf-brand" aria-label={`${name} - الرئيسية`}>
      <ShoppingCart aria-hidden="true" />
      <VStack as="span" gap={0}>
        <strong>{name}</strong>
        <small lang="en">INDEXES STORE</small>
      </VStack>
    </Link>
  );
}

function StorefrontHeader() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const hydrated = useHydrateCart();
  const items = useCart((state) => state.items);
  const count = hydrated ? items.reduce((sum, item) => sum + item.qty, 0) : 0;
  const { settings } = useAppearance();
  const { data: categories = [] } = useQuery(categoriesQuery());
  return (
    <header className="sf-header">
      <HStack className="sf-header-inner" align="center" gap={4}>
        <StorefrontBrand />
        <form
          role="search"
          className="sf-search"
          onSubmit={(event) => {
            event.preventDefault();
            void navigate({ to: "/search", search: { q: search.trim() } });
          }}
        >
          <input
            type="search"
            aria-label="البحث عن المنتجات"
            placeholder={settings.navigation.searchPlaceholder || "ابحث عن منتج..."}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" aria-label="تنفيذ البحث">
            <Search aria-hidden="true" />
          </button>
        </form>
        <HStack gap={3} align="center" className="sf-header-actions">
          <Link to="/account" className="sf-desktop-action">
            <User aria-hidden="true" />
            <span>حسابي</span>
          </Link>
          <Link to="/favorites" aria-label="المفضلة" className="sf-desktop-action">
            <Heart aria-hidden="true" />
          </Link>
          <Link to="/cart" className="sf-header-cart" aria-label={`السلة، ${count} منتجات`}>
            <ShoppingCart aria-hidden="true" />
            <span>{count}</span>
          </Link>
        </HStack>
      </HStack>
      <nav aria-label="فئات المتجر" className="sf-category-nav">
        <HStack className="sf-category-inner" gap={1} align="center">
          <Link to="/categories" className="sf-all-categories">
            <Grid2X2 aria-hidden="true" />
            جميع الأقسام
          </Link>
          {categories.map((category) => (
            <Link key={category.id} to="/category/$id" params={{ id: category.id }}>
              {category.name}
            </Link>
          ))}
        </HStack>
      </nav>
    </header>
  );
}

function StorefrontBottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const links = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/categories", label: "الأقسام", icon: Grid2X2 },
    { to: "/offers", label: "العروض", icon: Tag },
    { to: "/favorites", label: "المفضلة", icon: Heart },
    { to: "/account", label: "حسابي", icon: User },
  ] as const;
  return (
    <nav className="sf-bottom-nav" aria-label="التنقل الرئيسي">
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          aria-current={
            pathname === to || (to === "/categories" && pathname.startsWith("/category/"))
              ? "page"
              : undefined
          }
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Theme theme={indexesStorefrontTheme} mode="light">
      <VStack className="sf-store" dir="rtl" gap={0}>
        <AstryxAppShell
          height="auto"
          variant="surface"
          contentPadding={0}
          topNav={<StorefrontHeader />}
          mobileNav={false}
        >
          {children}
          <SiteFooter />
        </AstryxAppShell>
        <StorefrontBottomNav />
      </VStack>
    </Theme>
  );
}
