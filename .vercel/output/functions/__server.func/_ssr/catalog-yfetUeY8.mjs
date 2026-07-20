import { dt as enumType, ft as numberType, lt as arrayType, mt as stringType, pt as objectType, ut as booleanType } from "../_libs/@ai-sdk/gateway+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/catalog-yfetUeY8.js
var productInputSchema = objectType({
	slug: stringType().min(1).regex(/^[\p{L}\p{N}-]+$/iu, "الرابط يجب أن يحوي أحرف وأرقام و - فقط"),
	name: stringType().min(1),
	description: stringType().default(""),
	price: numberType().min(0),
	old_price: numberType().min(0).nullable().optional(),
	currency: stringType().default("YER"),
	category_id: stringType().uuid().nullable().optional(),
	brand: stringType().nullable().optional(),
	images: arrayType(stringType()).default([]),
	model_url: stringType().nullable().optional(),
	stock: numberType().int().min(0).default(0),
	tags: arrayType(stringType()).default([]),
	badge: stringType().nullable().optional(),
	is_published: booleanType().default(true),
	video_playback_id: stringType().nullable().optional(),
	availability: stringType().nullable().optional(),
	condition: stringType().nullable().optional(),
	source_url: stringType().nullable().optional(),
	sku: stringType().nullable().optional(),
	barcode: stringType().nullable().optional(),
	compare_at_price: numberType().min(0).nullable().optional(),
	cost_price: numberType().min(0).nullable().optional(),
	model_3d_url: stringType().nullable().optional(),
	model_3d_thumbnail: stringType().nullable().optional(),
	model_3d_status: stringType().nullable().optional(),
	meta_sync_status: enumType([
		"not_synced",
		"syncing",
		"synced",
		"failed"
	]).default("not_synced").nullable().optional()
});
var productUpdateSchema = productInputSchema.partial().extend({ id: stringType().uuid() });
var categoryInputSchema = objectType({
	slug: stringType().min(1).regex(/^[\p{L}\p{N}-]+$/iu, "الرابط يجب أن يحوي أحرف وأرقام و - فقط"),
	name: stringType().min(1),
	description: stringType().nullable().optional(),
	image_url: stringType().url().nullable().optional(),
	icon: stringType().nullable().optional(),
	color: stringType().nullable().optional(),
	parent_id: stringType().uuid().nullable().optional(),
	sort: numberType().int().default(0),
	is_active: booleanType().default(true)
});
var categoryUpdateSchema = categoryInputSchema.partial().extend({ id: stringType().uuid() });
var inventoryMovementSchema = objectType({
	product_id: stringType().uuid(),
	delta: numberType().int(),
	reason: enumType([
		"restock",
		"sale",
		"adjustment",
		"return",
		"damage"
	]),
	reference: stringType().nullable().optional(),
	note: stringType().nullable().optional()
});
//#endregion
export { productUpdateSchema as a, productInputSchema as i, categoryUpdateSchema as n, inventoryMovementSchema as r, categoryInputSchema as t };
