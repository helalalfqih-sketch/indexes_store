import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, CheckCircle2, ShoppingBag, Tag } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/store-data";
import { fetchProductsByIds } from "@/lib/actions/product.actions";
import type { LegacyProductShape } from "@/lib/data-adapter";

// ---------- Types ----------

interface CheckoutSearch {
  products?: string;
  coupon?: string;
}

/**
 * Parse the Meta Commerce `products` query parameter.
 * Format: "id1:qty1,id2:qty2" — quantities default to 1 when omitted or invalid.
 * Returns an empty array for a missing or blank param (not an error).
 */
function parseProductsParam(raw: string | undefined): Array<{ id: string; qty: number }> {
  if (!raw) return [];
  try {
    const decoded = decodeURIComponent(raw);
    return decoded
      .split(",")
      .map((part) => {
        const colonIdx = part.indexOf(":");
        if (colonIdx !== -1) {
          const id = part.substring(0, colonIdx).trim();
          const qtyVal = parseInt(part.substring(colonIdx + 1).trim(), 10);
          return { id, qty: isNaN(qtyVal) || qtyVal <= 0 ? 1 : qtyVal };
        }
        const id = part.trim();
        return id ? { id, qty: 1 } : null;
      })
      .filter((x): x is { id: string; qty: number } => x !== null && x.id.length > 0);
  } catch {
    return [];
  }
}

// ---------- Route ----------

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    products: typeof search.products === "string" ? search.products : undefined,
    coupon: typeof search.coupon === "string" ? search.coupon : undefined,
  }),

  head: () => ({ meta: [{ title: "تأكيد الطلب — اندكس ستور" }] }),

  /**
   * Loader: parses IDs from the URL and fetches only those products from
   * Supabase via productsRepo. Never loads the full catalog. Never uses CSV.
   * Returns an empty array when no products param is present — the component
   * will then render the current cart contents or an empty-cart screen.
   */
  loader: async ({ location }) => {
    const rawSearch = location.search as Record<string, unknown>;
    const productsParam = typeof rawSearch.products === "string" ? rawSearch.products : undefined;

    const parsed = parseProductsParam(productsParam);
    if (parsed.length === 0) {
      return { resolvedProducts: [], parsedItems: [] };
    }

    const ids = parsed.map((p) => p.id);
    const products = await fetchProductsByIds(ids);

    return { resolvedProducts: products, parsedItems: parsed };
  },

  component: CheckoutBridgePage,
});

// ---------- Component ----------

function CheckoutBridgePage() {
  const { products: productsParam, coupon: couponParam } = Route.useSearch();
  const { resolvedProducts, parsedItems } = Route.useLoaderData();
  const navigate = useNavigate();

  const add = useCart((s) => s.add);
  const items = useCart((s) => s.items);

  // Build resolved items: pair each found product with the requested quantity.
  // Products not found in the DB are silently ignored (their id won't be in resolvedProducts).
  const resolvedItems: Array<{ product: LegacyProductShape; qty: number }> = resolvedProducts
    .map((product) => {
      const requested = parsedItems.find((p) => p.id === product.id || p.id === product.slug);
      return { product, qty: requested?.qty ?? 1 };
    })
    .filter((item) => item.product != null);

  // Auto-populate the cart once on mount.
  // If a product is already in the cart: add the requested quantity on top.
  // If not yet in cart: insert it.
  const cartPopulated = useRef(false);
  useEffect(() => {
    if (cartPopulated.current || resolvedItems.length === 0) return;
    cartPopulated.current = true;
    resolvedItems.forEach(({ product, qty }) => {
      add(product, qty);
    });
  }, [resolvedItems, add]);

  // ---------- No products param → show current cart or empty-cart screen ----------
  if (!productsParam) {
    if (items.length > 0) {
      // Redirect to cart page so the user can complete their existing order
      navigate({ to: "/cart", search: couponParam ? { coupon: couponParam } : undefined });
      return null;
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-black text-foreground">سلتك فارغة</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          لم يتم تحديد أي منتجات. ابدأ التسوق وأضف المنتجات لسلتك.
        </p>
        <Link
          to="/"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand"
        >
          <span>تصفح المنتجات</span>
        </Link>
      </div>
    );
  }

  // ---------- Products param present but nothing resolved from DB ----------
  // This means all IDs were invalid/not found. Still render a valid page (no redirect).
  if (resolvedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-black text-foreground">المنتجات غير متوفرة</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          المنتجات المطلوبة غير متاحة حالياً في متجرنا. يرجى التواصل معنا للمساعدة.
        </p>
        <Link
          to="/"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand"
        >
          <span>العودة للمتجر</span>
        </Link>
      </div>
    );
  }

  // ---------- Products resolved — show checkout preview ----------

  const subtotal = resolvedItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  const handleContinue = () => {
    navigate({
      to: "/cart",
      search: couponParam ? { coupon: couponParam } : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-4" dir="rtl">
      {/* Header Banner */}
      <section className="flex flex-col gap-1.5 rounded-3xl bg-surface p-5 shadow-card border border-primary/10">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <h1 className="text-md font-black">تم تجهيز طلبك بنجاح!</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          لقد قمنا باستيراد المنتجات المحددة من Meta. يرجى مراجعة تفاصيل طلبك أدناه للمتابعة إلى
          صفحة الدفع.
        </p>
      </section>

      {/* Product List Summary */}
      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-black border-b border-border/50 pb-2">المنتجات في هذا الطلب</h2>
        <ul className="flex flex-col gap-3">
          {resolvedItems.map(({ product, qty }) => (
            <li key={product.id} className="flex gap-3">
              <img
                src={product.image}
                alt={product.name}
                className="h-16 w-16 rounded-xl object-cover border border-border/50"
              />
              <div className="flex flex-1 flex-col justify-between py-0.5">
                <h3 className="line-clamp-2 text-xs font-bold leading-tight text-foreground">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>الكمية: {qty}</span>
                  <span className="font-bold text-primary">{formatPrice(product.price * qty)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Coupon Banner — display only, no discount calculation here */}
      {couponParam && (
        <section className="flex items-center justify-between gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-success">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="text-xs font-bold">
              كوبون الخصم مُفعَّل: <span className="font-mono">{couponParam}</span>
            </span>
          </div>
          <span className="text-xs text-success/70">يُطبَّق في صفحة السلة</span>
        </section>
      )}

      {/* Order Summary Billing */}
      <section className="rounded-2xl bg-surface p-4 shadow-card">
        <h2 className="text-sm font-black border-b border-border/50 pb-2 mb-3">تفاصيل الحساب</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>المجموع الفرعي</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {couponParam && (
            <div className="flex items-center justify-between text-xs text-success font-medium">
              <span>كوبون الخصم ({couponParam})</span>
              <span>يُحسب في السلة</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>تكلفة الشحن</span>
            <span className="text-success font-medium">يتم الاتفاق عليه</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-bold">الإجمالي التقريبي</span>
            <span className="text-md font-black text-primary">{formatPrice(subtotal)}</span>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={handleContinue}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground shadow-brand transition-transform hover:scale-[1.01]"
        >
          <ShoppingBag className="h-5 w-5" />
          متابعة إتمام الطلب
          <ArrowRight className="h-4 w-4" />
        </button>

        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-2xl bg-muted py-3 text-xs font-bold text-muted-foreground hover:bg-muted/80"
        >
          إلغاء والعودة للمتجر
        </Link>
      </div>
    </div>
  );
}
