import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
export const AvailabilityDot: React.FC<{ state: string }> = ({ state }) => {
  const color = state === 'online' ? '#16a34a' : state === 'offline' ? '#dc2626' : '#94a3b8';
  return (
    <Flex align="center" gap={2}>
      <Box w="8px" h="8px" borderRadius="50%" bg={color} />
      <Text fontSize="12px" textTransform="capitalize">{state}</Text>
    </Flex>
  );
};
