import { o as __toESM } from "../_runtime.mjs";
import { n as STORE_CONTACT } from "./store-data-CaXOvYMv.mjs";
import { r as whatsappLink } from "./whatsapp-C4cq1s8L.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, l as useRouterState, m as createFileRoute, p as lazyRouteComponent, s as Scripts, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as House, B as MessageCircle, D as Search, H as MapPin, b as ShoppingCart, d as Truck, h as Tag, l as User, x as ShoppingBag } from "../_libs/lucide-react.mjs";
import { t as supabase } from "./client-BDpLHRM3.mjs";
import { t as noqta_logo_default } from "./noqta-logo-23NpHD9R.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { dt as enumType, ft as numberType, lt as arrayType, mt as stringType, pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as Route$17 } from "./admin.product._id-xemhzT_x.mjs";
import { t as TenantProvider } from "./tenant-provider-CiGQD6cy.mjs";
import { t as useCart } from "./cart-store-CNi_4HlM.mjs";
import { t as Route$18 } from "./cart-HiZrhm8M.mjs";
import { t as Route$19 } from "./category._id-vZPErH5r.mjs";
import { t as Route$20 } from "./checkout-Da4QPy8N.mjs";
import { t as Route$21 } from "./offers-CfhpscHo.mjs";
import { t as Route$22 } from "./product._slug-BNxmjCor.mjs";
import { t as Route$23 } from "./search-C9Z_QAXQ.mjs";
import { t as Route$24 } from "./routes-BuhtP6-n.mjs";
import { n as generateText, r as output_exports, t as NoObjectGeneratedError } from "../_libs/ai.mjs";
import { t as createOpenAICompatible } from "../_libs/@ai-sdk/openai-compatible+[...].mjs";
import { t as createGoogleVertex2 } from "../_libs/@ai-sdk/google-vertex+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BJTWA7IJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-dBya_rIB.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
function SiteFooter({ isHome }) {
	const waHref = whatsappLink("مرحباً، لدي استفسار عن اندكس ستور");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		dir: "rtl",
		className: `mt-8 border-t px-5 pb-6 pt-6 transition-colors duration-300 ${isHome ? "border-white/10 bg-gradient-to-br from-[#000209] to-[#0d1435] text-white/90" : "border-border/60 bg-gradient-to-br from-white to-primary-soft/20 text-foreground"}`,
		style: { fontFamily: "Tajawal, system-ui, sans-serif" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-brand",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "h-4.5 w-4.5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "leading-tight",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-black text-primary",
							children: "اندكس ستور"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] text-muted-foreground",
							children: "اختيارك الأفضل"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "flex flex-col gap-2.5 text-[12px] leading-relaxed",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-success" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"للطلب والاستفسار (واتساب):",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: waHref,
									target: "_blank",
									rel: "noopener noreferrer",
									className: "font-bold text-primary underline-offset-2 hover:underline",
									children: STORE_CONTACT
								})
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "العنوان: صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "متوفر لدينا خدمة التوصيل لجميع المحافظات 🇾🇪" })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: waHref,
					target: "_blank",
					rel: "noopener noreferrer",
					className: "mt-1 flex items-center justify-center gap-2 rounded-xl bg-success py-2.5 text-xs font-bold text-success-foreground shadow-brand",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4" }), "تواصل معنا الآن"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "pt-2 text-center text-[10px] text-muted-foreground",
					children: [
						"© اندكس ستور ",
						(/* @__PURE__ */ new Date()).getFullYear(),
						" — جميع الحقوق محفوظة"
					]
				})
			]
		})
	});
}
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isHome = pathname === "/" || pathname === "/app" || pathname === "/app/";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `min-h-screen flex flex-col transition-colors duration-300 ${isHome ? "bg-[#000209] text-white" : "bg-background text-foreground"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, { isHome }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-md md:max-w-6xl lg:max-w-7xl px-4 md:px-6 pb-20 md:pb-12 flex-1",
				children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, { isHome })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, { isHome })
		]
	});
}
function TopBar({ isHome }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [count, setCount] = (0, import_react.useState)(0);
	const items = useCart((s) => s.items);
	(0, import_react.useEffect)(() => {
		setCount(items.reduce((a, i) => a + i.qty, 0));
	}, [items]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: `sticky top-0 z-40 w-full border-b backdrop-blur transition-colors duration-300 ${isHome ? "bg-[#000209]/90 border-white/10 text-white" : "bg-surface/90 border-border/60 text-foreground"} py-3`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-md md:max-w-6xl lg:max-w-7xl items-center justify-between gap-4 px-4 md:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: noqta_logo_default,
						alt: "اندكس ستور",
						className: "h-10 w-10 rounded-xl shadow-brand"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "leading-tight",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `text-base font-black tracking-tight ${isHome ? "text-white" : "text-foreground"}`,
							children: "اندكس ستور"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `text-[10px] ${isHome ? "text-white/60" : "text-muted-foreground"}`,
							children: "اختيارك الأفضل"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "hidden md:flex items-center gap-5",
					children: [
						{
							to: "/",
							label: "الرئيسية",
							icon: House
						},
						{
							to: "/offers",
							label: "العروض",
							icon: Tag
						},
						{
							to: "/cart",
							label: "السلة",
							icon: ShoppingCart,
							badge: count
						},
						{
							to: "/account",
							label: "حسابي",
							icon: User
						}
					].map((tab) => {
						const active = pathname === tab.to;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: tab.to,
							className: `relative flex items-center gap-1.5 text-xs font-bold transition py-1.5 px-3 rounded-lg ${active ? isHome ? "bg-white/10 text-white" : "bg-primary/10 text-primary" : isHome ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(tab.icon, { className: "h-4 w-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tab.label }),
								tab.badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute -top-1.5 -end-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[8px] font-bold text-destructive-foreground",
									children: tab.badge
								}) : null
							]
						}, tab.to);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/search",
					className: `flex flex-1 md:max-w-xs items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${isHome ? "bg-white/10 text-white/70 hover:bg-white/15" : "bg-muted text-muted-foreground hover:bg-muted/70"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ابحث عن منتج..." })]
				})
			]
		})
	});
}
function BottomNav({ isHome }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [count, setCount] = (0, import_react.useState)(0);
	const items = useCart((s) => s.items);
	(0, import_react.useEffect)(() => {
		setCount(items.reduce((a, i) => a + i.qty, 0));
	}, [items]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: `fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t backdrop-blur md:hidden transition-colors duration-300 ${isHome ? "bg-[#000209]/95 border-white/10 text-white" : "bg-surface/95 border-border/60 text-foreground"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid grid-cols-4",
			children: [
				{
					to: "/",
					label: "الرئيسية",
					icon: House
				},
				{
					to: "/offers",
					label: "العروض",
					icon: Tag
				},
				{
					to: "/cart",
					label: "السلة",
					icon: ShoppingCart,
					badge: count
				},
				{
					to: "/account",
					label: "حسابي",
					icon: User
				}
			].map((t) => {
				const active = pathname === t.to;
				const Icon = t.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: t.to,
					className: `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${active ? "text-primary" : isHome ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-foreground"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `h-5 w-5 ${active ? "stroke-[2.5]" : ""}` }), "badge" in t && t.badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -end-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground",
							children: t.badge
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.label })]
				}) }, t.to);
			})
		})
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-black text-primary",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-bold text-foreground",
					children: "الصفحة غير موجودة"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "الرابط الذي تحاول الوصول إليه غير متوفر."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand",
						children: "العودة للرئيسية"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold text-foreground",
					children: "حدث خطأ غير متوقع"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "حاول مرة أخرى أو ارجع للصفحة الرئيسية."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand",
						children: "إعادة المحاولة"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-foreground",
						children: "الرئيسية"
					})]
				})
			]
		})
	});
}
var Route$16 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, maximum-scale=1"
			},
			{
				name: "theme-color",
				content: "#1F5EFF"
			},
			{ title: "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن" },
			{
				name: "description",
				content: "اكتشف أحدث المنتجات والعروض في اندكس ستور: إلكترونيات، أزياء، أدوات منزلية، والمزيد."
			},
			{
				property: "og:title",
				content: "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن"
			},
			{
				property: "og:description",
				content: "اكتشف أحدث المنتجات والعروض في اندكس ستور: إلكترونيات، أزياء، أدوات منزلية، والمزيد."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				property: "og:site_name",
				content: "Indexes Store — اندكس ستور"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:title",
				content: "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن"
			},
			{
				name: "twitter:description",
				content: "اكتشف أحدث المنتجات والعروض في اندكس ستور: إلكترونيات، أزياء، أدوات منزلية، والمزيد."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/da426993-5f26-4733-b40c-c0f1f8e814c7/id-preview-7d22af97--80f7d5cf-5026-49dd-8137-91bdaa674a1a.lovable.app-1783204904911.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/da426993-5f26-4733-b40c-c0f1f8e814c7/id-preview-7d22af97--80f7d5cf-5026-49dd-8137-91bdaa674a1a.lovable.app-1783204904911.png"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}, {
			rel: "icon",
			href: "/favicon.ico",
			type: "image/x-icon"
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "ar",
		dir: "rtl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$16.useRouteContext();
	const router = useRouter();
	const cleanPath = useRouterState({ select: (s) => s.location.pathname }).replace(/^\/app/, "");
	const isAdmin = cleanPath === "/admin" || cleanPath.startsWith("/admin/");
	const isBare = cleanPath === "/immersive-store" || cleanPath.startsWith("/immersive-store/") || cleanPath === "/auth" || cleanPath.startsWith("/auth/");
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((event) => {
			if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
			router.invalidate();
			if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
		});
		return () => sub.subscription.unsubscribe();
	}, [router, queryClient]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TenantProvider, { children: [isAdmin || isBare ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})] })
	});
}
var $$splitComponentImporter$13 = () => import("./onboarding-EFsd4M9b.mjs");
var Route$15 = createFileRoute("/onboarding")({
	head: () => ({ meta: [
		{ title: "أنشئ متجرك — اندكس ستور" },
		{
			name: "description",
			content: "أنشئ متجرك الخاص على منصة اندكس ستور خلال دقيقة."
		},
		{
			name: "robots",
			content: "noindex"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./immersive-store-BCvBAb39.mjs");
var Route$14 = createFileRoute("/immersive-store")({
	head: () => ({ meta: [{ title: "المعرض الافتراضي — اندكس ستور" }, {
		name: "description",
		content: "تجربة تسوق سباتيال فاخرة — استكشف المنتجات ثلاثية الأبعاد بحرية."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./auth-DyvCMPGw.mjs");
var searchSchema = objectType({ next: stringType().optional() });
var Route$13 = createFileRoute("/auth")({
	head: () => ({ meta: [
		{ title: "تسجيل الدخول — اندكس ستور" },
		{
			name: "description",
			content: "سجّل الدخول أو أنشئ حساباً جديداً في اندكس ستور."
		},
		{
			name: "robots",
			content: "noindex"
		}
	] }),
	validateSearch: (s) => searchSchema.parse(s),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./admin-D_uLFvJJ.mjs");
var Route$12 = createFileRoute("/admin")({
	head: () => ({ meta: [
		{ title: "Indexes Store Admin — Dashboard" },
		{
			name: "description",
			content: "AI-powered commerce admin for Indexes Store."
		},
		{
			name: "robots",
			content: "noindex"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./account-CP1jRv93.mjs");
var Route$11 = createFileRoute("/account")({
	head: () => ({ meta: [{ title: "حسابي — اندكس ستور" }] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./admin.index-CPAnyZ_L.mjs");
var Route$10 = createFileRoute("/admin/")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./demo.3d-viewer-DhqGxbU6.mjs");
var Route$9 = createFileRoute("/demo/3d-viewer")({
	component: lazyRouteComponent($$splitComponentImporter$7, "component"),
	head: () => ({ meta: [{ title: "3D Viewer Demo" }, {
		name: "description",
		content: "Preview of the Astryx-powered 3D product viewer and AI generator."
	}] })
});
var $$splitComponentImporter$6 = () => import("./admin.studio-BOEA9xWS.mjs");
var Route$8 = createFileRoute("/admin/studio")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./admin.settings-DorA5v0I.mjs");
var Route$7 = createFileRoute("/admin/settings")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./admin.sessions-CRSPW72N.mjs");
var Route$6 = createFileRoute("/admin/sessions")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./admin.products-BTRxu1wn.mjs");
var Route$5 = createFileRoute("/admin/products")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./admin.platform-DzZuvdm2.mjs");
var Route$4 = createFileRoute("/admin/platform")({
	head: () => ({ meta: [{ title: "Platform — SaaS Tenants" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./admin.inventory-BZggryGw.mjs");
var Route$3 = createFileRoute("/admin/inventory")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./admin.categories-DO-eCuNg.mjs");
var Route$2 = createFileRoute("/admin/categories")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var CORS_HEADERS = {
	"access-control-allow-origin": "*",
	"cross-origin-resource-policy": "cross-origin"
};
var Route$1 = createFileRoute("/api/public/image-proxy")({ server: { handlers: { GET: async ({ request }) => {
	const source = new URL(request.url).searchParams.get("url") ?? "";
	try {
		if (new URL(source).protocol !== "https:") return new Response("Invalid image URL protocol", {
			status: 400,
			headers: CORS_HEADERS
		});
	} catch {
		return new Response("Invalid image URL format", {
			status: 400,
			headers: CORS_HEADERS
		});
	}
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 8e3);
	try {
		const upstream = await fetch(source, {
			signal: controller.signal,
			headers: { accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" }
		});
		if (!upstream.ok || !upstream.body) return new Response("Image not available", {
			status: upstream.status || 502,
			headers: CORS_HEADERS
		});
		const contentType = upstream.headers.get("content-type") || "image/jpeg";
		if (!contentType.startsWith("image/")) return new Response("Unsupported media type", {
			status: 415,
			headers: CORS_HEADERS
		});
		return new Response(upstream.body, {
			status: 200,
			headers: {
				...CORS_HEADERS,
				"content-type": contentType,
				"cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800"
			}
		});
	} catch (err) {
		console.error("Image proxy request failed for URL:", source, err);
		return new Response("Image proxy failed: " + (err instanceof Error ? err.message : String(err)), {
			status: 502,
			headers: CORS_HEADERS
		});
	} finally {
		clearTimeout(timeout);
	}
} } } });
function createLovableGateway(apiKey) {
	return createOpenAICompatible({
		name: "lovable",
		baseURL: "https://ai.gateway.lovable.dev/v1",
		headers: {
			"Lovable-API-Key": apiKey,
			"X-Lovable-AIG-SDK": "vercel-ai-sdk"
		}
	});
}
var InputSchema = objectType({
	hint: stringType().default(""),
	language: enumType(["ar", "en"]).default("ar"),
	images: arrayType(stringType()).max(6).default([])
});
var OutputSchema = objectType({
	title: stringType(),
	description: stringType(),
	category: stringType(),
	slug: stringType(),
	tags: arrayType(stringType()),
	seoTitle: stringType(),
	seoDescription: stringType(),
	priceEstimate: objectType({
		min: numberType(),
		max: numberType(),
		currency: stringType()
	})
});
var Route = createFileRoute("/api/ai/analyze-product")({ server: { handlers: { POST: async ({ request }) => {
	const lovableKey = process.env.LOVABLE_API_KEY;
	const geminiKey = process.env.GEMINI_API_KEY;
	let payload;
	try {
		payload = InputSchema.parse(await request.json());
	} catch (e) {
		return Response.json({
			error: "Invalid input",
			detail: String(e)
		}, { status: 400 });
	}
	let model;
	if (lovableKey) model = createLovableGateway(lovableKey)("google/gemini-3-flash-preview");
	else if (geminiKey) model = createOpenAICompatible({
		name: "gemini",
		baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
		headers: { Authorization: `Bearer ${geminiKey}` }
	})("gemini-1.5-flash");
	else model = createGoogleVertex2({
		location: process.env.VERTEX_LOCATION || "us-central1",
		project: process.env.VERTEX_PROJECT_ID
	})("gemini-1.5-flash");
	const lang = payload.language;
	const systemMsg = lang === "ar" ? "أنت مساعد ذكي لإنشاء بطاقات منتجات لمتجر يمني اسمه اندكس ستور. اكتب بالعربية الفصحى المبسطة. اقترح تصنيفاً واحداً من: المطبخ، التنظيم والتخزين، الجمال والعناية، الصحة والمساج، العدد والأدوات، السيارات، الرياضة واللياقة، الرحلات والخارجية، الأطفال والألعاب، الإلكترونيات، المنزل والديكور، الإضاءة والطاقة، الحيوانات الأليفة، متنوعات. أنشئ slug إنجليزي قصير (kebab-case). السعر بالريال اليمني (YER)." : "You are an AI assistant that creates rich product listings for a modern ecommerce store. Suggest a category, short kebab-case slug, and price range in USD.";
	const userContent = [{
		type: "text",
		text: (lang === "ar" ? "حلّل المنتج التالي وأنشئ بيانات كاملة له. تلميح المستخدم:\n" : "Analyze the following product and generate full metadata. User hint:\n") + (payload.hint || (lang === "ar" ? "(لا يوجد)" : "(none)"))
	}, ...payload.images.map((src) => {
		if (src.startsWith("data:image/")) {
			const matches = src.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
			if (matches) {
				const mimeType = matches[1];
				const base64Data = matches[2];
				return {
					type: "image",
					image: Buffer.from(base64Data, "base64"),
					mimeType
				};
			}
		}
		try {
			return {
				type: "image",
				image: new URL(src)
			};
		} catch {
			return {
				type: "text",
				text: `[رابط صورة: ${src}]`
			};
		}
	})];
	try {
		const { output } = await generateText({
			model,
			system: systemMsg,
			output: output_exports.object({ schema: OutputSchema }),
			messages: [{
				role: "user",
				content: userContent
			}]
		});
		return Response.json(output);
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) return Response.json({
			error: "AI response did not match schema",
			raw: error.text
		}, { status: 502 });
		const message = error instanceof Error ? error.message : String(error);
		const status = /rate|429/i.test(message) ? 429 : /402|credit/i.test(message) ? 402 : 500;
		return Response.json({ error: message }, { status });
	}
} } } });
var SearchRoute = Route$23.update({
	id: "/search",
	path: "/search",
	getParentRoute: () => Route$16
});
var OnboardingRoute = Route$15.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => Route$16
});
var OffersRoute = Route$21.update({
	id: "/offers",
	path: "/offers",
	getParentRoute: () => Route$16
});
var ImmersiveStoreRoute = Route$14.update({
	id: "/immersive-store",
	path: "/immersive-store",
	getParentRoute: () => Route$16
});
var CheckoutRoute = Route$20.update({
	id: "/checkout",
	path: "/checkout",
	getParentRoute: () => Route$16
});
var CartRoute = Route$18.update({
	id: "/cart",
	path: "/cart",
	getParentRoute: () => Route$16
});
var AuthRoute = Route$13.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$16
});
var AdminRoute = Route$12.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => Route$16
});
var AccountRoute = Route$11.update({
	id: "/account",
	path: "/account",
	getParentRoute: () => Route$16
});
var IndexRoute = Route$24.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$16
});
var AdminIndexRoute = Route$10.update({
	id: "/",
	path: "/",
	getParentRoute: () => AdminRoute
});
var ProductSlugRoute = Route$22.update({
	id: "/product/$slug",
	path: "/product/$slug",
	getParentRoute: () => Route$16
});
var Demo3dViewerRoute = Route$9.update({
	id: "/demo/3d-viewer",
	path: "/demo/3d-viewer",
	getParentRoute: () => Route$16
});
var CategoryIdRoute = Route$19.update({
	id: "/category/$id",
	path: "/category/$id",
	getParentRoute: () => Route$16
});
var AdminStudioRoute = Route$8.update({
	id: "/studio",
	path: "/studio",
	getParentRoute: () => AdminRoute
});
var AdminSettingsRoute = Route$7.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => AdminRoute
});
var AdminSessionsRoute = Route$6.update({
	id: "/sessions",
	path: "/sessions",
	getParentRoute: () => AdminRoute
});
var AdminProductsRoute = Route$5.update({
	id: "/products",
	path: "/products",
	getParentRoute: () => AdminRoute
});
var AdminPlatformRoute = Route$4.update({
	id: "/platform",
	path: "/platform",
	getParentRoute: () => AdminRoute
});
var AdminInventoryRoute = Route$3.update({
	id: "/inventory",
	path: "/inventory",
	getParentRoute: () => AdminRoute
});
var AdminCategoriesRoute = Route$2.update({
	id: "/categories",
	path: "/categories",
	getParentRoute: () => AdminRoute
});
var ApiPublicImageProxyRoute = Route$1.update({
	id: "/api/public/image-proxy",
	path: "/api/public/image-proxy",
	getParentRoute: () => Route$16
});
var ApiAiAnalyzeProductRoute = Route.update({
	id: "/api/ai/analyze-product",
	path: "/api/ai/analyze-product",
	getParentRoute: () => Route$16
});
var AdminRouteChildren = {
	AdminCategoriesRoute,
	AdminInventoryRoute,
	AdminPlatformRoute,
	AdminProductsRoute,
	AdminSessionsRoute,
	AdminSettingsRoute,
	AdminStudioRoute,
	AdminIndexRoute,
	AdminProductIdRoute: Route$17.update({
		id: "/product/$id",
		path: "/product/$id",
		getParentRoute: () => AdminRoute
	})
};
var rootRouteChildren = {
	IndexRoute,
	AccountRoute,
	AdminRoute: AdminRoute._addFileChildren(AdminRouteChildren),
	AuthRoute,
	CartRoute,
	CheckoutRoute,
	ImmersiveStoreRoute,
	OffersRoute,
	OnboardingRoute,
	SearchRoute,
	CategoryIdRoute,
	Demo3dViewerRoute,
	ProductSlugRoute,
	ApiAiAnalyzeProductRoute,
	ApiPublicImageProxyRoute
};
var routeTree = Route$16._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
