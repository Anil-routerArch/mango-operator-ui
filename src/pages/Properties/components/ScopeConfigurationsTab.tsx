import React from 'react';
import { Box, Button, Flex, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useScopedConfigurations } from '@/api';
import { formatTimestamp } from '../propertyUtils';
import { PropertyMetricCard } from './PropertyMetricCard';

export const ScopeConfigurationsTab: React.FC<{ scopeIds: string[]; selectedId?: string }> = ({ scopeIds, selectedId }) => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useScopedConfigurations(scopeIds);
  const configurations = data?.configurations || [];
  const directAssignments = configurations.filter((config) =>
    selectedId ? (config.entity === selectedId && !config.venue) || config.venue === selectedId : Boolean(config.entity)
  ).length;
  const descendantAssignments = configurations.length - directAssignments;
  return (
    <VStack align="stretch" gap={4}>
    <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
      <Box>
        <Text fontSize="20px" fontWeight="700">Configurations</Text>
        <Text fontSize="11px" color={themeColors.text.muted}>Configuration profiles assigned within this scope and descendant venues.</Text>
      </Box>
      <Button size="sm" bg={themeColors.brand.primary} color="#fff" onClick={() => navigate('/configurations')}>
        <Icon name="plus" size={14} /> Create Configuration
      </Button>
    </Flex>
    {!isLoading && !isError && (
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3}>
        <PropertyMetricCard label="Loaded Configurations" value={configurations.length} icon="layers" tone="#0284c7" helper={data?.complete ? 'Complete authorized list' : 'Partial authorized list'} />
        <PropertyMetricCard label="Direct Assignments" value={directAssignments} icon="building" tone="#2563eb" />
        <PropertyMetricCard label="Descendant Assignments" value={descendantAssignments} icon="landmark" tone="#0d9488" helper="Effective at descendant venues only" />
      </SimpleGrid>
    )}
    {!isLoading && !isError && data && !data.complete && (
      <Flex p={3} bg={themeColors.status.pending.bg} border="1px solid" borderColor={themeColors.status.pending.border} borderRadius="7px" gap={2}>
        <Icon name="alertTriangle" size={17} color={themeColors.status.pending.text} />
        <Box>
          <Text fontSize="11px" fontWeight="650">The authorized Configuration list is incomplete.</Text>
          <Text fontSize="10px">Loaded {data.retrievedCount.toLocaleString()} records from OWPROV. Counts and an empty result are not authoritative until every page is retrieved.</Text>
        </Box>
      </Flex>
    )}
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#fff" overflow="hidden">
      <Flex px={4} py={3} justify="space-between" align="center" borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <Box>
          <Text fontSize="14px" fontWeight="700">Scoped Configurations</Text>
          <Text fontSize="10px" color={themeColors.text.muted}>
            Descendant assignments affect specific child venues and are not effective at the parent scope. Version and lifecycle fields are omitted because OWPROV does not provide authoritative values.
          </Text>
        </Box>
        <Button size="sm" variant="outline" onClick={() => navigate('/configurations')}>Open manager</Button>
      </Flex>
      {isLoading ? <Flex minH="240px" align="center" justify="center"><Spinner /></Flex> : isError ? <VStack py={12}><Text>Could not load Configurations.</Text><Button size="sm" onClick={() => refetch()}>Retry</Button></VStack> : configurations.length === 0 ? <VStack py={12}><Icon name="file" size={28} color={themeColors.text.muted} /><Text fontWeight="700">{data?.complete ? 'No scoped Configurations' : 'No matching Configurations loaded yet'}</Text><Text fontSize="12px" color={themeColors.text.muted}>{data?.complete ? 'Create or assign a Configuration in the Configuration manager.' : 'The OWPROV list is partial, so this is not an authoritative empty result.'}</Text></VStack> : (
        <Box overflowX="auto">
          <Box as="table" w="100%" minW="720px" borderCollapse="collapse">
            <Box as="thead" bg={themeColors.canvas.bg}>
              <Box as="tr">
                {['Name', 'Assignment', 'Scope Target', 'Device group', 'Modified', ''].map((h) => (
                  <Box as="th" key={h} px={3} py={2} textAlign="left" fontSize="10px" color={themeColors.text.muted}>{h}</Box>
                ))}
              </Box>
            </Box>
            <Box as="tbody">
              {configurations.map((config) => {
                const isDirect = selectedId
                  ? (config.entity === selectedId && !config.venue) || config.venue === selectedId
                  : Boolean(config.entity);
                return (
                  <Box as="tr" key={config.id} borderTop="1px solid" borderColor={themeColors.table.rowBorder}>
                    <Box as="td" px={3} py={3} fontSize="12px" fontWeight="700">{config.name || 'Unnamed Configuration'}</Box>
                    <Box as="td" px={3} py={3} fontSize="11px">
                      <Box
                        as="span"
                        px={2}
                        py="2px"
                        borderRadius="4px"
                        fontSize="10px"
                        fontWeight="650"
                        bg={isDirect ? '#dbeafe' : '#f1f5f9'}
                        color={isDirect ? '#1e40af' : '#475569'}
                      >
                        {isDirect ? 'Direct' : 'Descendant'}
                      </Box>
                    </Box>
                    <Box as="td" px={3} py={3} fontSize="11px">{config.venue ? 'Venue' : 'Property'}</Box>
                    <Box as="td" px={3} py={3} fontSize="11px">{config.deviceGroup || '—'}</Box>
                    <Box as="td" px={3} py={3} fontSize="11px">{formatTimestamp(config.modified)}</Box>
                    <Box as="td" px={3} py={3} textAlign="right">
                      <Button size="xs" variant="outline" onClick={() => navigate('/configurations')}>Manage</Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Box></VStack>
  );
};
