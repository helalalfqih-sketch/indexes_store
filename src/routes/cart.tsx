import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import type { CartItem, Product as DesignProduct } from "@/components/storefront/types";
import { useCart } from "@/lib/cart-store";
import { useFavorites } from "@/lib/use-favorites";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سلة التسوق — اندكس ستور" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CartRoutePage,
});

function CartRoutePage() {
  const navigate = useNavigate();
  const items = useCart((state) => state.items);
  const setQty = useCart((state) => state.setQty);
  const remove = useCart((state) => state.remove);
  const { favorites, toggleFavorite } = useFavorites();

  const cartItems: CartItem[] = useMemo(
    () =>
      items.map((item) => ({
        product: {
          id: item.productId,
          slug: item.productId,
          name: item.name,
          subtitle: item.name,
          description: item.name,
          priceYER: item.price,
          originalPriceYER: item.price,
          rating: 0,
          reviewsCount: 0,
          image: item.image,
          category: "all",
          inStock: true,
          stockCount: 1,
        } as DesignProduct,
        quantity: item.qty,
      })),
    [items],
  );

  return (
    <CartDrawer
      currency="YER"
      isOpen
      onClose={() => navigate({ to: "/" })}
      cartItems={cartItems}
      onUpdateQuantity={(productId, quantity) => setQty(productId, quantity)}
      onRemoveItem={(productId) => remove(productId)}
      favorites={favorites}
      onSaveForLater={(item) => {
        toggleFavorite(item.product.id);
        remove(item.product.id);
      }}
      onCheckout={(discountPercent) => {
        const coupon = discountPercent === 20 ? "INDEXES20" : discountPercent === 10 ? "INDEXES10" : undefined;
        navigate({
          to: "/order-completion",
          search: coupon ? { coupon } : undefined,
        });
      }}
    />
  );
}
