import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as fetchProductsByIds } from "./product.actions-BIwQALk-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/checkout-Da4QPy8N.js
var $$splitComponentImporter = () => import("./checkout-_k9_fsD_.mjs");
/**
* Parse the Meta Commerce `products` query parameter.
* Format: "id1:qty1,id2:qty2" — quantities default to 1 when omitted or invalid.
* Returns an empty array for a missing or blank param (not an error).
*/
function parseProductsParam(raw) {
	if (!raw) return [];
	try {
		return decodeURIComponent(raw).split(",").map((part) => {
			const colonIdx = part.indexOf(":");
			if (colonIdx !== -1) {
				const id = part.substring(0, colonIdx).trim();
				const qtyVal = parseInt(part.substring(colonIdx + 1).trim(), 10);
				return {
					id,
					qty: isNaN(qtyVal) || qtyVal <= 0 ? 1 : qtyVal
				};
			}
			const id = part.trim();
			return id ? {
				id,
				qty: 1
			} : null;
		}).filter((x) => x !== null && x.id.length > 0);
	} catch {
		return [];
	}
}
var Route = createFileRoute("/checkout")({
	validateSearch: (search) => ({
		products: typeof search.products === "string" ? search.products : void 0,
		coupon: typeof search.coupon === "string" ? search.coupon : void 0
	}),
	head: () => ({ meta: [{ title: "تأكيد الطلب — اندكس ستور" }] }),
	/**
	* Loader: parses IDs from the URL and fetches only those products from
	* Supabase via productsRepo. Never loads the full catalog. Never uses CSV.
	* Returns an empty array when no products param is present — the component
	* will then render the current cart contents or an empty-cart screen.
	*/
	loader: async ({ location }) => {
		const rawSearch = location.search;
		const parsed = parseProductsParam(typeof rawSearch.products === "string" ? rawSearch.products : void 0);
		if (parsed.length === 0) return {
			resolvedProducts: [],
			parsedItems: []
		};
		return {
			resolvedProducts: await fetchProductsByIds(parsed.map((p) => p.id)),
			parsedItems: parsed
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
