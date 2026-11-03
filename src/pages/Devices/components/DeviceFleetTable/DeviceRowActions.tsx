import React from 'react';
import { HStack, IconButton } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import type { UnifiedFleetDevice, DeviceWorkspaceTab } from '@/types/device';

export interface DeviceRowActionsProps {
  device: UnifiedFleetDevice;
  onSelect: (serial: string, tab?: DeviceWorkspaceTab) => void;
  onReboot: (serial: string) => void;
  onDelete: (serial: string) => void;
  onWifiScan: (serial: string) => void;
  onSync: (serial: string) => void;
}

export const DeviceRowActions: React.FC<DeviceRowActionsProps> = ({
  device,
  onSelect,
  onReboot,
  onDelete,
  onWifiScan,
  onSync,
}) => {
  const serial = device.serialNumber;
  const isOnline = Boolean(device.connected);

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

      {/* 2. Configure (Slate / Grey) */}
      <IconButton
        aria-label="Edit device configuration"
        size="xs"
        w="26px"
        h="26px"
        minW="26px"
        borderRadius="full"
        bg="#64748b"
        color="#ffffff"
        _hover={{ bg: '#475569', transform: 'scale(1.08)' }}
        transition="all 0.15s ease"
        onClick={() => onSelect(serial, 'configuration')}
        title="Device configuration"
      >
        <Icon name="sliders" size={13} color="#ffffff" />
      </IconButton>

      {/* 3. Sync / Telemetry (Purple) */}
      <IconButton
        aria-label="Sync telemetry and configuration"
        size="xs"
        w="26px"
        h="26px"
        minW="26px"
        borderRadius="full"
        bg="#8b5cf6"
        color="#ffffff"
        _hover={{ bg: '#7c3aed', transform: 'scale(1.08)' }}
        transition="all 0.15s ease"
        onClick={() => onSync(serial)}
        title="Sync device status"
      >
        <Icon name="refresh" size={13} color="#ffffff" />
      </IconButton>

      {/* 4. Power / Reboot (Green) */}
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

      {/* 5. Wi-Fi Scan / Radio (Teal) */}
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

      {/* 6. Diagnostics / Tools (Cyan) */}
      <IconButton
        aria-label="Device diagnostics"
        size="xs"
        w="26px"
        h="26px"
        minW="26px"
        borderRadius="full"
        bg="#06b6d4"
        color="#ffffff"
        _hover={{ bg: '#0891b2', transform: 'scale(1.08)' }}
        transition="all 0.15s ease"
        onClick={() => onSelect(serial, 'overview')}
        title="Diagnostics & health checks"
      >
        <Icon name="wrench" size={13} color="#ffffff" />
      </IconButton>

      {/* 7. View Details (Blue) */}
      <IconButton
        aria-label="View device workspace"
        size="xs"
        w="26px"
        h="26px"
        minW="26px"
        borderRadius="full"
        bg="#3b82f6"
        color="#ffffff"
        _hover={{ bg: '#2563eb', transform: 'scale(1.08)' }}
        transition="all 0.15s ease"
        onClick={() => onSelect(serial, 'overview')}
        title="View device details"
      >
        <Icon name="search" size={13} color="#ffffff" />
      </IconButton>
    </HStack>
  );
};

