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
  onClick?: () => void;
}> = ({ label, value, icon, tone = '#2563eb', helper, onClick }) => (
  <Flex
    as={onClick ? 'button' : 'div'}
    onClick={onClick}
    textAlign="left"
    w="100%"
    bg="#fff"
    border="1px solid"
    borderColor={themeColors.panel.border}
    borderRadius="10px"
    p={4}
    align="center"
    gap={3}
    minH="84px"
    cursor={onClick ? 'pointer' : 'default'}
    transition="border-color 0.15s ease, box-shadow 0.15s ease"
    _hover={onClick ? { borderColor: tone, boxShadow: `0 3px 12px ${tone}20` } : undefined}
    _focusVisible={onClick ? { outline: `2px solid ${tone}`, outlineOffset: '2px' } : undefined}
  >
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
