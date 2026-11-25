import React, { useMemo, useState } from 'react';
import { Box, Button, Flex, Input, SimpleGrid, Spinner, Text, VStack, chakra } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/layout/Header';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { usePropertyMap, usePropertyPortfolio, usePropertyTree, useScopeDetails, useScopedDevices, useDeviceEventsStream, type PropertyMapDevice, type PropertyMapNode, type PropertyScopeType, type PropertyTreeNode, type ScopeSummary } from '@/api';
import { DeviceHealthBadge } from '@/pages/Devices/components/common/DeviceHealthBadge';
import { AvailabilityDot } from './ScopeStatus';
import { PropertyMetricCard } from './PropertyMetricCard';
import { ScopeEditorModal } from './ScopeEditorModal';
import { PropertyTreeMap } from './PropertyTreeMap';
import { findTreeNode, formatTimestamp } from '../propertyUtils';

const countScopes = (nodes: PropertyTreeNode[], parentType = ''): { properties: number; venues: number; nested: number } => {
  let properties = 0;
  let venues = 0;
  let nested = 0;
  for (const node of nodes) {
    if (node.type === 'property') properties++;
    else {
      venues++;
      if (parentType === 'venue') nested++;
    }
    const c = countScopes(node.children || [], node.type);
    properties += c.properties;
    venues += c.venues;
    nested += c.nested;
  }
  return { properties, venues, nested };
};

const mergeTreeWithSummaries = (tree: PropertyTreeNode[], portfolioTree?: PropertyTreeNode[]): PropertyTreeNode[] => {
  if (!portfolioTree || portfolioTree.length === 0) return tree;
  const summaryMap = new Map<string, ScopeSummary>();
  const collect = (nodes: PropertyTreeNode[]) => {
    for (const node of nodes) {
      if (node.summary) {
        summaryMap.set(`${node.type}-${node.id}`, node.summary);
      }
      collect(node.children || []);
    }
  };
  collect(portfolioTree);

  const apply = (nodes: PropertyTreeNode[]): PropertyTreeNode[] =>
    nodes.map((node) => ({
      ...node,
      summary: summaryMap.get(`${node.type}-${node.id}`) || node.summary,
      children: apply(node.children || []),
    }));

  return apply(tree);
};

interface AttentionDevice extends PropertyMapDevice {
  scopeId: string;
  scopeName: string;
  scopeType: PropertyScopeType;
}

const deviceNeedsAttention = (device: PropertyMapDevice) =>
  device.availability === 'offline' || typeof device.sanity !== 'number' || device.sanity < 90;

const buildAttentionIndex = (nodes: PropertyMapNode[]) => {
  const byScope = new Map<string, AttentionDevice[]>();
  const visit = (node: PropertyMapNode): AttentionDevice[] => {
    const direct = node.devices.filter(deviceNeedsAttention).map((device) => ({
      ...device,
      scopeId: node.id,
      scopeName: node.name,
      scopeType: node.type,
    }));
    const affected = [...direct, ...node.children.flatMap(visit)];
    byScope.set(`${node.type}-${node.id}`, affected);
    return affected;
  };
  nodes.forEach(visit);
  return byScope;
};

const filterNodes = (nodes: PropertyTreeNode[], query: string, type: string): PropertyTreeNode[] => nodes.flatMap((node) => {
  const children = filterNodes(node.children || [], query, type);
  const matches = (!query || `${node.name} ${node.id}`.toLowerCase().includes(query))
    && (!type || node.type === type);
  return matches || children.length ? [{ ...node, children }] : [];
});

