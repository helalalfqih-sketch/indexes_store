import { c as require_jsx_runtime } from "../_libs/@astryxdesign/core+[...].mjs";
import { t as Route } from "./category._id-vZPErH5r.mjs";
import { t as ProductCard } from "./product-card-C_xAF7Ek.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/category._id-DSnXqOD2.js
var import_jsx_runtime = require_jsx_runtime();
function CategoryPage() {
	const { cat, items } = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 px-4 pt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-lg font-black",
			children: cat.name
		}), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-10 text-center text-sm text-muted-foreground",
			children: "لا توجد منتجات في هذا التصنيف بعد."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
			children: items.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product: p }, p.id))
		})]
	});
}
//#endregion
export { CategoryPage as component };
