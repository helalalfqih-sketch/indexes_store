import { describe, it, expect } from "vitest";
import crypto from "node:crypto";

// Simple utility extracted for testing HMAC signature validation
function verifyWhatsAppSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!secret) return true; // Fail-open fallback for missing env vars
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const expectedSignature = `sha256=${hmac.digest("hex")}`;
  return signature === expectedSignature;
}

describe("WhatsApp Webhook HMAC Validation", () => {
  const secret = "test_secret_123";
  const body = JSON.stringify({ entry: [{ id: "waba_123" }] });

  it("should return true for a valid signature", () => {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(body);
    const validSignature = `sha256=${hmac.digest("hex")}`;
    
    expect(verifyWhatsAppSignature(body, validSignature, secret)).toBe(true);
  });

  it("should return false for an invalid signature", () => {
    expect(verifyWhatsAppSignature(body, "sha256=invalidsig", secret)).toBe(false);
  });

  it("should return false if signature is missing but secret is provided", () => {
    expect(verifyWhatsAppSignature(body, "", secret)).toBe(false);
  });
});
