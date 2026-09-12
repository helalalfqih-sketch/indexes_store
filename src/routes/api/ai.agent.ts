import { createFileRoute } from "@tanstack/react-router";

/**
 * The repository-backed engineering agent is intentionally unavailable over
 * the public HTTP surface. Keep the route as a fail-closed tombstone so stale
 * clients cannot reach the model, privileged database client, or tool registry.
 *
 * The GPT editor UI and the internal agent implementation remain in the
 * project. A future authenticated endpoint must derive both the user role and
 * tenant on the server before it can replace this handler.
 */
export function disabledAiAgentResponse(): Response {
  return Response.json(
    { error: "Not found" },
    {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export const Route = createFileRoute("/api/ai/agent")({
  server: {
    handlers: {
      POST: disabledAiAgentResponse,
    },
  },
});
