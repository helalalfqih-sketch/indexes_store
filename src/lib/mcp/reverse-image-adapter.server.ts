type FetchLike = typeof fetch;

const DEFAULT_ACTOR_ID = "s-r/google-lens";
const APIFY_API_ROOT = "https://api.apify.com/v2";
const SERPAPI_API_ROOT = "https://serpapi.com/search.json";
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

function providerToken(name: "APIFY_API_TOKEN" | "SERPAPI_API_KEY") {
  return process.env[name]?.trim() || null;
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

function priceText(value: unknown) {
  if (typeof value === "string") return text(value, 120);
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const price = value as Record<string, unknown>;
  return text(price.value ?? price.extracted_value, 120);
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
    price: priceText(item.price),
  };
}

function normalizeMatches(source: unknown[], limit: number) {
  const seen = new Set<string>();
  const matches = [];
  for (const value of source) {
    const match = normalizeMatch(value, matches.length + 1);
    if (!match || seen.has(match.url)) continue;
    seen.add(match.url);
    matches.push(match);
    if (matches.length === limit) break;
  }
  return matches;
}

function extractApifyMatches(payload: unknown[], limit: number) {
  const source = payload.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [item];
    const record = item as Record<string, unknown>;
    return Array.isArray(record.matches) ? record.matches : [item];
  });
  return normalizeMatches(source, limit);
}

function extractSerpApiMatches(payload: Record<string, unknown>, limit: number) {
  const visualMatches = Array.isArray(payload.visual_matches) ? payload.visual_matches : [];
  const organicResults = Array.isArray(payload.organic_results) ? payload.organic_results : [];
  return normalizeMatches([...visualMatches, ...organicResults], limit);
}

async function responsePayload(response: Response, provider: "APIFY" | "SERPAPI") {
  if (!response.ok) throw new Error(`${provider}_HTTP_${response.status}`);
  const body = await response.text();
  if (body.length > MAX_RESPONSE_BYTES) throw new Error(`${provider}_RESPONSE_TOO_LARGE`);
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error(`${provider}_INVALID_RESPONSE`);
  }
}

function providerErrorCode(error: unknown, provider: "APIFY" | "SERPAPI") {
  if (error instanceof Error && error.name === "AbortError") return `${provider}_TIMEOUT`;
  const message = error instanceof Error ? error.message : "";
  return new RegExp(`^${provider}_[A-Z0-9_]{2,80}$`).test(message)
    ? message
    : `${provider}_UNAVAILABLE`;
}

async function searchSerpApi(
  fetchImpl: FetchLike,
  apiKey: string,
  imageUrl: string,
  limit: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const endpoint = new URL(SERPAPI_API_ROOT);
    endpoint.searchParams.set("engine", "google_lens");
    endpoint.searchParams.set("url", imageUrl);
    endpoint.searchParams.set("hl", "en");
    endpoint.searchParams.set("api_key", apiKey);
    const response = await fetchImpl(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const payload = await responsePayload(response, "SERPAPI");
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("SERPAPI_INVALID_RESPONSE");
    }
    const record = payload as Record<string, unknown>;
    if (typeof record.error === "string") throw new Error("SERPAPI_ERROR");
    const metadata =
      record.search_metadata && typeof record.search_metadata === "object"
        ? (record.search_metadata as Record<string, unknown>)
        : null;
    if (metadata?.status === "Error") throw new Error("SERPAPI_ERROR");
    const matches = extractSerpApiMatches(record, limit);
    return {
      provider: "serpapi",
      engine: "google_lens",
      image_url: imageUrl,
      matches,
      count: matches.length,
      truncated: matches.length === limit,
      provider_secrets_included: false,
    };
  } catch (error) {
    throw new Error(providerErrorCode(error, "SERPAPI"));
  } finally {
    clearTimeout(timeout);
  }
}

async function searchApify(
  fetchImpl: FetchLike,
  apiToken: string,
  imageUrl: string,
  limit: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const actor = actorId().replace("/", "~");
    const response = await fetchImpl(
      `${APIFY_API_ROOT}/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items?clean=true&timeout=120`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_urls: [imageUrl], language: "en", retries: 2 }),
        signal: controller.signal,
      },
    );
    const payload = await responsePayload(response, "APIFY");
    if (!Array.isArray(payload)) throw new Error("APIFY_INVALID_RESPONSE");
    const matches = extractApifyMatches(payload, limit);
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
    throw new Error(providerErrorCode(error, "APIFY"));
  } finally {
    clearTimeout(timeout);
  }
}

export function createReverseImageSearchAdapter(
  fetchImpl: FetchLike = fetch,
): ReverseImageSearchAdapter {
  return {
    async search(imageUrl, limit) {
      const serpApiKey = providerToken("SERPAPI_API_KEY");
      const apifyApiToken = providerToken("APIFY_API_TOKEN");
      if (!serpApiKey && !apifyApiToken) {
        throw new Error("REVERSE_IMAGE_PROVIDER_NOT_CONFIGURED");
      }

      if (serpApiKey) {
        try {
          return await searchSerpApi(fetchImpl, serpApiKey, imageUrl, limit);
        } catch (error) {
          if (!apifyApiToken) throw error;
          const fallbackReason = providerErrorCode(error, "SERPAPI");
          try {
            return {
              ...(await searchApify(fetchImpl, apifyApiToken, imageUrl, limit)),
              fallback_from: "serpapi",
              fallback_reason: fallbackReason,
            };
          } catch {
            throw new Error("REVERSE_IMAGE_PROVIDERS_UNAVAILABLE");
          }
        }
      }

      return searchApify(fetchImpl, apifyApiToken as string, imageUrl, limit);
    },
  };
}
