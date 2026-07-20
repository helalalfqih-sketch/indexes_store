import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { _ as useNavigate, f as Outlet, g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { Dt as Activity, E as Settings, G as LoaderCircle, L as Package, U as LogOut, V as Menu, Y as Languages, _ as Store, a as X, bt as Building2, q as LayoutDashboard, rt as FolderTree, w as ShieldAlert, xt as Boxes, y as Sparkles } from "../_libs/lucide-react.mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D-sVoEic.mjs";
import { t as supabase } from "./client-BDpLHRM3.mjs";
import { t as noqta_logo_default } from "./noqta-logo-23NpHD9R.mjs";
import { t as createSsrRpc } from "./createSsrRpc-DIPEs3na.mjs";
import { n as useI18n, t as I18nProvider } from "./i18n-ut2VIwHl.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-D_uLFvJJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Returns the current session user with roles and profile, or throws Unauthorized.
* Consumed by client hooks; RLS scoped as the caller.
*/
var getSessionUser = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("b315abc2326c37b8b2cbcd599f0c9210ed4e1a822e88a41d22b6da6a9faecfb4"));
/**
* Grants the current signed-in user the "admin" role IFF no admin exists yet.
* Safe first-admin bootstrap for a fresh Cloud project.
* After the first admin is created, this becomes a no-op.
*/
var claimFirstAdmin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("f69ba697386f27cc1997a0856406673eef7a223ae9c9c372f21b46cbec023940"));
function AdminShell() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(I18nProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellInner, {}) }) });
}
function AdminGate({ children }) {
	const navigate = useNavigate();
	const [status, setStatus] = (0, import_react.useState)("checking");
	const [queryError, setQueryError] = (0, import_react.useState)(null);
	const fetchSessionUser = useServerFn(getSessionUser);
	const { data: sessionUser, isLoading, isError, error } = useQuery({
		queryKey: ["session-user"],
		queryFn: () => fetchSessionUser(),
		retry: false,
		enabled: status !== "unauth"
	});
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => {
			if (!data.session) setStatus("unauth");
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (status === "unauth") navigate({
			to: "/auth",
			search: { next: "/admin" },
			replace: true
		});
	}, [status, navigate]);
	(0, import_react.useEffect)(() => {
		if (isLoading) return;
		if (isError) {
			console.error("Admin user session error:", error);
			setQueryError(error instanceof Error ? error.message : String(error));
			setStatus("no-role");
			return;
		}
		if (!sessionUser) return;
		if (sessionUser.roles.includes("admin")) {
			setQueryError(null);
			setStatus("ok");
		} else setStatus("no-role");
	}, [
		sessionUser,
		isLoading,
		isError,
		error
	]);
	if (status === "ok") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
	if (status === "no-role") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoRoleScreen, {
		onClaimed: () => setStatus("checking"),
		errorMsg: queryError
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[#000209] text-[#EEEEEE] flex items-center justify-center",
		dir: "rtl",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-white/60" })
	});
}
function NoRoleScreen({ onClaimed, errorMsg }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const claim = useServerFn(claimFirstAdmin);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(errorMsg || null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (errorMsg) setError(errorMsg);
	}, [errorMsg]);
	const handleClaim = async () => {
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			if ((await claim()).granted) {
				await queryClient.invalidateQueries({ queryKey: ["session-user"] });
				onClaimed();
			} else setNotice("يوجد مدير آخر بالفعل. تواصل معه لمنحك الصلاحية.");
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[#000209] text-[#EEEEEE] flex items-center justify-center px-4",
		dir: "rtl",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-7 w-7 text-red-400" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold",
					children: "صلاحية الوصول مرفوضة"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-white/60",
					children: "حسابك لا يملك صلاحية دخول لوحة الإدارة. إن كنت مالك المتجر ولم يتم تعيين مدير بعد، يمكنك المطالبة بصلاحية المدير الأول."
				}),
				notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-amber-300",
					children: notice
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-red-300",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleClaim,
							disabled: busy,
							className: "rounded-xl bg-white px-4 py-2 text-sm font-bold text-black disabled:opacity-60",
							children: busy ? "جارٍ..." : "المطالبة بصلاحية المدير الأول"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15",
							children: "العودة للمتجر"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: async () => {
								await supabase.auth.signOut();
								navigate({
									to: "/auth",
									replace: true
								});
							},
							className: "rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5",
							children: "تسجيل الخروج"
						})
					]
				})
			]
		})
	});
}
function ShellInner() {
	const { t, dir, lang, setLang } = useI18n();
	const [open, setOpen] = (0, import_react.useState)(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	(0, import_react.useEffect)(() => {
		if (typeof document === "undefined") return;
		document.documentElement.dir = dir;
		document.documentElement.lang = lang;
	}, [dir, lang]);
	(0, import_react.useEffect)(() => {
		console.log("[ShellInner] pathname:", pathname);
		if (pathname === "/admin" || pathname === "/app/admin") navigate({
			to: "/admin",
			replace: true
		});
	}, [pathname, navigate]);
	(0, import_react.useEffect)(() => {
		setOpen(false);
	}, [pathname]);
	const items = [
		{
			to: "/admin",
			label: t("nav.dashboard"),
			icon: LayoutDashboard,
			exact: true
		},
		{
			to: "/admin/studio",
			label: t("nav.studio"),
			icon: Sparkles
		},
		{
			to: "/admin/products",
			label: t("nav.products"),
			icon: Package
		},
		{
			to: "/admin/categories",
			label: "التصنيفات",
			icon: FolderTree
		},
		{
			to: "/admin/inventory",
			label: "المخزون",
			icon: Boxes
		},
		{
			to: "/admin/platform",
			label: "Platform (SaaS)",
			icon: Building2
		},
		{
			to: "/admin/sessions",
			label: t("nav.sessions"),
			icon: Activity
		},
		{
			to: "/admin/settings",
			label: t("nav.settings"),
			icon: Settings
		}
	];
	const isActive = (to, exact) => exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
	const handleSignOut = async () => {
		await queryClient.cancelQueries();
		queryClient.clear();
		await supabase.auth.signOut();
		navigate({
			to: "/auth",
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		dir,
		className: "relative min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none fixed inset-0 aurora-bg opacity-70" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none fixed inset-0 [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklab,var(--foreground)_10%,transparent)_1px,transparent_0)] [background-size:28px_28px] opacity-30" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: `fixed inset-y-0 z-50 w-72 transform glass-strong transition-transform duration-300 ${dir === "rtl" ? "right-0" : "left-0"} ${open ? "translate-x-0" : dir === "rtl" ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-full flex-col p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/admin",
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: noqta_logo_default,
									alt: "Indexes Store",
									className: "h-11 w-11 rounded-xl neon-ring"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "leading-tight",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-lg font-black",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "neon-text",
											children: "NOQTA"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground",
										children: t("brand.tagline")
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setOpen(false),
								className: "rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden",
								"aria-label": "close",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "mt-8 flex flex-1 flex-col gap-1.5",
							children: items.map((it) => {
								const active = isActive(it.to, it.exact);
								const Icon = it.icon;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: it.to,
									className: `group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${active ? "gradient-brand text-primary-foreground shadow-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`,
									children: [
										active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 rounded-xl animate-pulse-glow" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5 shrink-0" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate",
											children: it.label
										})
									]
								}, it.to);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setLang(lang === "ar" ? "en" : "ar"),
									className: "flex w-full items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-2.5 text-sm font-semibold hover:bg-accent",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Languages, { className: "h-4 w-4" }), lang === "ar" ? "العربية" : "English"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted-foreground",
										children: lang === "ar" ? "AR → EN" : "EN → AR"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/",
									className: "flex w-full items-center gap-2 rounded-xl border border-border/60 px-3.5 py-2.5 text-sm font-semibold hover:bg-accent",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "h-4 w-4" }), t("nav.storefront")]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: handleSignOut,
									className: "flex w-full items-center gap-2 rounded-xl border border-border/60 px-3.5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" }), "تسجيل الخروج"]
								})
							]
						})
					]
				})
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				onClick: () => setOpen(false),
				className: "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: dir === "rtl" ? "lg:pr-72" : "lg:pl-72",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sticky top-0 z-30 flex items-center justify-between gap-3 glass px-4 py-3 lg:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setOpen(true),
							className: "rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden",
							"aria-label": "menu",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-w-0 flex-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate text-sm font-semibold text-muted-foreground",
								children: t("brand.tagline")
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden items-center gap-2 sm:flex",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 animate-pulse rounded-full bg-success" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "AI Online"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "relative mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
				})]
			})
		]
	});
}
var SplitComponent = AdminShell;
//#endregion
export { SplitComponent as component };
