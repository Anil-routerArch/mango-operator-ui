import React from 'react';
import { Box, Flex, Input, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import { TUNNEL_PROTOS } from './interfacesConstants';
import type { SingleInterfaceConfigItem } from '../types';

interface VlanTunnelConfigProps {
  vlan: SingleInterfaceConfigItem['vlan'];
  tunnel: SingleInterfaceConfigItem['tunnel'];
  onVlanChange: (vlan: SingleInterfaceConfigItem['vlan']) => void;
  onTunnelChange: (tunnel: SingleInterfaceConfigItem['tunnel']) => void;
  disabled?: boolean;
}

export const VlanTunnelConfig: React.FC<VlanTunnelConfigProps> = ({
  vlan,
  tunnel,
  onVlanChange,
  onTunnelChange,
  disabled = false,
}) => {
  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} pt={2}>
      {/* VLAN Card */}
      <Box p={3} border="1px solid" borderColor="#e2e8f0" borderRadius="6px" bg="#f8fafc">
        <Flex align="center" justify="space-between" mb={2}>
          <Text fontSize="12px" fontWeight="700" color={themeColors.text.title}>
            VLAN
          </Text>
          <ToggleSwitch
            checked={vlan.enabled}
            onChange={(checked) =>
              onVlanChange({
                ...vlan,
                enabled: checked,
                id: checked ? (vlan.id ?? 1080) : undefined,
              })
            }
            label=""
            disabled={disabled}
          />
        </Flex>

        {vlan.enabled && (
          <Box pt={1}>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              VLAN ID
            </Text>
            <Input
              size="sm"
              type="number"
              value={vlan.id ?? 1080}
              onChange={(e) =>
                onVlanChange({
                  ...vlan,
                  id: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="1080"
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
        )}
      </Box>

      {/* Tunnel Card */}
      <Box p={3} border="1px solid" borderColor="#e2e8f0" borderRadius="6px" bg="#f8fafc">
        <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2}>
          Tunnel
        </Text>
        <VStack gap={2} align="stretch">
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              proto
            </Text>
            <SelectDropdown
              value={tunnel.proto || 'none'}
              onChange={(val) =>
                onTunnelChange({
                  ...tunnel,
                  proto: val,
                })
              }
              options={TUNNEL_PROTOS}
              disabled={disabled}
              w="100%"
            />
          </Box>

          {tunnel.proto && tunnel.proto !== 'none' && (
            <Box>
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                peer / server address
              </Text>
              <Input
                size="sm"
                value={tunnel.peer || ''}
                onChange={(e) =>
                  onTunnelChange({
                    ...tunnel,
                    peer: e.target.value,
                  })
                }
                placeholder="192.168.0.1"
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
          )}
        </VStack>
      </Box>
    </SimpleGrid>
  );
};

