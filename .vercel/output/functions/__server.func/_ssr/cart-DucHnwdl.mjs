import { o as __toESM } from "../_runtime.mjs";
import { i as formatPrice } from "./store-data-CaXOvYMv.mjs";
import { r as whatsappLink, t as buildOrderMessage } from "./whatsapp-C4cq1s8L.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as MessageCircle, P as Plus, m as Trash2, x as ShoppingBag, z as Minus } from "../_libs/lucide-react.mjs";
import { t as useCart } from "./cart-store-CNi_4HlM.mjs";
import { t as Route } from "./cart-HiZrhm8M.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cart-DucHnwdl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CartPage() {
	const { coupon } = Route.useSearch();
	const items = useCart((s) => s.items);
	const total = useCart((s) => s.total());
	const setQty = useCart((s) => s.setQty);
	const remove = useCart((s) => s.remove);
	const discount = coupon ? Math.round(total * .1) : 0;
	const finalTotal = total - discount;
	const [name, setName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [address, setAddress] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	if (items.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center gap-4 px-6 py-20 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-24 w-24 place-items-center rounded-full bg-primary-soft/20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "h-10 w-10 text-primary" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-black",
				children: "سلتك فارغة"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "ابدأ التسوق وأضف المنتجات لسلتك"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand",
				children: "تصفح المنتجات"
			})
		]
	});
	const message = buildOrderMessage(items, finalTotal, {
		name,
		phone,
		address,
		notes
	}, coupon, discount);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 px-4 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "text-lg font-black",
				children: [
					"سلة المشتريات (",
					items.length,
					")"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-3 rounded-2xl bg-surface p-2.5 shadow-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: it.image,
						alt: it.name,
						className: "h-20 w-20 rounded-xl object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "line-clamp-2 text-xs font-bold leading-tight",
								children: it.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => remove(it.productId),
								className: "text-destructive",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-black text-primary",
								children: formatPrice(it.price)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setQty(it.productId, it.qty - 1),
										className: "grid h-7 w-7 place-items-center rounded-full bg-muted",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "h-3 w-3" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-5 text-center text-sm font-bold",
										children: it.qty
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setQty(it.productId, it.qty + 1),
										className: "grid h-7 w-7 place-items-center rounded-full gradient-brand text-white",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3 w-3" })
									})
								]
							})]
						})]
					})]
				}, it.productId))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl bg-surface p-4 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mb-3 text-sm font-black",
					children: "بيانات التسليم"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: "الاسم الكامل",
							className: "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: phone,
							onChange: (e) => setPhone(e.target.value),
							placeholder: "رقم الهاتف",
							inputMode: "tel",
							className: "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: address,
							onChange: (e) => setAddress(e.target.value),
							placeholder: "عنوان التسليم (المدينة، الحي)",
							className: "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: notes,
							onChange: (e) => setNotes(e.target.value),
							placeholder: "ملاحظات إضافية (اختياري)",
							rows: 2,
							className: "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl bg-surface p-4 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: "المجموع الفرعي"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold",
							children: formatPrice(total)
						})]
					}),
					coupon && discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-sm text-success",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"خصم الكوبون (",
							coupon,
							")"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-bold",
							children: ["-", formatPrice(discount)]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: "الشحن"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold text-success",
							children: "يتم الاتفاق عليه"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center justify-between border-t border-border pt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-bold",
							children: "الإجمالي"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-lg font-black text-primary",
							children: formatPrice(finalTotal)
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: whatsappLink(message),
				target: "_blank",
				rel: "noopener noreferrer",
				className: "mb-2 flex items-center justify-center gap-2 rounded-2xl bg-success py-3.5 text-sm font-black text-success-foreground shadow-brand",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-5 w-5" }), "إتمام الطلب عبر واتساب"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pb-2 text-center text-[11px] text-muted-foreground",
				children: "الدفع عند الاستلام متاح • تأكيد الطلب مباشرة مع الإدارة"
			})
		]
	});
}
//#endregion
export { CartPage as component };
