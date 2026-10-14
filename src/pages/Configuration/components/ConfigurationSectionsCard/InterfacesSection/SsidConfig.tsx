import React, { useRef, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import {
  CAPTIVE_PORTAL_OPTIONS,
  ENCRYPTION_OPTIONS,
  ENCRYPTION_PROTOS_REQUIRE_IEEE,
  ENCRYPTION_PROTOS_REQUIRE_KEY,
  ENCRYPTION_PROTOS_REQUIRE_RADIUS,
  IEEE_80211W_OPTIONS,
  NO_MULTI_PROTOS,
  ROAMING_OPTIONS,
  SSID_BSS_MODES,
  SSID_PURPOSE_OPTIONS,
  SSID_SERVICES_OPTIONS,
  WIFI_BANDS,
  getDefaultSsid,
} from './interfacesConstants';
import { MultiPskModal } from './MultiPskModal';
import type { SingleSsidConfigItem } from '../types';

interface SsidConfigProps {
  ssids: SingleSsidConfigItem[];
  onChange: (ssids: SingleSsidConfigItem[]) => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

interface MultiSelectPillsProps {
  label?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MultiSelectPills: React.FC<MultiSelectPillsProps> = ({
  label,
  required,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (val: string) => {
    if (disabled) return;
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) onChange([]);
  };

  return (
    <Box position="relative" ref={containerRef}>
      {label && (
        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          {label} {required && <Text as="span" color="#dc2626">*</Text>}
        </Text>
      )}
      <Flex
        align="center"
        justify="space-between"
        minH="36px"
        px={2}
        py={1}
        border="1px solid"
        borderColor="#cbd5e1"
        borderRadius="4px"
        bg="#ffffff"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        _hover={disabled ? {} : { borderColor: '#94a3b8' }}
      >
        <Flex wrap="wrap" gap={1} align="center" flex={1}>
          {selectedValues.length === 0 ? (
            <Text fontSize="12px" color="#94a3b8">
              {placeholder}
            </Text>
          ) : (
            selectedValues.map((val) => {
              const opt = options.find((o) => o.value === val);
              const optLabel = opt ? opt.label : val;
              return (
                <Box
                  key={val}
                  display="inline-flex"
                  alignItems="center"
                  gap={1}
                  px={1.5}
                  py={0.5}
                  borderRadius="4px"
                  bg="#e2e8f0"
                  color="#334155"
                  fontSize="11px"
                  fontWeight="600"
                >
                  <Text>{optLabel}</Text>
                  <Box
                    as="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(val);
                    }}
                    cursor="pointer"
                    color="#64748b"
                    _hover={{ color: '#0f172a' }}
                  >
                    ×
                  </Box>
                </Box>
              );
            })
          )}
        </Flex>

        <Flex align="center" gap={1} ml={1}>
          {selectedValues.length > 0 && !disabled && (
            <Box
              as="button"
              onClick={handleClear}
              cursor="pointer"
              color="#94a3b8"
              _hover={{ color: '#475569' }}
              p={0.5}
            >
              ×
            </Box>
          )}
          <Box color="#64748b" transform={isOpen ? 'rotate(180deg)' : 'none'} transition="transform 0.2s">
            <Icon name="chevronDown" size={14} />
          </Box>
        </Flex>
      </Flex>

      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="#ffffff"
          border="1px solid"
          borderColor="#cbd5e1"
          borderRadius="6px"
          boxShadow="0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)"
          zIndex={100}
          maxH="200px"
          overflowY="auto"
          py={1}
        >
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.value);
            return (
              <Flex
                key={opt.value}
                align="center"
                justify="space-between"
                px={3}
                py={1.5}
                fontSize="12px"
                cursor="pointer"
                bg={isSelected ? '#eff6ff' : 'transparent'}
                color={isSelected ? '#1d4ed8' : '#334155'}
                _hover={{ bg: '#f1f5f9' }}
                onClick={() => handleToggle(opt.value)}
              >
                <Text fontWeight={isSelected ? '600' : '400'}>{opt.label}</Text>
                {isSelected && <Icon name="check" size={13} />}
              </Flex>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export const SsidConfig: React.FC<SsidConfigProps> = ({
  ssids,
  onChange,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const [selectedSsidId, setSelectedSsidId] = useState<string>(() => ssids[0]?.id || '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isMultiPskModalOpen, setIsMultiPskModalOpen] = useState<boolean>(false);

  const activeSsid = ssids.find((s) => s.id === selectedSsidId) || ssids[0];
  const activeIndex = activeSsid ? ssids.findIndex((s) => s.id === activeSsid.id) : 0;

  const handleAddSsid = () => {
    const newSsid = getDefaultSsid(ssids.length);
    onChange([...ssids, newSsid]);
    setSelectedSsidId(newSsid.id);
  };

  const handleUpdateSsid = (updated: SingleSsidConfigItem) => {
    onChange(ssids.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSsid = (id: string) => {
    const filtered = ssids.filter((s) => s.id !== id);
    onChange(filtered);
    if (selectedSsidId === id) {
      setSelectedSsidId(filtered[0]?.id || '');
    }
  };

  const isKeyNeeded = activeSsid
    ? ENCRYPTION_PROTOS_REQUIRE_KEY.includes(activeSsid.encryption.proto)
    : false;

  const needIeee = activeSsid
    ? ENCRYPTION_PROTOS_REQUIRE_IEEE.includes(activeSsid.encryption.proto)
    : false;

  const isUsingRadius = activeSsid
    ? ENCRYPTION_PROTOS_REQUIRE_RADIUS.includes(activeSsid.encryption.proto)
    : false;

  const canUseMultiPsk = activeSsid
    ? !NO_MULTI_PROTOS.includes(activeSsid.encryption.proto)
    : false;

  return (
    <Box
      border="1px solid"
      borderColor="#cbd5e1"
      borderRadius="8px"
      bg="#ffffff"
      p={4}
      mt={4}
    >
      {/* Card Header: SSIDs */}
      <Text fontSize="15px" fontWeight="700" color={themeColors.text.title} mb={3}>
        SSIDs
      </Text>

      {/* Tabs Row with + Button */}
      <Flex align="center" gap={2} mb={4} wrap="wrap">
        {ssids.map((ssid) => {
          const isActive = activeSsid?.id === ssid.id;
          const bandStr = ssid.wifiBands && ssid.wifiBands.length > 0
            ? ssid.wifiBands.join(', ')
            : '2G, 5G';
          const tabLabel = ssid.name ? `${ssid.name} (${bandStr})` : `(${bandStr})`;

          return (
            <Box
              key={ssid.id}
              as="button"
              px={3.5}
              py={1.5}
              borderRadius="6px"
              border="1px solid"
              borderColor={isActive ? '#2563eb' : '#cbd5e1'}
              bg={isActive ? '#ffffff' : '#f8fafc'}
              color={isActive ? '#2563eb' : '#64748b'}
              fontSize="12px"
              fontWeight="700"
              cursor="pointer"
              _hover={isActive ? {} : { bg: '#f1f5f9' }}
              onClick={() => setSelectedSsidId(ssid.id)}
            >
              {tabLabel}
            </Box>
          );
        })}

        {!disabled && (
          <Box
            as="button"
            w="32px"
            h="32px"
            borderRadius="6px"
            bg="#2563eb"
            color="#ffffff"
            display="grid"
            placeItems="center"
            cursor="pointer"
            _hover={{ bg: '#1d4ed8' }}
            onClick={handleAddSsid}
            title="Add SSID"
          >
            <Icon name="plus" size={16} />
          </Box>
        )}
      </Flex>

      {/* Active SSID Content */}
      {activeSsid && (
        <Box>
          {/* Header row: #{index}, Resource Picker, and Delete Button */}
          <Flex align="center" justify="space-between" mb={4}>
            <HStack gap={3}>
              <Text fontSize="14px" fontWeight="700" color="#0f172a">
                #{activeIndex}
              </Text>
              <Box title={isDefaultConfig ? 'Resource profiles cannot be bound to default configurations' : undefined}>
                <SelectDropdown
                  value={activeSsid.resource || ''}
                  onChange={(val) =>
                    handleUpdateSsid({ ...activeSsid, resource: val as string })
                  }
                  options={[
                    { value: '', label: 'No Resource Selected' },
                  ]}
                  disabled={disabled || isDefaultConfig}
                  w="200px"
                />
              </Box>
            </HStack>

            {!disabled && (
              <Box
                as="button"
                w="30px"
                h="30px"
                borderRadius="6px"
                bg="#dc2626"
                color="#ffffff"
                display="grid"
                placeItems="center"
                cursor="pointer"
                _hover={{ bg: '#b91c1c' }}
                onClick={() => handleDeleteSsid(activeSsid.id)}
                title="Delete SSID"
              >
                <Icon name="trash" size={15} />
              </Box>
            )}
          </Flex>

          {/* Row 1: SSID *, bss-mode *, wifi-bands * */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
            <Box>
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                SSID <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                value={activeSsid.name}
                onChange={(e) =>
                  handleUpdateSsid({ ...activeSsid, name: e.target.value })
                }
                disabled={disabled}
                borderRadius="4px"
                borderColor="#cbd5e1"
              />
            </Box>

            <Box>
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                bss-mode <Text as="span" color="#dc2626">*</Text>
              </Text>
              <SelectDropdown
                value={activeSsid.bssMode}
                onChange={(val) =>
                  handleUpdateSsid({
                    ...activeSsid,
                    bssMode: val as SingleSsidConfigItem['bssMode'],
                  })
                }
                options={SSID_BSS_MODES}
                disabled={disabled}
                w="100%"
              />
            </Box>

            <MultiSelectPills
              label="wifi-bands"
              required
              options={WIFI_BANDS.map((b) => ({ value: b, label: b }))}
              selectedValues={activeSsid.wifiBands || []}
              onChange={(bands) =>
                handleUpdateSsid({
                  ...activeSsid,
                  wifiBands: bands as SingleSsidConfigItem['wifiBands'],
                })
              }
              disabled={disabled}
            />
          </SimpleGrid>

          {/* Authentication Section */}
          <Box mb={4}>
            <Box borderBottom="1px solid #cbd5e1" pb={1} mb={3}>
              <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                Authentication
              </Text>
            </Box>

            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={4} alignItems="flex-end">
              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  protocol <Text as="span" color="#dc2626">*</Text>
                </Text>
                <SelectDropdown
                  value={activeSsid.encryption.proto}
                  onChange={(val) => {
                    const newProto = String(val);
                    const newKey = ENCRYPTION_PROTOS_REQUIRE_KEY.includes(newProto)
                      ? activeSsid.encryption.key || 'YOUR_SECRET'
                      : undefined;
                    const newIeee = ENCRYPTION_PROTOS_REQUIRE_IEEE.includes(newProto)
                      ? activeSsid.encryption.ieee80211w || 'disabled'
                      : undefined;

                    handleUpdateSsid({
                      ...activeSsid,
                      encryption: {
                        ...activeSsid.encryption,
                        proto: newProto,
                        key: newKey,
                        ieee80211w: newIeee,
                      },
                    });
                  }}
                  options={ENCRYPTION_OPTIONS}
                  disabled={disabled}
                  w="100%"
                />
              </Box>

              {isKeyNeeded && (
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    key <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Flex align="center" position="relative">
                    <Input
                      size="sm"
                      type={showPassword ? 'text' : 'password'}
                      value={activeSsid.encryption.key ?? ''}
                      onChange={(e) =>
                        handleUpdateSsid({
                          ...activeSsid,
                          encryption: { ...activeSsid.encryption, key: e.target.value },
                        })
                      }
                      disabled={disabled}
                      borderRadius="4px"
                      borderColor="#cbd5e1"
                      pr="56px"
                    />
                    <Box
                      as="button"
                      position="absolute"
                      right="6px"
                      px={2}
                      py={0.5}
                      borderRadius="4px"
                      border="1px solid"
                      borderColor="#cbd5e1"
                      bg="#f1f5f9"
                      fontSize="10px"
                      fontWeight="600"
                      color="#475569"
                      cursor="pointer"
                      _hover={{ bg: '#e2e8f0' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Box>
                  </Flex>
                </Box>
              )}

              {needIeee && (
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    ieee80211w <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <SelectDropdown
                    value={activeSsid.encryption.ieee80211w || 'disabled'}
                    onChange={(val) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        encryption: {
                          ...activeSsid.encryption,
                          ieee80211w: val as SingleSsidConfigItem['encryption']['ieee80211w'],
                        },
                      })
                    }
                    options={IEEE_80211W_OPTIONS}
                    disabled={disabled}
                    w="100%"
                  />
                </Box>
              )}

              <Box pb={2}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  key-caching
                </Text>
                <ToggleSwitch
                  checked={activeSsid.encryption.keyCaching !== false}
                  onChange={(val) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      encryption: { ...activeSsid.encryption, keyCaching: val },
                    })
                  }
                  disabled={disabled}
                />
              </Box>
            </SimpleGrid>

            {/* RADIUS Config if applicable */}
            {isUsingRadius && (
              <Box mt={3} p={3} bg="#f8fafc" border="1px dashed" borderColor="#cbd5e1" borderRadius="6px">
                <Text fontSize="11px" fontWeight="700" color={themeColors.text.title} mb={2}>
                  RADIUS Configuration
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3}>
                  <Box>
                    <Text fontSize="10px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      Server Host / IP
                    </Text>
                    <Input
                      size="sm"
                      value={activeSsid.radius?.server || ''}
                      onChange={(e) =>
                        handleUpdateSsid({
                          ...activeSsid,
                          radius: { ...activeSsid.radius, server: e.target.value },
                        })
                      }
                      placeholder="192.168.1.10"
                      disabled={disabled}
                      borderRadius="4px"
                      borderColor="#cbd5e1"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="10px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      Port
                    </Text>
                    <Input
                      size="sm"
                      type="number"
                      value={activeSsid.radius?.port ?? 1812}
                      onChange={(e) =>
                        handleUpdateSsid({
                          ...activeSsid,
                          radius: {
                            ...activeSsid.radius,
                            port: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      disabled={disabled}
                      borderRadius="4px"
                      borderColor="#cbd5e1"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="10px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      Secret
                    </Text>
                    <Input
                      size="sm"
                      type="password"
                      value={activeSsid.radius?.secret || ''}
                      onChange={(e) =>
                        handleUpdateSsid({
                          ...activeSsid,
                          radius: { ...activeSsid.radius, secret: e.target.value },
                        })
                      }
                      placeholder="RADIUS Secret"
                      disabled={disabled}
                      borderRadius="4px"
                      borderColor="#cbd5e1"
                    />
                  </Box>
                </SimpleGrid>
              </Box>
            )}
          </Box>

          {/* Pass Point Section */}
          <Box mb={4}>
            <Flex align="center" gap={3} my={2}>
              <Text
                fontSize="13px"
                fontWeight="700"
                color={themeColors.text.title}
                borderBottom="1px solid #0f172a"
              >
                Pass Point
              </Text>
              <ToggleSwitch
                checked={Boolean(activeSsid.passPoint?.enabled)}
                onChange={(val) =>
                  handleUpdateSsid({
                    ...activeSsid,
                    passPoint: { ...activeSsid.passPoint, enabled: val },
                  })
                }
                disabled={disabled}
              />
            </Flex>

            {activeSsid.passPoint?.enabled && (
              <Box p={3} bg="#f8fafc" border="1px solid" borderColor="#e2e8f0" borderRadius="6px" mt={2}>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={3}>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      venue-name
                    </Text>
                    <Input
                      size="sm"
                      placeholder="eng:Example passpoint_venue"
                      value={activeSsid.passPoint.venueName?.join(', ') || ''}
                      onChange={(e) =>
                        handleUpdateSsid({
                          ...activeSsid,
                          passPoint: {
                            ...activeSsid.passPoint,
                            venueName: e.target.value ? e.target.value.split(',').map((x) => x.trim()) : [],
                          },
                        })
                      }
                      disabled={disabled}
                      borderRadius="4px"
                      borderColor="#cbd5e1"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      venue-url
                    </Text>
                    <Input
                      size="sm"
                      placeholder="http://www.example.com/info-fra"
                      value={activeSsid.passPoint.venueUrl?.join(', ') || ''}
                      onChange={(e) =>
                        handleUpdateSsid({
                          ...activeSsid,
                          passPoint: {
                            ...activeSsid.passPoint,
                            venueUrl: e.target.value ? e.target.value.split(',').map((x) => x.trim()) : [],
                          },
                        })
                      }
                      disabled={disabled}
                      borderRadius="4px"
                      borderColor="#cbd5e1"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                      domain-name
                    </Text>
                    <Input
                      size="sm"
                      placeholder="test.com"
                      value={activeSsid.passPoint.domainName?.join(', ') || ''}
                      onChange={(e) =>
                        handleUpdateSsid({
                          ...activeSsid,
                          passPoint: {
                            ...activeSsid.passPoint,
                            domainName: e.target.value ? e.target.value.split(',').map((x) => x.trim()) : [],
                          },
                        })
                      }
                      disabled={disabled}
                      borderRadius="4px"
                      borderColor="#cbd5e1"
                    />
                  </Box>
                </SimpleGrid>
              </Box>
            )}
          </Box>

          {/* Advanced Settings Section */}
          <Box mb={4}>
            <Box borderBottom="1px solid #cbd5e1" pb={1} mb={3}>
              <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                Advanced Settings
              </Text>
            </Box>

            {/* Row 1 of Advanced Settings */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} gap={4} mb={3} alignItems="flex-end">
              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  hidden-ssid <Text as="span" color="#dc2626">*</Text>
                </Text>
                <ToggleSwitch
                  checked={activeSsid.advanced.hiddenSsid}
                  onChange={(val) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: { ...activeSsid.advanced, hiddenSsid: val },
                    })
                  }
                  disabled={disabled}
                />
              </Box>

              <MultiSelectPills
                label="services"
                options={SSID_SERVICES_OPTIONS}
                selectedValues={activeSsid.advanced.services || []}
                onChange={(services) =>
                  handleUpdateSsid({
                    ...activeSsid,
                    advanced: { ...activeSsid.advanced, services },
                  })
                }
                placeholder="Select..."
                disabled={disabled}
              />

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  maximum-clients <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  type="number"
                  value={activeSsid.advanced.maximumClients ?? 64}
                  onChange={(e) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: {
                        ...activeSsid.advanced,
                        maximumClients: Number(e.target.value),
                      },
                    })
                  }
                  disabled={disabled}
                  borderRadius="4px"
                  borderColor="#cbd5e1"
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  fils-discovery-interval
                </Text>
                <Input
                  size="sm"
                  type="number"
                  value={activeSsid.advanced.filsDiscoveryInterval ?? 20}
                  onChange={(e) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: {
                        ...activeSsid.advanced,
                        filsDiscoveryInterval: Number(e.target.value),
                      },
                    })
                  }
                  disabled={disabled}
                  borderRadius="4px"
                  borderColor="#cbd5e1"
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  purpose
                </Text>
                <SelectDropdown
                  value={activeSsid.advanced.purpose || ''}
                  onChange={(val) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: {
                        ...activeSsid.advanced,
                        purpose: String(val),
                      },
                    })
                  }
                  options={SSID_PURPOSE_OPTIONS}
                  disabled={disabled}
                  w="100%"
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  dtim-period
                </Text>
                <Input
                  size="sm"
                  type="number"
                  value={activeSsid.advanced.dtimPeriod ?? 2}
                  onChange={(e) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: {
                        ...activeSsid.advanced,
                        dtimPeriod: Number(e.target.value),
                      },
                    })
                  }
                  disabled={disabled}
                  borderRadius="4px"
                  borderColor="#cbd5e1"
                />
              </Box>
            </SimpleGrid>

            {/* Row 2 of Advanced Settings */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} gap={4} mb={3}>
              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  isolate-clients <Text as="span" color="#dc2626">*</Text>
                </Text>
                <ToggleSwitch
                  checked={activeSsid.advanced.isolateClients}
                  onChange={(val) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: { ...activeSsid.advanced, isolateClients: val },
                    })
                  }
                  disabled={disabled}
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  power-save
                </Text>
                <ToggleSwitch
                  checked={Boolean(activeSsid.advanced.powerSave)}
                  onChange={(val) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: { ...activeSsid.advanced, powerSave: val },
                    })
                  }
                  disabled={disabled}
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  broadcast-time
                </Text>
                <ToggleSwitch
                  checked={Boolean(activeSsid.advanced.broadcastTime)}
                  onChange={(val) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: { ...activeSsid.advanced, broadcastTime: val },
                    })
                  }
                  disabled={disabled}
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  unicast-conversion
                </Text>
                <ToggleSwitch
                  checked={Boolean(activeSsid.advanced.unicastConversion)}
                  onChange={(val) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: { ...activeSsid.advanced, unicastConversion: val },
                    })
                  }
                  disabled={disabled}
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  proxy-arp
                </Text>
                <ToggleSwitch
                  checked={Boolean(activeSsid.advanced.proxyArp)}
                  onChange={(val) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: { ...activeSsid.advanced, proxyArp: val },
                    })
                  }
                  disabled={disabled}
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  disassoc-low-ack
                </Text>
                <ToggleSwitch
                  checked={Boolean(activeSsid.advanced.disassocLowAck)}
                  onChange={(val) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: { ...activeSsid.advanced, disassocLowAck: val },
                    })
                  }
                  disabled={disabled}
                />
              </Box>
            </SimpleGrid>

            {/* Row 3 of Advanced Settings */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} gap={4} alignItems="flex-end">
              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  vendor-elements
                </Text>
                <Input
                  size="sm"
                  value={activeSsid.advanced.vendorElements || ''}
                  onChange={(e) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: { ...activeSsid.advanced, vendorElements: e.target.value },
                    })
                  }
                  disabled={disabled}
                  borderRadius="4px"
                  borderColor="#cbd5e1"
                />
              </Box>

              <Box pb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  tip-information-element
                </Text>
                <ToggleSwitch
                  checked={activeSsid.advanced.tipInformationElement !== false}
                  onChange={(val) =>
                    handleUpdateSsid({
                      ...activeSsid,
                      advanced: { ...activeSsid.advanced, tipInformationElement: val },
                    })
                  }
                  disabled={disabled}
                />
              </Box>

              {canUseMultiPsk && (
                <Box pb={1}>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    multi-psk <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Box
                    as="button"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    px={3}
                    py={1.5}
                    borderRadius="6px"
                    bg="#2563eb"
                    color="#ffffff"
                    fontSize="11px"
                    fontWeight="600"
                    cursor={disabled ? 'not-allowed' : 'pointer'}
                    _hover={disabled ? {} : { bg: '#1d4ed8' }}
                    onClick={() => !disabled && setIsMultiPskModalOpen(true)}
                  >
                    Manage multi-psk ({activeSsid.advanced.multiPsk?.length || 0} entries)
                  </Box>
                </Box>
              )}
            </SimpleGrid>
          </Box>

          {/* Rate Limit Section */}
          <Box mb={4}>
            <Flex align="center" gap={3} mt={4} mb={2}>
              <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                Rate Limit
              </Text>
              <ToggleSwitch
                checked={Boolean(activeSsid.rateLimit?.enabled)}
                onChange={(val) =>
                  handleUpdateSsid({
                    ...activeSsid,
                    rateLimit: { ...activeSsid.rateLimit, enabled: val },
                  })
                }
                disabled={disabled}
              />
            </Flex>

            {activeSsid.rateLimit?.enabled && (
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4} p={3} bg="#f8fafc" borderRadius="6px" border="1px solid #e2e8f0" mt={2}>
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    ingress-rate (MB/s) <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={activeSsid.rateLimit.ingressRate ?? 0}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        rateLimit: {
                          ...activeSsid.rateLimit,
                          ingressRate: Number(e.target.value),
                        },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    egress-rate (MB/s) <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={activeSsid.rateLimit.egressRate ?? 0}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        rateLimit: {
                          ...activeSsid.rateLimit,
                          egressRate: Number(e.target.value),
                        },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>
              </SimpleGrid>
            )}
          </Box>

          {/* RRM Section */}
          <Box mb={4}>
            <Flex align="center" gap={3} mt={3} mb={2}>
              <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                RRM
              </Text>
              <ToggleSwitch
                checked={Boolean(activeSsid.rrm?.enabled)}
                onChange={(val) =>
                  handleUpdateSsid({
                    ...activeSsid,
                    rrm: { ...activeSsid.rrm, enabled: val },
                  })
                }
                disabled={disabled}
              />
            </Flex>

            {activeSsid.rrm?.enabled && (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} p={3} bg="#f8fafc" borderRadius="6px" border="1px solid #e2e8f0" mt={2}>
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    neighbor-reporting
                  </Text>
                  <ToggleSwitch
                    checked={Boolean(activeSsid.rrm.neighborReporting)}
                    onChange={(val) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        rrm: { ...activeSsid.rrm, neighborReporting: val },
                      })
                    }
                    disabled={disabled}
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    lci
                  </Text>
                  <Input
                    size="sm"
                    value={activeSsid.rrm.lci || ''}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        rrm: { ...activeSsid.rrm, lci: e.target.value },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    civic-location
                  </Text>
                  <Input
                    size="sm"
                    value={activeSsid.rrm.civicLocation || ''}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        rrm: { ...activeSsid.rrm, civicLocation: e.target.value },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    ftm-responder
                  </Text>
                  <ToggleSwitch
                    checked={Boolean(activeSsid.rrm.ftmResponder)}
                    onChange={(val) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        rrm: { ...activeSsid.rrm, ftmResponder: val },
                      })
                    }
                    disabled={disabled}
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    stationary-ap
                  </Text>
                  <ToggleSwitch
                    checked={Boolean(activeSsid.rrm.stationaryAp)}
                    onChange={(val) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        rrm: { ...activeSsid.rrm, stationaryAp: val },
                      })
                    }
                    disabled={disabled}
                  />
                </Box>
              </SimpleGrid>
            )}
          </Box>

          {/* Captive Portal Section */}
          <Box mb={4}>
            <Flex align="center" gap={3} mt={3} mb={2}>
              <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                Captive Portal
              </Text>
              <SelectDropdown
                value={activeSsid.captivePortal?.mode || 'none'}
                onChange={(val) =>
                  handleUpdateSsid({
                    ...activeSsid,
                    captivePortal: { ...activeSsid.captivePortal, mode: String(val) },
                  })
                }
                options={CAPTIVE_PORTAL_OPTIONS}
                disabled={disabled}
                w="140px"
              />
            </Flex>

            {activeSsid.captivePortal?.mode && activeSsid.captivePortal.mode !== 'none' && (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} p={3} bg="#f8fafc" borderRadius="6px" border="1px solid #e2e8f0" mt={2}>
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    walled-garden-fqdn
                  </Text>
                  <Input
                    size="sm"
                    placeholder="Example: *.google.com"
                    value={activeSsid.captivePortal.walledGardenFqdn?.join(', ') || ''}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        captivePortal: {
                          ...activeSsid.captivePortal,
                          walledGardenFqdn: e.target.value ? e.target.value.split(',').map((x) => x.trim()) : [],
                        },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    walled-garden-ipaddr
                  </Text>
                  <Input
                    size="sm"
                    placeholder="Example: 192.168.0.1"
                    value={activeSsid.captivePortal.walledGardenIpaddr?.join(', ') || ''}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        captivePortal: {
                          ...activeSsid.captivePortal,
                          walledGardenIpaddr: e.target.value ? e.target.value.split(',').map((x) => x.trim()) : [],
                        },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    idle-timeout
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={activeSsid.captivePortal.idleTimeout ?? ''}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        captivePortal: {
                          ...activeSsid.captivePortal,
                          idleTimeout: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    session-timeout
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={activeSsid.captivePortal.sessionTimeout ?? ''}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        captivePortal: {
                          ...activeSsid.captivePortal,
                          sessionTimeout: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>
              </SimpleGrid>
            )}
          </Box>

          {/* Access Control List Section */}
          <Box mb={4}>
            <Flex align="center" gap={3} mt={3} mb={2}>
              <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                Access Control List
              </Text>
              <ToggleSwitch
                checked={Boolean(activeSsid.accessControlList?.enabled)}
                onChange={(val) =>
                  handleUpdateSsid({
                    ...activeSsid,
                    accessControlList: { ...activeSsid.accessControlList, enabled: val },
                  })
                }
                disabled={disabled}
              />
            </Flex>

            {activeSsid.accessControlList?.enabled && (
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4} p={3} bg="#f8fafc" borderRadius="6px" border="1px solid #e2e8f0" mt={2}>
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    mode <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <SelectDropdown
                    value={activeSsid.accessControlList.mode || 'allow'}
                    onChange={(val) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        accessControlList: {
                          ...activeSsid.accessControlList,
                          mode: val as 'allow' | 'deny',
                        },
                      })
                    }
                    options={[
                      { value: 'allow', label: 'Allow' },
                      { value: 'deny', label: 'Deny' },
                    ]}
                    disabled={disabled}
                    w="120px"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    mac-address <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Input
                    size="sm"
                    placeholder="11:22:33:44:55:66"
                    value={activeSsid.accessControlList.macAddress?.join(', ') || ''}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        accessControlList: {
                          ...activeSsid.accessControlList,
                          macAddress: e.target.value ? e.target.value.split(',').map((x) => x.trim()) : [],
                        },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>
              </SimpleGrid>
            )}
          </Box>

          {/* Roaming Section */}
          <Box mb={4}>
            <Flex align="center" gap={3} mt={3} mb={2}>
              <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                Roaming
              </Text>
              <SelectDropdown
                value={activeSsid.roaming?.state || 'off'}
                onChange={(val) =>
                  handleUpdateSsid({
                    ...activeSsid,
                    roaming: {
                      ...activeSsid.roaming,
                      state: val as 'on' | 'off' | 'custom',
                    },
                  })
                }
                options={ROAMING_OPTIONS}
                disabled={disabled}
                w="120px"
              />
            </Flex>

            {activeSsid.roaming?.state === 'custom' && (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} p={3} bg="#f8fafc" borderRadius="6px" border="1px solid #e2e8f0" mt={2}>
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    message-exchange <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <SelectDropdown
                    value={activeSsid.roaming.messageExchange || 'air'}
                    onChange={(val) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        roaming: {
                          ...activeSsid.roaming,
                          messageExchange: val as 'air' | 'ds',
                        },
                      })
                    }
                    options={[
                      { value: 'air', label: 'air' },
                      { value: 'ds', label: 'ds' },
                    ]}
                    disabled={disabled}
                    w="100%"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    generate-psk <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <ToggleSwitch
                    checked={Boolean(activeSsid.roaming.generatePsk)}
                    onChange={(val) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        roaming: {
                          ...activeSsid.roaming,
                          generatePsk: val,
                        },
                      })
                    }
                    disabled={disabled}
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    domain-identifier
                  </Text>
                  <Input
                    size="sm"
                    value={activeSsid.roaming.domainIdentifier || ''}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        roaming: {
                          ...activeSsid.roaming,
                          domainIdentifier: e.target.value,
                        },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    pmk-r0-key-holder
                  </Text>
                  <Input
                    size="sm"
                    value={activeSsid.roaming.pmkR0KeyHolder || ''}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        roaming: {
                          ...activeSsid.roaming,
                          pmkR0KeyHolder: e.target.value,
                        },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    pmk-r1-key-holder
                  </Text>
                  <Input
                    size="sm"
                    value={activeSsid.roaming.pmkR1KeyHolder || ''}
                    onChange={(e) =>
                      handleUpdateSsid({
                        ...activeSsid,
                        roaming: {
                          ...activeSsid.roaming,
                          pmkR1KeyHolder: e.target.value,
                        },
                      })
                    }
                    disabled={disabled}
                    borderRadius="4px"
                    borderColor="#cbd5e1"
                  />
                </Box>
              </SimpleGrid>
            )}
          </Box>

          {/* Multi-PSK Modal */}
          <MultiPskModal
            isOpen={isMultiPskModalOpen}
            onClose={() => setIsMultiPskModalOpen(false)}
            ssidName={activeSsid.name}
            multiPskList={activeSsid.advanced.multiPsk || []}
            onSave={(multiPsk) =>
              handleUpdateSsid({
                ...activeSsid,
                advanced: {
                  ...activeSsid.advanced,
                  multiPsk,
                },
              })
            }
            disabled={disabled}
          />
        </Box>
      )}
    </Box>
  );
};
