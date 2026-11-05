import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { DeviceStatusBadge, DeviceHealthBadge } from '../common';
import { DeviceActionConfirmModal } from '../common/DeviceActionConfirmModal';
import { DeviceQuickConfigModal } from './modals/DeviceQuickConfigModal';
import { DeviceWifiScanModal } from './modals/DeviceWifiScanModal';
import { DeviceFactoryResetModal } from './modals/DeviceFactoryResetModal';
import { DeviceFirmwareUpgradeModal } from './modals/DeviceFirmwareUpgradeModal';
import { DeviceEventQueueModal } from './modals/DeviceEventQueueModal';
import { DeviceTraceModal } from './modals/DeviceTraceModal';
import { DeviceTelemetryModal } from './modals/DeviceTelemetryModal';
import { DeviceScriptModal } from './modals/DeviceScriptModal';
import { DeviceReEnrollModal } from './modals/DeviceReEnrollModal';
import { DeviceExportStatsModal } from './modals/DeviceExportStatsModal';
import { useDevicesUiStore } from '@/stores/devicesUiStore';
import {
  useRebootDevice,
  useBlinkDeviceLeds,
  useDeleteDeviceFromFleet,
  useLaunchRttySession,
} from '@/api/devices';
import { getApiErrorMessage } from '@/api/errors';
import { toaster } from '@/components/ui/toaster';
import { type UnifiedFleetDevice, normalizePlatformDeviceType } from '@/types/device';

