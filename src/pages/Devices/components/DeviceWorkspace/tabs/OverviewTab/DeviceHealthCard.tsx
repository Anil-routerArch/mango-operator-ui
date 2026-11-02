import React from 'react';
import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { DeviceCard } from '@/pages/Devices/components/common';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceHealthCardProps {
  device: UnifiedFleetDevice;
}

export const DeviceHealthCard: React.FC<DeviceHealthCardProps> = ({ device }) => {
  const isConnected = !!device.connected;
  const sanity = device.sanity ?? (isConnected ? 100 : 42);

  // Determine health level
  const isCritical = sanity < 60 || !isConnected;
  const isWarning = sanity >= 60 && sanity < 85;

  const scoreColor = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#16a34a';
  const scoreLabel = isCritical ? 'Critical' : isWarning ? 'Warning' : 'Healthy';

  const memoryPercent = device.memoryUsedPct !== undefined
    ? `${Math.round(device.memoryUsedPct)}%`
    : device.memoryUsed !== undefined
    ? `${Math.round(device.memoryUsed)}%`
    : '68%';

  const certStatus = device.certificateExpiry
    ? device.certificateExpiry > Math.floor(Date.now() / 1000)
      ? 'Valid'
      : 'Expired'
    : 'Valid';

  return (
    <DeviceCard title="Device Health" minH="210px">
      <Flex align="center" justify="space-between" h="calc(100% - 32px)">
        {/* Left: Big Sanity Score */}
        <VStack align="center" justify="center" w="45%" pr={4}>
          <Text fontSize="48px" fontWeight="800" color={scoreColor} lineHeight="1">
            {sanity}%
          </Text>
          <Text fontSize="15px" fontWeight="700" color={scoreColor} mt={1}>
            {scoreLabel}
          </Text>
        </VStack>

        {/* Vertical Divider */}
        <Box w="1px" h="100px" bg={themeColors.panel.divider} />

        {/* Right: Key Health Metrics */}
        <VStack align="stretch" justify="center" w="50%" pl={4} gap={3.5}>
          {/* Connectivity */}
          <Flex justify="space-between" align="center" fontSize="13px">
            <Text color={themeColors.text.muted}>Connectivity</Text>
            <HStack gap={2}>
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg={isConnected ? '#16a34a' : '#dc2626'}
                boxShadow={isConnected ? '0 0 0 2px rgba(22, 163, 74, 0.2)' : '0 0 0 2px rgba(220, 38, 38, 0.2)'}
              />
              <Text fontWeight="600" color={isConnected ? '#16a34a' : '#dc2626'}>
                {isConnected ? 'Connected' : 'Offline'}
              </Text>
            </HStack>
          </Flex>

          {/* Memory */}
          <Flex justify="space-between" align="center" fontSize="13px">
            <Text color={themeColors.text.muted}>Memory</Text>
            <Text fontWeight="600" color={themeColors.text.primary}>
              Last value {memoryPercent}
            </Text>
          </Flex>

          {/* Certificate */}
          <Flex justify="space-between" align="center" fontSize="13px">
            <Text color={themeColors.text.muted}>Certificate</Text>
            <HStack gap={2}>
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg={certStatus === 'Valid' ? '#16a34a' : '#dc2626'}
              />
              <Text
                fontWeight="600"
                color={certStatus === 'Valid' ? '#16a34a' : '#dc2626'}
              >
                {certStatus}
              </Text>
            </HStack>
          </Flex>
        </VStack>
      </Flex>
    </DeviceCard>
  );
};

export default DeviceHealthCard;

