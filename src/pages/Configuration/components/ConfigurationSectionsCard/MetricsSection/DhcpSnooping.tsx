import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { DHCP_FILTER_OPTIONS } from './metricsConstants';
import type { MetricsSectionData } from '../types';

interface DhcpSnoopingProps {
  data: MetricsSectionData;
  onChange: (data: MetricsSectionData) => void;
  disabled?: boolean;
}

export const DhcpSnooping: React.FC<DhcpSnoopingProps> = ({
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
      zIndex={14}
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
          DHCP Snooping
        </Text>
      </Flex>
      <Box p={4}>
        <MultiSelectDropdown
          label="filters"
          isRequired
          options={DHCP_FILTER_OPTIONS}
          value={data.dhcpSnooping.filters}
          onChange={(filters) =>
            onChange({
              ...data,
              dhcpSnooping: { filters },
            })
          }
          disabled={disabled}
          placeholder="Select filters..."
        />
      </Box>
    </Box>
  );
};
