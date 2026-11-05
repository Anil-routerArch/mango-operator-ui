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
  const [isExecuting, setIsExecuting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (initialJson) {
      setCurrentJson(initialJson);
    }
  }, [initialJson]);

  // Real-time elapsed timer tracking live device command execution
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isExecuting) {
      const startTime = Date.now();
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isExecuting]);

  if (!isOpen) return null;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStateChange = (_state: ConfigurationSectionsState, compiled: string) => {
    setCurrentJson(compiled);
  };

  const handlePush = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    const startTime = Date.now();
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

      const finalElapsed = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      toaster.create({
        title: 'Configuration Applied',
        description: `Configuration successfully acknowledged and applied by device ${serialNumber} in ${finalElapsed}s`,
        type: 'success',
      });
      onClose();
    } catch (err: unknown) {
      const finalElapsed = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      toaster.create({
        title: 'Configuration Push Failed',
        description:
          err instanceof Error
            ? `${err.message} (after ${finalElapsed}s)`
            : `Failed to push configuration to device after ${finalElapsed}s`,
        type: 'error',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Header buttons rendered inside ConfigurationSectionsCard matching screenshot
  const extraRightButtons = (
    <HStack gap={1.5} ml={1}>
      {/* Live timer badge while executing */}
      {isExecuting && (
        <HStack
          gap={1.5}
          px={2}
          py={0.5}
          borderRadius="full"
          bg="#f0fdf4"
          border="1px solid #86efac"
          color="#15803d"
        >
          <Spinner size="xs" color="#16a34a" />
          <Text fontSize="11px" fontWeight="700" fontFamily="mono">
            {elapsedSeconds}s
          </Text>
        </HStack>
      )}

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
        cursor={isExecuting ? 'not-allowed' : 'pointer'}
        opacity={isExecuting ? 0.8 : 1}
        _hover={isExecuting ? {} : { bg: '#0f766e', transform: 'scale(1.05)' }}
        transition="all 0.15s ease"
        onClick={handlePush}
        title={isExecuting ? `Applying configuration... (${elapsedSeconds}s elapsed)` : 'Push Configuration to Device'}
      >
        {isExecuting ? (
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
        cursor={isExecuting ? 'not-allowed' : 'pointer'}
        opacity={isExecuting ? 0.4 : 1}
        _hover={isExecuting ? {} : { bg: '#f1f5f9' }}
        onClick={isExecuting ? undefined : onClose}
        title={isExecuting ? 'Configuration in progress — please wait' : 'Close'}
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
      onClick={isExecuting ? undefined : onClose}
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prominent Live Execution Banner */}
        {isExecuting && (
          <Box
            bg="#f0fdf4"
            borderBottom="1px solid #bbf7d0"
            px={5}
            py={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexShrink={0}
          >
            <HStack gap={3}>
              <Spinner size="sm" color="#16a34a" />
              <Box>
                <HStack gap={2}>
                  <Text fontSize="13px" fontWeight="700" color="#15803d">
                    Applying configuration to device {serialNumber}...
                  </Text>
                  <Box
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    bg="#dcfce7"
                    color="#166534"
                    fontSize="11px"
                    fontWeight="600"
                  >
                    Live Command Active
                  </Box>
                </HStack>
                <Text fontSize="12px" color="#166534" mt={0.5}>
                  The physical device is receiving parameters, validating changes, and restarting services. Please wait.
                </Text>
              </Box>
            </HStack>

            <HStack gap={2} bg="#ffffff" px={3} py={1.5} borderRadius="md" border="1px solid #86efac" boxShadow="sm">
              <Icon name="clock" size={14} color="#16a34a" />
              <Text fontSize="11px" fontWeight="600" color="#166534">
                Elapsed:
              </Text>
              <Text fontSize="14px" fontWeight="700" fontFamily="mono" color="#15803d">
                {formatTimer(elapsedSeconds)}
              </Text>
            </HStack>
          </Box>
        )}

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
