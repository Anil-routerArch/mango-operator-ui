import React from 'react';
import {
  Box,
  Flex,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { ToggleSwitch } from '../ToggleSwitch';
import type { MetricsSectionData } from '../types';

interface HealthProps {
  data: MetricsSectionData;
  onChange: (data: MetricsSectionData) => void;
  disabled?: boolean;
}

export const Health: React.FC<HealthProps> = ({
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
          Health
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
              value={data.health.interval}
              onChange={(e) =>
                onChange({
                  ...data,
                  health: { ...data.health, interval: Number(e.target.value) || 60 },
                })
              }
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
          <Flex align="center" justify="space-between">
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
              dhcp-local <Text as="span" color="#dc2626">*</Text>
            </Text>
            <ToggleSwitch
              checked={data.health.dhcpLocal}
              onChange={(checked) =>
                onChange({
                  ...data,
                  health: { ...data.health, dhcpLocal: checked },
                })
              }
              disabled={disabled}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
              dhcp-remote <Text as="span" color="#dc2626">*</Text>
            </Text>
            <ToggleSwitch
              checked={data.health.dhcpRemote}
              onChange={(checked) =>
                onChange({
                  ...data,
                  health: { ...data.health, dhcpRemote: checked },
                })
              }
              disabled={disabled}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
              dns-local <Text as="span" color="#dc2626">*</Text>
            </Text>
            <ToggleSwitch
              checked={data.health.dnsLocal}
              onChange={(checked) =>
                onChange({
                  ...data,
                  health: { ...data.health, dnsLocal: checked },
                })
              }
              disabled={disabled}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
              dns-remote <Text as="span" color="#dc2626">*</Text>
            </Text>
            <ToggleSwitch
              checked={data.health.dnsRemote}
              onChange={(checked) =>
                onChange({
                  ...data,
                  health: { ...data.health, dnsRemote: checked },
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

