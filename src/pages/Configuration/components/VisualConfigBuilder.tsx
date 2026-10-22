import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import type { PlatformType } from '../types/configuration';
import type {
  VisualConfigFormState,
  RadioFormState,
  SsidFormState,
} from './defaultConfigGenerator';

interface VisualConfigBuilderProps {
  platform: PlatformType;
  visualState: VisualConfigFormState;
  onChange: (updated: VisualConfigFormState) => void;
  disabled?: boolean;
}

export const VisualConfigBuilder: React.FC<VisualConfigBuilderProps> = ({
  platform,
  visualState,
  onChange,
  disabled = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'radios' | 'interfaces' | 'services'>('radios');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // -------------------------------------------------------------
  // Radios handlers
  // -------------------------------------------------------------
  const handleUpdateRadio = (
    key: 'radio5G' | 'radio2G' | 'radio6G',
    field: keyof RadioFormState,
    value: unknown
  ) => {
    onChange({
      ...visualState,
      radios: {
        ...visualState.radios,
        [key]: {
          ...visualState.radios[key],
          [field]: value,
        },
      },
    });
  };

  // -------------------------------------------------------------
  // SSIDs handlers
  // -------------------------------------------------------------
  const handleAddSsid = () => {
    const newSsid: SsidFormState = {
      id: `ssid-${Date.now().toString(36)}`,
      name: `OpenWiFi-${visualState.ssids.length + 1}`,
      security: 'wpa2-psk',
      key: 'OpenWiFiPass123',
      bands: ['2G', '5G'],
      vlan: 0,
    };
    onChange({
      ...visualState,
      ssids: [...visualState.ssids, newSsid],
    });
  };

  const handleRemoveSsid = (id: string) => {
    if (visualState.ssids.length <= 1) return;
    onChange({
      ...visualState,
      ssids: visualState.ssids.filter((s) => s.id !== id),
    });
  };

  const handleUpdateSsid = (id: string, field: keyof SsidFormState, value: unknown) => {
    onChange({
      ...visualState,
      ssids: visualState.ssids.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    });
  };

  const toggleSsidBand = (ssidId: string, band: '2G' | '5G' | '6G') => {
    onChange({
      ...visualState,
      ssids: visualState.ssids.map((s) => {
        if (s.id !== ssidId) return s;
        const exists = s.bands.includes(band);
        const nextBands = exists
          ? s.bands.filter((b) => b !== band)
          : [...s.bands, band];
        return { ...s, bands: nextBands.length ? nextBands : [band] };
      }),
    });
  };

  // -------------------------------------------------------------
  // WAN / LAN handlers
  // -------------------------------------------------------------
  const handleUpdateWan = (field: 'addressing' | 'subnet' | 'ports', value: string) => {
    onChange({
      ...visualState,
      wan: { ...visualState.wan, [field]: value },
    });
  };

  const handleUpdateLan = (
    field: 'addressing' | 'subnet' | 'dhcpEnabled' | 'ports',
    value: string | boolean
  ) => {
    onChange({
      ...visualState,
      lan: { ...visualState.lan, [field]: value },
    });
  };

  // -------------------------------------------------------------
  // Services & Metrics handlers
  // -------------------------------------------------------------
  const handleUpdateServices = (
    field: 'ssh' | 'sshPort' | 'lldp' | 'lldpDescription',
    value: string | number | boolean
  ) => {
    onChange({
      ...visualState,
      services: { ...visualState.services, [field]: value },
    });
  };

  const handleUpdateMetrics = (
    field: 'statsInterval' | 'healthInterval',
    value: number
  ) => {
    onChange({
      ...visualState,
      metrics: { ...visualState.metrics, [field]: value },
    });
  };

  // -------------------------------------------------------------
  // Switch handlers
  // -------------------------------------------------------------
  const handleUpdateSwitch = (
    field: 'upstreamPort' | 'downstreamPorts' | 'vlanId',
    value: string | number
  ) => {
    onChange({
      ...visualState,
      switchConfig: { ...visualState.switchConfig, [field]: value },
    });
  };

  return (
    <Box>
      {/* Sub-tabs header */}
      <HStack
        gap={1}
        mb={3}
        pb={2}
        borderBottom="1px solid"
        borderColor={themeColors.panel.divider}
      >
        {platform === 'ap' && (
          <Button
            size="xs"
            variant={activeSubTab === 'radios' ? 'solid' : 'ghost'}
            bg={activeSubTab === 'radios' ? themeColors.brand.accent : 'transparent'}
            color={activeSubTab === 'radios' ? '#ffffff' : themeColors.text.secondary}
            onClick={() => setActiveSubTab('radios')}
            borderRadius="4px"
            h="28px"
            px={3}
          >
            <Icon name="radio" size={13} />
            <Text ml={1.5} fontWeight="600">
              Radio Bands
            </Text>
          </Button>
        )}

        <Button
          size="xs"
          variant={activeSubTab === 'interfaces' ? 'solid' : 'ghost'}
          bg={activeSubTab === 'interfaces' ? themeColors.brand.accent : 'transparent'}
          color={activeSubTab === 'interfaces' ? '#ffffff' : themeColors.text.secondary}
          onClick={() => setActiveSubTab('interfaces')}
          borderRadius="4px"
          h="28px"
          px={3}
        >
          <Icon name="wifi" size={13} />
          <Text ml={1.5} fontWeight="600">
            {platform === 'switch' ? 'Ports & VLANs' : 'Interfaces & SSIDs'}
          </Text>
        </Button>

        <Button
          size="xs"
          variant={activeSubTab === 'services' ? 'solid' : 'ghost'}
          bg={activeSubTab === 'services' ? themeColors.brand.accent : 'transparent'}
          color={activeSubTab === 'services' ? '#ffffff' : themeColors.text.secondary}
          onClick={() => setActiveSubTab('services')}
          borderRadius="4px"
          h="28px"
          px={3}
        >
          <Icon name="settings" size={13} />
          <Text ml={1.5} fontWeight="600">
            Services & Metrics
          </Text>
        </Button>
      </HStack>

      {/* --------------------------------------------------------- */}
      {/* 1. RADIOS TAB (AP Platform) */}
      {/* --------------------------------------------------------- */}
      {activeSubTab === 'radios' && platform === 'ap' && (
        <VStack gap={3} align="stretch">
          {/* 5 GHz Radio */}
          <Box
            border="1px solid"
            borderColor={visualState.radios.radio5G.enabled ? themeColors.brand.accent : themeColors.panel.border}
            borderRadius="6px"
            p={3}
            bg={visualState.radios.radio5G.enabled ? '#ffffff' : '#f8fafc'}
          >
            <Flex justify="space-between" align="center" mb={2}>
              <HStack gap={2}>
                <Box
                  w="22px"
                  h="22px"
                  borderRadius="4px"
                  bg="rgba(10, 107, 107, 0.1)"
                  color={themeColors.brand.accent}
                  display="grid"
                  placeItems="center"
                >
                  <Icon name="radio" size={13} />
                </Box>
                <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                  5 GHz Radio (High Performance)
                </Text>
              </HStack>

              <HStack gap={2}>
                <Text fontSize="11px" color={themeColors.text.muted}>
                  {visualState.radios.radio5G.enabled ? 'Enabled' : 'Disabled'}
                </Text>
                <Box
                  as="button"
                  w="34px"
                  h="18px"
                  borderRadius="9px"
                  bg={visualState.radios.radio5G.enabled ? themeColors.brand.accent : '#cbd5e1'}
                  position="relative"
                  cursor={disabled ? 'not-allowed' : 'pointer'}
                  onClick={() =>
                    !disabled &&
                    handleUpdateRadio('radio5G', 'enabled', !visualState.radios.radio5G.enabled)
                  }
                >
                  <Box
                    w="14px"
                    h="14px"
                    borderRadius="50%"
                    bg="#ffffff"
                    position="absolute"
                    top="2px"
                    left={visualState.radios.radio5G.enabled ? '18px' : '2px'}
                    transition="left 0.15s"
                  />
                </Box>
              </HStack>
            </Flex>

            {visualState.radios.radio5G.enabled && (
              <Flex gap={2.5} wrap="wrap" pt={1}>
                <Box flex="1" minW="130px">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Channel
                  </Text>
                  <SelectDropdown
                    value={visualState.radios.radio5G.channel}
                    onChange={(val) => handleUpdateRadio('radio5G', 'channel', val)}
                    options={[
                      { label: 'Auto (RRM)', value: 'auto' },
                      { label: '36 (5180 MHz)', value: '36' },
                      { label: '40 (5200 MHz)', value: '40' },
                      { label: '44 (5220 MHz)', value: '44' },
                      { label: '48 (5240 MHz)', value: '48' },
                      { label: '149 (5745 MHz)', value: '149' },
                      { label: '153 (5765 MHz)', value: '153' },
                      { label: '157 (5785 MHz)', value: '157' },
                      { label: '161 (5805 MHz)', value: '161' },
                    ]}
                    size="sm"
                    disabled={disabled}
                  />
                </Box>

                <Box flex="1" minW="130px">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Channel Width
                  </Text>
                  <SelectDropdown
                    value={String(visualState.radios.radio5G.channelWidth)}
                    onChange={(val) => handleUpdateRadio('radio5G', 'channelWidth', Number(val))}
                    options={[
                      { label: '20 MHz', value: '20' },
                      { label: '40 MHz', value: '40' },
                      { label: '80 MHz', value: '80' },
                      { label: '160 MHz', value: '160' },
                    ]}
                    size="sm"
                    disabled={disabled}
                  />
                </Box>

                <Box flex="1" minW="120px">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Protocol Mode
                  </Text>
                  <SelectDropdown
                    value={visualState.radios.radio5G.channelMode}
                    onChange={(val) => handleUpdateRadio('radio5G', 'channelMode', val)}
                    options={[
                      { label: 'HE (Wi-Fi 6)', value: 'HE' },
                      { label: 'VHT (Wi-Fi 5)', value: 'VHT' },
                      { label: 'HT (Wi-Fi 4)', value: 'HT' },
                    ]}
                    size="sm"
                    disabled={disabled}
                  />
                </Box>

                <Box w="100px">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Tx Power (dBm)
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={visualState.radios.radio5G.txPower}
                    onChange={(e) => handleUpdateRadio('radio5G', 'txPower', Number(e.target.value))}
                    disabled={disabled}
                    borderRadius="4px"
                  />
                </Box>
              </Flex>
            )}
          </Box>

          {/* 2.4 GHz Radio */}
          <Box
            border="1px solid"
            borderColor={visualState.radios.radio2G.enabled ? themeColors.brand.accent : themeColors.panel.border}
            borderRadius="6px"
            p={3}
            bg={visualState.radios.radio2G.enabled ? '#ffffff' : '#f8fafc'}
          >
            <Flex justify="space-between" align="center" mb={2}>
              <HStack gap={2}>
                <Box
                  w="22px"
                  h="22px"
                  borderRadius="4px"
                  bg="rgba(10, 107, 107, 0.1)"
                  color={themeColors.brand.accent}
                  display="grid"
                  placeItems="center"
                >
                  <Icon name="radio" size={13} />
                </Box>
                <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                  2.4 GHz Radio (Coverage & Legacy)
                </Text>
              </HStack>

              <HStack gap={2}>
                <Text fontSize="11px" color={themeColors.text.muted}>
                  {visualState.radios.radio2G.enabled ? 'Enabled' : 'Disabled'}
                </Text>
                <Box
                  as="button"
                  w="34px"
                  h="18px"
                  borderRadius="9px"
                  bg={visualState.radios.radio2G.enabled ? themeColors.brand.accent : '#cbd5e1'}
                  position="relative"
                  cursor={disabled ? 'not-allowed' : 'pointer'}
                  onClick={() =>
                    !disabled &&
                    handleUpdateRadio('radio2G', 'enabled', !visualState.radios.radio2G.enabled)
                  }
                >
                  <Box
                    w="14px"
                    h="14px"
                    borderRadius="50%"
                    bg="#ffffff"
                    position="absolute"
                    top="2px"
                    left={visualState.radios.radio2G.enabled ? '18px' : '2px'}
                    transition="left 0.15s"
                  />
                </Box>
              </HStack>
            </Flex>

            {visualState.radios.radio2G.enabled && (
              <Flex gap={2.5} wrap="wrap" pt={1}>
                <Box flex="1" minW="130px">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Channel
                  </Text>
                  <SelectDropdown
                    value={visualState.radios.radio2G.channel}
                    onChange={(val) => handleUpdateRadio('radio2G', 'channel', val)}
                    options={[
                      { label: 'Auto (1, 6, 11)', value: 'auto' },
                      { label: 'Channel 1 (2412 MHz)', value: '1' },
                      { label: 'Channel 6 (2437 MHz)', value: '6' },
                      { label: 'Channel 11 (2462 MHz)', value: '11' },
                    ]}
                    size="sm"
                    disabled={disabled}
                  />
                </Box>

                <Box flex="1" minW="130px">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Channel Width
                  </Text>
                  <SelectDropdown
                    value={String(visualState.radios.radio2G.channelWidth)}
                    onChange={(val) => handleUpdateRadio('radio2G', 'channelWidth', Number(val))}
                    options={[
                      { label: '20 MHz (Recommended)', value: '20' },
                      { label: '40 MHz', value: '40' },
                    ]}
                    size="sm"
                    disabled={disabled}
                  />
                </Box>

                <Box flex="1" minW="120px">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Protocol Mode
                  </Text>
                  <SelectDropdown
                    value={visualState.radios.radio2G.channelMode}
                    onChange={(val) => handleUpdateRadio('radio2G', 'channelMode', val)}
                    options={[
                      { label: 'HE (Wi-Fi 6)', value: 'HE' },
                      { label: 'HT (Wi-Fi 4)', value: 'HT' },
                    ]}
                    size="sm"
                    disabled={disabled}
                  />
                </Box>

                <Box w="100px">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Tx Power (dBm)
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={visualState.radios.radio2G.txPower}
                    onChange={(e) => handleUpdateRadio('radio2G', 'txPower', Number(e.target.value))}
                    disabled={disabled}
                    borderRadius="4px"
                  />
                </Box>
              </Flex>
            )}
          </Box>
        </VStack>
      )}

      {/* --------------------------------------------------------- */}
      {/* 2. INTERFACES & SSIDS TAB */}
      {/* --------------------------------------------------------- */}
      {activeSubTab === 'interfaces' && (
        <VStack gap={3.5} align="stretch">
          {/* AP WAN & LAN */}
          {platform === 'ap' && (
            <Flex gap={3}>
              {/* Upstream WAN Card */}
              <Box
                flex="1"
                p={3}
                border="1px solid"
                borderColor={themeColors.panel.border}
                borderRadius="6px"
                bg="#f8fafc"
              >
                <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2}>
                  Upstream Interface (WAN)
                </Text>
                <Flex gap={2}>
                  <Box flex="1">
                    <Text fontSize="11px" color={themeColors.text.secondary} mb={1}>
                      Addressing
                    </Text>
                    <SelectDropdown
                      value={visualState.wan.addressing}
                      onChange={(val) => handleUpdateWan('addressing', val as 'dynamic' | 'static')}
                      options={[
                        { label: 'DHCP (Dynamic IP)', value: 'dynamic' },
                        { label: 'Static IP', value: 'static' },
                      ]}
                      size="sm"
                      disabled={disabled}
                    />
                  </Box>
                  <Box w="100px">
                    <Text fontSize="11px" color={themeColors.text.secondary} mb={1}>
                      Port Pattern
                    </Text>
                    <Input
                      size="sm"
                      value={visualState.wan.ports}
                      onChange={(e) => handleUpdateWan('ports', e.target.value)}
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                </Flex>
              </Box>

              {/* Downstream LAN Card */}
              <Box
                flex="1"
                p={3}
                border="1px solid"
                borderColor={themeColors.panel.border}
                borderRadius="6px"
                bg="#f8fafc"
              >
                <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2}>
                  Downstream Gateway (LAN)
                </Text>
                <Flex gap={2}>
                  <Box flex="1">
                    <Text fontSize="11px" color={themeColors.text.secondary} mb={1}>
                      Gateway Subnet
                    </Text>
                    <Input
                      size="sm"
                      value={visualState.lan.subnet}
                      onChange={(e) => handleUpdateLan('subnet', e.target.value)}
                      disabled={disabled}
                      borderRadius="4px"
                    />
                  </Box>
                  <Box w="90px">
                    <Text fontSize="11px" color={themeColors.text.secondary} mb={1}>
                      DHCP Server
                    </Text>
                    <Button
                      size="sm"
                      w="100%"
                      variant={visualState.lan.dhcpEnabled ? 'solid' : 'outline'}
                      bg={visualState.lan.dhcpEnabled ? themeColors.brand.accent : undefined}
                      color={visualState.lan.dhcpEnabled ? '#ffffff' : themeColors.text.secondary}
                      onClick={() => !disabled && handleUpdateLan('dhcpEnabled', !visualState.lan.dhcpEnabled)}
                      disabled={disabled}
                      fontSize="11px"
                    >
                      {visualState.lan.dhcpEnabled ? 'Active' : 'Off'}
                    </Button>
                  </Box>
                </Flex>
              </Box>
            </Flex>
          )}

          {/* Switch Ports & VLANs */}
          {platform === 'switch' && (
            <Box p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#f8fafc">
              <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={2}>
                Switch Port Configuration
              </Text>
              <Flex gap={3}>
                <Box flex="1">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Upstream Port
                  </Text>
                  <Input
                    size="sm"
                    value={visualState.switchConfig.upstreamPort}
                    onChange={(e) => handleUpdateSwitch('upstreamPort', e.target.value)}
                    placeholder="e.g. 1/1"
                    disabled={disabled}
                  />
                </Box>
                <Box flex="1">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Downstream Access Ports
                  </Text>
                  <Input
                    size="sm"
                    value={visualState.switchConfig.downstreamPorts}
                    onChange={(e) => handleUpdateSwitch('downstreamPorts', e.target.value)}
                    placeholder="e.g. 1/2-1/10"
                    disabled={disabled}
                  />
                </Box>
                <Box w="110px">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    VLAN ID
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={visualState.switchConfig.vlanId}
                    onChange={(e) => handleUpdateSwitch('vlanId', Number(e.target.value))}
                    disabled={disabled}
                  />
                </Box>
              </Flex>
            </Box>
          )}

          {/* Wi-Fi SSIDs List (AP Platform) */}
          {platform === 'ap' && (
            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <HStack gap={1.5}>
                  <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                    Wireless Networks (SSIDs)
                  </Text>
                  <Box
                    fontSize="10px"
                    fontWeight="700"
                    px={1.5}
                    py={0.5}
                    borderRadius="10px"
                    bg="#e2e8f0"
                    color={themeColors.text.secondary}
                  >
                    {visualState.ssids.length}
                  </Box>
                </HStack>

                {!disabled && (
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor={themeColors.brand.accent}
                    color={themeColors.brand.accent}
                    onClick={handleAddSsid}
                    h="26px"
                    px={2.5}
                  >
                    <Icon name="plus" size={12} />
                    <Text ml={1} fontWeight="600">
                      Add SSID
                    </Text>
                  </Button>
                )}
              </Flex>

              <VStack gap={2.5} align="stretch">
                {visualState.ssids.map((s, idx) => (
                  <Box
                    key={s.id}
                    p={3}
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    bg="#ffffff"
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <HStack gap={2}>
                        <Text fontSize="12px" fontWeight="700" color={themeColors.text.title}>
                          SSID #{idx + 1}
                        </Text>
                        <Box fontSize="11px" color={themeColors.text.muted}>
                          ({s.name})
                        </Box>
                      </HStack>

                      {visualState.ssids.length > 1 && !disabled && (
                        <Box
                          as="button"
                          cursor="pointer"
                          color="#dc2626"
                          display="flex"
                          alignItems="center"
                          onClick={() => handleRemoveSsid(s.id)}
                          title="Remove this SSID"
                        >
                          <Icon name="trash" size={13} />
                        </Box>
                      )}
                    </Flex>

                    <Flex gap={2.5} wrap="wrap">
                      <Box flex="1" minW="150px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          SSID Broadcast Name
                        </Text>
                        <Input
                          size="sm"
                          value={s.name}
                          onChange={(e) => handleUpdateSsid(s.id, 'name', e.target.value)}
                          placeholder="e.g. OpenWiFi-Default"
                          disabled={disabled}
                          borderRadius="4px"
                        />
                      </Box>

                      <Box flex="1" minW="140px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          Security Protocol
                        </Text>
                        <SelectDropdown
                          value={s.security}
                          onChange={(val) => handleUpdateSsid(s.id, 'security', val)}
                          options={[
                            { label: 'WPA2-PSK (Personal)', value: 'wpa2-psk' },
                            { label: 'WPA3-Personal (SAE)', value: 'wpa3-personal' },
                            { label: 'Open (No password)', value: 'open' },
                            { label: 'WPA2-Enterprise', value: 'wpa2-enterprise' },
                          ]}
                          size="sm"
                          disabled={disabled}
                        />
                      </Box>

                      {s.security !== 'open' && (
                        <Box flex="1" minW="150px">
                          <Flex justify="space-between" align="center" mb={1}>
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                              Passphrase / Key
                            </Text>
                            <Box
                              as="button"
                              cursor="pointer"
                              color={themeColors.text.secondary}
                              onClick={() =>
                                setShowPassword({
                                  ...showPassword,
                                  [s.id]: !showPassword[s.id],
                                })
                              }
                            >
                              <Icon name={showPassword[s.id] ? 'eyeOff' : 'eye'} size={12} />
                            </Box>
                          </Flex>
                          <Input
                            size="sm"
                            type={showPassword[s.id] ? 'text' : 'password'}
                            value={s.key}
                            onChange={(e) => handleUpdateSsid(s.id, 'key', e.target.value)}
                            placeholder="Enter Wi-Fi key (min 8 chars)"
                            disabled={disabled}
                            borderRadius="4px"
                          />
                        </Box>
                      )}

                      <Box w="90px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          VLAN Tag
                        </Text>
                        <Input
                          size="sm"
                          type="number"
                          value={s.vlan || 0}
                          onChange={(e) => handleUpdateSsid(s.id, 'vlan', Number(e.target.value))}
                          placeholder="0 = Untagged"
                          disabled={disabled}
                          borderRadius="4px"
                        />
                      </Box>
                    </Flex>

                    {/* Band selector chips */}
                    <HStack gap={1.5} mt={2.5}>
                      <Text fontSize="11px" color={themeColors.text.muted} mr={1}>
                        Target Bands:
                      </Text>
                      {(['2G', '5G', '6G'] as const).map((b) => {
                        const active = s.bands.includes(b);
                        return (
                          <Button
                            key={b}
                            size="xs"
                            variant={active ? 'solid' : 'outline'}
                            bg={active ? themeColors.brand.accent : 'transparent'}
                            color={active ? '#ffffff' : themeColors.text.secondary}
                            borderColor={active ? themeColors.brand.accent : '#cbd5e1'}
                            onClick={() => !disabled && toggleSsidBand(s.id, b)}
                            disabled={disabled}
                            h="22px"
                            px={2}
                            fontSize="10px"
                            fontWeight="600"
                          >
                            {b === '2G' ? '2.4 GHz' : b === '5G' ? '5 GHz' : '6 GHz'}
                          </Button>
                        );
                      })}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      )}

      {/* --------------------------------------------------------- */}
      {/* 3. SERVICES & METRICS TAB */}
      {/* --------------------------------------------------------- */}
      {activeSubTab === 'services' && (
        <VStack gap={3} align="stretch">
          {/* SSH Daemon Card */}
          <Box p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
            <Flex justify="space-between" align="center" mb={1}>
              <Box>
                <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                  SSH Management Daemon
                </Text>
                <Text fontSize="11px" color={themeColors.text.muted}>
                  Enables secure terminal access for device debugging and recovery.
                </Text>
              </Box>
              <Box
                as="button"
                w="34px"
                h="18px"
                borderRadius="9px"
                bg={visualState.services.ssh ? themeColors.brand.accent : '#cbd5e1'}
                position="relative"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                onClick={() =>
                  !disabled && handleUpdateServices('ssh', !visualState.services.ssh)
                }
              >
                <Box
                  w="14px"
                  h="14px"
                  borderRadius="50%"
                  bg="#ffffff"
                  position="absolute"
                  top="2px"
                  left={visualState.services.ssh ? '18px' : '2px'}
                  transition="left 0.15s"
                />
              </Box>
            </Flex>
            {visualState.services.ssh && (
              <Box mt={2} maxW="140px">
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  Port Number
                </Text>
                <Input
                  size="sm"
                  type="number"
                  value={visualState.services.sshPort}
                  onChange={(e) => handleUpdateServices('sshPort', Number(e.target.value))}
                  disabled={disabled}
                />
              </Box>
            )}
          </Box>

          {/* LLDP Protocol Card */}
          <Box p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
            <Flex justify="space-between" align="center" mb={1}>
              <Box>
                <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                  Link Layer Discovery Protocol (LLDP)
                </Text>
                <Text fontSize="11px" color={themeColors.text.muted}>
                  Advertises device identity, ports, and capabilities to adjacent network switches.
                </Text>
              </Box>
              <Box
                as="button"
                w="34px"
                h="18px"
                borderRadius="9px"
                bg={visualState.services.lldp ? themeColors.brand.accent : '#cbd5e1'}
                position="relative"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                onClick={() =>
                  !disabled && handleUpdateServices('lldp', !visualState.services.lldp)
                }
              >
                <Box
                  w="14px"
                  h="14px"
                  borderRadius="50%"
                  bg="#ffffff"
                  position="absolute"
                  top="2px"
                  left={visualState.services.lldp ? '18px' : '2px'}
                  transition="left 0.15s"
                />
              </Box>
            </Flex>
            {visualState.services.lldp && (
              <Box mt={2}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  LLDP Description
                </Text>
                <Input
                  size="sm"
                  value={visualState.services.lldpDescription}
                  onChange={(e) => handleUpdateServices('lldpDescription', e.target.value)}
                  disabled={disabled}
                />
              </Box>
            )}
          </Box>

          {/* Metrics & Telemetry Card */}
          <Box p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
            <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={1}>
              Telemetry & Metrics Intervals
            </Text>
            <Flex gap={3} mt={2}>
              <Box flex="1">
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  Statistics Reporting Interval (seconds)
                </Text>
                <Input
                  size="sm"
                  type="number"
                  value={visualState.metrics.statsInterval}
                  onChange={(e) => handleUpdateMetrics('statsInterval', Number(e.target.value))}
                  disabled={disabled}
                />
              </Box>
              <Box flex="1">
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  Health Check Interval (seconds)
                </Text>
                <Input
                  size="sm"
                  type="number"
                  value={visualState.metrics.healthInterval}
                  onChange={(e) => handleUpdateMetrics('healthInterval', Number(e.target.value))}
                  disabled={disabled}
                />
              </Box>
            </Flex>
          </Box>
        </VStack>
      )}
    </Box>
  );
};

