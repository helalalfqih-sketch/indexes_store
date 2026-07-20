import { r as categories } from "./store-data-CaXOvYMv.mjs";
import { mt as stringType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { _ as listCategories, m as getCategoryBySlug } from "./catalog.functions-DH8kSUAh.mjs";
import { l as toLegacyCategory, t as fallbackCategories } from "./product.actions-BIwQALk-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/category.actions-BUQYceFE.js
/**
* Category Actions — UI-facing entry point for category data.
* See product.actions.ts for the layering contract.
*/
var seedByKey = /* @__PURE__ */ new Map();
for (const c of categories) seedByKey.set(c.id, c);
var enrich = (c) => {
	const seed = seedByKey.get(c.id);
	if (!seed) return c;
	return {
		...c,
		icon: c.icon || seed.icon,
		color: c.color || seed.color
	};
};
var mapMany = (rows) => rows.map((r) => enrich(toLegacyCategory(r)));
async function fetchCategories() {
	try {
		const rows = await listCategories({});
		if (rows.length === 0) return fallbackCategories().map(toLegacyCategory).map(enrich);
		return mapMany(rows);
	} catch (err) {
		return fallbackCategories().map(toLegacyCategory).map(enrich);
	}
}
async function fetchCategoryBySlug(slug) {
	const parsed = stringType().trim().min(1).parse(slug);
	try {
		const dto = await getCategoryBySlug({ data: { slug: parsed } });
		if (dto) return enrich(toLegacyCategory(dto));
	} catch (err) {}
	const seed = fallbackCategories().find((c) => c.slug === parsed);
	return seed ? enrich(toLegacyCategory(seed)) : null;
}
//#endregion
export { fetchCategoryBySlug as n, fetchCategories as t };
