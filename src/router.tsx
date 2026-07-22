import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15 * 60 * 1000, // 15 minutes
        gcTime: 2 * 60 * 60 * 1000, // 2 hours
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        networkMode: "offlineFirst",
        retry: (failureCount, error) => {
          if (failureCount >= 3) return false;
          return true;
        },
      },
      mutations: {
        networkMode: "offlineFirst",
      },
    },
  });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    defaultPreloadStaleTime: 15 * 60 * 1000, // 15 minutes
    defaultStaleTime: 15 * 60 * 1000, // 15 minutes
  });

  // PERF (root-cause fix): dehydrate the react-query cache on the server and
  // hydrate it on the client BEFORE the first render. Without this, every
  // full page load started with an EMPTY client cache → useSuspenseQuery
  // refetched all home queries right after the SSR paint (visible "reload").
  // With it, SSR-fetched products are already in memory when React hydrates.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
