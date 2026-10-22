import React from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => (
  <HStack
    gap={2}
    cursor={disabled ? 'not-allowed' : 'pointer'}
    userSelect="none"
    onClick={() => !disabled && onChange(!checked)}
  >
    <Box
      w="34px"
      h="18px"
      borderRadius="9px"
      bg={checked ? themeColors.brand.accent : '#cbd5e1'}
      position="relative"
      transition="all 0.2s ease"
      opacity={disabled ? 0.6 : 1}
    >
      <Box
        w="14px"
        h="14px"
        borderRadius="50%"
        bg="#ffffff"
        position="absolute"
        top="2px"
        left={checked ? '18px' : '2px'}
        transition="all 0.2s ease"
        boxShadow="0 1px 2px rgba(0,0,0,0.2)"
      />
    </Box>
    {label && (
      <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
        {label}
      </Text>
    )}
  </HStack>
);

