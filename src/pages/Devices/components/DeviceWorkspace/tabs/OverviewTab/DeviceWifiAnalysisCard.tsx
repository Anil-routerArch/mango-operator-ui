import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Table,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useDeviceStatisticsFrames } from '@/api/devices';
import type { UnifiedFleetDevice, DeviceStatisticsFrame } from '@/types/device';

export interface DeviceWifiAnalysisCardProps {
  device: UnifiedFleetDevice;
}

interface ParsedRadio {
  band: string;
  channel: number | string;
  channelWidth: number | string;
  txPower: number | string;
  noise: string;
  activeMs: string;
  busyMs: string;
  receiveMs: string;
  sendMs: string;
  temperature: string;
  frequency: string;
}

interface ParsedAssociation {
  station: string;
  ssid: string;
  ips: string;
  fingerprint: string;
  vendor: string;
  vlan: string | number;
  mode: string;
  rssi: string;
  rxRate: string;
  txRate: string;
}

const formatWhen = (timestamp?: number): string => {
  if (!timestamp) return 'Never';
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - timestamp);
  if (diff < 10) return '0 seconds ago';
  if (diff < 60) return `${diff} seconds ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const DeviceWifiAnalysisCard: React.FC<DeviceWifiAnalysisCardProps> = ({ device }) => {
  const [isRadiosOpen, setIsRadiosOpen] = useState(true);
  const [isAssociationsOpen, setIsAssociationsOpen] = useState(true);
  const [sliderIndex, setSliderIndex] = useState<number>(0);

  // Fetch real statistics frames through MDU backend with RBAC enforcement
  const {
    data: rawFrames,
    isLoading,
    isFetching,
    refetch,
  } = useDeviceStatisticsFrames(device.serialNumber, 30);

  // Chronologically sort frames: index 0 = oldest, index length-1 = newest
  const sortedFrames = useMemo<DeviceStatisticsFrame[]>(() => {
    if (!rawFrames || rawFrames.length === 0) return [];
    return [...rawFrames].sort((a, b) => (a.recorded || 0) - (b.recorded || 0));
  }, [rawFrames]);

  // Keep slider at the newest frame whenever new frames arrive
  useEffect(() => {
    if (sortedFrames.length > 0) {
      setSliderIndex(sortedFrames.length - 1);
    }
  }, [sortedFrames.length]);

  // Current frame data
  const currentFrame = useMemo(() => {
    if (sortedFrames.length > 0 && sliderIndex >= 0 && sliderIndex < sortedFrames.length) {
      return sortedFrames[sliderIndex];
    }
    if (device.lastStats?.raw) {
      return {
        recorded: device.lastContact || Math.floor(Date.now() / 1000),
        data: device.lastStats.raw,
      };
    }
    return null;
  }, [sortedFrames, sliderIndex, device]);

  // Extract and parse radios from the current active frame
  const radios = useMemo<ParsedRadio[]>(() => {
    if (!currentFrame?.data?.radios || currentFrame.data.radios.length === 0) {
      return [];
    }

    return currentFrame.data.radios.map((r, idx) => {
      let temp = r.temperature;
      if (temp && temp > 1000) temp = Math.round(temp / 1000);

      // Handle noise from survey or top-level radio attribute
      const noiseVal = r.noise ?? r.survey?.[0]?.noise;
      const noise = noiseVal !== undefined ? `${noiseVal} dBm` : '-';

      const activeMs = (r.survey?.[0]?.time ?? r.active_ms)?.toLocaleString() ?? '-';
      const busyMs = (r.survey?.[0]?.busy ?? r.busy_ms)?.toLocaleString() ?? '-';
      const receiveMs = (r.survey?.[0]?.time_rx ?? r.receive_ms)?.toLocaleString() ?? '-';
      const sendMs = (r.survey?.[0]?.time_tx ?? r.transmit_ms)?.toLocaleString() ?? '-';

      const deductedBand = r.band?.[0] || (r.channel && r.channel > 16 ? '5G' : '2G');

      return {
        band: deductedBand,
        channel: r.channel ?? idx + 1,
        channelWidth: r.channel_width ?? 20,
        txPower: r.tx_power ?? '-',
        noise,
        activeMs,
        busyMs,
        receiveMs,
        sendMs,
        temperature: temp !== undefined ? `${temp}°C` : '-',
        frequency: r.frequency?.join(', ') || '-',
      };
    });
  }, [currentFrame]);

  // Extract and parse associations from the current active frame's interfaces
  const associations = useMemo<ParsedAssociation[]>(() => {
    if (!currentFrame?.data?.interfaces) return [];

    const result: ParsedAssociation[] = [];
    for (const iface of currentFrame.data.interfaces) {
      for (const ssid of iface.ssids || []) {
        for (const assoc of ssid.associations || []) {
          const client = (iface.clients || []).find((c) => c.mac === assoc.station);
          const ips =
            client?.ipv4_addresses?.join(', ') ||
            client?.ipv6_addresses?.join(', ') ||
            assoc.ipaddr_v4 ||
            '-';

          let rxRate = '-';
          if (assoc.rx_rate?.bitrate) {
            rxRate = `${(assoc.rx_rate.bitrate / 1000).toFixed(1)} Mbps`;
          }

          let txRate = '-';
          if (assoc.tx_rate?.bitrate) {
            txRate = `${(assoc.tx_rate.bitrate / 1000).toFixed(1)} Mbps`;
          }

          result.push({
            station: assoc.station,
            ssid: ssid.ssid || '-',
            ips,
            fingerprint: assoc.fingerprint
              ? typeof assoc.fingerprint === 'object'
                ? Object.values(assoc.fingerprint).join(', ')
                : 'Identified'
              : '-',
            vendor: assoc.vendor || '-',
            vlan: assoc.dynamic_vlan ?? '-',
            mode: ssid.mode || assoc.mode || 'ap',
            rssi: assoc.rssi !== undefined ? `${assoc.rssi} dBm` : '-',
            rxRate,
            txRate,
          });
        }
      }
    }
    return result;
  }, [currentFrame]);

  const whenText = formatWhen(currentFrame?.recorded);

  return (
    <Box
      bg="#ffffff"
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="12px"
      p={5}
      boxShadow="0 1px 3px rgba(0,0,0,0.03)"
    >
      {/* Header */}
      <Flex align="center" justify="space-between" mb={2}>
        <HStack gap={2}>
          <Box color="#0d9488">
            <Icon name="wifi" size={18} />
          </Box>
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
            Wi-Fi Analysis
          </Text>
        </HStack>

        <HStack gap={2}>
          {isFetching && <Spinner size="xs" color="#0d9488" />}
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="teal"
            title="Refresh Wi-Fi analysis telemetry"
            onClick={() => refetch()}
          >
            <Icon name="refresh" size={13} />
          </IconButton>
        </HStack>
      </Flex>

      {/* When Indicator */}
      <Text fontSize="12px" color={themeColors.text.muted} mb={2}>
        When: {whenText}
      </Text>

      {/* Historical Slider Timeline if multiple frames are available */}
      {sortedFrames.length > 1 && (
        <Box
          mb={4}
          p={2.5}
          bg="#f8fafc"
          borderRadius="8px"
          border="1px solid"
          borderColor={themeColors.panel.divider}
        >
          <Flex justify="space-between" align="center" fontSize="11px" color={themeColors.text.muted} mb={1}>
            <Text>Oldest ({formatWhen(sortedFrames[0]?.recorded)})</Text>
            <Text fontWeight="600" color="#0d9488">
              Frame {sliderIndex + 1} of {sortedFrames.length}
            </Text>
            <Text>Latest ({formatWhen(sortedFrames[sortedFrames.length - 1]?.recorded)})</Text>
          </Flex>
          <input
            type="range"
            min={0}
            max={sortedFrames.length - 1}
            value={sliderIndex}
            onChange={(e) => setSliderIndex(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#0d9488',
              cursor: 'pointer',
            }}
          />
        </Box>
      )}

      {/* 1. Radios Table Section */}
      <Box mb={4}>
        <Flex
          justify="space-between"
          align="center"
          py={1.5}
          borderBottom="2px solid"
          borderColor="#3b82f6"
          mb={2}
          cursor="pointer"
          onClick={() => setIsRadiosOpen(!isRadiosOpen)}
        >
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            Radios ({radios.length})
          </Text>
          <IconButton size="2xs" variant="ghost" title={isRadiosOpen ? 'Collapse' : 'Expand'}>
            <Icon name={isRadiosOpen ? 'minus' : 'plus'} size={12} />
          </IconButton>
        </Flex>

        {isRadiosOpen && (
          <Box
            overflowX="auto"
            overflowY="auto"
            maxH="260px"
            border="1px solid"
            borderColor={themeColors.panel.divider}
            borderRadius="8px"
          >
            <Table.Root size="sm" variant="outline">
              <Table.Header position="sticky" top={0} zIndex={1} bg="#f8fafc">
                <Table.Row bg="#f8fafc">
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    Band
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    CH.
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    CH. W
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    TX POW.
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    NOISE
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    ACTIVE (MS)
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    BUSY (MS)
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    RECEIVE (MS)
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    SEND (MS)
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    TEMP.
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    FREQUENCY
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {isLoading && radios.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={11} textAlign="center" py={4}>
                      <HStack justify="center" gap={2}>
                        <Spinner size="xs" color="#0d9488" />
                        <Text fontSize="12px" color={themeColors.text.muted}>
                          Loading radio telemetry...
                        </Text>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ) : radios.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={11} textAlign="center" py={4} color={themeColors.text.muted} fontSize="12px">
                      No radio telemetry recorded for this interval.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  radios.map((radio, idx) => (
                    <Table.Row key={idx} fontSize="12px" _hover={{ bg: '#f1f5f9' }}>
                      <Table.Cell fontWeight="600">{radio.band}</Table.Cell>
                      <Table.Cell>{radio.channel}</Table.Cell>
                      <Table.Cell>{radio.channelWidth}</Table.Cell>
                      <Table.Cell>{radio.txPower}</Table.Cell>
                      <Table.Cell>{radio.noise}</Table.Cell>
                      <Table.Cell>{radio.activeMs}</Table.Cell>
                      <Table.Cell>{radio.busyMs}</Table.Cell>
                      <Table.Cell>{radio.receiveMs}</Table.Cell>
                      <Table.Cell>{radio.sendMs}</Table.Cell>
                      <Table.Cell>{radio.temperature}</Table.Cell>
                      <Table.Cell>{radio.frequency}</Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>

      {/* 2. Associations Table Section */}
      <Box>
        <Flex
          justify="space-between"
          align="center"
          py={1.5}
          borderBottom="2px solid"
          borderColor="#3b82f6"
          mb={2}
          cursor="pointer"
          onClick={() => setIsAssociationsOpen(!isAssociationsOpen)}
        >
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            Associations ({associations.length})
          </Text>
          <IconButton size="2xs" variant="ghost" title={isAssociationsOpen ? 'Collapse' : 'Expand'}>
            <Icon name={isAssociationsOpen ? 'minus' : 'plus'} size={12} />
          </IconButton>
        </Flex>

        {isAssociationsOpen && (
          <Box
            overflowX="auto"
            overflowY="auto"
            maxH="260px"
            border="1px solid"
            borderColor={themeColors.panel.divider}
            borderRadius="8px"
          >
            <Table.Root size="sm" variant="outline">
              <Table.Header position="sticky" top={0} zIndex={1} bg="#f8fafc">
                <Table.Row bg="#f8fafc">
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    STATION
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    SSID
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    IPS
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    FINGERPRINT
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    VENDOR
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    VLAN
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    MODE
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    RSSI
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    RX RATE
                  </Table.ColumnHeader>
                  <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                    TX RATE
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {associations.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={10} textAlign="center" py={4} color={themeColors.text.muted} fontSize="12px">
                      No active wireless client associations found on this access point.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  associations.map((assoc, idx) => (
                    <Table.Row key={idx} fontSize="12px" _hover={{ bg: '#f1f5f9' }}>
                      <Table.Cell fontFamily="mono" fontWeight="600">{assoc.station}</Table.Cell>
                      <Table.Cell>{assoc.ssid}</Table.Cell>
                      <Table.Cell>{assoc.ips}</Table.Cell>
                      <Table.Cell>{assoc.fingerprint}</Table.Cell>
                      <Table.Cell>{assoc.vendor}</Table.Cell>
                      <Table.Cell>{assoc.vlan}</Table.Cell>
                      <Table.Cell>{assoc.mode}</Table.Cell>
                      <Table.Cell>{assoc.rssi}</Table.Cell>
                      <Table.Cell>{assoc.rxRate}</Table.Cell>
                      <Table.Cell>{assoc.txRate}</Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DeviceWifiAnalysisCard;
