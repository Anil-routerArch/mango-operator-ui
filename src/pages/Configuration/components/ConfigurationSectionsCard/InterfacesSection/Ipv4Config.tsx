import React from 'react';
import { Box, Flex, Input, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import { IPV4_ADDRESSING_OPTIONS } from './interfacesConstants';
import type { SingleInterfaceConfigItem } from '../types';

interface Ipv4ConfigProps {
  ipv4: SingleInterfaceConfigItem['ipv4'];
  onChange: (updated: SingleInterfaceConfigItem['ipv4']) => void;
  disabled?: boolean;
}

export const Ipv4Config: React.FC<Ipv4ConfigProps> = ({
  ipv4,
  onChange,
  disabled = false,
}) => {
  return (
    <Box p={3} border="1px solid" borderColor="#e2e8f0" borderRadius="6px" bg="#f8fafc">
      <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2}>
        IPv4
      </Text>
      <VStack gap={2.5} align="stretch">
        <SimpleGrid columns={{ base: 1, sm: ipv4.addressing === 'static' ? 2 : 1 }} gap={2}>
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              addressing
            </Text>
            <SelectDropdown
              value={ipv4.addressing}
              onChange={(val) =>
                onChange({
                  ...ipv4,
                  addressing: val as SingleInterfaceConfigItem['ipv4']['addressing'],
                })
              }
              options={IPV4_ADDRESSING_OPTIONS}
              disabled={disabled}
              w="100%"
            />
          </Box>
          {ipv4.addressing === 'static' && (
            <Box>
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                subnet <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                value={ipv4.subnet || ''}
                onChange={(e) => onChange({ ...ipv4, subnet: e.target.value })}
                placeholder="192.168.1.1/24"
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
          )}
        </SimpleGrid>

        {ipv4.addressing === 'static' && (
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              gateway
            </Text>
            <Input
              size="sm"
              value={ipv4.gateway || ''}
              onChange={(e) => onChange({ ...ipv4, gateway: e.target.value })}
              placeholder="192.168.1.254"
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
        )}

        {/* DHCP Server Toggle */}
        <Flex align="center" justify="space-between" pt={1}>
          <ToggleSwitch
            checked={Boolean(ipv4.dhcpServer)}
            onChange={(checked) =>
              onChange({
                ...ipv4,
                dhcpServer: checked,
              })
            }
            label="DHCP Server"
            disabled={disabled}
          />
        </Flex>

        {/* DHCP Server Options when enabled */}
        {ipv4.dhcpServer && (
          <SimpleGrid columns={{ base: 1, sm: 3 }} gap={2} pt={1}>
            <Box>
              <Text fontSize="10px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                lease-first
              </Text>
              <Input
                size="sm"
                type="number"
                value={ipv4.leaseFirst ?? 10}
                onChange={(e) =>
                  onChange({
                    ...ipv4,
                    leaseFirst: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
            <Box>
              <Text fontSize="10px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                lease-count
              </Text>
              <Input
                size="sm"
                type="number"
                value={ipv4.leaseCount ?? 150}
                onChange={(e) =>
                  onChange({
                    ...ipv4,
                    leaseCount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
            <Box>
              <Text fontSize="10px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                lease-time
              </Text>
              <Input
                size="sm"
                value={ipv4.leaseTime || '12h'}
                onChange={(e) =>
                  onChange({
                    ...ipv4,
                    leaseTime: e.target.value,
                  })
                }
                disabled={disabled}
                borderRadius="4px"
                placeholder="12h"
              />
            </Box>
          </SimpleGrid>
        )}
      </VStack>
    </Box>
  );
};

