import React from 'react';
import { Flex, Text, Box } from '@chakra-ui/react';
import { themeColors } from '@/theme';

interface DeviceStatusBadgeProps {
  connected: boolean;
  blacklisted?: boolean;
  size?: 'sm' | 'md';
}

export const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({
  connected,
  blacklisted,
  size = 'md',
}) => {
  if (blacklisted) {
    return (
      <Flex
        align="center"
        gap={1.5}
        px={2.5}
        py={size === 'sm' ? 0.5 : 1}
        borderRadius="full"
        bg="#fee2e2"
        border="1px solid #fecaca"
        color="#b91c1c"
        fontSize={size === 'sm' ? '11px' : '12px'}
        fontWeight="600"
      >
        <Box w="6px" h="6px" borderRadius="full" bg="#dc2626" />
        <Text>Blacklisted</Text>
      </Flex>
    );
  }

  if (connected) {
    return (
      <Flex
        align="center"
        gap={1.5}
        px={2.5}
        py={size === 'sm' ? 0.5 : 1}
        borderRadius="full"
        bg={themeColors.status.active.bg}
        border="1px solid"
        borderColor={themeColors.status.active.border}
        color={themeColors.status.active.text}
        fontSize={size === 'sm' ? '11px' : '12px'}
        fontWeight="600"
      >
        <Box w="6px" h="6px" borderRadius="full" bg="#16a34a" />
        <Text>Online</Text>
      </Flex>
    );
  }

  return (
    <Flex
      align="center"
      gap={1.5}
      px={2.5}
      py={size === 'sm' ? 0.5 : 1}
      borderRadius="full"
      bg="#fef2f2"
      border="1px solid #fecaca"
      color="#dc2626"
      fontSize={size === 'sm' ? '11px' : '12px'}
      fontWeight="600"
    >
      <Box w="6px" h="6px" borderRadius="full" bg="#dc2626" />
      <Text>Offline</Text>
    </Flex>
  );
};

