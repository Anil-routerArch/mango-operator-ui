import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { WIFI_FRAMES_FILTER_OPTIONS } from './metricsConstants';
import type { MetricsSectionData } from '../types';

interface WifiFramesProps {
  data: MetricsSectionData;
  onChange: (data: MetricsSectionData) => void;
  disabled?: boolean;
}

export const WifiFrames: React.FC<WifiFramesProps> = ({
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
      position="relative"
      zIndex={11}
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
          WiFi Frames
        </Text>
      </Flex>
      <Box p={4}>
        <MultiSelectDropdown
          label="filters"
          isRequired
          options={WIFI_FRAMES_FILTER_OPTIONS}
          value={data.wifiFrames.filters}
          onChange={(filters) =>
            onChange({
              ...data,
              wifiFrames: { filters },
            })
          }
          disabled={disabled}
          placeholder="Select frame filters..."
        />
      </Box>
    </Box>
  );
};
