import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AppRoutes } from '@/router';

// QueryClient configuration matching OpenWiFi standards
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
});

export const App: React.FC = () => {
  const { initializeAuth } = useAuthStore();

  // Bootstrap session from storage on startup
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
