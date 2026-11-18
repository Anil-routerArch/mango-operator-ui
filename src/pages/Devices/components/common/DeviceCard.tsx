import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';

export interface DeviceCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  minH?: string | number;
  p?: string | number;
  bg?: string;
  borderColor?: string;
}

/**
 * Modular card container adhering to the MangoCloud design system.
 * Used across Device Overview, Radios, Configuration, and Diagnostics tabs.
 */
export const DeviceCard: React.FC<DeviceCardProps> = ({
  title,
  subtitle,
  action,
  children,
  minH,
  p = 5,
  bg = themeColors.panel.bg,
  borderColor = themeColors.panel.border,
}) => {
  return (
    <Box
      bg={bg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="10px"
      p={p}
      minH={minH}
      boxShadow="0 1px 3px rgba(0, 0, 0, 0.04)"
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
      _hover={{
        borderColor: themeColors.brand.accentBorder,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
      }}
    >
      {(title || action) && (
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            {title && (
              <Text fontSize="15px" fontWeight="600" color={themeColors.text.title} lineHeight="1.2">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text fontSize="12px" color={themeColors.text.muted} mt={0.5}>
                {subtitle}
              </Text>
            )}
          </Box>
          {action && <Box>{action}</Box>}
        </Flex>
      )}
      {children}
    </Box>
  );
};

export default DeviceCard;

