import React from 'react';
import {
  Box,
  Flex,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { STATS_TYPE_OPTIONS } from './metricsConstants';
import type { MetricsSectionData } from '../types';

interface StatisticsProps {
  data: MetricsSectionData;
  onChange: (data: MetricsSectionData) => void;
  disabled?: boolean;
}

export const Statistics: React.FC<StatisticsProps> = ({
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
      zIndex={13}
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
          Statistics
        </Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              interval <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              value={data.statistics.interval}
              onChange={(e) =>
                onChange({
                  ...data,
                  statistics: { ...data.statistics, interval: Number(e.target.value) || 60 },
                })
              }
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
          <Box>
            <MultiSelectDropdown
              label="types"
              isRequired
              options={STATS_TYPE_OPTIONS}
              value={data.statistics.types}
              onChange={(types) =>
                onChange({
                  ...data,
                  statistics: { ...data.statistics, types },
                })
              }
              disabled={disabled}
              placeholder="Select types..."
            />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};
