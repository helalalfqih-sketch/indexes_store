import { a as products, r as categories } from "./store-data-CaXOvYMv.mjs";
import { ft as numberType, mt as stringType, pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { g as getProductsByIds, h as getProductBySlug, v as listProducts } from "./catalog.functions-DH8kSUAh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/product.actions-BIwQALk-.js
var seedToProductDTO = (p) => ({
	id: p.id,
	slug: p.slug,
	name: p.name,
	description: p.description,
	price: p.price,
	currency: "YER",
	category_id: p.categoryId,
	brand: null,
	images: [p.image],
	model_url: null,
	stock: p.stock,
	reserved_stock: 0,
	rating: p.rating,
	reviews_count: p.reviews,
	tags: p.badge ? [p.badge] : [],
	is_published: true,
	created_at: (/* @__PURE__ */ new Date(0)).toISOString(),
	updated_at: (/* @__PURE__ */ new Date(0)).toISOString(),
	video_playback_id: p.videoPlaybackId ?? null
});
var seedToCategoryDTO = (c) => ({
	id: c.id,
	slug: c.id,
	name: c.name,
	description: null,
	image_url: null,
	parent_id: null,
	sort: 0,
	icon: c.icon,
	color: c.color,
	is_active: true
});
var fallbackProducts = () => products.map(seedToProductDTO);
var fallbackCategories = () => categories.map(seedToCategoryDTO);
var toLegacyProduct = (p) => ({
	id: p.id,
	slug: p.slug,
	name: p.name,
	description: p.description,
	price: p.price,
	stock: p.stock,
	image: p.images[0] ?? "",
	rating: p.rating,
	reviews: p.reviews_count,
	categoryId: p.category_id ?? "",
	badge: p.tags[0],
	videoPlaybackId: p.video_playback_id ?? void 0
});
var toLegacyCategory = (c) => ({
	id: c.slug,
	name: c.name,
	icon: c.icon ?? "Package",
	color: c.color ?? "from-slate-500 to-slate-700"
});
/**
* Product Actions — UI-facing entry point for product data.
*
*  UI ──► actions ──► server functions ──► repositories ──► Supabase
*
* Rules:
*  - UI never imports server fns / repos / supabase directly for catalog reads.
*  - Returns legacy UI shapes (LegacyProductShape) so existing components
*    keep working without changes. DTO-native components can call the raw
*    server fns.
*  - Falls back to seed data (store-data.ts) on error or empty DB — the
*    data-adapter safety net stays until Phase C removes it.
*/
var listProductsInput = objectType({
	categoryId: stringType().uuid().optional(),
	search: stringType().trim().max(120).optional(),
	limit: numberType().int().min(1).max(100).optional(),
	offset: numberType().int().min(0).optional(),
	tenantId: stringType().uuid().optional()
}).partial();
var seedIndex = new Map(products.map((p) => [p.slug, p]));
var enrichLegacy = (p) => {
	const seed = seedIndex.get(p.slug);
	if (!seed) return p;
	return {
		...p,
		oldPrice: seed.oldPrice ?? p.oldPrice,
		badge: p.badge ?? seed.badge,
		image: p.image || seed.image
	};
};
var dtoToLegacy = (rows) => rows.map((r) => enrichLegacy(toLegacyProduct(r)));
async function fetchProducts(input = {}) {
	const data = listProductsInput.parse(input);
	try {
		const rows = await listProducts({ data });
		if (rows.length === 0) return fallbackProducts().map(toLegacyProduct).map(enrichLegacy);
		return dtoToLegacy(rows);
	} catch (err) {
		return fallbackProducts().map(toLegacyProduct).map(enrichLegacy);
	}
}
async function fetchProductBySlug(slug) {
	const parsed = stringType().trim().min(1).parse(slug);
	try {
		const dto = await getProductBySlug({ data: { slug: parsed } });
		if (dto) return enrichLegacy(toLegacyProduct(dto));
	} catch (err) {}
	const seed = fallbackProducts().find((p) => p.slug === parsed);
	return seed ? enrichLegacy(toLegacyProduct(seed)) : null;
}
/**
* Fetches a targeted set of products from Supabase by their IDs.
*
* Used exclusively by the Meta Commerce checkout bridge to resolve
* products from URL parameters without loading the full catalog.
*
* Lookup order: UUID id → external_id (Meta Catalog) → slug.
* Returns only products that exist — invalid IDs are silently ignored.
* Never throws; returns [] on error.
*/
async function fetchProductsByIds(ids) {
	if (ids.length === 0) return [];
	const cleaned = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(0, 50);
	if (cleaned.length === 0) return [];
	try {
		return dtoToLegacy(await getProductsByIds({ data: { ids: cleaned } }));
	} catch (err) {
		return [];
	}
}
/**
* Category filtering. Accepts UUID (DB category_id) OR legacy category slug/id
* (from `store-data.ts`) — legacy code passes slug through the `id` param.
*/
async function fetchProductsByCategory(categoryIdOrSlug) {
	const key = categoryIdOrSlug.trim();
	if (/^[0-9a-f-]{36}$/i.test(key)) return fetchProducts({ categoryId: key });
	return (await fetchProducts()).filter((p) => p.categoryId === key);
}
async function searchProducts(q) {
	const query = q.trim();
	if (!query) return fetchProducts();
	return fetchProducts({ search: query });
}
async function fetchOffers() {
	return (await fetchProducts()).filter((p) => typeof p.oldPrice === "number" && p.oldPrice > p.price);
}
async function fetchBestSellers(limit = 4) {
	return [...await fetchProducts({ limit })].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews).slice(0, limit);
}
//#endregion
export { fetchProducts as a, searchProducts as c, fetchProductBySlug as i, toLegacyCategory as l, fetchBestSellers as n, fetchProductsByCategory as o, fetchOffers as r, fetchProductsByIds as s, fallbackCategories as t };
