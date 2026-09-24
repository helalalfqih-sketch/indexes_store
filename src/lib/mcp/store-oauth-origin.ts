export const STORE_PRODUCTION_ORIGIN = "https://indexes-store.vercel.app";

/** Trust deployment configuration, never a request Host header. */
export function resolveStoreOAuthOrigin(environment?: string, deploymentHost?: string) {
  if (environment !== "preview") return STORE_PRODUCTION_ORIGIN;
  if (!deploymentHost || !/^[a-z0-9-]+\.vercel\.app$/.test(deploymentHost)) {
    throw new Error("STORE_MCP_OAUTH_NOT_CONFIGURED");
  }
  return `https://${deploymentHost}`;
}
