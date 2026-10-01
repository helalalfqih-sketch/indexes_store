import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), refresh: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  getSupabaseAdmin: () => ({ from: mocks.from }),
}));
vi.mock("@/lib/tiktok.server", () => ({
  decryptTikTokSecret: () => "test-token",
  refreshStoredTikTokAccount: mocks.refresh,
  beginTikTokOAuthTransaction: vi.fn(),
  disconnectStoredTikTokAccount: vi.fn(),
}));
import { createTikTokMcpAdapter } from "@/lib/mcp/tiktok-adapter.server";

const input = {
  videoUrl: "https://example.com/video.mp4",
  title: "Test",
  privacyLevel: "SELF_ONLY" as const,
  disableComment: true,
  disableDuet: true,
  disableStitch: true,
};
let account: Record<string, unknown>;
let queries: Array<{ table: string; filters: Record<string, unknown> }>;
let fetchMock: ReturnType<typeof vi.fn>;
function response(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ data, error: { code: "ok" } }), { status: 200 });
}
const creator = {
  privacy_level_options: ["SELF_ONLY"],
  comment_disabled: true,
  duet_disabled: true,
  stitch_disabled: true,
};

beforeEach(() => {
  account = {
    id: "a",
    status: "active",
    scopes: ["video.publish", "video.upload"],
    token_expires_at: new Date(Date.now() + 3600000).toISOString(),
  };
  queries = [];
  mocks.from.mockImplementation((table: string) => {
    const query = { table, filters: {} as Record<string, unknown> };
    queries.push(query);
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn((key: string, value: unknown) => {
        query.filters[key] = value;
        return builder;
      }),
      maybeSingle: vi.fn(async () => ({
        data: table === "tiktok_accounts" ? account : { access_token_encrypted: "encrypted" },
        error: null,
      })),
    };
    return builder;
  });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("TikTok adapter publication guards", () => {
  it("checks creator settings before sending publication and scopes account reads to tenant", async () => {
    fetchMock
      .mockResolvedValueOnce(response(creator))
      .mockResolvedValueOnce(response({ publish_id: "p" }));
    const result = await createTikTokMcpAdapter("tenant-a", "u").publishVideo("a", input);
    expect(String(fetchMock.mock.calls[0][0])).toContain("creator_info/query");
    expect(String(fetchMock.mock.calls[1][0])).toContain("publish/video/init");
    expect(result).toMatchObject({ accepted: true, published: false, publish_id: "p" });
    expect(
      queries
        .filter((q) => q.table === "tiktok_accounts")
        .every((q) => q.filters.tenant_id === "tenant-a" && q.filters.id === "a"),
    ).toBe(true);
  });
  it("blocks privacy choices not offered by the creator endpoint", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ ...creator, privacy_level_options: ["PUBLIC_TO_EVERYONE"] }),
    );
    await expect(createTikTokMcpAdapter("t", "u").publishVideo("a", input)).rejects.toThrow(
      "TIKTOK_PRIVACY_LEVEL_NOT_ALLOWED",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each(["disableComment", "disableDuet", "disableStitch"])(
    "blocks enabling prohibited %s",
    async (field) => {
      fetchMock.mockResolvedValueOnce(response(creator));
      await expect(
        createTikTokMcpAdapter("t", "u").publishVideo("a", { ...input, [field]: false }),
      ).rejects.toThrow("TIKTOK_INTERACTION_NOT_ALLOWED");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
  it("fails closed on missing creator settings", async () => {
    fetchMock.mockResolvedValueOnce(response({ privacy_level_options: ["SELF_ONLY"] }));
    await expect(createTikTokMcpAdapter("t", "u").publishVideo("a", input)).rejects.toThrow(
      "TIKTOK_CREATOR_SETTINGS_INVALID",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("does not call TikTok without the publishing scope", async () => {
    account.scopes = ["user.info.basic"];
    await expect(createTikTokMcpAdapter("t", "u").publishVideo("a", input)).rejects.toThrow(
      "TIKTOK_PROVIDER_SCOPE_VIDEO_PUBLISH_REQUIRED",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(["draft", "direct"])(
    "does not report acceptance for a malformed %s response",
    async (mode) => {
      if (mode === "direct") fetchMock.mockResolvedValueOnce(response(creator));
      fetchMock.mockResolvedValueOnce(response({}));
      const adapter = createTikTokMcpAdapter("t", "u");
      const result =
        mode === "direct"
          ? await adapter.publishVideo("a", input)
          : await adapter.uploadVideoDraft("a", input.videoUrl);
      expect(result).toMatchObject({ accepted: false, published: false });
    },
  );
  it("reports scope gaps and unsupported operations without a provider request", async () => {
    account.scopes = ["user.info.basic"];
    const result = await createTikTokMcpAdapter("t", "u").inspectCapabilities("a");
    expect(result.missing_provider_scopes).toContain("video.publish");
    expect(result.unsupported_operations).toContain("global_video_search");
    expect(result.capability_basis).toBe("granted_scopes_only_not_live_verification");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
