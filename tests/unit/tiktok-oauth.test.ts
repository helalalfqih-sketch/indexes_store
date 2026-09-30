import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildTikTokAuthorizationUrl,
  decryptTikTokSecret,
  encryptTikTokSecret,
  normalizeTikTokReturnTo,
  parseTikTokProfile,
  parseTikTokTokenResponse,
} from "../../src/lib/tiktok.server";

const ENV_KEYS = [
  "TIKTOK_CLIENT_KEY",
  "TIKTOK_CLIENT_SECRET",
  "TIKTOK_REDIRECT_URI",
  "TIKTOK_TOKEN_ENCRYPTION_KEY",
  "TIKTOK_OAUTH_SCOPES",
  "TIKTOK_AUTHORIZE_URL",
  "TIKTOK_TOKEN_URL",
  "TIKTOK_USER_INFO_URL",
] as const;

describe("TikTok OAuth server helpers", () => {
  beforeEach(() => {
    process.env.TIKTOK_CLIENT_KEY = "client-key";
    process.env.TIKTOK_CLIENT_SECRET = "server-secret";
    process.env.TIKTOK_REDIRECT_URI = "https://indexes-store.vercel.app/api/tiktok/callback";
    process.env.TIKTOK_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    process.env.TIKTOK_OAUTH_SCOPES = "user.info.basic";
  });

  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("encrypts provider tokens with randomized authenticated encryption", () => {
    const token = "secret-access-token";
    const first = encryptTikTokSecret(token);
    const second = encryptTikTokSecret(token);

    expect(first).not.toBe(second);
    expect(first).not.toContain(token);
    expect(decryptTikTokSecret(first)).toBe(token);
    expect(decryptTikTokSecret(second)).toBe(token);
  });

  it("builds the TikTok authorization URL without exposing client_secret", () => {
    const value = buildTikTokAuthorizationUrl({
      state: "state-123",
    });
    const url = new URL(value);

    expect(url.origin).toBe("https://www.tiktok.com");
    expect(url.pathname).toBe("/v2/auth/authorize/");
    expect(url.searchParams.get("client_key")).toBe("client-key");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("user.info.basic");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://indexes-store.vercel.app/api/tiktok/callback",
    );
    expect(url.searchParams.get("state")).toBe("state-123");
    expect(value).not.toContain("server-secret");
  });

  it("fails closed when an endpoint override leaves the TikTok host", () => {
    process.env.TIKTOK_AUTHORIZE_URL = "https://example.com/oauth";
    expect(() => buildTikTokAuthorizationUrl({ state: "x" })).toThrow(
      "TIKTOK_AUTHORIZE_URL_HOST_INVALID",
    );
  });

  it("parses token responses without leaking provider field names to callers", () => {
    expect(
      parseTikTokTokenResponse({
        access_token: "access",
        refresh_token: "refresh",
        open_id: "open-1",
        scope: "user.info.basic,video.list",
        expires_in: 86400,
        refresh_expires_in: 31536000,
      }),
    ).toEqual({
      accessToken: "access",
      refreshToken: "refresh",
      openId: "open-1",
      scope: ["user.info.basic", "video.list"],
      expiresIn: 86400,
      refreshExpiresIn: 31536000,
    });
  });

  it("parses basic TikTok profile metadata only", () => {
    expect(
      parseTikTokProfile(
        {
          data: {
            user: {
              open_id: "open-1",
              union_id: "union-1",
              display_name: "Indexes Store",
              avatar_url: "https://example.com/avatar.jpg",
            },
          },
        },
        "open-1",
      ),
    ).toEqual({
      openId: "open-1",
      unionId: "union-1",
      displayName: "Indexes Store",
      avatarUrl: "https://example.com/avatar.jpg",
    });
  });

  it("keeps OAuth return paths inside the TikTok admin integration", () => {
    expect(normalizeTikTokReturnTo("/admin/integrations/tiktok?tab=accounts")).toBe(
      "/admin/integrations/tiktok?tab=accounts",
    );
    expect(normalizeTikTokReturnTo("https://evil.example/callback")).toBe(
      "/admin/integrations/tiktok",
    );
    expect(normalizeTikTokReturnTo("/admin/products")).toBe("/admin/integrations/tiktok");
  });
});
