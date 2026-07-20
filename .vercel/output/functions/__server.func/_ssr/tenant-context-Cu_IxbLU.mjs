//#region node_modules/.nitro/vite/services/ssr/assets/tenant-context-Cu_IxbLU.js
var DEFAULT_TENANT_SLUG = "default";
var parseSubdomainSlug = (host) => {
	if (!host) return null;
	const parts = host.split(":")[0].split(".");
	if (parts.length < 3) return null;
	const sub = parts[0].toLowerCase();
	if ([
		"www",
		"app",
		"admin",
		"api",
		"localhost",
		"default"
	].includes(sub)) return null;
	return sub;
};
async function resolveTenantId(db, opts = {}) {
	if (opts.override) return opts.override;
	const readHeader = (name) => {
		if (!opts.headers) return null;
		if (opts.headers instanceof Headers) return opts.headers.get(name);
		return opts.headers[name] ?? opts.headers[name.toLowerCase()] ?? null;
	};
	const headerId = readHeader("x-tenant-id");
	if (headerId && /^[0-9a-f-]{36}$/i.test(headerId)) return headerId;
	const headerSlug = readHeader("x-tenant-slug") ?? parseSubdomainSlug(readHeader("host"));
	if (headerSlug) {
		const bySlug = await db.from("tenants").select("id").eq("slug", headerSlug).maybeSingle();
		if (bySlug.data) return bySlug.data.id;
	}
	if (opts.userId) {
		const own = await db.from("tenants").select("id").eq("owner_user_id", opts.userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
		if (own.data) return own.data.id;
		const member = await db.from("tenant_members").select("tenant_id").eq("user_id", opts.userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
		if (member.data) return member.data.tenant_id;
	}
	return getDefaultTenantId(db);
}
var _defaultTenantId = null;
async function getDefaultTenantId(db) {
	if (_defaultTenantId) return _defaultTenantId;
	const { data, error } = await db.from("tenants").select("id").eq("slug", DEFAULT_TENANT_SLUG).maybeSingle();
	if (error) throw error;
	if (!data) throw new Error("Default tenant not found — run SaaS migration.");
	_defaultTenantId = data.id;
	return _defaultTenantId;
}
async function getTenant(db, id) {
	const { data, error } = await db.from("tenants").select("id, slug, name, plan, status").eq("id", id).maybeSingle();
	if (error) throw error;
	return data;
}
//#endregion
export { getTenant as n, resolveTenantId as r, DEFAULT_TENANT_SLUG as t };
