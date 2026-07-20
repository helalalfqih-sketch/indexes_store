import { o as __toESM } from "../_runtime.mjs";
import { i as formatPrice } from "./store-data-CaXOvYMv.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { gt as CircleAlert, h as Tag, ht as CircleCheck, wt as ArrowRight, x as ShoppingBag } from "../_libs/lucide-react.mjs";
import { t as useCart } from "./cart-store-CNi_4HlM.mjs";
import { t as Route } from "./checkout-Da4QPy8N.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/checkout-_k9_fsD_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Parse the Meta Commerce `products` query parameter.
* Format: "id1:qty1,id2:qty2" — quantities default to 1 when omitted or invalid.
* Returns an empty array for a missing or blank param (not an error).
*/
function CheckoutBridgePage() {
	const { products: productsParam, coupon: couponParam } = Route.useSearch();
	const { resolvedProducts, parsedItems } = Route.useLoaderData();
	const navigate = useNavigate();
	const add = useCart((s) => s.add);
	const items = useCart((s) => s.items);
	const resolvedItems = resolvedProducts.map((product) => {
		return {
			product,
			qty: parsedItems.find((p) => p.id === product.id || p.id === product.slug)?.qty ?? 1
		};
	}).filter((item) => item.product != null);
	const cartPopulated = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (cartPopulated.current || resolvedItems.length === 0) return;
		cartPopulated.current = true;
		resolvedItems.forEach(({ product, qty }) => {
			add(product, qty);
		});
	}, [resolvedItems, add]);
	if (!productsParam) {
		if (items.length > 0) {
			navigate({
				to: "/cart",
				search: couponParam ? { coupon: couponParam } : void 0
			});
			return null;
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center gap-4 px-6 py-20 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "h-8 w-8" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-black text-foreground",
					children: "سلتك فارغة"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground max-w-xs",
					children: "لم يتم تحديد أي منتجات. ابدأ التسوق وأضف المنتجات لسلتك."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "mt-2 inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "تصفح المنتجات" })
				})
			]
		});
	}
	if (resolvedItems.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center gap-4 px-6 py-20 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-8 w-8" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-black text-foreground",
				children: "المنتجات غير متوفرة"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground max-w-xs",
				children: "المنتجات المطلوبة غير متاحة حالياً في متجرنا. يرجى التواصل معنا للمساعدة."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "mt-2 inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "العودة للمتجر" })
			})
		]
	});
	const subtotal = resolvedItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
	const handleContinue = () => {
		navigate({
			to: "/cart",
			search: couponParam ? { coupon: couponParam } : void 0
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 px-4 pt-4",
		dir: "rtl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-1.5 rounded-3xl bg-surface p-5 shadow-card border border-primary/10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-md font-black",
						children: "تم تجهيز طلبك بنجاح!"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "لقد قمنا باستيراد المنتجات المحددة من Meta. يرجى مراجعة تفاصيل طلبك أدناه للمتابعة إلى صفحة الدفع."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-black border-b border-border/50 pb-2",
					children: "المنتجات في هذا الطلب"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-3",
					children: resolvedItems.map(({ product, qty }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: product.image,
							alt: product.name,
							className: "h-16 w-16 rounded-xl object-cover border border-border/50"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-1 flex-col justify-between py-0.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "line-clamp-2 text-xs font-bold leading-tight text-foreground",
								children: product.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-xs text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["الكمية: ", qty] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-primary",
									children: formatPrice(product.price * qty)
								})]
							})]
						})]
					}, product.id))
				})]
			}),
			couponParam && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex items-center justify-between gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-emerald-500",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs font-bold",
						children: ["كوبون الخصم مُفعَّل: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: couponParam
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-emerald-400/70",
					children: "يُطبَّق في صفحة السلة"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl bg-surface p-4 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-black border-b border-border/50 pb-2 mb-3",
					children: "تفاصيل الحساب"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "المجموع الفرعي" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatPrice(subtotal) })]
						}),
						couponParam && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-xs text-emerald-500 font-medium",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"كوبون الخصم (",
								couponParam,
								")"
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "يُحسب في السلة" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "تكلفة الشحن" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-success font-medium",
								children: "يتم الاتفاق عليه"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center justify-between border-t border-border pt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-bold",
								children: "الإجمالي التقريبي"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-md font-black text-primary",
								children: formatPrice(subtotal)
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 mt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleContinue,
					className: "flex items-center justify-center gap-2 rounded-2xl gradient-brand py-4 text-sm font-black text-white shadow-brand transition-transform hover:scale-[1.01]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "h-5 w-5" }),
						"متابعة إتمام الطلب",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "flex items-center justify-center gap-2 rounded-2xl bg-muted py-3 text-xs font-bold text-muted-foreground hover:bg-muted/80",
					children: "إلغاء والعودة للمتجر"
				})]
			})
		]
	});
}
//#endregion
export { CheckoutBridgePage as component };
