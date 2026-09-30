import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import {
  beginTikTokOAuthTransaction,
  decryptTikTokSecret,
  disconnectStoredTikTokAccount,
  refreshStoredTikTokAccount,
} from "@/lib/tiktok.server";

export interface TikTokMcpAdapter {
  listAccounts(): Promise<Record<string, unknown>>;
  getAccount(accountId: string): Promise<Record<string, unknown>>;
  inspectCapabilities(accountId: string): Promise<Record<string, unknown>>;
  inspectProfile(accountId: string): Promise<Record<string, unknown>>;
  listVideos(
    accountId: string,
    maxCount: number,
    cursor?: number,
  ): Promise<Record<string, unknown>>;
  searchVideos(accountId: string, query: string, limit: number): Promise<Record<string, unknown>>;
  getVideo(accountId: string, videoId: string): Promise<Record<string, unknown>>;
  creatorInfo(accountId: string): Promise<Record<string, unknown>>;
  uploadVideoDraft(accountId: string, videoUrl: string): Promise<Record<string, unknown>>;
  publishVideo(
    accountId: string,
    input: {
      videoUrl: string;
      title: string;
      privacyLevel: TikTokPrivacyLevel;
      disableComment: boolean;
      disableDuet: boolean;
      disableStitch: boolean;
      videoCoverTimestampMs?: number;
    },
  ): Promise<Record<string, unknown>>;
  publishStatus(accountId: string, publishId: string): Promise<Record<string, unknown>>;
  startLink(): Promise<Record<string, unknown>>;
  refreshAccount(accountId: string): Promise<Record<string, unknown>>;
  disconnectAccount(accountId: string): Promise<Record<string, unknown>>;
}

export type TikTokPrivacyLevel =
  | "PUBLIC_TO_EVERYONE"
  | "MUTUAL_FOLLOW_FRIENDS"
  | "FOLLOWER_OF_CREATOR"
  | "SELF_ONLY";

const ACCOUNT_SELECT =
  "id,open_id,union_id,display_name,avatar_url,status,scopes,token_expires_at,refresh_token_expires_at,last_synced_at,created_at,updated_at";

const VIDEO_FIELDS = [
  "id",
  "create_time",
  "cover_image_url",
  "share_url",
  "video_description",
  "duration",
  "height",
  "width",
  "title",
  "embed_link",
  "like_count",
  "comment_count",
  "share_count",
  "view_count",
].join(",");

