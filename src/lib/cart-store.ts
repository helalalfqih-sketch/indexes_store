import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./store-data";
import { trackEvent } from "./analytics";
import {
  checkoutProductRefFromCatalogProduct,
  type CheckoutProductRef,
} from "./checkout-product-contract";

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  variantId?: string | null;
  shopifyLineId?: string | null;
  checkoutProductRef?: CheckoutProductRef;
};

type CartProduct = Product & {
  shopifyVariantId?: string | null;
  checkoutProductRef?: CheckoutProductRef;
  is_published?: boolean;
  status?: string;
};

type CartState = {
  items: CartLine[];
  /** Deprecated compatibility fields. The storefront cart is no longer synced to Shopify. */
  cartId: string | null;
  checkoutUrl: string | null;
  syncError: string | null;
  syncing: boolean;
  restore: () => Promise<void>;
  add: (p: CartProduct, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      syncError: null,
      syncing: false,
      restore: async () => {
        // Intentionally local-only. No remote Shopify cart is restored or created.
      },
      add: (p: CartProduct, qty = 1) => {
        const isPublished = p.is_published !== false && p.status !== "archived";
        if (!isPublished) return;

        trackEvent("add_to_cart", { productId: p.id, name: p.name, price: p.price, qty });

        set((state) => {
          const existing = state.items.find((item) => item.productId === p.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === p.id ? { ...item, qty: item.qty + qty } : item,
              ),
              cartId: null,
              checkoutUrl: null,
              syncError: null,
              syncing: false,
            };
          }

          return {
            items: [
              ...state.items,
              {
                productId: p.id,
                variantId: p.shopifyVariantId ?? null,
                checkoutProductRef: p.checkoutProductRef ?? checkoutProductRefFromCatalogProduct(p),
                name: p.name,
                price: p.price,
                image: p.image,
                qty,
              },
            ],
            cartId: null,
            checkoutUrl: null,
            syncError: null,
            syncing: false,
          };
        });
      },
      remove: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
          cartId: null,
          checkoutUrl: null,
          syncError: null,
          syncing: false,
        }));
      },
      setQty: (productId, qty) => {
        set((state) => ({
          items: state.items
            .map((item) => (item.productId === productId ? { ...item, qty } : item))
            .filter((item) => item.qty > 0),
          cartId: null,
          checkoutUrl: null,
          syncError: null,
          syncing: false,
        }));
      },
      clear: () =>
        set({ items: [], cartId: null, checkoutUrl: null, syncError: null, syncing: false }),
      total: () => get().items.reduce((sum, item) => sum + item.price * item.qty, 0),
      count: () => get().items.reduce((sum, item) => sum + item.qty, 0),
    }),
    {
      name: "noqta-cart-v2",
      // Keep the server and the browser first render identical. Restore storage after mount.
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Restore the persisted cart only after React has hydrated the server snapshot. */
export function useHydrateCart() {
  // Always start false, even if another route restored the module-level
  // Zustand store before this React tree began hydrating. Rendering persisted
  // items on the first client pass would differ from the empty server HTML.
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve(useCart.persist.rehydrate()).then(() => {
      if (active) setHasHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return hasHydrated;
}
