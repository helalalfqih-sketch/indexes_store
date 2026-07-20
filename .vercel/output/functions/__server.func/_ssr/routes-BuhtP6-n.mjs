import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as fetchProducts, n as fetchBestSellers, r as fetchOffers } from "./product.actions-BIwQALk-.mjs";
import { t as fetchCategories } from "./category.actions-BUQYceFE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BuhtP6-n.js
var $$splitComponentImporter = () => import("./routes-CnsqNamw.mjs");
var $$splitErrorComponentImporter = () => import("./routes-B7r5NJ8Y.mjs");
var Route = createFileRoute("/")({
	head: () => ({ meta: [{ title: "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن" }, {
		name: "description",
		content: "اكتشف أحدث المنتجات والعروض في اندكس ستور: إلكترونيات، أزياء، أدوات منزلية، والمزيد."
	}] }),
	loader: async () => {
		const [categories, bestSellers, dailyDeals, allProducts] = await Promise.all([
			fetchCategories(),
			fetchBestSellers(4),
			fetchOffers().then((rows) => rows.slice(0, 4)),
			fetchProducts()
		]);
		return {
			categories,
			bestSellers,
			dailyDeals,
			allProducts
		};
	},
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
