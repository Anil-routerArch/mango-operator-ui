import React from 'react';
import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { useDevicesUiStore } from '@/stores/devicesUiStore';

export interface DeviceOfflineBannerProps {
  lastContact?: number;
}

export const DeviceOfflineBanner: React.FC<DeviceOfflineBannerProps> = ({ lastContact }) => {
  const { setWorkspaceTab } = useDevicesUiStore();

  const getDowntimeMinutes = () => {
    if (!lastContact) return 8; // Default fallback
    const secondsAgo = Math.floor(Date.now() / 1000) - lastContact;
    return Math.max(1, Math.floor(secondsAgo / 60));
  };

  const minutes = getDowntimeMinutes();

  return (
    <Box
      mb={6}
      p="14px 20px"
      bg="#fff5f5"
      border="1px solid #fecaca"
      borderRadius="10px"
      boxShadow="0 1px 3px rgba(220, 38, 38, 0.05)"
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <HStack gap={3}>
          <Flex
            w="28px"
            h="28px"
            borderRadius="full"
            bg="#fee2e2"
            color="#dc2626"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon name="alertTriangle" size={16} />
          </Flex>
          <Box>
            <Text fontSize="14px" fontWeight="700" color="#991b1b">
              Device is offline
            </Text>
            <Text fontSize="13px" color="#b91c1c" mt={0.5}>
              No heartbeat received for {minutes} minute{minutes !== 1 ? 's' : ''}. Live telemetry may be stale.
            </Text>
          </Box>
        </HStack>

        <Button
          size="sm"
          variant="outline"
          borderColor="#fca5a5"
          bg="#ffffff"
          color="#b91c1c"
          _hover={{ bg: '#fee2e2', borderColor: '#f87171' }}
          onClick={() => setWorkspaceTab('diagnostics')}
          fontSize="13px"
          fontWeight="600"
          px={4}
        >
          Open Diagnostics
        </Button>
      </Flex>
    </Box>
  );
};

export default DeviceOfflineBanner;

