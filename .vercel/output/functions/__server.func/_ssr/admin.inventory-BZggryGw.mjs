import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as Search, G as LoaderCircle, P as Plus, wt as ArrowRight, xt as Boxes, z as Minus } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { c as listAdminProducts, l as listInventoryMovements, u as recordInventoryMovement } from "./admin.actions-CN1SCjW3.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.inventory-BZggryGw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InventoryPage() {
	const qc = useQueryClient();
	const [search, setSearch] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [delta, setDelta] = (0, import_react.useState)(1);
	const productsQ = useQuery({
		queryKey: ["admin-products", { search: search.trim() || void 0 }],
		queryFn: () => listAdminProducts({ search: search.trim() || void 0 })
	});
	const movementsQ = useQuery({
		queryKey: ["inventory-movements", selectedId],
		queryFn: () => listInventoryMovements(selectedId),
		enabled: !!selectedId
	});
	const products = (0, import_react.useMemo)(() => {
		const list = productsQ.data ?? [];
		if (filter === "out") return list.filter((p) => p.stock <= 0);
		if (filter === "low") return list.filter((p) => p.stock > 0 && p.stock <= 5);
		return list;
	}, [productsQ.data, filter]);
	const recordMut = useMutation({
		mutationFn: (v) => recordInventoryMovement({
			product_id: v.productId,
			delta: v.delta,
			reason: v.reason
		}),
		onSuccess: () => {
			toast.success("تم تعديل المخزون");
			qc.invalidateQueries({ queryKey: ["admin-products"] });
			if (selectedId) qc.invalidateQueries({ queryKey: ["inventory-movements", selectedId] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-black lg:text-4xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "neon-text",
						children: "المخزون"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: productsQ.isLoading ? "جارٍ التحميل..." : `${products.length} منتج`
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-4 flex flex-wrap items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1 min-w-[200px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: search,
							onChange: (e) => setSearch(e.target.value),
							placeholder: "بحث...",
							className: "w-full rounded-xl border border-border bg-surface ps-9 pe-3 py-2 text-sm outline-none focus:border-primary"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1 rounded-xl border border-border bg-surface p-1",
						children: [
							"all",
							"low",
							"out"
						].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFilter(f),
							className: `rounded-lg px-3 py-1.5 text-xs font-bold ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`,
							children: f === "all" ? "الكل" : f === "low" ? "منخفض (≤5)" : "نفد"
						}, f))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ms-auto flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "تعديل سريع:"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setDelta(Math.max(1, delta - 1)),
								className: "grid h-8 w-8 place-items-center rounded-lg border border-border",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "h-3.5 w-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: 1,
								value: delta,
								onChange: (e) => setDelta(Math.max(1, Number(e.target.value))),
								className: "w-14 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setDelta(delta + 1),
								className: "grid h-8 w-8 place-items-center rounded-lg border border-border",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3.5 w-3.5" })
							})
						]
					})
				]
			}),
			productsQ.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl glass p-8 text-center text-destructive",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: productsQ.error.message
				})
			}) : productsQ.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl glass p-12 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto h-6 w-6 animate-spin text-primary" })
			}) : products.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-12 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boxes, { className: "h-7 w-7 text-primary" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "لا توجد منتجات"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "lg:col-span-2 rounded-2xl glass overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs text-muted-foreground border-b border-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-start p-3",
									children: "المنتج"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-start p-3",
									children: "المخزون"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-end p-3",
									children: "إجراءات"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: products.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							onClick: () => setSelectedId(p.id),
							className: `border-b border-border/40 cursor-pointer ${selectedId === p.id ? "bg-primary/5" : "hover:bg-accent/40"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-10 w-10 overflow-hidden rounded-lg bg-muted shrink-0",
											children: p.images[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: p.images[0],
												alt: "",
												className: "h-full w-full object-cover"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "truncate font-bold",
												children: p.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "truncate text-xs text-muted-foreground font-mono",
												children: p.slug
											})]
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `rounded-full px-2 py-0.5 text-xs font-bold ${p.stock <= 0 ? "bg-destructive/20 text-destructive" : p.stock <= 5 ? "bg-warning/20 text-warning" : "bg-success/20 text-success"}`,
										children: p.stock
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-end gap-1",
										onClick: (e) => e.stopPropagation(),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => recordMut.mutate({
													productId: p.id,
													delta,
													reason: "restock"
												}),
												disabled: recordMut.isPending,
												className: "inline-flex items-center gap-1 rounded-lg bg-success/15 px-2 py-1 text-xs font-bold text-success hover:bg-success/25",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3 w-3" }),
													" ",
													delta
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => {
													if (p.stock - delta < 0) {
														toast.error("لا يمكن أن يصبح المخزون سالبًا");
														return;
													}
													recordMut.mutate({
														productId: p.id,
														delta: -Math.abs(delta),
														reason: "adjustment"
													});
												},
												disabled: recordMut.isPending,
												className: "inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive hover:bg-destructive/20",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "h-3 w-3" }),
													" ",
													delta
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/admin/product/$id",
												params: { id: p.id },
												className: "grid h-6 w-6 place-items-center rounded-lg hover:bg-accent",
												title: "فتح المنتج",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-3 w-3 rotate-180" })
											})
										]
									})
								})
							]
						}, p.id)) })]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl glass p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-black mb-3",
						children: "حركات المخزون"
					}), !selectedId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "اختر منتجًا لعرض حركاته."
					}) : movementsQ.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-muted-foreground" }) : (movementsQ.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "لا توجد حركات"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1.5 text-xs",
						children: (movementsQ.data ?? []).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-lg bg-surface p-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `font-bold ${m.delta > 0 ? "text-success" : "text-destructive"}`,
									children: [m.delta > 0 ? "+" : "", m.delta]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: m.reason
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex items-center justify-between text-[10px] text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: m.note ?? "" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(m.created_at).toLocaleString("ar") })]
							})]
						}, m.id))
					})]
				})]
			})
		]
	});
}
//#endregion
export { InventoryPage as component };
