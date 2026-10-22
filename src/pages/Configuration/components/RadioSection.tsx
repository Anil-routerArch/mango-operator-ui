import React, { useMemo } from 'react';
import {
  Box,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from './ConfigurationSectionsCard/ToggleSwitch';
import { COUNTRY_LIST } from './ConfigurationSectionsCard/countryList';
import type { RadioConfigData } from '../types/radio';

export interface RadioSectionProps {
  config: RadioConfigData;
  onChange: (updated: RadioConfigData) => void;
  disabled?: boolean;
}

const BANDWIDTH_OPTIONS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
];

const CHANNEL_MODE_OPTIONS = [
  { value: 'HT', label: 'HT (A,B,G,N)' },
  { value: 'VHT', label: 'VHT (A,B,G,N,AC)' },
  { value: 'HE', label: 'HE (WiFi 6,A,B,G,N,AC,AX)' },
  { value: 'EHT', label: 'EHT (Wi-Fi 7)' },
];

const CHANNEL_WIDTH_OPTIONS = [
  { value: 20, label: '20 MHz' },
  { value: 40, label: '40 MHz' },
  { value: 80, label: '80 MHz' },
  { value: 160, label: '160 MHz' },
];

const MIMO_OPTIONS = [
  { value: '', label: 'None' },
  { value: '1x1', label: '1x1' },
  { value: '2x2', label: '2x2' },
  { value: '3x3', label: '3x3' },
  { value: '4x4', label: '4x4' },
  { value: '5x5', label: '5x5' },
  { value: '6x6', label: '6x6' },
  { value: '7x7', label: '7x7' },
  { value: '8x8', label: '8x8' },
];

const RATE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 1000, label: '1000' },
  { value: 2000, label: '2000' },
  { value: 5500, label: '5500' },
  { value: 6000, label: '6000' },
  { value: 9000, label: '9000' },
  { value: 11000, label: '11000' },
  { value: 12000, label: '12000' },
  { value: 18000, label: '18000' },
  { value: 24000, label: '24000' },
  { value: 36000, label: '36000' },
  { value: 48000, label: '48000' },
  { value: 54000, label: '54000' },
];

const REQUIRE_MODE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'HT', label: 'HT (A,B,G,N)' },
  { value: 'VHT', label: 'VHT (A,B,G,N,AC)' },
  { value: 'HE', label: 'HE (WiFi 6,A,B,G,N,AC,AX)' },
];

