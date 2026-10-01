type FetchLike = typeof fetch;

const DEFAULT_ACTOR_ID = "s-r/google-lens";
const APIFY_API_ROOT = "https://api.apify.com/v2";
const MAX_RESPONSE_BYTES = 1_000_000;

export type ReverseImageSearchAdapter = {
  search(imageUrl: string, limit: number): Promise<Record<string, unknown>>;
};

function actorId() {
  const value = process.env.APIFY_REVERSE_IMAGE_ACTOR_ID?.trim() || DEFAULT_ACTOR_ID;
  if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error("APIFY_ACTOR_NOT_CONFIGURED");
  }
  return value;
}

function apiToken() {
  const value = process.env.APIFY_API_TOKEN?.trim();
  if (!value) throw new Error("APIFY_API_TOKEN_NOT_CONFIGURED");
  return value;
}

function safeUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function text(value: unknown, max = 500) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function normalizeMatch(value: unknown, rank: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const pageUrl = safeUrl(item.pageUrl ?? item.url ?? item.link ?? item.href);
  if (!pageUrl) return null;
  return {
    rank,
    title: text(item.title ?? item.name),
    url: pageUrl,
    source: text(item.source ?? item.domain ?? item.site),
    thumbnail_url: safeUrl(item.thumbnailUrl ?? item.thumbnail ?? item.imageUrl ?? item.image),
    price: text(item.price, 120),
  };
}

function extractMatches(payload: unknown[], limit: number) {
  const source = payload.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [item];
    const record = item as Record<string, unknown>;
    return Array.isArray(record.matches) ? record.matches : [item];
  });
  return source
    .map((item, index) => normalizeMatch(item, index + 1))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, limit);
}

export function createReverseImageSearchAdapter(
  fetchImpl: FetchLike = fetch,
): ReverseImageSearchAdapter {
  return {
    async search(imageUrl, limit) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      try {
        const actor = actorId().replace("/", "~");
        const response = await fetchImpl(
          `${APIFY_API_ROOT}/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items?clean=true&timeout=120`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image_urls: [imageUrl], language: "en", retries: 2 }),
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error(`APIFY_HTTP_${response.status}`);
        const body = await response.text();
        if (body.length > MAX_RESPONSE_BYTES) throw new Error("APIFY_RESPONSE_TOO_LARGE");
        const payload = JSON.parse(body) as unknown;
        if (!Array.isArray(payload)) throw new Error("APIFY_INVALID_RESPONSE");
        const matches = extractMatches(payload, limit);
        return {
          provider: "apify",
          actor: actorId(),
          image_url: imageUrl,
          matches,
          count: matches.length,
          truncated: matches.length === limit,
          provider_secrets_included: false,
        };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("APIFY_TIMEOUT");
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
