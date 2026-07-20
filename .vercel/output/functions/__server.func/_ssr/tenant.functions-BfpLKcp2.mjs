import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as getRequest } from "./server-DuGX_xsT.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
import { mt as stringType, pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { n as getTenant, r as resolveTenantId, t as DEFAULT_TENANT_SLUG } from "./tenant-context-Cu_IxbLU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tenant.functions-BfpLKcp2.js
/**
* Public tenant discovery — resolves the tenant for the current request from
* subdomain / header / query, and exposes a safe summary to the client UI.
*
* No auth required: storefronts are public. This does NOT return billing
* or ownership details.
*/
var publicClient = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: {
	storage: void 0,
	persistSession: false,
	autoRefreshToken: false
} });
var readRequestHost = () => {
	try {
		return getRequest().headers.get("host");
	} catch {
		return null;
	}
};
var readRequestHeaders = () => {
	try {
		return getRequest().headers;
	} catch {
		return null;
	}
};
var getCurrentTenant_createServerFn_handler = createServerRpc({
	id: "8736f515471ae0dd7e529b06cef587460c44606544ebc4b2ce71097ad9e0046e",
	name: "getCurrentTenant",
	filename: "src/lib/tenant.functions.ts"
}, (opts) => getCurrentTenant.__executeServer(opts));
var getCurrentTenant = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({
	slug: stringType().trim().toLowerCase().min(2).max(32).optional(),
	host: stringType().optional()
}).parse(raw ?? {})).handler(getCurrentTenant_createServerFn_handler, async ({ data }) => {
	const db = publicClient();
	const headers = new Headers(readRequestHeaders() ?? void 0);
	if (data.host) headers.set("host", data.host);
	if (data.slug) headers.set("x-tenant-slug", data.slug);
	const id = await resolveTenantId(db, { headers });
	const tenant = await getTenant(db, id);
	if (!tenant) return {
		id,
		slug: DEFAULT_TENANT_SLUG,
		name: "Default Store",
		plan: "free",
		status: "active",
		isDefault: true,
		host: data.host ?? readRequestHost()
	};
	return {
		...tenant,
		isDefault: tenant.slug === DEFAULT_TENANT_SLUG,
		host: data.host ?? readRequestHost()
	};
});
//#endregion
export { getCurrentTenant_createServerFn_handler };
