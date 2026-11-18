import React from 'react';
import { Flex, Text } from '@chakra-ui/react';

interface DeviceHealthBadgeProps {
  sanity?: number;
  connected?: boolean;
  size?: 'sm' | 'md';
}

export const DeviceHealthBadge: React.FC<DeviceHealthBadgeProps> = ({
  sanity = 0,
  connected = true,
  size = 'md',
}) => {
  if (!connected) {
    return (
      <Flex
        align="center"
        px={2}
        py={size === 'sm' ? 0.5 : 1}
        borderRadius="md"
        bg="#fef2f2"
        border="1px solid #fee2e2"
        color="#dc2626"
        fontSize={size === 'sm' ? '11px' : '12px'}
        fontWeight="700"
      >
        <Text>{sanity > 0 ? `${sanity}% Critical` : 'Critical'}</Text>
      </Flex>
    );
  }

  let bg = '#f0fbf2';
  let border = '#a6ddb1';
  let text = '#167930';
  let label = `${sanity}%`;

  if (sanity < 70) {
    bg = '#fef2f2';
    border = '#fee2e2';
    text = '#dc2626';
    label = `${sanity}% Critical`;
  } else if (sanity < 90) {
    bg = '#fefce8';
    border = '#fef08a';
    text = '#a16207';
    label = `${sanity}% Warning`;
  }

  return (
    <Flex
      align="center"
      px={2}
      py={size === 'sm' ? 0.5 : 1}
      borderRadius="md"
      bg={bg}
      border="1px solid"
      borderColor={border}
      color={text}
      fontSize={size === 'sm' ? '11px' : '12px'}
      fontWeight="700"
    >
      <Text>{label}</Text>
    </Flex>
  );
};

