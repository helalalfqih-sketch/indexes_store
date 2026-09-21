import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  exchangeStoreCode,
  exchangeStoreRefreshToken,
  issueStoreCode,
  registerStoreClient,
  validateStoreClient,
  verifyStoreAccessToken,
} from "@/lib/mcp/store-oauth.server";

const redirectUri = "https://chatgpt.com/connector/oauth/store-test";
const verifier = "a".repeat(64);
const challenge = createHash("sha256").update(verifier).digest("base64url");

describe("store MCP OAuth", () => {
  beforeEach(() => {
    process.env.STORE_MCP_OAUTH_SECRET = "test-secret-that-is-longer-than-thirty-two-characters";
  });
  afterEach(() => {
    delete process.env.STORE_MCP_OAUTH_SECRET;
  });

  it("binds access and refresh tokens to the approved tenant", () => {
    const clientId = registerStoreClient([redirectUri]);
    validateStoreClient(clientId, redirectUri);
    const code = issueStoreCode({
      sub: "admin-user",
      tenantId: "11111111-1111-4111-8111-111111111111",
      clientId,
      redirectUri,
      challenge,
    });
    const tokens = exchangeStoreCode(code, clientId, redirectUri, verifier);
    expect(verifyStoreAccessToken(tokens.accessToken)).toEqual({
      sub: "admin-user",
      tenantId: "11111111-1111-4111-8111-111111111111",
    });
    expect(verifyStoreAccessToken(exchangeStoreRefreshToken(tokens.refreshToken).accessToken)).toEqual(
      {
        sub: "admin-user",
        tenantId: "11111111-1111-4111-8111-111111111111",
      },
    );
  });

  it("rejects redirect substitution and an incorrect PKCE verifier", () => {
    const clientId = registerStoreClient([redirectUri]);
    expect(() => validateStoreClient(clientId, "https://example.com/callback")).toThrow();
    const code = issueStoreCode({
      sub: "admin-user",
      tenantId: "11111111-1111-4111-8111-111111111111",
      clientId,
      redirectUri,
      challenge,
    });
    expect(() => exchangeStoreCode(code, clientId, redirectUri, "b".repeat(64))).toThrow();
  });
});
