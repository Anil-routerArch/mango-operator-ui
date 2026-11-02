import React from 'react';
import { Box, SimpleGrid, VStack } from '@chakra-ui/react';
import { DeviceStatusCard } from './DeviceStatusCard';
import { DeviceDetailsCard } from './DeviceDetailsCard';
import { DeviceStatisticsCard } from './DeviceStatisticsCard';
import { DeviceWifiAnalysisCard } from './DeviceWifiAnalysisCard';
import { DeviceCommandsLogsCard } from './DeviceCommandsLogsCard';
import { DeviceNotesCard } from './DeviceNotesCard';
import { DeviceAttentionConditionsCard } from './DeviceAttentionConditionsCard';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceOverviewTabProps {
  device: UnifiedFleetDevice;
}

export const DeviceOverviewTab: React.FC<DeviceOverviewTabProps> = ({ device }) => {
  // Check if there are active critical conditions to show derived attention card
  const hasAttention =
    !device.connected ||
    (device.memoryUsedPct !== undefined && device.memoryUsedPct > 85) ||
    (typeof device.load === 'number' && device.load > 1.5) ||
    (device.sanity !== undefined && device.sanity < 70);

  return (
    <VStack align="stretch" gap={5}>
      {/* Derived Feature: Attention Banner if device is degraded/offline */}
      {hasAttention && (
        <Box>
          <DeviceAttentionConditionsCard device={device} />
        </Box>
      )}

      {/* Main 2-Column Grid matching OpenWiFi OWGW Architecture */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={5} alignItems="start">
        {/* Left Column: Status -> Statistics -> Commands & Logs */}
        <VStack align="stretch" gap={5}>
          <DeviceStatusCard device={device} />
          <DeviceStatisticsCard device={device} />
          <DeviceCommandsLogsCard device={device} />
        </VStack>

        {/* Right Column: Details -> Wi-Fi Analysis -> Notes */}
        <VStack align="stretch" gap={5}>
          <DeviceDetailsCard device={device} />
          <DeviceWifiAnalysisCard device={device} />
          <DeviceNotesCard device={device} />
        </VStack>
      </SimpleGrid>
    </VStack>
  );
};

export default DeviceOverviewTab;

