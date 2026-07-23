/**
 * Admin Actions — thin async wrappers over admin server functions.
 * UI event handlers should use `useServerFn(...)` for the bearer + redirect
 * plumbing, but these plain-function wrappers let non-hook code (loaders,
 * mutation callbacks) call the same endpoints with validated inputs.
 *
 *   UI ──► actions ──► server fns ──► repositories ──► Supabase
 */
import { z } from "zod";
import {
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminRecordInventory,
  adminListInventory,
  adminAutoCategorizeProducts,
  adminBulkAssignCategory,
} from "@/lib/catalog.functions";
import { adminImportCatalogFromUrl } from "@/lib/catalog-import.functions";
import {
  productInputSchema,
  productUpdateSchema,
  categoryInputSchema,
  categoryUpdateSchema,
  inventoryMovementSchema,
} from "@/lib/validators/catalog";

// ------------ Products ------------

export const listAdminProductsInput = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  publishedOnly: z.boolean().optional(),
  unpublishedOnly: z.boolean().optional(),
  outOfStock: z.boolean().optional(),
});
export type ListAdminProductsInput = z.infer<typeof listAdminProductsInput>;

export const listAdminProducts = (input: ListAdminProductsInput = {}) =>
  adminListProducts({ data: listAdminProductsInput.parse(input) });

export const getAdminProduct = (id: string) =>
  adminGetProduct({ data: { id: z.string().uuid().parse(id) } });

export const createAdminProduct = (input: unknown) =>
  adminCreateProduct({ data: productInputSchema.parse(input) });

export const updateAdminProduct = (input: unknown) =>
  adminUpdateProduct({ data: productUpdateSchema.parse(input) });

export const deleteAdminProduct = (id: string) =>
  adminDeleteProduct({ data: { id: z.string().uuid().parse(id) } });

// ------------ Categories ------------

export const listAdminCategories = () => adminListCategories({});

export const createAdminCategory = (input: unknown) =>
  adminCreateCategory({ data: categoryInputSchema.parse(input) });

export const updateAdminCategory = (input: unknown) =>
  adminUpdateCategory({ data: categoryUpdateSchema.parse(input) });

export const deleteAdminCategory = (id: string) =>
  adminDeleteCategory({ data: { id: z.string().uuid().parse(id) } });

// ------------ Inventory ------------

export const recordInventoryMovement = (input: unknown) =>
  adminRecordInventory({ data: inventoryMovementSchema.parse(input) });

export const listInventoryMovements = (productId: string) =>
  adminListInventory({ data: { productId: z.string().uuid().parse(productId) } });

// ------------ Catalog Import ------------

export const importCatalogFromUrl = (input: { url: string; publish?: boolean }) =>
  adminImportCatalogFromUrl({
    data: z
      .object({ url: z.string().url(), publish: z.boolean().default(true) })
      .parse(input),
  });

export const autoCategorizeProducts = () => adminAutoCategorizeProducts({});

export const bulkAssignCategory = (productIds: string[], categoryId: string) =>
  adminBulkAssignCategory({
    data: {
      productIds: z.array(z.string()).parse(productIds),
      categoryId: z.string().uuid().parse(categoryId),
    },
  });
