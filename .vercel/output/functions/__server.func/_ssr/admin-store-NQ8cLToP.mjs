import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-store-NQ8cLToP.js
var useAdmin = create()(persist((set) => ({
	products: [],
	sessions: [],
	addProduct: (p) => set((s) => ({ products: [p, ...s.products] })),
	updateProduct: (id, patch) => set((s) => ({ products: s.products.map((p) => p.id === id ? {
		...p,
		...patch
	} : p) })),
	removeProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
	addSession: (ses) => set((s) => ({ sessions: [ses, ...s.sessions] })),
	updateSession: (id, patch) => set((s) => ({ sessions: s.sessions.map((x) => x.id === id ? {
		...x,
		...patch,
		updatedAt: Date.now()
	} : x) }))
}), { name: "noqta-admin" }));
//#endregion
export { useAdmin as t };
