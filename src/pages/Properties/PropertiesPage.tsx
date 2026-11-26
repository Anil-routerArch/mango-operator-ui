import React, { useMemo, useState } from 'react';
import { Button, Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useDeleteScope, usePropertyTree, useScopeDetails, type PropertyScopeType, type PropertyTreeNode } from '@/api';
import { toaster } from '@/components/ui/toaster';
import { parseApiError } from '@/api/errors';
import { Icon } from '@/components/icons/Icon';
import { PropertyPortfolio } from './components/PropertyPortfolio';
import { ScopeHeader, type PropertyTab } from './components/ScopeHeader';
import { ScopeOverviewTab } from './components/ScopeOverviewTab';
import { ScopeChildrenTab } from './components/ScopeChildrenTab';
import { ScopeDevicesTab } from './components/ScopeDevicesTab';
import { ScopeConfigurationsTab } from './components/ScopeConfigurationsTab';
import { ScopeDetailsTab } from './components/ScopeDetailsTab';
import { ScopeEditorModal } from './components/ScopeEditorModal';
import { ScopeMonitoringTab } from './components/monitoring/ScopeMonitoringTab';
import { collectScopeIds, findTreeNode, flattenTree, getPropertyLifecycleKind } from './propertyUtils';

const findPath = (nodes: PropertyTreeNode[], type?: PropertyScopeType, id?: string, path: PropertyTreeNode[] = []): PropertyTreeNode[] => {
  for (const node of nodes) {
    const current = [...path, node];
    if (node.type === type && node.id === id) return current;
    const found = findPath(node.children || [], type, id, current);
    if (found.length) return found;
  }
  return [];
};

const validTabs: PropertyTab[] = ['overview', 'scopes', 'devices', 'configurations', 'details', 'monitoring'];

