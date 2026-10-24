import { describe, expect, it } from "vitest";
import { branchInputSchema, branchUpdateSchema } from "@/lib/branch.functions";
import {
  categoryInputSchema,
  categoryUpdateSchema,
  productInputSchema,
} from "@/lib/validators/catalog";
import { storeProfileSchema, storeSettingValueSchema } from "@/lib/validators/store";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Zod 4 validation compatibility", () => {
  it("preserves branch create defaults without populating partial updates", () => {
    expect(
      branchInputSchema.parse({
        tenantId: UUID,
        name: "Main",
        slug: "main",
        openingHours: { sunday: "09:00-17:00" },
      }),
    ).toMatchObject({
      country: "Yemen",
      isMainBranch: false,
      isActive: true,
      openingHours: { sunday: "09:00-17:00" },
    });
    expect(branchUpdateSchema.parse({})).toEqual({});
  });

  it("preserves category defaults without populating partial updates", () => {
    expect(categoryInputSchema.parse({ slug: "coffee", name: "Coffee" })).toMatchObject({
      sort: 0,
      is_active: true,
    });
    expect(categoryUpdateSchema.parse({ id: UUID })).toEqual({ id: UUID });
  });

  it("keeps formerly optional product fields absent when omitted", () => {
    const product = productInputSchema.parse({ slug: "coffee", name: "Coffee", price: 10 });
    expect(product).not.toHaveProperty("meta_sync_status");
    expect(product).not.toHaveProperty("featured");
    expect(product).not.toHaveProperty("is_deal");
  });

  it("validates string-keyed records without accepting arrays", () => {
    expect(
      storeProfileSchema.parse({
        display_name: "Indexes",
        social_links: { website: "https://indexesstore.com" },
        branding: { theme: "neutral" },
      }),
    ).toMatchObject({
      social_links: { website: "https://indexesstore.com" },
      branding: { theme: "neutral" },
    });
    expect(storeSettingValueSchema.parse({ enabled: true })).toEqual({ enabled: true });
    expect(storeSettingValueSchema.safeParse([]).success).toBe(false);
  });
});
