import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import type { ServicesSectionData } from '../types';

interface LldpProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const Lldp: React.FC<LldpProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>Lldp</Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              describe <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={data.lldp.describe}
              onChange={(e) =>
                onChange({
                  ...data,
                  lldp: { ...data.lldp, describe: e.target.value },
                })
              }
              placeholder="OpenWiFi AP"
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              location <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={data.lldp.location}
              onChange={(e) =>
                onChange({
                  ...data,
                  lldp: { ...data.lldp, location: e.target.value },
                })
              }
              placeholder="Building location"
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

