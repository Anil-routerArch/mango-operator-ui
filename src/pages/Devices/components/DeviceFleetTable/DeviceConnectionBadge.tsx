import React from 'react';
import { Box } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';

export interface DeviceConnectionBadgeProps {
  connected: boolean;
  deviceType?: string;
  restricted?: boolean;
  simulated?: boolean;
  size?: number;
}

export const DeviceConnectionBadge: React.FC<DeviceConnectionBadgeProps> = ({
  connected,
  deviceType = 'ap',
  restricted = false,
  simulated = false,
  size = 30,
}) => {
  const isOnline = Boolean(connected);
  const type = (deviceType || 'ap').toLowerCase();
  const isSwitch = type.includes('switch');

  const titleText = isOnline
    ? `Online - Connected to Gateway${restricted ? ' (Restricted)' : ''}${simulated ? ' (Simulated)' : ''}`
    : `Offline - Disconnected${restricted ? ' (Restricted)' : ''}`;

  return (
    <Box
      position="relative"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w={`${size}px`}
      h={`${size}px`}
      title={titleText}
      cursor="pointer"
    >
      {/* Outer circular badge container */}
      <Box
        w={`${size}px`}
        h={`${size}px`}
        borderRadius="full"
        border="2px solid"
        borderColor={isOnline ? '#22c55e' : '#ef4444'}
        bg={isOnline ? '#f0fdf4' : '#fef2f2'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow={
          isOnline
            ? '0 0 0 2px rgba(34, 197, 94, 0.15)'
            : '0 0 0 2px rgba(239, 68, 68, 0.12)'
        }
        transition="all 0.2s ease"
        _hover={{
          transform: 'scale(1.06)',
          boxShadow: isOnline
            ? '0 0 0 4px rgba(34, 197, 94, 0.25)'
            : '0 0 0 4px rgba(239, 68, 68, 0.2)',
        }}
      >
        {/* Device hardware / connection icon */}
        {isSwitch ? (
          // Switch Icon
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isOnline ? '#16a34a' : '#94a3b8'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="7" width="20" height="10" rx="2" />
            <path d="M6 11h.01M10 11h.01M14 11h.01M18 11h.01" />
            <path d="M6 14h.01M10 14h.01M14 14h.01M18 14h.01" />
          </svg>
        ) : isOnline ? (
          // Dedicated Online Access Point / Wireless Beacon Icon
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#15803d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="14" width="20" height="7" rx="2" />
            <path d="M6 14V7" />
            <path d="M18 14V7" />
            <circle cx="6" cy="17.5" r="1" fill="#15803d" />
            <circle cx="10" cy="17.5" r="1" fill="#15803d" />
            <circle cx="14" cy="17.5" r="1" fill="#15803d" />
            {/* Active wireless broadcast wave arcs */}
            <path d="M9 5a4 4 0 0 1 6 0" />
            <path d="M7 2a8 8 0 0 1 10 0" />
          </svg>
        ) : (
          // Dedicated Offline Access Point Icon (Muted)
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="14" width="20" height="7" rx="2" />
            <path d="M6 14V8" />
            <path d="M18 14V8" />
            <circle cx="6" cy="17.5" r="1" fill="#94a3b8" />
            <circle cx="10" cy="17.5" r="1" fill="#94a3b8" />
            <circle cx="14" cy="17.5" r="1" fill="#94a3b8" />
            {/* Disconnected slash */}
            <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" strokeWidth="2.2" />
          </svg>
        )}
      </Box>

      {/* Bottom-right Corner Status Dot */}
      <Box
        position="absolute"
        bottom="-1px"
        right="-1px"
        w="9px"
        h="9px"
        borderRadius="full"
        bg={isOnline ? '#22c55e' : '#ef4444'}
        border="1.5px solid #ffffff"
        boxShadow={
          isOnline
            ? '0 0 4px rgba(34, 197, 94, 0.8)'
            : '0 0 3px rgba(239, 68, 68, 0.6)'
        }
      />

      {/* Top-left Corner Lock Overlay (if restricted) */}
      {restricted && (
        <Box
          position="absolute"
          top="-3px"
          left="-3px"
          bg="#ffffff"
          borderRadius="full"
          p="1px"
          border="1px solid #cbd5e1"
          boxShadow="0 1px 2px rgba(0,0,0,0.15)"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon name="lock" size={9} color="#475569" />
        </Box>
      )}
    </Box>
  );
};

