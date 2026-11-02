import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Center,
  HStack,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useConfigureDeviceDirect, useDeviceRecord } from '@/api/devices';
import { toaster } from '@/components/ui/toaster';
import { ConfigurationSectionsCard } from '@/pages/Configuration/components/ConfigurationSectionsCard';
import type { ConfigurationSectionsState } from '@/pages/Configuration/components/ConfigurationSectionsCard/types';
import type { PlatformType } from '@/pages/Configuration/types/configuration';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceQuickConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  serialNumber: string;
  device?: UnifiedFleetDevice;
}

export const DeviceQuickConfigModal: React.FC<DeviceQuickConfigModalProps> = ({
  isOpen,
  onClose,
  serialNumber,
  device,
}) => {
  const { data: deviceRecord, isFetching: isFetchingDevice } = useDeviceRecord(serialNumber);
  const configureMutation = useConfigureDeviceDirect();

  // Determine platform type (olg, switch, ap) based on device metadata
  const platform: PlatformType = useMemo(() => {
    const t = (device?.deviceType || '').toLowerCase();
    const m = (device?.model || '').toLowerCase();
    const c = (device?.compatible || '').toLowerCase();
    if (t === 'olg' || t === 'gateway' || m.includes('olg') || c.includes('olg')) return 'olg';
    if (t === 'switch' || m.includes('switch') || m.includes('ecs') || c.includes('switch')) return 'switch';
    return 'ap';
  }, [device]);

  // Extract initial JSON string from device record or device prop
  const initialJson = useMemo(() => {
    if (deviceRecord?.configuration && typeof deviceRecord.configuration === 'object') {
      try {
        return JSON.stringify(deviceRecord.configuration, null, 2);
      } catch {
        // fallback
      }
    }
    if (device?.configuration && typeof device.configuration === 'object') {
      try {
        return JSON.stringify(device.configuration, null, 2);
      } catch {
        // fallback
      }
    }
    return '';
  }, [deviceRecord, device]);

  const [currentJson, setCurrentJson] = useState(initialJson);

  useEffect(() => {
    if (initialJson) {
      setCurrentJson(initialJson);
    }
  }, [initialJson]);

  if (!isOpen) return null;

  const handleStateChange = (_state: ConfigurationSectionsState, compiled: string) => {
    setCurrentJson(compiled);
  };

  const handlePush = async () => {
    try {
      let configObj: Record<string, unknown> = {};
      if (currentJson && currentJson.trim()) {
        configObj = JSON.parse(currentJson);
      }

      // Preserve uuid from original configuration if available
      const origConfig = (deviceRecord?.configuration || device?.configuration) as
        | Record<string, unknown>
        | undefined;
      if (origConfig?.uuid && !configObj.uuid) {
        configObj.uuid = origConfig.uuid;
      }

      await configureMutation.mutateAsync({
        serialNumber,
        configuration: configObj,
      });

      toaster.create({
        title: 'Configuration Pushed',
        description: `Configuration successfully dispatched to device ${serialNumber}`,
        type: 'success',
      });
      onClose();
    } catch (err: unknown) {
      toaster.create({
        title: 'Configuration Push Failed',
        description: err instanceof Error ? err.message : 'Failed to push configuration to device',
        type: 'error',
      });
    }
  };

  // Header buttons rendered inside ConfigurationSectionsCard matching screenshot
  const extraRightButtons = (
    <HStack gap={1.5} ml={1}>
      {/* Push Configuration Button (Teal Paper Plane Tilt) */}
      <Box
        as="button"
        w="28px"
        h="28px"
        borderRadius="50%"
        bg="#0d9488"
        color="#ffffff"
        display="grid"
        placeItems="center"
        cursor={configureMutation.isPending ? 'not-allowed' : 'pointer'}
        _hover={{ bg: '#0f766e', transform: 'scale(1.05)' }}
        transition="all 0.15s ease"
        onClick={handlePush}
        title="Push Configuration to Device"
      >
        {configureMutation.isPending ? (
          <Spinner size="xs" color="#ffffff" />
        ) : (
          <Icon name="send" size={14} />
        )}
      </Box>

      {/* Close Button */}
      <Box
        as="button"
        w="28px"
        h="28px"
        borderRadius="4px"
        bg="#ffffff"
        border="1px solid #cbd5e1"
        color={themeColors.text.muted}
        display="grid"
        placeItems="center"
        cursor="pointer"
        _hover={{ bg: '#f1f5f9' }}
        onClick={onClose}
        title="Close"
      >
        <Icon name="x" size={14} />
      </Box>
    </HStack>
  );

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1200"
      p={4}
    >
      <Box
        w="min(1100px, 96vw)"
        maxH="90vh"
        bg="#ffffff"
        borderRadius="12px"
        boxShadow="0 25px 60px rgba(0,0,0,0.35)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        border="1px solid"
        borderColor={themeColors.panel.border}
      >
        {isFetchingDevice && !initialJson ? (
          <Center py={24} flexDirection="column" gap={3}>
            <Spinner size="xl" color="#8b5cf6" />
            <Text fontSize="14px" fontWeight="600" color={themeColors.text.title}>
              Loading Device Configuration...
            </Text>
            <Text fontSize="12px" color={themeColors.text.muted}>
              Retrieving active configuration profile for {serialNumber}
            </Text>
          </Center>
        ) : (
          <Box flex="1" overflowY="auto">
            <ConfigurationSectionsCard
              platform={platform}
              initialJson={initialJson}
              onStateChange={handleStateChange}
              title="Configure"
              showWarningBanner={true}
              extraRightButtons={extraRightButtons}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DeviceQuickConfigModal;
