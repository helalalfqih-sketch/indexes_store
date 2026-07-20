import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "cross-origin-resource-policy": "cross-origin",
};

export const Route = createFileRoute("/api/public/image-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const source = new URL(request.url).searchParams.get("url") ?? "";
        
        try {
          const url = new URL(source);
          if (url.protocol !== "https:") {
            return new Response("Invalid image URL protocol", { status: 400, headers: CORS_HEADERS });
          }
        } catch {
          return new Response("Invalid image URL format", { status: 400, headers: CORS_HEADERS });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8_000);
        try {
          const upstream = await fetch(source, {
            signal: controller.signal,
            headers: { accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
          });
          if (!upstream.ok || !upstream.body) {
            return new Response("Image not available", { 
              status: upstream.status || 502,
              headers: CORS_HEADERS
            });
          }

          const contentType = upstream.headers.get("content-type") || "image/jpeg";
          if (!contentType.startsWith("image/")) {
            return new Response("Unsupported media type", { status: 415, headers: CORS_HEADERS });
          }

          return new Response(upstream.body, {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              "content-type": contentType,
              "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
            },
          });
        } catch (err) {
          console.error("Image proxy request failed for URL:", source, err);
          return new Response("Image proxy failed: " + (err instanceof Error ? err.message : String(err)), { 
            status: 502,
            headers: CORS_HEADERS
          });
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  },
});