interface TikTokAccountRow {
  id: string;
  open_id: string;
  union_id: string | null;
  display_name: string;
  avatar_url: string | null;
  status: string;
  scopes: string[] | null;
  token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function accountView(row: TikTokAccountRow) {
  return {
    id: row.id,
    open_id: row.open_id,
    union_id: row.union_id,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    status: row.status,
    scopes: row.scopes || [],
    token_expires_at: row.token_expires_at,
    refresh_token_expires_at: row.refresh_token_expires_at,
    last_synced_at: row.last_synced_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function scopeError(scope: string) {
  return `TIKTOK_PROVIDER_SCOPE_${scope.replace(/[^A-Za-z0-9]+/g, "_").toUpperCase()}_REQUIRED`;
}

function normalizePullUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("TIKTOK_MEDIA_URL_INVALID");
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local")) {
    throw new Error("TIKTOK_MEDIA_URL_INVALID");
  }
  return url.toString();
}

function normalizeSearchText(value: unknown) {
  return typeof value === "string" ? value.toLocaleLowerCase().trim() : "";
}

function videoMatches(video: Record<string, unknown>, query: string) {
  const haystack = [video.title, video.video_description, video.id]
    .map(normalizeSearchText)
    .join("\n");
  return haystack.includes(query);
}

export function createTikTokMcpAdapter(tenantId: string, userId: string): TikTokMcpAdapter {
  const admin = getSupabaseAdmin();

  async function getAccountRow(accountId: string) {
    const { data, error } = await admin
      .from("tiktok_accounts")
      .select(ACCOUNT_SELECT)
      .eq("tenant_id", tenantId)
      .eq("id", accountId)
      .maybeSingle();

    if (error) throw new Error("TIKTOK_ACCOUNT_READ_FAILED");
    return data as TikTokAccountRow | null;
  }

  async function requireAccount(accountId: string) {
    const row = await getAccountRow(accountId);
    if (!row) throw new Error("TIKTOK_ACCOUNT_NOT_FOUND");
    if (row.status !== "active") throw new Error("TIKTOK_ACCOUNT_NOT_ACTIVE");
    return row;
  }

  async function providerAccess(
    accountId: string,
    required: { all?: string[]; any?: string[] } = {},
  ) {
    let row = await requireAccount(accountId);
    const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
    if (expiresAt > 0 && expiresAt <= Date.now() + 60_000) {
      await refreshStoredTikTokAccount({ tenantId, accountId });
      row = await requireAccount(accountId);
    }

    const scopes = row.scopes || [];
    for (const scope of required.all || []) {
      if (!scopes.includes(scope)) throw new Error(scopeError(scope));
    }
    if (required.any?.length && !required.any.some((scope) => scopes.includes(scope))) {
      throw new Error(scopeError(required.any.join("_OR_")));
    }

    const { data: secret, error } = await admin
      .from("tiktok_account_secrets")
      .select("access_token_encrypted")
      .eq("account_id", accountId)
      .maybeSingle();
    if (error || !secret?.access_token_encrypted) {
      throw new Error("TIKTOK_ACCOUNT_SECRET_NOT_FOUND");
    }

    return {
      row,
      accessToken: decryptTikTokSecret(secret.access_token_encrypted),
    };
  }

  async function providerData(
    accountId: string,
    input: {
      path: string;
      method?: "GET" | "POST";
      body?: Record<string, unknown>;
      required?: { all?: string[]; any?: string[] };
    },
  ) {
    const { accessToken } = await providerAccess(accountId, input.required);
    const url = new URL(input.path, "https://open.tiktokapis.com");
    if (url.hostname !== "open.tiktokapis.com") {
      throw new Error("TIKTOK_PROVIDER_HOST_INVALID");
    }

    const response = await fetch(url, {
      method: input.method || "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...(input.method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      body: input.method === "POST" ? JSON.stringify(input.body || {}) : undefined,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`TIKTOK_PROVIDER_HTTP_${response.status}`);

    const root = asRecord(payload);
    const providerError = asRecord(root.error);
    const providerCode = providerError.code;
    if (
      providerCode != null &&
      providerCode !== 0 &&
      providerCode !== "0" &&
      providerCode !== "ok"
    ) {
      throw new Error("TIKTOK_PROVIDER_API_ERROR");
    }
    return asRecord(root.data);
  }

  async function listVideoPage(accountId: string, maxCount: number, cursor?: number) {
    const data = await providerData(accountId, {
      path: `/v2/video/list/?fields=${encodeURIComponent(VIDEO_FIELDS)}`,
      method: "POST",
      body: {
        max_count: maxCount,
        ...(cursor != null ? { cursor } : {}),
      },
      required: { all: ["video.list"] },
    });
    return {
      videos: Array.isArray(data.videos) ? data.videos.map((video) => asRecord(video)) : [],
      cursor: typeof data.cursor === "number" ? data.cursor : null,
      has_more: Boolean(data.has_more),
    };
  }

  return {
    async listAccounts() {
      const { data, error } = await admin
        .from("tiktok_accounts")
        .select(ACCOUNT_SELECT)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });

      if (error) throw new Error("TIKTOK_ACCOUNTS_READ_FAILED");
      return {
        accounts: (data || []).map((row) => accountView(row as TikTokAccountRow)),
        secret_fields_included: false,
      };
    },

    async getAccount(accountId: string) {
      const row = await getAccountRow(accountId);
      return {
        found: Boolean(row),
        account: row ? accountView(row) : null,
        secret_fields_included: false,
      };
    },

    async inspectCapabilities(accountId: string) {
      const row = await requireAccount(accountId);
      const scopes = row.scopes || [];
      return {
        account: accountView(row),
        capabilities: {
          basic_profile: scopes.includes("user.info.basic"),
          extended_profile: scopes.includes("user.info.profile"),
          profile_stats: scopes.includes("user.info.stats"),
          list_and_search_own_videos: scopes.includes("video.list"),
          upload_video_draft: scopes.includes("video.upload"),
          direct_publish_video: scopes.includes("video.publish"),
        },
        provider_scopes: scopes,
        notes: [
          "Search is limited to videos owned by the linked account; this integration does not expose arbitrary global TikTok search.",
          "PULL_FROM_URL publishing requires TikTok to accept the supplied HTTPS media URL under its Content Posting API rules.",
        ],
      };
    },

    async inspectProfile(accountId: string) {
      const row = await requireAccount(accountId);
      const scopes = row.scopes || [];
      if (!scopes.includes("user.info.basic")) {
        throw new Error(scopeError("user.info.basic"));
      }

      const fields = ["open_id", "union_id", "avatar_url", "display_name"];
      if (scopes.includes("user.info.profile")) {
        fields.push("bio_description", "profile_deep_link", "is_verified");
      }
      if (scopes.includes("user.info.stats")) {
        fields.push("follower_count", "following_count", "likes_count", "video_count");
      }

      const data = await providerData(accountId, {
        path: `/v2/user/info/?fields=${encodeURIComponent(fields.join(","))}`,
        required: { all: ["user.info.basic"] },
      });
      return {
        user: asRecord(data.user),
        requested_fields: fields,
        secret_fields_included: false,
      };
    },

    async listVideos(accountId: string, maxCount: number, cursor?: number) {
      return listVideoPage(accountId, maxCount, cursor);
    },

    async searchVideos(accountId: string, query: string, limit: number) {
      const normalized = normalizeSearchText(query);
      if (!normalized) throw new Error("TIKTOK_SEARCH_QUERY_REQUIRED");

      const matches: Record<string, unknown>[] = [];
      let cursor: number | undefined;
      let pages = 0;

      while (matches.length < limit && pages < 5) {
        const page = await listVideoPage(accountId, 20, cursor);
        pages += 1;
        for (const video of page.videos) {
          if (videoMatches(video, normalized)) {
            matches.push(video);
            if (matches.length >= limit) break;
          }
        }
        if (!page.has_more || page.cursor == null) break;
        cursor = page.cursor;
      }

      return {
        query,
        videos: matches,
        count: matches.length,
        pages_scanned: pages,
        search_scope: "linked_account_own_videos",
      };
    },

    async getVideo(accountId: string, videoId: string) {
      const data = await providerData(accountId, {
        path: `/v2/video/query/?fields=${encodeURIComponent(VIDEO_FIELDS)}`,
        method: "POST",
        body: { filters: { video_ids: [videoId] } },
        required: { all: ["video.list"] },
      });
      const videos = Array.isArray(data.videos) ? data.videos.map((video) => asRecord(video)) : [];
      return {
        found: videos.length > 0,
        video: videos[0] || null,
      };
    },

    async creatorInfo(accountId: string) {
      const data = await providerData(accountId, {
        path: "/v2/post/publish/creator_info/query/",
        method: "POST",
        required: { all: ["video.publish"] },
      });
      return {
        creator_info: data,
        secret_fields_included: false,
      };
    },

    async uploadVideoDraft(accountId: string, videoUrl: string) {
      const normalizedUrl = normalizePullUrl(videoUrl);
      const data = await providerData(accountId, {
        path: "/v2/post/publish/inbox/video/init/",
        method: "POST",
        body: {
          source_info: {
            source: "PULL_FROM_URL",
            video_url: normalizedUrl,
          },
        },
        required: { all: ["video.upload"] },
      });
      return {
        accepted: true,
        mode: "draft_upload",
        publish_id: typeof data.publish_id === "string" ? data.publish_id : null,
        provider_data: data,
      };
    },

    async publishVideo(accountId: string, input) {
      const normalizedUrl = normalizePullUrl(input.videoUrl);
      const postInfo: Record<string, unknown> = {
        title: input.title,
        privacy_level: input.privacyLevel,
        disable_comment: input.disableComment,
        disable_duet: input.disableDuet,
        disable_stitch: input.disableStitch,
      };
      if (input.videoCoverTimestampMs != null) {
        postInfo.video_cover_timestamp_ms = input.videoCoverTimestampMs;
      }

      const data = await providerData(accountId, {
        path: "/v2/post/publish/video/init/",
        method: "POST",
        body: {
          post_info: postInfo,
          source_info: {
            source: "PULL_FROM_URL",
            video_url: normalizedUrl,
          },
        },
        required: { all: ["video.publish"] },
      });
      return {
        accepted: true,
        mode: "direct_post",
        publish_id: typeof data.publish_id === "string" ? data.publish_id : null,
        provider_data: data,
      };
    },

    async publishStatus(accountId: string, publishId: string) {
      const data = await providerData(accountId, {
        path: "/v2/post/publish/status/fetch/",
        method: "POST",
        body: { publish_id: publishId },
        required: { any: ["video.publish", "video.upload"] },
      });
      return {
        publish_id: publishId,
        status: data,
      };
    },

    async startLink() {
      const { deviceUrl } = await beginTikTokOAuthTransaction({
        tenantId,
        userId,
        returnTo: "/admin/integrations/tiktok",
      });
      return {
        device_url: deviceUrl,
        expires_in_seconds: 300,
        contains_provider_secret: false,
      };
    },

    async refreshAccount(accountId: string) {
      await refreshStoredTikTokAccount({ tenantId, accountId });
      const row = await getAccountRow(accountId);
      return {
        ok: true,
        account: row ? accountView(row) : null,
        secret_fields_included: false,
      };
    },

    async disconnectAccount(accountId: string) {
      await disconnectStoredTikTokAccount({ tenantId, accountId });
      const row = await getAccountRow(accountId);
      return {
        ok: true,
        account: row ? accountView(row) : null,
        local_tokens_deleted: true,
        provider_authorization_revoked: false,
      };
    },
  };
}
