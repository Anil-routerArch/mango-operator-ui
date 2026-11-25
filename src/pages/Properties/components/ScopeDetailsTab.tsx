import React, { useState } from 'react';
import { Box, Button, Flex, Input, SimpleGrid, Spinner, Text, Textarea, VStack, chakra } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import { parseApiError } from '@/api/errors';
import { useAvailableVenueLocations, useDeleteScope, useScopeContacts, useScopeDetails, useScopeLocations, useUpdateScope, type ContactDetails, type LocationDetails, type PropertyScopeType } from '@/api';
import { formatTimestamp } from '../propertyUtils';
import { ContactEditorModal } from './ContactEditorModal';
import { LocationEditorModal } from './LocationEditorModal';
import { getPropertyLifecycleKind } from '../propertyUtils';

const DetailValue: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box>
    <Text fontSize="10px" fontWeight="700" color={themeColors.text.muted} textTransform="uppercase" letterSpacing="0.04em">{label}</Text>
    <Text fontSize="12px" mt={1} color={themeColors.text.primary} overflowWrap="anywhere">{children || '—'}</Text>
  </Box>
);

export const ScopeDetailsTab: React.FC<{
  type: PropertyScopeType;
  id: string;
  ownerPropertyId: string;
  onDeleted: () => void;
}> = ({ type, id, ownerPropertyId, onDeleted }) => {
  const { data, isLoading, isError, refetch } = useScopeDetails(type, id);
  const contactIds = data?.contacts || [];
  const locationIds = type === 'property' ? (data?.locations || []) : (data?.location ? [data.location] : []);
  const { data: contacts = [], isError: contactsError } = useScopeContacts(contactIds);
  const { data: locations = [], isError: locationsError } = useScopeLocations(locationIds);
  const { data: availableVenueLocations = [] } = useAvailableVenueLocations(type === 'venue' ? id : undefined);
  const update = useUpdateScope();
  const remove = useDeleteScope();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rrm, setRrm] = useState('inherit');
  const [rcOnly, setRcOnly] = useState('inherit');
  const [firmwareUpgrade, setFirmwareUpgrade] = useState('inherit');
  const [sourceIP, setSourceIP] = useState('');
  const [contactEditor, setContactEditor] = useState<ContactDetails | null | undefined>();
  const [locationEditor, setLocationEditor] = useState<LocationDetails | null | undefined>();
  const [contactEditorOpen, setContactEditorOpen] = useState(false);
  const [locationEditorOpen, setLocationEditorOpen] = useState(false);

  if (isLoading) return <Flex minH="300px" align="center" justify="center"><Spinner /></Flex>;
  if (isError || !data) return <VStack py={14}><Text fontWeight="700">Could not load details</Text><Button onClick={() => refetch()}>Retry</Button></VStack>;

  const effectiveOwnerPropertyId = type === 'property'
    ? id
    : ownerPropertyId || data.entity || data.extendedInfo?.entity?.id || '';
  const propertyLifecycleKind = type === 'property' ? getPropertyLifecycleKind(id, data) : undefined;
  const canDelete = type === 'venue' || propertyLifecycleKind === 'normal';

  const startEditing = () => {
    setName(data.name || '');
    setDescription(data.description || '');
    setRrm(data.deviceRules?.rrm || 'inherit');
    setRcOnly(data.deviceRules?.rcOnly || 'inherit');
    setFirmwareUpgrade(data.deviceRules?.firmwareUpgrade || 'inherit');
    setSourceIP((data.sourceIP || []).join(', '));
    setEditing(true);
  };

  const save = async () => {
    if (!name.trim()) return;
    try {
      await update.mutateAsync({
        type,
        id,
        changes: {
          name: name.trim(),
          description: description.trim(),
          sourceIP: sourceIP.split(',').map((value) => value.trim()).filter(Boolean),
          // Preserve OWPROV fields this form does not own. The backend treats
          // deviceRules as a composite object, so replacing it with only the
          // three visible controls would silently drop vendor extensions.
          deviceRules: { ...(data.deviceRules || {}), rrm, rcOnly, firmwareUpgrade },
        },
      });
      setEditing(false);
      toaster.create({ title: `${type === 'property' ? 'Property' : 'Venue'} updated`, type: 'success' });
    } catch (error) {
      toaster.create({ title: 'Update failed', description: parseApiError(error, 'Could not update this scope'), type: 'error' });
    }
  };

  const deleteScope = async () => {
    const label = type === 'property' ? 'Property' : 'Venue';
    if (!canDelete) {
      toaster.create({ title: `This ${label} cannot be deleted here`, description: propertyLifecycleKind === 'operator-linked' ? 'Use Operator administration for an Operator-linked Property.' : 'Root cannot be deleted.', type: 'error' });
      return;
    }
    if (!window.confirm(`Delete ${label} “${data.name}”? The backend will reject deletion while dependencies remain.`)) return;
    try {
      await remove.mutateAsync({ type, id, operatorId: data.operatorId });
      toaster.create({ title: `${label} deleted`, type: 'success' });
      onDeleted();
    } catch (error) {
      toaster.create({ title: `Could not delete ${label}`, description: parseApiError(error, 'Remove child scopes and assigned Devices first'), type: 'error' });
    }
  };

  const changeVenueLocation = async (locationId: string) => {
    if (locationId === '__new__') {
      setLocationEditor(null);
      setLocationEditorOpen(true);
      return;
    }
    try {
      await update.mutateAsync({ type: 'venue', id, changes: { location: locationId } });
      toaster.create({ title: locationId ? 'Venue Location updated' : 'Venue Location cleared', type: 'success' });
    } catch (error) {
      toaster.create({ title: 'Could not update Venue Location', description: parseApiError(error, 'OWPROV rejected the Location assignment'), type: 'error' });
    }
  };

  const venueLocationOptions = [...availableVenueLocations];
  if (data.location && locations[0] && !venueLocationOptions.some((location) => location.uuid === data.location)) {
    venueLocationOptions.push({ uuid: data.location, name: locations[0].name || locations[0].buildingName || data.location });
  }

  return (
    <VStack align="stretch" gap={4}>
      <Flex justify="flex-end" gap={2}>
        {editing ? (
          <>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" bg={themeColors.brand.primary} color="#fff" disabled={!name.trim() || update.isPending} onClick={save}>
              {update.isPending ? <Spinner size="xs" /> : 'Save changes'}
            </Button>
          </>
        ) : (
          <>
            {type === 'property' && <Button variant="outline" size="sm" onClick={startEditing}><Icon name="edit" size={14} /> Edit</Button>}
            {canDelete && <Button variant="outline" size="sm" color={themeColors.status.error.text} onClick={deleteScope} disabled={remove.isPending}><Icon name="trash" size={14} /> Delete</Button>}
          </>
        )}
      </Flex>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
      <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#fff" overflow="hidden">
        <Flex px={4} py={3} bg={type === 'venue' ? '#eef8ff' : '#fff'} justify="space-between" align="center" borderBottom="1px solid" borderColor={themeColors.panel.divider}><Text fontSize="15px" fontWeight="700">{type === 'venue' ? 'Details' : 'Basic Information'}</Text>{type === 'venue' && !editing && <Button aria-label="Edit Venue details" variant="outline" minW="34px" w="34px" h="34px" p={0} borderRadius="10px" onClick={startEditing}><Icon name="edit" size={15} /></Button>}</Flex>
        {type === 'venue' ? (
          <Box p={4}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} alignItems="start">
              <Box><Text fontSize="11px" fontWeight="600" mb={1}>Name <Text as="span" color="#e11d48">*</Text></Text><Input value={editing ? name : data.name} onChange={(e) => setName(e.target.value)} disabled={!editing} h="38px" borderRadius="11px" /></Box>
              <Box><Text fontSize="11px" fontWeight="600" mb={1}>Location</Text><Flex align="center" gap={2}><chakra.select value={data.location || ''} onChange={(e) => changeVenueLocation(e.target.value)} disabled={!editing || update.isPending} h="38px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="11px" fontSize="12px"><option value="">None</option><option value="__new__">New Location</option>{venueLocationOptions.length > 0 && <option disabled>──────────</option>}{venueLocationOptions.map((location) => <option key={location.uuid} value={location.uuid}>{location.name}</option>)}</chakra.select><Box color="#3b82f6"><Icon name="globe" size={21} /></Box></Flex></Box>
              <Box><Text fontSize="11px" fontWeight="600" mb={1}>Modified</Text><Text h="38px" display="flex" alignItems="center" fontSize="12px">{formatTimestamp(data.modified)}</Text></Box>
            </SimpleGrid>
            <Box mt={3}><Text fontSize="11px" fontWeight="600" mb={1}>Description</Text><Textarea value={editing ? description : data.description || ''} onChange={(e) => setDescription(e.target.value)} disabled={!editing} rows={3} borderRadius="11px" /></Box>
          </Box>
        ) : editing ? (
          <VStack p={5} align="stretch" gap={4}>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>Name *</Text><Input value={name} onChange={(e) => setName(e.target.value)} /></Box>
            <Box><Text fontSize="11px" fontWeight="700" mb={1}>Description</Text><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></Box>
          </VStack>
        ) : (
          <SimpleGrid p={5} columns={{ base: 1, md: 2, xl: 4 }} gap={5}>
            <DetailValue label="Name">{data.name}</DetailValue>
            <DetailValue label="ID">{data.id}</DetailValue>
            <DetailValue label={type === 'property' ? 'Parent Property' : data.parent ? 'Parent Venue' : 'Property'}>{data.parent || data.entity}</DetailValue>
            <DetailValue label="Modified">{formatTimestamp(data.modified)}</DetailValue>
            <Box gridColumn={{ md: 'span 2', xl: 'span 4' }}><DetailValue label="Description">{data.description}</DetailValue></Box>
          </SimpleGrid>
        )}
      </Box>

      <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#fff" p={5}>
        <Text fontSize="15px" fontWeight="700" mb={4}>Behaviors</Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {[
            { label: 'RRM', value: rrm, savedValue: data.deviceRules?.rrm, set: setRrm, options: [{ value: 'inherit', label: 'Inherit' }, { value: 'no', label: 'No' }] },
            { label: 'Release candidates only', value: rcOnly, savedValue: data.deviceRules?.rcOnly, set: setRcOnly, options: [{ value: 'inherit', label: 'Inherit' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
            { label: 'Firmware upgrade', value: firmwareUpgrade, savedValue: data.deviceRules?.firmwareUpgrade, set: setFirmwareUpgrade, options: [{ value: 'inherit', label: 'Inherit' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
          ].map((field) => editing ? (
            <Box key={field.label}><Text fontSize="11px" fontWeight="700" mb={1}>{field.label}</Text><chakra.select value={field.value} onChange={(e) => field.set(e.target.value)} w="100%" h="40px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="5px">{!field.options.some((option) => option.value === field.value) && <option value={field.value}>Custom value (preserved)</option>}{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</chakra.select></Box>
          ) : <DetailValue key={field.label} label={field.label}>{field.savedValue || 'inherit'}</DetailValue>)}
          {editing ? <Box><Text fontSize="11px" fontWeight="700" mb={1}>Source IP ranges</Text><Input value={sourceIP} onChange={(e) => setSourceIP(e.target.value)} placeholder="10.0.0.0/8, 192.168.0.0/16" /></Box> : <DetailValue label="Source IP ranges">{(data.sourceIP || []).join(', ')}</DetailValue>}
        </SimpleGrid>
      </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: type === 'property' ? 3 : 2 }} gap={4}>
        <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#fff" p={5}>
          <Flex justify="space-between" align="center" mb={3}><Text fontSize="14px" fontWeight="700">Contacts</Text><Button size="xs" bg={themeColors.brand.primary} color="#fff" disabled={!effectiveOwnerPropertyId} title={!effectiveOwnerPropertyId ? 'The owning Property is not available in the authorized Venue response.' : undefined} onClick={() => { setContactEditor(null); setContactEditorOpen(true); }}><Icon name="plus" size={13} /> Add Contact</Button></Flex>
          {contacts.length ? contacts.map((contact) => <Flex key={contact.id} py={2} borderBottom="1px solid" borderColor={themeColors.panel.divider} justify="space-between" gap={2}><Box><Text fontSize="12px" fontWeight="700">{contact.name || [contact.firstname, contact.lastname].filter(Boolean).join(' ') || 'Unnamed Contact'}</Text><Text fontSize="11px" color={themeColors.text.secondary}>{contact.primaryEmail || 'No email'}{contact.type ? ` · ${contact.type}` : ''}</Text><Text fontSize="10px" color={themeColors.text.muted}>{[...(contact.phones || []), ...(contact.mobiles || [])].join(', ')}</Text></Box><Button size="xs" variant="outline" aria-label={`Edit ${contact.name || 'Contact'}`} onClick={() => { setContactEditor(contact); setContactEditorOpen(true); }}><Icon name="edit" size={13} /></Button></Flex>) : <Text fontSize="12px" color={themeColors.text.muted}>{contactsError ? 'Contact details unavailable.' : 'No Contacts associated.'}</Text>}
          <Text fontSize="10px" color={themeColors.text.muted} mt={3}>No Contact is labeled Primary because OWPROV has no authoritative primary designation.</Text>
        </Box>
        {type === 'property' && <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#fff" p={5}>
          <Flex justify="space-between" align="center" mb={3}><Text fontSize="14px" fontWeight="700">{type === 'property' ? 'Locations' : 'Location'}</Text>{(type === 'property' || locations.length === 0) && <Button size="xs" bg={themeColors.brand.primary} color="#fff" disabled={!effectiveOwnerPropertyId} title={!effectiveOwnerPropertyId ? 'The owning Property is not available in the authorized Venue response.' : undefined} onClick={() => { setLocationEditor(null); setLocationEditorOpen(true); }}><Icon name="plus" size={13} /> Add Location</Button>}</Flex>
          {locations.length ? locations.map((location) => <Flex key={location.id} py={2} borderBottom="1px solid" borderColor={themeColors.panel.divider} justify="space-between" gap={2}><Box><Text fontSize="12px" fontWeight="700">{location.name || location.buildingName || 'Unnamed Location'}</Text><Text fontSize="11px" color={themeColors.text.secondary}>{[...(location.addressLines || []), location.city, location.state, location.postal, location.country].filter(Boolean).join(', ') || 'No address'}</Text>{location.timezone && <Text fontSize="10px" color={themeColors.text.muted}>{location.timezone}</Text>}</Box><Button size="xs" variant="outline" aria-label={`Edit ${location.name || 'Location'}`} onClick={() => { setLocationEditor(location); setLocationEditorOpen(true); }}><Icon name="edit" size={13} /></Button></Flex>) : <Text fontSize="12px" color={themeColors.text.muted}>{locationsError ? 'Location details unavailable.' : 'No Locations associated.'}</Text>}
        </Box>}
        <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#fff" p={5}>
          <Text fontSize="14px" fontWeight="700" mb={3}>Notes</Text>
          {(data.notes || []).length ? (data.notes || []).map((note, index) => <Box key={`${note.created}-${index}`} py={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}><Text fontSize="12px">{note.note}</Text><Text fontSize="10px" color={themeColors.text.muted}>{note.createdBy || note.author || 'Unknown'} · {formatTimestamp(note.created)}</Text></Box>) : <Text fontSize="12px" color={themeColors.text.muted}>No Notes recorded.</Text>}
        </Box>
      </SimpleGrid>
      {contactEditorOpen && <ContactEditorModal scopeType={type} scopeId={id} ownerPropertyId={effectiveOwnerPropertyId} existingContactIds={contactIds} contact={contactEditor || undefined} onClose={() => setContactEditorOpen(false)} />}
      {locationEditorOpen && <LocationEditorModal scopeType={type} scopeId={id} ownerPropertyId={effectiveOwnerPropertyId} location={locationEditor || undefined} onClose={() => setLocationEditorOpen(false)} />}
    </VStack>
  );
};
