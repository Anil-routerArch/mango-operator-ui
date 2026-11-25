import React from 'react';
import { Box, Button, Flex, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useScopeOverview, type PropertyScopeType, type ScopeOverview } from '@/api';
import { PropertyMetricCard } from './PropertyMetricCard';
import { formatTimestamp } from '../propertyUtils';

type ChildScope = ScopeOverview['children'][number];

const DeviceStatusCard: React.FC<{ summary: ScopeOverview['summary'] }> = ({ summary }) => {
  const total = summary.totalDevices ?? 0;
  const online = summary.onlineDevices ?? 0;
  const offline = summary.offlineDevices ?? 0;
  const unknown = summary.unknownDevices ?? 0;
  const onlineEnd = total ? (online / total) * 100 : 0;
  const offlineEnd = total ? ((online + offline) / total) * 100 : 0;
  const background = total ? `conic-gradient(#22c55e 0% ${onlineEnd}%, #ef4444 ${onlineEnd}% ${offlineEnd}%, #94a3b8 ${offlineEnd}% 100%)` : '#e2e8f0';
  return <Box bg="#fff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="10px" p={4}><Text fontSize="15px" fontWeight="700" mb={2}>Device Availability</Text><Flex align="center" justify="space-around" minH="190px"><Flex w="150px" h="150px" borderRadius="50%" bg={background} align="center" justify="center"><Flex w="96px" h="96px" bg="#fff" borderRadius="50%" align="center" justify="center" direction="column"><Text fontSize="24px" fontWeight="700">{total}</Text><Text fontSize="10px">Devices</Text></Flex></Flex><VStack align="stretch" gap={3}>{[['Online', online, '#22c55e'], ['Offline', offline, '#ef4444'], ['Unknown', unknown, '#94a3b8']].map(([label, value, color]) => <Flex key={String(label)} align="center" gap={2}><Box w="9px" h="9px" borderRadius="50%" bg={String(color)} /><Text fontSize="11px" minW="55px">{String(label)}</Text><Text fontSize="12px" fontWeight="700">{String(value)}</Text></Flex>)}</VStack></Flex></Box>;
};

const BreakdownTable: React.FC<{ title: string; emptyText: string; nameHeader: string; children: ChildScope[]; onOpen: (type: PropertyScopeType, id: string) => void }> = ({ title, emptyText, nameHeader, children, onOpen }) => <Box bg="#fff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="10px" overflow="hidden"><Flex px={4} py={3}><Text fontSize="15px" fontWeight="700">{title}</Text></Flex>{children.length === 0 ? <Text py={10} textAlign="center" fontSize="11px" color={themeColors.text.muted}>{emptyText}</Text> : <Box overflowX="auto"><Box as="table" w="100%" minW="480px" borderCollapse="collapse"><Box as="thead" bg={themeColors.canvas.bg}><Box as="tr">{[nameHeader, 'Devices', 'Online', 'Offline', 'Unknown', ''].map((header) => <Box as="th" key={header} px={3} py={2} textAlign="left" fontSize="9px">{header}</Box>)}</Box></Box><Box as="tbody">{children.map((child) => <Box as="tr" key={`${child.type}-${child.id}`} borderTop="1px solid" borderColor={themeColors.table.rowBorder}><Box as="td" px={3} py={2} fontSize="11px" fontWeight="650">{child.name}</Box><Box as="td" px={3} py={2} fontSize="11px">{child.summary.totalDevices ?? '—'}</Box><Box as="td" px={3} py={2} fontSize="11px">{child.summary.onlineDevices ?? '—'}</Box><Box as="td" px={3} py={2} fontSize="11px">{child.summary.offlineDevices ?? '—'}</Box><Box as="td" px={3} py={2} fontSize="11px">{child.summary.unknownDevices ?? '—'}</Box><Box as="td" px={3} py={2}><Button size="xs" bg="transparent" onClick={() => onOpen(child.type, child.id)}><Icon name="chevronRight" size={15} /></Button></Box></Box>)}</Box></Box></Box>}</Box>;

