import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { TELEMETRY_TYPE_OPTIONS } from './metricsConstants';
import type { MetricsSectionData } from '../types';

interface TelemetryProps {
  data: MetricsSectionData;
  onChange: (data: MetricsSectionData) => void;
  disabled?: boolean;
}

export const Telemetry: React.FC<TelemetryProps> = ({
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
      zIndex={10}
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
          Telemetry
        </Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              interval <Text as="span" color="#dc2626">*</Text>
            </Text>
            <HStack gap={2}>
              <Input
                size="sm"
                type="number"
                value={data.telemetry.interval}
                onChange={(e) =>
                  onChange({
                    ...data,
                    telemetry: { ...data.telemetry, interval: Number(e.target.value) || 60 },
                  })
                }
                disabled={disabled}
                borderRadius="4px"
              />
              <Text fontSize="12px" color={themeColors.text.secondary}>
                s
              </Text>
            </HStack>
          </Box>
          <Box>
            <MultiSelectDropdown
              label="types"
              options={TELEMETRY_TYPE_OPTIONS}
              value={data.telemetry.types}
              onChange={(types) =>
                onChange({
                  ...data,
                  telemetry: { ...data.telemetry, types },
                })
              }
              disabled={disabled}
              placeholder="Select telemetry types..."
            />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};
