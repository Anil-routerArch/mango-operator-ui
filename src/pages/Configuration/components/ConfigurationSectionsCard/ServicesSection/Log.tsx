import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { LOG_PROTOS } from './servicesConstants';
import type { ServicesSectionData } from '../types';

interface LogProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const Log: React.FC<LogProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>Log</Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Flex gap={2}>
            <Box flex="2">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                host <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                value={data.log.host}
                onChange={(e) => onChange({ ...data, log: { ...data.log, host: e.target.value } })}
                placeholder="syslog.example.com"
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
            <Box flex="1">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                port <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                type="number"
                value={data.log.port}
                onChange={(e) => onChange({ ...data, log: { ...data.log, port: Number(e.target.value) || 5912 } })}
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
          </Flex>
          <Flex gap={2}>
            <Box flex="1">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                proto <Text as="span" color="#dc2626">*</Text>
              </Text>
              <SelectDropdown
                value={data.log.proto}
                onChange={(val) =>
                  onChange({
                    ...data,
                    log: { ...data.log, proto: val as ServicesSectionData['log']['proto'] },
                  })
                }
                options={LOG_PROTOS}
                disabled={disabled}
                w="100%"
              />
            </Box>
            <Box flex="1">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                size <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                type="number"
                value={data.log.size}
                onChange={(e) => onChange({ ...data, log: { ...data.log, size: Number(e.target.value) || 1000 } })}
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

