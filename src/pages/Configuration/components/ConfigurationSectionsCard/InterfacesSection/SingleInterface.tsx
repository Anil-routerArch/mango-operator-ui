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
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { ToggleSwitch } from '../ToggleSwitch';
import { SsidConfig } from './SsidConfig';
import { ReservedAddressesModal } from './ReservedAddressesModal';
import {
  DHCPV6_MODES,
  INTERFACE_ROLES,
  INTERFACE_SERVICES_OPTIONS,
  TUNNEL_PROTOS,
  getDefaultSsid,
} from './interfacesConstants';
import type { SingleInterfaceConfigItem } from '../types';

interface SingleInterfaceProps {
  iface: SingleInterfaceConfigItem;
  onChange: (updated: SingleInterfaceConfigItem) => void;
  onDelete: (id: string) => void;
  onManageEthernetPorts: () => void;
  canDelete?: boolean;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const SingleInterface: React.FC<SingleInterfaceProps> = ({
  iface,
  onChange,
  onDelete,
  onManageEthernetPorts,
  canDelete = true,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const [isReservedModalOpen, setIsReservedModalOpen] = useState(false);

  const isIpv4Enabled = iface.ipv4?.addressing !== 'none';
  const isIpv6Enabled = iface.ipv6?.addressing !== 'none';
  const isVlanEnabled = Boolean(iface.vlan?.enabled);
  const isTunnelEnabled = Boolean(iface.tunnel?.proto && iface.tunnel?.proto !== 'none');

  const isDhcpv4Enabled = iface.ipv4?.dhcpServer ?? true;
  const isDhcpv6Enabled = iface.ipv6?.dhcpv6?.enabled ?? true;

  const handleToggleIpv4 = (enabled: boolean) => {
    onChange({
      ...iface,
      ipv4: {
        ...iface.ipv4,
        addressing: enabled ? 'dynamic' : 'none',
      },
    });
  };

  const handleToggleIpv6 = (enabled: boolean) => {
    onChange({
      ...iface,
      ipv6: {
        ...iface.ipv6,
        addressing: enabled ? 'dynamic' : 'none',
      },
    });
  };

  const handleToggleVlan = (enabled: boolean) => {
    onChange({
      ...iface,
      vlan: {
        ...iface.vlan,
        enabled,
        id: enabled ? iface.vlan?.id || 1080 : undefined,
      },
    });
  };

  const handleToggleTunnel = (enabled: boolean) => {
    onChange({
      ...iface,
      tunnel: {
        ...iface.tunnel,
        proto: enabled ? (iface.tunnel?.proto && iface.tunnel?.proto !== 'none' ? iface.tunnel.proto : 'mesh') : 'none',
      },
    });
  };

  const handleAddSsid = () => {
    const newSsid = getDefaultSsid(iface.ssids?.length || 0);
    onChange({
      ...iface,
      ssids: [...(iface.ssids || []), newSsid],
    });
  };

  return (
    <Box p={5}>
      <VStack gap={5} align="stretch">
        {/* Section Header: General */}
        <Flex align="center" justify="space-between">
          <Text
            fontSize="14px"
            fontWeight="700"
            color={themeColors.text.title}
            textDecoration="underline"
            textUnderlineOffset="3px"
          >
            General
          </Text>

          {canDelete && !disabled && (
            <Box
              as="button"
              w="26px"
              h="26px"
              borderRadius="4px"
              bg="#fee2e2"
              color="#dc2626"
              display="grid"
              placeItems="center"
              cursor="pointer"
              _hover={{ bg: '#fca5a5' }}
              onClick={() => onDelete(iface.id)}
              title="Delete this interface"
            >
              <Icon name="trash" size={13} />
            </Box>
          )}
        </Flex>

        {/* General Fields - Row 1 & Row 2 */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} gap={4} alignContent="start">
          {/* name */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              name <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={iface.name}
              onChange={(e) => onChange({ ...iface, name: e.target.value })}
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
          </Box>

          {/* role */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              role <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              size="sm"
              value={iface.role}
              onChange={(val) =>
                onChange({
                  ...iface,
                  role: val as SingleInterfaceConfigItem['role'],
                })
              }
              options={INTERFACE_ROLES}
              disabled={disabled}
              w="100%"
            />
          </Box>

          {/* ethernet */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              ethernet <Text as="span" color="#dc2626">*</Text>
            </Text>
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
              _hover={disabled ? undefined : { bg: '#1d4ed8' }}
              onClick={onManageEthernetPorts}
              whiteSpace="nowrap"
            >
              Manage Ethernet Ports
            </Box>
          </Box>

          {/* isolate-hosts */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
              isolate-hosts
            </Text>
            <ToggleSwitch
              checked={iface.isolateHosts}
              onChange={(checked) => onChange({ ...iface, isolateHosts: checked })}
              disabled={disabled}
              label=""
            />
          </Box>

          {/* services */}
          <Box minW="160px">
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              services
            </Text>
            <MultiSelectDropdown
              value={iface.services}
              onChange={(services: string[]) => onChange({ ...iface, services })}
              options={INTERFACE_SERVICES_OPTIONS}
              disabled={disabled}
              placeholder="Select..."
              label=""
            />
          </Box>
        </SimpleGrid>

        {/* Row 2: hostapd-bss-raw */}
        <Box maxW="280px">
          <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
            hostapd-bss-raw
          </Text>
          <Input
            size="sm"
            value={iface.hostapdBssRaw || ''}
            onChange={(e) => onChange({ ...iface, hostapdBssRaw: e.target.value })}
            placeholder=""
            disabled={disabled}
            borderRadius="8px"
            borderColor="#cbd5e1"
          />
        </Box>

        {/* Section Header: IP Addressing */}
        <Box pt={2}>
          <Text
            fontSize="14px"
            fontWeight="700"
            color={themeColors.text.title}
            textDecoration="underline"
            textUnderlineOffset="3px"
            mb={3}
          >
            IP Addressing
          </Text>

          <VStack gap={4} align="stretch">
            {/* IPv4 Main Toggle Row */}
            <Flex align="center" gap={3} wrap="wrap">
              <HStack gap={2}>
                <Text fontSize="13px" fontWeight="700" color="#1e293b" minW="40px">
                  IPv4
                </Text>
                <ToggleSwitch
                  checked={isIpv4Enabled}
                  onChange={handleToggleIpv4}
                  disabled={disabled}
                  label=""
                />
              </HStack>

              {isIpv4Enabled && (
                <>
                  <Box title={isDefaultConfig ? 'Resource profiles cannot be bound to default configurations' : undefined}>
                    <SelectDropdown
                      size="sm"
                      value={iface.ipv4.resource || ''}
                      onChange={(val) =>
                        onChange({
                          ...iface,
                          ipv4: { ...iface.ipv4, resource: String(val) },
                        })
                      }
                      options={[{ value: '', label: 'No Resource Selected' }]}
                      disabled={disabled || isDefaultConfig}
                      w="200px"
                    />
                  </Box>
                  <SelectDropdown
                    size="sm"
                    value={iface.ipv4.addressing === 'static' ? 'static' : 'dynamic'}
                    onChange={(val) =>
                      onChange({
                        ...iface,
                        ipv4: {
                          ...iface.ipv4,
                          addressing: val as 'dynamic' | 'static',
                        },
                      })
                    }
                    options={[
                      { value: 'dynamic', label: 'dynamic' },
                      { value: 'static', label: 'static' },
                    ]}
                    disabled={disabled}
                    w="120px"
                  />
                </>
              )}
            </Flex>

            {/* Static IPv4 Details if static */}
            {isIpv4Enabled && iface.ipv4.addressing === 'static' && (
              <VStack gap={4} align="stretch" pl={{ base: 0, sm: 2 }}>
                {/* Static IPv4: Row 1 */}
                <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={4}>
                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      subnet <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      size="sm"
                      value={iface.ipv4.subnet || ''}
                      onChange={(e) =>
                        onChange({
                          ...iface,
                          ipv4: { ...iface.ipv4, subnet: e.target.value },
                        })
                      }
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
                      value={iface.ipv4.gateway || ''}
                      onChange={(e) =>
                        onChange({
                          ...iface,
                          ipv4: { ...iface.ipv4, gateway: e.target.value },
                        })
                      }
                      placeholder="192.168.1.1"
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                      send-hostname <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <ToggleSwitch
                      checked={iface.ipv4.sendHostname ?? true}
                      onChange={(checked) =>
                        onChange({
                          ...iface,
                          ipv4: { ...iface.ipv4, sendHostname: checked },
                        })
                      }
                      disabled={disabled}
                      label=""
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      use-dns
                    </Text>
                    <Input
                      size="sm"
                      value={(iface.ipv4.useDns || []).join(', ')}
                      onChange={(e) =>
                        onChange({
                          ...iface,
                          ipv4: {
                            ...iface.ipv4,
                            useDns: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      placeholder=""
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>
                </SimpleGrid>

                {/* DHCPv4 Header & Manage Reserved Addresses */}
                <Flex align="center" gap={3} mt={1}>
                  <HStack gap={2}>
                    <Text fontSize="13px" fontWeight="700" color="#1e293b">
                      DHCPv4
                    </Text>
                    <ToggleSwitch
                      checked={isDhcpv4Enabled}
                      onChange={(checked) =>
                        onChange({
                          ...iface,
                          ipv4: { ...iface.ipv4, dhcpServer: checked },
                        })
                      }
                      disabled={disabled}
                      label=""
                    />
                  </HStack>

                  {isDhcpv4Enabled && (
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
                      _hover={disabled ? undefined : { bg: '#1d4ed8' }}
                      onClick={() => setIsReservedModalOpen(true)}
                    >
                      Manage Reserved Addresses
                    </Box>
                  )}
                </Flex>

                {/* DHCPv4 Fields if enabled */}
                {isDhcpv4Enabled && (
                  <VStack gap={4} align="stretch">
                    {/* Row 3 */}
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 5 }} gap={4}>
                      <Box>
                        <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                          lease-first <Text as="span" color="#dc2626">*</Text>
                        </Text>
                        <Input
                          size="sm"
                          type="number"
                          value={iface.ipv4.dhcp?.leaseFirst ?? iface.ipv4.leaseFirst ?? 1}
                          onChange={(e) =>
                            onChange({
                              ...iface,
                              ipv4: {
                                ...iface.ipv4,
                                dhcp: {
                                  ...iface.ipv4.dhcp,
                                  leaseFirst: Number(e.target.value) || 1,
                                },
                              },
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
                          value={iface.ipv4.dhcp?.leaseCount ?? iface.ipv4.leaseCount ?? 128}
                          onChange={(e) =>
                            onChange({
                              ...iface,
                              ipv4: {
                                ...iface.ipv4,
                                dhcp: {
                                  ...iface.ipv4.dhcp,
                                  leaseCount: Number(e.target.value) || 128,
                                },
                              },
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
                          value={iface.ipv4.dhcp?.leaseTime || iface.ipv4.leaseTime || '6h'}
                          onChange={(e) =>
                            onChange({
                              ...iface,
                              ipv4: {
                                ...iface.ipv4,
                                dhcp: {
                                  ...iface.ipv4.dhcp,
                                  leaseTime: e.target.value,
                                },
                              },
                            })
                          }
                          disabled={disabled}
                          borderRadius="8px"
                          borderColor="#cbd5e1"
                        />
                      </Box>

                      <Box>
                        <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                          relay-server
                        </Text>
                        <Input
                          size="sm"
                          value={iface.ipv4.dhcp?.relayServer || ''}
                          onChange={(e) =>
                            onChange({
                              ...iface,
                              ipv4: {
                                ...iface.ipv4,
                                dhcp: {
                                  ...iface.ipv4.dhcp,
                                  relayServer: e.target.value,
                                },
                              },
                            })
                          }
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
                          value={iface.ipv4.dhcp?.circuitIdFormat || ''}
                          onChange={(e) =>
                            onChange({
                              ...iface,
                              ipv4: {
                                ...iface.ipv4,
                                dhcp: {
                                  ...iface.ipv4.dhcp,
                                  circuitIdFormat: e.target.value,
                                },
                              },
                            })
                          }
                          disabled={disabled}
                          borderRadius="8px"
                          borderColor="#cbd5e1"
                        />
                      </Box>
                    </SimpleGrid>

                    {/* Row 4: remote-id-format */}
                    <Box maxW={{ base: '100%', sm: '240px' }}>
                      <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                        remote-id-format <Text as="span" color="#dc2626">*</Text>
                      </Text>
                      <Input
                        size="sm"
                        value={iface.ipv4.dhcp?.remoteIdFormat || ''}
                        onChange={(e) =>
                          onChange({
                            ...iface,
                            ipv4: {
                              ...iface.ipv4,
                              dhcp: {
                                ...iface.ipv4.dhcp,
                                remoteIdFormat: e.target.value,
                              },
                            },
                          })
                        }
                        disabled={disabled}
                        borderRadius="8px"
                        borderColor="#cbd5e1"
                      />
                    </Box>
                  </VStack>
                )}
              </VStack>
            )}

            {/* IPv6 Main Toggle Row */}
            <Flex align="center" gap={3} wrap="wrap" mt={2}>
              <HStack gap={2}>
                <Text fontSize="13px" fontWeight="700" color="#1e293b" minW="40px">
                  IPv6
                </Text>
                <ToggleSwitch
                  checked={isIpv6Enabled}
                  onChange={handleToggleIpv6}
                  disabled={disabled}
                  label=""
                />
              </HStack>

              {isIpv6Enabled && (
                <SelectDropdown
                  size="sm"
                  value={iface.ipv6.addressing === 'static' ? 'static' : 'dynamic'}
                  onChange={(val) =>
                    onChange({
                      ...iface,
                      ipv6: {
                        ...iface.ipv6,
                        addressing: val as 'dynamic' | 'static',
                      },
                    })
                  }
                  options={[
                    { value: 'dynamic', label: 'dynamic' },
                    { value: 'static', label: 'static' },
                  ]}
                  disabled={disabled}
                  w="120px"
                />
              )}
            </Flex>

            {/* Static IPv6 Details if static */}
            {isIpv6Enabled && iface.ipv6.addressing === 'static' && (
              <VStack gap={4} align="stretch" pl={{ base: 0, sm: 2 }}>
                {/* Static IPv6: Row 1 */}
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      subnet
                    </Text>
                    <Input
                      size="sm"
                      value={iface.ipv6.subnet || ''}
                      onChange={(e) =>
                        onChange({
                          ...iface,
                          ipv6: { ...iface.ipv6, subnet: e.target.value },
                        })
                      }
                      placeholder=""
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      gateway
                    </Text>
                    <Input
                      size="sm"
                      value={iface.ipv6.gateway || ''}
                      onChange={(e) =>
                        onChange({
                          ...iface,
                          ipv6: { ...iface.ipv6, gateway: e.target.value },
                        })
                      }
                      placeholder=""
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                      prefix-size
                    </Text>
                    <Input
                      size="sm"
                      type="number"
                      value={iface.ipv6.prefixSize ?? 64}
                      onChange={(e) =>
                        onChange({
                          ...iface,
                          ipv6: {
                            ...iface.ipv6,
                            prefixSize: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>
                </SimpleGrid>

                {/* DHCPv6 Header */}
                <Flex align="center" gap={3} mt={1}>
                  <HStack gap={2}>
                    <Text fontSize="13px" fontWeight="700" color="#1e293b">
                      DHCPv6
                    </Text>
                    <ToggleSwitch
                      checked={isDhcpv6Enabled}
                      onChange={(checked) =>
                        onChange({
                          ...iface,
                          ipv6: {
                            ...iface.ipv6,
                            dhcpv6: {
                              ...iface.ipv6.dhcpv6,
                              enabled: checked,
                            },
                          },
                        })
                      }
                      disabled={disabled}
                      label=""
                    />
                  </HStack>
                </Flex>

                {/* DHCPv6 Fields if enabled */}
                {isDhcpv6Enabled && (
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
                    <Box>
                      <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                        mode
                      </Text>
                      <SelectDropdown
                        size="sm"
                        value={iface.ipv6.dhcpv6?.mode || 'hybrid'}
                        onChange={(val) =>
                          onChange({
                            ...iface,
                            ipv6: {
                              ...iface.ipv6,
                              dhcpv6: {
                                ...iface.ipv6.dhcpv6,
                                mode: val as 'hybrid' | 'stateless' | 'stateful' | 'relay',
                              },
                            },
                          })
                        }
                        options={DHCPV6_MODES}
                        disabled={disabled}
                        w="100%"
                      />
                    </Box>

                    <Box>
                      <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                        announce-dns
                      </Text>
                      <Input
                        size="sm"
                        value={(iface.ipv6.dhcpv6?.announceDns || []).join(', ')}
                        onChange={(e) =>
                          onChange({
                            ...iface,
                            ipv6: {
                              ...iface.ipv6,
                              dhcpv6: {
                                ...iface.ipv6.dhcpv6,
                                announceDns: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              },
                            },
                          })
                        }
                        placeholder=""
                        disabled={disabled}
                        borderRadius="8px"
                        borderColor="#cbd5e1"
                      />
                    </Box>

                    <Box>
                      <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                        filter-prefix
                      </Text>
                      <Input
                        size="sm"
                        value={iface.ipv6.dhcpv6?.filterPrefix || '::/0'}
                        onChange={(e) =>
                          onChange({
                            ...iface,
                            ipv6: {
                              ...iface.ipv6,
                              dhcpv6: {
                                ...iface.ipv6.dhcpv6,
                                filterPrefix: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="::/0"
                        disabled={disabled}
                        borderRadius="8px"
                        borderColor="#cbd5e1"
                      />
                    </Box>
                  </SimpleGrid>
                )}
              </VStack>
            )}
          </VStack>
        </Box>

        {/* Section Header: Advanced Settings */}
        <Box pt={2}>
          <Text
            fontSize="14px"
            fontWeight="700"
            color={themeColors.text.title}
            textDecoration="underline"
            textUnderlineOffset="3px"
            mb={3}
          >
            Advanced Settings
          </Text>

          <VStack gap={4} align="stretch">
            {/* Vlan Row */}
            <VStack gap={3} align="stretch">
              <Flex align="center" gap={3} wrap="wrap">
                <HStack gap={2}>
                  <Text fontSize="13px" fontWeight="700" color="#1e293b" minW="50px">
                    Vlan
                  </Text>
                  <ToggleSwitch
                    checked={isVlanEnabled}
                    onChange={handleToggleVlan}
                    disabled={disabled}
                    label=""
                  />
                </HStack>

                {isVlanEnabled && (
                  <Box title={isDefaultConfig ? 'Resource profiles cannot be bound to default configurations' : undefined}>
                    <SelectDropdown
                      size="sm"
                      value={iface.vlan.resource || ''}
                      onChange={(val) =>
                        onChange({
                          ...iface,
                          vlan: { ...iface.vlan, resource: String(val) },
                        })
                      }
                      options={[{ value: '', label: 'No Resource Selected' }]}
                      disabled={disabled || isDefaultConfig}
                      w="200px"
                    />
                  </Box>
                )}
              </Flex>

              {isVlanEnabled && (
                <Box maxW="160px" pl={{ base: 0, sm: 2 }}>
                  <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                    id <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={iface.vlan.id ?? 1080}
                    onChange={(e) =>
                      onChange({
                        ...iface,
                        vlan: { ...iface.vlan, id: Number(e.target.value) || 1080 },
                      })
                    }
                    placeholder="1080"
                    disabled={disabled}
                    borderRadius="8px"
                    borderColor="#cbd5e1"
                  />
                </Box>
              )}
            </VStack>

            {/* Tunnel Row */}
            <VStack gap={3} align="stretch" mt={1}>
              <Flex align="center" gap={3} wrap="wrap">
                <HStack gap={2}>
                  <Text fontSize="13px" fontWeight="700" color="#1e293b" minW="50px">
                    Tunnel
                  </Text>
                  <ToggleSwitch
                    checked={isTunnelEnabled}
                    onChange={handleToggleTunnel}
                    disabled={disabled}
                    label=""
                  />
                </HStack>

                {isTunnelEnabled && (
                  <>
                    <Box title={isDefaultConfig ? 'Resource profiles cannot be bound to default configurations' : undefined}>
                      <SelectDropdown
                        size="sm"
                        value={iface.tunnel.resource || ''}
                        onChange={(val) =>
                          onChange({
                            ...iface,
                            tunnel: { ...iface.tunnel, resource: String(val) },
                          })
                        }
                        options={[{ value: '', label: 'No Resource Selected' }]}
                        disabled={disabled || isDefaultConfig}
                        w="200px"
                      />
                    </Box>
                    <SelectDropdown
                      size="sm"
                      value={iface.tunnel.proto || 'mesh'}
                      onChange={(val) =>
                        onChange({
                          ...iface,
                          tunnel: { ...iface.tunnel, proto: String(val) },
                        })
                      }
                      options={TUNNEL_PROTOS.filter((p) => p.value !== 'none')}
                      disabled={disabled}
                      w="120px"
                    />
                  </>
                )}
              </Flex>

              {isTunnelEnabled && iface.tunnel.proto && iface.tunnel.proto !== 'mesh' && (
                <Box maxW="240px" pl={{ base: 0, sm: 2 }}>
                  <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                    peer address
                  </Text>
                  <Input
                    size="sm"
                    value={iface.tunnel.peer || ''}
                    onChange={(e) =>
                      onChange({
                        ...iface,
                        tunnel: { ...iface.tunnel, peer: e.target.value },
                      })
                    }
                    placeholder="Peer / Server IP"
                    disabled={disabled}
                    borderRadius="8px"
                    borderColor="#cbd5e1"
                  />
                </Box>
              )}
            </VStack>
          </VStack>
        </Box>

        {/* SSIDs Area */}
        {iface.ssids && iface.ssids.length > 0 ? (
          <SsidConfig
            ssids={iface.ssids}
            onChange={(ssids) => onChange({ ...iface, ssids })}
            disabled={disabled}
            isDefaultConfig={isDefaultConfig}
          />
        ) : (
          <Box pt={4} textAlign="center">
            {!disabled && (
              <Box
                as="button"
                px={5}
                py={2}
                borderRadius="6px"
                bg="#2563eb"
                color="#ffffff"
                fontSize="13px"
                fontWeight="600"
                cursor="pointer"
                _hover={{ bg: '#1d4ed8' }}
                onClick={handleAddSsid}
              >
                Add SSID +
              </Box>
            )}
          </Box>
        )}
      </VStack>

      {/* Reserved Addresses Modal */}
      <ReservedAddressesModal
        isOpen={isReservedModalOpen}
        onClose={() => setIsReservedModalOpen(false)}
        interfaceName={iface.name}
        reservedAddresses={iface.ipv4.dhcp?.reservedAddresses || []}
        onSave={(reservedAddresses) => {
          onChange({
            ...iface,
            ipv4: {
              ...iface.ipv4,
              dhcp: {
                ...iface.ipv4.dhcp,
                reservedAddresses,
              },
            },
          });
        }}
        disabled={disabled}
      />
    </Box>
  );
};
