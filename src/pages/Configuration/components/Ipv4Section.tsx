import React, { useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from './ConfigurationSectionsCard/ToggleSwitch';
import { PortForwardingModal } from './PortForwardingModal';
import { ReservedAddressesModal } from './ConfigurationSectionsCard/InterfacesSection/ReservedAddressesModal';
import type { Ipv4ConfigData } from '../types/ipv4';

export interface Ipv4SectionProps {
  config: Ipv4ConfigData;
  onChange: (updated: Ipv4ConfigData) => void;
  disabled?: boolean;
}

export const Ipv4Section: React.FC<Ipv4SectionProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  const [isPortForwardOpen, setIsPortForwardOpen] = useState(false);
  const [isReservedOpen, setIsReservedOpen] = useState(false);

  return (
    <VStack gap={4} align="stretch">
      {/* Top Header: IpV4 title, addressing dropdown, and IPv4 Port Forwarding button */}
      <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={3}
        pb={2}
        borderBottom={config.addressing === 'static' ? '1px solid #e2e8f0' : undefined}
      >
        <HStack gap={3} align="center">
          <Text fontSize="15px" fontWeight="700" color="#1e293b">
            IpV4
          </Text>
          <Box w="130px">
            <SelectDropdown
              size="sm"
              value={config.addressing}
              onChange={(val) =>
                onChange({
                  ...config,
                  addressing: val as 'dynamic' | 'static' | 'none',
                })
              }
              options={[
                { value: 'dynamic', label: 'dynamic' },
                { value: 'static', label: 'static' },
              ]}
              disabled={disabled}
            />
          </Box>
        </HStack>

        <Box
          as="button"
          px={3.5}
          py={1.5}
          borderRadius="8px"
          bg="#2563eb"
          color="#ffffff"
          fontSize="12px"
          fontWeight="600"
          cursor={disabled ? 'not-allowed' : 'pointer'}
          opacity={disabled ? 0.6 : 1}
          _hover={disabled ? undefined : { bg: '#1d4ed8' }}
          onClick={() => setIsPortForwardOpen(true)}
        >
          IPv4 Port Forwarding
          {config.portForward && config.portForward.length > 0 && ` (${config.portForward.length})`}
        </Box>
      </Flex>

      {/* Static IPv4 Details (Only shown when addressing === 'static') */}
      {config.addressing === 'static' && (
        <VStack gap={5} align="stretch">
          {/* Row 1: subnet, gateway, send-hostname */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} alignItems="end">
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                subnet <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                value={config.subnet ?? ''}
                onChange={(e) => onChange({ ...config, subnet: e.target.value })}
                placeholder="192.168.1.1/24"
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                gateway <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                value={config.gateway ?? ''}
                onChange={(e) => onChange({ ...config, gateway: e.target.value })}
                placeholder="192.168.1.1"
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>

            <Box pb={1.5}>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                send-hostname <Text as="span" color="#dc2626">*</Text>
              </Text>
              <ToggleSwitch
                checked={config.sendHostname ?? true}
                onChange={(checked) => onChange({ ...config, sendHostname: checked })}
                disabled={disabled}
              />
            </Box>
          </SimpleGrid>

          {/* DHCPv4 Section */}
          <Box pt={2}>
            <Flex align="center" justify="space-between" wrap="wrap" gap={3} mb={3}>
              <HStack gap={3} align="center">
                <Text fontSize="14px" fontWeight="700" color="#1e293b">
                  DHCPv4
                </Text>
                <ToggleSwitch
                  checked={config.dhcpEnabled}
                  onChange={(checked) => onChange({ ...config, dhcpEnabled: checked })}
                  disabled={disabled}
                />
              </HStack>

              {config.dhcpEnabled && (
                <Box
                  as="button"
                  px={3.5}
                  py={1.5}
                  borderRadius="8px"
                  bg="#2563eb"
                  color="#ffffff"
                  fontSize="12px"
                  fontWeight="600"
                  cursor={disabled ? 'not-allowed' : 'pointer'}
                  opacity={disabled ? 0.6 : 1}
                  _hover={disabled ? undefined : { bg: '#1d4ed8' }}
                  onClick={() => setIsReservedOpen(true)}
                >
                  Manage Reserved Addresses
                  {config.reservedAddresses && config.reservedAddresses.length > 0 && ` (${config.reservedAddresses.length})`}
                </Box>
              )}
            </Flex>

            {/* DHCPv4 Fields (Row 1 & Row 2) */}
            {config.dhcpEnabled && (
              <VStack gap={4} align="stretch" pt={1}>
                {/* DHCP Row 1: lease-first, lease-count, lease-time */}
                <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      lease-first <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      size="sm"
                      type="number"
                      min={1}
                      value={config.leaseFirst ?? 1}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          leaseFirst: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      lease-count <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      size="sm"
                      type="number"
                      min={1}
                      value={config.leaseCount ?? 128}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          leaseCount: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      lease-time <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      size="sm"
                      value={config.leaseTime ?? '6h'}
                      onChange={(e) => onChange({ ...config, leaseTime: e.target.value })}
                      placeholder="6h"
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>
                </SimpleGrid>

                {/* DHCP Row 2: relay-server, circuit-id-format, remote-id-format */}
                <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      relay-server
                    </Text>
                    <Input
                      size="sm"
                      value={config.relayServer ?? ''}
                      onChange={(e) => onChange({ ...config, relayServer: e.target.value })}
                      placeholder="192.168.1.254"
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      circuit-id-format <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      size="sm"
                      value={config.circuitIdFormat ?? ''}
                      onChange={(e) => onChange({ ...config, circuitIdFormat: e.target.value })}
                      placeholder="{Interface}:{VLAN-ID}"
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      remote-id-format <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      size="sm"
                      value={config.remoteIdFormat ?? ''}
                      onChange={(e) => onChange({ ...config, remoteIdFormat: e.target.value })}
                      placeholder="{MAC}"
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>
                </SimpleGrid>
              </VStack>
            )}
          </Box>
        </VStack>
      )}

      {/* Port Forwarding Modal */}
      <PortForwardingModal
        isOpen={isPortForwardOpen}
        onClose={() => setIsPortForwardOpen(false)}
        portForward={config.portForward || []}
        onSave={(newRules) => {
          onChange({ ...config, portForward: newRules });
        }}
        disabled={disabled}
      />

      {/* Reserved Addresses Modal */}
      <ReservedAddressesModal
        isOpen={isReservedOpen}
        onClose={() => setIsReservedOpen(false)}
        interfaceName="interface.ipv4"
        subnet={config.subnet}
        reservedAddresses={config.reservedAddresses || []}
        onSave={(newAddrs) => {
          onChange({ ...config, reservedAddresses: newAddrs });
        }}
        disabled={disabled}
      />
    </VStack>
  );
};
