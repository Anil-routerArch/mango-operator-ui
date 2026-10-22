import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { ToggleSwitch } from '../ToggleSwitch';
import type { ServicesSectionData } from '../types';

interface SshProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const Ssh: React.FC<SshProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>SSH</Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              port <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              value={data.ssh.port}
              onChange={(e) => onChange({ ...data, ssh: { ...data.ssh, port: Number(e.target.value) || 22 } })}
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
          <Flex align="center" justify="space-between">
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
              password-authentication <Text as="span" color="#dc2626">*</Text>
            </Text>
            <ToggleSwitch
              checked={data.ssh.passwordAuthentication}
              onChange={(checked) =>
                onChange({
                  ...data,
                  ssh: { ...data.ssh, passwordAuthentication: checked },
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

