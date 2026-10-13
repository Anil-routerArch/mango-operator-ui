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
import {
  MOCK_CONFIGURATIONS,
  MOCK_PROPERTIES_LIST,
  MOCK_VENUES_LIST,
} from './mockData/mockConfigurations';
import type { ConfigurationProfile, ProfileSettingsValue } from './types/configuration';

export interface ProfileEditorPageProps {
  profile: ConfigurationProfile;
  onBack: () => void;
  onSave?: (updatedProfile: ConfigurationProfile) => void;
  onSelectConfig?: (configId: string) => void;
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
  onSelectConfig,
}) => {
  const [profile, setProfile] = useState<ConfigurationProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<'settings' | 'used_by' | 'raw_json'>('settings');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Metadata state
  const [name, setName] = useState<string>(initialProfile.name);
  const [description, setDescription] = useState<string>(initialProfile.description);
  const [deviceGroup, setDeviceGroup] = useState<string>(initialProfile.deviceGroup || 'ap');
  const [scopeType, setScopeType] = useState<'global' | 'property' | 'venue'>(
    initialProfile.venue ? 'venue' : initialProfile.entity ? 'property' : 'global'
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    initialProfile.entity || 'prop-sunrise-001'
  );
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    initialProfile.venue || '2211d28a-a985-434a-ad68-ca5ac4559852'
  );

  const pValues = initialProfile.parsedValues || {};

  // --- Radio parameters state ---
  const [radioBand, setRadioBand] = useState<string>(
    pValues.band ? String(pValues.band) : '5G'
  );
  const [radioChannel, setRadioChannel] = useState<string>(
    pValues.channel ? String(pValues.channel) : 'auto'
  );
  const [channelWidth, setChannelWidth] = useState<string>(
    pValues['channel-width'] ? String(pValues['channel-width']) : '40'
  );
  const [bandwidth, setBandwidth] = useState<string>(
    pValues.bandwidth ? String(pValues.bandwidth) : '10'
  );
  const [channelMode, setChannelMode] = useState<string>(
    pValues['channel-mode'] ? String(pValues['channel-mode']) : 'HT'
  );
  const [mimo, setMimo] = useState<string>(
    pValues.mimo ? String(pValues.mimo) : '2x2'
  );
  const [txPower, setTxPower] = useState<number>(
    pValues['tx-power'] !== undefined ? Number(pValues['tx-power']) : 0
  );
  const [country, setCountry] = useState<string>(
    pValues.country ? String(pValues.country) : 'US'
  );
  const [allowDfs, setAllowDfs] = useState<boolean>(
    pValues['allow-dfs'] !== undefined ? Boolean(pValues['allow-dfs']) : true
  );
  const [beaconInterval, setBeaconInterval] = useState<number>(
    pValues['beacon-interval'] !== undefined ? Number(pValues['beacon-interval']) : 100
  );
  const [radioMaxClients, setRadioMaxClients] = useState<number>(
    pValues['maximum-clients'] !== undefined ? Number(pValues['maximum-clients']) : 64
  );
  const [legacyRates, setLegacyRates] = useState<boolean>(
    pValues['legacy-rates'] !== undefined ? Boolean(pValues['legacy-rates']) : false
  );
  const [requireMode, setRequireMode] = useState<string>(
    pValues['require-mode'] ? String(pValues['require-mode']) : 'None'
  );
  const [ratesBeacon, setRatesBeacon] = useState<number>(
    pValues['rates.beacon'] !== undefined ? Number(pValues['rates.beacon']) : 6000
  );
  const [ratesMulticast, setRatesMulticast] = useState<number>(
    pValues['rates.multicast'] !== undefined ? Number(pValues['rates.multicast']) : 6000
  );
  const [heBssColor, setHeBssColor] = useState<number>(
    pValues['he.bss-color'] !== undefined ? Number(pValues['he.bss-color']) : 1
  );
  const [heMultipleBssid, setHeMultipleBssid] = useState<boolean>(
    pValues['he.multiple-bssid'] !== undefined ? Boolean(pValues['he.multiple-bssid']) : false
  );
  const [heEma, setHeEma] = useState<boolean>(
    pValues['he.ema'] !== undefined ? Boolean(pValues['he.ema']) : false
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
  const [passPointEnabled, setPassPointEnabled] = useState<boolean>(false);
  const [ppVenueName, setPpVenueName] = useState<string>('eng:Example passpoint_venue');
  const [ppVenueUrl, setPpVenueUrl] = useState<string>('http://www.example.com/info');
  const [ppVenueGroup, setPpVenueGroup] = useState<number>(1);
  const [ppVenueType, setPpVenueType] = useState<number>(1);
  const [ppAuthType, setPpAuthType] = useState<string>('terms-and-conditions');
  const [ppDomainName, setPpDomainName] = useState<string>('example.com');
  const [ppAnqpDomain, setPpAnqpDomain] = useState<number>(8888);
  const [ppRoamingConsortium, setPpRoamingConsortium] = useState<string>('BAA2D00100');

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
  const [captiveAuthMode, setCaptiveAuthMode] = useState<string>('none');
  const [walledGardenFqdn, setWalledGardenFqdn] = useState<string>('*.google.com');
  const [walledGardenIp, setWalledGardenIp] = useState<string>('192.168.0.1');
  const [idleTimeout, setIdleTimeout] = useState<number>(600);
  const [sessionTimeout, setSessionTimeout] = useState<number>(3600);
  const [uamServer, setUamServer] = useState<string>('auth.captive.local');
  const [uamSecret, setUamSecret] = useState<string>('uam_secret_key');
  const [uamPort, setUamPort] = useState<number>(3990);
  const [nasid, setNasid] = useState<string>('MDU-AP-01');

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
  const [ipv4Addressing, setIpv4Addressing] = useState<string>(
    pValues.addressing ? String(pValues.addressing) : 'dhcp'
  );
  const [ipv4Subnet, setIpv4Subnet] = useState<string>(
    pValues.subnet ? String(pValues.subnet) : '192.168.1.0/24'
  );
  const [ipv4Gateway, setIpv4Gateway] = useState<string>(
    pValues.gateway ? String(pValues.gateway) : '192.168.1.1'
  );
  const [sendHostname, setSendHostname] = useState<boolean>(true);
  const [dhcpEnabled, setDhcpEnabled] = useState<boolean>(true);
  const [dhcpLeaseFirst, setDhcpLeaseFirst] = useState<number>(10);
  const [dhcpLeaseCount, setDhcpLeaseCount] = useState<number>(150);
  const [dhcpLeaseTime, setDhcpLeaseTime] = useState<string>('6h');

  // --- Tunnel parameters state ---
  const [tunnelProto, setTunnelProto] = useState<string>('vxlan');
  const [tunnelPeerAddress, setTunnelPeerAddress] = useState<string>('192.168.10.1');
  const [tunnelPeerPort, setTunnelPeerPort] = useState<number>(4700);
  const [tunnelServer, setTunnelServer] = useState<string>('vpn.routerarch.com');
  const [tunnelUsername, setTunnelUsername] = useState<string>('resident-gw');
  const [tunnelPassword, setTunnelPassword] = useState<string>('');
  const [tunnelHealthcheck, setTunnelHealthcheck] = useState<boolean>(true);

  // --- RADIUS parameters state ---
  const [nasIdentifier, setNasIdentifier] = useState<string>('Radius-MDU-Cluster');
  const [chargeableUserId, setChargeableUserId] = useState<boolean>(false);
  const [radiusAuthHost, setRadiusAuthHost] = useState<string>('192.168.178.192');
  const [radiusAuthPort, setRadiusAuthPort] = useState<number>(1812);
  const [radiusAuthSecret, setRadiusAuthSecret] = useState<string>('radius_secret_token');
  const [radiusAcctHost, setRadiusAcctHost] = useState<string>('192.168.178.192');
  const [radiusAcctPort, setRadiusAcctPort] = useState<number>(1813);
  const [radiusAcctSecret, setRadiusAcctSecret] = useState<string>('radius_secret_token');
  const [localFallbackEnabled, setLocalFallbackEnabled] = useState<boolean>(false);

  // --- OpenRoaming parameters state ---
  const [openRoamingName, setOpenRoamingName] = useState<string>('OpenRoaming');
  const [openRoamingConsortium, setOpenRoamingConsortium] = useState<string>('5A03BA0000');

  const filteredVenues = MOCK_VENUES_LIST.filter(
    (v) => v.propertyId === selectedPropertyId
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
      return {
        band: radioBand,
        channel: radioChannel,
        'channel-width': channelWidth,
        bandwidth: bandwidth,
        'channel-mode': channelMode,
        mimo,
        'tx-power': txPower,
        country,
        'allow-dfs': allowDfs,
        'beacon-interval': beaconInterval,
        'maximum-clients': radioMaxClients,
        'legacy-rates': legacyRates,
        'require-mode': requireMode,
        'rates.beacon': ratesBeacon,
        'rates.multicast': ratesMulticast,
        'he.bss-color': heBssColor,
        'he.multiple-bssid': heMultipleBssid,
        'he.ema': heEma,
      };
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
        'captive-auth-mode': captiveAuthMode,
        'walled-garden-fqdn': walledGardenFqdn,
        'walled-garden-ip': walledGardenIp,
        'idle-timeout': idleTimeout,
        'session-timeout': sessionTimeout,
        'uam-server': uamServer,
        'uam-secret': uamSecret,
        'uam-port': uamPort,
        nasid,
        'acl-enabled': aclEnabled,
        'acl-mode': aclMode,
        'acl-mac': aclMacAddress,
        'roaming-state': roamingState,
        'roaming-exchange': roamingExchange,
        'roaming-domain-id': roamingDomainId,
        'roaming-generate-psk': roamingGeneratePsk,
        'pmk-r0-key-holder': roamingPmkR0,
        'pmk-r1-key-holder': roamingPmkR1,
        'passpoint-enabled': passPointEnabled,
        'venue-name': ppVenueName,
        'venue-url': ppVenueUrl,
        'venue-group': ppVenueGroup,
        'venue-type': ppVenueType,
        'auth-type': ppAuthType,
        'domain-name': ppDomainName,
        'anqp-domain': ppAnqpDomain,
        'roaming-consortium': ppRoamingConsortium,
      };
    }

    if (profile.prefix === 'interface.vlan') {
      return {
        'vlan-id': vlanId,
        description: vlanDescription,
      };
    }

    if (profile.prefix === 'interface.ipv4') {
      return {
        addressing: ipv4Addressing,
        subnet: ipv4Subnet,
        gateway: ipv4Gateway,
        'send-hostname': sendHostname,
        'dhcp-enabled': dhcpEnabled,
        'dhcp-lease-first': dhcpLeaseFirst,
        'dhcp-lease-count': dhcpLeaseCount,
        'dhcp-lease-time': dhcpLeaseTime,
      };
    }

    if (profile.prefix === 'interface.captive') {
      return {
        'auth-mode': captiveAuthMode,
        'walled-garden-fqdn': walledGardenFqdn,
        'walled-garden-ip': walledGardenIp,
        'idle-timeout': idleTimeout,
        'session-timeout': sessionTimeout,
        'uam-server': uamServer,
        'uam-secret': uamSecret,
        'uam-port': uamPort,
        nasid,
      };
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
      return {
        'nas-identifier': nasIdentifier,
        'chargeable-user-id': chargeableUserId,
        'auth-host': radiusAuthHost,
        'auth-port': radiusAuthPort,
        'auth-secret': radiusAuthSecret,
        'acct-host': radiusAcctHost,
        'acct-port': radiusAcctPort,
        'acct-secret': radiusAcctSecret,
        'local-fallback': localFallbackEnabled,
      };
    }

    if (profile.prefix === 'interface.ssid.openroaming') {
      return {
        name: openRoamingName,
        'roaming-consortium': openRoamingConsortium,
      };
    }

    return profile.parsedValues;
  };

  const handleSave = () => {
    const values = buildCurrentValues();
    const serialized = JSON.stringify(values, null, 2);

    const updatedProfile: ConfigurationProfile = {
      ...profile,
      name,
      description,
      deviceGroup,
      entity: scopeType === 'global' ? '' : selectedPropertyId,
      entityName:
        scopeType === 'global'
          ? 'Global Scope'
          : MOCK_PROPERTIES_LIST.find((p) => p.id === selectedPropertyId)?.name || 'Property',
      venue: scopeType === 'venue' ? selectedVenueId : '',
      venueName:
        scopeType === 'venue'
          ? MOCK_VENUES_LIST.find((v) => v.id === selectedVenueId)?.name || 'Venue'
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

    setProfile(updatedProfile);
    setHasUnsavedChanges(false);
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 4000);

    onSave?.(updatedProfile);
  };

  // Find referencing configurations
  const referencingConfigs = MOCK_CONFIGURATIONS.filter((c) =>
    profile.configurations.includes(c.id)
  );

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
            disabled={!hasUnsavedChanges}
          >
            Save changes
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
          fontWeight={activeTab === 'used_by' ? '600' : '400'}
          color={activeTab === 'used_by' ? themeColors.text.primary : themeColors.text.secondary}
          position="relative"
          onClick={() => setActiveTab('used_by')}
          _after={
            activeTab === 'used_by'
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
          Referencing Configurations ({profile.configurations.length})
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
        <>
          {/* Blue Info Callout */}
          <Flex
            bg="#f0f9ff"
            border="1px solid"
            borderColor="#bae6fd"
            borderRadius="6px"
            p={3.5}
            mb={4}
            justify="space-between"
            align="center"
          >
            <HStack gap={3}>
              <Box color="#0284c7">
                <Icon name="info" size={18} color="#0284c7" />
              </Box>
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#0369a1">
                  Reusable Variable Block ({profile.prefix})
                </Text>
                <Text fontSize="11px" color="#0284c7">
                  All devices referencing this profile inherit these parameters. Overrides can be applied per-AP or per-venue.
                </Text>
              </Box>
            </HStack>
          </Flex>

          {/* Two-Column Form & Summary */}
          <Flex gap={5} align="flex-start" direction={{ base: 'column', lg: 'row' }}>
            {/* Left Form Column */}
            <VStack flex="1.6" gap={4} align="stretch">
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
                          variant={scopeType === 'global' ? 'solid' : 'outline'}
                          bg={scopeType === 'global' ? themeColors.brand.accent : '#ffffff'}
                          color={scopeType === 'global' ? '#ffffff' : themeColors.text.primary}
                          borderColor={scopeType === 'global' ? themeColors.brand.accent : themeColors.panel.border}
                          onClick={() => {
                            setScopeType('global');
                            markDirty();
                          }}
                        >
                          Global
                        </Button>
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
                          Property
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
                          Venue
                        </Button>
                      </HStack>

                      {scopeType !== 'global' && (
                        <Flex gap={2} pt={1}>
                          <Box flex="1">
                            <SelectDropdown
                              value={selectedPropertyId}
                              onChange={(val) => {
                                setSelectedPropertyId(val);
                                markDirty();
                              }}
                              options={MOCK_PROPERTIES_LIST.map((p) => ({
                                value: p.id,
                                label: p.name,
                              }))}
                            />
                          </Box>
                          {scopeType === 'venue' && (
                            <Box flex="1">
                              <SelectDropdown
                                value={selectedVenueId}
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
                      )}
                    </VStack>
                  </Flex>
                </VStack>
              </Box>

              {/* ---------------- SECTION: RADIO ---------------- */}
              {profile.prefix === 'radio' && (
                <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
                  <Flex justify="space-between" align="center" mb={4} pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                    <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
                      Radio Parameters ({radioBand})
                    </Text>
                    <Box fontSize="11px" fontWeight="600" color={themeColors.brand.accent} bg="#eff6ff" px={2.5} py={0.5} borderRadius="4px">
                      prefix: radio
                    </Box>
                  </Flex>

                  <VStack gap={4} align="stretch">
                    {/* Primary RF Settings */}
                    <Flex gap={3} wrap="wrap">
                      <Box flex="1" minW="130px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          band <Text as="span" color="red.500">*</Text>
                        </Text>
                        <SelectDropdown
                          value={radioBand}
                          onChange={(val) => {
                            setRadioBand(val);
                            markDirty();
                          }}
                          options={[
                            { value: '5G', label: '5 GHz (5G)' },
                            { value: '2G', label: '2.4 GHz (2G)' },
                            { value: '5G-lower', label: '5G Lower' },
                            { value: '5G-upper', label: '5G Upper' },
                            { value: '6G', label: '6 GHz (6G)' },
                          ]}
                        />
                      </Box>

                      <Box flex="1" minW="130px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          channel <Text as="span" color="red.500">*</Text>
                        </Text>
                        <SelectDropdown
                          value={radioChannel}
                          onChange={(val) => {
                            setRadioChannel(val);
                            markDirty();
                          }}
                          options={[
                            { value: 'auto', label: 'Auto (ACS / RRM)' },
                            { value: '36', label: '36 (5180 MHz)' },
                            { value: '40', label: '40 (5200 MHz)' },
                            { value: '44', label: '44 (5220 MHz)' },
                            { value: '48', label: '48 (5240 MHz)' },
                            { value: '149', label: '149 (5745 MHz)' },
                            { value: '153', label: '153 (5765 MHz)' },
                            { value: '157', label: '157 (5785 MHz)' },
                            { value: '161', label: '161 (5805 MHz)' },
                            { value: '1', label: '1 (2412 MHz)' },
                            { value: '6', label: '6 (2437 MHz)' },
                            { value: '11', label: '11 (2462 MHz)' },
                          ]}
                        />
                      </Box>

                      <Box flex="1" minW="130px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          channel-width <Text as="span" color="red.500">*</Text>
                        </Text>
                        <SelectDropdown
                          value={channelWidth}
                          onChange={(val) => {
                            setChannelWidth(val);
                            markDirty();
                          }}
                          options={[
                            { value: '20', label: '20 MHz' },
                            { value: '40', label: '40 MHz' },
                            { value: '80', label: '80 MHz' },
                            { value: '160', label: '160 MHz' },
                          ]}
                        />
                      </Box>

                      <Box flex="1" minW="120px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          bandwidth <Text as="span" color="red.500">*</Text>
                        </Text>
                        <SelectDropdown
                          value={bandwidth}
                          onChange={(val) => {
                            setBandwidth(val);
                            markDirty();
                          }}
                          options={[
                            { value: '5', label: '5 MHz' },
                            { value: '10', label: '10 MHz' },
                            { value: '20', label: '20 MHz' },
                          ]}
                        />
                      </Box>
                    </Flex>

                    {/* Channel Mode & Hardware Constraints */}
                    <Flex gap={3} wrap="wrap">
                      <Box flex="1" minW="140px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          channel-mode <Text as="span" color="red.500">*</Text>
                        </Text>
                        <SelectDropdown
                          value={channelMode}
                          onChange={(val) => {
                            setChannelMode(val);
                            markDirty();
                          }}
                          options={[
                            { value: 'HT', label: 'HT (802.11n)' },
                            { value: 'VHT', label: 'VHT (802.11ac)' },
                            { value: 'HE', label: 'HE (Wi-Fi 6)' },
                            { value: 'EHT', label: 'EHT (Wi-Fi 7)' },
                          ]}
                        />
                      </Box>

                      <Box flex="1" minW="120px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          mimo
                        </Text>
                        <SelectDropdown
                          value={mimo}
                          onChange={(val) => {
                            setMimo(val);
                            markDirty();
                          }}
                          options={[
                            { value: '1x1', label: '1x1' },
                            { value: '2x2', label: '2x2' },
                            { value: '3x3', label: '3x3' },
                            { value: '4x4', label: '4x4' },
                            { value: '8x8', label: '8x8' },
                          ]}
                        />
                      </Box>

                      <Box flex="1" minW="120px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          tx-power (dBm) <Text as="span" color="red.500">*</Text>
                        </Text>
                        <Input
                          size="sm"
                          type="number"
                          value={txPower}
                          onChange={(e) => {
                            setTxPower(Number(e.target.value));
                            markDirty();
                          }}
                          placeholder="0 = Auto / Max"
                        />
                      </Box>

                      <Box flex="1" minW="130px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          country <Text as="span" color="red.500">*</Text>
                        </Text>
                        <SelectDropdown
                          value={country}
                          onChange={(val) => {
                            setCountry(val);
                            markDirty();
                          }}
                          options={[
                            { value: 'US', label: 'United States (US)' },
                            { value: 'CA', label: 'Canada (CA)' },
                            { value: 'GB', label: 'United Kingdom (GB)' },
                            { value: 'DE', label: 'Germany (DE)' },
                            { value: 'FR', label: 'France (FR)' },
                            { value: 'IN', label: 'India (IN)' },
                            { value: 'AU', label: 'Australia (AU)' },
                          ]}
                        />
                      </Box>
                    </Flex>

                    {/* Operational Limits & DFS */}
                    <Flex gap={4} wrap="wrap" align="center">
                      <Box flex="1" minW="130px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          beacon-interval (ms)
                        </Text>
                        <Input
                          size="sm"
                          type="number"
                          value={beaconInterval}
                          onChange={(e) => {
                            setBeaconInterval(Number(e.target.value));
                            markDirty();
                          }}
                        />
                      </Box>

                      <Box flex="1" minW="130px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          maximum-clients
                        </Text>
                        <Input
                          size="sm"
                          type="number"
                          value={radioMaxClients}
                          onChange={(e) => {
                            setRadioMaxClients(Number(e.target.value));
                            markDirty();
                          }}
                        />
                      </Box>

                      <Box pt={4}>
                        <ToggleSwitch
                          checked={allowDfs}
                          onChange={(val) => {
                            setAllowDfs(val);
                            markDirty();
                          }}
                          label="allow-dfs (DFS Channels)"
                        />
                      </Box>

                      <Box pt={4}>
                        <ToggleSwitch
                          checked={legacyRates}
                          onChange={(val) => {
                            setLegacyRates(val);
                            markDirty();
                          }}
                          label="legacy-rates (802.11b)"
                        />
                      </Box>
                    </Flex>

                    {/* Advanced Wi-Fi Rates & 802.11ax/Wi-Fi 6 */}
                    <Box p={3.5} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                      <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2.5}>
                        Wi-Fi Rates & 802.11ax (Wi-Fi 6) Advanced Parameters
                      </Text>

                      <Flex gap={3} mb={3} wrap="wrap">
                        <Box w="140px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>require-mode</Text>
                          <SelectDropdown
                            value={requireMode}
                            onChange={(val) => {
                              setRequireMode(val);
                              markDirty();
                            }}
                            options={[
                              { value: 'None', label: 'None' },
                              { value: 'HT', label: 'HT' },
                              { value: 'VHT', label: 'VHT' },
                              { value: 'HE', label: 'HE' },
                            ]}
                          />
                        </Box>

                        <Box w="130px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>beacon-rate (kbps)</Text>
                          <Input
                            size="sm"
                            type="number"
                            value={ratesBeacon}
                            onChange={(e) => {
                              setRatesBeacon(Number(e.target.value));
                              markDirty();
                            }}
                            bg="#ffffff"
                          />
                        </Box>

                        <Box w="130px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>multicast-rate (kbps)</Text>
                          <Input
                            size="sm"
                            type="number"
                            value={ratesMulticast}
                            onChange={(e) => {
                              setRatesMulticast(Number(e.target.value));
                              markDirty();
                            }}
                            bg="#ffffff"
                          />
                        </Box>

                        <Box w="110px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>bss-color (1-63)</Text>
                          <Input
                            size="sm"
                            type="number"
                            value={heBssColor}
                            onChange={(e) => {
                              setHeBssColor(Number(e.target.value));
                              markDirty();
                            }}
                            bg="#ffffff"
                          />
                        </Box>
                      </Flex>

                      <Flex gap={5} align="center" wrap="wrap">
                        <ToggleSwitch
                          checked={heMultipleBssid}
                          onChange={(val) => {
                            setHeMultipleBssid(val);
                            markDirty();
                          }}
                          label="multiple-bssid (802.11ax)"
                        />
                        <ToggleSwitch
                          checked={heEma}
                          onChange={(val) => {
                            setHeEma(val);
                            markDirty();
                          }}
                          label="ema (Enhanced Multi-BSSID)"
                        />
                      </Flex>
                    </Box>
                  </VStack>
                </Box>
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

                    {/* Passpoint / Hotspot 2.0 */}
                    <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                      <Flex justify="space-between" align="center">
                        <HStack gap={2}>
                          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>Passpoint (Hotspot 2.0)</Text>
                          <FieldInfoTooltip tooltip="Wi-Fi CERTIFIED Passpoint / 802.11u" />
                        </HStack>
                        <ToggleSwitch
                          checked={passPointEnabled}
                          onChange={(val) => {
                            setPassPointEnabled(val);
                            markDirty();
                          }}
                        />
                      </Flex>
                      {passPointEnabled && (
                        <VStack gap={3} align="stretch" mt={3} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                          <Flex gap={3} wrap="wrap">
                            <Box flex="1" minW="180px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>venue-name</Text>
                              <Input size="sm" value={ppVenueName} onChange={(e) => { setPpVenueName(e.target.value); markDirty(); }} bg="#ffffff" />
                            </Box>
                            <Box flex="1" minW="180px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>venue-url</Text>
                              <Input size="sm" value={ppVenueUrl} onChange={(e) => { setPpVenueUrl(e.target.value); markDirty(); }} bg="#ffffff" />
                            </Box>
                            <Box w="110px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>auth-type</Text>
                              <SelectDropdown value={ppAuthType} onChange={(v) => { setPpAuthType(v); markDirty(); }} options={[{ value: 'terms-and-conditions', label: 'T&C' }, { value: 'online-enrollment', label: 'Enroll' }]} />
                            </Box>
                          </Flex>
                          <Flex gap={3} wrap="wrap">
                            <Box flex="1">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>domain-name</Text>
                              <Input size="sm" value={ppDomainName} onChange={(e) => { setPpDomainName(e.target.value); markDirty(); }} bg="#ffffff" />
                            </Box>
                            <Box w="130px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>anqp-domain</Text>
                              <Input size="sm" type="number" value={ppAnqpDomain} onChange={(e) => { setPpAnqpDomain(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                            </Box>
                            <Box flex="1">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>roaming-consortium</Text>
                              <Input size="sm" value={ppRoamingConsortium} onChange={(e) => { setPpRoamingConsortium(e.target.value); markDirty(); }} bg="#ffffff" />
                            </Box>
                          </Flex>
                          <Flex gap={3} wrap="wrap">
                            <Box w="120px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>venue-group</Text>
                              <Input size="sm" type="number" value={ppVenueGroup} onChange={(e) => { setPpVenueGroup(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                            </Box>
                            <Box w="120px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>venue-type</Text>
                              <Input size="sm" type="number" value={ppVenueType} onChange={(e) => { setPpVenueType(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                            </Box>
                          </Flex>
                        </VStack>
                      )}
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
                    <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                      <Flex justify="space-between" align="center">
                        <HStack gap={2}>
                          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>Captive Portal</Text>
                          <FieldInfoTooltip tooltip="Guest splash page and authentication" />
                        </HStack>
                        <Box w="140px">
                          <SelectDropdown
                            value={captiveAuthMode}
                            onChange={(v) => { setCaptiveAuthMode(v); markDirty(); }}
                            options={[
                              { value: 'none', label: 'None' },
                              { value: 'click', label: 'Click' },
                              { value: 'radius', label: 'Radius' },
                              { value: 'credentials', label: 'Credentials' },
                              { value: 'uam', label: 'UAM' },
                            ]}
                          />
                        </Box>
                      </Flex>
                      {captiveAuthMode !== 'none' && (
                        <VStack gap={3} align="stretch" mt={3} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                          <Flex gap={3} wrap="wrap">
                            <Box flex="1" minW="180px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>walled-garden-fqdn</Text>
                              <Input size="sm" value={walledGardenFqdn} onChange={(e) => { setWalledGardenFqdn(e.target.value); markDirty(); }} bg="#ffffff" />
                            </Box>
                            <Box flex="1" minW="140px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>walled-garden-ip</Text>
                              <Input size="sm" value={walledGardenIp} onChange={(e) => { setWalledGardenIp(e.target.value); markDirty(); }} bg="#ffffff" />
                            </Box>
                            <Box w="120px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>idle-timeout (s)</Text>
                              <Input size="sm" type="number" value={idleTimeout} onChange={(e) => { setIdleTimeout(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                            </Box>
                            <Box w="120px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>session-timeout (s)</Text>
                              <Input size="sm" type="number" value={sessionTimeout} onChange={(e) => { setSessionTimeout(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                            </Box>
                          </Flex>
                          {captiveAuthMode === 'uam' && (
                            <Flex gap={3} wrap="wrap">
                              <Box flex="1" minW="160px">
                                <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>uam-server</Text>
                                <Input size="sm" value={uamServer} onChange={(e) => { setUamServer(e.target.value); markDirty(); }} bg="#ffffff" />
                              </Box>
                              <Box flex="1" minW="140px">
                                <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>uam-secret</Text>
                                <Input size="sm" type="password" value={uamSecret} onChange={(e) => { setUamSecret(e.target.value); markDirty(); }} bg="#ffffff" />
                              </Box>
                              <Box w="100px">
                                <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>uam-port</Text>
                                <Input size="sm" type="number" value={uamPort} onChange={(e) => { setUamPort(Number(e.target.value)); markDirty(); }} bg="#ffffff" />
                              </Box>
                              <Box w="120px">
                                <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>nasid</Text>
                                <Input size="sm" value={nasid} onChange={(e) => { setNasid(e.target.value); markDirty(); }} bg="#ffffff" />
                              </Box>
                            </Flex>
                          )}
                        </VStack>
                      )}
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
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={4} pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                    IPv4 Subnet & DHCP Parameters
                  </Text>
                  <VStack gap={3.5} align="stretch">
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>Addressing Mode *</Text>
                      <Box w="180px">
                        <SelectDropdown value={ipv4Addressing} onChange={(v) => { setIpv4Addressing(v); markDirty(); }} options={[{ value: 'dhcp', label: 'DHCP Client' }, { value: 'static', label: 'Static IP' }]} />
                      </Box>
                    </Flex>
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>Subnet CIDR</Text>
                      <Input size="sm" w="220px" value={ipv4Subnet} onChange={(e) => { setIpv4Subnet(e.target.value); markDirty(); }} />
                    </Flex>
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>Default Gateway</Text>
                      <Input size="sm" w="220px" value={ipv4Gateway} onChange={(e) => { setIpv4Gateway(e.target.value); markDirty(); }} />
                    </Flex>
                    <Flex gap={4} wrap="wrap">
                      <ToggleSwitch checked={sendHostname} onChange={(v) => { setSendHostname(v); markDirty(); }} label="send-hostname" />
                      <ToggleSwitch checked={dhcpEnabled} onChange={(v) => { setDhcpEnabled(v); markDirty(); }} label="Run DHCP Server on Interface" />
                    </Flex>
                    {dhcpEnabled && (
                      <Flex gap={3} wrap="wrap" pt={2} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                        <Box w="120px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>lease-first</Text>
                          <Input size="sm" type="number" value={dhcpLeaseFirst} onChange={(e) => { setDhcpLeaseFirst(Number(e.target.value)); markDirty(); }} />
                        </Box>
                        <Box w="120px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>lease-count</Text>
                          <Input size="sm" type="number" value={dhcpLeaseCount} onChange={(e) => { setDhcpLeaseCount(Number(e.target.value)); markDirty(); }} />
                        </Box>
                        <Box w="120px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>lease-time</Text>
                          <Input size="sm" value={dhcpLeaseTime} onChange={(e) => { setDhcpLeaseTime(e.target.value); markDirty(); }} />
                        </Box>
                      </Flex>
                    )}
                  </VStack>
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
                <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={4} pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                    Enterprise RADIUS Authentication Server
                  </Text>
                  <VStack gap={3.5} align="stretch">
                    <Flex align="center">
                      <Text w="160px" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>NAS Identifier *</Text>
                      <Input size="sm" flex="1" value={nasIdentifier} onChange={(e) => { setNasIdentifier(e.target.value); markDirty(); }} />
                    </Flex>
                    <Flex gap={3}>
                      <Box flex="2">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>Auth Host</Text>
                        <Input size="sm" value={radiusAuthHost} onChange={(e) => { setRadiusAuthHost(e.target.value); markDirty(); }} />
                      </Box>
                      <Box w="90px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>Port</Text>
                        <Input size="sm" type="number" value={radiusAuthPort} onChange={(e) => { setRadiusAuthPort(Number(e.target.value)); markDirty(); }} />
                      </Box>
                      <Box flex="2">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>Shared Secret</Text>
                        <Input size="sm" type="password" value={radiusAuthSecret} onChange={(e) => { setRadiusAuthSecret(e.target.value); markDirty(); }} />
                      </Box>
                    </Flex>
                    <Flex justify="space-between" align="center">
                      <ToggleSwitch checked={chargeableUserId} onChange={(v) => { setChargeableUserId(v); markDirty(); }} label="chargeable-user-id" />
                      <ToggleSwitch checked={localFallbackEnabled} onChange={(v) => { setLocalFallbackEnabled(v); markDirty(); }} label="Enable Local Fallback Authentication" />
                    </Flex>
                    <Box pt={2}>
                      <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2}>RADIUS Accounting Server</Text>
                      <Flex gap={3}>
                        <Box flex="2">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>Acct Host</Text>
                          <Input size="sm" value={radiusAcctHost} onChange={(e) => { setRadiusAcctHost(e.target.value); markDirty(); }} />
                        </Box>
                        <Box w="90px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>Port</Text>
                          <Input size="sm" type="number" value={radiusAcctPort} onChange={(e) => { setRadiusAcctPort(Number(e.target.value)); markDirty(); }} />
                        </Box>
                        <Box flex="2">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>Shared Secret</Text>
                          <Input size="sm" type="password" value={radiusAcctSecret} onChange={(e) => { setRadiusAcctSecret(e.target.value); markDirty(); }} />
                        </Box>
                      </Flex>
                    </Box>
                  </VStack>
                </Box>
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

            {/* Right Side Column */}
            <VStack flex="0.9" gap={4} align="stretch">
              {/* Used By Summary Card */}
              <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
                <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={2}>
                  Configurations Referencing Profile
                </Text>
                <Text fontSize="12px" color={themeColors.text.secondary} mb={3}>
                  {profile.configurations.length} configuration(s) reference this profile:
                </Text>

                <VStack gap={2} align="stretch" mb={4}>
                  {referencingConfigs.length === 0 ? (
                    <Text fontSize="12px" color={themeColors.text.muted}>
                      No configurations currently reference this variable block.
                    </Text>
                  ) : (
                    referencingConfigs.map((c) => (
                      <Flex
                        key={c.id}
                        justify="space-between"
                        align="center"
                        p={2.5}
                        bg="#f8fafc"
                        borderRadius="4px"
                        border="1px solid"
                        borderColor={themeColors.panel.divider}
                        fontSize="12px"
                      >
                        <Text
                          fontWeight="600"
                          color={themeColors.brand.accent}
                          cursor="pointer"
                          _hover={{ textDecoration: 'underline' }}
                          onClick={() => onSelectConfig?.(c.id)}
                        >
                          {c.name}
                        </Text>
                        <Box fontSize="10px" fontWeight="600" px={1.5} py={0.5} borderRadius="4px" bg="#dcfce7" color="#166534">
                          {c.status}
                        </Box>
                      </Flex>
                    ))
                  )}
                </VStack>
              </Box>

              {/* Warning Banner */}
              <Box bg="#fffbeb" border="1px solid" borderColor="#fde68a" borderRadius="6px" p={4}>
                <HStack gap={2} mb={1}>
                  <Icon name="alertTriangle" size={16} color="#b45309" />
                  <Text fontSize="12px" fontWeight="700" color="#92400e">
                    Profile changes affect references
                  </Text>
                </HStack>
                <Text fontSize="11px" color="#92400e">
                  Saving updates will cascade to all configurations referencing this variable block in OWPROV.
                </Text>
              </Box>

              {/* OWPROV Variable Registration Metadata */}
              <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={4}>
                <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2}>
                  OWPROV Backend Registry Info
                </Text>
                <VStack gap={1.5} align="stretch" fontSize="11px" color={themeColors.text.secondary}>
                  <Flex justify="space-between">
                    <Text>Variable ID:</Text>
                    <Text fontFamily="monospace" fontWeight="600" color={themeColors.text.title}>
                      {profile.id.substring(0, 13)}...
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Section Prefix:</Text>
                    <Text fontFamily="monospace" fontWeight="600">{profile.prefix}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Type:</Text>
                    <Text fontFamily="monospace">json</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Device Group:</Text>
                    <Text fontFamily="monospace">{deviceGroup}</Text>
                  </Flex>
                </VStack>
              </Box>
            </VStack>
          </Flex>
        </>
      )}

      {/* Used By Tab */}
      {activeTab === 'used_by' && (
        <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title} mb={3}>
            Configurations referencing {name}
          </Text>
          <VStack gap={2.5} align="stretch">
            {referencingConfigs.length === 0 ? (
              <Text fontSize="13px" color={themeColors.text.muted}>
                No configurations currently reference this variable block.
              </Text>
            ) : (
              referencingConfigs.map((c) => (
                <Flex
                  key={c.id}
                  justify="space-between"
                  align="center"
                  p={3.5}
                  bg="#f8fafc"
                  borderRadius="4px"
                  border="1px solid"
                  borderColor={themeColors.panel.divider}
                  cursor="pointer"
                  _hover={{ borderColor: themeColors.brand.accent }}
                  onClick={() => onSelectConfig?.(c.id)}
                >
                  <HStack gap={3}>
                    <Icon name="sliders" size={16} color={themeColors.brand.accent} />
                    <Box>
                      <Text fontWeight="600" fontSize="13px" color={themeColors.text.title}>{c.name}</Text>
                      <Text fontSize="11px" color={themeColors.text.secondary}>{c.description}</Text>
                    </Box>
                  </HStack>
                  <Box fontSize="11px" fontWeight="600" px={2} py={0.5} borderRadius="4px" bg="#dcfce7" color="#166534">
                    {c.status}
                  </Box>
                </Flex>
              ))
            )}
          </VStack>
        </Box>
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
              >
                Save profile
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}
    </Box>
  );
};
