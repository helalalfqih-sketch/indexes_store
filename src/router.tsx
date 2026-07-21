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
  });

  return router;
};
