import React from 'react';
import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { DeviceCard } from '@/pages/Devices/components/common';
import { useDevicesUiStore } from '@/stores/devicesUiStore';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceRecentActivityCardProps {
  device: UnifiedFleetDevice;
}

export const DeviceRecentActivityCard: React.FC<DeviceRecentActivityCardProps> = ({ device }) => {
  const { setWorkspaceTab } = useDevicesUiStore();
  const isConnected = !!device.connected;

  const activities = [
    {
      id: 'act-1',
      event: isConnected ? 'Health check passed' : 'Health check failed',
      timeAgo: isConnected ? '2 min ago' : '8 min ago',
      status: isConnected ? 'Success' : 'Failed',
      statusColor: isConnected ? '#16a34a' : '#dc2626',
      statusBg: isConnected ? '#f0fdf4' : '#fef2f2',
      dotColor: isConnected ? '#16a34a' : '#dc2626',
    },
    {
      id: 'act-2',
      event: 'Heartbeat received',
      timeAgo: isConnected ? '30s ago' : '9 min ago',
      status: 'Success',
      statusColor: '#16a34a',
      statusBg: '#f0fdf4',
      dotColor: '#16a34a',
    },
    {
      id: 'act-3',
      event: 'Configuration applied',
      timeAgo: '2h ago',
      status: 'Applied',
      statusColor: '#0284c7',
      statusBg: '#f0f9ff',
      dotColor: '#0284c7',
    },
  ];

  return (
    <DeviceCard title="Recent Activity" minH="190px">
      <VStack align="stretch" gap={2.5}>
        {activities.map((a) => (
          <Flex
            key={a.id}
            justify="space-between"
            align="center"
            fontSize="13px"
            p="6px 8px"
            borderRadius="6px"
            _hover={{ bg: '#f8fafc' }}
          >
            <HStack gap={3}>
              <Box w="8px" h="8px" borderRadius="full" bg={a.dotColor} flexShrink={0} />
              <Text fontWeight="600" color={themeColors.text.primary}>
                {a.event}
              </Text>
            </HStack>

            <HStack gap={4}>
              <Text color={themeColors.text.muted} fontSize="12px">
                {a.timeAgo}
              </Text>
              <Box
                fontSize="11px"
                fontWeight="700"
                color={a.statusColor}
                bg={a.statusBg}
                px={2.5}
                py={0.5}
                borderRadius="4px"
              >
                {a.status}
              </Box>
            </HStack>
          </Flex>
        ))}

        {/* View all activity link */}
        <Box pt={2}>
          <Text
            as="button"
            fontSize="13px"
            fontWeight="600"
            color={themeColors.brand.accent}
            _hover={{ textDecoration: 'underline' }}
            onClick={() => setWorkspaceTab('activity')}
          >
            View all activity →
          </Text>
        </Box>
      </VStack>
    </DeviceCard>
  );
};

export default DeviceRecentActivityCard;

