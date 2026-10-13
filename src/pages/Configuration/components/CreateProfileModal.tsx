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
  MOCK_PROPERTIES_LIST,
  MOCK_VENUES_LIST,
} from '../mockData/mockConfigurations';
import type {
  ConfigurationProfile,
  VariablePrefixType,
  ProfileSettingsValue,
} from '../types/configuration';

export interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: ConfigurationProfile) => void;
  initialProfile?: ConfigurationProfile | null;
}

interface MultiPskItem {
  id: string;
  mac: string;
  key: string;
  vlanId: number;
}

// Reusable custom toggle switch matching the UI mockup
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

interface ProfileModalContentProps {
  onClose: () => void;
  onSave: (profile: ConfigurationProfile) => void;
  initialProfile?: ConfigurationProfile | null;
}

const ProfileModalContent: React.FC<ProfileModalContentProps> = ({
  onClose,
  onSave,
  initialProfile,
}) => {
  const isEditing = Boolean(initialProfile);

  const [deviceGroup, setDeviceGroup] = useState<string>(initialProfile?.deviceGroup || 'ap');
  const [selectedSection, setSelectedSection] = useState<VariablePrefixType>(
    initialProfile?.prefix || 'interface.ssid'
  );
  const [scopeType, setScopeType] = useState<'global' | 'property' | 'venue'>(
    initialProfile?.venue ? 'venue' : initialProfile?.entity ? 'property' : 'global'
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    initialProfile?.entity || 'prop-sunrise-001'
  );
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    initialProfile?.venue || '2211d28a-a985-434a-ad68-ca5ac4559852'
  );
  const [name, setName] = useState<string>(initialProfile?.name || '');
  const [description, setDescription] = useState<string>(initialProfile?.description || '');
  const [activeTab, setActiveTab] = useState<'main' | 'notes' | 'raw_json'>('main');

  const pValues = initialProfile?.parsedValues || {};

  // 1. interface.ssid fields
  const [ssidName, setSsidName] = useState<string>(
    pValues.name ? String(pValues.name) : 'Tenant-WiFi'
  );
  const [bssMode, setBssMode] = useState<string>(
    pValues['bss-mode'] ? String(pValues['bss-mode']) : 'ap'
  );
  const [wifiBands, setWifiBands] = useState<string[]>(['2G', '5G']);
  const [authProtocol, setAuthProtocol] = useState<string>(
    typeof pValues.protocol === 'string' ? pValues.protocol : 'WPA-PSK'
  );
  const [authKey, setAuthKey] = useState<string>(
    typeof pValues.key === 'string' ? pValues.key : 'OpenLANSecureKey!'
  );
  const [showKey, setShowKey] = useState<boolean>(false);
  const [ieee80211w, setIeee80211w] = useState<string>(
    typeof pValues.ieee80211w === 'string' ? pValues.ieee80211w : 'disabled'
  );
  const [keyCaching, setKeyCaching] = useState<boolean>(
    typeof pValues['key-caching'] === 'boolean' ? pValues['key-caching'] : true
  );

  // Pass Point / Hotspot 2.0
  const [passPointEnabled, setPassPointEnabled] = useState<boolean>(false);
  const [ppVenueName, setPpVenueName] = useState<string>('eng:Example passpoint_venue');
  const [ppVenueUrl, setPpVenueUrl] = useState<string>('http://www.example.com/info');
  const [ppVenueGroup, setPpVenueGroup] = useState<number>(1);
  const [ppVenueType, setPpVenueType] = useState<number>(1);
  const [ppAuthType, setPpAuthType] = useState<string>('terms-and-conditions');
  const [ppDomainName, setPpDomainName] = useState<string>('example.com');
  const [ppAnqpDomain, setPpAnqpDomain] = useState<number>(8888);
  const [ppRoamingConsortium, setPpRoamingConsortium] = useState<string>('BAA2D00100');

  // Advanced Settings for SSID
  const [hiddenSsid, setHiddenSsid] = useState<boolean>(false);
  const [services, setServices] = useState<string>('');
  const [maximumClients, setMaximumClients] = useState<number>(
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

  // Multi-PSK modal & state
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

  // Access Control List
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

  // 2. radio fields
  const [radioBand, setRadioBand] = useState<string>(
    pValues.band ? String(pValues.band) : '5G'
  );
  const [radioChannel, setRadioChannel] = useState<string>(
    pValues.channel ? String(pValues.channel) : 'auto'
  );
  const [channelWidth, setChannelWidth] = useState<string>(
    pValues['channel-width'] ? String(pValues['channel-width']) : '40'
  );
  const [channelMode, setChannelMode] = useState<string>(
    pValues['channel-mode'] ? String(pValues['channel-mode']) : 'HT'
  );
  const [bandwidth, setBandwidth] = useState<string>(
    pValues.bandwidth ? String(pValues.bandwidth) : '10'
  );
  const [country, setCountry] = useState<string>(
    pValues.country ? String(pValues.country) : 'US'
  );
  const [txPower, setTxPower] = useState<number>(
    pValues['tx-power'] !== undefined ? Number(pValues['tx-power']) : 0
  );
  const [allowDfs, setAllowDfs] = useState<boolean>(
    pValues['allow-dfs'] !== undefined ? Boolean(pValues['allow-dfs']) : true
  );
  const [beaconInterval, setBeaconInterval] = useState<number>(
    pValues['beacon-interval'] !== undefined ? Number(pValues['beacon-interval']) : 100
  );
  const [mimo, setMimo] = useState<string>('2x2');
  const [legacyRates, setLegacyRates] = useState<boolean>(false);
  const [requireMode, setRequireMode] = useState<string>('None');
  const [ratesBeacon, setRatesBeacon] = useState<number>(6000);
  const [ratesMulticast, setRatesMulticast] = useState<number>(6000);
  const [heMultipleBssid, setHeMultipleBssid] = useState<boolean>(false);
  const [heEma, setHeEma] = useState<boolean>(false);
  const [heBssColor, setHeBssColor] = useState<number>(1);

  // 3. vlan & ipv4
  const [vlanId, setVlanId] = useState<number>(
    pValues['vlan-id'] !== undefined ? Number(pValues['vlan-id']) : 100
  );
  const [vlanDescription, setVlanDescription] = useState<string>(
    pValues.description ? String(pValues.description) : 'Resident isolation VLAN'
  );
  const [ipv4Addressing, setIpv4Addressing] = useState<string>('dhcp');
  const [ipv4Subnet, setIpv4Subnet] = useState<string>('192.168.1.0/24');
  const [ipv4Gateway, setIpv4Gateway] = useState<string>('192.168.1.1');
  const [sendHostname, setSendHostname] = useState<boolean>(true);
  const [dhcpEnabled, setDhcpEnabled] = useState<boolean>(true);
  const [dhcpLeaseFirst, setDhcpLeaseFirst] = useState<number>(10);
  const [dhcpLeaseCount, setDhcpLeaseCount] = useState<number>(150);
  const [dhcpLeaseTime, setDhcpLeaseTime] = useState<string>('6h');

  // 4. interface.tunnel
  const [tunnelProto, setTunnelProto] = useState<string>('vxlan');
  const [tunnelPeerAddress, setTunnelPeerAddress] = useState<string>('192.168.10.1');
  const [tunnelPeerPort, setTunnelPeerPort] = useState<number>(4700);
  const [tunnelServer, setTunnelServer] = useState<string>('vpn.routerarch.com');
  const [tunnelUsername, setTunnelUsername] = useState<string>('resident-gw');
  const [tunnelPassword, setTunnelPassword] = useState<string>('');
  const [tunnelHealthcheck, setTunnelHealthcheck] = useState<boolean>(true);

  // 5. interface.ssid.radius
  const [nasIdentifier, setNasIdentifier] = useState<string>('Radius-MDU-Cluster');
  const [chargeableUserId, setChargeableUserId] = useState<boolean>(false);
  const [radiusAuthHost, setRadiusAuthHost] = useState<string>('192.168.178.192');
  const [radiusAuthPort, setRadiusAuthPort] = useState<number>(1812);
  const [radiusAuthSecret, setRadiusAuthSecret] = useState<string>('radius_secret_token');
  const [radiusAcctHost, setRadiusAcctHost] = useState<string>('192.168.178.192');
  const [radiusAcctPort, setRadiusAcctPort] = useState<number>(1813);
  const [radiusAcctSecret, setRadiusAcctSecret] = useState<string>('radius_secret_token');
  const [localFallbackEnabled, setLocalFallbackEnabled] = useState<boolean>(false);

  // 6. interface.ssid.openroaming
  const [openRoamingName, setOpenRoamingName] = useState<string>('OpenRoaming');
  const [openRoamingConsortium, setOpenRoamingConsortium] = useState<string>('5A03BA0000');

  // notes
  const [newNote, setNewNote] = useState<string>('');

  const filteredVenues = MOCK_VENUES_LIST.filter(
    (v) => v.propertyId === selectedPropertyId
  );

  const toggleWifiBand = (band: string) => {
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
  };

  const handleRemoveMultiPsk = (id: string) => {
    setMultiPskEntries(multiPskEntries.filter((e) => e.id !== id));
  };

  // Build the JSON serialized object for the variable block
  const buildVariableValue = (): Record<string, unknown> => {
    if (selectedSection === 'interface.ssid') {
      const val: Record<string, unknown> = {
        name: ssidName,
        'bss-mode': bssMode,
        'wifi-bands': wifiBands,
        encryption: {
          protocol: authProtocol,
          key: authKey,
          ieee80211w,
          'key-caching': keyCaching,
        },
        'hidden-ssid': hiddenSsid,
        'maximum-clients': maximumClients,
        'fils-discovery-interval': filsDiscoveryInterval,
        purpose,
        'dtim-period': dtimPeriod,
        'isolate-clients': isolateClients,
        'power-save': powerSave,
        'broadcast-time': broadcastTime,
        'unicast-conversion': unicastConversion,
        'proxy-arp': proxyArp,
        'disassoc-low-ack': disassocLowAck,
        'tip-information-element': tipInformationElement,
      };

      if (services) val.services = [services];
      if (vendorElements) val['vendor-elements'] = vendorElements;
      if (multiPskEntries.length > 0) {
        val['multi-psk'] = multiPskEntries.map((e) => ({
          mac: e.mac || undefined,
          key: e.key,
          'vlan-id': e.vlanId,
        }));
      }

      if (passPointEnabled) {
        val['pass-point'] = {
          'venue-name': [ppVenueName],
          'venue-url': [ppVenueUrl],
          'venue-group': ppVenueGroup,
          'venue-type': ppVenueType,
          'auth-type': { type: ppAuthType },
          'domain-name': [ppDomainName],
          'anqp-domain': ppAnqpDomain,
          'roaming-consortium': [ppRoamingConsortium],
        };
      }

      if (rateLimitEnabled) {
        val['rate-limit'] = {
          'ingress-rate': ingressRate,
          'egress-rate': egressRate,
        };
      }

      if (rrmEnabled) {
        val.rrm = {
          'neighbor-reporting': neighborReporting,
          lci: lci || undefined,
          'civic-location': civicLocation || undefined,
          'ftm-responder': ftmResponder,
          'stationary-ap': stationaryAp,
        };
      }

      if (captiveAuthMode !== 'none') {
        val.captive = {
          'auth-mode': captiveAuthMode,
          'walled-garden-fqdn': [walledGardenFqdn],
          'walled-garden-ipaddr': [walledGardenIp],
          'idle-timeout': idleTimeout,
          'session-timeout': sessionTimeout,
          'uam-server': captiveAuthMode === 'uam' ? uamServer : undefined,
          'uam-secret': captiveAuthMode === 'uam' ? uamSecret : undefined,
          'uam-port': captiveAuthMode === 'uam' ? uamPort : undefined,
          nasid: captiveAuthMode === 'uam' ? nasid : undefined,
        };
      }

      if (aclEnabled) {
        val['access-control-list'] = {
          mode: aclMode,
          'mac-address': [aclMacAddress],
        };
      }

      if (roamingState !== 'off') {
        if (roamingState === 'auto') {
          val.roaming = true;
        } else {
          val.roaming = {
            'message-exchange': roamingExchange,
            'generate-psk': roamingGeneratePsk,
            'domain-identifier': roamingDomainId,
            'pmk-r0-key-holder': roamingPmkR0 || undefined,
            'pmk-r1-key-holder': roamingPmkR1 || undefined,
          };
        }
      }

      return val;
    }

    if (selectedSection === 'radio') {
      const val: Record<string, unknown> = {
        'allow-dfs': allowDfs,
        band: radioBand,
        bandwidth: Number(bandwidth),
        'beacon-interval': beaconInterval,
        channel: radioChannel,
        'channel-mode': channelMode,
        'channel-width': Number(channelWidth),
        country,
        mimo,
        'maximum-clients': maximumClients,
        'tx-power': txPower,
        'legacy-rates': legacyRates,
      };
      if (requireMode !== 'None') val['require-mode'] = requireMode;
      val.rates = { beacon: ratesBeacon, multicast: ratesMulticast };
      val.he = {
        'multiple-bssid': heMultipleBssid,
        ema: heEma,
        'bss-color': heBssColor,
      };
      return val;
    }

    if (selectedSection === 'interface.vlan') {
      return {
        'vlan-id': vlanId,
        description: vlanDescription,
      };
    }

    if (selectedSection === 'interface.ipv4') {
      const val: Record<string, unknown> = {
        addressing: ipv4Addressing,
        subnet: ipv4Subnet,
        gateway: ipv4Gateway,
        'send-hostname': sendHostname,
      };
      if (dhcpEnabled) {
        val.dhcp = {
          'lease-first': dhcpLeaseFirst,
          'lease-count': dhcpLeaseCount,
          'lease-time': dhcpLeaseTime,
        };
      }
      return val;
    }

    if (selectedSection === 'interface.captive') {
      return {
        'auth-mode': captiveAuthMode === 'none' ? 'click' : captiveAuthMode,
        'walled-garden-fqdn': [walledGardenFqdn],
        'walled-garden-ipaddr': [walledGardenIp],
        'idle-timeout': idleTimeout,
        'session-timeout': sessionTimeout,
        'uam-server': uamServer,
        'uam-secret': uamSecret,
        'uam-port': uamPort,
        nasid,
      };
    }

    if (selectedSection === 'interface.tunnel') {
      const val: Record<string, unknown> = { proto: tunnelProto };
      if (tunnelProto === 'vxlan') {
        val['peer-address'] = tunnelPeerAddress;
        val['peer-port'] = tunnelPeerPort;
      } else if (tunnelProto === 'l2tp') {
        val.server = tunnelServer;
        val['user-name'] = tunnelUsername;
        val.password = tunnelPassword;
      } else if (tunnelProto === 'gre') {
        val['peer-address'] = tunnelPeerAddress;
        val['dhcp-healthcheck'] = tunnelHealthcheck;
      }
      return val;
    }

    if (selectedSection === 'interface.ssid.radius') {
      return {
        'nas-identifier': nasIdentifier,
        'chargeable-user-id': chargeableUserId,
        authentication: {
          host: radiusAuthHost,
          port: radiusAuthPort,
          secret: radiusAuthSecret,
        },
        accounting: {
          host: radiusAcctHost,
          port: radiusAcctPort,
          secret: radiusAcctSecret,
        },
        'dynamic-authorization': {
          host: radiusAcctHost,
          port: radiusAcctPort,
          secret: radiusAcctSecret,
        },
        local: localFallbackEnabled
          ? {
              'server-identity': 'uCentral',
              users: [{ 'user-name': 'resident', password: 'Password123!', 'vlan-id': 100 }],
            }
          : undefined,
      };
    }

    if (selectedSection === 'interface.ssid.openroaming') {
      return {
        name: openRoamingName,
        'bss-mode': 'ap',
        'wifi-bands': ['2G', '5G', '6G'],
        'pass-point': {
          'venue-name': [ppVenueName],
          'venue-url': [ppVenueUrl],
          'venue-group': ppVenueGroup,
          'venue-type': ppVenueType,
          'auth-type': { type: 'terms-and-conditions' },
          'domain-name': ['openroaming.org'],
          'anqp-domain': 8888,
          'roaming-consortium': [openRoamingConsortium],
          'wan-metrics': { type: 'up', downlink: 20000, uplink: 20000 },
        },
      };
    }

    return {
      section: selectedSection,
      enabled: true,
    };
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const prop = MOCK_PROPERTIES_LIST.find((p) => p.id === selectedPropertyId);
    const ven = MOCK_VENUES_LIST.find((v) => v.id === selectedVenueId);

    const valObj = buildVariableValue();
    const serialized = JSON.stringify(valObj);

    const savedProfile: ConfigurationProfile = {
      id: initialProfile?.id || `var-${Date.now().toString(36)}`,
      name: name.trim(),
      description: description.trim(),
      notes: initialProfile?.notes || [],
      created: initialProfile?.created || Math.floor(Date.now() / 1000),
      modified: Math.floor(Date.now() / 1000),
      deviceGroup,
      prefix: selectedSection,
      entity: scopeType === 'global' ? '' : selectedPropertyId,
      entityName: scopeType === 'global' ? 'Global Scope' : prop?.name,
      venue: scopeType === 'venue' ? selectedVenueId : '',
      venueName: scopeType === 'venue' ? ven?.name : '',
      subscriber: '',
      inventory: '',
      configurations: initialProfile?.configurations || [],
      status: 'valid',
      configuredFieldsCount: Object.keys(valObj).length,
      variables: [
        {
          prefix: selectedSection,
          type: 'json',
          weight: 0,
          value: serialized,
        },
      ],
      parsedValues: valObj as Record<string, ProfileSettingsValue>,
    };

    onSave(savedProfile);
    onClose();
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(15, 23, 42, 0.65)"
      zIndex={1500}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="#ffffff"
        borderRadius="8px"
        boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        border="1px solid"
        borderColor={themeColors.panel.border}
        w="100%"
        maxW="880px"
        maxH="92vh"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          px={6}
          py={4}
          borderBottom="1px solid"
          borderColor={themeColors.panel.border}
          bg="#f8fafc"
        >
          <HStack gap={3}>
            <Box
              w="32px"
              h="32px"
              borderRadius="6px"
              bg="#e0e7ff"
              color={themeColors.brand.accent}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon name="settings" size={16} />
            </Box>
            <Box>
              <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                {isEditing ? `Edit Resource: ${initialProfile?.name}` : 'Create Resource'}
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted}>
                Define reusable parameter blocks for deployment across property APs
              </Text>
            </Box>
          </HStack>
          <Button
            size="xs"
            variant="ghost"
            color={themeColors.text.muted}
            _hover={{ bg: '#e2e8f0', color: themeColors.text.primary }}
            onClick={onClose}
          >
            ✕
          </Button>
        </Flex>

        {/* Scrollable Form Body */}
        <Box px={6} py={5} overflowY="auto" flex="1">
          {/* Top Row: Device Group & Configuration Section */}
          <Flex gap={4} mb={4} wrap="wrap">
            <Box flex="1" minW="200px">
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Device Group <Text as="span" color="red.500">*</Text>
              </Text>
              <SelectDropdown
                value={deviceGroup}
                onChange={setDeviceGroup}
                options={[
                  { value: 'ap', label: 'ap' },
                  { value: '*', label: 'All Devices (*)' },
                ]}
              />
            </Box>

            <Box flex="2" minW="260px">
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Configuration Section <Text as="span" color="red.500">*</Text>
              </Text>
              <SelectDropdown
                value={selectedSection}
                onChange={(val) => setSelectedSection(val as VariablePrefixType)}
                options={[
                  { value: 'interface.ssid', label: 'interface.ssid' },
                  { value: 'radio', label: 'radio' },
                  { value: 'interface.vlan', label: 'interface.vlan' },
                  { value: 'interface.ipv4', label: 'interface.ipv4' },
                  { value: 'interface.captive', label: 'interface.captive' },
                  { value: 'interface.tunnel', label: 'interface.tunnel' },
                  { value: 'interface.ssid.radius', label: 'interface.ssid.radius' },
                  { value: 'interface.ssid.openroaming', label: 'OpenRoaming SSID' },
                ]}
              />
            </Box>
          </Flex>

          {/* Scope Assignment (Global vs Property vs Venue) */}
          <Box bg="#f8fafc" border="1px solid" borderColor={themeColors.panel.divider} borderRadius="6px" p={3.5} mb={4}>
            <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2}>
              Scope Assignment (Hierarchy Inheritance)
            </Text>
            <HStack gap={3} mb={3}>
              <Button
                size="xs"
                variant={scopeType === 'global' ? 'solid' : 'outline'}
                bg={scopeType === 'global' ? themeColors.brand.accent : '#ffffff'}
                color={scopeType === 'global' ? '#ffffff' : themeColors.text.primary}
                borderColor={scopeType === 'global' ? themeColors.brand.accent : themeColors.panel.border}
                onClick={() => setScopeType('global')}
              >
                Global (Universal)
              </Button>
              <Button
                size="xs"
                variant={scopeType === 'property' ? 'solid' : 'outline'}
                bg={scopeType === 'property' ? themeColors.brand.accent : '#ffffff'}
                color={scopeType === 'property' ? '#ffffff' : themeColors.text.primary}
                borderColor={scopeType === 'property' ? themeColors.brand.accent : themeColors.panel.border}
                onClick={() => setScopeType('property')}
              >
                Property Scope (Entity)
              </Button>
              <Button
                size="xs"
                variant={scopeType === 'venue' ? 'solid' : 'outline'}
                bg={scopeType === 'venue' ? themeColors.brand.accent : '#ffffff'}
                color={scopeType === 'venue' ? '#ffffff' : themeColors.text.primary}
                borderColor={scopeType === 'venue' ? themeColors.brand.accent : themeColors.panel.border}
                onClick={() => setScopeType('venue')}
              >
                Venue Scope
              </Button>
            </HStack>

            {scopeType !== 'global' && (
              <Flex gap={3} wrap="wrap">
                <Box flex="1" minW="180px">
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>
                    Target Property <Text as="span" color="red.500">*</Text>
                  </Text>
                  <SelectDropdown
                    value={selectedPropertyId}
                    onChange={setSelectedPropertyId}
                    options={MOCK_PROPERTIES_LIST.map((p) => ({ value: p.id, label: p.name }))}
                  />
                </Box>

                {scopeType === 'venue' && (
                  <Box flex="1" minW="180px">
                    <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>
                      Target Venue <Text as="span" color="red.500">*</Text>
                    </Text>
                    <SelectDropdown
                      value={selectedVenueId}
                      onChange={setSelectedVenueId}
                      options={filteredVenues.map((v) => ({ value: v.id, label: v.name }))}
                    />
                  </Box>
                )}
              </Flex>
            )}
          </Box>

          {/* Tab Navigation: Main | Notes | Raw JSON */}
          <HStack gap={6} borderBottom="1px solid" borderColor={themeColors.panel.divider} mb={4}>
            <Text
              fontSize="13px"
              fontWeight="600"
              pb={2}
              borderBottom="2px solid"
              borderColor={activeTab === 'main' ? themeColors.brand.accent : 'transparent'}
              color={activeTab === 'main' ? themeColors.brand.accent : themeColors.text.secondary}
              cursor="pointer"
              onClick={() => setActiveTab('main')}
            >
              Main
            </Text>
            <Text
              fontSize="13px"
              fontWeight="600"
              pb={2}
              borderBottom="2px solid"
              borderColor={activeTab === 'notes' ? themeColors.brand.accent : 'transparent'}
              color={activeTab === 'notes' ? themeColors.brand.accent : themeColors.text.secondary}
              cursor="pointer"
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </Text>
            <Text
              fontSize="13px"
              fontWeight="600"
              pb={2}
              borderBottom="2px solid"
              borderColor={activeTab === 'raw_json' ? themeColors.brand.accent : 'transparent'}
              color={activeTab === 'raw_json' ? themeColors.brand.accent : themeColors.text.secondary}
              cursor="pointer"
              onClick={() => setActiveTab('raw_json')}
            >
              Raw JSON
            </Text>
          </HStack>

          {/* TAB: Main */}
          {activeTab === 'main' && (
            <VStack gap={4} align="stretch">
              <Flex gap={3}>
                <Box flex="1">
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Name <Text as="span" color="red.500">*</Text>
                  </Text>
                  <Input
                    size="sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                  />
                </Box>
                <Box flex="1">
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    Description
                  </Text>
                  <Input
                    size="sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                  />
                </Box>
              </Flex>

              {/* ---------------- SECTION 1: interface.ssid ---------------- */}
              {selectedSection === 'interface.ssid' && (
                <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={3} textDecoration="underline">
                    interface.ssid
                  </Text>

                  <Flex gap={4} mb={4} wrap="wrap">
                    <Box flex="1" minW="200px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        name <Text as="span" color="red.500">*</Text>
                        <FieldInfoTooltip tooltip="SSID Broadcast Network Name" />
                      </Text>
                      <Input
                        size="sm"
                        value={ssidName}
                        onChange={(e) => setSsidName(e.target.value)}
                        placeholder="SSID Name"
                      />
                    </Box>

                    <Box flex="1" minW="160px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        bss-mode <Text as="span" color="red.500">*</Text>
                        <FieldInfoTooltip tooltip="Basic Service Set Operating Mode" />
                      </Text>
                      <SelectDropdown
                        value={bssMode}
                        onChange={setBssMode}
                        options={[
                          { value: 'ap', label: 'ap' },
                          { value: 'sta', label: 'sta' },
                          { value: 'mesh', label: 'mesh' },
                          { value: 'wds-ap', label: 'wds-ap' },
                          { value: 'wds-sta', label: 'wds-sta' },
                        ]}
                      />
                    </Box>

                    <Box flex="1" minW="220px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        wifi-bands <Text as="span" color="red.500">*</Text>
                        <FieldInfoTooltip tooltip="Select active radio frequency bands" />
                      </Text>
                      <HStack gap={2} pt={0.5}>
                        {['2G', '5G', '6G'].map((band) => {
                          const active = wifiBands.includes(band);
                          return (
                            <Box
                              key={band}
                              as="button"
                              fontSize="12px"
                              fontWeight="600"
                              px={3}
                              py={1}
                              borderRadius="14px"
                              border="1px solid"
                              borderColor={active ? themeColors.brand.accent : themeColors.panel.border}
                              bg={active ? '#eff6ff' : '#f8fafc'}
                              color={active ? themeColors.brand.accent : themeColors.text.secondary}
                              cursor="pointer"
                              onClick={() => toggleWifiBand(band)}
                            >
                              {band} {active && '✕'}
                            </Box>
                          );
                        })}
                      </HStack>
                    </Box>
                  </Flex>

                  {/* Authentication Subsection */}
                  <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={2.5} textDecoration="underline">
                    Authentication
                  </Text>
                  <Flex gap={3} mb={4} wrap="wrap" align="flex-end">
                    <Box flex="1" minW="180px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        protocol <Text as="span" color="red.500">*</Text>
                        <FieldInfoTooltip tooltip="Security / WPA Encryption Protocol" />
                      </Text>
                      <SelectDropdown
                        value={authProtocol}
                        onChange={setAuthProtocol}
                        options={[
                          { value: 'WPA-PSK', label: 'WPA-PSK' },
                          { value: 'WPA2-PSK', label: 'WPA2-PSK' },
                          { value: 'WPA3-SAE', label: 'WPA3-SAE' },
                          { value: 'WPA2/WPA3 Mixed', label: 'WPA2/WPA3 Mixed' },
                          { value: 'psk2-radius', label: 'psk2-radius (Enterprise)' },
                          { value: 'owe', label: 'OWE (Enhanced Open)' },
                          { value: 'None', label: 'None (Open)' },
                        ]}
                      />
                    </Box>

                    {authProtocol !== 'None' && authProtocol !== 'owe' && (
                      <Box flex="1.5" minW="220px">
                        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          key <Text as="span" color="red.500">*</Text>
                          <FieldInfoTooltip tooltip="Wi-Fi Security Passphrase (8-63 chars)" />
                        </Text>
                        <HStack gap={1.5}>
                          <Input
                            size="sm"
                            type={showKey ? 'text' : 'password'}
                            value={authKey}
                            onChange={(e) => setAuthKey(e.target.value)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            borderColor={themeColors.panel.border}
                            onClick={() => setShowKey(!showKey)}
                            fontSize="11px"
                            px={2.5}
                          >
                            {showKey ? 'Hide' : 'Show'}
                          </Button>
                        </HStack>
                      </Box>
                    )}

                    <Box flex="1" minW="130px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        ieee80211w <Text as="span" color="red.500">*</Text>
                        <FieldInfoTooltip tooltip="Protected Management Frames" />
                      </Text>
                      <SelectDropdown
                        value={ieee80211w}
                        onChange={setIeee80211w}
                        options={[
                          { value: 'disabled', label: 'disabled' },
                          { value: 'optional', label: 'optional' },
                          { value: 'required', label: 'required' },
                        ]}
                      />
                    </Box>

                    <Box minW="120px" pb={2}>
                      <ToggleSwitch
                        checked={keyCaching}
                        onChange={setKeyCaching}
                        label="key-caching"
                      />
                    </Box>
                  </Flex>

                  {/* Pass Point Collapsible Toggle */}
                  <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider} mb={4}>
                    <Flex justify="space-between" align="center">
                      <HStack gap={2}>
                        <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                          Pass Point
                        </Text>
                        <FieldInfoTooltip tooltip="Hotspot 2.0 / Passpoint Release 2 configuration" />
                      </HStack>
                      <ToggleSwitch checked={passPointEnabled} onChange={setPassPointEnabled} />
                    </Flex>
                    {passPointEnabled && (
                      <VStack gap={3} align="stretch" mt={3} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                        <Flex gap={3} wrap="wrap">
                          <Box flex="1" minW="180px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>venue-name</Text>
                            <Input size="sm" value={ppVenueName} onChange={(e) => setPpVenueName(e.target.value)} bg="#ffffff" />
                          </Box>
                          <Box flex="1" minW="180px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>venue-url</Text>
                            <Input size="sm" value={ppVenueUrl} onChange={(e) => setPpVenueUrl(e.target.value)} bg="#ffffff" />
                          </Box>
                          <Box flex="1" minW="140px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>domain-name</Text>
                            <Input size="sm" value={ppDomainName} onChange={(e) => setPpDomainName(e.target.value)} bg="#ffffff" />
                          </Box>
                        </Flex>
                        <Flex gap={3} wrap="wrap">
                          <Box w="120px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>venue-group</Text>
                            <Input size="sm" type="number" value={ppVenueGroup} onChange={(e) => setPpVenueGroup(Number(e.target.value))} bg="#ffffff" />
                          </Box>
                          <Box w="120px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>venue-type</Text>
                            <Input size="sm" type="number" value={ppVenueType} onChange={(e) => setPpVenueType(Number(e.target.value))} bg="#ffffff" />
                          </Box>
                          <Box w="140px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>anqp-domain</Text>
                            <Input size="sm" type="number" value={ppAnqpDomain} onChange={(e) => setPpAnqpDomain(Number(e.target.value))} bg="#ffffff" />
                          </Box>
                          <Box flex="1" minW="160px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>auth-type</Text>
                            <SelectDropdown
                              value={ppAuthType}
                              onChange={setPpAuthType}
                              options={[
                                { value: 'terms-and-conditions', label: 'Terms and Conditions' },
                                { value: 'online-enrollment', label: 'Online Enrollment' },
                              ]}
                            />
                          </Box>
                          <Box flex="1" minW="140px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>roaming-consortium</Text>
                            <Input size="sm" value={ppRoamingConsortium} onChange={(e) => setPpRoamingConsortium(e.target.value)} bg="#ffffff" />
                          </Box>
                        </Flex>
                      </VStack>
                    )}
                  </Box>

                  {/* Advanced Settings */}
                  <Box p={3.5} bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" mb={4}>
                    <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={3} textDecoration="underline">
                      Advanced Settings
                    </Text>

                    <Flex gap={4} mb={3.5} wrap="wrap" align="center">
                      <Box minW="130px">
                        <ToggleSwitch checked={hiddenSsid} onChange={setHiddenSsid} label="hidden-ssid" />
                      </Box>
                      <Box flex="1" minW="160px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          services
                        </Text>
                        <SelectDropdown
                          value={services}
                          onChange={setServices}
                          options={[
                            { value: '', label: 'Select...' },
                            { value: 'radius-gw-proxy', label: 'radius-gw-proxy' },
                            { value: 'wifi-steering', label: 'wifi-steering' },
                            { value: 'captive', label: 'captive' },
                          ]}
                        />
                      </Box>
                      <Box flex="1" minW="140px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          maximum-clients <Text as="span" color="red.500">*</Text>
                        </Text>
                        <Input
                          size="sm"
                          type="number"
                          value={maximumClients}
                          onChange={(e) => setMaximumClients(Number(e.target.value))}
                        />
                      </Box>
                      <Box flex="1" minW="140px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          fils-discovery-interval
                        </Text>
                        <Input
                          size="sm"
                          type="number"
                          value={filsDiscoveryInterval}
                          onChange={(e) => setFilsDiscoveryInterval(Number(e.target.value))}
                        />
                      </Box>
                    </Flex>

                    <Flex gap={4} mb={3.5} wrap="wrap" align="center">
                      <Box flex="1" minW="150px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          purpose
                        </Text>
                        <SelectDropdown
                          value={purpose}
                          onChange={setPurpose}
                          options={[
                            { value: 'Default', label: 'Default' },
                            { value: 'user-defined', label: 'user-defined' },
                            { value: 'onboarding-ap', label: 'onboarding-ap' },
                            { value: 'onboarding-sta', label: 'onboarding-sta' },
                          ]}
                        />
                      </Box>
                      <Box flex="1" minW="120px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          dtim-period
                        </Text>
                        <Input
                          size="sm"
                          type="number"
                          value={dtimPeriod}
                          onChange={(e) => setDtimPeriod(Number(e.target.value))}
                        />
                      </Box>
                      <Box minW="140px">
                        <ToggleSwitch checked={isolateClients} onChange={setIsolateClients} label="isolate-clients" />
                      </Box>
                      <Box minW="130px">
                        <ToggleSwitch checked={powerSave} onChange={setPowerSave} label="power-save" />
                      </Box>
                    </Flex>

                    <Flex gap={4} mb={3.5} wrap="wrap" align="center">
                      <Box minW="140px">
                        <ToggleSwitch checked={broadcastTime} onChange={setBroadcastTime} label="broadcast-time" />
                      </Box>
                      <Box minW="150px">
                        <ToggleSwitch checked={unicastConversion} onChange={setUnicastConversion} label="unicast-conversion" />
                      </Box>
                      <Box minW="120px">
                        <ToggleSwitch checked={proxyArp} onChange={setProxyArp} label="proxy-arp" />
                      </Box>
                      <Box minW="140px">
                        <ToggleSwitch checked={disassocLowAck} onChange={setDisassocLowAck} label="disassoc-low-ack" />
                      </Box>
                    </Flex>

                    <Flex gap={4} wrap="wrap" align="center">
                      <Box flex="1" minW="180px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          vendor-elements
                        </Text>
                        <Input
                          size="sm"
                          value={vendorElements}
                          onChange={(e) => setVendorElements(e.target.value)}
                          placeholder="Raw hex or string IE"
                        />
                      </Box>
                      <Box minW="180px">
                        <ToggleSwitch checked={tipInformationElement} onChange={setTipInformationElement} label="tip-information-element" />
                      </Box>
                      <Box minW="200px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                          multi-psk <Text as="span" color="red.500">*</Text>
                        </Text>
                        <Button
                          size="xs"
                          colorScheme="blue"
                          variant="solid"
                          bg={themeColors.brand.accent}
                          color="#ffffff"
                          onClick={() => setIsMultiPskModalOpen(true)}
                        >
                          Manage multi-psk ({multiPskEntries.length} entries)
                        </Button>
                      </Box>
                    </Flex>
                  </Box>

                  {/* Rate Limit Collapsible Toggle */}
                  <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider} mb={3}>
                    <Flex justify="space-between" align="center">
                      <HStack gap={2}>
                        <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>Rate Limit</Text>
                        <FieldInfoTooltip tooltip="Client upload and download rate limiting" />
                      </HStack>
                      <ToggleSwitch checked={rateLimitEnabled} onChange={setRateLimitEnabled} />
                    </Flex>
                    {rateLimitEnabled && (
                      <Flex gap={3} mt={3} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                        <Box flex="1">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>ingress-rate (MB/s)</Text>
                          <Input size="sm" type="number" value={ingressRate} onChange={(e) => setIngressRate(Number(e.target.value))} bg="#ffffff" />
                        </Box>
                        <Box flex="1">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>egress-rate (MB/s)</Text>
                          <Input size="sm" type="number" value={egressRate} onChange={(e) => setEgressRate(Number(e.target.value))} bg="#ffffff" />
                        </Box>
                      </Flex>
                    )}
                  </Box>

                  {/* RRM Collapsible Toggle */}
                  <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider} mb={3}>
                    <Flex justify="space-between" align="center">
                      <HStack gap={2}>
                        <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>RRM</Text>
                        <FieldInfoTooltip tooltip="Radio Resource Management (802.11k/v)" />
                      </HStack>
                      <ToggleSwitch checked={rrmEnabled} onChange={setRrmEnabled} />
                    </Flex>
                    {rrmEnabled && (
                      <VStack gap={3} align="stretch" mt={3} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                        <Flex gap={4} wrap="wrap">
                          <ToggleSwitch checked={neighborReporting} onChange={setNeighborReporting} label="neighbor-reporting" />
                          <ToggleSwitch checked={ftmResponder} onChange={setFtmResponder} label="ftm-responder" />
                          <ToggleSwitch checked={stationaryAp} onChange={setStationaryAp} label="stationary-ap" />
                        </Flex>
                        <Flex gap={3}>
                          <Box flex="1">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>lci (Location Config)</Text>
                            <Input size="sm" value={lci} onChange={(e) => setLci(e.target.value)} bg="#ffffff" placeholder="Optional LCI hex" />
                          </Box>
                          <Box flex="1">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>civic-location</Text>
                            <Input size="sm" value={civicLocation} onChange={(e) => setCivicLocation(e.target.value)} bg="#ffffff" placeholder="Optional civic address" />
                          </Box>
                        </Flex>
                      </VStack>
                    )}
                  </Box>

                  {/* Captive Portal Dropdown */}
                  <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider} mb={3}>
                    <Flex justify="space-between" align="center">
                      <HStack gap={2}>
                        <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>Captive Portal</Text>
                        <FieldInfoTooltip tooltip="Guest splash page and authentication" />
                      </HStack>
                      <Box w="140px">
                        <SelectDropdown
                          value={captiveAuthMode}
                          onChange={setCaptiveAuthMode}
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
                            <Input size="sm" value={walledGardenFqdn} onChange={(e) => setWalledGardenFqdn(e.target.value)} bg="#ffffff" />
                          </Box>
                          <Box flex="1" minW="140px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>walled-garden-ipaddr</Text>
                            <Input size="sm" value={walledGardenIp} onChange={(e) => setWalledGardenIp(e.target.value)} bg="#ffffff" />
                          </Box>
                          <Box w="120px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>idle-timeout (s)</Text>
                            <Input size="sm" type="number" value={idleTimeout} onChange={(e) => setIdleTimeout(Number(e.target.value))} bg="#ffffff" />
                          </Box>
                          <Box w="120px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>session-timeout (s)</Text>
                            <Input size="sm" type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(Number(e.target.value))} bg="#ffffff" />
                          </Box>
                        </Flex>
                        {captiveAuthMode === 'uam' && (
                          <Flex gap={3} wrap="wrap">
                            <Box flex="1">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>uam-server</Text>
                              <Input size="sm" value={uamServer} onChange={(e) => setUamServer(e.target.value)} bg="#ffffff" />
                            </Box>
                            <Box flex="1">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>uam-secret</Text>
                              <Input size="sm" value={uamSecret} onChange={(e) => setUamSecret(e.target.value)} bg="#ffffff" />
                            </Box>
                            <Box w="100px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>uam-port</Text>
                              <Input size="sm" type="number" value={uamPort} onChange={(e) => setUamPort(Number(e.target.value))} bg="#ffffff" />
                            </Box>
                            <Box w="120px">
                              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>nasid</Text>
                              <Input size="sm" value={nasid} onChange={(e) => setNasid(e.target.value)} bg="#ffffff" />
                            </Box>
                          </Flex>
                        )}
                      </VStack>
                    )}
                  </Box>

                  {/* Access Control List Toggle */}
                  <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider} mb={3}>
                    <Flex justify="space-between" align="center">
                      <HStack gap={2}>
                        <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>Access Control List</Text>
                        <FieldInfoTooltip tooltip="MAC-based connection filtering" />
                      </HStack>
                      <ToggleSwitch checked={aclEnabled} onChange={setAclEnabled} />
                    </Flex>
                    {aclEnabled && (
                      <Flex gap={3} mt={3} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                        <Box w="120px">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>mode</Text>
                          <SelectDropdown value={aclMode} onChange={setAclMode} options={[{ value: 'allow', label: 'Allow' }, { value: 'deny', label: 'Deny' }]} />
                        </Box>
                        <Box flex="1">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>mac-address</Text>
                          <Input size="sm" value={aclMacAddress} onChange={(e) => setAclMacAddress(e.target.value)} bg="#ffffff" />
                        </Box>
                      </Flex>
                    )}
                  </Box>

                  {/* Roaming Dropdown */}
                  <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                    <Flex justify="space-between" align="center">
                      <HStack gap={2}>
                        <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>Roaming</Text>
                        <FieldInfoTooltip tooltip="802.11r Fast BSS Transition" />
                      </HStack>
                      <Box w="130px">
                        <SelectDropdown
                          value={roamingState}
                          onChange={setRoamingState}
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
                            <SelectDropdown value={roamingExchange} onChange={setRoamingExchange} options={[{ value: 'air', label: 'air' }, { value: 'ds', label: 'ds' }]} />
                          </Box>
                          <Box w="130px">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>domain-identifier</Text>
                            <Input size="sm" value={roamingDomainId} onChange={(e) => setRoamingDomainId(e.target.value)} bg="#ffffff" />
                          </Box>
                          <Box pt={5}>
                            <ToggleSwitch checked={roamingGeneratePsk} onChange={setRoamingGeneratePsk} label="generate-psk" />
                          </Box>
                        </Flex>
                        <Flex gap={3}>
                          <Box flex="1">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>pmk-r0-key-holder</Text>
                            <Input size="sm" value={roamingPmkR0} onChange={(e) => setRoamingPmkR0(e.target.value)} bg="#ffffff" placeholder="Optional PMK-R0 NAS Identifier" />
                          </Box>
                          <Box flex="1">
                            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>pmk-r1-key-holder</Text>
                            <Input size="sm" value={roamingPmkR1} onChange={(e) => setRoamingPmkR1(e.target.value)} bg="#ffffff" placeholder="Optional PMK-R1 key holder" />
                          </Box>
                        </Flex>
                      </VStack>
                    )}
                  </Box>
                </Box>
              )}

              {/* ---------------- SECTION 2: radio ---------------- */}
              {selectedSection === 'radio' && (
                <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={3} textDecoration="underline">
                    radio
                  </Text>

                  <Flex gap={3} mb={3} wrap="wrap">
                    <Box flex="1" minW="140px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        band <Text as="span" color="red.500">*</Text>
                      </Text>
                      <SelectDropdown
                        value={radioBand}
                        onChange={setRadioBand}
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
                        onChange={setRadioChannel}
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
                        ]}
                      />
                    </Box>

                    <Box flex="1" minW="130px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        channel-width <Text as="span" color="red.500">*</Text>
                      </Text>
                      <SelectDropdown
                        value={channelWidth}
                        onChange={setChannelWidth}
                        options={[
                          { value: '20', label: '20 MHz' },
                          { value: '40', label: '40 MHz' },
                          { value: '80', label: '80 MHz' },
                          { value: '160', label: '160 MHz' },
                        ]}
                      />
                    </Box>

                    <Box flex="1" minW="130px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        bandwidth <Text as="span" color="red.500">*</Text>
                      </Text>
                      <SelectDropdown
                        value={bandwidth}
                        onChange={setBandwidth}
                        options={[
                          { value: '5', label: '5 MHz' },
                          { value: '10', label: '10 MHz' },
                          { value: '20', label: '20 MHz' },
                        ]}
                      />
                    </Box>
                  </Flex>

                  <Flex gap={3} mb={3} wrap="wrap">
                    <Box flex="1" minW="150px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        channel-mode <Text as="span" color="red.500">*</Text>
                      </Text>
                      <SelectDropdown
                        value={channelMode}
                        onChange={setChannelMode}
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
                        onChange={setMimo}
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
                        onChange={(e) => setTxPower(Number(e.target.value))}
                        placeholder="0 = Auto"
                      />
                    </Box>

                    <Box flex="1" minW="120px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        country <Text as="span" color="red.500">*</Text>
                      </Text>
                      <SelectDropdown
                        value={country}
                        onChange={setCountry}
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

                  <Flex gap={4} mb={3} wrap="wrap" align="center">
                    <Box flex="1" minW="120px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        beacon-interval
                      </Text>
                      <Input
                        size="sm"
                        type="number"
                        value={beaconInterval}
                        onChange={(e) => setBeaconInterval(Number(e.target.value))}
                      />
                    </Box>
                    <Box flex="1" minW="120px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        maximum-clients
                      </Text>
                      <Input
                        size="sm"
                        type="number"
                        value={maximumClients}
                        onChange={(e) => setMaximumClients(Number(e.target.value))}
                      />
                    </Box>
                    <Box pt={4}>
                      <ToggleSwitch checked={allowDfs} onChange={setAllowDfs} label="allow-dfs" />
                    </Box>
                    <Box pt={4}>
                      <ToggleSwitch checked={legacyRates} onChange={setLegacyRates} label="legacy-rates" />
                    </Box>
                  </Flex>

                  {/* Advanced Radio Settings */}
                  <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                    <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2}>
                      Wi-Fi Rates & 802.11ax Advanced Parameters
                    </Text>
                    <Flex gap={3} mb={3} wrap="wrap">
                      <Box w="140px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>require-mode</Text>
                        <SelectDropdown
                          value={requireMode}
                          onChange={setRequireMode}
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
                        <Input size="sm" type="number" value={ratesBeacon} onChange={(e) => setRatesBeacon(Number(e.target.value))} bg="#ffffff" />
                      </Box>
                      <Box w="130px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>multicast-rate (kbps)</Text>
                        <Input size="sm" type="number" value={ratesMulticast} onChange={(e) => setRatesMulticast(Number(e.target.value))} bg="#ffffff" />
                      </Box>
                      <Box w="110px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>bss-color</Text>
                        <Input size="sm" type="number" value={heBssColor} onChange={(e) => setHeBssColor(Number(e.target.value))} bg="#ffffff" />
                      </Box>
                    </Flex>
                    <Flex gap={4}>
                      <ToggleSwitch checked={heMultipleBssid} onChange={setHeMultipleBssid} label="he.multiple-bssid" />
                      <ToggleSwitch checked={heEma} onChange={setHeEma} label="he.ema" />
                    </Flex>
                  </Box>
                </Box>
              )}

              {/* ---------------- SECTION 3: interface.vlan ---------------- */}
              {selectedSection === 'interface.vlan' && (
                <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={3} textDecoration="underline">
                    interface.vlan
                  </Text>
                  <Flex gap={3}>
                    <Box w="140px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        vlan-id <Text as="span" color="red.500">*</Text>
                      </Text>
                      <Input
                        size="sm"
                        type="number"
                        value={vlanId}
                        onChange={(e) => setVlanId(Number(e.target.value))}
                      />
                    </Box>
                    <Box flex="1">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        description
                      </Text>
                      <Input
                        size="sm"
                        value={vlanDescription}
                        onChange={(e) => setVlanDescription(e.target.value)}
                      />
                    </Box>
                  </Flex>
                </Box>
              )}

              {/* ---------------- SECTION 4: interface.ipv4 ---------------- */}
              {selectedSection === 'interface.ipv4' && (
                <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={3} textDecoration="underline">
                    interface.ipv4
                  </Text>
                  <Flex gap={3} mb={3} wrap="wrap">
                    <Box w="160px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        addressing <Text as="span" color="red.500">*</Text>
                      </Text>
                      <SelectDropdown
                        value={ipv4Addressing}
                        onChange={setIpv4Addressing}
                        options={[
                          { value: 'dhcp', label: 'DHCP Client (Dynamic)' },
                          { value: 'static', label: 'Static IP' },
                        ]}
                      />
                    </Box>
                    <Box flex="1" minW="180px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        subnet
                      </Text>
                      <Input
                        size="sm"
                        value={ipv4Subnet}
                        onChange={(e) => setIpv4Subnet(e.target.value)}
                        placeholder="192.168.1.1/24"
                      />
                    </Box>
                    <Box flex="1" minW="160px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        gateway
                      </Text>
                      <Input
                        size="sm"
                        value={ipv4Gateway}
                        onChange={(e) => setIpv4Gateway(e.target.value)}
                        placeholder="192.168.1.1"
                      />
                    </Box>
                    <Box pt={5}>
                      <ToggleSwitch checked={sendHostname} onChange={setSendHostname} label="send-hostname" />
                    </Box>
                  </Flex>

                  <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="12px" fontWeight="700" color={themeColors.text.title}>
                        Embedded DHCP Server
                      </Text>
                      <ToggleSwitch checked={dhcpEnabled} onChange={setDhcpEnabled} />
                    </Flex>
                    {dhcpEnabled && (
                      <Flex gap={3} mt={2}>
                        <Box flex="1">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>lease-first offset</Text>
                          <Input size="sm" type="number" value={dhcpLeaseFirst} onChange={(e) => setDhcpLeaseFirst(Number(e.target.value))} bg="#ffffff" />
                        </Box>
                        <Box flex="1">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>lease-count</Text>
                          <Input size="sm" type="number" value={dhcpLeaseCount} onChange={(e) => setDhcpLeaseCount(Number(e.target.value))} bg="#ffffff" />
                        </Box>
                        <Box flex="1">
                          <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>lease-time</Text>
                          <Input size="sm" value={dhcpLeaseTime} onChange={(e) => setDhcpLeaseTime(e.target.value)} bg="#ffffff" />
                        </Box>
                      </Flex>
                    )}
                  </Box>
                </Box>
              )}

              {/* ---------------- SECTION 5: interface.captive ---------------- */}
              {selectedSection === 'interface.captive' && (
                <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={3} textDecoration="underline">
                    interface.captive (Captive Portal Profile)
                  </Text>
                  <Flex gap={3} mb={3} wrap="wrap">
                    <Box w="180px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        auth-mode <Text as="span" color="red.500">*</Text>
                      </Text>
                      <SelectDropdown
                        value={captiveAuthMode === 'none' ? 'click' : captiveAuthMode}
                        onChange={setCaptiveAuthMode}
                        options={[
                          { value: 'click', label: 'Click to Continue' },
                          { value: 'radius', label: 'External RADIUS' },
                          { value: 'credentials', label: 'User Credentials' },
                          { value: 'uam', label: 'UAM / CoovaChilli' },
                        ]}
                      />
                    </Box>
                    <Box flex="1" minW="180px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        walled-garden-fqdn
                      </Text>
                      <Input size="sm" value={walledGardenFqdn} onChange={(e) => setWalledGardenFqdn(e.target.value)} />
                    </Box>
                    <Box flex="1" minW="140px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        walled-garden-ipaddr
                      </Text>
                      <Input size="sm" value={walledGardenIp} onChange={(e) => setWalledGardenIp(e.target.value)} />
                    </Box>
                  </Flex>
                  <Flex gap={3} mb={3}>
                    <Box flex="1">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        idle-timeout (seconds)
                      </Text>
                      <Input size="sm" type="number" value={idleTimeout} onChange={(e) => setIdleTimeout(Number(e.target.value))} />
                    </Box>
                    <Box flex="1">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        session-timeout (seconds)
                      </Text>
                      <Input size="sm" type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(Number(e.target.value))} />
                    </Box>
                  </Flex>
                  {captiveAuthMode === 'uam' && (
                    <Flex gap={3}>
                      <Box flex="1">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>uam-server</Text>
                        <Input size="sm" value={uamServer} onChange={(e) => setUamServer(e.target.value)} />
                      </Box>
                      <Box flex="1">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>uam-secret</Text>
                        <Input size="sm" value={uamSecret} onChange={(e) => setUamSecret(e.target.value)} />
                      </Box>
                      <Box w="90px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>uam-port</Text>
                        <Input size="sm" type="number" value={uamPort} onChange={(e) => setUamPort(Number(e.target.value))} />
                      </Box>
                      <Box w="120px">
                        <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>nasid</Text>
                        <Input size="sm" value={nasid} onChange={(e) => setNasid(e.target.value)} />
                      </Box>
                    </Flex>
                  )}
                </Box>
              )}

              {/* ---------------- SECTION 6: interface.tunnel ---------------- */}
              {selectedSection === 'interface.tunnel' && (
                <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={3} textDecoration="underline">
                    interface.tunnel (Mesh & Tunnel Profile)
                  </Text>
                  <Flex gap={3} mb={3} wrap="wrap">
                    <Box w="160px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                        protocol <Text as="span" color="red.500">*</Text>
                      </Text>
                      <SelectDropdown
                        value={tunnelProto}
                        onChange={setTunnelProto}
                        options={[
                          { value: 'vxlan', label: 'VXLAN' },
                          { value: 'mesh', label: '802.11s Mesh' },
                          { value: 'l2tp', label: 'L2TP' },
                          { value: 'gre', label: 'GRE' },
                        ]}
                      />
                    </Box>
                    {tunnelProto === 'vxlan' && (
                      <>
                        <Box flex="1" minW="180px">
                          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>peer-address</Text>
                          <Input size="sm" value={tunnelPeerAddress} onChange={(e) => setTunnelPeerAddress(e.target.value)} />
                        </Box>
                        <Box w="120px">
                          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>peer-port</Text>
                          <Input size="sm" type="number" value={tunnelPeerPort} onChange={(e) => setTunnelPeerPort(Number(e.target.value))} />
                        </Box>
                      </>
                    )}
                    {tunnelProto === 'l2tp' && (
                      <>
                        <Box flex="1" minW="160px">
                          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>server</Text>
                          <Input size="sm" value={tunnelServer} onChange={(e) => setTunnelServer(e.target.value)} />
                        </Box>
                        <Box flex="1" minW="140px">
                          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>user-name</Text>
                          <Input size="sm" value={tunnelUsername} onChange={(e) => setTunnelUsername(e.target.value)} />
                        </Box>
                        <Box flex="1" minW="140px">
                          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>password</Text>
                          <Input size="sm" type="password" value={tunnelPassword} onChange={(e) => setTunnelPassword(e.target.value)} />
                        </Box>
                      </>
                    )}
                    {tunnelProto === 'gre' && (
                      <Box pt={5}>
                        <ToggleSwitch checked={tunnelHealthcheck} onChange={setTunnelHealthcheck} label="dhcp-healthcheck" />
                      </Box>
                    )}
                  </Flex>
                </Box>
              )}

              {/* ---------------- SECTION 7: interface.ssid.radius ---------------- */}
              {selectedSection === 'interface.ssid.radius' && (
                <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={3} textDecoration="underline">
                    interface.ssid.radius (Enterprise RADIUS Profile)
                  </Text>
                  <Flex gap={3} mb={3} wrap="wrap">
                    <Box flex="1" minW="180px">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>nas-identifier</Text>
                      <Input size="sm" value={nasIdentifier} onChange={(e) => setNasIdentifier(e.target.value)} />
                    </Box>
                    <Box pt={5}>
                      <ToggleSwitch checked={chargeableUserId} onChange={setChargeableUserId} label="chargeable-user-id" />
                    </Box>
                    <Box pt={5}>
                      <ToggleSwitch checked={localFallbackEnabled} onChange={setLocalFallbackEnabled} label="Local RADIUS fallback" />
                    </Box>
                  </Flex>
                  <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={1}>Authentication Server</Text>
                  <Flex gap={3} mb={3}>
                    <Box flex="2">
                      <Input size="sm" value={radiusAuthHost} onChange={(e) => setRadiusAuthHost(e.target.value)} placeholder="Host IP / FQDN" />
                    </Box>
                    <Box w="90px">
                      <Input size="sm" type="number" value={radiusAuthPort} onChange={(e) => setRadiusAuthPort(Number(e.target.value))} placeholder="Port" />
                    </Box>
                    <Box flex="2">
                      <Input size="sm" type="password" value={radiusAuthSecret} onChange={(e) => setRadiusAuthSecret(e.target.value)} placeholder="Secret" />
                    </Box>
                  </Flex>
                  <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={1}>Accounting Server</Text>
                  <Flex gap={3}>
                    <Box flex="2">
                      <Input size="sm" value={radiusAcctHost} onChange={(e) => setRadiusAcctHost(e.target.value)} placeholder="Host IP / FQDN" />
                    </Box>
                    <Box w="90px">
                      <Input size="sm" type="number" value={radiusAcctPort} onChange={(e) => setRadiusAcctPort(Number(e.target.value))} placeholder="Port" />
                    </Box>
                    <Box flex="2">
                      <Input size="sm" type="password" value={radiusAcctSecret} onChange={(e) => setRadiusAcctSecret(e.target.value)} placeholder="Secret" />
                    </Box>
                  </Flex>
                </Box>
              )}

              {/* ---------------- SECTION 8: OpenRoaming SSID ---------------- */}
              {selectedSection === 'interface.ssid.openroaming' && (
                <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#ffffff">
                  <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={3} textDecoration="underline">
                    OpenRoaming SSID (WBA Hotspot 2.0 Profile)
                  </Text>
                  <Flex gap={3} mb={3}>
                    <Box flex="1">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>name</Text>
                      <Input size="sm" value={openRoamingName} onChange={(e) => setOpenRoamingName(e.target.value)} />
                    </Box>
                    <Box flex="1">
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>roaming-consortium</Text>
                      <Input size="sm" value={openRoamingConsortium} onChange={(e) => setOpenRoamingConsortium(e.target.value)} />
                    </Box>
                  </Flex>
                </Box>
              )}
            </VStack>
          )}

          {/* TAB: Notes */}
          {activeTab === 'notes' && (
            <VStack gap={4} align="stretch">
              <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" bg="#f8fafc">
                <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={2}>
                  Operational Notes & Change Audit
                </Text>
                <Text fontSize="12px" color={themeColors.text.secondary} mb={3}>
                  Add deployment instructions, RF planning justifications, or ticket numbers for this resource.
                </Text>
                <HStack gap={2}>
                  <Input
                    size="sm"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter audit note or change rationale..."
                    bg="#ffffff"
                  />
                  <Button
                    size="sm"
                    bg={themeColors.brand.accent}
                    color="#ffffff"
                    onClick={() => {
                      if (newNote.trim()) {
                        setNewNote('');
                      }
                    }}
                  >
                    Add note
                  </Button>
                </HStack>
              </Box>
            </VStack>
          )}

          {/* TAB: Raw JSON */}
          {activeTab === 'raw_json' && (
            <VStack gap={3} align="stretch">
              <Text fontSize="12px" color={themeColors.text.secondary}>
                This is the serialized JSON payload stored in the OWPROV <Text as="span" fontFamily="mono">variables</Text> table:
              </Text>
              <Box
                as="pre"
                p={3.5}
                bg="#0f172a"
                color="#38bdf8"
                borderRadius="6px"
                fontSize="12px"
                fontFamily="mono"
                overflowX="auto"
                maxH="300px"
              >
                {JSON.stringify(buildVariableValue(), null, 2)}
              </Box>
            </VStack>
          )}
        </Box>

        {/* Modal Footer */}
        <Flex
          justify="flex-end"
          align="center"
          gap={3}
          px={6}
          py={3.5}
          borderTop="1px solid"
          borderColor={themeColors.panel.border}
          bg="#f8fafc"
        >
          <Button
            size="sm"
            variant="outline"
            borderColor={themeColors.panel.border}
            color={themeColors.text.secondary}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            bg={themeColors.brand.accent}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.accentHover }}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {isEditing ? 'Save Changes' : 'Create Resource'}
          </Button>
        </Flex>

        {/* Sub-modal: Manage Multi-PSK entries */}
        {isMultiPskModalOpen && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.5)"
            zIndex={1600}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
          >
            <Box
              bg="#ffffff"
              borderRadius="8px"
              boxShadow="xl"
              border="1px solid"
              borderColor={themeColors.panel.border}
              w="100%"
              maxW="540px"
              p={5}
            >
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                  Manage Multi-PSK Keys
                </Text>
                <Button size="xs" variant="ghost" onClick={() => setIsMultiPskModalOpen(false)}>
                  ✕
                </Button>
              </Flex>
              <Text fontSize="12px" color={themeColors.text.secondary} mb={3}>
                Assign individual passphrases and VLAN segmentation for specific client MAC addresses.
              </Text>

              {/* Add Entry Form */}
              <Flex gap={2} mb={3} wrap="wrap">
                <Box flex="1" minW="130px">
                  <Input
                    size="xs"
                    placeholder="MAC (optional)"
                    value={newPskMac}
                    onChange={(e) => setNewPskMac(e.target.value)}
                  />
                </Box>
                <Box flex="1.5" minW="140px">
                  <Input
                    size="xs"
                    placeholder="Key (Passphrase) *"
                    value={newPskKey}
                    onChange={(e) => setNewPskKey(e.target.value)}
                  />
                </Box>
                <Box w="80px">
                  <Input
                    size="xs"
                    type="number"
                    placeholder="VLAN"
                    value={newPskVlan}
                    onChange={(e) => setNewPskVlan(Number(e.target.value))}
                  />
                </Box>
                <Button size="xs" colorScheme="blue" bg={themeColors.brand.accent} color="#ffffff" onClick={handleAddMultiPsk}>
                  Add
                </Button>
              </Flex>

              {/* Table of Entries */}
              <Box maxH="180px" overflowY="auto" border="1px solid" borderColor={themeColors.panel.divider} borderRadius="4px">
                {multiPskEntries.length === 0 ? (
                  <Text fontSize="12px" color={themeColors.text.muted} textAlign="center" py={4}>
                    No Multi-PSK entries defined yet.
                  </Text>
                ) : (
                  multiPskEntries.map((entry) => (
                    <Flex key={entry.id} justify="space-between" align="center" px={3} py={1.5} borderBottom="1px solid" borderColor={themeColors.panel.divider} fontSize="12px">
                      <HStack gap={3}>
                        <Text fontFamily="mono" color={themeColors.text.primary}>
                          {entry.mac || 'Any MAC'}
                        </Text>
                        <Text color={themeColors.text.secondary}>VLAN: {entry.vlanId}</Text>
                        <Text color={themeColors.text.muted}>••••••••</Text>
                      </HStack>
                      <Button size="xs" variant="ghost" color="red.500" onClick={() => handleRemoveMultiPsk(entry.id)}>
                        ✕
                      </Button>
                    </Flex>
                  ))
                )}
              </Box>

              <Flex justify="flex-end" mt={4}>
                <Button size="xs" bg={themeColors.brand.accent} color="#ffffff" onClick={() => setIsMultiPskModalOpen(false)}>
                  Done
                </Button>
              </Flex>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProfile,
}) => {
  if (!isOpen) return null;

  return (
    <ProfileModalContent
      onClose={onClose}
      onSave={onSave}
      initialProfile={initialProfile}
    />
  );
};
