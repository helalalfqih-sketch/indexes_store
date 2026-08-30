import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./store-data";
import {
  addShopifyCartLines,
  createShopifyCart,
  removeShopifyCartLines,
  updateShopifyCartLines,
  type ShopifyCart,
} from "./shopify/catalog.functions";

import { trackEvent } from "./analytics";

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  variantId?: string | null;
  shopifyLineId?: string | null;
};

type CartProduct = Product & {
  shopifyVariantId?: string | null;
  is_published?: boolean;
  status?: string;
};

type CartState = {
  items: CartLine[];
  cartId: string | null;
  checkoutUrl: string | null;
  syncError: string | null;
  syncing: boolean;
  add: (p: Product, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => {
      const applyRemoteCart = (cart: ShopifyCart) => {
        set({
          cartId: cart.id,
          checkoutUrl: cart.checkoutUrl,
          syncing: false,
          syncError: null,
          items: cart.lines.nodes.map((line) => ({
            productId: line.merchandise.product.id,
            variantId: line.merchandise.id,
            shopifyLineId: line.id,
            name: line.merchandise.product.title,
            price: Number(line.merchandise.price.amount),
            image: line.merchandise.product.featuredImage?.url ?? "",
            qty: line.quantity,
          })),
        });
      };

      const failSync = (error: unknown) => {
        set({
          syncing: false,
          syncError: error instanceof Error ? error.message : "تعذر مزامنة سلة Shopify",
        });
      };

      const createRemoteCart = async () => {
        const lines = get()
          .items.filter((item) => item.variantId)
          .map((item) => ({ merchandiseId: item.variantId as string, quantity: item.qty }));
        if (!lines.length) return;
        set({ syncing: true, syncError: null });
        try {
          const result = await createShopifyCart({ data: { lines } });
          applyRemoteCart(result.cart);
        } catch (error) {
          failSync(error);
        }
      };

      return {
        items: [],
        cartId: null,
        checkoutUrl: null,
        syncError: null,
        syncing: false,
        add: (p: CartProduct, qty = 1) => {
          const isPublished = p.is_published !== false && p.status !== "archived";
          if (!isPublished) return;

          trackEvent("add_to_cart", { productId: p.id, name: p.name, price: p.price, qty });

          set((s) => {
            const existing = s.items.find((i) => i.productId === p.id);
            if (existing) {
              return {
                items: s.items.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + qty } : i)),
              };
            }
            return {
              items: [
                ...s.items,
                {
                  productId: p.id,
                  variantId: p.shopifyVariantId ?? null,
                  name: p.name,
                  price: p.price,
                  image: p.image,
                  qty,
                },
              ],
            };
          });

          const variantId = p.shopifyVariantId;
          const cartId = get().cartId;
          if (!variantId) {
            set({ syncError: "معرّف Shopify variant غير متاح لهذا المنتج" });
            return;
          }
          if (!cartId) {
            void createRemoteCart();
            return;
          }
          set({ syncing: true, syncError: null });
          void addShopifyCartLines({
            data: { cartId, lines: [{ merchandiseId: variantId, quantity: qty }] },
          })
            .then((result) => applyRemoteCart(result.cart))
            .catch(failSync);
        },
        remove: (productId) => {
          const current = get().items.find((item) => item.productId === productId);
          const cartId = get().cartId;
          set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
          if (!cartId || !current?.shopifyLineId) return;
          set({ syncing: true, syncError: null });
          void removeShopifyCartLines({ data: { cartId, lineIds: [current.shopifyLineId] } })
            .then((result) => applyRemoteCart(result.cart))
            .catch(failSync);
        },
        setQty: (productId, qty) => {
          const current = get().items.find((item) => item.productId === productId);
          const cartId = get().cartId;
          set((s) => ({
            items: s.items
              .map((i) => (i.productId === productId ? { ...i, qty } : i))
              .filter((i) => i.qty > 0),
          }));
          if (!cartId || !current?.shopifyLineId) {
            if (get().items.length) void createRemoteCart();
            return;
          }
          set({ syncing: true, syncError: null });
          const operation =
            qty <= 0
              ? removeShopifyCartLines({ data: { cartId, lineIds: [current.shopifyLineId] } })
              : updateShopifyCartLines({
                  data: { cartId, lines: [{ id: current.shopifyLineId, quantity: qty }] },
                });
          void operation.then((result) => applyRemoteCart(result.cart)).catch(failSync);
        },
        clear: () =>
          set({ items: [], cartId: null, checkoutUrl: null, syncError: null, syncing: false }),
        total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
        count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      };
    },
    {
      name: "noqta-cart-v2",
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
        checkoutUrl: state.checkoutUrl,
      }),
    },
  ),
);
