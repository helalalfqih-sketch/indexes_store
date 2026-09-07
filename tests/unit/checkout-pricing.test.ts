import { describe, expect, it } from "vitest";
import {
  discountAmountForCoupon,
  discountPercentForCoupon,
} from "@/lib/checkout-pricing";

describe("checkout pricing", () => {
  it("applies only advertised coupon codes", () => {
    expect(discountPercentForCoupon("INDEXES10")).toBe(10);
    expect(discountPercentForCoupon(" indexes20 ")).toBe(20);
    expect(discountPercentForCoupon("UNKNOWN")).toBe(0);
    expect(discountPercentForCoupon()).toBe(0);
  });

  it("calculates the same rounded discount used by checkout", () => {
    expect(discountAmountForCoupon(10_000, "INDEXES10")).toBe(1_000);
    expect(discountAmountForCoupon(10_001, "INDEXES20")).toBe(2_000);
    expect(discountAmountForCoupon(10_000, "UNKNOWN")).toBe(0);
  });

  it("does not discount invalid subtotals", () => {
    expect(discountAmountForCoupon(0, "INDEXES20")).toBe(0);
    expect(discountAmountForCoupon(Number.NaN, "INDEXES20")).toBe(0);
  });
});
