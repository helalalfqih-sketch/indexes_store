import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { D as Search, G as LoaderCircle } from "../_libs/lucide-react.mjs";
import { c as searchProducts } from "./product.actions-BIwQALk-.mjs";
import { t as ProductCard } from "./product-card-C_xAF7Ek.mjs";
import { t as Route } from "./search-C9Z_QAXQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search-CbWu8aAx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SearchPage() {
	const initial = Route.useLoaderData();
	const [q, setQ] = (0, import_react.useState)("");
	const [results, setResults] = (0, import_react.useState)(initial);
	const [loading, setLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = setTimeout(async () => {
			setLoading(true);
			try {
				setResults(await searchProducts(q));
			} finally {
				setLoading(false);
			}
		}, 250);
		return () => clearTimeout(t);
	}, [q]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 px-4 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 rounded-2xl bg-surface px-3 py-2.5 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						autoFocus: true,
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "ابحث عن منتج، ماركة أو تصنيف...",
						className: "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
					}),
					loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-muted-foreground" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground",
				children: [results.length, " نتيجة"]
			}),
			results.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-10 text-center text-sm text-muted-foreground",
				children: "لا توجد نتائج مطابقة."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
				children: results.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product: p }, p.id))
			})
		]
	});
}
//#endregion
export { SearchPage as component };
