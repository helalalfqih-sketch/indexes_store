import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
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

  return router;
};
