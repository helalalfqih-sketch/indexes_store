import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseAdminClient } from "@/integrations/supabase/client.server";

const mocks = vi.hoisted(() => ({
  storefront: vi.fn(),
}));
vi.mock("@/lib/shopify/catalog.functions", () => ({
  storefront: mocks.storefront,
}));

import { resolveExistingShopifyVariantsForYemenCheckout } from "@/lib/shopify/yemen-checkout.server";

const tenantId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const variantId = "gid://shopify/ProductVariant/123";
const remoteVariant = {
  id: variantId,
  availableForSale: true,
  quantityAvailable: 10,
  price: { amount: "6500.00", currencyCode: "YER" },
  product: {
    id: "gid://shopify/Product/5",
    handle: "original-product",
    title: "Existing product",
    description: "Original description",
    vendor: "Vendor",
    tags: [],
  },
};

function databaseMock(rows: Array<Record<string, unknown>>) {
  const insert = vi.fn();
  const update = vi.fn();
  const query = {
    in: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  const filter = {
    eq: vi.fn().mockReturnValue(query),
  };
  const select = vi.fn().mockReturnValue(filter);
  const from = vi.fn().mockReturnValue({ select, insert, update });
  return {
    admin: { from } as unknown as SupabaseAdminClient,
    from,
    insert,
    update,
  };
}

function mirroredRow(overrides: Record<string, unknown> = {}) {
  return {
    id: productId,
    external_id: variantId,
    tenant_id: tenantId,
    is_published: true,
    currency: "YER",
    price: 6500,
    ...overrides,
  };
}

describe("read-only Shopify catalog mapping for WhatsApp Draft Orders", () => {
  beforeEach(() => {
    mocks.storefront.mockReset().mockResolvedValue({ nodes: [remoteVariant] });
  });

  it("maps a matching published variant without inserting or updating catalog data", async () => {
    const db = databaseMock([mirroredRow()]);
    const result = await resolveExistingShopifyVariantsForYemenCheckout(db.admin, tenantId, [
      variantId,
    ]);
    expect(result.get(variantId)).toBe(productId);
    expect(db.from).toHaveBeenCalledWith("products");
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects price drift without updating the local product price", async () => {
    const db = databaseMock([mirroredRow({ price: 7000 })]);
    await expect(
      resolveExistingShopifyVariantsForYemenCheckout(db.admin, tenantId, [variantId]),
    ).rejects.toThrow("Shopify catalog price or tenant mapping changed");
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects a missing local catalog mirror instead of creating a product", async () => {
    const db = databaseMock([]);
    await expect(
      resolveExistingShopifyVariantsForYemenCheckout(db.admin, tenantId, [variantId]),
    ).rejects.toThrow("Shopify checkout products must be mapped");
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects cross-tenant mapping even when the remote Shopify variant matches", async () => {
    const db = databaseMock([mirroredRow({ tenant_id: "33333333-3333-4333-8333-333333333333" })]);
    await expect(
      resolveExistingShopifyVariantsForYemenCheckout(db.admin, tenantId, [variantId]),
    ).rejects.toThrow("Shopify catalog price or tenant mapping changed");
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects duplicate variants before Shopify or Supabase reads", async () => {
    const db = databaseMock([mirroredRow()]);
    await expect(
      resolveExistingShopifyVariantsForYemenCheckout(db.admin, tenantId, [variantId, variantId]),
    ).rejects.toThrow("Duplicate Shopify variants");
    expect(mocks.storefront).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
  });
});
