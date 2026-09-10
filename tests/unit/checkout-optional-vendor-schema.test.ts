import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({ getAdmin: vi.fn(), split: vi.fn() }));
const tenantId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const orderId = "33333333-3333-4333-8333-333333333333";
const vendorId = "44444444-4444-4444-8444-444444444444";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (data: unknown) => data;
    const builder = {
      inputValidator: (validator: typeof validate) => {
        validate = validator;
        return builder;
      },
      middleware: () => builder,
      handler:
        (handler: (args: { data: unknown }) => unknown) =>
        ({ data }: { data: unknown }) =>
          handler({ data: validate(data) }),
    };
    return builder;
  },
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => new Request("https://fixture.invalid"),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ getSupabaseAdmin: mocks.getAdmin }));
vi.mock("@/lib/saas/tenant-resolver", () => ({
  resolveCurrentTenant: async () => "11111111-1111-4111-8111-111111111111",
}));
vi.mock("@/lib/services/vendor-order.service", () => ({ splitOrderIntoVendorOrders: mocks.split }));

import { createOrder, type CreateOrderPayload } from "@/lib/order.functions";

const payload: CreateOrderPayload = {
  items: [{ productRef: { source: "supabase", id: productId }, quantity: 1 }],
  customerName: "Fixture Customer",
  customerPhone: "+967700000000",
  customerAddress: "Fixture staging address",
  paymentProvider: "cod",
};
const committed = { orderId, total: 4000, currency: "YER", itemsCount: 1 };
let vendorColumn: boolean;
let coreFailure: boolean;
let unavailable: boolean;
let commitFailure: boolean;
let events: string[];

beforeEach(() => {
  vendorColumn = false;
  coreFailure = false;
  unavailable = false;
  commitFailure = false;
  events = [];
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const fixtureFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname !== "checkout-fixture.supabase.co")
      throw new Error("Non-fixture request blocked");
    const table = url.pathname.split("/").at(-1);
    const columns = url.searchParams.get("select") ?? "";
    events.push(table === "create_checkout_order_v2" ? "commit" : `${table}:${columns}`);
    const respond = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" },
      });
    if (table === "tenants") return respond([{ id: tenantId, status: "active" }]);
    if (table === "products") {
      expect(url.searchParams.get("tenant_id")).toBe(`eq.${tenantId}`);
      expect(url.searchParams.get("id")).toContain(productId);
      if (columns.includes("vendor_id")) {
        return vendorColumn
          ? respond([
              { id: productId, tenant_id: tenantId, is_published: true, vendor_id: vendorId },
            ])
          : respond({ code: "42703", message: "column products.vendor_id does not exist" }, 400);
      }
      if (coreFailure) return respond({ code: "42501", message: "permission denied" }, 403);
      expect(url.searchParams.get("is_published")).toBe("eq.true");
      return respond(
        unavailable ? [] : [{ id: productId, tenant_id: tenantId, is_published: true }],
      );
    }
    if (table === "create_checkout_order_v2") {
      expect(JSON.parse(String(init?.body))._payment_provider).toBe("cod");
      return commitFailure
        ? respond({ message: "fixture transaction failed" }, 500)
        : respond(committed);
    }
    if (table === "order_items")
      return respond([
        {
          id: "fixture-line",
          order_id: orderId,
          product_id: productId,
          quantity: 1,
          unit_price: 1000,
          total_price: 1000,
        },
      ]);
    throw new Error(`Unexpected fixture endpoint: ${table}`);
  };
  mocks.getAdmin.mockReturnValue(
    createClient("https://checkout-fixture.supabase.co", "fixture-key", {
      global: { fetch: fixtureFetch },
      auth: { persistSession: false },
    }),
  );
});
afterEach(() => vi.restoreAllMocks());

describe("core checkout without optional vendor schema", () => {
  it("returns the committed COD order when vendor_id is absent", async () => {
    await expect(createOrder({ data: payload })).resolves.toEqual(committed);
    expect(events.filter((event) => event === "commit")).toHaveLength(1);
    expect(events.indexOf("products:id,vendor_id")).toBeGreaterThan(events.indexOf("commit"));
    expect(mocks.split).not.toHaveBeenCalled();
  });

  it("preserves vendor assignment when the optional schema exists", async () => {
    vendorColumn = true;
    await expect(createOrder({ data: payload })).resolves.toEqual(committed);
    expect(mocks.split).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId,
        orderId,
        items: [expect.objectContaining({ product_id: productId, vendor_id: vendorId })],
      }),
    );
  });

  it("does not commit when core product validation fails", async () => {
    coreFailure = true;
    await expect(createOrder({ data: payload })).rejects.toThrow(
      "Unable to validate the checkout products.",
    );
    expect(events).not.toContain("commit");
  });

  it("does not commit unavailable products", async () => {
    unavailable = true;
    await expect(createOrder({ data: payload })).rejects.toThrow(/unavailable/);
    expect(events).not.toContain("commit");
  });

  it("does not return success or split vendors when the transaction fails", async () => {
    commitFailure = true;
    await expect(createOrder({ data: payload })).rejects.toThrow("Checkout transaction failed.");
    expect(mocks.split).not.toHaveBeenCalled();
    expect(events).not.toContain("products:id,vendor_id");
  });
});