export const ScopeOverviewTab: React.FC<{ type: PropertyScopeType; id: string; onOpenScope: (type: PropertyScopeType, id: string) => void }> = ({ type, id, onOpenScope }) => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, isError, refetch } = useScopeOverview(type, id);
  if (isLoading) return <Flex minH="300px" align="center" justify="center"><Spinner /></Flex>;
  if (isError || !data) return <VStack py={16}><Icon name="alertTriangle" size={28} /><Text fontWeight="700">Could not load this scope overview</Text><Button onClick={() => refetch()}>Retry</Button></VStack>;
  const { summary, dataQuality } = data;
  const childProperties = data.children.filter((child) => child.type === 'property');
  const childVenues = data.children.filter((child) => child.type === 'venue');
  const openDevices = (availability?: string) => navigate(`/properties/${type}/${encodeURIComponent(id)}/devices${availability ? `?availability=${availability}` : ''}`);
  return <VStack align="stretch" gap={4}>
    {dataQuality?.state === 'partial' && <Flex p={3} bg={themeColors.status.pending.bg} border="1px solid" borderColor={themeColors.status.pending.border} borderRadius="7px" gap={2}><Icon name="alertTriangle" size={17} color={themeColors.status.pending.text} /><Text fontSize="11px">Some current Device statuses are unavailable. They are shown as Unknown, not Offline.</Text></Flex>}
    {dataQuality?.state === 'unavailable' && <Flex p={3} bg="#fff1f2" border="1px solid" borderColor="#fecdd3" borderRadius="7px" gap={2}><Icon name="alertTriangle" size={17} color="#e11d48" /><Text fontSize="11px" color="#9f1239">Device availability is unavailable. The authorized hierarchy remains usable.</Text></Flex>}
    {dataQuality?.state === 'stale' && <Flex p={3} bg="#fffbeb" border="1px solid" borderColor="#fde68a" borderRadius="7px" gap={2}><Icon name="alertTriangle" size={17} color="#d97706" /><Text fontSize="11px" color="#92400e">Device status was measured as of {formatTimestamp(dataQuality.asOf || dataQuality.generatedAt)}.</Text></Flex>}
    <Flex justify="flex-end" align="center" gap={2}><Text fontSize="10px" color={themeColors.text.muted}>Current snapshot · {formatTimestamp(dataQuality?.asOf || dataQuality?.generatedAt)}</Text>{isFetching && <Spinner size="xs" />}</Flex>
    <SimpleGrid columns={{ base: 1, sm: 2, xl: type === 'property' ? 6 : 5 }} gap={3}>
      {type === 'property' && <PropertyMetricCard label="Child Properties" value={childProperties.length} icon="building" tone="#2563eb" />}
      <PropertyMetricCard label={type === 'property' ? 'Direct Venues' : 'Nested Venues'} value={childVenues.length} icon="landmark" tone="#0284c7" />
      <PropertyMetricCard label="Total Devices" value={summary.totalDevices?.toLocaleString() ?? '—'} icon="device" tone="#4f46e5" onClick={() => openDevices()} />
      <PropertyMetricCard label="Online" value={summary.onlineDevices?.toLocaleString() ?? '—'} icon="wifi" tone="#16a34a" onClick={() => openDevices('online')} />
      <PropertyMetricCard label="Offline" value={summary.offlineDevices?.toLocaleString() ?? '—'} icon="power" tone="#dc2626" onClick={() => openDevices('offline')} />
      <PropertyMetricCard label="Unknown" value={summary.unknownDevices?.toLocaleString() ?? '—'} icon="info" tone="#64748b" onClick={() => openDevices('unknown')} />
    </SimpleGrid>
    <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}><DeviceStatusCard summary={summary} />{type === 'property' ? <BreakdownTable title="Property Breakdown" emptyText="No directly contained child Properties." nameHeader="Property" children={childProperties} onOpen={onOpenScope} /> : <BreakdownTable title="Nested Venue Breakdown" emptyText="No directly contained Venues." nameHeader="Venue" children={childVenues} onOpen={onOpenScope} />}</SimpleGrid>
    {type === 'property' && <BreakdownTable title="Venue Breakdown" emptyText="No directly contained Venues." nameHeader="Venue" children={childVenues} onOpen={onOpenScope} />}
  </VStack>;
};