const PortfolioRow: React.FC<{
  node: PropertyTreeNode;
  depth: number;
  selected?: PropertyTreeNode;
  attentionByScope: Map<string, AttentionDevice[]>;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (node: PropertyTreeNode) => void;
  onOpen: (node: PropertyTreeNode) => void;
}> = ({ node, depth, selected, attentionByScope, expanded, onToggle, onSelect, onOpen }) => {
  const key = `${node.type}-${node.id}`;
  const open = !expanded.has(key);
  const summary = node.summary;
  const attentionCount = attentionByScope.get(key)?.length || 0;
  return (
    <>
      <Box as="tr" bg={selected?.id === node.id && selected.type === node.type ? '#eaf3ff' : '#fff'} borderTop="1px solid" borderColor={themeColors.table.rowBorder} _hover={{ bg: '#f8fbff' }} onClick={() => onSelect(node)} cursor="pointer">
        <Box as="td" px={3} py="10px">
          <Flex align="center" gap={2} pl={`${depth * 28}px`}>
            <Button aria-label={open ? 'Collapse' : 'Expand'} visibility={node.children.length ? 'visible' : 'hidden'} size="xs" minW="20px" w="20px" h="20px" p={0} bg="transparent" color={themeColors.text.primary} _hover={{ bg: '#e2e8f0', color: '#0f172a' }} onClick={(event) => { event.stopPropagation(); onToggle(key); }}>
              <Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} />
            </Button>
            <Box color={node.type === 'property' ? '#2563eb' : depth > 1 ? '#16a34a' : '#0d9488'}><Icon name={node.type === 'property' ? 'building' : 'landmark'} size={21} /></Box>
            <Box><Flex align="center" gap={2}><Text fontSize="12px" fontWeight="700">{node.name}</Text>{attentionCount > 0 && <Text as="span" px={2} py={0.5} borderRadius="full" bg="#fff7ed" color="#c2410c" border="1px solid #fdba74" fontSize="9px" fontWeight="700">Needs attention · {attentionCount}</Text>}</Flex><Text fontSize="10px" color={themeColors.text.muted}>{node.type === 'property' ? 'Property' : depth > 1 ? 'Nested Venue' : 'Venue'} · {node.id}</Text></Box>
          </Flex>
        </Box>
        <Box as="td" px={3} py={3} fontSize="12px" fontWeight="600">{summary?.totalDevices ?? '—'}</Box>
        <Box as="td" px={3} py={3} fontSize="12px">{summary?.onlineDevices ?? '—'}</Box>
        <Box as="td" px={3} py={3} fontSize="12px">{summary?.offlineDevices ?? '—'}</Box>
        <Box as="td" px={3} py={3} fontSize="12px">{summary?.unknownDevices ?? '—'}</Box>
        <Box as="td" px={3} py={3} textAlign="right"><Button size="xs" bg="transparent" onClick={(event) => { event.stopPropagation(); onOpen(node); }} aria-label={`Open ${node.name}`}><Icon name="more" size={17} /></Button></Box>
      </Box>
      {open && node.children.map((child) => <PortfolioRow key={`${child.type}-${child.id}`} node={child} depth={depth + 1} selected={selected} attentionByScope={attentionByScope} expanded={expanded} onToggle={onToggle} onSelect={onSelect} onOpen={onOpen} />)}
    </>
  );
};

const ALL_DEVICES_WILDCARD = ['*'];

