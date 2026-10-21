import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Spacer,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import { PROTOCOL_OPTIONS, PORT_MAPPING_OPTIONS, ADDRESS_MAPPING_OPTIONS } from './natConstants';
import type { SnatRule, DnatRule } from '../types';

export interface SingleNatRuleProps {
  mode: 'snat' | 'dnat';
  rule: SnatRule | DnatRule;
  onChange: (updated: SnatRule | DnatRule) => void;
  onDelete: () => void;
  interfaceNameOptions?: { label: string; value: string }[];
  disabled?: boolean;
}

export const SingleNatRule: React.FC<SingleNatRuleProps> = ({
  mode,
  rule,
  onChange,
  onDelete,
  interfaceNameOptions = [],
  disabled = false,
}) => {
  const isSnat = mode === 'snat';
  const interfaceKey = isSnat ? 'out-interface' : 'in-interface';

  const snatRule = isSnat ? (rule as SnatRule) : undefined;
  const dnatRule = !isSnat ? (rule as DnatRule) : undefined;

  // Active sub-block toggle states
  const [showInterface, setShowInterface] = useState<boolean>(
    Boolean(isSnat ? snatRule?.['out-interface'] : dnatRule?.['in-interface'])
  );
  const [showSource, setShowSource] = useState<boolean>(
    Boolean(rule.source?.address || rule.source?.port || rule.source?.fqdn || rule.source?.group)
  );
  const [showDestination, setShowDestination] = useState<boolean>(
    Boolean(rule.destination?.address || rule.destination?.port || rule.destination?.fqdn || rule.destination?.group)
  );
  const [showTranslation, setShowTranslation] = useState<boolean>(
    Boolean(rule.translation)
  );
  const [showSourceGroups, setShowSourceGroups] = useState<boolean>(
    Boolean(rule.source?.group && Object.values(rule.source.group).some(Boolean))
  );
  const [showDestGroups, setShowDestGroups] = useState<boolean>(
    Boolean(rule.destination?.group && Object.values(rule.destination.group).some(Boolean))
  );

  const currentInterfaceName = isSnat
    ? snatRule?.['out-interface']?.name || ''
    : dnatRule?.['in-interface']?.name || '';

  const interfaceOptions = React.useMemo(() => {
    const list = [...interfaceNameOptions];
    if (currentInterfaceName && !list.some((opt) => opt.value === currentInterfaceName)) {
      list.unshift({ label: currentInterfaceName, value: currentInterfaceName });
    }
    return list;
  }, [currentInterfaceName, interfaceNameOptions]);

  const handleToggleInterface = (checked: boolean) => {
    setShowInterface(checked);
    if (!checked) {
      if (isSnat && snatRule) {
        onChange({ ...snatRule, 'out-interface': { name: '' } });
      } else if (!isSnat && dnatRule) {
        onChange({ ...dnatRule, 'in-interface': { name: '' } });
      }
    } else {
      if (isSnat && snatRule) {
        onChange({
          ...snatRule,
          'out-interface': { name: interfaceNameOptions[0]?.value || '' },
        });
      } else if (!isSnat && dnatRule) {
        onChange({
          ...dnatRule,
          'in-interface': { name: interfaceNameOptions[0]?.value || '' },
        });
      }
    }
  };

  const handleToggleSource = (checked: boolean) => {
    setShowSource(checked);
    if (!checked) {
      onChange({ ...rule, source: undefined });
    } else {
      onChange({
        ...rule,
        source: { address: '', port: '' },
      });
    }
  };

  const handleToggleDestination = (checked: boolean) => {
    setShowDestination(checked);
    if (!checked) {
      onChange({ ...rule, destination: undefined });
    } else {
      onChange({
        ...rule,
        destination: { address: '', port: '' },
      });
    }
  };

  const handleToggleTranslation = (checked: boolean) => {
    setShowTranslation(checked);
    if (!checked) {
      if (isSnat && snatRule) {
        onChange({ ...snatRule, translation: { address: '' } });
      } else if (!isSnat && dnatRule) {
        onChange({ ...dnatRule, translation: { address: '' } });
      }
    } else {
      if (isSnat && snatRule) {
        onChange({
          ...snatRule,
          translation: { address: 'masquerade' },
        });
      } else if (!isSnat && dnatRule) {
        onChange({
          ...dnatRule,
          translation: { address: '' },
        });
      }
    }
  };

  return (
    <VStack gap={4} align="stretch" w="100%">
      {/* Rule Header Bar */}
      <Flex align="center" justify="space-between" pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <HStack gap={2}>
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
            {isSnat ? 'SNAT Rule' : 'DNAT Rule'} #{rule['rule-id']}
          </Text>
          <Box
            px={2}
            py={0.5}
            borderRadius="4px"
            bg={isSnat ? '#e0f2fe' : '#fef3c7'}
            color={isSnat ? '#0369a1' : '#b45309'}
            fontSize="11px"
            fontWeight="700"
            textTransform="uppercase"
          >
            {mode}
          </Box>
        </HStack>
        <Spacer />
        <Button
          size="sm"
          variant="outline"
          borderColor="#fca5a5"
          color="#dc2626"
          _hover={{ bg: '#fef2f2' }}
          onClick={onDelete}
          disabled={disabled}
        >
          <Icon name="trash" size={14} />
          <Text ml={1.5} fontSize="12px" fontWeight="600">Delete Rule</Text>
        </Button>
      </Flex>

      {/* Top Fields Grid */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="100%">
        <Box>
          <HStack gap={1} mb={1}>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
              rule-id
            </Text>
            <Text as="span" color="#dc2626">*</Text>
          </HStack>
          <Input
            size="sm"
            type="number"
            min={1}
            value={rule['rule-id']}
            onChange={(e) => onChange({ ...rule, 'rule-id': Math.max(1, parseInt(e.target.value, 10) || 1) })}
            disabled={disabled}
            borderRadius="4px"
          />
        </Box>

        <Box>
          <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            disable
          </Text>
          <HStack align="center" h="32px">
            <ToggleSwitch
              checked={Boolean(rule.disable)}
              onChange={(val) => onChange({ ...rule, disable: val })}
              disabled={disabled}
            />
            <Text fontSize="12px" color={rule.disable ? '#dc2626' : themeColors.text.secondary}>
              {rule.disable ? 'Disabled' : 'Enabled'}
            </Text>
          </HStack>
        </Box>

        <Box>
          <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            protocol
          </Text>
          <SelectDropdown
            value={rule.protocol || 'all'}
            onChange={(val) => onChange({ ...rule, protocol: val })}
            options={PROTOCOL_OPTIONS}
            disabled={disabled}
            size="sm"
            w="100%"
          />
        </Box>
      </SimpleGrid>

      <Box>
        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          description
        </Text>
        <Input
          size="sm"
          value={rule.description || ''}
          onChange={(e) => onChange({ ...rule, description: e.target.value })}
          placeholder="Rule description..."
          disabled={disabled}
          borderRadius="4px"
        />
      </Box>

      {/* 1. Interface Sub-Block */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        p={4}
      >
        <Flex align="center" justify="space-between" mb={showInterface ? 3 : 0}>
          <HStack gap={2}>
            <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
              {interfaceKey}
            </Text>
            <Text as="span" color="#dc2626">*</Text>
          </HStack>
          <ToggleSwitch
            checked={showInterface}
            onChange={handleToggleInterface}
            disabled={disabled}
          />
        </Flex>

        {showInterface && (
          <VStack gap={3} align="stretch" pt={1}>
            {interfaceOptions.length === 0 && (
              <Flex align="center" gap={2} p="8px 12px" bg="#fffbeb" border="1px solid" borderColor="#fef08a" borderRadius="6px" color="#92400e">
                <Icon name="alertTriangle" size={15} color="#d97706" />
                <Text fontSize="12px">
                  No interfaces found in Interfaces section. Please configure an interface or type the name.
                </Text>
              </Flex>
            )}

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Box>
                <HStack gap={1} mb={1}>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                    name
                  </Text>
                  <Text as="span" color="#dc2626">*</Text>
                </HStack>
                {interfaceOptions.length > 0 ? (
                  <SelectDropdown
                    value={currentInterfaceName}
                    onChange={(val) => {
                      if (isSnat && snatRule) {
                        onChange({
                          ...snatRule,
                          'out-interface': { ...snatRule['out-interface'], name: String(val) },
                        });
                      } else if (!isSnat && dnatRule) {
                        onChange({
                          ...dnatRule,
                          'in-interface': { ...dnatRule['in-interface'], name: String(val) },
                        });
                      }
                    }}
                    options={interfaceOptions}
                    disabled={disabled}
                    size="sm"
                    w="100%"
                  />
                ) : (
                  <Input
                    size="sm"
                    value={currentInterfaceName}
                    onChange={(e) => {
                      if (isSnat && snatRule) {
                        onChange({
                          ...snatRule,
                          'out-interface': { ...snatRule['out-interface'], name: e.target.value },
                        });
                      } else if (!isSnat && dnatRule) {
                        onChange({
                          ...dnatRule,
                          'in-interface': { ...dnatRule['in-interface'], name: e.target.value },
                        });
                      }
                    }}
                    placeholder="e.g. WAN or LAN"
                    disabled={disabled}
                    borderRadius="4px"
                  />
                )}
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  group (optional)
                </Text>
                <Input
                  size="sm"
                  value={
                    (isSnat ? snatRule?.['out-interface']?.group : dnatRule?.['in-interface']?.group) || ''
                  }
                  onChange={(e) => {
                    const groupVal = e.target.value;
                    if (isSnat && snatRule) {
                      onChange({
                        ...snatRule,
                        'out-interface': { ...snatRule['out-interface'], group: groupVal || undefined },
                      });
                    } else if (!isSnat && dnatRule) {
                      onChange({
                        ...dnatRule,
                        'in-interface': { ...dnatRule['in-interface'], group: groupVal || undefined },
                      });
                    }
                  }}
                  placeholder="e.g. wan-group"
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>
            </SimpleGrid>
          </VStack>
        )}
      </Box>

      {/* 2. Source Sub-Block */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        p={4}
      >
        <Flex align="center" justify="space-between" mb={showSource ? 3 : 0}>
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            source
          </Text>
          <ToggleSwitch
            checked={showSource}
            onChange={handleToggleSource}
            disabled={disabled}
          />
        </Flex>

        {showSource && (
          <VStack gap={3} align="stretch" pt={1}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  address
                </Text>
                <Input
                  size="sm"
                  value={rule.source?.address || ''}
                  onChange={(e) =>
                    onChange({
                      ...rule,
                      source: { ...(rule.source || {}), address: e.target.value || undefined },
                    })
                  }
                  placeholder="Example: 192.168.1.10"
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  port
                </Text>
                <Input
                  size="sm"
                  value={rule.source?.port || ''}
                  onChange={(e) =>
                    onChange({
                      ...rule,
                      source: { ...(rule.source || {}), port: e.target.value || undefined },
                    })
                  }
                  placeholder="Example: 80"
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  fqdn
                </Text>
                <Input
                  size="sm"
                  value={rule.source?.fqdn || ''}
                  onChange={(e) =>
                    onChange({
                      ...rule,
                      source: { ...(rule.source || {}), fqdn: e.target.value || undefined },
                    })
                  }
                  placeholder="Example: mydomain.com"
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>
            </SimpleGrid>

            {/* Source Groups Toggle */}
            <Box pt={2}>
              <Flex
                align="center"
                gap={2}
                cursor="pointer"
                onClick={() => setShowSourceGroups(!showSourceGroups)}
              >
                <Icon name={showSourceGroups ? 'chevronDown' : 'chevronRight'} size={14} color={themeColors.text.secondary} />
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                  Source Groups (Advanced)
                </Text>
              </Flex>

              {showSourceGroups && (
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={3} mt={2} p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor="#e2e8f0">
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      port-group
                    </Text>
                    <Input
                      size="sm"
                      value={rule.source?.group?.['port-group'] || ''}
                      onChange={(e) =>
                        onChange({
                          ...rule,
                          source: {
                            ...(rule.source || {}),
                            group: { ...(rule.source?.group || {}), 'port-group': e.target.value || undefined },
                          },
                        })
                      }
                      placeholder="e.g. web-ports"
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      network-group
                    </Text>
                    <Input
                      size="sm"
                      value={rule.source?.group?.['network-group'] || ''}
                      onChange={(e) =>
                        onChange({
                          ...rule,
                          source: {
                            ...(rule.source || {}),
                            group: { ...(rule.source?.group || {}), 'network-group': e.target.value || undefined },
                          },
                        })
                      }
                      placeholder="e.g. internal-nets"
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      mac-group
                    </Text>
                    <Input
                      size="sm"
                      value={rule.source?.group?.['mac-group'] || ''}
                      onChange={(e) =>
                        onChange({
                          ...rule,
                          source: {
                            ...(rule.source || {}),
                            group: { ...(rule.source?.group || {}), 'mac-group': e.target.value || undefined },
                          },
                        })
                      }
                      placeholder="e.g. trusted-macs"
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      domain-group
                    </Text>
                    <Input
                      size="sm"
                      value={rule.source?.group?.['domain-group'] || ''}
                      onChange={(e) =>
                        onChange({
                          ...rule,
                          source: {
                            ...(rule.source || {}),
                            group: { ...(rule.source?.group || {}), 'domain-group': e.target.value || undefined },
                          },
                        })
                      }
                      placeholder="e.g. allow-domains"
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      address-group
                    </Text>
                    <Input
                      size="sm"
                      value={rule.source?.group?.['address-group'] || ''}
                      onChange={(e) =>
                        onChange({
                          ...rule,
                          source: {
                            ...(rule.source || {}),
                            group: { ...(rule.source?.group || {}), 'address-group': e.target.value || undefined },
                          },
                        })
                      }
                      placeholder="e.g. office-ips"
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                </SimpleGrid>
              )}
            </Box>
          </VStack>
        )}
      </Box>

      {/* 3. Destination Sub-Block */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        p={4}
      >
        <Flex align="center" justify="space-between" mb={showDestination ? 3 : 0}>
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            destination
          </Text>
          <ToggleSwitch
            checked={showDestination}
            onChange={handleToggleDestination}
            disabled={disabled}
          />
        </Flex>

        {showDestination && (
          <VStack gap={3} align="stretch" pt={1}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  address
                </Text>
                <Input
                  size="sm"
                  value={rule.destination?.address || ''}
                  onChange={(e) =>
                    onChange({
                      ...rule,
                      destination: { ...(rule.destination || {}), address: e.target.value || undefined },
                    })
                  }
                  placeholder="Example: 192.168.1.10"
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  port
                </Text>
                <Input
                  size="sm"
                  value={rule.destination?.port || ''}
                  onChange={(e) =>
                    onChange({
                      ...rule,
                      destination: { ...(rule.destination || {}), port: e.target.value || undefined },
                    })
                  }
                  placeholder="Example: 80"
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  fqdn
                </Text>
                <Input
                  size="sm"
                  value={rule.destination?.fqdn || ''}
                  onChange={(e) =>
                    onChange({
                      ...rule,
                      destination: { ...(rule.destination || {}), fqdn: e.target.value || undefined },
                    })
                  }
                  placeholder="Example: mydomain.com"
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>
            </SimpleGrid>

            {/* Destination Groups Toggle */}
            <Box pt={2}>
              <Flex
                align="center"
                gap={2}
                cursor="pointer"
                onClick={() => setShowDestGroups(!showDestGroups)}
              >
                <Icon name={showDestGroups ? 'chevronDown' : 'chevronRight'} size={14} color={themeColors.text.secondary} />
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                  Destination Groups (Advanced)
                </Text>
              </Flex>

              {showDestGroups && (
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={3} mt={2} p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor="#e2e8f0">
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      port-group
                    </Text>
                    <Input
                      size="sm"
                      value={rule.destination?.group?.['port-group'] || ''}
                      onChange={(e) =>
                        onChange({
                          ...rule,
                          destination: {
                            ...(rule.destination || {}),
                            group: { ...(rule.destination?.group || {}), 'port-group': e.target.value || undefined },
                          },
                        })
                      }
                      placeholder="e.g. web-ports"
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      network-group
                    </Text>
                    <Input
                      size="sm"
                      value={rule.destination?.group?.['network-group'] || ''}
                      onChange={(e) =>
                        onChange({
                          ...rule,
                          destination: {
                            ...(rule.destination || {}),
                            group: { ...(rule.destination?.group || {}), 'network-group': e.target.value || undefined },
                          },
                        })
                      }
                      placeholder="e.g. internal-nets"
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      mac-group
                    </Text>
                    <Input
                      size="sm"
                      value={rule.destination?.group?.['mac-group'] || ''}
                      onChange={(e) =>
                        onChange({
                          ...rule,
                          destination: {
                            ...(rule.destination || {}),
                            group: { ...(rule.destination?.group || {}), 'mac-group': e.target.value || undefined },
                          },
                        })
                      }
                      placeholder="e.g. trusted-macs"
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      domain-group
                    </Text>
                    <Input
                      size="sm"
                      value={rule.destination?.group?.['domain-group'] || ''}
                      onChange={(e) =>
                        onChange({
                          ...rule,
                          destination: {
                            ...(rule.destination || {}),
                            group: { ...(rule.destination?.group || {}), 'domain-group': e.target.value || undefined },
                          },
                        })
                      }
                      placeholder="e.g. allow-domains"
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      address-group
                    </Text>
                    <Input
                      size="sm"
                      value={rule.destination?.group?.['address-group'] || ''}
                      onChange={(e) =>
                        onChange({
                          ...rule,
                          destination: {
                            ...(rule.destination || {}),
                            group: { ...(rule.destination?.group || {}), 'address-group': e.target.value || undefined },
                          },
                        })
                      }
                      placeholder="e.g. office-ips"
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                </SimpleGrid>
              )}
            </Box>
          </VStack>
        )}
      </Box>

      {/* 4. Translation Sub-Block */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        p={4}
      >
        <Flex align="center" justify="space-between" mb={showTranslation ? 3 : 0}>
          <HStack gap={2}>
            <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
              translation
            </Text>
            <Text as="span" color="#dc2626">*</Text>
          </HStack>
          <ToggleSwitch
            checked={showTranslation}
            onChange={handleToggleTranslation}
            disabled={disabled}
          />
        </Flex>

        {showTranslation && (
          <VStack gap={3} align="stretch" pt={1}>
            <SimpleGrid columns={{ base: 1, md: isSnat ? 2 : 3 }} gap={4}>
              <Box>
                <HStack gap={1} mb={1}>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                    address
                  </Text>
                  <Text as="span" color="#dc2626">*</Text>
                </HStack>
                <Input
                  size="sm"
                  value={rule.translation?.address || ''}
                  onChange={(e) => {
                    const addressVal = e.target.value;
                    if (isSnat && snatRule) {
                      onChange({
                        ...snatRule,
                        translation: { ...(snatRule.translation || {}), address: addressVal },
                      });
                    } else if (!isSnat && dnatRule) {
                      onChange({
                        ...dnatRule,
                        translation: { ...(dnatRule.translation || {}), address: addressVal },
                      });
                    }
                  }}
                  placeholder={isSnat ? 'Example: masquerade or 192.168.1.100' : 'Example: 192.168.1.100'}
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  port
                </Text>
                <Input
                  size="sm"
                  value={rule.translation?.port || ''}
                  onChange={(e) => {
                    const portVal = e.target.value;
                    if (isSnat && snatRule) {
                      onChange({
                        ...snatRule,
                        translation: { ...(snatRule.translation || {}), port: portVal || undefined },
                      });
                    } else if (!isSnat && dnatRule) {
                      onChange({
                        ...dnatRule,
                        translation: { ...(dnatRule.translation || {}), port: portVal || undefined },
                      });
                    }
                  }}
                  placeholder="Example: 80"
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>

              {!isSnat && (
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    redirect.port
                  </Text>
                  <Input
                    size="sm"
                    value={dnatRule?.translation?.redirect?.port || ''}
                    onChange={(e) => {
                      const redPort = e.target.value;
                      if (dnatRule) {
                        onChange({
                          ...dnatRule,
                          translation: {
                            ...(dnatRule.translation || {}),
                            redirect: redPort ? { port: redPort } : undefined,
                          },
                        });
                      }
                    }}
                    placeholder="Example: 8080"
                    disabled={disabled}
                    borderRadius="4px"
                  />
                </Box>
              )}
            </SimpleGrid>

            {/* Translation Options */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} pt={2}>
              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  options.port-mapping
                </Text>
                <SelectDropdown
                  value={rule.translation?.options?.['port-mapping'] || 'none'}
                  onChange={(val) => {
                    const opt = {
                      ...(rule.translation?.options || {}),
                      'port-mapping': String(val),
                    };
                    if (isSnat && snatRule) {
                      onChange({
                        ...snatRule,
                        translation: { ...snatRule.translation, options: opt },
                      });
                    } else if (!isSnat && dnatRule) {
                      onChange({
                        ...dnatRule,
                        translation: { ...dnatRule.translation, options: opt },
                      });
                    }
                  }}
                  options={PORT_MAPPING_OPTIONS}
                  disabled={disabled}
                  size="sm"
                  w="100%"
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  options.address-mapping
                </Text>
                <SelectDropdown
                  value={rule.translation?.options?.['address-mapping'] || 'random'}
                  onChange={(val) => {
                    const opt = {
                      ...(rule.translation?.options || {}),
                      'address-mapping': String(val),
                    };
                    if (isSnat && snatRule) {
                      onChange({
                        ...snatRule,
                        translation: { ...snatRule.translation, options: opt },
                      });
                    } else if (!isSnat && dnatRule) {
                      onChange({
                        ...dnatRule,
                        translation: { ...dnatRule.translation, options: opt },
                      });
                    }
                  }}
                  options={ADDRESS_MAPPING_OPTIONS}
                  disabled={disabled}
                  size="sm"
                  w="100%"
                />
              </Box>
            </SimpleGrid>
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

