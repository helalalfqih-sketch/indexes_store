import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D-sVoEic.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
import { dt as enumType, mt as stringType, pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tenants.functions-CHQP4tK5.js
var tenantService = {
	async list(db) {
		const { data, error } = await db.from("tenants").select("*").order("created_at", { ascending: false });
		if (error) throw error;
		return data ?? [];
	},
	async get(db, id) {
		const { data, error } = await db.from("tenants").select("*").eq("id", id).maybeSingle();
		if (error) throw error;
		return data;
	},
	async create(db, input) {
		const { data, error } = await db.from("tenants").insert({
			slug: input.slug,
			name: input.name,
			owner_user_id: input.owner_user_id ?? null,
			plan: input.plan ?? "free",
			status: "active"
		}).select("*").single();
		if (error) throw error;
		return data;
	},
	async setStatus(db, id, status) {
		const { data, error } = await db.from("tenants").update({ status }).eq("id", id).select("*").single();
		if (error) throw error;
		return data;
	},
	async setPlan(db, id, plan) {
		const { data, error } = await db.from("tenants").update({ plan }).eq("id", id).select("*").single();
		if (error) throw error;
		return data;
	},
	async usage(db, tenantId) {
		const [{ count: products }, { count: categories }, { count: members }] = await Promise.all([
			db.from("products").select("*", {
				count: "exact",
				head: true
			}).eq("tenant_id", tenantId),
			db.from("categories").select("*", {
				count: "exact",
				head: true
			}).eq("tenant_id", tenantId),
			db.from("tenant_members").select("*", {
				count: "exact",
				head: true
			}).eq("tenant_id", tenantId)
		]);
		return {
			products: products ?? 0,
			categories: categories ?? 0,
			members: members ?? 0
		};
	}
};
var LIMITS = {
	free: {
		maxProducts: 50,
		maxAdmins: 1,
		analytics: false,
		customDomain: false,
		prioritySupport: false,
		label: "Free"
	},
	pro: {
		maxProducts: 1e3,
		maxAdmins: 5,
		analytics: true,
		customDomain: true,
		prioritySupport: false,
		label: "Pro"
	},
	enterprise: {
		maxProducts: Number.POSITIVE_INFINITY,
		maxAdmins: Number.POSITIVE_INFINITY,
		analytics: true,
		customDomain: true,
		prioritySupport: true,
		label: "Enterprise"
	}
};
var planService = {
	limitsFor(plan) {
		return LIMITS[plan];
	},
	canAddProduct(plan, current) {
		return current < LIMITS[plan].maxProducts;
	},
	canAddAdmin(plan, current) {
		return current < LIMITS[plan].maxAdmins;
	},
	allPlans() {
		return [
			"free",
			"pro",
			"enterprise"
		];
	}
};
/**
* Tenant server functions — used by the Global Admin panel and, later,
* by the tenant owner dashboard.
*/
var isPlatformAdmin = async (ctx) => {
	const { data, error } = await ctx.supabase.rpc("has_role", {
		_user_id: ctx.userId,
		_role: "admin"
	});
	if (error) throw error;
	return Boolean(data);
};
var assertPlatformAdmin = async (ctx) => {
	if (!await isPlatformAdmin(ctx)) throw new Error("Forbidden: platform admin required");
};
var listTenants_createServerFn_handler = createServerRpc({
	id: "30869100389fb2a37f8672706c0b6e63bd34215502c3e6cdde755435f105e546",
	name: "listTenants",
	filename: "src/lib/tenants.functions.ts"
}, (opts) => listTenants.__executeServer(opts));
var listTenants = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listTenants_createServerFn_handler, async ({ context }) => {
	await assertPlatformAdmin(context);
	const tenants = await tenantService.list(context.supabase);
	return await Promise.all(tenants.map(async (t) => ({
		...t,
		usage: await tenantService.usage(context.supabase, t.id),
		limits: planService.limitsFor(t.plan)
	})));
});
var getMyTenant_createServerFn_handler = createServerRpc({
	id: "f1c9e9519f6b325cf72fa6963407f00678542664bd07a68b89dc446ddefdd63b",
	name: "getMyTenant",
	filename: "src/lib/tenants.functions.ts"
}, (opts) => getMyTenant.__executeServer(opts));
var getMyTenant = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getMyTenant_createServerFn_handler, async ({ context }) => {
	const own = await context.supabase.from("tenants").select("*").eq("owner_user_id", context.userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
	if (own.data) return {
		tenant: own.data,
		role: "owner"
	};
	const mem = await context.supabase.from("tenant_members").select("role, tenants(*)").eq("user_id", context.userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
	if (!mem.data?.tenants) return null;
	return {
		tenant: mem.data.tenants,
		role: mem.data.role
	};
});
var createTenant_createServerFn_handler = createServerRpc({
	id: "ba12bbaa084943821cf25dab245484c2dcbb36aae267eb11d4624857c17e845c",
	name: "createTenant",
	filename: "src/lib/tenants.functions.ts"
}, (opts) => createTenant.__executeServer(opts));
var createTenant = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	slug: stringType().min(2).regex(/^[a-z0-9-]+$/),
	name: stringType().min(1),
	owner_user_id: stringType().uuid().nullable().optional(),
	plan: enumType([
		"free",
		"pro",
		"enterprise"
	]).optional()
}).parse(raw)).handler(createTenant_createServerFn_handler, async ({ data, context }) => {
	await assertPlatformAdmin(context);
	return tenantService.create(context.supabase, data);
});
var updateTenantPlan_createServerFn_handler = createServerRpc({
	id: "7985f68bf0b71ce1c5198316ba54627a3ce970714d4a993f6ade2a1b44c27f8e",
	name: "updateTenantPlan",
	filename: "src/lib/tenants.functions.ts"
}, (opts) => updateTenantPlan.__executeServer(opts));
var updateTenantPlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	id: stringType().uuid(),
	plan: enumType([
		"free",
		"pro",
		"enterprise"
	])
}).parse(raw)).handler(updateTenantPlan_createServerFn_handler, async ({ data, context }) => {
	await assertPlatformAdmin(context);
	return tenantService.setPlan(context.supabase, data.id, data.plan);
});
var updateTenantStatus_createServerFn_handler = createServerRpc({
	id: "cab2de93213c63400c3e44d76b8048104375b5a842e7c65a3e943e3282a2b5b9",
	name: "updateTenantStatus",
	filename: "src/lib/tenants.functions.ts"
}, (opts) => updateTenantStatus.__executeServer(opts));
var updateTenantStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	id: stringType().uuid(),
	status: enumType([
		"active",
		"suspended",
		"pending"
	])
}).parse(raw)).handler(updateTenantStatus_createServerFn_handler, async ({ data, context }) => {
	await assertPlatformAdmin(context);
	return tenantService.setStatus(context.supabase, data.id, data.status);
});
//#endregion
export { createTenant_createServerFn_handler, getMyTenant_createServerFn_handler, listTenants_createServerFn_handler, updateTenantPlan_createServerFn_handler, updateTenantStatus_createServerFn_handler };