export interface DeviceHeaderProps {
  device: UnifiedFleetDevice;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const DeviceHeader: React.FC<DeviceHeaderProps> = ({
  device,
  onRefresh,
  isLoading = false,
}) => {
  const { clearSelectedDevice } = useDevicesUiStore();
  const [isRebootOpen, setIsRebootOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isWifiScanOpen, setIsWifiScanOpen] = useState(false);
  const [isFactoryResetOpen, setIsFactoryResetOpen] = useState(false);
  const [isFirmwareOpen, setIsFirmwareOpen] = useState(false);
  const [isEventQueueOpen, setIsEventQueueOpen] = useState(false);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isScriptOpen, setIsScriptOpen] = useState(false);
  const [isReEnrollOpen, setIsReEnrollOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const rebootMutation = useRebootDevice();
  const blinkMutation = useBlinkDeviceLeds();
  const deleteMutation = useDeleteDeviceFromFleet();
  const rttyMutation = useLaunchRttySession();

  const isConnected = !!device.connected;
  const displayName = device.name || device.serialNumber;
  const platformType = normalizePlatformDeviceType(device.deviceType, device.deviceGroup, undefined, device.model).toUpperCase();
  const hardwareDesc = `${platformType} · ${device.manufacturer || device.model || 'Universal AP'}`;

  // Close actions menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreOpen]);

  // Format last contact or last seen
  const formatLastSeen = () => {
    if (!device.lastContact) return 'Never';
    const secondsAgo = Math.floor(Date.now() / 1000) - device.lastContact;
    if (secondsAgo < 60) return `${Math.max(1, secondsAgo)}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} min ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  const handleReboot = async () => {
    try {
      await rebootMutation.mutateAsync({ serialNumber: device.serialNumber });
      toaster.create({
        title: 'Reboot Scheduled',
        description: `Reboot command sent to device ${device.serialNumber}`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Reboot Failed',
        description: getApiErrorMessage(err, 'Failed to send reboot command'),
        type: 'error',
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleteOpen(false);
    try {
      await deleteMutation.mutateAsync(device.serialNumber);
      toaster.create({
        title: 'Device Deleted',
        description: `Device ${device.serialNumber} removed from inventory`,
        type: 'success',
      });
      clearSelectedDevice();
    } catch (err: unknown) {
      toaster.create({
        title: 'Delete Failed',
        description: getApiErrorMessage(err, 'Failed to delete device'),
        type: 'error',
      });
    }
  };

  const handleLaunchRtty = async () => {
    try {
      const res = await rttyMutation.mutateAsync({ serialNumber: device.serialNumber });
      if (res && res.server && res.viewport && res.connectionId) {
        const url = `https://${res.server}:${res.viewport}/connect/${res.connectionId}`;
        window.open(url, '_blank')?.focus();
        toaster.create({
          title: 'Terminal Connected',
          description: `Connected to device ${device.serialNumber} via RTTY`,
          type: 'success',
        });
      } else {
        toaster.create({
          title: 'Terminal / RTTY Launched',
          description: `Terminal connection requested for ${device.serialNumber}`,
          type: 'info',
        });
      }
    } catch (err: unknown) {
      toaster.create({
        title: 'Terminal Launch Failed',
        description: getApiErrorMessage(err, 'Unable to initiate RTTY session (device may be offline)'),
        type: 'error',
      });
    }
  };

  const handleBlink = async () => {
    try {
      await blinkMutation.mutateAsync({ serialNumber: device.serialNumber, duration: 30 });
      toaster.create({
        title: 'LEDs Blinking',
        description: `LED blink command sent for 30s to ${device.serialNumber}`,
        type: 'info',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Blink Command Failed',
        description: getApiErrorMessage(err, 'Failed to blink LEDs'),
        type: 'error',
      });
    }
  };



  return (
    <Box mb={5}>
      {/* Main Header Row */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
        {/* Left: Device Name, Status Badges, Subtitle */}
        <Box>
          <HStack gap={3} align="center">
            <Text fontSize="24px" fontWeight="700" color={themeColors.text.title} lineHeight="1.2">
              {displayName}
            </Text>
            <DeviceStatusBadge connected={isConnected} />
            {device.sanity !== undefined && (
              <DeviceHealthBadge sanity={device.sanity} connected={isConnected} />
            )}
          </HStack>

          <Text fontSize="13px" color={themeColors.text.muted} mt={1}>
            {hardwareDesc} · Last seen {formatLastSeen()}
          </Text>
        </Box>

        {/* Right: Icon-only Action Capsule matching OpenWiFi Gateway */}
        <Box
          bg="#ffffff"
          border="1px solid #e2e8f0"
          borderRadius="12px"
          p="4px 6px"
          boxShadow="0 1px 3px rgba(0,0,0,0.05)"
        >
          <HStack gap={1.5} align="center">
            {/* 1. Delete (Red) */}
            <IconButton
              size="sm"
              w="32px"
              h="32px"
              minW="32px"
              borderRadius="8px"
              bg="#e11d48"
              color="#ffffff"
              _hover={{ bg: '#be123c', transform: 'scale(1.05)' }}
              transition="all 0.15s ease"
              title="Delete Device"
              aria-label="Delete Device"
              onClick={() => setIsDeleteOpen(true)}
              p={0}
            >
              <Icon name="trash" size={16} color="#ffffff" />
            </IconButton>

            {/* 2. Connect / Terminal (Dark Grey) */}
            <IconButton
              size="sm"
              w="32px"
              h="32px"
              minW="32px"
              borderRadius="8px"
              bg="#64748b"
              color="#ffffff"
              _hover={{ bg: '#475569', transform: 'scale(1.05)' }}
              transition="all 0.15s ease"
              title="Connect (Terminal / RTTY)"
              aria-label="Connect (Terminal / RTTY)"
              onClick={handleLaunchRtty}
              loading={rttyMutation.isPending}
              p={0}
            >
              <Icon name="terminal" size={16} color="#ffffff" />
            </IconButton>

            {/* 3. Wi-Fi Scan (Teal) */}
            <IconButton
              size="sm"
              w="32px"
              h="32px"
              minW="32px"
              borderRadius="8px"
              bg="#0d9488"
              color="#ffffff"
              _hover={{ bg: '#0f766e', transform: 'scale(1.05)' }}
              transition="all 0.15s ease"
              title="Wi-Fi Radio Scan"
              aria-label="Wi-Fi Radio Scan"
              onClick={() => setIsWifiScanOpen(true)}
              p={0}
            >
              <Icon name="wifi" size={16} color="#ffffff" />
            </IconButton>

            {/* 4. Power / Reboot (Green) */}
            <IconButton
              size="sm"
              w="32px"
              h="32px"
              minW="32px"
              borderRadius="8px"
              bg={isConnected ? '#22c55e' : '#cbd5e1'}
              color="#ffffff"
              _hover={isConnected ? { bg: '#16a34a', transform: 'scale(1.05)' } : undefined}
              transition="all 0.15s ease"
              disabled={!isConnected || rebootMutation.isPending}
              cursor={isConnected ? 'pointer' : 'not-allowed'}
              title={isConnected ? 'Reboot' : 'Device is offline'}
              aria-label="Reboot"
              onClick={() => isConnected && setIsRebootOpen(true)}
              p={0}
            >
              <Icon name="power" size={16} color="#ffffff" />
            </IconButton>

            {/* 5. Configure (Purple) */}
            <IconButton
              size="sm"
              w="32px"
              h="32px"
              minW="32px"
              borderRadius="8px"
              bg="#8b5cf6"
              color="#ffffff"
              _hover={{ bg: '#7c3aed', transform: 'scale(1.05)' }}
              transition="all 0.15s ease"
              title="Configure"
              aria-label="Configure"
              onClick={() => setIsConfigOpen(true)}
              p={0}
            >
              <Icon name="barcode" size={16} color="#ffffff" />
            </IconButton>

            {/* 6. Commands / Actions (Light / Dark Outlined Wrench) */}
            <Box position="relative" ref={menuRef}>
              <IconButton
                size="sm"
                w="32px"
                h="32px"
                minW="32px"
                borderRadius="8px"
                bg="#f8fafc"
                border="1.5px solid #0f172a"
                color="#0f172a"
                _hover={{ bg: '#e2e8f0', transform: 'scale(1.05)' }}
                transition="all 0.15s ease"
                title="Commands & Actions"
                aria-label="Commands & Actions"
                onClick={() => setMoreOpen(!moreOpen)}
                p={0}
              >
                <Icon name="wrench" size={16} color="#0f172a" />
              </IconButton>

              {/* Action Dropdown Menu matching OWGW */}
              {moreOpen && (
                <Box
                  position="absolute"
                  right="0"
                  top="100%"
                  mt={1.5}
                  w="240px"
                  maxH="380px"
                  overflowY="auto"
                  bg="#ffffff"
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  borderRadius="8px"
                  boxShadow="0 12px 30px rgba(0,0,0,0.18)"
                  py={1}
                  zIndex="1300"
                >
                  {/* 1. Blink LEDs */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      handleBlink();
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="radio" size={15} />
                      <Text>Blink LEDs (30s)</Text>
                    </HStack>
                  </Box>

                  {/* 2. Configure */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsConfigOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="barcode" size={15} />
                      <Text>Configure</Text>
                    </HStack>
                  </Box>

                  {/* 3. Connect (Terminal / RTTY) */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      handleLaunchRtty();
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="terminal" size={15} />
                      <Text>Connect (Terminal / RTTY)</Text>
                    </HStack>
                  </Box>

                  {/* 4. Event Queue */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsEventQueueOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="list" size={15} />
                      <Text>Event Queue</Text>
                    </HStack>
                  </Box>

                  {/* 5. Factory Reset */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsFactoryResetOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="alertTriangle" size={15} color="#e11d48" />
                      <Text>Factory Reset</Text>
                    </HStack>
                  </Box>

                  {/* 6. Firmware Upgrade */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsFirmwareOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="arrowUp" size={15} />
                      <Text>Firmware Upgrade</Text>
                    </HStack>
                  </Box>

                  {/* 7. Reboot */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsRebootOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="power" size={15} />
                      <Text>Reboot</Text>
                    </HStack>
                  </Box>

                  {/* 8. Re-Enroll Device */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsReEnrollOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="key" size={15} />
                      <Text>Re-Enroll Device</Text>
                    </HStack>
                  </Box>

                  {/* 9. Telemetry */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsTelemetryOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="activity" size={15} />
                      <Text>Telemetry Stream</Text>
                    </HStack>
                  </Box>

                  {/* 10. Run Script */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsScriptOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="code" size={15} />
                      <Text>Run Script</Text>
                    </HStack>
                  </Box>

                  {/* 11. Network Packet Trace */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsTraceOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="network" size={15} />
                      <Text>Network Packet Trace</Text>
                    </HStack>
                  </Box>

                  {/* 12. Wi-Fi Radio Scan */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsWifiScanOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="wifi" size={15} />
                      <Text>Wi-Fi Radio Scan</Text>
                    </HStack>
                  </Box>

                  {/* 13. Export Statistics */}
                  <Box
                    px={3}
                    py={2}
                    fontSize="13px"
                    cursor="pointer"
                    color={themeColors.text.primary}
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => {
                      setIsExportOpen(true);
                      setMoreOpen(false);
                    }}
                  >
                    <HStack gap={2.5}>
                      <Icon name="download" size={15} />
                      <Text>Export Statistics</Text>
                    </HStack>
                  </Box>
                </Box>
              )}
            </Box>

            {/* 7. Refresh (Blue) */}
            <IconButton
              size="sm"
              w="32px"
              h="32px"
              minW="32px"
              borderRadius="8px"
              bg="#3b82f6"
              color="#ffffff"
              _hover={{ bg: '#2563eb', transform: 'scale(1.05)' }}
              transition="all 0.15s ease"
              title="Refresh"
              aria-label="Refresh"
              onClick={onRefresh}
              disabled={isLoading}
              p={0}
            >
              {isLoading ? (
                <Spinner size="xs" color="#ffffff" />
              ) : (
                <Icon name="refresh" size={16} color="#ffffff" />
              )}
            </IconButton>
          </HStack>
        </Box>
      </Flex>

      {/* Confirmation Modal for Reboot */}
      <DeviceActionConfirmModal
        isOpen={isRebootOpen}
        onClose={() => setIsRebootOpen(false)}
        onConfirm={handleReboot}
        title="Reboot Device"
        description={`Are you sure you want to reboot ${displayName} (${device.serialNumber})? All active client connections will be temporarily dropped.`}
        confirmLabel="Reboot Now"
        confirmVariant="danger"
        icon="power"
      />

      {/* Confirmation Modal for Delete */}
      <DeviceActionConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Device"
        description={`Are you sure you want to permanently delete ${displayName} (${device.serialNumber}) from the network?`}
        confirmLabel="Delete Device"
        confirmVariant="danger"
        icon="trash"
      />

      {/* Quick Configure Modal */}
      <DeviceQuickConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        serialNumber={device.serialNumber}
        device={device}
      />

      {/* Wi-Fi Radio Scan Modal */}
      <DeviceWifiScanModal
        isOpen={isWifiScanOpen}
        onClose={() => setIsWifiScanOpen(false)}
        serialNumber={device.serialNumber}
      />

      {/* Factory Reset Modal */}
      <DeviceFactoryResetModal
        isOpen={isFactoryResetOpen}
        onClose={() => setIsFactoryResetOpen(false)}
        serialNumber={device.serialNumber}
      />

      {/* Firmware Upgrade Modal */}
      <DeviceFirmwareUpgradeModal
        isOpen={isFirmwareOpen}
        onClose={() => setIsFirmwareOpen(false)}
        device={device}
      />

      {/* Event Queue Modal */}
      <DeviceEventQueueModal
        isOpen={isEventQueueOpen}
        onClose={() => setIsEventQueueOpen(false)}
        device={device}
      />

      {/* Network Packet Trace Modal */}
      <DeviceTraceModal
        isOpen={isTraceOpen}
        onClose={() => setIsTraceOpen(false)}
        device={device}
      />

      {/* Live Telemetry Modal */}
      <DeviceTelemetryModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        device={device}
      />

      {/* Run Script Modal */}
      <DeviceScriptModal
        isOpen={isScriptOpen}
        onClose={() => setIsScriptOpen(false)}
        device={device}
      />

      {/* Re-Enroll Modal */}
      <DeviceReEnrollModal
        isOpen={isReEnrollOpen}
        onClose={() => setIsReEnrollOpen(false)}
        device={device}
      />

      {/* Export Statistics & Data Modal */}
      <DeviceExportStatsModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        device={device}
      />
    </Box>
  );
};

export default DeviceHeader;
