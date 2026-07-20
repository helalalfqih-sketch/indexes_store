import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminProductStatus = "draft" | "processing" | "published";

export type AdminProduct = {
  id: string;
  title: string;
  description: string;
  category: string;
  slug: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  images: string[]; // data URLs
  status: AdminProductStatus;
  createdAt: number;
};

export type SessionStep = "upload" | "processing" | "review" | "approved" | "published";

export type AISession = {
  id: string;
  productId?: string;
  step: SessionStep;
  title: string;
  createdAt: number;
  updatedAt: number;
};

type AdminState = {
  products: AdminProduct[];
  sessions: AISession[];
  addProduct: (p: AdminProduct) => void;
  updateProduct: (id: string, patch: Partial<AdminProduct>) => void;
  removeProduct: (id: string) => void;
  addSession: (s: AISession) => void;
  updateSession: (id: string, patch: Partial<AISession>) => void;
};

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      products: [],
      sessions: [],
      addProduct: (p) => set((s) => ({ products: [p, ...s.products] })),
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      addSession: (ses) => set((s) => ({ sessions: [ses, ...s.sessions] })),
      updateSession: (id, patch) =>
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x,
          ),
        })),
    }),
    { name: "noqta-admin" },
  ),
);
