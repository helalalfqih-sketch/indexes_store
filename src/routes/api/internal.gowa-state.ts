import { createFileRoute } from "@tanstack/react-router";

import {
  createGowaStateDownloadGrant,
  createGowaStateUploadGrant,
  verifyGowaStateAuthorization,
} from "@/lib/gowa-state.server";

function noStoreJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function unauthorized() {
  return noStoreJson({ error: "Unauthorized" }, 401);
}

export const Route = createFileRoute("/api/internal/gowa-state")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!verifyGowaStateAuthorization(request)) return unauthorized();

        try {
          return noStoreJson(await createGowaStateDownloadGrant());
        } catch {
          return noStoreJson({ error: "State storage unavailable" }, 503);
        }
      },
      POST: async ({ request }) => {
        if (!verifyGowaStateAuthorization(request)) return unauthorized();

        try {
          return noStoreJson(await createGowaStateUploadGrant());
        } catch {
          return noStoreJson({ error: "State storage unavailable" }, 503);
        }
      },
    },
  },
});
