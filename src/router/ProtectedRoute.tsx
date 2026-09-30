import React from 'react';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { themeColors } from '@/theme';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  // If still bootstrapping session from storage, display clean loading screen
  if (!isInitialized) {
    return (
      <Flex minH="100vh" w="100%" align="center" justify="center" bg={themeColors.canvas.bg}>
        <VStack gap={3}>
          <Spinner size="lg" color={themeColors.brand.primary} />
          <Text fontSize="13px" color={themeColors.text.secondary}>
            Loading Mango Cloud...
          </Text>
        </VStack>
      </Flex>
    );
  }

  // If not authenticated, redirect to login page preserving the attempted URL
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
