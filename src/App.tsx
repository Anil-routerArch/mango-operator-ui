import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AppRoutes } from '@/router';
import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/api';

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
        <Toaster />
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
