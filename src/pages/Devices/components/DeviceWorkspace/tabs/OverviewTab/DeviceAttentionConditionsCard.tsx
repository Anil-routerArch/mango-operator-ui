import React from 'react';
import { Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { DeviceCard } from '@/pages/Devices/components/common';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceAttentionConditionsCardProps {
  device: UnifiedFleetDevice;
}

export const DeviceAttentionConditionsCard: React.FC<DeviceAttentionConditionsCardProps> = ({ device }) => {
  const isConnected = !!device.connected;

  const conditions = [
    {
      id: 'connectivity',
      label: isConnected ? 'Connectivity active' : 'Connectivity lost',
      detail: isConnected ? 'Heartbeat steady' : 'Detected 8 min ago',
      severity: isConnected ? ('success' as const) : ('error' as const),
    },
    {
      id: 'telemetry',
      label: isConnected ? 'Telemetry streaming' : 'Telemetry is stale',
      detail: isConnected ? 'Live interval 30s' : 'Last update 8 min ago',
      severity: isConnected ? ('success' as const) : ('warning' as const),
    },
    {
      id: 'certificate',
      label: 'Certificate valid',
      detail: 'Expires in 196 days',
      severity: 'success' as const,
    },
  ];

  const renderIcon = (severity: 'error' | 'warning' | 'success') => {
    switch (severity) {
      case 'error':
        return (
          <Flex
            w="22px"
            h="22px"
            borderRadius="full"
            bg="#fee2e2"
            color="#dc2626"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </Flex>
        );
      case 'warning':
        return (
          <Flex
            w="22px"
            h="22px"
            borderRadius="full"
            bg="#fef3c7"
            color="#d97706"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </Flex>
        );
      case 'success':
        return (
          <Flex
            w="22px"
            h="22px"
            borderRadius="full"
            bg="#dcfce7"
            color="#16a34a"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </Flex>
        );
    }
  };

  return (
    <DeviceCard title="Attention Conditions" minH="190px">
      <VStack align="stretch" gap={3}>
        {conditions.map((c) => (
          <Flex
            key={c.id}
            justify="space-between"
            align="center"
            fontSize="13px"
            p="6px 8px"
            borderRadius="6px"
            _hover={{ bg: '#f8fafc' }}
          >
            <HStack gap={2.5}>
              {renderIcon(c.severity)}
              <Text fontWeight="600" color={themeColors.text.primary}>
                {c.label}
              </Text>
            </HStack>
            <Text color={themeColors.text.muted} fontSize="12px">
              {c.detail}
            </Text>
          </Flex>
        ))}
      </VStack>
    </DeviceCard>
  );
};

export default DeviceAttentionConditionsCard;

