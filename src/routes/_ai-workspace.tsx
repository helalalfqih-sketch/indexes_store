/**
 * _ai-workspace.tsx — Pathless Fullscreen Layout for AI Developer
 *
 * This is a PATHLESS layout route (prefixed with _).
 * It renders children WITHOUT mounting AdminShell, the admin sidebar,
 * the commerce navigation, or any other admin chrome.
 *
 * Routes nested under this layout use the real URL paths from their
 * filenames (e.g. _ai-workspace.admin.ai-developer.tsx → /admin/ai-developer).
 *
 * Auth guard: Same as admin.tsx but without AdminShell component.
 */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/auth.functions";

export const Route = createFileRoute("/_ai-workspace")({
  beforeLoad: async ({ location }) => {
    try {
      const user = await getSessionUser();
      if (!user || !user.id) {
        throw redirect({
          to: "/auth",
          search: { next: location.pathname },
        });
      }
    } catch (e: any) {
      if (e?.to || e?.isRedirect) throw e;
      throw redirect({
        to: "/auth",
        search: { next: location.pathname },
      });
    }
  },
  component: AIWorkspaceLayout,
});

function AIWorkspaceLayout() {
  // Bare outlet — no sidebar, no header, no admin chrome
  return <Outlet />;
}
