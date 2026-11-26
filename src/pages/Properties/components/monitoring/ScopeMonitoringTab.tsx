import React, { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Input,
  SimpleGrid,
  Spinner,
  Table,
  Text,
  VStack,
  chakra,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import {
  useVenueClientLifecycle,
  useVenueMonitoring,
  useVenueMonitoringClients,
} from '@/api/monitoring';
import { StartMonitoringModal } from './StartMonitoringModal';
import { ViewMonitoringSettingsModal } from './ViewMonitoringSettingsModal';

interface Props {
  venueId: string;
  venueName: string;
}

export const ScopeMonitoringTab: React.FC<Props> = ({ venueId, venueName }) => {
  const { data: monitoring, isLoading, isError, refetch } = useVenueMonitoring(venueId);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Sorting for Busiest Devices
  const [deviceSortBy, setDeviceSortBy] = useState<'associations' | 'memory' | 'health'>('associations');

  // Client lifecycle state
  const {
    data: clientMacs = [],
    isLoading: isLoadingClients,
    isError: isClientsError,
    refetch: refetchClients,
  } = useVenueMonitoringClients(venueId, Boolean(monitoring?.active));
  const [selectedMac, setSelectedMac] = useState<string>('');
  const [macSearchInput, setMacSearchInput] = useState<string>('');
  const LIFECYCLE_PAGE_SIZE = 100;
  const [eventOffset, setEventOffset] = useState(0);

  const {
    data: lifecycleEvents = [],
    isLoading: isLoadingEvents,
    isError: isEventsError,
    refetch: refetchEvents,
  } = useVenueClientLifecycle(venueId, selectedMac || undefined, {
    limit: LIFECYCLE_PAGE_SIZE,
    offset: eventOffset,
  });

  const filteredMacs = useMemo(() => {
    if (!macSearchInput.trim()) return clientMacs;
    const q = macSearchInput.trim().toLowerCase();
    return clientMacs.filter((m) => m.toLowerCase().includes(q));
  }, [clientMacs, macSearchInput]);

  const sortedDevices = useMemo(() => {
    const list = [...(monitoring?.devices || [])];
    list.sort((a, b) => {
      if (deviceSortBy === 'associations') {
        const totalA = a.associations_2g + a.associations_5g + a.associations_6g;
        const totalB = b.associations_2g + b.associations_5g + b.associations_6g;
        return totalB - totalA;
      }
      if (deviceSortBy === 'memory') {
        return b.memory - a.memory;
      }
      return b.health - a.health;
    });
    return list;
  }, [monitoring?.devices, deviceSortBy]);

  if (isLoading) {
    return (
      <Flex minH="400px" align="center" justify="center">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (isError) {
    return (
      <VStack minH="360px" justify="center" gap={3}>
        <Icon name="alertTriangle" size={32} color="#dc2626" />
        <Text fontWeight="700">Unable to load monitoring data for this venue.</Text>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </VStack>
    );
  }

  // If monitoring is not yet activated on this venue
  if (!monitoring?.active) {
    return (
      <Box py={8}>
        <Flex
          direction="column"
          align="center"
          justify="center"
          p={10}
          borderRadius="12px"
          bg="#ffffff"
          border="1px dashed #cbd5e1"
          textAlign="center"
          maxW="640px"
          mx="auto"
          boxShadow="0 2px 10px rgba(0,0,0,0.03)"
        >
          <Flex
            w="64px"
            h="64px"
            borderRadius="full"
            bg="#f0fdfa"
            color="#0d9488"
            align="center"
            justify="center"
            mb={4}
          >
            <Icon name="gauge" size={32} />
          </Flex>
          <Text fontSize="18px" fontWeight="750" color="#0f172a" mb={1}>
            Monitoring is not active for this venue
          </Text>
          <Text fontSize="13px" color="#64748b" mb={6} maxW="460px">
            Activate monitoring to begin aggregating AP health, memory consumption, radio metrics,
            active client associations, and station lifecycle events.
          </Text>
          <Button
            bg="#0d9488"
            _hover={{ bg: '#0f766e' }}
            color="#fff"
            onClick={() => setStartModalOpen(true)}
          >
            <Icon name="gauge" size={16} /> &nbsp; Start Monitoring
          </Button>
        </Flex>

        <StartMonitoringModal
          venueId={venueId}
          venueName={venueName}
          isOpen={startModalOpen}
          onClose={() => setStartModalOpen(false)}
          onStarted={() => refetch()}
        />
      </Box>
    );
  }

  const summary = monitoring.summary;
  const neutralColor = {
    bg: '#f8fafc',
    border: '#e2e8f0',
    text: '#64748b',
  };

  const hasHealth = Boolean(summary) && sortedDevices.some((dev) => dev.health > 0);
  const hasMemory = Boolean(summary) && sortedDevices.some((dev) => dev.memory > 0);

  const healthColor = !hasHealth
    ? neutralColor
    : (summary?.avgHealth || 0) >= 90
    ? { bg: '#dcfce7', border: '#bbf7d0', text: '#15803d' }
    : (summary?.avgHealth || 0) >= 70
    ? { bg: '#fef9c3', border: '#fef08a', text: '#a16207' }
    : { bg: '#fee2e2', border: '#fecaca', text: '#b91c1c' };

  const memoryColor = !hasMemory
    ? neutralColor
    : (summary?.avgMemoryUsed || 0) >= 80
    ? { bg: '#fee2e2', border: '#fecaca', text: '#b91c1c' }
    : (summary?.avgMemoryUsed || 0) >= 65
    ? { bg: '#fef9c3', border: '#fef08a', text: '#a16207' }
    : { bg: '#dcfce7', border: '#bbf7d0', text: '#15803d' };

  return (
    <Box>
      {/* Settings / Info Bar */}
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
        <Flex align="center" gap={2}>
          <Box w="8px" h="8px" borderRadius="full" bg="#16a34a" />
          <Text fontSize="12px" fontWeight="700" color="#16a34a">
            Monitoring Active
          </Text>
          <Text fontSize="12px" color="#64748b">
            · Interval: {monitoring.interval ? `${monitoring.interval}s` : '—'} · Board: {monitoring.boardId ? `${monitoring.boardId.slice(0, 8)}...` : '—'}
          </Text>
        </Flex>
        <Button
          size="xs"
          variant="outline"
          onClick={() => setSettingsModalOpen(true)}
        >
          <Icon name="settings" size={13} /> Settings & Stop
        </Button>
      </Flex>

      {/* 1. Status Bar (4 Top KPI Cards) */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={6}>
        {/* Status Card */}
        <Box
          p={4}
          borderRadius="10px"
          bg="#ffffff"
          border="1px solid #e2e8f0"
          boxShadow="0 1px 3px rgba(0,0,0,0.05)"
        >
          <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase" mb={3}>
            Status
          </Text>
          <Flex direction="column" gap={1.5}>
            <Flex align="center" gap={2}>
              <Box w="10px" h="10px" borderRadius="full" bg="#16a34a" />
              <Text fontSize="14px" fontWeight="700" color="#0f172a">
                {summary?.connectedDevices ?? '—'}
              </Text>
              <Text fontSize="12px" color="#64748b">
                connected
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Box w="10px" h="10px" borderRadius="full" bg="#dc2626" />
              <Text fontSize="14px" fontWeight="700" color="#0f172a">
                {summary?.disconnectedDevices ?? '—'}
              </Text>
              <Text fontSize="12px" color="#64748b">
                disconnected
              </Text>
            </Flex>
          </Flex>
        </Box>

        {/* Overall Health Card */}
        <Box
          p={4}
          borderRadius="10px"
          bg={healthColor.bg}
          border="1px solid"
          borderColor={healthColor.border}
          boxShadow="0 1px 3px rgba(0,0,0,0.05)"
        >
          <Text fontSize="12px" fontWeight="700" color={healthColor.text} textTransform="uppercase" mb={2}>
            Overall Health
          </Text>
          <Flex align="center" gap={2} mt={1}>
            <Icon name="heart" size={26} color={healthColor.text} />
            <Text fontSize="28px" fontWeight="800" color={healthColor.text} lineHeight="1">
              {hasHealth ? `${summary!.avgHealth}%` : '—'}
            </Text>
          </Flex>
        </Box>

        {/* Used Memory Card */}
        <Box
          p={4}
          borderRadius="10px"
          bg={memoryColor.bg}
          border="1px solid"
          borderColor={memoryColor.border}
          boxShadow="0 1px 3px rgba(0,0,0,0.05)"
        >
          <Text fontSize="12px" fontWeight="700" color={memoryColor.text} textTransform="uppercase" mb={2}>
            Used Memory
          </Text>
          <Flex align="center" gap={2} mt={1}>
            <Icon name="activity" size={26} color={memoryColor.text} />
            <Text fontSize="28px" fontWeight="800" color={memoryColor.text} lineHeight="1">
              {hasMemory ? `${summary!.avgMemoryUsed}%` : '—'}
            </Text>
          </Flex>
        </Box>

        {/* Associations Card */}
        <Box
          p={4}
          borderRadius="10px"
          bg="#ffffff"
          border="1px solid #e2e8f0"
          boxShadow="0 1px 3px rgba(0,0,0,0.05)"
        >
          <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase" mb={2}>
            Associations
          </Text>
          <Flex justify="space-between" align="baseline">
            <VStack align="start" gap={0.5}>
              <Text fontSize="12px" color="#475569">
                2G: <strong style={{ color: '#0f172a' }}>{summary?.twoGAssociations ?? '—'}</strong>
              </Text>
              <Text fontSize="12px" color="#475569">
                5G: <strong style={{ color: '#0f172a' }}>{summary?.fiveGAssociations ?? '—'}</strong>
              </Text>
              <Text fontSize="12px" color="#475569">
                6G: <strong style={{ color: '#0f172a' }}>{summary?.sixGAssociations ?? '—'}</strong>
              </Text>
            </VStack>
            <Box textAlign="right">
              <Text fontSize="24px" fontWeight="800" color="#2563eb" lineHeight="1">
                {summary?.totalAssociations ?? '—'}
              </Text>
              <Text fontSize="10px" color="#64748b" textTransform="uppercase" fontWeight="700">
                Total Clients
              </Text>
            </Box>
          </Flex>
        </Box>
      </SimpleGrid>

      {/* 2. Top Busiest Devices */}
      <Box
        p={5}
        borderRadius="12px"
        bg="#ffffff"
        border="1px solid #e2e8f0"
        boxShadow="0 1px 4px rgba(0,0,0,0.04)"
        mb={6}
      >
        <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
          <Box>
            <Heading size="sm" color="#0f172a">
              Top Busiest Devices
            </Heading>
            <Text fontSize="11px" color="#64748b">
              Real-time AP telemetry ranked by workload
            </Text>
          </Box>
          <HStack gap={2}>
            <Text fontSize="12px" color="#64748b" fontWeight="650">
              Rank by:
            </Text>
            <chakra.select
              value={deviceSortBy}
              onChange={(e) => setDeviceSortBy(e.target.value as any)}
              h="32px"
              px={2}
              borderRadius="6px"
              fontSize="12px"
              border="1px solid #cbd5e1"
            >
              <option value="associations">Associations (Clients)</option>
              <option value="memory">Memory Usage (%)</option>
              <option value="health">Health Score</option>
            </chakra.select>
          </HStack>
        </Flex>

        {sortedDevices.length === 0 ? (
          <Text py={8} textAlign="center" fontSize="13px" color="#94a3b8">
            {!summary
              ? 'Telemetry temporarily unavailable.'
              : 'No devices currently reporting telemetry for this board.'}
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row bg="#f8fafc">
                  <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                    SERIAL NUMBER
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                    STATUS
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                    HEALTH
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                    MEMORY
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                    2G
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                    5G
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                    6G
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                    TOTAL CLIENTS
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                    IP ADDRESS
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sortedDevices.map((dev) => {
                  const totalDevAssoc =
                    dev.associations_2g + dev.associations_5g + dev.associations_6g;
                  return (
                    <Table.Row key={dev.serialNumber} _hover={{ bg: '#f8fafc' }}>
                      <Table.Cell fontFamily="monospace" fontSize="12px" fontWeight="700" color="#2563eb">
                        {dev.serialNumber}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          colorPalette={dev.connected ? 'green' : 'red'}
                          fontSize="10px"
                          px={1.5}
                          py={0.5}
                        >
                          {dev.connected ? 'connected' : 'disconnected'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="12px" fontWeight="600">
                        {dev.health > 0 ? `${dev.health}%` : '—'}
                      </Table.Cell>
                      <Table.Cell fontSize="12px" fontWeight="600">
                        {dev.memory > 0 ? `${dev.memory}%` : '—'}
                      </Table.Cell>
                      <Table.Cell fontSize="12px">{dev.associations_2g}</Table.Cell>
                      <Table.Cell fontSize="12px">{dev.associations_5g}</Table.Cell>
                      <Table.Cell fontSize="12px">{dev.associations_6g}</Table.Cell>
                      <Table.Cell fontSize="12px" fontWeight="750" color="#0f172a">
                        {totalDevAssoc}
                      </Table.Cell>
                      <Table.Cell fontSize="12px" fontFamily="monospace" color="#64748b">
                        {dev.connectionIp || '—'}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>

      {/* 3. Live Data & Client Lifecycle Section */}
      <Box
        p={5}
        borderRadius="12px"
        bg="#ffffff"
        border="1px solid #e2e8f0"
        boxShadow="0 1px 4px rgba(0,0,0,0.04)"
      >
        <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
          <Box>
            <Heading size="sm" color="#0f172a">
              Live Data & Client Lifecycle
            </Heading>
            <Text fontSize="11px" color="#64748b">
              Historical Wi-Fi client association and roaming audit trail
            </Text>
          </Box>

          <HStack gap={2} wrap="wrap">
            {clientMacs.length >= 500 && (
              <Badge colorPalette="gray" fontSize="10px" px={2} py={0.5} variant="subtle">
                Latest 500 stations
              </Badge>
            )}
            <Input
              size="xs"
              w="180px"
              placeholder="Search station MAC..."
              value={macSearchInput}
              onChange={(e) => setMacSearchInput(e.target.value)}
              disabled={isLoadingClients || isClientsError}
            />
            <chakra.select
              value={selectedMac}
              onChange={(e) => {
                setSelectedMac(e.target.value);
                setEventOffset(0);
              }}
              h="30px"
              px={2}
              borderRadius="6px"
              fontSize="12px"
              border="1px solid #cbd5e1"
              disabled={isLoadingClients || isClientsError}
            >
              <option value="">
                {isLoadingClients
                  ? 'Loading stations...'
                  : isClientsError
                  ? 'Failed to load stations'
                  : 'Select Station (UE)...'}
              </option>
              {filteredMacs.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </chakra.select>
          </HStack>
        </Flex>

        {isLoadingClients ? (
          <Flex minH="120px" align="center" justify="center">
            <Spinner size="md" />
          </Flex>
        ) : isClientsError ? (
          <VStack py={6} gap={2}>
            <Text color="#dc2626" fontSize="13px" fontWeight="600">
              Unable to load client stations.
            </Text>
            <Button
              size="xs"
              variant="outline"
              onClick={() => refetchClients()}
            >
              Retry
            </Button>
          </VStack>
        ) : !selectedMac ? (
          <Box p={6} textAlign="center" borderRadius="8px" bg="#f8fafc" border="1px dashed #e2e8f0">
            <Text fontSize="13px" color="#64748b">
              {clientMacs.length === 0
                ? 'No client stations (UEs) recorded for this venue yet.'
                : 'Select a client station (UE) from the dropdown above to view its lifecycle history.'}
            </Text>
          </Box>
        ) : isLoadingEvents ? (
          <Flex minH="120px" align="center" justify="center">
            <Spinner size="md" />
          </Flex>
        ) : isEventsError ? (
          <VStack py={6} gap={2}>
            <Text color="#dc2626" fontSize="13px" fontWeight="600">
              Unable to load client lifecycle history for station {selectedMac}.
            </Text>
            <Button
              size="xs"
              variant="outline"
              onClick={() => refetchEvents()}
            >
              Retry
            </Button>
          </VStack>
        ) : lifecycleEvents.length === 0 ? (
          <VStack py={6} gap={2}>
            <Text textAlign="center" fontSize="13px" color="#94a3b8">
              {eventOffset > 0
                ? 'No further lifecycle events found.'
                : `No lifecycle events recorded for station ${selectedMac}.`}
            </Text>
            {eventOffset > 0 && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => setEventOffset((prev) => Math.max(0, prev - LIFECYCLE_PAGE_SIZE))}
              >
                Previous Page
              </Button>
            )}
          </VStack>
        ) : (
          <>
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row bg="#f8fafc">
                    <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                      TIMESTAMP
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                      RSSI
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                      RX BYTES
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                      TX BYTES
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                      BITRATE
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                      SSID
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#64748b">
                      BSSID
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {lifecycleEvents.map((evt, idx) => (
                    <Table.Row key={`${evt.timestamp}-${idx}`} _hover={{ bg: '#f8fafc' }}>
                      <Table.Cell fontSize="12px" color="#475569">
                        {new Date(evt.timestamp * 1000).toLocaleString()}
                      </Table.Cell>
                      <Table.Cell fontSize="12px" fontWeight="700" color={evt.rssi && evt.rssi > -60 ? '#16a34a' : '#d97706'}>
                        {evt.rssi ? `${evt.rssi} dBm` : '—'}
                      </Table.Cell>
                      <Table.Cell fontSize="12px">{evt.rx_bytes ? `${Math.round(evt.rx_bytes / 1024)} KB` : '0'}</Table.Cell>
                      <Table.Cell fontSize="12px">{evt.tx_bytes ? `${Math.round(evt.tx_bytes / 1024)} KB` : '0'}</Table.Cell>
                      <Table.Cell fontSize="12px">
                        {evt.rx_bitrate ? `${evt.rx_bitrate} Mbps` : '—'}
                      </Table.Cell>
                      <Table.Cell fontSize="12px" fontWeight="600" color="#0f172a">
                        {evt.ssid || '—'}
                      </Table.Cell>
                      <Table.Cell fontSize="11px" fontFamily="monospace" color="#64748b">
                        {evt.bssid || '—'}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>

            {/* Lifecycle Events Pagination */}
            <Flex
              justify="space-between"
              align="center"
              mt={4}
              pt={3}
              borderTop="1px solid #f1f5f9"
              wrap="wrap"
              gap={2}
            >
              <Text fontSize="12px" color="#64748b">
                Showing events {eventOffset + 1}–{eventOffset + lifecycleEvents.length}
              </Text>
              <HStack gap={2}>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={eventOffset === 0 || isLoadingEvents}
                  onClick={() => setEventOffset((prev) => Math.max(0, prev - LIFECYCLE_PAGE_SIZE))}
                >
                  Previous
                </Button>
                <Text fontSize="12px" fontWeight="600" color="#0f172a">
                  Page {Math.floor(eventOffset / LIFECYCLE_PAGE_SIZE) + 1}
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={lifecycleEvents.length < LIFECYCLE_PAGE_SIZE || isLoadingEvents}
                  onClick={() => setEventOffset((prev) => prev + LIFECYCLE_PAGE_SIZE)}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          </>
        )}
      </Box>

      {/* Settings Modal */}
      <ViewMonitoringSettingsModal
        venueId={venueId}
        venueName={venueName}
        monitoring={monitoring}
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onStopped={() => refetch()}
      />
    </Box>
  );
};
