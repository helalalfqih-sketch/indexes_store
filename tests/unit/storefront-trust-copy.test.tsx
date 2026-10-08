import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ShippingBanner } from "@/components/storefront/ShippingBanner";
import { TrustStrip } from "@/components/home/trust-strip";
import { OfferContent } from "@/components/home/exclusive-offers-banner";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/search">{children}</a>,
}));

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

    expect(screen.getByText("تُحدَّد تفاصيل التوصيل عند تأكيد الطلب")).toBeInTheDocument();
    expect(screen.queryByText(/شحن مجاني/)).not.toBeInTheDocument();
    expect(screen.queryByText(/24\s*-\s*48/)).not.toBeInTheDocument();
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

    expect(screen.getByText("التوصيل وفق العنوان المؤكد")).toBeInTheDocument();
    expect(screen.getByText(/شحن مجاني للطلبات المؤهلة فوق/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp((45_000).toLocaleString("ar-YE")))).toBeInTheDocument();
  });

  it("keeps the home trust strip free of unsupported policy claims", () => {
    render(<TrustStrip />);

    expect(screen.getByText("السعر المسجل")).toBeInTheDocument();
    expect(screen.getByText("حالة المخزون")).toBeInTheDocument();
    expect(screen.getByText("الدفع عند الاستلام")).toBeInTheDocument();
    expect(screen.getByText("الطلب عبر واتساب")).toBeInTheDocument();
    expect(screen.queryByText(/ضمان|شحن مجاني|24\/7|14 يوم/)).not.toBeInTheDocument();
  });

  it("keeps the catalog banner free of a fabricated discount percentage", () => {
    render(<OfferContent compact />);

    expect(screen.getByText("استكشف المنتجات")).toBeInTheDocument();
    expect(screen.getByText("الأسعار والتوفر من بيانات الكتالوج")).toBeInTheDocument();
    expect(screen.queryByText(/50%|خصومات تصل/)).not.toBeInTheDocument();
  });
});
