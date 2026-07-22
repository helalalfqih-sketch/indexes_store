import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        networkMode: "offlineFirst",
        retry: (failureCount, error) => {
          // Retry up to 3 times for network issues
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
    defaultPreloadStaleTime: 10000,
    // PERF: route loaders stay fresh for 5 minutes — Home → Cart → Home never
    // re-runs loaders (instant back-navigation, no pending flash). Data
    // freshness is still guaranteed by react-query background refetching.
    defaultStaleTime: 5 * 60 * 1000,
  });

  // PERF (root-cause fix): dehydrate the react-query cache on the server and
  // hydrate it on the client BEFORE the first render. Without this, every
  // full page load started with an EMPTY client cache → useSuspenseQuery
  // refetched all home queries right after the SSR paint (visible "reload").
  // With it, SSR-fetched products are already in memory when React hydrates.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
