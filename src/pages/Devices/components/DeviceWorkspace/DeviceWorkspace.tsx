import React from 'react';
import { Box, Button, Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { DeviceHeader } from './DeviceHeader';
import { DeviceOverviewTab } from './tabs/OverviewTab';
import { DeviceConfigTab } from './tabs/ConfigurationTab';
import { DeviceActivityTab } from './tabs/ActivityTab';
import { useDevicesUiStore } from '@/stores/devicesUiStore';
import { useDeviceOverview } from '@/api/devices';
import type { DeviceWorkspaceTab, UnifiedFleetDevice } from '@/types/device';

export interface DeviceWorkspaceProps {
  serialNumber: string;
}

export const DeviceWorkspace: React.FC<DeviceWorkspaceProps> = ({ serialNumber }) => {
  const { workspaceTab, setWorkspaceTab, clearSelectedDevice } = useDevicesUiStore();

  const { data: device, isLoading, refetch, isFetching } = useDeviceOverview(serialNumber);

  const tabs: Array<{ id: DeviceWorkspaceTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'activity', label: 'Activity' },
  ];

  if (isLoading && !device) {
    return (
      <Flex justify="center" align="center" minH="400px" direction="column" gap={3}>
        <Spinner size="lg" color={themeColors.brand.accent} />
        <Text fontSize="14px" color={themeColors.text.muted}>
          Loading device {serialNumber} telemetry...
        </Text>
      </Flex>
    );
  }

  if (!device) {
    return (
      <Flex justify="center" align="center" minH="400px" direction="column" gap={4} p={6}>
        <Box color="#dc2626">
          <Icon name="alertTriangle" size={40} />
        </Box>
        <VStack gap={1} textAlign="center">
          <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
            Device Not Found
          </Text>
          <Text fontSize="13px" color={themeColors.text.secondary}>
            No inventory or gateway records were found for device{' '}
            <Text as="span" fontFamily="monospace" fontWeight="600">
              {serialNumber}
            </Text>
            .
          </Text>
        </VStack>
        <Button size="sm" variant="outline" onClick={clearSelectedDevice} gap={1.5}>
          <Icon name="chevronLeft" size={14} />
          Back to Device Fleet
        </Button>
      </Flex>
    );
  }

  const activeDevice: UnifiedFleetDevice = device;

  const renderActiveTab = () => {
    switch (workspaceTab) {
      case 'overview':
        return <DeviceOverviewTab device={activeDevice} />;
      case 'configuration':
        return <DeviceConfigTab device={activeDevice} />;
      case 'activity':
        return <DeviceActivityTab device={activeDevice} />;
      default:
        return <DeviceOverviewTab device={activeDevice} />;
    }
  };

  return (
    <Box>
      {/* Device Workspace Top Header */}
      <DeviceHeader
        device={activeDevice}
        onRefresh={() => refetch()}
        isLoading={isFetching}
      />

      {/* Master Tabs Navigation Bar matching Figma visual mockup */}
      <Box mb={6} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <Flex gap={8} overflowX="auto">
          {tabs.map((tab) => {
            const isActive = workspaceTab === tab.id;
            return (
              <Box
                key={tab.id}
                as="button"
                pb={3}
                fontSize="14px"
                fontWeight={isActive ? '700' : '500'}
                color={isActive ? themeColors.brand.accent : themeColors.text.secondary}
                borderBottom="2px solid"
                borderColor={isActive ? themeColors.brand.accent : 'transparent'}
                transition="all 0.15s ease"
                _hover={{ color: themeColors.brand.accent }}
                onClick={() => setWorkspaceTab(tab.id)}
                whiteSpace="nowrap"
              >
                {tab.label}
              </Box>
            );
          })}
        </Flex>
      </Box>

      {/* Render Selected Master Workspace Tab */}
      <Box>{renderActiveTab()}</Box>
    </Box>
  );
};

export default DeviceWorkspace;

