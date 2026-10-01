import { describe, expect, it } from "vitest";
import { summarizeTikTokScopes, TIKTOK_SCOPE_DETAILS } from "@/lib/tiktok-scopes";

describe("TikTok account permission display", () => {
  it("shows every supported permission as granted or missing", () => {
    const summary = summarizeTikTokScopes([
      "user.info.basic",
      "video.list",
      "provider.future.scope",
    ]);

    expect(summary.permissions).toHaveLength(TIKTOK_SCOPE_DETAILS.length);
    expect(summary.grantedCount).toBe(2);
    expect(summary.permissions.find(({ scope }) => scope === "user.info.basic")?.granted).toBe(
      true,
    );
    expect(summary.permissions.find(({ scope }) => scope === "video.publish")?.granted).toBe(false);
    expect(summary.unknownScopes).toEqual(["provider.future.scope"]);
  });

  it("deduplicates provider scopes before computing unknown permissions", () => {
    const summary = summarizeTikTokScopes([
      "video.upload",
      "video.upload",
      "provider.extra",
      "provider.extra",
    ]);

    expect(summary.grantedCount).toBe(1);
    expect(summary.unknownScopes).toEqual(["provider.extra"]);
  });
});
