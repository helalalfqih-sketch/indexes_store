import { c as require_jsx_runtime } from "../_libs/@astryxdesign/core+[...].mjs";
import { it as Flame } from "../_libs/lucide-react.mjs";
import { t as ProductCard } from "./product-card-C_xAF7Ek.mjs";
import { t as Route } from "./offers-CfhpscHo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers-DzTRPYiq.js
var import_jsx_runtime = require_jsx_runtime();
function OffersPage() {
	const deals = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 px-4 pt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex items-center gap-3 rounded-3xl gradient-brand p-4 text-white shadow-brand",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "h-8 w-8" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-black",
				children: "عروض حصرية"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-white/85",
				children: "خصومات تصل إلى 40% لفترة محدودة"
			})] })]
		}), deals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-10 text-center text-sm text-muted-foreground",
			children: "لا توجد عروض متاحة حالياً."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
			children: deals.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product: p }, p.id))
		})]
	});
}
//#endregion
export { OffersPage as component };
