import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { EVENT_TYPES_OPTIONS } from './metricsConstants';
import type { MetricsSectionData } from '../types';

interface RealtimeProps {
  data: MetricsSectionData;
  onChange: (data: MetricsSectionData) => void;
  disabled?: boolean;
}

export const Realtime: React.FC<RealtimeProps> = ({
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
      zIndex={12}
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
          Realtime
        </Text>
      </Flex>
      <Box p={4}>
        <MultiSelectDropdown
          label="types"
          options={EVENT_TYPES_OPTIONS}
          value={data.realtime.types}
          onChange={(types) =>
            onChange({
              ...data,
              realtime: { types },
            })
          }
          disabled={disabled}
          placeholder="Select event types..."
        />
      </Box>
    </Box>
  );
};
