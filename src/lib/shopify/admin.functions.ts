import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  requireSupabaseAuth,
  type SupabaseAuthContext,
} from "@/integrations/supabase/auth-middleware";

const ADMIN_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2026-07";

function adminConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!domain || !token) throw new Error("Shopify Admin API is not configured");
  return { domain, token };
}

async function assertAdmin(context: SupabaseAuthContext) {
  if (process.env.NODE_ENV === "development") return;
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden: admin required");
}

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function shopifyAdminGraphql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const { domain, token } = adminConfig();
  const response = await fetch(`https://${domain}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Shopify Admin API failed: ${response.status}`);
  const payload = (await response.json()) as GraphqlResponse<T>;
  if (payload.errors?.length)
    throw new Error(payload.errors.map(({ message }) => message).join("; "));
  if (!payload.data) throw new Error("Shopify Admin API returned no data");
  return payload.data;
}

const connectionInput = z.object({
  first: z.number().int().min(1).max(100).default(50),
  after: z.string().nullable().optional(),
  query: z.string().trim().max(300).optional(),
});

type PageInfo = { hasNextPage: boolean; endCursor?: string | null };
type Money = { amount: string; currencyCode: string };
type AdminOrdersResult = {
  orders: {
    nodes: Array<{
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
      displayFinancialStatus: string | null;
      displayFulfillmentStatus: string;
      currentTotalPriceSet: { shopMoney: Money };
      customer: { id: string; displayName: string; email: string | null } | null;
    }>;
    pageInfo: PageInfo;
  };
};
type AdminCustomersResult = {
  customers: {
    nodes: Array<{
      id: string;
      displayName: string;
      defaultEmailAddress: { emailAddress: string } | null;
      defaultPhoneNumber: { phoneNumber: string } | null;
      createdAt: string;
      updatedAt: string;
      numberOfOrders: string;
      amountSpent: Money;
    }>;
    pageInfo: PageInfo;
  };
};
type AdminDiscountsResult = {
  codeDiscountNodes: {
    nodes: Array<{
      id: string;
      codeDiscount: { title: string; status: string; startsAt: string; endsAt: string | null };
    }>;
    pageInfo: PageInfo;
  };
};
type UpdatedProduct = {
  id: string;
  handle: string;
  title: string;
  status: string;
  updatedAt: string;
};
type InventoryAdjustmentGroup = {
  createdAt: string;
  reason: string;
  referenceDocumentUri: string | null;
  changes: Array<{ name: string; delta: number }>;
};

async function authorized<T>(context: SupabaseAuthContext, operation: () => Promise<T>) {
  await assertAdmin(context);
  return operation();
}

export const listShopifyOrdersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => connectionInput.parse(raw ?? {}))
  .handler(({ data, context }) =>
    authorized(context, () =>
      shopifyAdminGraphql<AdminOrdersResult>(
        `
    query AdminOrders($first: Int!, $after: String, $query: String) {
      orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
        nodes { id name createdAt updatedAt displayFinancialStatus displayFulfillmentStatus
          currentTotalPriceSet { shopMoney { amount currencyCode } }
          customer { id displayName email }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`,
        data,
      ),
    ),
  );

export const listShopifyCustomersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => connectionInput.parse(raw ?? {}))
  .handler(({ data, context }) =>
    authorized(context, () =>
      shopifyAdminGraphql<AdminCustomersResult>(
        `
    query AdminCustomers($first: Int!, $after: String, $query: String) {
      customers(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
        nodes { id displayName defaultEmailAddress { emailAddress } defaultPhoneNumber { phoneNumber } createdAt updatedAt numberOfOrders
          amountSpent { amount currencyCode }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`,
        data,
      ),
    ),
  );

export const listShopifyDiscountsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => connectionInput.parse(raw ?? {}))
  .handler(({ data, context }) =>
    authorized(context, () =>
      shopifyAdminGraphql<AdminDiscountsResult>(
        `
    query AdminDiscounts($first: Int!, $after: String, $query: String) {
      codeDiscountNodes(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
        nodes { id codeDiscount { ... on DiscountCodeBasic { title status startsAt endsAt } } }
        pageInfo { hasNextPage endCursor }
      }
    }`,
        data,
      ),
    ),
  );

const productUpdateInput = z.object({
  id: z.string().startsWith("gid://shopify/Product/"),
  title: z.string().min(1).max(255).optional(),
  descriptionHtml: z.string().optional(),
  handle: z.string().min(1).max(255).optional(),
  vendor: z.string().max(255).optional(),
  productType: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "DRAFT"]).optional(),
});

export const updateShopifyProductAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => productUpdateInput.parse(raw))
  .handler(({ data, context }) =>
    authorized(context, async () => {
      const result = await shopifyAdminGraphql<{
        productUpdate: {
          product: UpdatedProduct | null;
          userErrors: Array<{ field?: string[]; message: string }>;
        };
      }>(
        `
      mutation AdminProductUpdate($product: ProductUpdateInput!) {
        productUpdate(product: $product) {
          product { id handle title status updatedAt }
          userErrors { field message }
        }
      }`,
        { product: data },
      );
      if (result.productUpdate.userErrors.length) {
        throw new Error(result.productUpdate.userErrors.map(({ message }) => message).join("; "));
      }
      return result.productUpdate.product;
    }),
  );

const inventoryAdjustmentInput = z.object({
  inventoryItemId: z.string().startsWith("gid://shopify/InventoryItem/"),
  locationId: z.string().startsWith("gid://shopify/Location/"),
  delta: z
    .number()
    .int()
    .refine((value) => value !== 0, "Inventory delta cannot be zero"),
  reason: z.enum([
    "correction",
    "cycle_count_available",
    "damaged",
    "movement_created",
    "movement_received",
    "other",
    "promotion",
    "quality_control",
    "received",
    "reservation_created",
    "reservation_deleted",
    "reservation_updated",
    "restock",
    "safety_stock",
    "shrinkage",
  ]),
  referenceDocumentUri: z.string().url().optional(),
});

export const adjustShopifyInventoryAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => inventoryAdjustmentInput.parse(raw))
  .handler(({ data, context }) =>
    authorized(context, async () => {
      const { inventoryItemId, locationId, delta, reason, referenceDocumentUri } = data;
      const result = await shopifyAdminGraphql<{
        inventoryAdjustQuantities: {
          inventoryAdjustmentGroup: InventoryAdjustmentGroup | null;
          userErrors: Array<{ field?: string[]; message: string }>;
        };
      }>(
        `
      mutation AdminInventoryAdjust($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) {
          inventoryAdjustmentGroup { createdAt reason referenceDocumentUri changes { name delta } }
          userErrors { field message }
        }
      }`,
        {
          input: {
            name: "available",
            reason,
            referenceDocumentUri,
            changes: [{ inventoryItemId, locationId, delta }],
          },
        },
      );
      if (result.inventoryAdjustQuantities.userErrors.length) {
        throw new Error(
          result.inventoryAdjustQuantities.userErrors.map(({ message }) => message).join("; "),
        );
      }
      return result.inventoryAdjustQuantities.inventoryAdjustmentGroup;
    }),
  );
