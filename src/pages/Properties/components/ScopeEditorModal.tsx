import React, { useMemo, useState } from 'react';
import { Box, Button, Flex, Input, SimpleGrid, Spinner, Text, Textarea, VStack, chakra } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { toaster } from '@/components/ui/toaster';
import { parseApiError, ROOT_PROPERTY_ID, useAvailableVenueLocations, useCreateScope, useScopeDetails, useScopeLocations, type PropertyScopeType, type PropertyTreeNode } from '@/api';
import { themeColors } from '@/theme';
import { getPropertyLifecycleKind } from '../propertyUtils';

interface Props {
  selected?: PropertyTreeNode;
  initialType?: PropertyScopeType;
  contextual?: boolean;
  onClose: () => void;
  onCreated: (type: PropertyScopeType, id: string) => void;
}

export const ScopeEditorModal: React.FC<Props> = ({ selected, initialType, contextual = false, onClose, onCreated }) => {
  const create = useCreateScope();
  const [type, setType] = useState<PropertyScopeType>(initialType || (selected?.type === 'venue' ? 'venue' : 'property'));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [sourceIP, setSourceIP] = useState('');
  const [rrm, setRrm] = useState('inherit');
  const [rcOnly, setRcOnly] = useState('inherit');
  const [firmwareUpgrade, setFirmwareUpgrade] = useState('inherit');
  const [location, setLocation] = useState('');
  const { data: parentDetails } = useScopeDetails(selected?.type, selected?.id);
  const { data: propertyLocations = [] } = useScopeLocations(selected?.type === 'property' ? parentDetails?.locations || [] : []);
  const { data: venueLocations = [] } = useAvailableVenueLocations(selected?.type === 'venue' ? selected.id : undefined);
  const locationOptions = selected?.type === 'property' ? propertyLocations.map((item) => ({ id: item.id, name: item.name || item.buildingName || item.id })) : venueLocations.map((item) => ({ id: item.uuid, name: item.name }));
  const allowedTypes = useMemo<PropertyScopeType[]>(() => {
    if (!selected) return [];
    if (selected.type === 'venue') return ['venue'];
    if (selected.id === ROOT_PROPERTY_ID) return ['property'];
    if (!parentDetails) return [];
    return getPropertyLifecycleKind(selected.id, parentDetails) === 'operator-linked'
      ? ['property', 'venue']
      : ['venue'];
  }, [selected, parentDetails]);
  const selectedParent = selected;
  const effectiveType = allowedTypes.includes(type) ? type : (allowedTypes[0] || type);
  const creationReady = Boolean(selectedParent && allowedTypes.includes(effectiveType));

  const submit = async () => {
    if (!name.trim() || !selectedParent || !allowedTypes.includes(effectiveType)) return;
    try {
      const result = await create.mutateAsync({
        type: effectiveType,
        name: name.trim(),
        description: description.trim(),
        parentProperty: effectiveType === 'property' ? selectedParent.id : undefined,
        parentOperatorId: effectiveType === 'property' ? parentDetails?.operatorId : undefined,
        property: effectiveType === 'venue' && selectedParent.type === 'property' ? selectedParent.id : undefined,
        parentVenue: effectiveType === 'venue' && selectedParent.type === 'venue' ? selectedParent.id : undefined,
        note: note.trim(),
        sourceIP: sourceIP.split(',').map((value) => value.trim()).filter(Boolean),
        deviceRules: { rrm, rcOnly, firmwareUpgrade },
        location: effectiveType === 'venue' ? location : undefined,
      });
      toaster.create({ title: `${effectiveType === 'property' ? 'Property' : 'Venue'} created`, type: 'success' });
      onCreated(effectiveType, result.id);
    } catch (error) {
      toaster.create({
        title: `Could not create ${effectiveType === 'property' ? 'Property' : 'Venue'}`,
        description: parseApiError(error, 'The selected parent may not support this hierarchy operation'),
        type: 'error',
      });
    }
  };

  return (
    <Flex position="fixed" inset={0} zIndex={3000} bg={themeColors.modal.backdrop} align="center" justify="center" p={4} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Box w="100%" maxW="900px" maxH="92vh" overflowY="auto" bg="#fff" borderRadius="12px" border="1px solid" borderColor={themeColors.modal.border} boxShadow="0 24px 80px rgba(0,0,0,.24)">
        <Flex px={6} py={4} justify="space-between" align="center" borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#eef8ff">
          <Box><Text fontSize="20px" fontWeight="750">Create {contextual ? 'Sub-' : ''}{effectiveType === 'property' ? 'Property' : 'Venue'}</Text><Text fontSize="11px" color={themeColors.text.muted}>Create a managed scope in the authorized OWPROV hierarchy.</Text></Box>
          <Flex gap={2}><Button aria-label="Save" w="34px" h="34px" minW="34px" p={0} bg="#8ebcf0" color="#fff" disabled={!name.trim() || !creationReady || create.isPending} onClick={submit}>{create.isPending ? <Spinner size="xs" /> : <Icon name="save" size={16} />}</Button><Button aria-label="Close" w="34px" h="34px" minW="34px" p={0} variant="outline" onClick={onClose}><Icon name="x" size={16} /></Button></Flex>
        </Flex>
        <VStack p={6} align="stretch" gap={5}>
          <Text fontSize="16px" fontWeight="700">Details</Text>
          {!contextual && <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}><Box><Text fontSize="11px" fontWeight="700" mb={1}>Type *</Text><chakra.select value={effectiveType} onChange={(e) => setType(e.target.value as PropertyScopeType)} disabled={allowedTypes.length <= 1} h="40px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px">{allowedTypes.map((allowedType) => <option key={allowedType} value={allowedType}>{allowedType === 'property' ? 'Property' : 'Venue'}</option>)}</chakra.select></Box><Box><Text fontSize="11px" fontWeight="700" mb={1}>Parent {effectiveType === 'property' ? 'Property' : 'scope'} *</Text><Input value={selectedParent ? `${selectedParent.name} (${selectedParent.type === 'property' ? 'Property' : 'Venue'})` : ''} disabled /></Box></SimpleGrid>}
          {effectiveType === 'property' ? <>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>Name *</Text><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={128} autoFocus /></Box>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>Description</Text><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></Box>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>Note</Text><Input value={note} onChange={(e) => setNote(e.target.value)} /></Box>
            <Box borderTop="1px solid" borderColor={themeColors.panel.divider} pt={5}><Text fontSize="16px" fontWeight="700" mb={4}>Behaviors</Text><SimpleGrid columns={{ base: 1, md: 4 }} gap={4}><Box><Text fontSize="11px" fontWeight="700" mb={1}>IP Detection</Text><Input value={sourceIP} onChange={(e) => setSourceIP(e.target.value)} placeholder="CIDRs, comma-separated" /></Box><Box><Text fontSize="11px" fontWeight="700" mb={1}>RRM</Text><chakra.select value={rrm} onChange={(e) => setRrm(e.target.value)} h="40px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px"><option value="inherit">Inherit</option><option value="no">No</option></chakra.select></Box><Box><Text fontSize="11px" fontWeight="700" mb={1}>Release Candidates Only</Text><chakra.select value={rcOnly} onChange={(e) => setRcOnly(e.target.value)} h="40px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px"><option value="inherit">Inherit</option><option value="yes">Yes</option><option value="no">No</option></chakra.select></Box><Box><Text fontSize="11px" fontWeight="700" mb={1}>Firmware Upgrade</Text><chakra.select value={firmwareUpgrade} onChange={(e) => setFirmwareUpgrade(e.target.value)} h="40px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px"><option value="inherit">Inherit</option><option value="yes">Yes</option><option value="no">No</option></chakra.select></Box></SimpleGrid></Box>
          </> : <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>Name *</Text><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={128} autoFocus /></Box>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>Release Candidates Only</Text><chakra.select value={rcOnly} onChange={(e) => setRcOnly(e.target.value)} h="40px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px"><option value="inherit">Inherit</option><option value="yes">Yes</option><option value="no">No</option></chakra.select></Box>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>RRM</Text><chakra.select value={rrm} onChange={(e) => setRrm(e.target.value)} h="40px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px"><option value="inherit">Inherit</option><option value="no">No</option></chakra.select></Box>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>Firmware Upgrade</Text><chakra.select value={firmwareUpgrade} onChange={(e) => setFirmwareUpgrade(e.target.value)} h="40px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px"><option value="inherit">Inherit</option><option value="yes">Yes</option><option value="no">No</option></chakra.select></Box>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>Description</Text><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></Box>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>Note</Text><Input value={note} onChange={(e) => setNote(e.target.value)} /></Box>
            <Box gridColumn={{ md: 'span 2' }}><Text fontSize="11px" fontWeight="700" mb={1}>Location</Text><chakra.select value={location} onChange={(e) => setLocation(e.target.value)} h="40px" w="100%" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px"><option value="">None</option>{locationOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</chakra.select></Box>
          </SimpleGrid>}
        </VStack>
      </Box>
    </Flex>
  );
};
