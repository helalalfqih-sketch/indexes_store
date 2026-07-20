import { t as createMiddleware } from "./createStart-Dt05N14y.mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D-sVoEic.mjs";
import { t as supabase } from "./client-BDpLHRM3.mjs";
import { t as createSsrRpc } from "./createSsrRpc-DIPEs3na.mjs";
import { ft as numberType, lt as arrayType, mt as stringType, pt as objectType, ut as booleanType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { a as productUpdateSchema, i as productInputSchema, n as categoryUpdateSchema, r as inventoryMovementSchema, t as categoryInputSchema } from "./catalog-yfetUeY8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/catalog.functions-DH8kSUAh.js
/**
* Catalog Server Functions — thin RPC wrappers over repositories.
* - Public reads use the server publishable client (respects RLS as anon)
*   and are scoped to the resolved tenant (subdomain / header / default).
* - Admin writes use requireSupabaseAuth + admin role check and require
*   an explicit tenant context (or fall back to the user's tenant).
*/
var listProducts = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({
	tenantId: stringType().uuid().optional(),
	categoryId: stringType().optional(),
	search: stringType().optional(),
	limit: numberType().int().min(1).max(100).optional(),
	offset: numberType().int().min(0).optional()
}).parse(raw ?? {})).handler(createSsrRpc("ec305e715d428bd5a056174d65530dc3f73a4aae7224baa7e85f3de5db811249"));
var getProductBySlug = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({
	slug: stringType(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(createSsrRpc("338e414efdb61533c60e3c1671e7aea82e763a0409c4afad4a1f474e3d8c65ce"));
/**
* getProductsByIds — Meta Commerce Checkout server function.
*
* Fetches a specific set of products by their IDs directly from the Supabase
* `products` table. Never loads the full catalog.
*
* Lookup strategy (all run in parallel, results merged and deduplicated):
*   1. UUID primary key `id`
*   2. `external_id` column — for Meta Catalog IDs (e.g. "prd_xxx")
*   3. `slug` column        — slug-based fallback
*
* Invalid / unknown IDs are silently ignored.
* Preserves the requested ID order in the returned array.
* Multi-tenant safe: resolves tenant from subdomain / header / default.
*/
var getProductsByIds = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({
	ids: arrayType(stringType().min(1)).min(1).max(50),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(createSsrRpc("4fa5c2a98931b84edff5daf4ea734d250404d1a8e87ce63abf9cef47224b27f9"));
var listCategories = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({ tenantId: stringType().uuid().optional() }).parse(raw ?? {})).handler(createSsrRpc("9093087a4fde30e7cbeefd735d6dccc2718ef5ec811563a10f9b01884489c6f6"));
var getCategoryBySlug = createServerFn({ method: "GET" }).inputValidator((raw) => objectType({
	slug: stringType(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(createSsrRpc("5488941a246672c11e7e731b5355bc6486887024c8f5ad9aee9839ae4866f700"));
var tenantScope = objectType({ tenantId: stringType().uuid().optional() });
var adminListProducts = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	tenantId: stringType().uuid().optional(),
	search: stringType().trim().max(120).optional(),
	categoryId: stringType().uuid().optional(),
	publishedOnly: booleanType().optional(),
	unpublishedOnly: booleanType().optional(),
	outOfStock: booleanType().optional()
}).parse(raw ?? {})).handler(createSsrRpc("e6e21352e939db3a5ba878cfadec63257aac0498924c61464adabf0555eb43e3"));
var adminGetProduct = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	id: stringType().uuid(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(createSsrRpc("703440c04edbe7d7589447d4a582fd36961c873d4804e9030b35779a0f9f5345"));
var adminListCategories = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((raw) => tenantScope.parse(raw ?? {})).handler(createSsrRpc("5de4dc944a006c369d93b04878277c48bf137e5f414c453c8f056278d7013242"));
var adminCreateProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => productInputSchema.extend({ tenantId: stringType().uuid().optional() }).parse(raw)).handler(createSsrRpc("06a52bbd6702707c101d6ef1f8e83375a7ace29e2800f956398e5898c2648413"));
var adminUpdateProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => productUpdateSchema.extend({ tenantId: stringType().uuid().optional() }).parse(raw)).handler(createSsrRpc("2a10bca94ea6435dd4fa7ff3043b753b63f742aff6221e705ddaace3932ae9e3"));
var adminDeleteProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	id: stringType().uuid(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(createSsrRpc("95f0a74b6f757d825d5bfafce0299ffef93ec04843fd056267f8c8fe1789b49f"));
var adminCreateCategory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => categoryInputSchema.extend({ tenantId: stringType().uuid().optional() }).parse(raw)).handler(createSsrRpc("dc6192b8126e456f8eb9c3d3d26176b1f8af356ca9c04a0c09567dec2ea6fbc8"));
var adminUpdateCategory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => categoryUpdateSchema.extend({ tenantId: stringType().uuid().optional() }).parse(raw)).handler(createSsrRpc("f59a61bdaf33b7d255d039f5e47ada0b91cdee58fb730fcc01bfc35635fb31da"));
var adminDeleteCategory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	id: stringType().uuid(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(createSsrRpc("65b6d27341b73be55679374075255c26fc9db0341f0b600ed23cfc8df65c8d4a"));
var adminRecordInventory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => inventoryMovementSchema.extend({ tenantId: stringType().uuid().optional() }).parse(raw)).handler(createSsrRpc("07642af69f1ad271fbf43583a8e31b47d2b3c129a00b6efbfa32423e84cfead7"));
var adminListInventory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	productId: stringType().uuid(),
	tenantId: stringType().uuid().optional()
}).parse(raw)).handler(createSsrRpc("88d95eb4d60915dd78133e41ecca3c24aaa71adb8cbe2df4d1c57d60fe95f471"));
var requireAuthWithClient = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { data } = await supabase.auth.getSession();
	const token = data.session?.access_token;
	return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});
var aiAnalyzeImage = createServerFn({ method: "POST" }).middleware([requireAuthWithClient, requireSupabaseAuth]).inputValidator((raw) => objectType({ image: stringType() }).parse(raw)).handler(createSsrRpc("c03e5d0d21b8a3173bada9c7e86db257ab70e56e5b7effd67a635bcbd926fa23"));
var aiOptimizeDescription = createServerFn({ method: "POST" }).middleware([requireAuthWithClient, requireSupabaseAuth]).inputValidator((raw) => objectType({ text: stringType() }).parse(raw)).handler(createSsrRpc("2480894c5714800610eea4f253492366a7918227548464bb0a46724e4724c948"));
//#endregion
export { listCategories as _, adminGetProduct as a, adminListProducts as c, adminUpdateProduct as d, aiAnalyzeImage as f, getProductsByIds as g, getProductBySlug as h, adminDeleteProduct as i, adminRecordInventory as l, getCategoryBySlug as m, adminCreateProduct as n, adminListCategories as o, aiOptimizeDescription as p, adminDeleteCategory as r, adminListInventory as s, adminCreateCategory as t, adminUpdateCategory as u, listProducts as v };
