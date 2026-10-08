import { describe, it, expect } from "vitest";
import {
  mapPublishedStorefrontSettings,
  normalizeSectionOrder,
  clampNumber,
  isSafeUrl,
  sanitizeUrl,
  KNOWN_SECTION_KEYS,
  DEFAULT_SECTION_ORDER,
} from "@/lib/adapters/storefront-settings.adapter";

describe("storefront-settings.adapter", () => {
  it("1. empty settings preserve approved defaults", () => {
    const result = mapPublishedStorefrontSettings(null);

    expect(result.hero.enabled).toBe(true);
    expect(result.hero.type).toBe("sphere_3d");
    expect(result.hero.globe.maxProducts).toBe(100);
    expect(result.hero.globe.radius).toBe(2.2);
    expect(result.hero.globe.rotationSpeed).toBe(0.3);
    expect(result.sections.latest.limit).toBe(12);
    expect(result.sections.deals.limit).toBe(6);
    expect(result.sections.categories.limit).toBe(8);
    expect(result.shipping.deliveryText).toBe("تُحدَّد تفاصيل التوصيل عند تأكيد الطلب");
    expect(result.shipping.freeText).toBe("");
    expect(result.shipping.threshold).toBe(0);
    expect(result.sections.trustBadges.enabled).toBe(false);
    expect(result.sections.trustBadges.badge1).toBe("");
    expect(result.contact.whatsappPhone).toBe("967771370740");
    expect(result.sections.sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
  });

  it("2. partial legacy sectionOrder appends missing enabled sections", () => {
    const legacyOrder = ["hero", "categories", "deals"];
    const normalized = normalizeSectionOrder(legacyOrder);

    // Preserves legacy order at the front
    expect(normalized.slice(0, 3)).toEqual(["hero", "categories", "deals"]);
    // Appends missing enabled modern sections
    for (const key of DEFAULT_SECTION_ORDER) {
      expect(normalized).toContain(key);
    }
  });

  it("3. duplicates and unknown keys are removed from sectionOrder", () => {
    const rawOrder = [
      "hero",
      "malicious_script",
      "hero",
      "categories",
      "unknown_key",
      "deals",
      "deals",
    ];
    const normalized = normalizeSectionOrder(rawOrder);

    expect(normalized).not.toContain("malicious_script");
    expect(normalized).not.toContain("unknown_key");
    // Ensure no duplicates
    const unique = new Set(normalized);
    expect(unique.size).toBe(normalized.length);
  });

  it("4. invalid and extreme numeric values are clamped within domain bounds", () => {
    expect(clampNumber(-10, 6, 120, 50)).toBe(6);
    expect(clampNumber(999, 6, 120, 50)).toBe(120);
    expect(clampNumber(NaN, 6, 120, 50)).toBe(50);
    expect(clampNumber("invalid" as any, 6, 120, 50)).toBe(50);

    const mapped = mapPublishedStorefrontSettings({
      hero: {
        sphereMaxProducts: 500, // Should clamp to 120
        sphereRadius: 0.1, // Should clamp to 1.0
        sphereTileScale: 10, // Should clamp to 2.0
        sphereRotationSpeed: -5, // Should clamp to 0
        globeTitleFontSize: 100, // Should clamp to 48
        globeSubtitleFontSize: 2, // Should clamp to 8
      } as any,
      sections: {
        latest: { limit: 100 } as any, // Should clamp to 24
        deals: { limit: 0 } as any, // Should clamp to 2
      } as any,
    });

    expect(mapped.hero.globe.maxProducts).toBe(120);
    expect(mapped.hero.globe.radius).toBe(1.0);
    expect(mapped.hero.globe.tileScale).toBe(2.0);
    expect(mapped.hero.globe.rotationSpeed).toBe(0);
    expect(mapped.hero.globe.titleFontSize).toBe(48);
    expect(mapped.hero.globe.subtitleFontSize).toBe(8);
    expect(mapped.sections.latest.limit).toBe(24);
    expect(mapped.sections.deals.limit).toBe(2);
  });

  it("5. unsafe URLs are rejected", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("//evil.com/exploit")).toBe(false);
    expect(isSafeUrl("https://indexes-store.com/offers")).toBe(true);
    expect(isSafeUrl("/offers")).toBe(true);
    expect(isSafeUrl("./categories")).toBe(true);
  });

  it("6. allowed relative/https/image-data URLs follow field-specific rules", () => {
    const validDataImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    // Banner image allows data:image
    expect(isSafeUrl(validDataImage, { allowImageData: true })).toBe(true);
    // CTA link disallows data: URLs
    expect(isSafeUrl(validDataImage, { allowImageData: false })).toBe(false);

    const mapped = mapPublishedStorefrontSettings({
      hero: {
        bannerImageUrl: validDataImage,
        ctaLink: "javascript:alert(1)",
        secondaryCtaLink: "/safe-relative-path",
      } as any,
    });

    expect(mapped.hero.bannerImageUrl).toBe(validDataImage);
    expect(mapped.hero.ctaLink).toBe("/offers"); // Fell back to safe default
    expect(mapped.hero.secondaryCtaLink).toBe("/safe-relative-path");
  });

  it("7. invalid hero type falls back to sphere_3d safely", () => {
    const mapped = mapPublishedStorefrontSettings({
      hero: {
        type: "unsupported_unknown_mode" as any,
      } as any,
    });

    expect(mapped.hero.type).toBe("sphere_3d");
  });

  it("8. source input is not mutated", () => {
    const rawInput = Object.freeze({
      hero: Object.freeze({
        title: "Original Title",
        sphereMaxProducts: 50,
      }),
      sections: Object.freeze({
        sectionOrder: Object.freeze(["hero", "categories"]),
      }),
    });

    expect(() => mapPublishedStorefrontSettings(rawInput as any)).not.toThrow();
  });

  it("9. draft values are ignored and never override published values", () => {
    const publishedInput = {
      hero: {
        title: "Published Live Title",
        draft_value: { title: "Draft Unpublished Title" },
      } as any,
      draft_value: { hero: { title: "Global Draft Title" } } as any,
    };

    const mapped = mapPublishedStorefrontSettings(publishedInput as any);
    expect(mapped.hero.title).toBe("Published Live Title");
  });

  it("10. preserves explicitly configured shipping and trust claims", () => {
    const mapped = mapPublishedStorefrontSettings({
      cart_config: {
        freeShippingThreshold: 45_000,
      } as any,
      navigation: {
        shippingBarDeliveryText: "التوصيل خلال المدة المتفق عليها",
        shippingBarFreeText: "شحن مجاني للطلبات المؤهلة فوق",
      } as any,
      sections: {
        trustBadges: {
          enabled: true,
          badge1: "سياسة توصيل منشورة",
          badge2: "",
          badge3: "",
        },
      } as any,
    });

    expect(mapped.shipping).toMatchObject({
      deliveryText: "التوصيل خلال المدة المتفق عليها",
      freeText: "شحن مجاني للطلبات المؤهلة فوق",
      threshold: 45_000,
    });
    expect(mapped.sections.trustBadges).toMatchObject({
      enabled: true,
      badge1: "سياسة توصيل منشورة",
      badge2: "",
      badge3: "",
      badge4: "",
    });
  });

  it("11. uses neutral copy when optional hero text is blank", () => {
    const mapped = mapPublishedStorefrontSettings({
      hero: { badgeText: "", title: "", subtitle: "" } as any,
    });

    expect(mapped.hero).toMatchObject({
      badgeText: "INDEXES",
      title: "استكشف المنتجات",
      subtitle: "الأسعار والتوفر من بيانات الكتالوج",
    });
    expect(`${mapped.hero.badgeText} ${mapped.hero.title}`).not.toMatch(/50%|خصم/);
  });
});

