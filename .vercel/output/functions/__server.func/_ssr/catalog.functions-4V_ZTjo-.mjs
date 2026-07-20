import { t as createMiddleware } from "./createStart-Dt05N14y.mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D-sVoEic.mjs";
import { t as supabase } from "./client-BDpLHRM3.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
import { ft as numberType, lt as arrayType, mt as stringType, pt as objectType, ut as booleanType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { a as productUpdateSchema, i as productInputSchema, n as categoryUpdateSchema, r as inventoryMovementSchema, t as categoryInputSchema } from "./catalog-yfetUeY8.mjs";
import { r as resolveTenantId } from "./tenant-context-Cu_IxbLU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/catalog.functions-4V_ZTjo-.js
var toDTO$2 = (r) => ({
	id: r.id,
	slug: r.slug,
	name: r.name,
	description: r.description ?? "",
	price: Number(r.price),
	currency: r.currency,
	category_id: r.category_id,
	brand: r.brand,
	images: r.images ?? [],
	model_url: r.model_url,
	stock: r.stock,
	reserved_stock: r.reserved_stock,
	rating: Number(r.rating),
	reviews_count: r.reviews_count,
	tags: r.tags ?? [],
	is_published: r.is_published,
	created_at: r.created_at,
	updated_at: r.updated_at,
	video_playback_id: r.video_playback_id,
	old_price: r.old_price != null ? Number(r.old_price) : null,
	badge: r.badge,
	sku: r.sku,
	barcode: r.barcode,
	compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : null,
	cost_price: r.cost_price != null ? Number(r.cost_price) : null,
	model_3d_url: r.model_3d_url,
	model_3d_thumbnail: r.model_3d_thumbnail,
	model_3d_status: r.model_3d_status,
	availability: r.availability,
	condition: r.condition,
	source_url: r.source_url,
	meta_sync_status: r.meta_sync_status
});
var productsRepo = {
	async list(db, filters = {}) {
		let q = db.from("products").select("*").order("created_at", { ascending: false });
		if (filters.tenantId) q = q.eq("tenant_id", filters.tenantId);
		if (!filters.includeUnpublished) q = q.eq("is_published", true);
		if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
		if (filters.search) q = q.ilike("name", `%${filters.search}%`);
		if (filters.limit) q = q.limit(filters.limit);
		if (filters.offset != null && filters.limit) q = q.range(filters.offset, filters.offset + filters.limit - 1);
		const { data, error } = await q;
		if (error) throw error;
		return (data ?? []).map(toDTO$2);
	},
	async getBySlug(db, slug, tenantId) {
		let q = db.from("products").select("*").eq("slug", slug);
		if (tenantId) q = q.eq("tenant_id", tenantId);
		const { data, error } = await q.maybeSingle();
		if (error) throw error;
		return data ? toDTO$2(data) : null;
	},
	async getById(db, id, tenantId) {
		let q = db.from("products").select("*").eq("id", id);
		if (tenantId) q = q.eq("tenant_id", tenantId);
		const { data, error } = await q.maybeSingle();
		if (error) throw error;
		return data ? toDTO$2(data) : null;
	},
	async create(db, tenantId, input) {
		if (!tenantId) throw new Error("productsRepo.create: tenantId required");
		const { data, error } = await db.from("products").insert({
			...input,
			tenant_id: tenantId
		}).select("*").single();
		if (error) throw error;
		return toDTO$2(data);
	},
	async update(db, tenantId, id, patch) {
		if (!tenantId) throw new Error("productsRepo.update: tenantId required");
		const { data, error } = await db.from("products").update(patch).eq("id", id).eq("tenant_id", tenantId).select("*").single();
		if (error) throw error;
		return toDTO$2(data);
	},
	async remove(db, tenantId, id) {
		if (!tenantId) throw new Error("productsRepo.remove: tenantId required");
		const { error } = await db.from("products").delete().eq("id", id).eq("tenant_id", tenantId);
		if (error) throw error;
	},
	async count(db, filters = {}) {
		let q = db.from("products").select("*", {
			count: "exact",
			head: true
		});
		if (filters.tenantId) q = q.eq("tenant_id", filters.tenantId);
		if (!filters.includeUnpublished) q = q.eq("is_published", true);
		if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
		const { count, error } = await q;
		if (error) throw error;
		return count ?? 0;
	}
};
var toDTO$1 = (r) => ({
	id: r.id,
	slug: r.slug,
	name: r.name,
	description: r.description,
	image_url: r.image_url,
	parent_id: r.parent_id,
	sort: r.sort,
	icon: r.icon,
	color: r.color,
	is_active: r.is_active
});
var categoriesRepo = {
	async list(db, opts = {}) {
		let q = db.from("categories").select("*").order("sort", { ascending: true });
		if (opts.tenantId) q = q.eq("tenant_id", opts.tenantId);
		if (!opts.includeInactive) q = q.eq("is_active", true);
		const { data, error } = await q;
		if (error) throw error;
		return (data ?? []).map(toDTO$1);
	},
	async getBySlug(db, slug, tenantId) {
		let q = db.from("categories").select("*").eq("slug", slug);
		if (tenantId) q = q.eq("tenant_id", tenantId);
		const { data, error } = await q.maybeSingle();
		if (error) throw error;
		return data ? toDTO$1(data) : null;
	},
	async getById(db, id, tenantId) {
		let q = db.from("categories").select("*").eq("id", id);
		if (tenantId) q = q.eq("tenant_id", tenantId);
		const { data, error } = await q.maybeSingle();
		if (error) throw error;
		return data ? toDTO$1(data) : null;
	},
	async create(db, tenantId, input) {
		if (!tenantId) throw new Error("categoriesRepo.create: tenantId required");
		const { data, error } = await db.from("categories").insert({
			...input,
			tenant_id: tenantId
		}).select("*").single();
		if (error) throw error;
		return toDTO$1(data);
	},
	async update(db, tenantId, id, patch) {
		if (!tenantId) throw new Error("categoriesRepo.update: tenantId required");
		const { data, error } = await db.from("categories").update(patch).eq("id", id).eq("tenant_id", tenantId).select("*").single();
		if (error) throw error;
		return toDTO$1(data);
	},
	async remove(db, tenantId, id) {
		if (!tenantId) throw new Error("categoriesRepo.remove: tenantId required");
		const { error } = await db.from("categories").delete().eq("id", id).eq("tenant_id", tenantId);
		if (error) throw error;
	}
};
var toDTO = (r) => ({
	id: r.id,
	product_id: r.product_id,
	delta: r.delta,
	reason: r.reason,
	reference: r.reference,
	note: r.note,
	created_by: r.created_by,
	created_at: r.created_at
});
var inventoryRepo = {
	async listByProduct(db, tenantId, productId, limit = 50) {
		if (!tenantId) throw new Error("inventoryRepo.listByProduct: tenantId required");
		const { data, error } = await db.from("inventory_movements").select("*").eq("tenant_id", tenantId).eq("product_id", productId).order("created_at", { ascending: false }).limit(limit);
		if (error) throw error;
		return (data ?? []).map(toDTO);
	},
	async record(db, tenantId, input) {
		if (!tenantId) throw new Error("inventoryRepo.record: tenantId required");
		const { data, error } = await db.from("inventory_movements").insert({
			...input,
			tenant_id: tenantId
		}).select("*").single();
		if (error) throw error;
		return toDTO(data);
	}
};
/**
* Catalog Server Functions — thin RPC wrappers over repositories.
* - Public reads use the server publishable client (respects RLS as anon)
*   and are scoped to the resolved tenant (subdomain / header / default).
* - Admin writes use requireSupabaseAuth + admin role check and require
*   an explicit tenant context (or fall back to the user's tenant).
*/
var publicClient = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: {
	storage: void 0,
	persistSession: false,
	autoRefreshToken: false
} });
var readHeaders = async () => {
	try {
		const { getRequest } = await import("./server-DuGX_xsT.mjs").then((n) => n.i).then((n) => n.t);
		return getRequest().headers;
	} catch {
		return null;
	}
};
var resolvePublicTenant = async (db, override) => resolveTenantId(db, {
	override,
	headers: await readHeaders()
});
var assertAdmin = async (ctx) => {
	const { data, error } = await ctx.supabase.rpc("has_role", {
		_user_id: ctx.userId,
		_role: "admin"
	});
	if (error) throw error;
	if (!data) throw new Error("Forbidden: admin required");
};
var resolveAdminTenant = async (ctx, override) => {
	return resolveTenantId(ctx.supabase, {
		override,
		headers: await readHeaders(),
		userId: ctx.userId
	});
};
var GLOBAL_CSV_URL = "https://firebasestorage.googleapis.com/v0/b/smartcontentcreator-d49f2.firebasestorage.app/o/catalogs%2Fglobal%2Fcatalog.csv?alt=media&token=8d793707-b96a-4ee9-bca1-0912af180138&ext=.csv";
function parseCsv(text) {
	const rows = [];
	let row = [];
	let cur = "";
	let inQuotes = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (inQuotes) if (c === "\"") if (text[i + 1] === "\"") {
			cur += "\"";
			i++;
		} else inQuotes = false;
		else cur += c;
		else if (c === "\"") inQuotes = true;
		else if (c === ",") {
			row.push(cur);
			cur = "";
		} else if (c === "\n" || c === "\r") {
			if (c === "\r" && text[i + 1] === "\n") i++;
			row.push(cur);
			cur = "";
			if (row.length > 1 || row[0] !== "") rows.push(row);
			row = [];
		} else cur += c;
	}
	if (cur.length > 0 || row.length > 0) {
		row.push(cur);
		rows.push(row);
	}
	return rows;
}
function slugify(input, fallback) {
	return input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || fallback;
}
function parsePrice(raw) {
	const s = (raw || "").trim();
	if (!s) return {
		price: 0,
		currency: "YER"
	};
	const m = s.match(/([\d.,]+)\s*([A-Za-z]{3})?/);
	const price = m ? Number(m[1].replace(/,/g, "")) : 0;
	return {
		price: Number.isFinite(price) ? price : 0,
		currency: (m?.[2] || "YER").toUpperCase()
	};
}
async function fetchCsvProducts() {
	try {
		const res = await fetch(GLOBAL_CSV_URL);
		if (!res.ok) {
			console.error(`Failed to fetch CSV: ${res.status}`);
			return [];
		}
		const rows = parseCsv(await res.text());
		if (rows.length < 2) return [];
		const header = rows[0].map((h) => h.trim());
		const col = (name) => header.indexOf(name);
		const idIdx = col("id");
		const titleIdx = col("title");
		const descIdx = col("description");
		const availIdx = col("availability");
		const condIdx = col("condition");
		const priceIdx = col("price");
		const linkIdx = col("link");
		const imageIdx = col("image_link");
		const brandIdx = col("brand");
		const qtyIdx = col("quantity_to_sell_on_facebook");
		const skuIdx = col("sku");
		const barcodeIdx = header.findIndex((h) => h === "gtin" || h === "barcode");
		const salePriceIdx = col("sale_price");
		const costPriceIdx = col("cost_price");
		const colorIdx = col("color");
		const sizeIdx = col("size");
		const gcatIdx = col("google_product_category");
		const fbcatIdx = col("fb_product_category");
		const materialIdx = col("material");
		const patternIdx = col("pattern");
		const genderIdx = col("gender");
		const ageGroupIdx = col("age_group");
		const productTypeIdx = col("product_type");
		const seenSlugs = /* @__PURE__ */ new Set();
		const products = [];
		for (let r = 1; r < rows.length; r++) {
			const row = rows[r];
			if (!row || row.every((c) => !c?.trim())) continue;
			const title = (row[titleIdx] || "").trim();
			if (!title) continue;
			const externalId = idIdx >= 0 ? (row[idIdx] || "").trim() || null : null;
			const { price: regPrice, currency } = parsePrice(row[priceIdx] || "");
			const { price: salePrice } = salePriceIdx >= 0 ? parsePrice(row[salePriceIdx] || "") : { price: 0 };
			const { price: costPrice } = costPriceIdx >= 0 ? parsePrice(row[costPriceIdx] || "") : { price: 0 };
			let price = regPrice;
			let compareAtPrice = null;
			if (salePrice > 0 && salePrice < regPrice) {
				price = salePrice;
				compareAtPrice = regPrice;
			}
			const image = (row[imageIdx] || "").trim();
			const stockRaw = qtyIdx >= 0 ? Number((row[qtyIdx] || "").trim()) : NaN;
			const stock = Number.isFinite(stockRaw) && stockRaw >= 0 ? Math.floor(stockRaw) : 1;
			let slug = slugify(title, externalId ?? `product-${r}`);
			let uniq = slug;
			let i = 2;
			while (seenSlugs.has(uniq)) uniq = `${slug}-${i++}`.slice(0, 60);
			seenSlugs.add(uniq);
			slug = uniq;
			const tags = [];
			const color = colorIdx >= 0 ? (row[colorIdx] || "").trim() : "";
			const size = sizeIdx >= 0 ? (row[sizeIdx] || "").trim() : "";
			const gcat = gcatIdx >= 0 ? (row[gcatIdx] || "").trim() : "";
			const fbcat = fbcatIdx >= 0 ? (row[fbcatIdx] || "").trim() : "";
			const material = materialIdx >= 0 ? (row[materialIdx] || "").trim() : "";
			const pattern = patternIdx >= 0 ? (row[patternIdx] || "").trim() : "";
			const gender = genderIdx >= 0 ? (row[genderIdx] || "").trim() : "";
			const ageGroup = ageGroupIdx >= 0 ? (row[ageGroupIdx] || "").trim() : "";
			if (color) tags.push(`_color:${color}`);
			if (size) tags.push(`_size:${size}`);
			if (gcat) tags.push(`_gcat:${gcat}`);
			if (fbcat) tags.push(`_fbcat:${fbcat}`);
			if (material) tags.push(`_material:${material}`);
			if (pattern) tags.push(`_pattern:${pattern}`);
			if (gender) tags.push(`_gender:${gender}`);
			if (ageGroup) tags.push(`_age:${ageGroup}`);
			const images = [];
			if (image) images.push(image);
			header.forEach((h, idx) => {
				if (h.startsWith("additional_image_link") && row[idx]) {
					const imgUrl = row[idx].trim();
					if (imgUrl) images.push(imgUrl);
				}
			});
			const categoryName = productTypeIdx >= 0 ? (row[productTypeIdx] || "").trim() : "أخرى";
			const categoryId = slugify(categoryName, "other");
			products.push({
				id: externalId || `product-${r}`,
				slug,
				name: title,
				description: (descIdx >= 0 ? row[descIdx] : "") || "",
				price,
				compare_at_price: compareAtPrice,
				cost_price: costPrice > 0 ? costPrice : null,
				currency: currency || "YER",
				images: images.filter(Boolean),
				stock,
				reserved_stock: 0,
				rating: 5,
				reviews_count: 0,
				tags,
				is_published: true,
				created_at: (/* @__PURE__ */ new Date()).toISOString(),
				updated_at: (/* @__PURE__ */ new Date()).toISOString(),
				brand: (brandIdx >= 0 ? (row[brandIdx] || "").trim() : "") || null,
				availability: (availIdx >= 0 ? (row[availIdx] || "").trim() : "") || null,
				condition: (condIdx >= 0 ? (row[condIdx] || "").trim() : "") || null,
				source_url: (linkIdx >= 0 ? (row[linkIdx] || "").trim() : "") || null,
				sku: skuIdx >= 0 ? (row[skuIdx] || "").trim() || null : null,
				barcode: barcodeIdx >= 0 ? (row[barcodeIdx] || "").trim() || null : null,
				category_id: categoryId,
				category_name: categoryName
			});
		}
		return products;
	} catch (error) {
		console.error("Error reading CSV catalog feed:", error);
		return [];
	}
}
var listProducts_createServerFn_handler = createServerRpc({
	id: "ec305e715d428bd5a056174d65530dc3f73a4aae7224baa7e85f3de5db811249",
	name: "listProducts",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => listProducts.__executeServer(opts));
var listProducts = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({
	tenantId: stringType().uuid().optional(),
	categoryId: stringType().optional(),
	search: stringType().optional(),
	limit: numberType().int().min(1).max(100).optional(),
	offset: numberType().int().min(0).optional()
}).parse(raw ?? {})).handler(listProducts_createServerFn_handler, async ({ data }) => {
	let list = await fetchCsvProducts();
	if (data.categoryId) list = list.filter((p) => p.category_id === data.categoryId);
	if (data.search) {
		const s = data.search.toLowerCase();
		list = list.filter((p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
	}
	if (data.offset != null && data.limit) list = list.slice(data.offset, data.offset + data.limit);
	else if (data.limit) list = list.slice(0, data.limit);
	return list;
});
var getProductBySlug_createServerFn_handler = createServerRpc({
	id: "338e414efdb61533c60e3c1671e7aea82e763a0409c4afad4a1f474e3d8c65ce",
	name: "getProductBySlug",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => getProductBySlug.__executeServer(opts));
var getProductBySlug = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({
	slug: stringType(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(getProductBySlug_createServerFn_handler, async ({ data }) => {
	return (await fetchCsvProducts()).find((p) => p.slug === data.slug) || null;
});
var getProductsByIds_createServerFn_handler = createServerRpc({
	id: "4fa5c2a98931b84edff5daf4ea734d250404d1a8e87ce63abf9cef47224b27f9",
	name: "getProductsByIds",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => getProductsByIds.__executeServer(opts));
var getProductsByIds = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({
	ids: arrayType(stringType().min(1)).min(1).max(50),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(getProductsByIds_createServerFn_handler, async ({ data }) => {
	const db = publicClient();
	const tenantId = await resolvePublicTenant(db, data.tenantId ?? null);
	const ids = data.ids;
	const rowToDTO = (r) => ({
		id: r.id,
		slug: r.slug,
		name: r.name,
		description: r.description ?? "",
		price: Number(r.price),
		currency: r.currency,
		category_id: r.category_id,
		brand: r.brand,
		images: r.images ?? [],
		model_url: r.model_url,
		stock: r.stock,
		reserved_stock: r.reserved_stock,
		rating: Number(r.rating),
		reviews_count: r.reviews_count,
		tags: r.tags ?? [],
		is_published: r.is_published,
		created_at: r.created_at,
		updated_at: r.updated_at,
		video_playback_id: r.video_playback_id,
		old_price: r.old_price != null ? Number(r.old_price) : null,
		badge: r.badge,
		sku: r.sku,
		barcode: r.barcode,
		compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : null,
		cost_price: r.cost_price != null ? Number(r.cost_price) : null,
		model_3d_url: r.model_3d_url,
		model_3d_thumbnail: r.model_3d_thumbnail,
		model_3d_status: r.model_3d_status,
		availability: r.availability,
		condition: r.condition,
		source_url: r.source_url,
		meta_sync_status: r.meta_sync_status
	});
	const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const uuids = ids.filter((id) => UUID_RE.test(id));
	const nonUuids = ids.filter((id) => !UUID_RE.test(id));
	const [byId, byExtId, bySlug] = await Promise.all([
		uuids.length > 0 ? db.from("products").select("*").eq("tenant_id", tenantId).eq("is_published", true).in("id", uuids) : Promise.resolve({
			data: [],
			error: null
		}),
		nonUuids.length > 0 ? db.from("products").select("*").eq("tenant_id", tenantId).eq("is_published", true).in("external_id", nonUuids) : Promise.resolve({
			data: [],
			error: null
		}),
		nonUuids.length > 0 ? db.from("products").select("*").eq("tenant_id", tenantId).eq("is_published", true).in("slug", nonUuids) : Promise.resolve({
			data: [],
			error: null
		})
	]);
	const collected = /* @__PURE__ */ new Map();
	for (const r of [
		...byId.data ?? [],
		...byExtId.data ?? [],
		...bySlug.data ?? []
	]) if (!collected.has(r.id)) collected.set(r.id, rowToDTO(r));
	const results = Array.from(collected.values());
	const idOrder = /* @__PURE__ */ new Map();
	ids.forEach((id, i) => idOrder.set(id.toLowerCase(), i));
	results.sort((a, b) => {
		const rank = (p) => Math.min(idOrder.get(p.id.toLowerCase()) ?? 999, idOrder.get(p.slug.toLowerCase()) ?? 999);
		return rank(a) - rank(b);
	});
	return results;
});
var listCategories_createServerFn_handler = createServerRpc({
	id: "9093087a4fde30e7cbeefd735d6dccc2718ef5ec811563a10f9b01884489c6f6",
	name: "listCategories",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => listCategories.__executeServer(opts));
var listCategories = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({ tenantId: stringType().uuid().optional() }).parse(raw ?? {})).handler(listCategories_createServerFn_handler, async () => {
	const products = await fetchCsvProducts();
	const categoriesMap = /* @__PURE__ */ new Map();
	products.forEach((p) => {
		if (p.category_name && p.category_id) {
			if (!categoriesMap.has(p.category_id)) categoriesMap.set(p.category_id, {
				id: p.category_id,
				slug: p.category_id,
				name: p.category_name,
				description: "",
				image_url: p.images[0] || null,
				parent_id: null,
				sort: 0,
				icon: "shopping-bag",
				color: null,
				is_active: true
			});
		}
	});
	return Array.from(categoriesMap.values());
});
var getCategoryBySlug_createServerFn_handler = createServerRpc({
	id: "5488941a246672c11e7e731b5355bc6486887024c8f5ad9aee9839ae4866f700",
	name: "getCategoryBySlug",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => getCategoryBySlug.__executeServer(opts));
var getCategoryBySlug = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({
	slug: stringType(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(getCategoryBySlug_createServerFn_handler, async ({ data }) => {
	return (await listCategories()).find((c) => c.slug === data.slug) || null;
});
var tenantScope = objectType({ tenantId: stringType().uuid().optional() });
var adminListProducts_createServerFn_handler = createServerRpc({
	id: "e6e21352e939db3a5ba878cfadec63257aac0498924c61464adabf0555eb43e3",
	name: "adminListProducts",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminListProducts.__executeServer(opts));
var adminListProducts = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	tenantId: stringType().uuid().optional(),
	search: stringType().trim().max(120).optional(),
	categoryId: stringType().uuid().optional(),
	publishedOnly: booleanType().optional(),
	unpublishedOnly: booleanType().optional(),
	outOfStock: booleanType().optional()
}).parse(raw ?? {})).handler(adminListProducts_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const tenantId = await resolveAdminTenant(ctx, data.tenantId);
	let csvList = await fetchCsvProducts();
	if (data.search) {
		const s = data.search.toLowerCase();
		csvList = csvList.filter((p) => p.name.toLowerCase().includes(s) || (p.description ?? "").toLowerCase().includes(s));
	}
	const { data: dbRows } = await ctx.supabase.from("products").select("id, external_id, slug, meta_sync_status, is_published, updated_at, old_price, badge, video_playback_id, model_url, model_3d_url, model_3d_thumbnail, model_3d_status, sku, barcode, compare_at_price, cost_price, availability, condition, source_url, tags, currency, category_id, brand").eq("tenant_id", tenantId);
	const dbByExtId = /* @__PURE__ */ new Map();
	const dbBySlug = /* @__PURE__ */ new Map();
	for (const row of dbRows ?? []) {
		if (row.external_id) dbByExtId.set(row.external_id, row);
		if (row.slug) dbBySlug.set(row.slug, row);
	}
	let filtered = csvList.map((csv) => {
		const db = dbByExtId.get(csv.id) ?? dbBySlug.get(csv.slug) ?? null;
		return {
			id: db?.id ?? csv.id,
			slug: csv.slug,
			name: csv.name,
			description: csv.description ?? "",
			price: csv.price,
			currency: db?.currency ?? csv.currency ?? "YER",
			images: csv.images ?? [],
			stock: csv.stock ?? 0,
			reserved_stock: csv.reserved_stock ?? 0,
			rating: csv.rating ?? 5,
			reviews_count: csv.reviews_count ?? 0,
			tags: db?.tags ?? csv.tags ?? [],
			category_id: db?.category_id ?? null,
			brand: db?.brand ?? csv.brand ?? null,
			availability: db?.availability ?? csv.availability ?? null,
			condition: db?.condition ?? csv.condition ?? null,
			source_url: db?.source_url ?? csv.source_url ?? null,
			sku: db?.sku ?? csv.sku ?? null,
			barcode: db?.barcode ?? csv.barcode ?? null,
			compare_at_price: db?.compare_at_price ?? csv.compare_at_price ?? null,
			cost_price: db?.cost_price ?? csv.cost_price ?? null,
			model_url: db?.model_url ?? null,
			model_3d_url: db?.model_3d_url ?? null,
			model_3d_thumbnail: db?.model_3d_thumbnail ?? null,
			model_3d_status: db?.model_3d_status ?? null,
			video_playback_id: db?.video_playback_id ?? null,
			old_price: db?.old_price ?? null,
			badge: db?.badge ?? null,
			is_published: db?.is_published ?? true,
			meta_sync_status: db?.meta_sync_status ?? "not_synced",
			created_at: csv.created_at,
			updated_at: db?.updated_at ?? csv.updated_at,
			tenant_id: tenantId
		};
	});
	if (data.publishedOnly) filtered = filtered.filter((r) => r.is_published);
	if (data.unpublishedOnly) filtered = filtered.filter((r) => !r.is_published);
	if (data.outOfStock) filtered = filtered.filter((r) => r.stock <= 0);
	return filtered;
});
var adminGetProduct_createServerFn_handler = createServerRpc({
	id: "703440c04edbe7d7589447d4a582fd36961c873d4804e9030b35779a0f9f5345",
	name: "adminGetProduct",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminGetProduct.__executeServer(opts));
var adminGetProduct = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	id: stringType().uuid(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(adminGetProduct_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const tenantId = await resolveAdminTenant(ctx, data.tenantId);
	return productsRepo.getById(ctx.supabase, data.id, tenantId);
});
var adminListCategories_createServerFn_handler = createServerRpc({
	id: "5de4dc944a006c369d93b04878277c48bf137e5f414c453c8f056278d7013242",
	name: "adminListCategories",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminListCategories.__executeServer(opts));
var adminListCategories = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((raw) => tenantScope.parse(raw ?? {})).handler(adminListCategories_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const tenantId = await resolveAdminTenant(ctx, data.tenantId);
	return categoriesRepo.list(ctx.supabase, {
		tenantId,
		includeInactive: true
	});
});
var adminCreateProduct_createServerFn_handler = createServerRpc({
	id: "06a52bbd6702707c101d6ef1f8e83375a7ace29e2800f956398e5898c2648413",
	name: "adminCreateProduct",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminCreateProduct.__executeServer(opts));
var adminCreateProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => productInputSchema.extend({ tenantId: stringType().uuid().optional() }).parse(raw)).handler(adminCreateProduct_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const { tenantId: overrideTenant, ...input } = data;
	const tenantId = await resolveAdminTenant(ctx, overrideTenant);
	return productsRepo.create(ctx.supabase, tenantId, input);
});
var adminUpdateProduct_createServerFn_handler = createServerRpc({
	id: "2a10bca94ea6435dd4fa7ff3043b753b63f742aff6221e705ddaace3932ae9e3",
	name: "adminUpdateProduct",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminUpdateProduct.__executeServer(opts));
var adminUpdateProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => productUpdateSchema.extend({ tenantId: stringType().uuid().optional() }).parse(raw)).handler(adminUpdateProduct_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const { id, tenantId: overrideTenant, ...patch } = data;
	const tenantId = await resolveAdminTenant(ctx, overrideTenant);
	return productsRepo.update(ctx.supabase, tenantId, id, patch);
});
var adminDeleteProduct_createServerFn_handler = createServerRpc({
	id: "95f0a74b6f757d825d5bfafce0299ffef93ec04843fd056267f8c8fe1789b49f",
	name: "adminDeleteProduct",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminDeleteProduct.__executeServer(opts));
var adminDeleteProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	id: stringType().uuid(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(adminDeleteProduct_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const tenantId = await resolveAdminTenant(ctx, data.tenantId);
	await productsRepo.remove(ctx.supabase, tenantId, data.id);
	return { ok: true };
});
var adminCreateCategory_createServerFn_handler = createServerRpc({
	id: "dc6192b8126e456f8eb9c3d3d26176b1f8af356ca9c04a0c09567dec2ea6fbc8",
	name: "adminCreateCategory",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminCreateCategory.__executeServer(opts));
var adminCreateCategory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => categoryInputSchema.extend({ tenantId: stringType().uuid().optional() }).parse(raw)).handler(adminCreateCategory_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const { tenantId: overrideTenant, ...input } = data;
	const tenantId = await resolveAdminTenant(ctx, overrideTenant);
	return categoriesRepo.create(ctx.supabase, tenantId, input);
});
var adminUpdateCategory_createServerFn_handler = createServerRpc({
	id: "f59a61bdaf33b7d255d039f5e47ada0b91cdee58fb730fcc01bfc35635fb31da",
	name: "adminUpdateCategory",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminUpdateCategory.__executeServer(opts));
var adminUpdateCategory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => categoryUpdateSchema.extend({ tenantId: stringType().uuid().optional() }).parse(raw)).handler(adminUpdateCategory_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const { id, tenantId: overrideTenant, ...patch } = data;
	const tenantId = await resolveAdminTenant(ctx, overrideTenant);
	return categoriesRepo.update(ctx.supabase, tenantId, id, patch);
});
var adminDeleteCategory_createServerFn_handler = createServerRpc({
	id: "65b6d27341b73be55679374075255c26fc9db0341f0b600ed23cfc8df65c8d4a",
	name: "adminDeleteCategory",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminDeleteCategory.__executeServer(opts));
var adminDeleteCategory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	id: stringType().uuid(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(adminDeleteCategory_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const tenantId = await resolveAdminTenant(ctx, data.tenantId);
	await categoriesRepo.remove(ctx.supabase, tenantId, data.id);
	return { ok: true };
});
var adminRecordInventory_createServerFn_handler = createServerRpc({
	id: "07642af69f1ad271fbf43583a8e31b47d2b3c129a00b6efbfa32423e84cfead7",
	name: "adminRecordInventory",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminRecordInventory.__executeServer(opts));
var adminRecordInventory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => inventoryMovementSchema.extend({ tenantId: stringType().uuid().optional() }).parse(raw)).handler(adminRecordInventory_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const { tenantId: overrideTenant, ...input } = data;
	const tenantId = await resolveAdminTenant(ctx, overrideTenant);
	return inventoryRepo.record(ctx.supabase, tenantId, {
		...input,
		created_by: ctx.userId
	});
});
var adminListInventory_createServerFn_handler = createServerRpc({
	id: "88d95eb4d60915dd78133e41ecca3c24aaa71adb8cbe2df4d1c57d60fe95f471",
	name: "adminListInventory",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => adminListInventory.__executeServer(opts));
var adminListInventory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	productId: stringType().uuid(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(adminListInventory_createServerFn_handler, async ({ data, context }) => {
	const ctx = context;
	await assertAdmin(ctx);
	const tenantId = await resolveAdminTenant(ctx, data.tenantId);
	return inventoryRepo.listByProduct(ctx.supabase, tenantId, data.productId);
});
var callBack4AppVertexGateway = async (params) => {
	const primaryUrl = "https://parseapi.back4app.com/functions/aiVertexGateway";
	const fallbackUrl = "https://parseapi.back4app.com/functions/aiGateway";
	const body = {
		prompt: params.prompt,
		model: "gemini-2.5-flash",
		max_tokens: params.maxTokens || 4096,
		temperature: .7,
		system_persona: params.systemPersona,
		image: params.imageBase64,
		mimeType: params.mimeType
	};
	const headers = {
		"X-Parse-Application-Id": "uWUMmdbdRjcuOKuCcl9Pg7zEYxnYGVaLXjmveGF2",
		"X-Parse-REST-API-Key": "Zsvk14ko9rvXD25G1hflNeY2Dg2hJtkocPvh6tMp",
		"X-Parse-Master-Key": "8qRzu0pBFkDo0urIjpXeFGb23xR5C23JoOlD05ze",
		"Content-Type": "application/json"
	};
	try {
		const response = await fetch(primaryUrl, {
			method: "POST",
			headers,
			body: JSON.stringify(body)
		});
		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Vertex HTTP ${response.status}: ${errText}`);
		}
		const json = await response.json();
		if (json.result && json.result.success === true) return json.result.data || "";
		else throw new Error(json.result?.error || "Unknown Vertex error");
	} catch (vertexErr) {
		console.warn("⚠️ [Web-AI-Gateway] Vertex failed, falling back to Gemini Key Pool:", vertexErr.message || vertexErr);
		const response = await fetch(fallbackUrl, {
			method: "POST",
			headers,
			body: JSON.stringify(body)
		});
		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Fallback Gateway Error (${response.status}): ${errText}`);
		}
		const json = await response.json();
		if (json.result && json.result.success === true) return json.result.data || "";
		else throw new Error(json.result?.error || "Unknown Fallback Gateway error");
	}
};
var catalogPrompt = `
أنت خبير تحليل منتجات للكتالوج التجاري.
انظر إلى هذه الصورة وأعطني المعلومات التالية بدقة شديدة.

قواعد إلزامية:
- جميع النصوص في الرد بالعربية فقط (ما عدا فئات Google وFacebook تبقى إنجليزية).
- لا تخترع معلومات غير موجودة في الصورة.
- إذا لم تجد معلومة اكتب: فارغ

أعد الرد بهذا الشكل الحرفي فقط:
===TITLE===
[اسم المنتج بالعربية - مختصر واحترافي]
===DESCRIPTION===
[اكتب وصفاً تسويقياً إعلانياً جذاباً واحترافياً للمنتج بالعربية بأسلوب منشور فيسبوك/تيك توك يجمع بين الخطاف القوي والفوائد والميزات الرائعة بشكل منسق مع الإيموجي المناسب وفواصل السطور، بدون أرقام هواتف أو معلومات تواصل أو روابط]
===BRAND===
[العلامة التجارية أو: فارغ]
===COLOR===
[اللون الرئيسي أو: فارغ]
===SIZE===
[المقاس أو الحجم أو: فارغ]
===PRICE===
[السعر بالريال اليمني كعدد رقمي فقط في حال كان مكتوباً أو معروفاً، أو: فارغ]
===SAR===
[السعر بالريال السعودي كعدد رقمي فقط في حال كان مكتوباً أو معروفاً، أو: فارغ]
===G_CAT===
[فئة Google المناسبة بالإنجليزية مثل: Apparel & Accessories > Clothing أو: فارغ]
===FB_CAT===
[فئة Facebook المناسبة بالإنجليزية مثل: Clothing & Accessories > Clothing أو: فارغ]
===CONDITION===
[new أو used]
`;
var requireAuthWithClient = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { data } = await supabase.auth.getSession();
	const token = data.session?.access_token;
	return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});
var aiAnalyzeImage_createServerFn_handler = createServerRpc({
	id: "c03e5d0d21b8a3173bada9c7e86db257ab70e56e5b7effd67a635bcbd926fa23",
	name: "aiAnalyzeImage",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => aiAnalyzeImage.__executeServer(opts));
var aiAnalyzeImage = createServerFn({ method: "POST" }).middleware([requireAuthWithClient, requireSupabaseAuth]).inputValidator((raw) => objectType({ image: stringType() }).parse(raw)).handler(aiAnalyzeImage_createServerFn_handler, async ({ data }) => {
	let cleanBase64 = data.image;
	let mimeType = "image/jpeg";
	if (data.image.startsWith("data:image/")) {
		const matches = data.image.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
		if (matches) {
			mimeType = matches[1];
			cleanBase64 = matches[2];
		}
	}
	return { text: await callBack4AppVertexGateway({
		prompt: catalogPrompt,
		imageBase64: cleanBase64,
		mimeType,
		maxTokens: 1200
	}) };
});
var aiOptimizeDescription_createServerFn_handler = createServerRpc({
	id: "2480894c5714800610eea4f253492366a7918227548464bb0a46724e4724c948",
	name: "aiOptimizeDescription",
	filename: "src/lib/catalog.functions.ts"
}, (opts) => aiOptimizeDescription.__executeServer(opts));
var aiOptimizeDescription = createServerFn({ method: "POST" }).middleware([requireAuthWithClient, requireSupabaseAuth]).inputValidator((raw) => objectType({ text: stringType() }).parse(raw)).handler(aiOptimizeDescription_createServerFn_handler, async ({ data }) => {
	return { text: await callBack4AppVertexGateway({
		prompt: `
تصرّف كخبير تسويق وتنظيم أوصاف منتجات.

سأرسل لك وصف منتج جاهز يحتوي على كلام غير مرتب + مميزات + سعر أو أكثر.
مهمتك تنفيذ الخطوات التالية بدقة شديدة دون إضافة أو اختراع أي معلومة جديدة.

⚠️ شروط إلزامية عامة:
- جميع الكلمات في الناتج النهائي تكون بدون أي علامات تشكيل (بدون حركات نهائيًا)
- استخرج السعر وطبق معادلة السعر المحددة بالأسفل.
- حدد فئة المنتج المناسبة لـ Google Product Category و Facebook Product Category.
- استخرج السمات الأخرى (الشركة المصنعة/العلامة التجارية، اللون، المقاس) إن وجدت.
- احذف تلقائياً أي أرقام هواتف أو معلومات تواصل أو أسماء متاجر من الوصف النهائي.
- احذف أي عبارات مثل "للتواصل"، "للطلب"، "واتساب"، "أرقام تليفون" من الوصف نهائياً.

المهمة الأولى: العنوان والهوك
1. أنشئ عنوانًا احترافيًا مختصرًا (Hook):
   - جذاب ومناسب للبيع
   - مستخرج من نفس الوصف فقط
2. تحت العنوان مباشرة:
   - ضع أهم وأقوى ميزة واحدة فقط تشد الانتباه.

المهمة الثانية: اعادة الصياغة والتنظيم للوصف
1. اعد صياغة الوصف ليكون مرتب، واضح، ومخترص.
2. يمنع منعًا باتًا اضافة اي معلومة جديدة او اختراع مميزات غير موجودة.
3. احذف اي كلام مكرر، غير مهم، او انشائي بلا فائدة.
4. استخرج مميزات المنتج فقط كقائمة نقاط واضحة.

المهمة الثالثة: معالجة السعر
1. اذا وجد سعر خاص بـ "الجنوب" → احذفه نهائيًا وتجاهله.
2. اذا وجد اكثر من سعر: اختر اقل سعر فقط.
3. طبق الزيادة على السعر المستخرج بالريال اليمني (YER) حسب الشرائح التالية:
   - من 500 الى 2500 ريال يمني ➜ اضف 1900
   - اكثر من 3000 الى 10000 ريال يمني ➜ اضف 2900
   - 10000 ريال يمني او اكثر ➜ اضف 3900
4. بعد الحساب والزيادة: حول السعر الناتج إلى رقم نفسي ينتهي بـ 900 (مثال: 6000 يصبح 5900، 7200 يصبح 6900، 10000 يصبح 9900، 12000 يصبح 11900 وهكذا).

المهمة الرابعة: التحويل للعملات
1. احسب السعر بالريال السعودي (SAR) بناءً على السعر النهائي بالريال اليمني بعد الزيادة والتقريب النفسي:
   - التحويل يكون على الأساس: 1 ريال سعودي = 140 ريال يمني (أي اقسم السعر اليمني على 140).
   - احذف الكسور تمامًا واكتب الرقم الصحيح فقط للسعودي.

أرجِع النتيجة بالصيغة النصية التالية بدقة بالغة وبنفس الترتيب دائماً. يجب كتابة كل قسم، وإذا لم تجد قيمته اكتب: فارغ

===TITLE===
[العنوان المستخرج بدون حركات، أو: فارغ]
===HOOK===
[الهوك/الميزة القوية بدون حركات، أو: فارغ]
===BODY===
[اكتب وصفاً تسويقياً إعلانياً جذاباً واحترافياً ومفصلاً للمنتج بالعربية بأسلوب منشور فيسبوك/تيك توك يجمع بين الفوائد والميزات الرائعة بشكل منسق مع الإيموجي المناسب وفواصل السطور، بدون حركات وبدون أرقام هواتف، أو: فارغ]
===FEATURES===
[ميزة 1 بدون حركات، ميزة 2 بدون حركات، أو: فارغ]
===PRICE===
[السعر اليمني النهائي كعدد رقمي فقط، أو: فارغ]
===SAR===
[السعر السعودي النهائي كعدد رقمي فقط، أو: فارغ]
===G_CAT===
[فئة جوجل المناسبة للمنتج بالإنجليزية، مثل: Apparel & Accessories > Clothing، أو: فارغ]
===FB_CAT===
[فئة فيسبوك المناسبة للمنتج بالإنجليزية، مثل: Apparel & Accessories > Clothing، أو: فارغ]
===BRAND===
[الماركة، أو: فارغ]
===COLOR===
[اللون، أو: فارغ]
===SIZE===
[المقاس، أو: فارغ]

النص المراد تحليله:
"""
${data.text}
"""
`,
		maxTokens: 4096
	}) };
});
//#endregion
export { adminCreateCategory_createServerFn_handler, adminCreateProduct_createServerFn_handler, adminDeleteCategory_createServerFn_handler, adminDeleteProduct_createServerFn_handler, adminGetProduct_createServerFn_handler, adminListCategories_createServerFn_handler, adminListInventory_createServerFn_handler, adminListProducts_createServerFn_handler, adminRecordInventory_createServerFn_handler, adminUpdateCategory_createServerFn_handler, adminUpdateProduct_createServerFn_handler, aiAnalyzeImage_createServerFn_handler, aiOptimizeDescription_createServerFn_handler, getCategoryBySlug_createServerFn_handler, getProductBySlug_createServerFn_handler, getProductsByIds_createServerFn_handler, listCategories_createServerFn_handler, listProducts_createServerFn_handler };
