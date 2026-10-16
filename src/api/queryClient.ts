import { QueryClient } from '@tanstack/react-query';

// QueryClient configuration matching OpenWiFi standards
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
});

/**
 * Deterministically clears all cached queries and mutations across the application.
 * Called upon logout, session restoration failure, or authentication identity switch
 * to guarantee zero cache retention of permission-sensitive data.
 */
export const clearAuthenticatedQueryCache = (): void => {
  queryClient.clear();
};

