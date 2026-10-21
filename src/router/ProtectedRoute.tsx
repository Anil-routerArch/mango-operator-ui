import React from 'react';
import { Button, Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useEndpointsStore } from '@/api/endpoints';
import { themeColors } from '@/theme';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isInitialized, logout } = useAuthStore();
  const { isLoaded: isEndpointsLoaded, error: endpointsError, fetchEndpoints } = useEndpointsStore();
  const location = useLocation();

  // 1. If not authenticated after initialization, redirect to login page preserving the attempted URL
  if (isInitialized && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. If endpoint discovery failed completely
  if (isAuthenticated && endpointsError && !isEndpointsLoaded) {
    return (
      <Flex minH="100vh" w="100%" align="center" justify="center" bg={themeColors.canvas.bg} p={4}>
        <VStack gap={4} maxW="450px" textAlign="center">
          <Text fontSize="18px" fontWeight="600" color={themeColors.status.error.text}>
            Unable to Connect to Cloud Services
          </Text>
          <Text fontSize="13px" color={themeColors.text.secondary}>
            {endpointsError}
          </Text>
          <Flex gap={3} mt={2}>
            <Button size="sm" colorScheme="blue" onClick={() => fetchEndpoints()}>
              Retry Connection
            </Button>
            <Button size="sm" variant="outline" onClick={() => logout()}>
              Log Out
            </Button>
          </Flex>
        </VStack>
      </Flex>
    );
  }

  // 3. If still bootstrapping session from storage or discovering cluster endpoints, display clean loading screen
  if (!isInitialized || (isAuthenticated && !isEndpointsLoaded)) {
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

  return <Outlet />;
};

export default ProtectedRoute;
