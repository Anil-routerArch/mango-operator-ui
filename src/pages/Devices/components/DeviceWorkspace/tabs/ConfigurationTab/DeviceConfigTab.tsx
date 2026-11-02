import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { DeviceCard } from '@/pages/Devices/components/common';
import { useDevicesUiStore } from '@/stores/devicesUiStore';
import { MainConfigSubTab } from './MainConfigSubTab';
import { DeviceSpecificConfigSubTab } from './DeviceSpecificConfigSubTab';
import { ComputedConfigSubTab } from './ComputedConfigSubTab';
import { OverridesSubTab } from './OverridesSubTab';
import { NotesSubTab } from './NotesSubTab';
import type { UnifiedFleetDevice, DeviceConfigSubTab } from '@/types/device';

export interface DeviceConfigTabProps {
  device: UnifiedFleetDevice;
}

export const DeviceConfigTab: React.FC<DeviceConfigTabProps> = ({ device }) => {
  const { configSubTab, setConfigSubTab } = useDevicesUiStore();

  const subTabs: Array<{ id: DeviceConfigSubTab; label: string }> = [
    { id: 'main', label: 'Main' },
    { id: 'special', label: 'Device-Specific Configuration' },
    { id: 'computed', label: 'Computed Configuration' },
    { id: 'overrides', label: 'Configuration Overrides' },
    { id: 'notes', label: 'Notes' },
  ];

  const renderActiveSubTab = () => {
    switch (configSubTab) {
      case 'main':
        return <MainConfigSubTab device={device} />;
      case 'special':
        return <DeviceSpecificConfigSubTab device={device} />;
      case 'computed':
        return <ComputedConfigSubTab device={device} />;
      case 'overrides':
        return <OverridesSubTab device={device} />;
      case 'notes':
        return <NotesSubTab device={device} />;
      default:
        return <MainConfigSubTab device={device} />;
    }
  };

  return (
    <DeviceCard p={0}>
      {/* Sub-tab Navigation Header */}
      <Flex
        px={6}
        pt={3}
        borderBottom="1px solid"
        borderColor={themeColors.panel.divider}
        gap={6}
        overflowX="auto"
      >
        {subTabs.map((st) => {
          const isActive = configSubTab === st.id;
          return (
            <Box
              key={st.id}
              as="button"
              pb={3}
              fontSize="13px"
              fontWeight={isActive ? '600' : '500'}
              color={isActive ? themeColors.brand.accent : themeColors.text.secondary}
              borderBottom="2px solid"
              borderColor={isActive ? themeColors.brand.accent : 'transparent'}
              transition="all 0.15s ease"
              _hover={{ color: themeColors.brand.accent }}
              onClick={() => setConfigSubTab(st.id)}
              whiteSpace="nowrap"
            >
              {st.label}
            </Box>
          );
        })}
      </Flex>

      {/* Render Selected SubTab */}
      {renderActiveSubTab()}
    </DeviceCard>
  );
};

export default DeviceConfigTab;

