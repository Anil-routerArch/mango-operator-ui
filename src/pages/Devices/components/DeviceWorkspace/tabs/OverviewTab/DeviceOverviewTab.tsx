import React from 'react';
import { SimpleGrid, VStack } from '@chakra-ui/react';
import { DeviceStatusCard } from './DeviceStatusCard';
import { DeviceDetailsCard } from './DeviceDetailsCard';
import { DeviceStatisticsCard } from './DeviceStatisticsCard';
import { DeviceWifiAnalysisCard } from './DeviceWifiAnalysisCard';
import { DeviceCommandsLogsCard } from './DeviceCommandsLogsCard';
import { DeviceNotesCard } from './DeviceNotesCard';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceOverviewTabProps {
  device: UnifiedFleetDevice;
}

export const DeviceOverviewTab: React.FC<DeviceOverviewTabProps> = ({ device }) => {
  return (
    <VStack align="stretch" gap={5}>
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

