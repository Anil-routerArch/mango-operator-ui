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
import { useGetEntities, useGetVenues } from '@/api';
import type { ConfigurationProfile, ProfileSettingsValue } from './types/configuration';
import { PassPointSection } from './components/PassPointSection';
import {
  type PassPointConfig,
  parseOwprovPasspoint,
  buildOwprovPasspoint,
} from './types/passpoint';
import { CaptivePortalSection } from './components/CaptivePortalSection';
import {
  type CaptivePortalConfig,
  DEFAULT_CAPTIVE_PORTAL_CONFIG,
  parseOwprovCaptive,
  buildOwprovCaptive,
} from './types/captive';
import { Ipv4Section } from './components/Ipv4Section';
import {
  type Ipv4ConfigData,
  parseOwprovIpv4,
  buildOwprovIpv4,
} from './types/ipv4';
import { RadioSection } from './components/RadioSection';
import {
  type RadioConfigData,
  parseOwprovRadio,
  buildOwprovRadio,
} from './types/radio';
import { RadiusSection } from './components/RadiusSection';
import {
  type RadiusConfigData,
  parseOwprovRadius,
  buildOwprovRadius,
} from './types/radius';

export interface ProfileEditorPageProps {
  profile: ConfigurationProfile;
  onBack: () => void;
  onSave?: (updatedProfile: ConfigurationProfile) => Promise<unknown> | void;
}

interface MultiPskItem {
  id: string;
  mac: string;
  key: string;
  vlanId: number;
}

// Reusable toggle switch matching MDU design system
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <HStack
    gap={2}
    cursor={disabled ? 'not-allowed' : 'pointer'}
    userSelect="none"
    onClick={() => !disabled && onChange(!checked)}
  >
    <Box
      w="34px"
      h="18px"
      borderRadius="9px"
      bg={checked ? themeColors.brand.accent : '#cbd5e1'}
      position="relative"
      transition="all 0.2s ease"
      opacity={disabled ? 0.6 : 1}
    >
      <Box
        w="14px"
        h="14px"
        borderRadius="50%"
        bg="#ffffff"
        position="absolute"
        top="2px"
        left={checked ? '18px' : '2px'}
        transition="all 0.2s ease"
        boxShadow="0 1px 2px rgba(0,0,0,0.2)"
      />
    </Box>
    {label && (
      <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary}>
        {label}
      </Text>
    )}
  </HStack>
);

const FieldInfoTooltip: React.FC<{ tooltip?: string }> = ({ tooltip }) => (
  <Text
    as="span"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    w="14px"
    h="14px"
    borderRadius="50%"
    bg="#e2e8f0"
    color="#64748b"
    fontSize="10px"
    fontWeight="700"
    ml={1}
    cursor="help"
    title={tooltip || 'Field configuration info'}
  >
    i
  </Text>
);

