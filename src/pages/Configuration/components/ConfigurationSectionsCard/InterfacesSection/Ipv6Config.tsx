import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { IPV6_ADDRESSING_OPTIONS } from './interfacesConstants';
import type { SingleInterfaceConfigItem } from '../types';

interface Ipv6ConfigProps {
  ipv6: SingleInterfaceConfigItem['ipv6'];
  onChange: (updated: SingleInterfaceConfigItem['ipv6']) => void;
  disabled?: boolean;
}

export const Ipv6Config: React.FC<Ipv6ConfigProps> = ({
  ipv6,
  onChange,
  disabled = false,
}) => {
  return (
    <Box p={3} border="1px solid" borderColor="#e2e8f0" borderRadius="6px" bg="#f8fafc">
      <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2}>
        IPv6
      </Text>
      <VStack gap={2.5} align="stretch">
        <Flex gap={2}>
          <Box flex="1">
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              addressing
            </Text>
            <SelectDropdown
              value={ipv6.addressing}
              onChange={(val) =>
                onChange({
                  ...ipv6,
                  addressing: val as SingleInterfaceConfigItem['ipv6']['addressing'],
                })
              }
              options={IPV6_ADDRESSING_OPTIONS}
              disabled={disabled}
              w="100%"
            />
          </Box>
          {ipv6.addressing === 'static' && (
            <Box flex="1">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                subnet
              </Text>
              <Input
                size="sm"
                value={ipv6.subnet || ''}
                onChange={(e) => onChange({ ...ipv6, subnet: e.target.value })}
                placeholder="fd00::1/64"
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
          )}
        </Flex>
      </VStack>
    </Box>
  );
};
