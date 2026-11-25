import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Icon, type IconName } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

export const PropertyMetricCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: IconName;
  tone?: string;
  helper?: string;
}> = ({ label, value, icon, tone = '#2563eb', helper }) => (
  <Flex bg="#fff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="10px" p={4} align="center" gap={3} minH="84px">
    <Flex w="48px" h="48px" borderRadius="50%" bg={`${tone}14`} color={tone} align="center" justify="center" flexShrink={0}>
      <Icon name={icon} size={25} />
    </Flex>
    <Box minW={0}>
      <Text fontSize="11px" color={themeColors.text.secondary} fontWeight="600">{label}</Text>
      <Text fontSize="25px" lineHeight="1.15" fontWeight="750" color={themeColors.text.title}>{value}</Text>
      {helper && <Text fontSize="10px" color={themeColors.text.muted}>{helper}</Text>}
    </Box>
  </Flex>
);
