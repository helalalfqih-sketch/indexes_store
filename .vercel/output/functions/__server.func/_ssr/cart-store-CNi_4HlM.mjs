import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cart-store-CNi_4HlM.js
var useCart = create()(persist((set, get) => ({
	items: [],
	add: (p, qty = 1) => set((s) => {
		if (s.items.find((i) => i.productId === p.id)) return { items: s.items.map((i) => i.productId === p.id ? {
			...i,
			qty: i.qty + qty
		} : i) };
		return { items: [...s.items, {
			productId: p.id,
			name: p.name,
			price: p.price,
			image: p.image,
			qty
		}] };
	}),
	remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
	setQty: (productId, qty) => set((s) => ({ items: s.items.map((i) => i.productId === productId ? {
		...i,
		qty
	} : i).filter((i) => i.qty > 0) })),
	clear: () => set({ items: [] }),
	total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
	count: () => get().items.reduce((sum, i) => sum + i.qty, 0)
}), { name: "noqta-cart" }));
//#endregion
export { useCart as t };
