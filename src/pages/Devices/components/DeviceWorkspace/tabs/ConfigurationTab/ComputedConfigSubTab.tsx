import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useDeviceComputedConfiguration } from '@/api/devices';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice } from '@/types/device';

export interface ComputedConfigSubTabProps {
  device: UnifiedFleetDevice;
}

export const ComputedConfigSubTab: React.FC<ComputedConfigSubTabProps> = ({ device }) => {
  const [activeView, setActiveView] = useState<'visual' | 'raw'>('visual');
  const [copied, setCopied] = useState(false);

  const { data: computedData, isLoading, refetch } = useDeviceComputedConfiguration(device.serialNumber);

  // Fallback sample configuration if backend returns empty
  const configObj: Record<string, any> = React.useMemo(() => {
    if (computedData?.config && typeof computedData.config === 'object') return computedData.config as Record<string, any>;
    return {
      uuid: 1,
      radios: [
        {
          band: '2G',
          channel: 1,
          'channel-mode': 'HE',
          'channel-width': 20,
          'country-code': 'US',
          rates: { beacon: 6000, multicast: 24000 },
        },
        {
          band: '5G',
          channel: 36,
          'channel-mode': 'HE',
          'channel-width': 80,
          'country-code': 'US',
          rates: { beacon: 6000, multicast: 24000 },
        },
      ],
      interfaces: [
        {
          name: 'WAN',
          role: 'upstream',
          services: ['lldp', 'ssh'],
          ethernet: [{ select_ports: ['WAN*'] }],
          ipv4: { addressing: 'dynamic' },
        },
        {
          name: 'LAN',
          role: 'downstream',
          ssids: [
            {
              name: 'Sunrise-Residents',
              wifi_bands: ['2G', '5G'],
              security: { mode: 'wpa2-personal', key: 'SunriseSecretPass123' },
            },
          ],
        },
      ],
      metrics: {
        statistics: { interval: 60, types: ['ssids', 'lldp', 'clients'] },
        telemetry: { interval: 30, types: ['radios'] },
      },
    };
  }, [computedData]);

  const rawJson = JSON.stringify(configObj, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    toaster.create({
      title: 'Copied',
      description: 'Computed configuration copied to clipboard',
      type: 'info',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={4}>
        {/* Inheritance Hierarchy Banner */}
        <Box
          p="12px 16px"
          bg="#f6faff"
          border="1px solid #b8d1f7"
          borderRadius="8px"
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
            <HStack gap={2} fontSize="13px">
              <Icon name="layers" size={16} color={themeColors.brand.accent} />
              <Text fontWeight="600" color={themeColors.text.title}>
                Effective Configuration Inheritance:
              </Text>
              <Text color={themeColors.text.secondary}>
                Root Entity → {device.entityName || 'Sunrise Apartments'} → Venue ({device.venueName || 'Building B'}) → Tag Overrides
              </Text>
            </HStack>

            <HStack gap={2}>
              <Button
                size="xs"
                variant={activeView === 'visual' ? 'solid' : 'outline'}
                bg={activeView === 'visual' ? themeColors.brand.accent : 'transparent'}
                color={activeView === 'visual' ? '#ffffff' : themeColors.text.primary}
                onClick={() => setActiveView('visual')}
              >
                Structured View
              </Button>
              <Button
                size="xs"
                variant={activeView === 'raw' ? 'solid' : 'outline'}
                bg={activeView === 'raw' ? themeColors.brand.accent : 'transparent'}
                color={activeView === 'raw' ? '#ffffff' : themeColors.text.primary}
                onClick={() => setActiveView('raw')}
              >
                Raw uCentral JSON
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={handleCopy}
                gap={1}
              >
                <Icon name={copied ? 'check' : 'copy'} size={12} />
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="xs" /> : <Icon name="refresh" size={12} />}
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* View Mode 1: Visual Sections */}
        {activeView === 'visual' ? (
          <VStack align="stretch" gap={3}>
            {/* Radios Summary Box */}
            <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff">
              <HStack gap={2} mb={2}>
                <Icon name="radio" size={16} color={themeColors.brand.accent} />
                <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
                  Radios Configuration ({(configObj.radios as unknown[])?.length || 2} bands)
                </Text>
              </HStack>
              <Text fontSize="12px" color={themeColors.text.muted} mb={3}>
                Radio profiles compiled from Venue RF Profile with device hardware channel widths
              </Text>
              <HStack gap={3} wrap="wrap">
                {(configObj.radios as Array<{ band?: string; channel?: string | number; 'channel-width'?: number }>)?.map((r, i) => (
                  <Box key={i} p={3} border="1px solid #e2e8f0" borderRadius="6px" bg="#f8fafc" minW="180px">
                    <Text fontSize="13px" fontWeight="700" color={themeColors.brand.accent}>
                      {r.band} Radio
                    </Text>
                    <Text fontSize="12px" color={themeColors.text.secondary}>
                      Channel: {r.channel}
                    </Text>
                    <Text fontSize="12px" color={themeColors.text.secondary}>
                      Width: {r['channel-width']} MHz
                    </Text>
                  </Box>
                ))}
              </HStack>
            </Box>

            {/* Interfaces & SSIDs Box */}
            <Box p={4} border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff">
              <HStack gap={2} mb={2}>
                <Icon name="wifi" size={16} color="#16a34a" />
                <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
                  Interfaces & SSIDs
                </Text>
              </HStack>
              <Text fontSize="12px" color={themeColors.text.muted} mb={3}>
                Network SSIDs, VLAN assignments, and upstream gateway settings
              </Text>
              <VStack align="stretch" gap={2}>
                {(configObj.interfaces as Array<{ name?: string; role?: string; ssids?: Array<{ name?: string; security?: { mode?: string } }> }>)?.map((iface, i) => (
                  <Box key={i} p={3} border="1px solid #e2e8f0" borderRadius="6px" bg="#f8fafc">
                    <Flex justify="space-between" align="center">
                      <HStack gap={2}>
                        <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
                          {iface.name} ({iface.role})
                        </Text>
                        {iface.ssids && iface.ssids.length > 0 && (
                          <Box fontSize="11px" fontWeight="600" color="#16a34a" bg="#dcfce7" px={2} py={0.5} borderRadius="4px">
                            SSID: {iface.ssids[0].name} ({iface.ssids[0].security?.mode})
                          </Box>
                        )}
                      </HStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>
          </VStack>
        ) : (
          /* View Mode 2: Raw uCentral JSON */
          <Box
            p={4}
            borderRadius="8px"
            bg="#0d1117"
            color="#c9d1d9"
            fontFamily="monospace"
            fontSize="12px"
            lineHeight="1.6"
            maxH="450px"
            overflowY="auto"
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {rawJson}
            </pre>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ComputedConfigSubTab;