export const PropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams<{ scopeType?: string; scopeId?: string; tab?: string }>();
  const scopeType = params.scopeType === 'venue' ? 'venue' : params.scopeType === 'property' ? 'property' : undefined;
  const scopeId = params.scopeId;
  const activeTab: PropertyTab = validTabs.includes(params.tab as PropertyTab) ? params.tab as PropertyTab : 'overview';
  const { data: nodes = [], isLoading, isError, refetch } = usePropertyTree();
  const { data: selectedDetails } = useScopeDetails(scopeType, scopeId);
  const remove = useDeleteScope();
  const [createType, setCreateType] = useState<PropertyScopeType>();
  const selected = useMemo(() => findTreeNode(nodes, scopeType, scopeId), [nodes, scopeType, scopeId]);
  const path = useMemo(() => findPath(nodes, scopeType, scopeId), [nodes, scopeType, scopeId]);
  const venueOptions = useMemo(() => selected
    ? flattenTree([selected]).filter((node) => node.type === 'venue').map((node) => ({ id: node.id, name: node.name }))
    : [], [selected]);

  if (!params.scopeType && !params.scopeId) return <PropertyPortfolio />;
  if (!scopeType || !scopeId) return <Navigate to="/properties" replace />;
  if (!validTabs.includes(params.tab as PropertyTab)) {
    return <Navigate to={`/properties/${scopeType}/${encodeURIComponent(scopeId)}/overview`} replace />;
  }
  if (isLoading) return <Flex minH="430px" align="center" justify="center"><Spinner /></Flex>;
  if (isError || !selected) return <VStack minH="430px" justify="center"><Icon name="alertTriangle" size={30} /><Text fontWeight="700">This scope is not available in your authorized hierarchy.</Text><Flex gap={2}><Button variant="outline" onClick={() => refetch()}>Retry</Button><Button onClick={() => navigate('/properties')}>All Properties</Button></Flex></VStack>;

  const open = (type: PropertyScopeType, id: string, tab: PropertyTab = 'overview') => navigate(`/properties/${type}/${encodeURIComponent(id)}/${tab}`);
  const refreshSelectedScope = async () => {
    const refreshes: Array<Promise<unknown>> = [
      queryClient.invalidateQueries({ queryKey: ['property-tree'] }),
    ];
    if (activeTab === 'overview' || activeTab === 'scopes') {
      refreshes.push(queryClient.invalidateQueries({ queryKey: ['scope-overview', selected.type, selected.id] }));
    } else if (activeTab === 'devices') {
      refreshes.push(queryClient.invalidateQueries({ queryKey: ['scope-devices', selected.type, selected.id] }));
    } else if (activeTab === 'configurations') {
      refreshes.push(queryClient.invalidateQueries({ queryKey: ['scope-configurations'] }));
    } else if (activeTab === 'details') {
      refreshes.push(
        queryClient.invalidateQueries({ queryKey: ['scope-details', selected.type, selected.id] }),
        queryClient.invalidateQueries({ queryKey: ['scope-contacts'] }),
        queryClient.invalidateQueries({ queryKey: ['scope-locations'] }),
      );
      if (selected.type === 'venue') {
        refreshes.push(queryClient.invalidateQueries({ queryKey: ['available-venue-locations', selected.id] }));
      }
    } else if (activeTab === 'monitoring' && selected.type === 'venue') {
      refreshes.push(
        queryClient.invalidateQueries({ queryKey: ['venue-monitoring', selected.id] }),
        queryClient.invalidateQueries({ queryKey: ['venue-monitoring-clients', selected.id] })
      );
    }
    await Promise.all(refreshes);
  };
  const deleteSelected = async () => {
    if (selected.type === 'property' && getPropertyLifecycleKind(selected.id, selectedDetails) !== 'normal') {
      toaster.create({ title: 'This Property cannot be deleted here', description: selectedDetails?.operatorId ? 'Use Operator administration for an Operator-linked Property.' : 'Root cannot be deleted.', type: 'error' });
      return;
    }
    if (!window.confirm(`Delete ${selected.type === 'property' ? 'Property' : 'Venue'} “${selected.name}”? OWPROV will reject deletion while dependencies remain.`)) return;
    try {
      await remove.mutateAsync({ type: selected.type, id: selected.id, operatorId: selectedDetails?.operatorId });
      const parent = path.at(-2);
      toaster.create({ title: `${selected.type === 'property' ? 'Property' : 'Venue'} deleted`, type: 'success' });
      if (parent) open(parent.type, parent.id);
      else navigate('/properties');
    } catch (error) {
      toaster.create({ title: 'Delete failed', description: parseApiError(error, 'OWPROV rejected the deletion'), type: 'error' });
    }
  };
  return <>
    <ScopeHeader node={selected} path={path} activeTab={activeTab} onNavigate={(tab) => open(selected.type, selected.id, tab)} onBreadcrumb={(node) => node ? open(node.type, node.id) : navigate('/properties')} onCreateProperty={() => setCreateType('property')} onCreateVenue={() => setCreateType('venue')} onDelete={deleteSelected} onRefresh={refreshSelectedScope} />
    {activeTab === 'overview' && <ScopeOverviewTab type={selected.type} id={selected.id} onOpenScope={(type, id) => open(type, id)} />}
    {activeTab === 'scopes' && <ScopeChildrenTab type={selected.type} id={selected.id} onOpen={(type, id) => open(type, id)} />}
    {activeTab === 'devices' && <ScopeDevicesTab key={`${selected.type}-${selected.id}`} type={selected.type} id={selected.id} venueOptions={venueOptions} />}
    {activeTab === 'monitoring' && selected.type === 'venue' && <ScopeMonitoringTab key={selected.id} venueId={selected.id} venueName={selected.name} />}
    {activeTab === 'configurations' && <ScopeConfigurationsTab scopeIds={collectScopeIds(selected)} selectedId={selected.id} />}
    {activeTab === 'details' && <ScopeDetailsTab key={`${selected.type}-${selected.id}`} type={selected.type} id={selected.id} ownerPropertyId={[...path].reverse().find((node) => node.type === 'property')?.id || ''} onDeleted={() => navigate('/properties')} />}
    {createType && <ScopeEditorModal selected={selected} initialType={createType} contextual onClose={() => setCreateType(undefined)} onCreated={(type, id) => { setCreateType(undefined); refetch(); open(type, id, 'details'); }} />}
  </>;
};

export default PropertiesPage;
