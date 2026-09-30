import { createFileRoute } from "@tanstack/react-router";
import { resolveTikTokDeviceAuthorization } from "@/lib/tiktok.server";

function redirect(location: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });
}

export const Route = createFileRoute("/api/tiktok/device")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        if (!code) {
          return redirect("/admin/integrations/tiktok?tiktok=error&reason=device_code_missing");
        }

        try {
          const authorizationUrl = await resolveTikTokDeviceAuthorization(code);
          return redirect(authorizationUrl);
        } catch {
          return redirect("/admin/integrations/tiktok?tiktok=error&reason=device_code_invalid");
        }
      },
    },
  },
});