export const ProfileEditorPage: React.FC<ProfileEditorPageProps> = ({
  profile: initialProfile,
  onBack,
  onSave,
}) => {
  const [profile, setProfile] = useState<ConfigurationProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<'settings' | 'raw_json'>('settings');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: entities = [] } = useGetEntities();
  const { data: venues = [] } = useGetVenues();

  // Metadata state
  const [name, setName] = useState<string>(initialProfile.name);
  const [description, setDescription] = useState<string>(initialProfile.description);
  const [deviceGroup, setDeviceGroup] = useState<string>(initialProfile.deviceGroup || 'ap');
  const [scopeType, setScopeType] = useState<'property' | 'venue'>(
    initialProfile.venue ? 'venue' : 'property'
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    initialProfile.entity || ''
  );
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    initialProfile.venue || ''
  );



  const pValues = initialProfile.parsedValues || {};

  // --- Radio parameters state ---
  const [radioConfig, setRadioConfig] = useState<RadioConfigData>(() =>
    parseOwprovRadio(pValues as Record<string, unknown> | undefined)
  );

  // --- SSID parameters state ---
  const [ssidName, setSsidName] = useState<string>(
    pValues.name ? String(pValues.name) : 'Resident-WiFi'
  );
  const [bssMode, setBssMode] = useState<string>(
    pValues['bss-mode'] ? String(pValues['bss-mode']) : 'ap'
  );
  const [wifiBands, setWifiBands] = useState<string[]>(
    Array.isArray(pValues['wifi-bands'])
      ? (pValues['wifi-bands'] as string[])
      : typeof pValues['wifi-bands'] === 'string'
      ? (pValues['wifi-bands'] as string).split(',').map((s) => s.trim())
      : ['2G', '5G']
  );
  const [authProtocol, setAuthProtocol] = useState<string>(
    typeof pValues.protocol === 'string' ? pValues.protocol : 'WPA2-PSK'
  );
  const [authKey, setAuthKey] = useState<string>(
    typeof pValues.key === 'string' ? pValues.key : 'ResidentPass2026!'
  );
  const [showKey, setShowKey] = useState<boolean>(false);
  const [ieee80211w, setIeee80211w] = useState<string>(
    typeof pValues.ieee80211w === 'string' ? pValues.ieee80211w : 'optional'
  );
  const [keyCaching, setKeyCaching] = useState<boolean>(
    pValues['key-caching'] !== undefined ? Boolean(pValues['key-caching']) : true
  );

  // Passpoint
  const [passPointConfig, setPassPointConfig] = useState<PassPointConfig>(() =>
    parseOwprovPasspoint(
      (pValues['pass-point'] || (pValues['passpoint-enabled'] ? pValues : undefined)) as
        | Record<string, unknown>
        | undefined
    )
  );

  // Advanced SSID
  const [hiddenSsid, setHiddenSsid] = useState<boolean>(
    pValues['hidden-ssid'] !== undefined ? Boolean(pValues['hidden-ssid']) : false
  );
  const [ssidMaxClients, setSsidMaxClients] = useState<number>(
    pValues['maximum-clients'] !== undefined ? Number(pValues['maximum-clients']) : 64
  );
  const [filsDiscoveryInterval, setFilsDiscoveryInterval] = useState<number>(20);
  const [purpose, setPurpose] = useState<string>('Default');
  const [dtimPeriod, setDtimPeriod] = useState<number>(2);
  const [isolateClients, setIsolateClients] = useState<boolean>(false);
  const [powerSave, setPowerSave] = useState<boolean>(false);
  const [broadcastTime, setBroadcastTime] = useState<boolean>(false);
  const [unicastConversion, setUnicastConversion] = useState<boolean>(false);
  const [proxyArp, setProxyArp] = useState<boolean>(false);
  const [disassocLowAck, setDisassocLowAck] = useState<boolean>(false);
  const [vendorElements, setVendorElements] = useState<string>('');
  const [tipInformationElement, setTipInformationElement] = useState<boolean>(true);

  // Multi-PSK
  const [multiPskEntries, setMultiPskEntries] = useState<MultiPskItem[]>([]);
  const [isMultiPskModalOpen, setIsMultiPskModalOpen] = useState<boolean>(false);
  const [newPskMac, setNewPskMac] = useState<string>('');
  const [newPskKey, setNewPskKey] = useState<string>('');
  const [newPskVlan, setNewPskVlan] = useState<number>(100);

  // Rate Limit
  const [rateLimitEnabled, setRateLimitEnabled] = useState<boolean>(false);
  const [ingressRate, setIngressRate] = useState<number>(50);
  const [egressRate, setEgressRate] = useState<number>(50);

  // RRM
  const [rrmEnabled, setRrmEnabled] = useState<boolean>(false);
  const [neighborReporting, setNeighborReporting] = useState<boolean>(false);
  const [lci, setLci] = useState<string>('');
  const [civicLocation, setCivicLocation] = useState<string>('');
  const [ftmResponder, setFtmResponder] = useState<boolean>(false);
  const [stationaryAp, setStationaryAp] = useState<boolean>(false);

  // Captive Portal
  const [captivePortalConfig, setCaptivePortalConfig] = useState<CaptivePortalConfig>(() => {
    if (pValues.captive) return parseOwprovCaptive(pValues.captive as Record<string, unknown>);
    if (pValues['auth-mode']) return parseOwprovCaptive(pValues as Record<string, unknown>);
    return { ...DEFAULT_CAPTIVE_PORTAL_CONFIG };
  });

  // ACL
  const [aclEnabled, setAclEnabled] = useState<boolean>(false);
  const [aclMode, setAclMode] = useState<string>('allow');
  const [aclMacAddress, setAclMacAddress] = useState<string>('00:11:22:33:44:55');

  // Roaming
  const [roamingState, setRoamingState] = useState<string>('off');
  const [roamingExchange, setRoamingExchange] = useState<string>('ds');
  const [roamingGeneratePsk, setRoamingGeneratePsk] = useState<boolean>(false);
  const [roamingDomainId, setRoamingDomainId] = useState<string>('4f2a');
  const [roamingPmkR0, setRoamingPmkR0] = useState<string>('');
  const [roamingPmkR1, setRoamingPmkR1] = useState<string>('');

  // --- VLAN & IPv4 parameters state ---
  const [vlanId, setVlanId] = useState<number>(
    pValues['vlan-id'] !== undefined
      ? Number(pValues['vlan-id'])
      : pValues.vlan !== undefined
      ? Number(pValues.vlan)
      : 100
  );
  const [vlanDescription, setVlanDescription] = useState<string>(
    pValues.description ? String(pValues.description) : 'Resident isolation VLAN'
  );
  const [ipv4Config, setIpv4Config] = useState<Ipv4ConfigData>(() =>
    parseOwprovIpv4(pValues as Record<string, unknown> | undefined)
  );

  // --- Tunnel parameters state ---
  const [tunnelProto, setTunnelProto] = useState<string>('vxlan');
  const [tunnelPeerAddress, setTunnelPeerAddress] = useState<string>('192.168.10.1');
  const [tunnelPeerPort, setTunnelPeerPort] = useState<number>(4700);
  const [tunnelServer, setTunnelServer] = useState<string>('vpn.routerarch.com');
  const [tunnelUsername, setTunnelUsername] = useState<string>('resident-gw');
  const [tunnelPassword, setTunnelPassword] = useState<string>('');
  const [tunnelHealthcheck, setTunnelHealthcheck] = useState<boolean>(true);

  // --- RADIUS parameters state ---
  const [radiusConfig, setRadiusConfig] = useState<RadiusConfigData>(() =>
    parseOwprovRadius(pValues as Record<string, unknown> | undefined)
  );

  // --- OpenRoaming parameters state ---
  const [openRoamingName, setOpenRoamingName] = useState<string>('OpenRoaming');
  const [openRoamingConsortium, setOpenRoamingConsortium] = useState<string>('5A03BA0000');

  const filteredVenues = venues.filter(
    (v) => !selectedPropertyId || v.entity === selectedPropertyId
  );

  const markDirty = () => {
    setHasUnsavedChanges(true);
  };

  const toggleWifiBand = (band: string) => {
    markDirty();
    if (wifiBands.includes(band)) {
      if (wifiBands.length > 1) {
        setWifiBands(wifiBands.filter((b) => b !== band));
      }
    } else {
      setWifiBands([...wifiBands, band]);
    }
  };

  const handleAddMultiPsk = () => {
    if (!newPskKey.trim()) return;
    const entry: MultiPskItem = {
      id: `psk-${Date.now().toString(36)}`,
      mac: newPskMac.trim(),
      key: newPskKey.trim(),
      vlanId: Number(newPskVlan) || 100,
    };
    setMultiPskEntries([...multiPskEntries, entry]);
    setNewPskMac('');
    setNewPskKey('');
    markDirty();
  };

  const handleRemoveMultiPsk = (id: string) => {
    setMultiPskEntries(multiPskEntries.filter((e) => e.id !== id));
    markDirty();
  };

  // Re-build values dictionary based on profile prefix
  const buildCurrentValues = (): Record<string, ProfileSettingsValue> => {
    if (profile.prefix === 'radio') {
      return buildOwprovRadio(radioConfig) as Record<string, ProfileSettingsValue>;
    }

    if (profile.prefix === 'interface.ssid') {
      return {
        name: ssidName,
        'bss-mode': bssMode,
        'wifi-bands': wifiBands,
        protocol: authProtocol,
        key: authKey,
        ieee80211w,
        'key-caching': keyCaching,
        'hidden-ssid': hiddenSsid,
        'maximum-clients': ssidMaxClients,
        'fils-discovery-interval': filsDiscoveryInterval,
        purpose,
        'dtim-period': dtimPeriod,
        'isolate-clients': isolateClients,
        'power-save': powerSave,
        'broadcast-time': broadcastTime,
        'unicast-conversion': unicastConversion,
        'proxy-arp': proxyArp,
        'disassoc-low-ack': disassocLowAck,
        'vendor-elements': vendorElements,
        'tip-information-element': tipInformationElement,
        vlan: vlanId,
        'rate-limit-enabled': rateLimitEnabled,
        'ingress-rate': ingressRate,
        'egress-rate': egressRate,
        'rrm-enabled': rrmEnabled,
        'neighbor-reporting': neighborReporting,
        'ftm-responder': ftmResponder,
        'stationary-ap': stationaryAp,
        lci,
        'civic-location': civicLocation,
        ...(captivePortalConfig.authMode !== 'none'
          ? { captive: buildOwprovCaptive(captivePortalConfig) }
          : {}),
        'acl-enabled': aclEnabled,
        'acl-mode': aclMode,
        'acl-mac': aclMacAddress,
        'roaming-state': roamingState,
        'roaming-exchange': roamingExchange,
        'roaming-domain-id': roamingDomainId,
        'roaming-generate-psk': roamingGeneratePsk,
        'pmk-r0-key-holder': roamingPmkR0,
        'pmk-r1-key-holder': roamingPmkR1,
        ...(passPointConfig.enabled ? { 'pass-point': buildOwprovPasspoint(passPointConfig) } : {}),
      };
    }

    if (profile.prefix === 'interface.vlan') {
      return {
        'vlan-id': vlanId,
        description: vlanDescription,
      };
    }

    if (profile.prefix === 'interface.ipv4') {
      return buildOwprovIpv4(ipv4Config) as Record<string, ProfileSettingsValue>;
    }

    if (profile.prefix === 'interface.captive') {
      const capData = buildOwprovCaptive(
        captivePortalConfig.authMode === 'none'
          ? { ...captivePortalConfig, authMode: 'click-to-continue' }
          : captivePortalConfig
      );
      return (capData as Record<string, ProfileSettingsValue>) || { 'auth-mode': 'click-to-continue' };
    }

    if (profile.prefix === 'interface.tunnel') {
      return {
        proto: tunnelProto,
        'peer-address': tunnelPeerAddress,
        'peer-port': tunnelPeerPort,
        server: tunnelServer,
        username: tunnelUsername,
        password: tunnelPassword,
        healthcheck: tunnelHealthcheck,
      };
    }

    if (profile.prefix === 'interface.ssid.radius') {
      return buildOwprovRadius(radiusConfig) as Record<string, ProfileSettingsValue>;
    }

    if (profile.prefix === 'interface.ssid.openroaming') {
      return {
        name: openRoamingName,
        'roaming-consortium': openRoamingConsortium,
      };
    }

    return profile.parsedValues;
  };

  const handleSave = async () => {
    if (isSaving) return;
    const values = buildCurrentValues();
    const serialized = JSON.stringify(values, null, 2);

    const effectivePropId = selectedPropertyId || entities[0]?.id || '';
    const prop = entities.find((p) => p.id === effectivePropId);
    const effectiveVenId = selectedVenueId || filteredVenues[0]?.id || venues[0]?.id || '';
    const ven = venues.find((v) => v.id === effectiveVenId);

    const updatedProfile: ConfigurationProfile = {
      ...profile,
      name,
      description,
      deviceGroup,
      entity: scopeType === 'property' ? effectivePropId : '',
      entityName:
        scopeType === 'property'
          ? prop?.name || (effectivePropId ? `${effectivePropId.slice(0, 8)}...` : '')
          : '',
      venue: scopeType === 'venue' ? effectiveVenId : '',
      venueName:
        scopeType === 'venue'
          ? ven?.name || (effectiveVenId ? `${effectiveVenId.slice(0, 8)}...` : '')
          : '',
      modified: Math.floor(Date.now() / 1000),
      status: 'valid',
      configuredFieldsCount: Object.keys(values).length,
      variables: [
        {
          prefix: profile.prefix,
          type: 'json',
          weight: 0,
          value: serialized,
        },
      ],
      parsedValues: values,
    };

    try {
      setIsSaving(true);
      await onSave?.(updatedProfile);
      setProfile(updatedProfile);
      setHasUnsavedChanges(false);
      setSaveSuccessMessage(true);
      setTimeout(() => setSaveSuccessMessage(false), 4000);
    } catch (err) {
      console.error('Failed to save profile changes:', err);
      // Keep hasUnsavedChanges = true so the user does not lose their work
    } finally {
      setIsSaving(false);
    }
  };

  const rawJsonString = JSON.stringify(
    {
      prefix: profile.prefix,
      type: 'json',
      weight: 0,
      value: buildCurrentValues(),
    },
    null,
    2
  );

  return (
    <Box pb={28}>
      {/* Breadcrumb & Top Actions */}
      <Flex justify="space-between" align="center" mb={2}>
        <HStack gap={2} fontSize="12px" color={themeColors.text.muted}>
          <Text cursor="pointer" _hover={{ color: themeColors.brand.accent }} onClick={onBack}>
            Network
          </Text>
          <Text>/</Text>
          <Text cursor="pointer" _hover={{ color: themeColors.brand.accent }} onClick={onBack}>
            Configuration Profiles
          </Text>
          <Text>/</Text>
          <Text color={themeColors.text.primary} fontWeight="600">
            {name}
          </Text>
        </HStack>

        <HStack gap={2.5}>
          <Button
            size="sm"
            bg={themeColors.brand.accent}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.accentHover }}
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            borderColor={themeColors.panel.border}
            color={themeColors.text.primary}
            bg="#ffffff"
            onClick={onBack}
          >
            Back to library
          </Button>
        </HStack>
      </Flex>

      {/* Header Title & Badges */}
      <Flex align="center" gap={3} mb={1}>
        <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>
          {name}
        </Text>
        <HStack
          gap={1.5}
          px={2.5}
          py={0.5}
          borderRadius="12px"
          bg="#f0fdf4"
          color="#15803d"
          border="1px solid"
          borderColor="#bbf7d0"
          fontSize="11px"
          fontWeight="600"
        >
          <Icon name="check" size={12} color="#15803d" />
          <Text>Valid</Text>
        </HStack>
        <Box
          fontSize="11px"
          fontWeight="600"
          px={2.5}
          py={0.5}
          borderRadius="12px"
          bg="#eff6ff"
          color="#1d4ed8"
          fontFamily="monospace"
        >
          {profile.prefix}
        </Box>
        {profile.configurations.length > 0 && (
          <Box
            fontSize="11px"
            fontWeight="500"
            px={2.5}
            py={0.5}
            borderRadius="12px"
            bg="#f1f5f9"
            color={themeColors.text.secondary}
          >
            In use ({profile.configurations.length})
          </Box>
        )}
      </Flex>

      <Text fontSize="12px" color={themeColors.text.secondary} mb={4}>
        Section: <Text as="span" fontFamily="monospace" fontWeight="600">{profile.prefix}</Text> · Scope:{' '}
        {profile.venueName ? `${profile.entityName || 'Property'} > ${profile.venueName}` : profile.entityName || 'Global'} · Device Group: <Text as="span" fontFamily="monospace">{deviceGroup}</Text> · Last modified{' '}
        {new Date(profile.modified * 1000).toLocaleString()}
      </Text>

      {/* Save Success Banner */}
      {saveSuccessMessage && (
        <Flex
          bg="#ecfdf5"
          border="1px solid"
          borderColor="#a7f3d0"
          borderRadius="6px"
          p={3}
          mb={4}
          align="center"
          gap={2.5}
        >
          <Icon name="check" size={16} color="#059669" />
          <Text fontSize="13px" fontWeight="600" color="#065f46">
            Profile changes saved successfully and synced with OWPROV variable registry!
          </Text>
        </Flex>
      )}

      {/* Tabs */}
      <Flex borderBottom="1px solid" borderColor={themeColors.panel.divider} gap={6} mb={4}>
        <Button
          variant="plain"
          px={2}
          pb={2.5}
          h="auto"
          fontSize="13px"
          fontWeight={activeTab === 'settings' ? '600' : '400'}
          color={activeTab === 'settings' ? themeColors.text.primary : themeColors.text.secondary}
          position="relative"
          onClick={() => setActiveTab('settings')}
          _after={
            activeTab === 'settings'
              ? {
                  content: '""',
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  bg: themeColors.brand.accent,
                }
              : undefined
          }
        >
          Profile Settings
        </Button>

        <Button
          variant="plain"
          px={2}
          pb={2.5}
          h="auto"
          fontSize="13px"
          fontWeight={activeTab === 'raw_json' ? '600' : '400'}
          color={activeTab === 'raw_json' ? themeColors.text.primary : themeColors.text.secondary}
          position="relative"
          onClick={() => setActiveTab('raw_json')}
          _after={
            activeTab === 'raw_json'
              ? {
                  content: '""',
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  bg: themeColors.brand.accent,
                }
              : undefined
          }
        >
          Raw JSON (OWPROV)
        </Button>
      </Flex>

      {/* Main Content */}
      {activeTab === 'settings' && (
        <VStack w="100%" gap={4} align="stretch">
          {/* Profile Details Card */}
          <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
                <Flex justify="space-between" align="center" mb={4} pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
                    Profile Metadata
                  </Text>
                  <HStack gap={1.5} fontSize="11px" color="#15803d" fontWeight="600">
                    <Icon name="check" size={13} color="#15803d" />
                    <Text>Valid</Text>
                  </HStack>
                </Flex>

                <VStack gap={3.5} align="stretch" fontSize="12px">
                  <Flex align="center">
                    <Text w="160px" fontWeight="500" color={themeColors.text.secondary}>Profile Name *</Text>
                    <Input
                      flex="1"
                      size="sm"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        markDirty();
                      }}
                    />
                  </Flex>

                  <Flex align="center">
                    <Text w="160px" fontWeight="500" color={themeColors.text.secondary}>Description</Text>
                    <Input
                      flex="1"
                      size="sm"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        markDirty();
                      }}
                    />
                  </Flex>

                  <Flex align="center">
                    <Text w="160px" fontWeight="500" color={themeColors.text.secondary}>Device Group</Text>
                    <Box flex="1">
                      <SelectDropdown
                        value={deviceGroup}
                        onChange={(val) => {
                          setDeviceGroup(val);
                          markDirty();
                        }}
                        options={[
                          { value: 'ap', label: 'ap (Access Points)' },
                          { value: '*', label: 'All Devices (*)' },
                        ]}
                      />
                    </Box>
                  </Flex>

                  <Flex align="center">
                    <Text w="160px" fontWeight="500" color={themeColors.text.secondary}>Section</Text>
                    <Box
                      fontSize="12px"
                      fontWeight="600"
                      px={2.5}
                      py={1}
                      borderRadius="4px"
                      bg="#f1f5f9"
                      fontFamily="monospace"
                    >
                      {profile.prefix}
                    </Box>
                  </Flex>

                  {/* Scope Selector */}
                  <Flex align="flex-start">
                    <Text w="160px" pt={1.5} fontWeight="500" color={themeColors.text.secondary}>Scope</Text>
                    <VStack flex="1" align="stretch" gap={2}>
                      <HStack gap={2}>
                        <Button
                          size="xs"
                          variant={scopeType === 'property' ? 'solid' : 'outline'}
                          bg={scopeType === 'property' ? themeColors.brand.accent : '#ffffff'}
                          color={scopeType === 'property' ? '#ffffff' : themeColors.text.primary}
                          borderColor={scopeType === 'property' ? themeColors.brand.accent : themeColors.panel.border}
                          onClick={() => {
                            setScopeType('property');
                            markDirty();
                          }}
                        >
                          Entity Scope
                        </Button>
                        <Button
                          size="xs"
                          variant={scopeType === 'venue' ? 'solid' : 'outline'}
                          bg={scopeType === 'venue' ? themeColors.brand.accent : '#ffffff'}
                          color={scopeType === 'venue' ? '#ffffff' : themeColors.text.primary}
                          borderColor={scopeType === 'venue' ? themeColors.brand.accent : themeColors.panel.border}
                          onClick={() => {
                            setScopeType('venue');
                            markDirty();
                          }}
                        >
                          Venue Scope
                        </Button>
                      </HStack>

                      <Flex gap={2} pt={1} wrap="wrap">
                        <Box flex="1" minW="180px">
                          <SelectDropdown
                            value={selectedPropertyId || entities[0]?.id || ''}
                            onChange={(val) => {
                              setSelectedPropertyId(val);
                              markDirty();
                            }}
                            options={entities.map((p) => ({
                              value: p.id,
                              label: p.name,
                            }))}
                          />
                        </Box>
                        {scopeType === 'venue' && (
                          <Box flex="1" minW="180px">
                            <SelectDropdown
                              value={selectedVenueId || filteredVenues[0]?.id || ''}
                              onChange={(val) => {
                                setSelectedVenueId(val);
                                markDirty();
                              }}
                              options={filteredVenues.map((v) => ({
                                value: v.id,
                                label: v.name,
                              }))}
                            />
                          </Box>
                        )}
                      </Flex>
                    </VStack>
                  </Flex>
                </VStack>
              </Box>

              {/* ---------------- SECTION: RADIO ---------------- */}
              {profile.prefix === 'radio' && (
                <RadioSection
                  config={radioConfig}
                  onChange={(cfg) => {
                    setRadioConfig(cfg);
                    markDirty();
                  }}
                />
              )}

              {/* ---------------- SECTION: INTERFACE.SSID ---------------- */}
              {profile.prefix === 'interface.ssid' && (
                <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
                  <Flex justify="space-between" align="center" mb={4} pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                    <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
                      SSID Interface Parameters
                    </Text>
                    <Box fontSize="11px" fontWeight="600" color={themeColors.brand.accent} bg="#eff6ff" px={2.5} py={0.5} borderRadius="4px">
                      prefix: interface.ssid
                    </Box>
                  </Flex>

                  <VStack gap={4} align="stretch">
                    {/* Basic SSID Settings */}
                    <Flex gap={3} wrap="wrap">
                      <Box flex="2" minW="200px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          SSID Broadcast Name <Text as="span" color="red.500">*</Text>
                        </Text>
                        <Input
                          size="sm"
                          value={ssidName}
                          onChange={(e) => {
                            setSsidName(e.target.value);
                            markDirty();
                          }}
                        />
                      </Box>

                      <Box flex="1" minW="140px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          bss-mode <Text as="span" color="red.500">*</Text>
                        </Text>
                        <SelectDropdown
                          value={bssMode}
                          onChange={(val) => {
                            setBssMode(val);
                            markDirty();
                          }}
                          options={[
                            { value: 'ap', label: 'Access Point (ap)' },
                            { value: 'mesh', label: 'Mesh' },
                            { value: 'wds', label: 'WDS' },
                            { value: 'sta', label: 'Station (sta)' },
                          ]}
                        />
                      </Box>
                    </Flex>

                    {/* Wi-Fi Bands Buttons */}
                    <Box>
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1.5}>
                        wifi-bands (Radio Binding) <Text as="span" color="red.500">*</Text>
                      </Text>
                      <HStack gap={2}>
                        {['2G', '5G', '6G'].map((b) => (
                          <Button
                            key={b}
                            size="xs"
                            variant={wifiBands.includes(b) ? 'solid' : 'outline'}
                            bg={wifiBands.includes(b) ? themeColors.brand.accent : '#ffffff'}
                            color={wifiBands.includes(b) ? '#ffffff' : themeColors.text.primary}
                            borderColor={wifiBands.includes(b) ? themeColors.brand.accent : themeColors.panel.border}
                            onClick={() => toggleWifiBand(b)}
                          >
                            {b === '2G' ? '2.4 GHz' : b === '5G' ? '5 GHz' : '6 GHz'}
                          </Button>
                        ))}
                      </HStack>
                    </Box>

                    {/* Security & Authentication */}
                    <Box p={3.5} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                      <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={2.5}>
                        Security & Authentication
                      </Text>
                      <Flex gap={3} mb={3} wrap="wrap">
                        <Box flex="1" minW="150px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>protocol</Text>
                          <SelectDropdown
                            value={authProtocol}
                            onChange={(val) => {
                              setAuthProtocol(val);
                              markDirty();
                            }}
                            options={[
                              { value: 'WPA-PSK', label: 'WPA-PSK' },
                              { value: 'WPA2-PSK', label: 'WPA2-PSK' },
                              { value: 'WPA3-SAE', label: 'WPA3-SAE' },
                              { value: 'WPA2-Enterprise', label: 'WPA2-Enterprise' },
                              { value: 'WPA3-Enterprise', label: 'WPA3-Enterprise' },
                              { value: 'None', label: 'None (Open)' },
                            ]}
                          />
                        </Box>

                        <Box flex="1.5" minW="200px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>key (Passphrase)</Text>
                          <Flex align="center">
                            <Input
                              size="sm"
                              type={showKey ? 'text' : 'password'}
                              value={authKey}
                              onChange={(e) => {
                                setAuthKey(e.target.value);
                                markDirty();
                              }}
                              bg="#ffffff"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              ml={1}
                              px={2}
                              onClick={() => setShowKey(!showKey)}
                            >
                              <Icon name={showKey ? 'eyeOff' : 'eye'} size={14} />
                            </Button>
                          </Flex>
                        </Box>

                        <Box w="130px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>ieee80211w (PMF)</Text>
                          <SelectDropdown
                            value={ieee80211w}
                            onChange={(val) => {
                              setIeee80211w(val);
                              markDirty();
                            }}
                            options={[
                              { value: 'disabled', label: 'Disabled' },
                              { value: 'optional', label: 'Optional' },
                              { value: 'required', label: 'Required' },
                            ]}
                          />
                        </Box>
                      </Flex>

                      <HStack gap={4}>
                        <ToggleSwitch
                          checked={keyCaching}
                          onChange={(val) => {
                            setKeyCaching(val);
                            markDirty();
                          }}
                          label="key-caching"
                        />
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor={themeColors.panel.border}
                          onClick={() => setIsMultiPskModalOpen(true)}
                        >
                          Manage multi-psk ({multiPskEntries.length} entries)
                        </Button>
                      </HStack>
                    </Box>

                    {/* Pass Point (Hotspot 2.0) Section */}
                    <Box p={3.5} bg="#ffffff" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.border}>
                      <PassPointSection
                        config={passPointConfig}
                        onChange={(newCfg) => {
                          setPassPointConfig(newCfg);
                          markDirty();
                        }}
                      />
                    </Box>

                    {/* Advanced SSID Toggles & Options */}
                    <Box p={3.5} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                      <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={2.5}>
                        Advanced SSID Options
                      </Text>
                      <Flex gap={4} mb={3} wrap="wrap" align="center">
                        <ToggleSwitch checked={hiddenSsid} onChange={(v) => { setHiddenSsid(v); markDirty(); }} label="hidden-ssid" />
                        <ToggleSwitch checked={isolateClients} onChange={(v) => { setIsolateClients(v); markDirty(); }} label="isolate-clients" />
                        <ToggleSwitch checked={powerSave} onChange={(v) => { setPowerSave(v); markDirty(); }} label="power-save" />
                        <ToggleSwitch checked={broadcastTime} onChange={(v) => { setBroadcastTime(v); markDirty(); }} label="broadcast-time" />
                        <ToggleSwitch checked={unicastConversion} onChange={(v) => { setUnicastConversion(v); markDirty(); }} label="unicast-conversion" />
                        <ToggleSwitch checked={proxyArp} onChange={(v) => { setProxyArp(v); markDirty(); }} label="proxy-arp" />
                        <ToggleSwitch checked={disassocLowAck} onChange={(v) => { setDisassocLowAck(v); markDirty(); }} label="disassoc-low-ack" />
                        <ToggleSwitch checked={tipInformationElement} onChange={(v) => { setTipInformationElement(v); markDirty(); }} label="tip-ie" />
                      </Flex>

                      <Flex gap={3} wrap="wrap" mb={2}>
                        <Box w="140px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>purpose</Text>
                          <SelectDropdown
                            value={purpose}
                            onChange={(v) => { setPurpose(v); markDirty(); }}
                            options={[
                              { value: 'Default', label: 'Default' },
                              { value: 'Guest', label: 'Guest' },
                              { value: 'IoT', label: 'IoT' },
                              { value: 'Staff', label: 'Staff' },
                            ]}
                          />
                        </Box>
                        <Box flex="1" minW="160px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>vendor-elements</Text>
                          <Input size="sm" value={vendorElements} onChange={(e) => { setVendorElements(e.target.value); markDirty(); }} bg="#ffffff" placeholder="Vendor IE hex string" />
                        </Box>
                      </Flex>

                      <Flex gap={3} wrap="wrap">
                        <Box w="120px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>dtim-period</Text>
                          <Input size="sm" type="number" value={dtimPeriod} onChange={(e) => { setDtimPeriod(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                        </Box>
                        <Box w="120px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>maximum-clients</Text>
                          <Input size="sm" type="number" value={ssidMaxClients} onChange={(e) => { setSsidMaxClients(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                        </Box>
                        <Box w="120px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>fils-discovery</Text>
                          <Input size="sm" type="number" value={filsDiscoveryInterval} onChange={(e) => { setFilsDiscoveryInterval(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                        </Box>
                        <Box w="120px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>vlan-id</Text>
                          <Input size="sm" type="number" value={vlanId} onChange={(e) => { setVlanId(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                        </Box>
                      </Flex>
                    </Box>

                    {/* Rate Limit Collapsible */}
                    <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                      <Flex justify="space-between" align="center">
                        <HStack gap={2}>
                          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>Rate Limit</Text>
                          <FieldInfoTooltip tooltip="Bandwidth throttling per connected client" />
                        </HStack>
                        <ToggleSwitch checked={rateLimitEnabled} onChange={(v) => { setRateLimitEnabled(v); markDirty(); }} />
                      </Flex>
                      {rateLimitEnabled && (
                        <Flex gap={3} mt={3} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                          <Box flex="1">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>ingress-rate (MB/s)</Text>
                            <Input size="sm" type="number" value={ingressRate} onChange={(e) => { setIngressRate(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                          </Box>
                          <Box flex="1">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>egress-rate (MB/s)</Text>
                            <Input size="sm" type="number" value={egressRate} onChange={(e) => { setEgressRate(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                          </Box>
                        </Flex>
                      )}
                    </Box>

                    {/* RRM Collapsible */}
                    <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                      <Flex justify="space-between" align="center">
                        <HStack gap={2}>
                          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>RRM (802.11k/v)</Text>
                          <FieldInfoTooltip tooltip="Radio Resource Management neighbor reporting" />
                        </HStack>
                        <ToggleSwitch checked={rrmEnabled} onChange={(v) => { setRrmEnabled(v); markDirty(); }} />
                      </Flex>
                      {rrmEnabled && (
                        <VStack gap={3} align="stretch" mt={3} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                          <Flex gap={4} wrap="wrap">
                            <ToggleSwitch checked={neighborReporting} onChange={(v) => { setNeighborReporting(v); markDirty(); }} label="neighbor-reporting" />
                            <ToggleSwitch checked={ftmResponder} onChange={(v) => { setFtmResponder(v); markDirty(); }} label="ftm-responder" />
                            <ToggleSwitch checked={stationaryAp} onChange={(v) => { setStationaryAp(v); markDirty(); }} label="stationary-ap" />
                          </Flex>
                          <Flex gap={3}>
                            <Box flex="1">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>lci (Location Config)</Text>
                              <Input size="sm" value={lci} onChange={(e) => { setLci(e.target.value); markDirty(); }} bg="#ffffff" />
                            </Box>
                            <Box flex="1">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>civic-location</Text>
                              <Input size="sm" value={civicLocation} onChange={(e) => { setCivicLocation(e.target.value); markDirty(); }} bg="#ffffff" />
                            </Box>
                          </Flex>
                        </VStack>
                      )}
                    </Box>

                    {/* Captive Portal Settings */}
                    <Box p={3.5} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                      <CaptivePortalSection
                        config={captivePortalConfig}
                        onChange={(c) => {
                          setCaptivePortalConfig(c);
                          markDirty();
                        }}
                      />
                    </Box>

                    {/* Access Control List */}
                    <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                      <Flex justify="space-between" align="center">
                        <HStack gap={2}>
                          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>Access Control List (ACL)</Text>
                          <FieldInfoTooltip tooltip="MAC-based client filtering" />
                        </HStack>
                        <ToggleSwitch checked={aclEnabled} onChange={(v) => { setAclEnabled(v); markDirty(); }} />
                      </Flex>
                      {aclEnabled && (
                        <Flex gap={3} mt={3} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                          <Box w="120px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>mode</Text>
                            <SelectDropdown value={aclMode} onChange={(v) => { setAclMode(v); markDirty(); }} options={[{ value: 'allow', label: 'Allow' }, { value: 'deny', label: 'Deny' }]} />
                          </Box>
                          <Box flex="1">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>mac-address</Text>
                            <Input size="sm" value={aclMacAddress} onChange={(e) => { setAclMacAddress(e.target.value); markDirty(); }} bg="#ffffff" />
                          </Box>
                        </Flex>
                      )}
                    </Box>

                    {/* Roaming 802.11r */}
                    <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                      <Flex justify="space-between" align="center">
                        <HStack gap={2}>
                          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>Roaming (802.11r Fast BSS)</Text>
                          <FieldInfoTooltip tooltip="Fast BSS transition across property APs" />
                        </HStack>
                        <Box w="130px">
                          <SelectDropdown
                            value={roamingState}
                            onChange={(v) => { setRoamingState(v); markDirty(); }}
                            options={[
                              { value: 'off', label: 'Off' },
                              { value: 'auto', label: 'Auto' },
                              { value: 'custom', label: 'Custom' },
                            ]}
                          />
                        </Box>
                      </Flex>
                      {roamingState === 'custom' && (
                        <VStack gap={3} align="stretch" mt={3} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                          <Flex gap={3} wrap="wrap">
                            <Box w="130px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>message-exchange</Text>
                              <SelectDropdown value={roamingExchange} onChange={(v) => { setRoamingExchange(v); markDirty(); }} options={[{ value: 'air', label: 'air' }, { value: 'ds', label: 'ds' }]} />
                            </Box>
                            <Box w="130px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>domain-identifier</Text>
                              <Input size="sm" value={roamingDomainId} onChange={(e) => { setRoamingDomainId(e.target.value); markDirty(); }} bg="#ffffff" />
                            </Box>
                            <Box pt={5}>
                              <ToggleSwitch checked={roamingGeneratePsk} onChange={(v) => { setRoamingGeneratePsk(v); markDirty(); }} label="generate-psk" />
                            </Box>
                          </Flex>
                          <Flex gap={3}>
                            <Box flex="1">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>pmk-r0-key-holder</Text>
                              <Input size="sm" value={roamingPmkR0} onChange={(e) => { setRoamingPmkR0(e.target.value); markDirty(); }} bg="#ffffff" placeholder="NAS Identifier" />
                            </Box>
                            <Box flex="1">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>pmk-r1-key-holder</Text>
                              <Input size="sm" value={roamingPmkR1} onChange={(e) => { setRoamingPmkR1(e.target.value); markDirty(); }} bg="#ffffff" placeholder="R1 key holder" />
                            </Box>
                          </Flex>
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                </Box>
              )}

              {/* ---------------- SECTION: VLAN ---------------- */}
              {profile.prefix === 'interface.vlan' && (
                <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={4} pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                    VLAN Profile Parameters
                  </Text>
                  <VStack gap={3.5} align="stretch">
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>vlan-id *</Text>
                      <Input size="sm" type="number" w="180px" value={vlanId} onChange={(e) => { setVlanId(Number(e.target.value)); markDirty(); }} />
                    </Flex>
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>description</Text>
                      <Input size="sm" flex="1" value={vlanDescription} onChange={(e) => { setVlanDescription(e.target.value); markDirty(); }} />
                    </Flex>
                  </VStack>
                </Box>
              )}

              {/* ---------------- SECTION: IPV4 ---------------- */}
              {profile.prefix === 'interface.ipv4' && (
                <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
                  <Ipv4Section
                    config={ipv4Config}
                    onChange={(updated) => {
                      setIpv4Config(updated);
                      markDirty();
                    }}
                  />
                </Box>
              )}

              {/* ---------------- SECTION: INTERFACE.CAPTIVE ---------------- */}
              {profile.prefix === 'interface.captive' && (
                <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
                  <Flex justify="space-between" align="center" mb={4} pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                    <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
                      Captive Portal Profile Parameters
                    </Text>
                    <Box fontSize="11px" fontWeight="600" color={themeColors.brand.accent} bg="#eff6ff" px={2.5} py={0.5} borderRadius="4px">
                      prefix: interface.captive
                    </Box>
                  </Flex>
                  <CaptivePortalSection
                    config={
                      captivePortalConfig.authMode === 'none'
                        ? { ...captivePortalConfig, authMode: 'click-to-continue' }
                        : captivePortalConfig
                    }
                    onChange={(c) => {
                      setCaptivePortalConfig(c);
                      markDirty();
                    }}
                  />
                </Box>
              )}

              {/* ---------------- SECTION: TUNNEL ---------------- */}
              {profile.prefix === 'interface.tunnel' && (
                <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={4} pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                    Overlay Tunnel & Mesh Backhaul
                  </Text>
                  <VStack gap={3.5} align="stretch">
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>Protocol *</Text>
                      <Box w="180px">
                        <SelectDropdown value={tunnelProto} onChange={(v) => { setTunnelProto(v); markDirty(); }} options={[{ value: 'vxlan', label: 'VXLAN' }, { value: 'gre', label: 'GRE' }, { value: 'mesh', label: 'Mesh' }]} />
                      </Box>
                    </Flex>
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>Peer Endpoint IP</Text>
                      <Input size="sm" w="220px" value={tunnelPeerAddress} onChange={(e) => { setTunnelPeerAddress(e.target.value); markDirty(); }} />
                    </Flex>
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>Peer Port</Text>
                      <Input size="sm" w="120px" type="number" value={tunnelPeerPort} onChange={(e) => { setTunnelPeerPort(Number(e.target.value)); markDirty(); }} />
                    </Flex>
                    <Flex gap={3} wrap="wrap">
                      <Box flex="1" minW="180px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>Server FQDN / Endpoint</Text>
                        <Input size="sm" value={tunnelServer} onChange={(e) => { setTunnelServer(e.target.value); markDirty(); }} />
                      </Box>
                      <Box flex="1" minW="140px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>Username</Text>
                        <Input size="sm" value={tunnelUsername} onChange={(e) => { setTunnelUsername(e.target.value); markDirty(); }} />
                      </Box>
                      <Box flex="1" minW="140px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>Password</Text>
                        <Input size="sm" type="password" value={tunnelPassword} onChange={(e) => { setTunnelPassword(e.target.value); markDirty(); }} />
                      </Box>
                    </Flex>
                    <ToggleSwitch checked={tunnelHealthcheck} onChange={(v) => { setTunnelHealthcheck(v); markDirty(); }} label="Periodic Keepalive & Tunnel Healthcheck" />
                  </VStack>
                </Box>
              )}

              {/* ---------------- SECTION: RADIUS ---------------- */}
              {profile.prefix === 'interface.ssid.radius' && (
                <RadiusSection
                  config={radiusConfig}
                  onChange={(cfg) => {
                    setRadiusConfig(cfg);
                    markDirty();
                  }}
                />
              )}

              {/* ---------------- SECTION: OPENROAMING ---------------- */}
              {profile.prefix === 'interface.ssid.openroaming' && (
                <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={4} pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                    WBA OpenRoaming Federation Profile
                  </Text>
                  <VStack gap={3.5} align="stretch">
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>Federation Name *</Text>
                      <Input size="sm" flex="1" value={openRoamingName} onChange={(e) => { setOpenRoamingName(e.target.value); markDirty(); }} />
                    </Flex>
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>Consortium OI (Hex) *</Text>
                      <Input size="sm" flex="1" value={openRoamingConsortium} onChange={(e) => { setOpenRoamingConsortium(e.target.value); markDirty(); }} />
                    </Flex>
                  </VStack>
                </Box>
              )}
            </VStack>
      )}

      {/* Raw JSON Tab */}
      {activeTab === 'raw_json' && (
        <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
          <Flex justify="space-between" align="center" mb={3}>
            <Box>
              <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                Serialized OWPROV Variable JSON
              </Text>
              <Text fontSize="12px" color={themeColors.text.secondary}>
                Stored in the <Text as="span" fontFamily="monospace">variables</Text> table in OWPROV for substitution via <Text as="span" fontFamily="monospace">__variableBlock</Text>.
              </Text>
            </Box>
            <Button
              size="xs"
              variant="outline"
              borderColor={themeColors.panel.border}
              onClick={() => {
                navigator.clipboard.writeText(rawJsonString);
                setCopiedJson(true);
                setTimeout(() => setCopiedJson(false), 2000);
              }}
            >
              <Icon name="copy" size={13} />
              <Text ml={1}>{copiedJson ? 'Copied!' : 'Copy JSON'}</Text>
            </Button>
          </Flex>

          <Box
            as="pre"
            p={4}
            bg="#0f172a"
            color="#38bdf8"
            borderRadius="6px"
            fontSize="12px"
            fontFamily="monospace"
            overflowX="auto"
            maxH="450px"
          >
            {rawJsonString}
          </Box>
        </Box>
      )}

      {/* Multi-PSK Management Modal */}
      {isMultiPskModalOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(15, 23, 42, 0.6)"
          zIndex={1600}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <Box
            bg="#ffffff"
            borderRadius="8px"
            w="100%"
            maxW="560px"
            border="1px solid"
            borderColor={themeColors.panel.border}
            overflow="hidden"
            boxShadow="0 20px 25px -5px rgba(0,0,0,0.1)"
          >
            <Flex justify="space-between" align="center" px={5} py={4} bg="#f8fafc" borderBottom="1px solid" borderColor={themeColors.panel.divider}>
              <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                Manage Multi-PSK Entries
              </Text>
              <Button size="xs" variant="ghost" onClick={() => setIsMultiPskModalOpen(false)}>
                ✕
              </Button>
            </Flex>

            <Box p={5}>
              <Text fontSize="12px" color={themeColors.text.secondary} mb={4}>
                Multi-PSK maps individual client MAC addresses or resident keys to designated VLAN IDs.
              </Text>

              {/* Add New PSK Row */}
              <Flex gap={2} mb={4}>
                <Input
                  size="sm"
                  flex="1"
                  placeholder="MAC (optional)"
                  value={newPskMac}
                  onChange={(e) => setNewPskMac(e.target.value)}
                />
                <Input
                  size="sm"
                  flex="1.5"
                  placeholder="PSK Passphrase *"
                  value={newPskKey}
                  onChange={(e) => setNewPskKey(e.target.value)}
                />
                <Input
                  size="sm"
                  w="90px"
                  type="number"
                  placeholder="VLAN"
                  value={newPskVlan}
                  onChange={(e) => setNewPskVlan(Number(e.target.value))}
                />
                <Button size="sm" bg={themeColors.brand.accent} color="#ffffff" onClick={handleAddMultiPsk}>
                  Add
                </Button>
              </Flex>

              {/* List */}
              <VStack gap={2} align="stretch" maxH="220px" overflowY="auto">
                {multiPskEntries.length === 0 ? (
                  <Text fontSize="12px" color={themeColors.text.muted} textAlign="center" py={4}>
                    No custom Multi-PSK rules defined yet.
                  </Text>
                ) : (
                  multiPskEntries.map((psk) => (
                    <Flex
                      key={psk.id}
                      justify="space-between"
                      align="center"
                      p={2.5}
                      bg="#f8fafc"
                      borderRadius="4px"
                      border="1px solid"
                      borderColor={themeColors.panel.divider}
                      fontSize="12px"
                    >
                      <Box>
                        <Text fontWeight="600">{psk.key}</Text>
                        <Text fontSize="11px" color={themeColors.text.muted}>
                          MAC: {psk.mac || 'Any'} · VLAN: {psk.vlanId}
                        </Text>
                      </Box>
                      <Button size="xs" colorScheme="red" variant="ghost" onClick={() => handleRemoveMultiPsk(psk.id)}>
                        Remove
                      </Button>
                    </Flex>
                  ))
                )}
              </VStack>
            </Box>

            <Flex justify="flex-end" p={4} bg="#f8fafc" borderTop="1px solid" borderColor={themeColors.panel.divider}>
              <Button size="sm" bg={themeColors.brand.accent} color="#ffffff" onClick={() => setIsMultiPskModalOpen(false)}>
                Done
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* Sticky Bottom Bar for Unsaved Changes */}
      {hasUnsavedChanges && (
        <Box
          position="fixed"
          bottom={0}
          left={{ base: 0, md: '216px' }}
          right={0}
          bg="#ffffff"
          borderTop="1px solid"
          borderColor={themeColors.panel.border}
          py={3}
          px={6}
          boxShadow="0 -4px 6px -1px rgba(0,0,0,0.05)"
          zIndex={100}
        >
          <Flex justify="space-between" align="center">
            <HStack gap={2}>
              <Icon name="alertTriangle" size={16} color="#d97706" />
              <Text fontSize="13px" fontWeight="600" color={themeColors.text.title}>
                You have unsaved changes to this profile
              </Text>
            </HStack>
            <HStack gap={3}>
              <Button
                size="sm"
                variant="outline"
                borderColor={themeColors.panel.border}
                onClick={() => {
                  setProfile(initialProfile);
                  setHasUnsavedChanges(false);
                }}
              >
                Discard changes
              </Button>
              <Button
                size="sm"
                bg={themeColors.brand.accent}
                color="#ffffff"
                _hover={{ bg: themeColors.brand.accentHover }}
                onClick={handleSave}
                disabled={isSaving}
                loading={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save profile'}
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}
    </Box>
  );
};
