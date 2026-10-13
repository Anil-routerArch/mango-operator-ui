import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import type { ServicesSectionData } from '../types';

interface AirtimePoliciesProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const AirtimePolicies: React.FC<AirtimePoliciesProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>Airtime Policies</Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              dns-match <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={data.airtimePolicies.dnsMatch.join(', ')}
              onChange={(e) =>
                onChange({
                  ...data,
                  airtimePolicies: {
                    ...data.airtimePolicies,
                    dnsMatch: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="e.g. *, *.netflix.com"
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              dns-weight <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              value={data.airtimePolicies.dnsWeight}
              onChange={(e) =>
                onChange({
                  ...data,
                  airtimePolicies: { ...data.airtimePolicies, dnsWeight: Number(e.target.value) || 256 },
                })
              }
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