describe("countdown calculation logic", () => {
  function calculateNearestDealEnd(
    products: Array<{ dealEnd?: string | null }>,
    now: number,
  ): number | null {
    const validEnds = products
      .map((p) => (p.dealEnd ? new Date(p.dealEnd).getTime() : NaN))
      .filter((t) => !isNaN(t) && t > now);
    return validEnds.length > 0 ? Math.min(...validEnds) : null;
  }

  it("calculates active deal countdown correctly", () => {
    const now = 1000000;
    const futureTime = now + 3600 * 1000; // 1 hour ahead
    const products = [{ dealEnd: new Date(futureTime).toISOString() }];

    const nearest = calculateNearestDealEnd(products, now);
    expect(nearest).toBe(futureTime);
  });

  it("expired deal returns null (timer hidden / not selected)", () => {
    const now = 1000000;
    const pastTime = now - 3600 * 1000; // 1 hour ago
    const products = [{ dealEnd: new Date(pastTime).toISOString() }];

    const nearest = calculateNearestDealEnd(products, now);
    expect(nearest).toBeNull();
  });

  it("missing deal_end returns null", () => {
    const now = 1000000;
    const products = [{ dealEnd: null }, { dealEnd: undefined }, { dealEnd: "" }];

    const nearest = calculateNearestDealEnd(products, now);
    expect(nearest).toBeNull();
  });

  it("multiple active deals select the nearest valid end", () => {
    const now = 1000000;
    const deal1 = now + 7200 * 1000; // 2 hours ahead
    const deal2 = now + 1800 * 1000; // 30 mins ahead (nearest)
    const deal3 = now + 14400 * 1000; // 4 hours ahead
    const products = [
      { dealEnd: new Date(deal1).toISOString() },
      { dealEnd: new Date(deal2).toISOString() },
      { dealEnd: new Date(deal3).toISOString() },
    ];

    const nearest = calculateNearestDealEnd(products, now);
    expect(nearest).toBe(deal2);
  });
});
