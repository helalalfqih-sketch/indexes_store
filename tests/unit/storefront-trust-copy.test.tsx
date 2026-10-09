// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ShippingBanner } from "@/components/storefront/ShippingBanner";
import { TrustStrip } from "@/components/home/trust-strip";
import { OfferContent } from "@/components/home/exclusive-offers-banner";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/search">{children}</a>,
}));

beforeEach(() => {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

afterEach(cleanup);

describe("storefront trust copy", () => {
  it("uses neutral delivery copy and hides unconfigured free shipping", () => {
    render(
      <ShippingBanner
        shippingConfig={{
          deliveryText: "",
          freeText: "",
          threshold: 0,
        }}
      />,
    );

    expect(screen.getByText("تُحدَّد تفاصيل التوصيل عند تأكيد الطلب")).toBeTruthy();
    expect(screen.queryByText(/شحن مجاني/)).toBeNull();
    expect(screen.queryByText(/24\s*-\s*48/)).toBeNull();
  });

  it("shows free shipping only when its text and threshold are configured", () => {
    render(
      <ShippingBanner
        shippingConfig={{
          deliveryText: "التوصيل وفق العنوان المؤكد",
          freeText: "شحن مجاني للطلبات المؤهلة فوق",
          threshold: 45_000,
        }}
      />,
    );

    expect(screen.getByText("التوصيل وفق العنوان المؤكد")).toBeTruthy();
    expect(screen.getByText(/شحن مجاني للطلبات المؤهلة فوق/)).toBeTruthy();
    expect(screen.getByText(new RegExp((45_000).toLocaleString("ar-YE")))).toBeTruthy();
  });

  it("keeps the home trust strip free of unsupported policy claims", () => {
    render(<TrustStrip />);

    expect(screen.getByText("السعر المسجل")).toBeTruthy();
    expect(screen.getByText("حالة المخزون")).toBeTruthy();
    expect(screen.getByText("الدفع عند الاستلام")).toBeTruthy();
    expect(screen.getByText("الطلب عبر واتساب")).toBeTruthy();
    expect(screen.queryByText(/ضمان|شحن مجاني|24\/7|14 يوم/)).toBeNull();
  });

  it("keeps the catalog banner free of a fabricated discount percentage", () => {
    render(<OfferContent compact />);

    expect(screen.getByText("استكشف المنتجات")).toBeTruthy();
    expect(screen.getByText("الأسعار والتوفر من بيانات الكتالوج")).toBeTruthy();
    expect(screen.queryByText(/50%|خصومات تصل/)).toBeNull();
  });
});
