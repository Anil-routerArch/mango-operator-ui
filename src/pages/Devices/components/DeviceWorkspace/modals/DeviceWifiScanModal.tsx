import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  SimpleGrid,
  Spinner,
  Table,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useWifiScanDevice, type WifiScanResult } from '@/api/devices';
import { toaster } from '@/components/ui/toaster';

export interface DeviceWifiScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  serialNumber: string;
}

export const DeviceWifiScanModal: React.FC<DeviceWifiScanModalProps> = ({
  isOpen,
  onClose,
  serialNumber,
}) => {
  const [dfs, setDfs] = useState(true);
  const [activeScan, setActiveScan] = useState(false);
  const [bandwidth, setBandwidth] = useState('');
  const [scanResult, setScanResult] = useState<WifiScanResult | null>(null);

  const scanMutation = useWifiScanDevice();

  if (!isOpen) return null;

  const handleStartScan = async () => {
    try {
      const res = await scanMutation.mutateAsync({
        serialNumber,
        dfs,
        activeScan,
        bandwidth: bandwidth || undefined,
      });
      setScanResult(res);
      toaster.create({
        title: 'Wi-Fi Scan Completed',
        description: `Scan completed successfully for ${serialNumber}`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Scan Failed',
        description: err instanceof Error ? err.message : 'Failed to execute Wi-Fi scan',
        type: 'error',
      });
    }
  };

  const handleDownloadCsv = () => {
    const list = scanResult?.scan || [];
    if (list.length === 0) return;

    const headers = ['SSID', 'BSSID', 'Channel', 'Signal (dBm)', 'Capability', 'MeshID'];
    const rows = list.map((item) => [
      `"${item.ssid || ''}"`,
      `"${item.bssid || ''}"`,
      item.channel ?? '',
      item.signal ?? item.rssi ?? '',
      `"${item.capability || ''}"`,
      `"${item.meshId || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wifi_scan_${serialNumber}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scanList = scanResult?.scan || [];

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1200"
      p={4}
    >
      <Box
        w="min(860px, 95vw)"
        maxH="85vh"
        bg="#ffffff"
        borderRadius="12px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        border="1px solid"
        borderColor={themeColors.panel.border}
      >
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          px={5}
          py={3.5}
          borderBottom="1px solid"
          borderColor={themeColors.panel.border}
          bg="#f8fafc"
        >
          <HStack gap={3}>
            <Box
              w="32px"
              h="32px"
              borderRadius="8px"
              bg="#e0f2fe"
              color="#0284c7"
              display="grid"
              placeItems="center"
            >
              <Icon name="wifi" size={18} color="#0284c7" />
            </Box>
            <Box>
              <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                Wi-Fi Radio Scan
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted}>
                Serial: {serialNumber}
              </Text>
            </Box>
          </HStack>

          <HStack gap={2}>
            {scanResult && (
              <Badge colorPalette="teal" variant="subtle" px={2} py={0.5} borderRadius="4px">
                {scanList.length} BSSIDs Detected
              </Badge>
            )}
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Close modal"
              onClick={onClose}
              color={themeColors.text.muted}
            >
              <Icon name="x" size={16} />
            </IconButton>
          </HStack>
        </Flex>

        {/* Content Body */}
        <Box flex="1" p={5} overflowY="auto">
          {scanMutation.isPending ? (
            <Center py={16} flexDirection="column" gap={4}>
              <Spinner size="xl" color="#0284c7" />
              <Box textAlign="center">
                <Text fontSize="15px" fontWeight="600" color={themeColors.text.title}>
                  Running Background Wi-Fi Scan...
                </Text>
                <Text fontSize="13px" color={themeColors.text.muted} mt={1}>
                  Probing radio channels on {serialNumber}. This typically takes 5 to 15 seconds.
                </Text>
              </Box>
            </Center>
          ) : scanResult ? (
            <Box>
              <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
                <Text fontSize="14px" fontWeight="600" color={themeColors.text.title}>
                  Scan Results ({scanList.length} wireless networks observed)
                </Text>
                <HStack gap={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleDownloadCsv}
                    disabled={scanList.length === 0}
                  >
                    <Icon name="download" size={14} />
                    Download CSV
                  </Button>
                  <Button
                    size="xs"
                    bg="#0284c7"
                    color="#ffffff"
                    _hover={{ bg: '#0369a1' }}
                    onClick={() => setScanResult(null)}
                  >
                    New Scan
                  </Button>
                </HStack>
              </Flex>

              {scanList.length === 0 ? (
                <Center py={12} flexDirection="column" gap={2} bg="#f8fafc" borderRadius="8px" border="1px dashed #cbd5e1">
                  <Icon name="wifi" size={28} color="#94a3b8" />
                  <Text fontSize="13px" color="#64748b">
                    No neighboring wireless networks were reported in this scan cycle.
                  </Text>
                </Center>
              ) : (
                <Box
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  borderRadius="8px"
                  overflow="hidden"
                >
                  <Table.Root size="sm" variant="outline">
                    <Table.Header bg="#f8fafc">
                      <Table.Row>
                        <Table.ColumnHeader fontSize="11px" fontWeight="700">SSID</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="11px" fontWeight="700">BSSID</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="11px" fontWeight="700">Channel</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="11px" fontWeight="700">Signal</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="11px" fontWeight="700">Capabilities</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {scanList.map((net, idx) => {
                        const sig = net.signal ?? net.rssi ?? -100;
                        return (
                          <Table.Row key={`${net.bssid}-${idx}`} _hover={{ bg: '#f8fafc' }}>
                            <Table.Cell fontWeight="600" color="#0f172a">
                              {net.ssid || <Text as="span" color="#94a3b8" fontStyle="italic">&lt;hidden&gt;</Text>}
                            </Table.Cell>
                            <Table.Cell fontFamily="mono" fontSize="12px" color="#475569">
                              {net.bssid || '—'}
                            </Table.Cell>
                            <Table.Cell>
                              <Badge variant="subtle" colorPalette="blue" size="xs">
                                Ch {net.channel ?? '—'}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <HStack gap={1.5}>
                                <Text fontSize="12px" fontWeight="600" color={sig > -65 ? '#16a34a' : sig > -80 ? '#d97706' : '#dc2626'}>
                                  {sig} dBm
                                </Text>
                              </HStack>
                            </Table.Cell>
                            <Table.Cell fontSize="11px" color="#64748b">
                              {net.capability || '—'}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <Text fontSize="13px" color={themeColors.text.muted} mb={5}>
                Configure radio scan parameters below. The device will survey active channels and nearby access points.
              </Text>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
                {/* Override DFS */}
                <Box
                  p={4}
                  borderRadius="8px"
                  border="1px solid"
                  borderColor={dfs ? '#38bdf8' : '#e2e8f0'}
                  bg={dfs ? '#f0f9ff' : '#ffffff'}
                  cursor="pointer"
                  onClick={() => setDfs(!dfs)}
                  transition="all 0.15s ease"
                >
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text fontSize="13px" fontWeight="600" color="#0f172a">
                      Override DFS
                    </Text>
                    <input
                      type="checkbox"
                      checked={dfs}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                  </Flex>
                  <Text fontSize="11px" color="#64748b">
                    Scan Dynamic Frequency Selection radar channels.
                  </Text>
                </Box>

                {/* Active Scan */}
                <Box
                  p={4}
                  borderRadius="8px"
                  border="1px solid"
                  borderColor={activeScan ? '#38bdf8' : '#e2e8f0'}
                  bg={activeScan ? '#f0f9ff' : '#ffffff'}
                  cursor="pointer"
                  onClick={() => setActiveScan(!activeScan)}
                  transition="all 0.15s ease"
                >
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text fontSize="13px" fontWeight="600" color="#0f172a">
                      Active Scan
                    </Text>
                    <input
                      type="checkbox"
                      checked={activeScan}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                  </Flex>
                  <Text fontSize="11px" color="#64748b">
                    Transmit probe requests rather than passive listening only.
                  </Text>
                </Box>

                {/* Bandwidth Selector */}
                <Box
                  p={4}
                  borderRadius="8px"
                  border="1px solid #e2e8f0"
                  bg="#ffffff"
                >
                  <Text fontSize="13px" fontWeight="600" color="#0f172a" mb={2}>
                    Bandwidth
                  </Text>
                  <select
                    value={bandwidth}
                    onChange={(e) => setBandwidth(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  >
                    <option value="">Default (All)</option>
                    <option value="20">20 MHz</option>
                    <option value="40">40 MHz</option>
                    <option value="80">80 MHz</option>
                    <option value="160">160 MHz</option>
                  </select>
                </Box>
              </SimpleGrid>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Flex
          align="center"
          justify="flex-end"
          px={5}
          py={3}
          borderTop="1px solid"
          borderColor={themeColors.panel.border}
          bg="#f8fafc"
          gap={2}
        >
          <Button size="sm" variant="outline" onClick={onClose} disabled={scanMutation.isPending}>
            Close
          </Button>
          {!scanResult && (
            <Button
              size="sm"
              bg="#0284c7"
              color="#ffffff"
              _hover={{ bg: '#0369a1' }}
              onClick={handleStartScan}
              disabled={scanMutation.isPending}
            >
              {scanMutation.isPending ? (
                <>
                  <Spinner size="xs" mr={1.5} />
                  Scanning...
                </>
              ) : (
                'Start Wi-Fi Scan'
              )}
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
};
