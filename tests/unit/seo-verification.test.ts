import { describe, expect, it } from "vitest";
import { normalizeGoogleVerificationCode } from "@/lib/seo-verification";

describe("production SEO identity", () => {
  it("extracts the token when the CMS contains a full meta tag", () => {
    expect(
      normalizeGoogleVerificationCode(
        '<meta name="google-site-verification" content="verified-token" />',
      ),
    ).toBe("verified-token");
  });

  it("rejects a verification HTML filename as a meta token", () => {
    expect(normalizeGoogleVerificationCode("google84868c536ade5c41.html")).toBe("");
  });

  it("preserves a plain Search Console token", () => {
    expect(normalizeGoogleVerificationCode("verified-token")).toBe("verified-token");
  });

  it("omits empty values", () => {
    expect(normalizeGoogleVerificationCode("   ")).toBe("");
    expect(normalizeGoogleVerificationCode()).toBe("");
  });
});
