import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Input,
  Text,
} from '@chakra-ui/react';
import { themeColors } from '@/theme';
import type { MetricsSectionData } from '../types';

interface WifiScanProps {
  data: MetricsSectionData;
  onChange: (data: MetricsSectionData) => void;
  disabled?: boolean;
}

export const WifiScan: React.FC<WifiScanProps> = ({
  data,
  onChange,
  disabled = false,
}) => {
  return (
    <Box
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="8px"
      bg="#ffffff"
    >
      <Flex
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor={themeColors.panel.divider}
        bg="#f8fafc"
        borderTopRadius="7px"
      >
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
          WiFi Scan
        </Text>
      </Flex>
      <Box p={4}>
        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          interval <Text as="span" color="#dc2626">*</Text>
        </Text>
        <HStack gap={2}>
          <Input
            size="sm"
            type="number"
            value={data.wifiScan.interval}
            onChange={(e) =>
              onChange({
                ...data,
                wifiScan: { interval: Number(e.target.value) || 60 },
              })
            }
            disabled={disabled}
            borderRadius="4px"
          />
          <Text fontSize="12px" color="#64748b" fontWeight="600">
            s
          </Text>
        </HStack>
      </Box>
    </Box>
  );
};

