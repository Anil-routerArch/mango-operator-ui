import React from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import { GPS_BAUD_RATES } from './servicesConstants';
import type { ServicesSectionData } from '../types';

interface GpsProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const Gps: React.FC<GpsProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>Gps</Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              baud-rate <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              value={data.gps.baudRate}
              onChange={(val) =>
                onChange({
                  ...data,
                  gps: { ...data.gps, baudRate: Number(val) || 2400 },
                })
              }
              options={GPS_BAUD_RATES}
              disabled={disabled}
              w="100%"
            />
          </Box>
          <Flex align="center" justify="space-between">
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
              adjust-time <Text as="span" color="#dc2626">*</Text>
            </Text>
            <ToggleSwitch
              checked={data.gps.adjustTime}
              onChange={(checked) =>
                onChange({
                  ...data,
                  gps: { ...data.gps, adjustTime: checked },
                })
              }
              disabled={disabled}
            />
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

