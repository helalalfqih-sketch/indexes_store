import { createHash, createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exchangeStoreCode,
  exchangeStoreRefreshToken,
  issueStoreCode,
  registerStoreClient,
  validateStoreClient,
  verifyStoreAccessToken,
} from "@/lib/mcp/store-oauth.server";

const testSecret = "isolated-registration-test-secret-at-least-32-characters";
const redirectUri = "https://chatgpt.com/connector/oauth/registration-test";
const now = new Date("2026-09-24T00:00:00Z");
const seconds = () => Math.floor(Date.now() / 1000);
// Historical wire-format fixtures, signed only with an isolated test secret.
function fixture(payload: Record<string, unknown>, signingSecret = testSecret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = createHash("sha256")
    .update("indexes-store-mcp-oauth-v1")
    .update(signingSecret)
    .digest();
  return `${body}.${createHmac("sha256", key).update(body).digest("base64url")}`;
}

describe("persistent Store public-client registration", () => {
  beforeEach(() => {
    vi.stubEnv("STORE_MCP_OAUTH_SECRET", testSecret);
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it.each(["store_client", "store_client_v2", "store_client_v3"])(
    "accepts an unexpired historical %s registration without changing its ID",
    (kind) => {
      const clientId = fixture({ kind, redirect_uris: [redirectUri], exp: seconds() + 86400 });
      expect(() => validateStoreClient(clientId, redirectUri)).not.toThrow();
    },
  );

  it("keeps a new registration valid when ChatGPT reuses it after 31 days", () => {
    const clientId = registerStoreClient([redirectUri]);
    vi.setSystemTime(now.getTime() + 31 * 86400_000);
    expect(() => validateStoreClient(clientId, redirectUri)).not.toThrow();
  });

  it("does not revive expired legacy registrations", () => {
    const clientId = fixture({
      kind: "store_client_v3",
      redirect_uris: [redirectUri],
      exp: seconds() - 1,
    });
    expect(() => validateStoreClient(clientId, redirectUri)).toThrow();
  });

  it("rejects altered signatures, other signing keys, and exact-redirect substitution", () => {
    const clientId = registerStoreClient([redirectUri]);
    expect(() => validateStoreClient(`${clientId}x`, redirectUri)).toThrow();
    const otherKey = fixture(
      { kind: "store_client", redirect_uris: [redirectUri], exp: seconds() + 60 },
      "different-secret-at-least-thirty-two-characters",
    );
    expect(() => validateStoreClient(otherKey, redirectUri)).toThrow();
    expect(() => validateStoreClient(clientId, `${redirectUri}-other`)).toThrow();
  });

  it.each(["store_access", "store_refresh", "store_code", "store_client_v99"])(
    "does not accept a signed %s as a client registration",
    (kind) => {
      expect(() =>
        validateStoreClient(
          fixture({ kind, redirect_uris: [redirectUri], exp: seconds() + 60 }),
          redirectUri,
        ),
      ).toThrow();
    },
  );

  it("does not accept missing expiry without the new registration format", () => {
    expect(() =>
      validateStoreClient(
        fixture({ kind: "store_client_v3", redirect_uris: [redirectUri] }),
        redirectUri,
      ),
    ).toThrow();
  });

  it("never treats a persistent client ID as an access or refresh token", () => {
    const clientId = registerStoreClient([redirectUri]);
    expect(() => verifyStoreAccessToken(clientId)).toThrow();
    expect(() => exchangeStoreRefreshToken(clientId)).toThrow();
  });

  it("continues to expire authorization codes, access tokens and refresh tokens", () => {
    const clientId = registerStoreClient([redirectUri]);
    const verifier = "v".repeat(64);
    const code = issueStoreCode({
      sub: "test-admin",
      tenantId: "test-tenant",
      clientId,
      redirectUri,
      challenge: createHash("sha256").update(verifier).digest("base64url"),
      scope: "store.read",
    });
    const tokens = exchangeStoreCode(code, clientId, redirectUri, verifier);
    vi.setSystemTime(now.getTime() + 301_000);
    expect(() => exchangeStoreCode(code, clientId, redirectUri, verifier)).toThrow();
    vi.setSystemTime(now.getTime() + 3601_000);
    expect(() => verifyStoreAccessToken(tokens.accessToken)).toThrow();
    vi.setSystemTime(now.getTime() + 31 * 86400_000);
    expect(() => exchangeStoreRefreshToken(tokens.refreshToken)).toThrow();
  });
});
