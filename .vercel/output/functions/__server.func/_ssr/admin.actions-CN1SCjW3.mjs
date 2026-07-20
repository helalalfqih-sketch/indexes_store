import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D-sVoEic.mjs";
import { t as createSsrRpc } from "./createSsrRpc-DIPEs3na.mjs";
import { mt as stringType, pt as objectType, ut as booleanType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { a as productUpdateSchema, i as productInputSchema, n as categoryUpdateSchema, r as inventoryMovementSchema, t as categoryInputSchema } from "./catalog-yfetUeY8.mjs";
import { a as adminGetProduct, c as adminListProducts, d as adminUpdateProduct, i as adminDeleteProduct, l as adminRecordInventory, n as adminCreateProduct, o as adminListCategories, r as adminDeleteCategory, s as adminListInventory, t as adminCreateCategory, u as adminUpdateCategory } from "./catalog.functions-DH8kSUAh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.actions-CN1SCjW3.js
/**
* Admin-only server function: import products from a remote CSV catalog.
* Upserts on (tenant_id, external_id). Uses context.supabase (RLS as admin/tenant member).
*/
var adminImportCatalogFromUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => objectType({
	url: stringType().url(),
	tenantId: stringType().uuid().optional(),
	publish: booleanType().default(true)
}).parse(raw)).handler(createSsrRpc("8ae08d24bb70d4ee9ba8202e7020595dd46284e97fa09673fcd53730fcdc7d39"));
/**
* Admin Actions — thin async wrappers over admin server functions.
* UI event handlers should use `useServerFn(...)` for the bearer + redirect
* plumbing, but these plain-function wrappers let non-hook code (loaders,
* mutation callbacks) call the same endpoints with validated inputs.
*
*   UI ──► actions ──► server fns ──► repositories ──► Supabase
*/
var listAdminProductsInput = objectType({
	search: stringType().trim().max(120).optional(),
	categoryId: stringType().uuid().optional(),
	publishedOnly: booleanType().optional(),
	unpublishedOnly: booleanType().optional(),
	outOfStock: booleanType().optional()
});
var listAdminProducts = (input = {}) => adminListProducts({ data: listAdminProductsInput.parse(input) });
var getAdminProduct = (id) => adminGetProduct({ data: { id: stringType().uuid().parse(id) } });
var createAdminProduct = (input) => adminCreateProduct({ data: productInputSchema.parse(input) });
var updateAdminProduct = (input) => adminUpdateProduct({ data: productUpdateSchema.parse(input) });
var deleteAdminProduct = (id) => adminDeleteProduct({ data: { id: stringType().uuid().parse(id) } });
var listAdminCategories = () => adminListCategories({});
var createAdminCategory = (input) => adminCreateCategory({ data: categoryInputSchema.parse(input) });
var updateAdminCategory = (input) => adminUpdateCategory({ data: categoryUpdateSchema.parse(input) });
var deleteAdminCategory = (id) => adminDeleteCategory({ data: { id: stringType().uuid().parse(id) } });
var recordInventoryMovement = (input) => adminRecordInventory({ data: inventoryMovementSchema.parse(input) });
var listInventoryMovements = (productId) => adminListInventory({ data: { productId: stringType().uuid().parse(productId) } });
var importCatalogFromUrl = (input) => adminImportCatalogFromUrl({ data: objectType({
	url: stringType().url(),
	publish: booleanType().default(true)
}).parse(input) });
//#endregion
export { getAdminProduct as a, listAdminProducts as c, updateAdminCategory as d, updateAdminProduct as f, deleteAdminProduct as i, listInventoryMovements as l, createAdminProduct as n, importCatalogFromUrl as o, deleteAdminCategory as r, listAdminCategories as s, createAdminCategory as t, recordInventoryMovement as u };
