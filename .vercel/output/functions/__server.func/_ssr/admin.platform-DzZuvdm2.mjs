import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { F as Play, I as Pause, L as Package, P as Plus, bt as Building2, c as Users } from "../_libs/lucide-react.mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D-sVoEic.mjs";
import { t as createSsrRpc } from "./createSsrRpc-DIPEs3na.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { dt as enumType, mt as stringType, pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.platform-DzZuvdm2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Tenant server functions — used by the Global Admin panel and, later,
* by the tenant owner dashboard.
*/
var listTenants = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("30869100389fb2a37f8672706c0b6e63bd34215502c3e6cdde755435f105e546"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("f1c9e9519f6b325cf72fa6963407f00678542664bd07a68b89dc446ddefdd63b"));
var createTenant = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	slug: stringType().min(2).regex(/^[a-z0-9-]+$/),
	name: stringType().min(1),
	owner_user_id: stringType().uuid().nullable().optional(),
	plan: enumType([
		"free",
		"pro",
		"enterprise"
	]).optional()
}).parse(raw)).handler(createSsrRpc("ba12bbaa084943821cf25dab245484c2dcbb36aae267eb11d4624857c17e845c"));
var updateTenantPlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	id: stringType().uuid(),
	plan: enumType([
		"free",
		"pro",
		"enterprise"
	])
}).parse(raw)).handler(createSsrRpc("7985f68bf0b71ce1c5198316ba54627a3ce970714d4a993f6ade2a1b44c27f8e"));
var updateTenantStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	id: stringType().uuid(),
	status: enumType([
		"active",
		"suspended",
		"pending"
	])
}).parse(raw)).handler(createSsrRpc("cab2de93213c63400c3e44d76b8048104375b5a842e7c65a3e943e3282a2b5b9"));
function PlatformPage() {
	const qc = useQueryClient();
	const list = useServerFn(listTenants);
	const create = useServerFn(createTenant);
	const setPlan = useServerFn(updateTenantPlan);
	const setStatus = useServerFn(updateTenantStatus);
	const tenantsQ = useQuery({
		queryKey: ["saas", "tenants"],
		queryFn: () => list()
	});
	const invalidate = () => qc.invalidateQueries({ queryKey: ["saas", "tenants"] });
	const createMut = useMutation({
		mutationFn: (data) => create({ data }),
		onSuccess: invalidate
	});
	const planMut = useMutation({
		mutationFn: (data) => setPlan({ data }),
		onSuccess: invalidate
	});
	const statusMut = useMutation({
		mutationFn: (data) => setStatus({ data }),
		onSuccess: invalidate
	});
	const [showNew, setShowNew] = (0, import_react.useState)(false);
	const [newSlug, setNewSlug] = (0, import_react.useState)("");
	const [newName, setNewName] = (0, import_react.useState)("");
	const [newPlan, setNewPlan] = (0, import_react.useState)("free");
	const submitNew = (e) => {
		e.preventDefault();
		if (!newSlug || !newName) return;
		createMut.mutate({
			slug: newSlug,
			name: newName,
			plan: newPlan
		}, { onSuccess: () => {
			setShowNew(false);
			setNewSlug("");
			setNewName("");
			setNewPlan("free");
		} });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl space-y-6 p-4 md:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl bg-primary/10 p-3 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-6 w-6" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-black",
						children: "Platform / Tenants"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Global SaaS control panel — manage every store on the platform."
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setShowNew((v) => !v),
					className: "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:opacity-90",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " New tenant"]
				})]
			}),
			showNew && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submitNew,
				className: "glass grid grid-cols-1 gap-3 rounded-2xl p-4 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "col-span-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm",
						placeholder: "slug (store1)",
						value: newSlug,
						onChange: (e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")),
						required: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "col-span-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm",
						placeholder: "Store name",
						value: newName,
						onChange: (e) => setNewName(e.target.value),
						required: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "col-span-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm",
						value: newPlan,
						onChange: (e) => setNewPlan(e.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "free",
								children: "Free"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "pro",
								children: "Pro"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "enterprise",
								children: "Enterprise"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "col-span-1 md:col-span-4 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50",
						disabled: createMut.isPending,
						children: createMut.isPending ? "Creating..." : "Create tenant"
					}),
					createMut.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "col-span-4 text-xs text-destructive",
						children: createMut.error.message
					})
				]
			}),
			tenantsQ.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Loading tenants…"
			}),
			tenantsQ.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-destructive",
				children: ["Failed to load: ", tenantsQ.error.message]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4",
				children: [tenantsQ.data?.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "glass grid gap-4 rounded-2xl p-4 md:grid-cols-[1fr_auto] md:items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-bold",
									children: t.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "rounded bg-muted px-1.5 py-0.5 text-xs",
									children: t.slug
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: t.status }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanBadge, { plan: t.plan })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-3 text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-3 w-3" }),
										" ",
										t.usage.products,
										" products"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"· ",
									t.usage.categories,
									" categories"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-3 w-3" }),
										" ",
										t.usage.members,
										" members"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"· limit:",
									" ",
									Number.isFinite(t.limits.maxProducts) ? t.limits.maxProducts : "∞",
									" products"
								] })
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "rounded-lg border border-border bg-background/50 px-2 py-1.5 text-xs",
							value: t.plan,
							onChange: (e) => planMut.mutate({
								id: t.id,
								plan: e.target.value
							}),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "free",
									children: "Free"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "pro",
									children: "Pro"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "enterprise",
									children: "Enterprise"
								})
							]
						}), t.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => statusMut.mutate({
								id: t.id,
								status: "suspended"
							}),
							className: "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "h-3 w-3" }), " Suspend"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => statusMut.mutate({
								id: t.id,
								status: "active"
							}),
							className: "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-3 w-3" }), " Activate"]
						})]
					})]
				}, t.id)), tenantsQ.data?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "No tenants yet."
				})]
			})
		]
	});
}
function StatusBadge({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${status === "active" ? "bg-emerald-500/15 text-emerald-500" : status === "suspended" ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-500"}`,
		children: status
	});
}
function PlanBadge({ plan }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${plan === "enterprise" ? "bg-primary/15 text-primary" : plan === "pro" ? "bg-sky-500/15 text-sky-500" : "bg-muted text-muted-foreground"}`,
		children: plan
	});
}
//#endregion
export { PlatformPage as component };
