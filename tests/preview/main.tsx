import { UnifiedCartFlow as BeforeCart } from "./before/UnifiedCartFlow2";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { UnifiedCartFlow } from "@/components/storefront/UnifiedCartFlow2";
import { SheinPromoGrid } from "@/components/storefront/SheinPromoGrid";
import { FlashDealsSection } from "@/components/storefront/FlashDealsSection";
import type { Product } from "@/components/storefront/types";
import "@/styles.css";

const params = new URLSearchParams(location.search);
document.documentElement.classList.toggle("dark", params.get("theme") === "dark");
document.documentElement.dataset.theme = params.get("theme") || "light";
const svg =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#eeeeee"/><rect x="40" y="140" width="320" height="120" rx="15" fill="#333333"/><text x="200" y="210" fill="white" text-anchor="middle" font-size="20">SANDBOX</text></svg>',
  );
const products: Product[] = [14900, 21900].map((price, index) => ({
  id: index ? "22222222-2222-4222-8222-222222222222" : "11111111-1111-4111-8111-111111111111",
  name: index ? "سخان مياه — عينة اختبار" : "لوحة مفاتيح — عينة اختبار",
  slug: "fixture",
  priceYER: price,
  originalPriceYER: price,
  inStock: true,
  stockCount: 5,
  image: svg,
  rating: 0,
  reviewsCount: 0,
  category: "all",
  subtitle: "بيانات اختبار معزولة",
  description: "هذه المعاينة لا تنشئ طلباً حقيقياً.",
}));

export function Preview() {
  const Cart = params.get("version") === "before" ? BeforeCart : UnifiedCartFlow;
  const [items, setItems] = useState(products.map((product) => ({ product, quantity: 1 })));
  return (
    <>
      <header className="bg-surface p-4 text-foreground">
        <h1>معاينة اختبار معزولة — بيانات اصطناعية</h1>
        <p>لا تتصل بالطلبات أو الرسائل أو التحليلات الحقيقية.</p>
      </header>
      {params.get("view") === "cart" ? (
        <Cart
          isOpen
          onClose={() => {}}
          cartItems={items}
          currency="YER"
          onUpdateQuantity={(id, quantity) =>
            setItems((rows) =>
              rows.map((row) => (row.product.id === id ? { ...row, quantity } : row)),
            )
          }
          onRemoveItem={(id) => setItems((rows) => rows.filter((row) => row.product.id !== id))}
        />
      ) : (
        <>
          <SheinPromoGrid products={products} onShopNow={() => {}} onSelectProduct={() => {}} />
          <FlashDealsSection
            products={products}
            currency="YER"
            onSelectProduct={() => {}}
            onAddToCart={() => {}}
          />
        </>
      )}
    </>
  );
}
const route = createRootRoute({ component: Preview });
const router = createRouter({ routeTree: route });
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={new QueryClient()}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
