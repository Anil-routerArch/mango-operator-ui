import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { Header } from '@/layout/Header';
import { themeColors } from '@/theme';
import { useDevicesUiStore } from '@/stores/devicesUiStore';
import {
  DeviceFleetTable,
  DeviceDashboardTab,
  DeviceBlacklistTab,
  DeviceWorkspace,
} from './components';
import type { DevicesMainTab } from '@/types/device';

export const DevicesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    selectedSerialNumber,
    selectDevice,
    clearSelectedDevice,
    mainTab,
    setMainTab,
  } = useDevicesUiStore();

  // Sync state with URL search params on mount & changes (URL is source of truth)
  useEffect(() => {
    const serialParam = searchParams.get('serial');
    const rawTab = searchParams.get('tab');
    const targetTab: DevicesMainTab =
      rawTab === 'dashboard' || rawTab === 'blacklist' ? rawTab : 'all';

    const currentStore = useDevicesUiStore.getState();

    if (serialParam) {
      if (serialParam !== currentStore.selectedSerialNumber) {
        selectDevice(serialParam);
      }
    } else {
      // If there is no serial in the URL, clear selected device so back button works reliably!
      if (currentStore.selectedSerialNumber !== null) {
        clearSelectedDevice();
      }
    }

    if (targetTab !== currentStore.mainTab) {
      setMainTab(targetTab);
    }
  }, [searchParams, selectDevice, clearSelectedDevice, setMainTab]);

  // When a device is selected, show the Device Workspace
  if (selectedSerialNumber) {
    return (
      <Box p={6}>
        <DeviceWorkspace serialNumber={selectedSerialNumber} />
      </Box>
    );
  }

  // Fleet View with 3 main tabs: All Devices, Dashboard, Blacklist
  const tabs: Array<{ id: DevicesMainTab; label: string }> = [
    { id: 'all', label: 'All Devices' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'blacklist', label: 'Blacklist' },
  ];

  const handleTabChange = (tabId: DevicesMainTab) => {
    setMainTab(tabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tabId === 'all') {
        next.delete('tab');
      } else {
        next.set('tab', tabId);
      }
      return next;
    });
  };

  return (
    <Box p={6}>
      <Header
        title="Devices"
        subtitle="Manage access points, switches, gateway devices, and security blacklists."
      />

      {/* Main Tabs Navigation Bar */}
      <Box mb={6} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <Flex gap={8}>
          {tabs.map((tab) => {
            const isActive = mainTab === tab.id;
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
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </Box>
            );
          })}
        </Flex>
      </Box>

      {/* Render Main Tab Content */}
      <Box>
        {mainTab === 'all' && <DeviceFleetTable />}
        {mainTab === 'dashboard' && <DeviceDashboardTab />}
        {mainTab === 'blacklist' && <DeviceBlacklistTab />}
      </Box>
    </Box>
  );
};

export default DevicesPage;