export const RadioSection: React.FC<RadioSectionProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  // Available channels based on selected band
  const channelOptions = useMemo(() => {
    const list = [{ value: 'auto', label: 'auto' }];
    if (config.band === '2G') {
      for (let i = 1; i <= 14; i++) {
        list.push({ value: String(i), label: String(i) });
      }
    } else if (config.band === '6G') {
      for (let i = 1; i <= 233; i += 4) {
        list.push({ value: String(i), label: String(i) });
      }
    } else {
      // 5G, 5G-lower, 5G-upper
      const c5g = [
        36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144,
        149, 153, 157, 161, 165,
      ];
      c5g.forEach((ch) => list.push({ value: String(ch), label: String(ch) }));
    }
    return list;
  }, [config.band]);

  return (
    <VStack gap={6} align="stretch">
      {/* ---------------- GENERAL SECTION ---------------- */}
      <Box>
        <Text fontSize="15px" fontWeight="700" color="#1e293b" mb={3} textDecoration="underline">
          General
        </Text>

        <VStack gap={4} align="stretch">
          {/* Row 1: band, bandwidth, country */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} alignItems="end">
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                band <Text as="span" color="#dc2626">*</Text>
              </Text>
              <SelectDropdown
                size="sm"
                value={config.band}
                onChange={(val) => onChange({ ...config, band: String(val) })}
                options={[
                  { value: '2G', label: '2G' },
                  { value: '5G', label: '5G' },
                  { value: '5G-lower', label: '5G-lower' },
                  { value: '5G-upper', label: '5G-upper' },
                  { value: '6G', label: '6G' },
                ]}
                disabled={disabled}
              />
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                bandwidth <Text as="span" color="#dc2626">*</Text>
              </Text>
              <SelectDropdown
                size="sm"
                value={config.bandwidth}
                onChange={(val) => onChange({ ...config, bandwidth: Number(val) })}
                options={BANDWIDTH_OPTIONS}
                disabled={disabled}
              />
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                country <Text as="span" color="#dc2626">*</Text>
              </Text>
              <SelectDropdown
                size="sm"
                value={config.country}
                onChange={(val) => onChange({ ...config, country: String(val) })}
                options={COUNTRY_LIST}
                disabled={disabled}
              />
            </Box>
          </SimpleGrid>

          {/* Row 2: channel-mode, channel-width, channel */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} alignItems="end">
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                channel-mode <Text as="span" color="#dc2626">*</Text>
              </Text>
              <SelectDropdown
                size="sm"
                value={config.channelMode}
                onChange={(val) => onChange({ ...config, channelMode: String(val) })}
                options={CHANNEL_MODE_OPTIONS}
                disabled={disabled}
              />
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                channel-width <Text as="span" color="#dc2626">*</Text>
              </Text>
              <SelectDropdown
                size="sm"
                value={config.channelWidth}
                onChange={(val) => onChange({ ...config, channelWidth: Number(val) })}
                options={CHANNEL_WIDTH_OPTIONS}
                disabled={disabled}
              />
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                channel
              </Text>
              <SelectDropdown
                size="sm"
                value={String(config.channel)}
                onChange={(val) => onChange({ ...config, channel: String(val) })}
                options={channelOptions}
                disabled={disabled}
              />
            </Box>
          </SimpleGrid>

          {/* Row 3: mimo, tx-power, legacy-rates */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} alignItems="end">
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                mimo
              </Text>
              <SelectDropdown
                size="sm"
                value={config.mimo}
                onChange={(val) => onChange({ ...config, mimo: String(val) })}
                options={MIMO_OPTIONS}
                disabled={disabled}
              />
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                tx-power <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                type="number"
                min={0}
                max={30}
                value={config.txPower}
                onChange={(e) => onChange({ ...config, txPower: Number(e.target.value) || 0 })}
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>

            <Box pb={1.5}>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                legacy-rates
              </Text>
              <ToggleSwitch
                checked={config.legacyRates}
                onChange={(checked) => onChange({ ...config, legacyRates: checked })}
                disabled={disabled}
              />
            </Box>
          </SimpleGrid>

          {/* Row 4: maximum-clients, multiple-bssid */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} alignItems="end">
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                maximum-clients
              </Text>
              <Input
                size="sm"
                type="number"
                min={1}
                max={512}
                value={config.maximumClients ?? 64}
                onChange={(e) =>
                  onChange({
                    ...config,
                    maximumClients: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>

            <Box pb={1.5}>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                multiple-bssid
              </Text>
              <ToggleSwitch
                checked={config.multipleBssid}
                onChange={(checked) => onChange({ ...config, multipleBssid: checked })}
                disabled={disabled}
              />
            </Box>
          </SimpleGrid>
        </VStack>
      </Box>

      {/* ---------------- ADVANCED SETTINGS SECTION ---------------- */}
      <Box pt={2}>
        <Text fontSize="15px" fontWeight="700" color="#1e293b" mb={3} textDecoration="underline">
          Advanced Settings
        </Text>

        <VStack gap={4} align="stretch">
          {/* Row 1: allow-dfs, beacon-rate, beacon-interval */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} alignItems="end">
            <Box pb={1.5}>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                allow-dfs
              </Text>
              <ToggleSwitch
                checked={config.allowDfs}
                onChange={(checked) => onChange({ ...config, allowDfs: checked })}
                disabled={disabled}
              />
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                beacon-rate
              </Text>
              <SelectDropdown
                size="sm"
                value={config.beaconRate ?? ''}
                onChange={(val) =>
                  onChange({
                    ...config,
                    beaconRate: val === '' ? '' : Number(val),
                  })
                }
                options={RATE_OPTIONS}
                disabled={disabled}
              />
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                beacon-interval <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                type="number"
                min={15}
                max={65535}
                value={config.beaconInterval}
                onChange={(e) =>
                  onChange({
                    ...config,
                    beaconInterval: Number(e.target.value) || 100,
                  })
                }
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>
          </SimpleGrid>

          {/* Row 2: hostapd-iface-raw, multicast, ema */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} alignItems="end">
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                hostapd-iface-raw
              </Text>
              <Input
                size="sm"
                value={config.hostapdIfaceRaw.join(', ')}
                onChange={(e) =>
                  onChange({
                    ...config,
                    hostapdIfaceRaw: e.target.value
                      ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      : [],
                  })
                }
                placeholder="URL param, ex.: test=value"
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                multicast
              </Text>
              <SelectDropdown
                size="sm"
                value={config.multicastRate ?? ''}
                onChange={(val) =>
                  onChange({
                    ...config,
                    multicastRate: val === '' ? '' : Number(val),
                  })
                }
                options={RATE_OPTIONS}
                disabled={disabled}
              />
            </Box>

            <Box pb={1.5}>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                ema
              </Text>
              <ToggleSwitch
                checked={config.ema}
                onChange={(checked) => onChange({ ...config, ema: checked })}
                disabled={disabled}
              />
            </Box>
          </SimpleGrid>

          {/* Row 3: bss-color, require-mode */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} alignItems="end">
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                bss-color
              </Text>
              <Input
                size="sm"
                type="number"
                min={1}
                max={63}
                value={config.bssColor ?? ''}
                onChange={(e) =>
                  onChange({
                    ...config,
                    bssColor: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                require-mode
              </Text>
              <SelectDropdown
                size="sm"
                value={config.requireMode ?? ''}
                onChange={(val) => onChange({ ...config, requireMode: String(val) })}
                options={REQUIRE_MODE_OPTIONS}
                disabled={disabled}
              />
            </Box>
          </SimpleGrid>
        </VStack>
      </Box>
    </VStack>
  );
};

