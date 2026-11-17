import React, { useEffect, useRef, useState } from 'react';
import { Box, HStack, IconButton, Portal, Text } from '@chakra-ui/react';
import { Icon, type IconName } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { UnifiedFleetDevice } from '@/types/device';

export type FleetDeviceMenuAction =
  | 'blink'
  | 'configure'
  | 'rtty'
  | 'eventQueue'
  | 'factoryReset'
  | 'firmwareUpgrade'
  | 'reboot'
  | 'reEnroll'
  | 'telemetry'
  | 'script'
  | 'trace'
  | 'wifiScan'
  | 'exportStats';

export interface DeviceRowActionsProps {
  device: UnifiedFleetDevice;
  onReboot: (serial: string) => void;
  onDelete: (serial: string) => void;
  onWifiScan: (serial: string) => void;
  onApplyProvisionedConfig: (serial: string) => void;
  onMenuAction: (device: UnifiedFleetDevice, action: FleetDeviceMenuAction) => void;
}

export const DeviceRowActions: React.FC<DeviceRowActionsProps> = ({
  device,
  onReboot,
  onDelete,
  onWifiScan,
  onApplyProvisionedConfig,
  onMenuAction,
}) => {
  const serial = device.serialNumber;
  const isOnline = Boolean(device.connected);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const actionsButtonRef = useRef<HTMLButtonElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const toggleActions = () => {
    if (actionsOpen) {
      setActionsOpen(false);
      return;
    }
    const rect = actionsButtonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 220;
      const estimatedMenuHeight = 380;
      const gap = 6;
      const left = Math.max(12, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12));
      const top =
        rect.bottom + gap + estimatedMenuHeight <= window.innerHeight
          ? rect.bottom + gap
          : Math.max(12, rect.top - estimatedMenuHeight - gap);
      setMenuPosition({ top, left });
    }
    setActionsOpen(true);
  };

  useEffect(() => {
    if (!actionsOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        actionsRef.current &&
        !actionsRef.current.contains(target) &&
        !actionsMenuRef.current?.contains(target)
      ) {
        setActionsOpen(false);
      }
    };
    const handleViewportChange = () => setActionsOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [actionsOpen]);

  return (
    <HStack gap={1} justify="center" onClick={(e) => e.stopPropagation()}>
      {/* 1. Delete (Red) */}
      <IconButton
        aria-label="Delete device"
        size="xs"
        w="26px"
        h="26px"
        minW="26px"
        borderRadius="full"
        bg="#ef4444"
        color="#ffffff"
        _hover={{ bg: '#dc2626', transform: 'scale(1.08)' }}
        transition="all 0.15s ease"
        onClick={() => onDelete(serial)}
        title="Delete device"
      >
        <Icon name="trash" size={13} color="#ffffff" />
      </IconButton>

      {/* 2. Apply the compiled OWPROV configuration (Purple) */}
      <IconButton
        aria-label="Apply provisioned configuration"
        size="xs"
        w="26px"
        h="26px"
        minW="26px"
        borderRadius="full"
        bg="#8b5cf6"
        color="#ffffff"
        _hover={{ bg: '#7c3aed', transform: 'scale(1.08)' }}
        transition="all 0.15s ease"
        onClick={() => onApplyProvisionedConfig(serial)}
        title="Apply provisioned configuration"
      >
        <Icon name="send" size={13} color="#ffffff" />
      </IconButton>

      {/* 3. Power / Reboot (Green) */}
      <IconButton
        aria-label="Reboot device"
        size="xs"
        w="26px"
        h="26px"
        minW="26px"
        borderRadius="full"
        bg={isOnline ? '#22c55e' : '#cbd5e1'}
        color="#ffffff"
        _hover={isOnline ? { bg: '#16a34a', transform: 'scale(1.08)' } : undefined}
        disabled={!isOnline}
        transition="all 0.15s ease"
        onClick={() => isOnline && onReboot(serial)}
        title={isOnline ? 'Reboot device' : 'Device is offline'}
      >
        <Icon name="power" size={13} color="#ffffff" />
      </IconButton>

      {/* 4. Wi-Fi Scan / Radio (Teal) */}
      <IconButton
        aria-label="Wi-Fi scan"
        size="xs"
        w="26px"
        h="26px"
        minW="26px"
        borderRadius="full"
        bg={isOnline ? '#14b8a6' : '#cbd5e1'}
        color="#ffffff"
        _hover={isOnline ? { bg: '#0d9488', transform: 'scale(1.08)' } : undefined}
        disabled={!isOnline}
        transition="all 0.15s ease"
        onClick={() => isOnline && onWifiScan(serial)}
        title={isOnline ? 'Wi-Fi scan' : 'Device is offline'}
      >
        <Icon name="radio" size={13} color="#ffffff" />
      </IconButton>

      {/* 5. Commands / Actions menu */}
      <Box position="relative" ref={actionsRef}>
        <IconButton
          ref={actionsButtonRef}
          aria-label="Commands and actions"
          size="xs"
          w="26px"
          h="26px"
          minW="26px"
          borderRadius="full"
          bg="#f8fafc"
          border="1.5px solid #0f172a"
          color="#0f172a"
          _hover={{ bg: '#e2e8f0', transform: 'scale(1.08)' }}
          transition="all 0.15s ease"
          onClick={toggleActions}
          title="Commands & Actions"
        >
          <Icon name="wrench" size={13} color="#0f172a" />
        </IconButton>

        {actionsOpen && (
          <Portal>
            <Box
              ref={actionsMenuRef}
              position="fixed"
              top={`${menuPosition.top}px`}
              left={`${menuPosition.left}px`}
              w="220px"
              bg="#ffffff"
              border="1px solid"
              borderColor={themeColors.panel.border}
              borderRadius="8px"
              boxShadow="0 12px 30px rgba(0,0,0,0.18)"
              py={1}
              maxH="380px"
              overflowY="auto"
              zIndex={10000}
              textAlign="left"
            >
              {([
                ['blink', 'radio', 'Blink LEDs (30s)'],
                ['configure', 'barcode', 'Configure'],
                ['rtty', 'terminal', 'Connect (Terminal / RTTY)'],
                ['eventQueue', 'list', 'Event Queue'],
                ['factoryReset', 'alertTriangle', 'Factory Reset'],
                ['firmwareUpgrade', 'arrowUp', 'Firmware Upgrade'],
                ['reboot', 'power', 'Reboot'],
                ['reEnroll', 'key', 'Re-Enroll Device'],
                ['telemetry', 'activity', 'Telemetry Stream'],
                ['script', 'code', 'Run Script'],
                ['trace', 'network', 'Network Packet Trace'],
                ['wifiScan', 'wifi', 'Wi-Fi Radio Scan'],
                ['exportStats', 'download', 'Export Statistics'],
              ] as Array<[FleetDeviceMenuAction, IconName, string]>).map(([action, icon, label]) => (
                <FleetActionMenuItem
                  key={action}
                  icon={icon}
                  label={label}
                  danger={action === 'factoryReset'}
                  onClick={() => {
                    onMenuAction(device, action);
                    setActionsOpen(false);
                  }}
                />
              ))}
            </Box>
          </Portal>
        )}
      </Box>
    </HStack>
  );
};

interface FleetActionMenuItemProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

const FleetActionMenuItem: React.FC<FleetActionMenuItemProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  danger = false,
}) => (
  <Box
    px={3}
    py={2}
    fontSize="13px"
    cursor={disabled ? 'not-allowed' : 'pointer'}
    color={danger ? '#dc2626' : themeColors.text.primary}
    opacity={disabled ? 0.45 : 1}
    _hover={disabled ? undefined : { bg: '#f1f5f9' }}
    onClick={disabled ? undefined : onClick}
  >
    <HStack gap={2.5}>
      <Icon name={icon} size={15} />
      <Text>{label}</Text>
    </HStack>
  </Box>
);

