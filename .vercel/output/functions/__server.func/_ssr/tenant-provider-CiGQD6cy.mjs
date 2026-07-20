import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as createSsrRpc } from "./createSsrRpc-DIPEs3na.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { mt as stringType, pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tenant-provider-CiGQD6cy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Public tenant discovery — resolves the tenant for the current request from
* subdomain / header / query, and exposes a safe summary to the client UI.
*
* No auth required: storefronts are public. This does NOT return billing
* or ownership details.
*/
var getCurrentTenant = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({
	slug: stringType().trim().toLowerCase().min(2).max(32).optional(),
	host: stringType().optional()
}).parse(raw ?? {})).handler(createSsrRpc("8736f515471ae0dd7e529b06cef587460c44606544ebc4b2ce71097ad9e0046e"));
/**
* Tenant Provider — resolves the active storefront tenant on the client
* and exposes it via context.
*
* Resolution priority (client side):
*   1. `?tenant=<slug>` query param  (dev / preview override, persisted to sessionStorage)
*   2. sessionStorage("nozon.tenant") — sticky override
*   3. window.location.host           — subdomain resolution on server
*   4. Default tenant (backend fallback)
*/
var TenantCtx = (0, import_react.createContext)(null);
var STORAGE_KEY = "nozon.tenant";
function readInitialOverride() {
	if (typeof window === "undefined") return null;
	const fromQuery = new URL(window.location.href).searchParams.get("tenant");
	if (fromQuery) {
		try {
			window.sessionStorage.setItem(STORAGE_KEY, fromQuery);
		} catch {}
		return fromQuery;
	}
	try {
		return window.sessionStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}
function TenantProvider({ children }) {
	const [slugOverride, setSlugOverrideState] = (0, import_react.useState)(() => readInitialOverride());
	const setSlugOverride = (slug) => {
		setSlugOverrideState(slug);
		if (typeof window !== "undefined") try {
			if (slug) window.sessionStorage.setItem(STORAGE_KEY, slug);
			else window.sessionStorage.removeItem(STORAGE_KEY);
		} catch {}
	};
	const host = typeof window !== "undefined" ? window.location.host : void 0;
	const query = useQuery({
		queryKey: [
			"current-tenant",
			slugOverride,
			host
		],
		queryFn: () => getCurrentTenant({ data: {
			...slugOverride ? { slug: slugOverride } : {},
			...host ? { host } : {}
		} }),
		staleTime: 300 * 1e3
	});
	const value = (0, import_react.useMemo)(() => ({
		tenant: query.data ?? null,
		loading: query.isLoading,
		slugOverride,
		setSlugOverride
	}), [
		query.data,
		query.isLoading,
		slugOverride
	]);
	(0, import_react.useEffect)(() => {
		if (typeof document === "undefined") return;
		const slug = query.data?.slug;
		if (slug) document.documentElement.setAttribute("data-tenant", slug);
	}, [query.data]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TenantCtx.Provider, {
		value,
		children
	});
}
function useCurrentTenant() {
	const ctx = (0, import_react.useContext)(TenantCtx);
	if (!ctx) throw new Error("useCurrentTenant must be used inside <TenantProvider>");
	return ctx;
}
//#endregion
export { useCurrentTenant as n, TenantProvider as t };
