import React, { useEffect, useState } from 'react';
import { Box, Button, Flex, Input, SimpleGrid, Spinner, Text, VStack, chakra } from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useScopedDevices, useDeviceEventsStream, type PropertyScopeType } from '@/api';
import { AvailabilityDot } from './ScopeStatus';
import { PropertyMetricCard } from './PropertyMetricCard';

export const ScopeDevicesTab: React.FC<{ type: PropertyScopeType; id: string; venueOptions?: Array<{ id: string; name: string }> }> = ({ type, id, venueOptions = [] }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState(() => searchParams.get('availability') || '');
  const [attention, setAttention] = useState<'low-sanity' | 'sanity-unavailable' | ''>(() => {
    const value = searchParams.get('attention');
    return value === 'low-sanity' || value === 'sanity-unavailable' ? value : '';
  });
  const [deviceType, setDeviceType] = useState('');
  const [venue, setVenue] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 25;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPageIndex(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, refetch } = useScopedDevices(type, id, {
    pageIndex,
    pageSize,
    search,
    venue: venue || undefined,
    availability: availability || undefined,
    attention: attention || undefined,
    type: deviceType || undefined,
  });

  const currentSerials = React.useMemo(() => (data?.devices || []).map((d) => d.serialNumber), [data?.devices]);
  useDeviceEventsStream(currentSerials);

  const authoritativeEmpty = data?.totalCount === 0;

  const applyDeviceFilter = (nextAvailability = '', nextAttention: typeof attention = '') => {
    setAvailability(nextAvailability);
    setAttention(nextAttention);
    setPageIndex(0);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextAvailability) next.set('availability', nextAvailability);
      else next.delete('availability');
      if (nextAttention) next.set('attention', nextAttention);
      else next.delete('attention');
      return next;
    }, { replace: true });
  };

  return (
    <VStack align="stretch" gap={4}>
      {data?.dataQuality?.state === 'partial' && (
        <Flex p={3} bg={themeColors.status.pending.bg} border="1px solid" borderColor={themeColors.status.pending.border} borderRadius="6px" gap={2}>
          <Icon name="alertTriangle" size={17} color={themeColors.status.pending.text} />
          <Text fontSize="12px">Some live statuses are unavailable. Unknown Devices are not counted as Offline.</Text>
        </Flex>
      )}
      {data?.dataQuality?.state === 'stale' && (
        <Flex p={3} bg="#fffbeb" border="1px solid" borderColor="#fde68a" borderRadius="6px" gap={2}>
          <Icon name="alertTriangle" size={17} color="#d97706" />
          <Text fontSize="12px" color="#92400e">Status was measured as of {data.dataQuality.asOf || 'recently'} and may be stale.</Text>
        </Flex>
      )}
      <Flex justify="space-between" align="flex-end"><Box><Text fontSize="20px" fontWeight="700">Devices</Text><Text fontSize="11px" color={themeColors.text.muted}>Devices assigned anywhere in this scope.</Text></Box></Flex>
      {data && <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={3}>
        <PropertyMetricCard label="Total Devices" value={data.summary.totalDevices != null ? data.summary.totalDevices.toLocaleString() : '—'} icon="device" tone="#4f46e5" onClick={() => applyDeviceFilter()} />
        <PropertyMetricCard label="Online" value={data.summary.onlineDevices != null ? data.summary.onlineDevices.toLocaleString() : '—'} icon="wifi" tone="#16a34a" onClick={() => applyDeviceFilter('online')} />
        <PropertyMetricCard label="Offline" value={data.summary.offlineDevices != null ? data.summary.offlineDevices.toLocaleString() : '—'} icon="power" tone="#dc2626" onClick={() => applyDeviceFilter('offline')} />
        <PropertyMetricCard label="Unknown" value={data.summary.unknownDevices != null ? data.summary.unknownDevices.toLocaleString() : '—'} icon="info" tone="#64748b" onClick={() => applyDeviceFilter('unknown')} />
      </SimpleGrid>}
      <Flex gap={2} flexWrap="wrap" align="center">
        <Flex position="relative" align="center" flex="1" minW="230px">
          <Box position="absolute" left="10px" zIndex={1} color={themeColors.text.muted}><Icon name="search" size={16} /></Box>
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search Device name or serial" pl="34px" h="38px" fontSize="12px" />
        </Flex>
        <chakra.select value={deviceType} onChange={(e) => { setDeviceType(e.target.value); setPageIndex(0); }} h="38px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px" fontSize="12px" bg="#fff">
          <option value="">All device types</option>
          <option value="ap">Access Point (AP)</option>
          <option value="switch">Switch</option>
          <option value="olg">OpenLAN Gateway</option>
        </chakra.select>
        {venueOptions.length > 0 && <chakra.select value={venue} onChange={(e) => { setVenue(e.target.value); setPageIndex(0); }} h="38px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px" fontSize="12px" bg="#fff" aria-label="Filter Devices by Venue">
          <option value="">All authorized Venues</option>
          {venueOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </chakra.select>}
        <chakra.select
          value={attention ? `attention:${attention}` : availability ? `availability:${availability}` : ''}
          onChange={(e) => {
            const [kind, value = ''] = e.target.value.split(':');
            if (kind === 'attention') applyDeviceFilter('', value as typeof attention);
            else applyDeviceFilter(value, '');
          }}
          h="38px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px" fontSize="12px" bg="#fff"
          aria-label="Filter Devices by availability or attention reason"
        >
          <option value="">All availability</option>
          <option value="availability:online">Online</option>
          <option value="availability:offline">Offline</option>
          <option value="availability:unknown">Unknown</option>
          <option value="attention:low-sanity">Low sanity</option>
          <option value="attention:sanity-unavailable">Sanity unavailable</option>
        </chakra.select>
        <Button h="38px" variant="outline" onClick={() => refetch()} aria-label="Refresh Devices"><Icon name="refresh" size={16} /></Button>
      </Flex>

      <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" overflow="hidden" bg="#fff">
        {isLoading ? (
          <Flex minH="260px" align="center" justify="center"><Spinner /></Flex>
        ) : isError ? (
          <VStack py={14}><Text fontWeight="700">Could not load scoped Devices</Text><Button size="sm" onClick={() => refetch()}>Retry</Button></VStack>
        ) : !data || data.devices.length === 0 ? (
          <VStack py={14} gap={2}><Icon name="device" size={28} color={themeColors.text.muted} /><Text fontWeight="700">{authoritativeEmpty ? 'No Devices found' : 'No Device records loaded'}</Text><Text fontSize="12px" color={themeColors.text.muted}>{authoritativeEmpty ? 'Try changing the selected filters.' : 'Inventory is incomplete or unavailable, so this is not an authoritative empty result.'}</Text>{!authoritativeEmpty && <Button size="sm" variant="outline" onClick={() => refetch()}>Retry inventory</Button>}</VStack>
        ) : (
          <Box overflowX="auto">
            <Box as="table" w="100%" minW="900px" borderCollapse="collapse">
              <Box as="thead" bg={themeColors.canvas.bg}>
                <Box as="tr">
                  {['Device', 'Serial', 'Venue', 'Type', 'Availability', 'IP address'].map((header) => (
                    <Box as="th" key={header} px={3} py={2} textAlign="left" fontSize="10px" color={themeColors.text.muted}>{header}</Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody" opacity={isFetching ? 0.65 : 1}>
                {data.devices.map((device) => (
                  <Box
                    as="tr"
                    key={device.serialNumber}
                    borderTop="1px solid"
                    borderColor={themeColors.table.rowBorder}
                    cursor="pointer"
                    _hover={{ bg: themeColors.brand.accentLight }}
                    onClick={() => navigate(`/devices?serial=${encodeURIComponent(device.serialNumber)}`)}
                  >
                    <Box as="td" px={3} py={3}><Text fontSize="12px" fontWeight="700">{device.name}</Text><Text fontSize="10px" color={themeColors.text.muted}>{device.description}</Text></Box>
                    <Box as="td" px={3} py={3} fontSize="11px" fontFamily="mono">{device.serialNumber}</Box>
                    <Box as="td" px={3} py={3} fontSize="11px">{device.venueName || device.entityName || 'Direct Property assignment'}</Box>
                    <Box as="td" px={3} py={3} fontSize="11px">{device.deviceType || device.deviceGroup || '—'}</Box>
                    <Box as="td" px={3} py={3}><AvailabilityDot state={device.availability} /></Box>
                    <Box as="td" px={3} py={3} fontSize="11px">{device.ipAddress || '—'}</Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
        {data && (
          <Flex px={4} py={3} borderTop="1px solid" borderColor={themeColors.panel.divider} justify="space-between" align="center">
            <Text fontSize="11px" color={themeColors.text.muted}>{data.totalCount.toLocaleString()} matching Device(s)</Text>
            <Flex align="center" gap={2}>
              <Button
                size="xs"
                variant="outline"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Text fontSize="11px">Page {pageIndex + 1} of {data.totalPages}</Text>
              <Button
                size="xs"
                variant="outline"
                disabled={pageIndex + 1 >= data.totalPages}
                onClick={() => setPageIndex((p) => p + 1)}
              >
                Next
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>
    </VStack>
  );
};
