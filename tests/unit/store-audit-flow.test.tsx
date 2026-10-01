// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UnifiedCartFlow } from "@/components/storefront/UnifiedCartFlow2";
import { useCart } from "@/lib/cart-store";
import { sanitizeAnalyticsPayload } from "@/lib/analytics";
import type { Product } from "@/components/storefront/types";

const mocks = vi.hoisted(() => ({ quote: vi.fn(), submit: vi.fn() }));
vi.mock("@/lib/checkout-quote.functions", () => ({ getCheckoutQuote: mocks.quote }));
vi.mock("@/lib/actions/order.actions", () => ({ submitOrder: mocks.submit }));
afterEach(() => {
  cleanup();
  useCart.setState({ couponCode: "" });
  vi.clearAllMocks();
});

const product = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "منتج تجريبي",
  priceYER: 36800,
  originalPriceYER: 36800,
  image: "",
  inStock: true,
  stockCount: 10,
} as Product;
const quote = {
  subtotal: 36800,
  discount: 7360,
  shipping: 3000,
  total: 32440,
  currency: "YER",
  couponCode: "INDEXES20",
  freeShippingThreshold: 30000,
  items: [{ id: product.id, name: product.name, quantity: 1, unitPrice: 36800, stock: 10 }],
};

describe("store audit regressions", () => {
  it("preserves the approved coupon and total when returning from delivery", async () => {
    useCart.setState({ couponCode: "INDEXES20" });
    mocks.quote.mockResolvedValue(quote);
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <UnifiedCartFlow
          isOpen
          onClose={() => {}}
          cartItems={[{ product, quantity: 1 }]}
          currency="YER"
          onUpdateQuantity={() => {}}
          onRemoveItem={() => {}}
        />
      </QueryClientProvider>,
    );
    const next = await screen.findByRole("button", { name: "المتابعة لإتمام الطلب" });
    await waitFor(() => expect((next as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(next);
    expect(await screen.findByText("بيانات التسليم")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /العودة للسلة/ }));
    expect(
      ((await screen.findByRole("textbox", { name: "كود الخصم" })) as HTMLInputElement).value,
    ).toBe("INDEXES20");
    expect(useCart.getState().couponCode).toBe("INDEXES20");
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it("blocks checkout when the quote service fails", async () => {
    mocks.quote.mockRejectedValue(new Error("fixture failure"));
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <UnifiedCartFlow
          isOpen
          onClose={() => {}}
          cartItems={[{ product, quantity: 1 }]}
          currency="YER"
          onUpdateQuantity={() => {}}
          onRemoveItem={() => {}}
        />
      </QueryClientProvider>,
    );
    await screen.findByRole("button", { name: "إعادة المحاولة" });
    expect(
      (screen.getByRole("button", { name: "المتابعة لإتمام الطلب" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it("does not export names, addresses, phone numbers or raw search text", () => {
    expect(
      sanitizeAnalyticsPayload({
        name: "Private",
        phone: "777777777",
        address: "Private",
        query: "private text",
        productId: "p1",
        value: 32440,
        currency: "USD",
      }),
    ).toEqual({ productId: "p1", value: 32440, currency: "YER" });
  });
});
