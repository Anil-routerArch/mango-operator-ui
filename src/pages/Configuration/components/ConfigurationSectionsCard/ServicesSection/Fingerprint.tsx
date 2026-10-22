import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { FINGERPRINT_MODES } from './servicesConstants';
import type { ServicesSectionData } from '../types';

interface FingerprintProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const Fingerprint: React.FC<FingerprintProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>Fingerprinting</Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              mode <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              value={data.fingerprint.mode}
              onChange={(val) =>
                onChange({
                  ...data,
                  fingerprint: {
                    ...data.fingerprint,
                    mode: val as ServicesSectionData['fingerprint']['mode'],
                  },
                })
              }
              options={FINGERPRINT_MODES}
              disabled={disabled}
              w="100%"
            />
          </Box>
          <Flex gap={2}>
            <Box flex="1">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                minimumAge <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                type="number"
                value={data.fingerprint.minimumAge}
                onChange={(e) =>
                  onChange({
                    ...data,
                    fingerprint: { ...data.fingerprint, minimumAge: Number(e.target.value) || 60 },
                  })
                }
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
            <Box flex="1">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                maximumAge <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                type="number"
                value={data.fingerprint.maximumAge}
                onChange={(e) =>
                  onChange({
                    ...data,
                    fingerprint: { ...data.fingerprint, maximumAge: Number(e.target.value) || 60 },
                  })
                }
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
          </Flex>
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              periodicity <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              value={data.fingerprint.periodicity}
              onChange={(e) =>
                onChange({
                  ...data,
                  fingerprint: { ...data.fingerprint, periodicity: Number(e.target.value) || 600 },
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