const SelectionPanel: React.FC<{ node: PropertyTreeNode; attentionDevices: AttentionDevice[]; onClose: () => void; onOpen: () => void }> = ({ node, attentionDevices, onClose, onOpen }) => {
  const navigate = useNavigate();
  const { data: details } = useScopeDetails(node.type, node.id);
  const [tab, setTab] = useState<'overview' | 'scopes' | 'devices' | 'details'>('overview');
  const { data: devices, isLoading: devicesLoading, isError: devicesError, refetch: refetchDevices } = useScopedDevices(
    node.type,
    node.id,
    { pageIndex: 0, pageSize: 25 }
  );
  const summary = node.summary;
  const childProperties = node.children.filter((child) => child.type === 'property');
  const childVenues = node.children.filter((child) => child.type === 'venue');
  const tabs: Array<{ id: typeof tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'scopes', label: node.type === 'property' ? `Scopes (${node.children.length})` : `Venues (${node.children.length})` },
    { id: 'devices', label: `Devices (${summary?.totalDevices ?? '—'})` },
    { id: 'details', label: 'Details' },
  ];
  return (
    <Box bg="#fff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="10px" overflow="hidden" position={{ xl: 'sticky' }} top="16px">
      <Flex p={4} gap={3} align="center" borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <Flex w="58px" h="58px" borderRadius="9px" bg="#eaf3ff" color="#2563eb" align="center" justify="center"><Icon name={node.type === 'property' ? 'building' : 'landmark'} size={31} /></Flex>
        <Box flex="1" minW={0}><Text fontSize="18px" fontWeight="750" truncate>{node.name}</Text><Text fontSize="11px" color={themeColors.text.muted}>{node.type === 'property' ? 'Property' : 'Venue'} · {node.id}</Text></Box>
        <Button aria-label="Close details" bg="transparent" size="xs" onClick={onClose}><Icon name="x" size={18} /></Button>
      </Flex>
      <Flex px={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} overflowX="auto">{tabs.map((item) => <Button key={item.id} bg="transparent" border="none" borderRadius={0} borderBottomWidth="3px" borderBottomStyle="solid" borderBottomColor={tab === item.id ? '#2563eb' : 'transparent'} outline="none" boxShadow="none" _focusVisible={{ outline: 'none', boxShadow: 'none' }} color={tab === item.id ? '#2563eb' : themeColors.text.primary} h="42px" px={2} fontSize="10px" onClick={() => setTab(item.id)}>{item.label}</Button>)}</Flex>
      {tab === 'overview' && (
        <>
          <SimpleGrid columns={3} gap={2} p={3}>
            {[['Properties', childProperties.length], ['Venues', childVenues.length], ['Devices', summary?.totalDevices], ['Online', summary?.onlineDevices], ['Offline', summary?.offlineDevices], ['Unknown', summary?.unknownDevices]].map(([label, value]) => (
              <Box key={String(label)} border="1px solid" borderColor={themeColors.panel.border} borderRadius="7px" py={3} textAlign="center">
                <Text fontSize="15px" fontWeight="700">{value ?? '—'}</Text>
                <Text fontSize="9px" color={themeColors.text.muted}>{label}</Text>
              </Box>
            ))}
          </SimpleGrid>
          <Box mx={4} mb={3} p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="7px">
            <Text fontSize="12px" fontWeight="700" mb={2}>Summary</Text>
            <Flex justify="space-between" py={1}><Text fontSize="11px" color={themeColors.text.muted}>Type</Text><Text fontSize="11px">{node.type === 'property' ? 'Property' : 'Venue'}</Text></Flex>
            <Flex justify="space-between" py={1}><Text fontSize="11px" color={themeColors.text.muted}>Online / Offline</Text><Text fontSize="11px">{summary?.onlineDevices ?? '—'} / {summary?.offlineDevices ?? '—'}</Text></Flex>
            <Flex justify="space-between" py={1}><Text fontSize="11px" color={themeColors.text.muted}>Unknown status</Text><Text fontSize="11px">{summary?.unknownDevices ?? '—'}</Text></Flex>
          </Box>
          {attentionDevices.length > 0 && (
            <Box mx={4} mb={3} border="1px solid #fdba74" borderRadius="7px" overflow="hidden">
              <Flex px={3} py={2.5} bg="#fff7ed" justify="space-between" align="center">
                <Text fontSize="12px" fontWeight="700" color="#9a3412">Devices needing attention</Text>
                <Text fontSize="11px" fontWeight="700" color="#c2410c">{attentionDevices.length}</Text>
              </Flex>
              <VStack align="stretch" gap={0} maxH="240px" overflowY="auto">
                {attentionDevices.map((device) => (
                  <Flex key={`${device.scopeType}-${device.scopeId}-${device.serialNumber}`} px={3} py={2.5} borderTop="1px solid #fed7aa" align="center" gap={2} cursor="pointer" _hover={{ bg: '#fffaf5' }} onClick={() => navigate(`/devices?serial=${encodeURIComponent(device.serialNumber)}`)}>
                    <Box flex="1" minW={0}>
                      <Text fontSize="11px" fontWeight="700" truncate>{device.serialNumber}</Text>
                      <Text fontSize="9px" color={themeColors.text.muted} truncate>{device.scopeName} · {device.scopeType === 'property' ? 'Property' : 'Venue'}</Text>
                    </Box>
                    <Flex gap={1.5} align="center" flexShrink={0}>
                      {device.availability === 'offline' && <Text px={2} py={0.5} borderRadius="md" bg="#fef2f2" color="#dc2626" border="1px solid #fee2e2" fontSize="10px" fontWeight="700">Offline</Text>}
                      {device.availability === 'unknown' && <Text px={2} py={0.5} borderRadius="md" bg="#f8fafc" color="#475569" border="1px solid #cbd5e1" fontSize="10px" fontWeight="700">Status unknown</Text>}
                      {typeof device.sanity === 'number' && device.sanity < 90 && <DeviceHealthBadge sanity={device.sanity} connected={device.availability === 'online'} size="sm" />}
                      {typeof device.sanity !== 'number' && <Text px={2} py={0.5} borderRadius="md" bg="#f8fafc" color="#475569" border="1px solid #cbd5e1" fontSize="10px" fontWeight="700">Sanity unavailable</Text>}
                      <Icon name="chevronRight" size={14} color={themeColors.text.muted} />
                    </Flex>
                  </Flex>
                ))}
              </VStack>
            </Box>
          )}
        </>
      )}
      {tab === 'scopes' && (
        <Box p={3}>
          {node.children.length === 0 ? (
            <Text py={10} textAlign="center" fontSize="11px" color={themeColors.text.muted}>No direct child scopes.</Text>
          ) : (
            <VStack align="stretch" gap={1.5}>
              {node.children.map((child) => (
                <Flex
                  key={`${child.type}-${child.id}`}
                  py={2}
                  px={2.5}
                  borderRadius="7px"
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  align="center"
                  gap={2}
                  cursor="pointer"
                  transition="all 0.15s ease"
                  _hover={{ bg: themeColors.brand.accentLight, borderColor: themeColors.brand.primary }}
                  onClick={() => navigate(`/properties/${child.type}/${encodeURIComponent(child.id)}/overview`)}
                >
                  <Icon name={child.type === 'property' ? 'building' : 'landmark'} size={16} />
                  <Box flex="1" minW={0}>
                    <Text fontSize="11px" fontWeight="750" truncate>{child.name}</Text>
                    <Text fontSize="9px" color={themeColors.text.muted} truncate>
                      {child.type === 'property' ? 'Property' : 'Venue'} · {child.summary?.totalDevices ?? '—'} Devices
                    </Text>
                  </Box>
                  <Text fontSize="10px" color={themeColors.text.muted}>{child.summary?.onlineDevices ?? '—'} online · {child.summary?.offlineDevices ?? '—'} offline</Text>
                  <Icon name="chevronRight" size={15} color={themeColors.text.muted} />
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      )}
      {tab === 'devices' && (
        <Box p={3}>
          {devicesLoading ? (
            <Flex py={12} justify="center"><Spinner size="sm" /></Flex>
          ) : devicesError ? (
            <VStack py={10}>
              <Text fontSize="11px" fontWeight="700">Device inventory is unavailable.</Text>
              <Button size="xs" variant="outline" onClick={() => refetchDevices()}>Retry</Button>
            </VStack>
          ) : !devices?.devices.length ? (
            <Box py={10} textAlign="center">
              <Text fontSize="11px" color={themeColors.text.muted}>No Devices in this scope.</Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={1.5}>
              <Text fontSize="10px" color={themeColors.text.muted} mb={1}>
                {devices.devices.length} {devices.devices.length === 1 ? 'device' : 'devices'} in scope · Click to open device
              </Text>
              {devices.devices.map((device) => (
                <Flex
                  key={device.serialNumber}
                  py={2.5}
                  px={3}
                  borderRadius="7px"
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  justify="space-between"
                  align="center"
                  gap={3}
                  cursor="pointer"
                  transition="all 0.15s ease"
                  _hover={{ bg: themeColors.brand.accentLight, borderColor: themeColors.brand.primary }}
                  onClick={() => navigate(`/devices?serial=${encodeURIComponent(device.serialNumber)}`)}
                  role="button"
                  aria-label={`Open device ${device.name || device.serialNumber}`}
                >
                  <Box flex="1" minW={0}>
                    <Flex align="center" gap={2} mb={0.5}>
                      <Text fontSize="12px" fontWeight="700" truncate color={themeColors.text.primary}>
                        {device.name || device.serialNumber}
                      </Text>
                    </Flex>
                    <Text fontSize="10px" color={themeColors.text.muted} truncate>
                      {device.serialNumber} · {device.venueName || device.entityName || 'Direct assignment'}
                    </Text>
                  </Box>
                  <Flex align="center" gap={3} flexShrink={0}>
                    <AvailabilityDot state={device.availability} />
                    <Icon name="chevronRight" size={16} color={themeColors.text.muted} />
                  </Flex>
                </Flex>
              ))}

              <Button
                mt={2}
                w="100%"
                size="xs"
                variant="outline"
                onClick={() => navigate(`/properties/${node.type}/${encodeURIComponent(node.id)}/devices`)}
              >
                Open Scope Devices Tab
              </Button>
            </VStack>
          )}
        </Box>
      )}
      {tab === 'details' && <Box p={4}><Flex justify="space-between" py={1}><Text fontSize="11px" color={themeColors.text.muted}>Type</Text><Text fontSize="11px">{node.type === 'property' ? 'Property' : 'Venue'}</Text></Flex><Flex justify="space-between" py={1}><Text fontSize="11px" color={themeColors.text.muted}>ID</Text><Text fontSize="10px" maxW="65%" textAlign="right" overflowWrap="anywhere">{node.id}</Text></Flex><Flex justify="space-between" py={1}><Text fontSize="11px" color={themeColors.text.muted}>Parent</Text><Text fontSize="10px">{details?.parent || details?.entity || '—'}</Text></Flex><Flex justify="space-between" py={1}><Text fontSize="11px" color={themeColors.text.muted}>Location</Text><Text fontSize="10px">{details?.location || '—'}</Text></Flex><Flex justify="space-between" py={1}><Text fontSize="11px" color={themeColors.text.muted}>Created</Text><Text fontSize="10px">{formatTimestamp(details?.created)}</Text></Flex><Flex justify="space-between" py={1}><Text fontSize="11px" color={themeColors.text.muted}>Last updated</Text><Text fontSize="10px">{formatTimestamp(details?.modified)}</Text></Flex><Box mt={3}><Text fontSize="10px" color={themeColors.text.muted}>Description</Text><Text fontSize="11px" mt={1}>{details?.description || 'Not provided'}</Text></Box></Box>}
      <Box px={4} pb={4}><Button w="100%" bg={themeColors.brand.primary} color="#fff" size="sm" onClick={onOpen}>Open {node.type === 'property' ? 'Property' : 'Venue'}</Button></Box>
    </Box>
  );
};

export const PropertyPortfolio: React.FC = () => {
  const navigate = useNavigate();
  const { data: treeNodes = [], isLoading: treeLoading, isError: treeError, error: treeErrorObj, refetch: refetchTree } = usePropertyTree();
  const { data: portfolio, isLoading: portfolioLoading, isError: portfolioError, refetch: refetchPortfolio } = usePropertyPortfolio(!treeLoading && !treeError);
  const { data: propertyMap } = usePropertyMap(!treeLoading && !treeError);
  // Subscribe to real-time events for all authorized devices in the portfolio
  useDeviceEventsStream(ALL_DEVICES_WILDCARD);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [selected, setSelected] = useState<PropertyTreeNode>();
  const [panelOpen, setPanelOpen] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'map'>('tree');

  // The hierarchy endpoint is the structural source of truth. Portfolio data
  // can enrich matching nodes with operational summaries but must never
  // replace the independently loaded authorized tree.
  const nodes = useMemo(() => mergeTreeWithSummaries(treeNodes, portfolio?.nodes), [treeNodes, portfolio?.nodes]);
  const attentionByScope = useMemo(() => buildAttentionIndex(propertyMap?.nodes || []), [propertyMap?.nodes]);

  const structuralCounts = useMemo(() => countScopes(nodes), [nodes]);
  const currentSelected = selected ? (findTreeNode(nodes, selected.type, selected.id) || nodes[0]) : nodes[0];
  const panelSelection = panelOpen ? currentSelected : undefined;
  const visible = useMemo(() => filterNodes(nodes, query.trim().toLowerCase(), type), [nodes, query, type]);
  const openNode = (node: PropertyTreeNode) => navigate(`/properties/${node.type}/${encodeURIComponent(node.id)}/overview`);

  const handleRefresh = () => {
    refetchTree();
    refetchPortfolio();
  };

  const isInitialLoading = treeLoading && nodes.length === 0;
  const hasFatalError = treeError && nodes.length === 0;

  return <Box>
    <Text fontSize="11px" color={themeColors.text.muted} mb={1}>Properties&nbsp;&nbsp;/&nbsp;&nbsp;All Scopes</Text>
    <Header
      title="Properties"
      subtitle="Explore Properties, Venues, nested Venues, and Devices in a hierarchical view."
      onRefresh={handleRefresh}
      primaryAction={{ label: 'Create', onClick: () => setCreateOpen(true) }}
    />
    {isInitialLoading ? <Flex minH="430px" align="center" justify="center"><Spinner /></Flex> : hasFatalError ? <VStack minH="430px" justify="center"><Icon name="alertTriangle" size={30} /><Text fontWeight="700">Could not load Properties</Text><Text fontSize="11px">{treeErrorObj instanceof Error ? treeErrorObj.message : 'Hierarchy unavailable'}</Text><Button onClick={handleRefresh}>Retry</Button></VStack> : <>
      {portfolioError && nodes.length > 0 && (
        <Flex mb={3} p={3} bg="#fff1f2" border="1px solid" borderColor="#fecdd3" borderRadius="7px" justify="space-between" align="center">
          <Flex gap={2} align="center">
            <Icon name="alertTriangle" size={17} color="#e11d48" />
            <Text fontSize="11px" color="#9f1239">Operational status is temporarily unavailable. Hierarchy remains accessible.</Text>
          </Flex>
          <Button size="xs" variant="outline" onClick={() => refetchPortfolio()}>Retry Status</Button>
        </Flex>
      )}
      {portfolio?.dataQuality?.state === 'partial' && (
        <Flex mb={3} p={3} bg={themeColors.status.pending.bg} border="1px solid" borderColor={themeColors.status.pending.border} borderRadius="7px" gap={2}>
          <Icon name="alertTriangle" size={17} color={themeColors.status.pending.text} />
          <Text fontSize="11px">Some live status batches or inventory records are unavailable. Unknown Devices are not counted as Offline.</Text>
        </Flex>
      )}
      {portfolio?.dataQuality?.state === 'stale' && (
        <Flex mb={3} p={3} bg="#fffbeb" border="1px solid" borderColor="#fde68a" borderRadius="7px" gap={2}>
          <Icon name="alertTriangle" size={17} color="#d97706" />
          <Text fontSize="11px" color="#92400e">
            Operational status was measured as of {formatTimestamp(portfolio.dataQuality.asOf || portfolio.dataQuality.generatedAt)} and is refreshing in background.
          </Text>
        </Flex>
      )}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 7 }} gap={3} mb={4}>
        <PropertyMetricCard label="Properties" value={(portfolio?.propertyCount ?? structuralCounts.properties).toLocaleString()} icon="building" />
        <PropertyMetricCard label="Total Venues" value={(portfolio?.venueCount ?? structuralCounts.venues).toLocaleString()} icon="landmark" tone="#0d9488" />
        <PropertyMetricCard label="Nested Venues" value={(portfolio?.nestedVenueCount ?? structuralCounts.nested).toLocaleString()} icon="layers" tone="#0284c7" />
        <PropertyMetricCard
          label="Total Devices"
          value={portfolio?.summary?.totalDevices != null ? portfolio.summary.totalDevices.toLocaleString() : (portfolioLoading ? '—' : '—')}
          icon="device"
          tone="#4f46e5"
        />
        <PropertyMetricCard label="Online" value={portfolio?.summary?.onlineDevices?.toLocaleString() ?? '—'} icon="wifi" tone="#16a34a" />
        <PropertyMetricCard label="Offline" value={portfolio?.summary?.offlineDevices?.toLocaleString() ?? '—'} icon="power" tone="#dc2626" />
        <PropertyMetricCard label="Unknown" value={portfolio?.summary?.unknownDevices?.toLocaleString() ?? '—'} icon="info" tone="#64748b" />
      </SimpleGrid>
      <Flex gap={2} mb={4} flexWrap="wrap" align="center">
        <Flex flex="1" minW="260px" position="relative" align="center"><Box position="absolute" left="11px"><Icon name="search" size={16} /></Box><Input h="40px" pl="36px" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or ID" bg="#fff" /></Flex>
        <chakra.select value={type} onChange={(event) => setType(event.target.value)} h="40px" px={3} bg="#fff" border="1px solid" borderColor={themeColors.input.border} borderRadius="5px"><option value="">Type: All</option><option value="property">Property</option><option value="venue">Venue</option></chakra.select>
        <Flex ml={{ base: 0, xl: 'auto' }} border="1px solid" borderColor={themeColors.input.border} borderRadius="7px" overflow="hidden" bg="#fff"><Button aria-label="Hierarchy view" minW="46px" h="38px" borderRadius={0} bg={viewMode === 'tree' ? '#1267e5' : '#fff'} color={viewMode === 'tree' ? '#fff' : themeColors.text.primary} onClick={() => setViewMode('tree')}><Icon name="network" size={18} /></Button><Button aria-label="Map view" minW="46px" h="38px" borderRadius={0} bg={viewMode === 'map' ? '#1267e5' : '#fff'} color={viewMode === 'map' ? '#fff' : themeColors.text.primary} onClick={() => setViewMode('map')}><Icon name="globe" size={18} /></Button></Flex>
      </Flex>
      {viewMode === 'tree' ? <SimpleGrid columns={{ base: 1, xl: panelSelection ? 3 : 1 }} gap={4} alignItems="start">
        <Box gridColumn={{ xl: panelSelection ? 'span 2' : 'span 1' }} border="1px solid" borderColor={themeColors.panel.border} borderRadius="10px" overflow="hidden" bg="#fff">
          <Box overflowX="auto"><Box as="table" w="100%" minW="720px" borderCollapse="collapse"><Box as="thead" bg={themeColors.canvas.bg}><Box as="tr">{['Scope / Name', 'Devices', 'Online', 'Offline', 'Unknown', ''].map((label) => <Box as="th" key={label} px={3} py={3} textAlign="left" fontSize="10px" color={themeColors.text.muted}>{label}</Box>)}</Box></Box><Box as="tbody">{visible.map((node) => <PortfolioRow key={`${node.type}-${node.id}`} node={node} depth={0} selected={currentSelected} attentionByScope={attentionByScope} expanded={expanded} onToggle={(key) => setExpanded((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; })} onSelect={(node) => { setSelected(node); setPanelOpen(true); }} onOpen={openNode} />)}</Box></Box></Box>
          {visible.length === 0 && <Text py={12} textAlign="center" fontSize="12px" color={themeColors.text.muted}>No matching scopes.</Text>}
        </Box>
        {panelSelection && <SelectionPanel key={`${panelSelection.type}-${panelSelection.id}`} node={panelSelection} attentionDevices={attentionByScope.get(`${panelSelection.type}-${panelSelection.id}`) || []} onClose={() => setPanelOpen(false)} onOpen={() => openNode(panelSelection)} />}
      </SimpleGrid> : <SimpleGrid columns={{ base: 1, xl: panelSelection ? 3 : 1 }} gap={4} alignItems="start">
        <Box gridColumn={{ xl: panelSelection ? 'span 2' : 'span 1' }} borderRadius="10px" overflow="hidden">
          <PropertyTreeMap
            nodes={nodes}
            selected={currentSelected}
            onSelect={(node) => {
              setSelected(node);
              setPanelOpen(true);
            }}
            onOpen={openNode}
          />
        </Box>
        {panelSelection && <SelectionPanel key={`${panelSelection.type}-${panelSelection.id}-map`} node={panelSelection} attentionDevices={attentionByScope.get(`${panelSelection.type}-${panelSelection.id}`) || []} onClose={() => setPanelOpen(false)} onOpen={() => openNode(panelSelection)} />}
      </SimpleGrid>}
    </>}
    {createOpen && <ScopeEditorModal selected={currentSelected} onClose={() => setCreateOpen(false)} onCreated={(createdType: PropertyScopeType, id: string) => { setCreateOpen(false); navigate(`/properties/${createdType}/${encodeURIComponent(id)}/details`); }} />}
  </Box>;
};
