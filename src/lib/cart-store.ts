import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./store-data";

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
};

type CartState = {
  items: CartLine[];
  add: (p: Product, qty?: number) => void;
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
      add: (p, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === p.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === p.id ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return {
            items: [
              ...s.items,
              { productId: p.id, name: p.name, price: p.price, image: p.image, qty },
            ],
          };
        }),
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      setQty: (productId, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.productId === productId ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "noqta-cart" },
  ),
);
