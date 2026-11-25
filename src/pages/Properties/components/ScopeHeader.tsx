import React from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { ROOT_PROPERTY_ID, useScopeDetails, type PropertyTreeNode } from '@/api';
import { getPropertyLifecycleKind } from '../propertyUtils';

export type PropertyTab = 'overview' | 'scopes' | 'devices' | 'configurations' | 'details';

export const ScopeHeader: React.FC<{ node: PropertyTreeNode; path: PropertyTreeNode[]; activeTab: PropertyTab; onNavigate: (tab: PropertyTab) => void; onBreadcrumb: (node?: PropertyTreeNode) => void; onCreateProperty: () => void; onCreateVenue: () => void; onDelete: () => void; onRefresh: () => void | Promise<void> }> = ({ node, path, activeTab, onNavigate, onBreadcrumb, onCreateProperty, onCreateVenue, onDelete, onRefresh }) => {
  const { data: details } = useScopeDetails(node.type, node.id);
  const lifecycleKind = node.type === 'property' ? getPropertyLifecycleKind(node.id, details) : undefined;
  const propertyClassificationReady = node.type !== 'property' || node.id === ROOT_PROPERTY_ID || Boolean(details);
  const canCreateProperty = propertyClassificationReady && node.type === 'property' && (lifecycleKind === 'root' || lifecycleKind === 'operator-linked');
  const canCreateVenue = node.type === 'venue' || (propertyClassificationReady && lifecycleKind !== 'root');
  const canDelete = node.type === 'venue' || (propertyClassificationReady && lifecycleKind === 'normal');
  const tabs: Array<{ id: PropertyTab; label: string }> = [
    { id: 'overview', label: 'Overview' }, { id: 'scopes', label: node.type === 'property' ? 'Properties & Venues' : 'Nested Venues' },
    { id: 'devices', label: 'Devices' }, { id: 'configurations', label: 'Configuration' }, { id: 'details', label: 'Details' },
  ];
  return <Box mb={5}>
    <Flex align="center" gap={4} mb={2} justify="space-between" flexWrap="wrap">
      <Flex align="center" gap={4}>
      <Flex w="112px" h="70px" borderRadius="9px" bg="linear-gradient(135deg, #dbeafe, #eff6ff)" color="#2563eb" align="center" justify="center" flexShrink={0}><Icon name={node.type === 'property' ? 'building' : 'landmark'} size={43} /></Flex>
      <Box minW={0}>
        <Flex gap={1} align="center" mb={1} flexWrap="wrap"><Button h="20px" p={0} bg="transparent" fontSize="10px" color={themeColors.text.muted} onClick={() => onBreadcrumb()}>Properties</Button>{path.slice(0, -1).map((entry) => <React.Fragment key={`${entry.type}-${entry.id}`}><Text fontSize="10px">/</Text><Button h="20px" p={0} bg="transparent" fontSize="10px" color={themeColors.text.muted} onClick={() => onBreadcrumb(entry)}>{entry.name}</Button></React.Fragment>)}</Flex>
        <Text fontSize={{ base: '24px', md: '30px' }} lineHeight="1.1" fontWeight="750" color={themeColors.text.title}>{node.name}</Text>
        <Text fontSize="11px" color={themeColors.text.secondary} mt={1}>{node.type === 'property' ? 'Property' : 'Venue'} &nbsp;·&nbsp; {node.id}{details?.location ? ` · Location ${details.location}` : ''}</Text>
      </Box>
      </Flex>
      <Flex gap={2} align="center">{canDelete && <Button aria-label={`Delete ${node.name}`} minW="36px" w="36px" h="36px" p={0} bg="#e9344f" color="#fff" onClick={onDelete}><Icon name="trash" size={16} /></Button>}{canCreateProperty && <Button h="36px" bg="#c2188b" color="#fff" onClick={onCreateProperty}><Icon name="plus" size={15} /> Property</Button>}{canCreateVenue && <Button h="36px" bg="#8246d8" color="#fff" onClick={onCreateVenue}><Icon name="plus" size={15} /> Venue</Button>}<Button aria-label="Refresh scope" minW="36px" w="36px" h="36px" p={0} variant="outline" onClick={onRefresh}><Icon name="refresh" size={16} /></Button></Flex>
    </Flex>
    <Flex borderBottom="1px solid" borderColor={themeColors.panel.divider} gap={{ base: 1, md: 5 }} overflowX="auto">{tabs.map((tab) => <Button key={tab.id} h="44px" px={3} bg="transparent" border="none" borderRadius={0} borderBottomWidth="3px" borderBottomStyle="solid" borderBottomColor={activeTab === tab.id ? '#2563eb' : 'transparent'} outline="none" boxShadow="none" _focusVisible={{ outline: 'none', boxShadow: 'none' }} color={activeTab === tab.id ? '#2563eb' : themeColors.text.primary} fontSize="12px" fontWeight="650" onClick={() => onNavigate(tab.id)}>{tab.label}</Button>)}</Flex>
  </Box>;
};
