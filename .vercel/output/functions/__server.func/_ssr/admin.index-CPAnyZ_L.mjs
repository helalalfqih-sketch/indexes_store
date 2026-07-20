import { c as require_jsx_runtime } from "../_libs/@astryxdesign/core+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { Ct as ArrowUpRight, L as Package, c as Users, lt as DollarSign, p as TrendingUp, x as ShoppingBag, y as Sparkles } from "../_libs/lucide-react.mjs";
import { n as useI18n } from "./i18n-ut2VIwHl.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { c as listAdminProducts } from "./admin.actions-CN1SCjW3.mjs";
import { t as useAdmin } from "./admin-store-NQ8cLToP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.index-CPAnyZ_L.js
var import_jsx_runtime = require_jsx_runtime();
function DashboardPage() {
	const { t, lang } = useI18n();
	const sessions = useAdmin((s) => s.sessions);
	const products = useQuery({
		queryKey: ["admin-products"],
		queryFn: () => listAdminProducts()
	}).data ?? [];
	const stats = [
		{
			k: "dash.revenue",
			value: "$48,290",
			delta: "+12.4%",
			icon: DollarSign,
			tint: "from-emerald-500/20 to-emerald-500/5"
		},
		{
			k: "dash.orders",
			value: "1,284",
			delta: "+8.1%",
			icon: ShoppingBag,
			tint: "from-blue-500/20 to-blue-500/5"
		},
		{
			k: "dash.products",
			value: String(products.length || 24),
			delta: "+3",
			icon: Package,
			tint: "from-fuchsia-500/20 to-fuchsia-500/5"
		},
		{
			k: "dash.customers",
			value: "9,340",
			delta: "+5.6%",
			icon: Users,
			tint: "from-cyan-500/20 to-cyan-500/5"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative overflow-hidden rounded-3xl glass-strong p-6 lg:p-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-24 -end-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -bottom-24 -start-24 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-xl",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }), " AI Commerce OS"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-4 text-3xl font-black tracking-tight lg:text-5xl",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "neon-text animate-gradient",
										children: lang === "ar" ? "أهلاً بك في اندكس ستور" : "Welcome to Indexes Store"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-muted-foreground lg:text-base",
									children: lang === "ar" ? "منصة تجارة إلكترونية مدعومة بالذكاء الاصطناعي — أنشئ، حلّل، وانشر منتجاتك بلمسات." : "AI-powered commerce OS — create, analyze and publish products in seconds."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-5 flex flex-wrap gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/admin/studio",
										className: "inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-3 text-sm font-bold text-primary-foreground shadow-brand hover:opacity-95",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }),
											t("nav.studio"),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "h-4 w-4" })
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/admin/products",
										className: "inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-5 py-3 text-sm font-bold hover:bg-accent",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-4 w-4" }), t("nav.products")]
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "animate-float rounded-2xl glass p-6 neon-ring",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid h-10 w-10 place-items-center rounded-xl gradient-brand",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-5 w-5 text-primary-foreground" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: t("dash.performance")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-lg font-black",
										children: "+18.3%"
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, {})]
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
				children: stats.map((s) => {
					const Icon = s.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `tilt-3d relative overflow-hidden rounded-2xl glass p-5`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `absolute inset-0 bg-gradient-to-br ${s.tint}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex items-start justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-semibold text-muted-foreground",
									children: t(s.k)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 text-2xl font-black",
									children: s.value
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 text-xs font-bold text-success",
									children: s.delta
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-11 w-11 place-items-center rounded-xl bg-primary/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5 text-primary" })
							})]
						})]
					}, s.k);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl glass p-5 lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-black",
							children: t("dash.performance")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "Last 30 days"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigChart, {})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl glass p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-black",
						children: t("dash.aiInsights")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-3 text-sm",
						children: (lang === "ar" ? [
							"زيادة 24% في مشاهدات فئة الإلكترونيات — فكّر بحملة إعلانية.",
							"3 منتجات نفدت من المخزون خلال اليومين الماضيين.",
							"أفضل وقت للنشر: 8–10 مساءً بحسب تحليل الجمهور."
						] : [
							"24% surge in Electronics category — consider an ad push.",
							"3 SKUs went out of stock in the last 48h.",
							"Best posting window: 8–10pm based on audience analytics."
						]).map((tip, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start gap-3 rounded-xl bg-accent/60 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tip })]
						}, i))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl glass p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-black",
						children: t("dash.topProducts")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 space-y-3",
						children: (products.length ? products.slice(0, 4) : []).map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-xl border border-border/60 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted",
									children: p?.images?.[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: p.images[0],
										alt: "",
										className: "h-full w-full object-cover"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-sm font-bold",
										children: p?.name || (lang === "ar" ? "منتج تجريبي" : "Sample product")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: p?.brand || "—"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-black text-primary",
								children: p ? `${p.price} ${p.currency}` : "$—"
							})]
						}, i))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl glass p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-black",
						children: t("dash.recentSessions")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-3",
						children: [sessions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground",
							children: lang === "ar" ? "لا توجد جلسات بعد" : "No sessions yet"
						}), sessions.slice(0, 5).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-xl border border-border/60 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "truncate text-sm font-bold",
									children: s.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: new Date(s.createdAt).toLocaleString()
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary",
								children: s.step
							})]
						}, s.id))]
					})]
				})]
			})
		]
	});
}
function Sparkline() {
	const points = [
		8,
		14,
		10,
		18,
		12,
		22,
		19,
		28,
		24,
		32,
		30,
		40
	];
	const max = Math.max(...points);
	const w = 200;
	const h = 60;
	const step = w / (points.length - 1);
	const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step},${h - p / max * h}`).join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${w} ${h}`,
		className: "mt-4 h-16 w-full",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "sl",
				x1: "0",
				x2: "0",
				y1: "0",
				y2: "1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: "#2F7BFF",
					stopOpacity: "0.6"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: "#2F7BFF",
					stopOpacity: "0"
				})]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: `${d} L ${w},${h} L 0,${h} Z`,
				fill: "url(#sl)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d,
				stroke: "#1F5EFF",
				strokeWidth: 2,
				fill: "none",
				strokeLinecap: "round"
			})
		]
	});
}
function BigChart() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6 flex h-48 items-end gap-2",
		children: [
			42,
			58,
			36,
			74,
			52,
			88,
			66,
			92,
			70,
			84,
			60,
			96
		].map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 rounded-t-lg bg-gradient-to-t from-primary to-primary-light transition-all hover:opacity-90",
			style: { height: `${b}%` },
			title: `${b}%`
		}, i))
	});
}
//#endregion
export { DashboardPage as component };
