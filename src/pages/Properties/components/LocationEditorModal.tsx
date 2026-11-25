import React, { useMemo, useState } from 'react';
import { Box, Button, Flex, Input, SimpleGrid, Spinner, Text, chakra } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { toaster } from '@/components/ui/toaster';
import { parseApiError, useSaveLocation, type LocationDetails, type PropertyScopeType } from '@/api';
import { themeColors } from '@/theme';
import { COUNTRY_LIST } from '@/pages/Configuration/components/ConfigurationSectionsCard/countryList';

const splitValues = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => <Text fontSize="12px" fontWeight="500" mb={1.5}>{children}{required && <Text as="span" color="#e11d48"> *</Text>}</Text>;

const getTimezones = () => {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] };
  return intl.supportedValuesOf?.('timeZone') || ['UTC', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'America/Los_Angeles'];
};

export const LocationEditorModal: React.FC<{ scopeType: PropertyScopeType; scopeId: string; ownerPropertyId: string; location?: LocationDetails; onClose: () => void }> = ({ scopeType, scopeId, ownerPropertyId, location, onClose }) => {
  const saveLocation = useSaveLocation();
  const timezones = useMemo(() => getTimezones(), []);
  const [name, setName] = useState(location?.name || '');
  const [description, setDescription] = useState(location?.description || '');
  const [type, setType] = useState(location?.type || 'SERVICE');
  const [phones, setPhones] = useState((location?.phones || []).join(', '));
  const [mobiles, setMobiles] = useState((location?.mobiles || []).join(', '));
  const [addressLookup, setAddressLookup] = useState('');
  const [timezone, setTimezone] = useState(location?.timezone || '');
  const [addressOne, setAddressOne] = useState(location?.addressLines?.[0] || '');
  const [addressTwo, setAddressTwo] = useState(location?.addressLines?.[1] || '');
  const [city, setCity] = useState(location?.city || '');
  const [state, setState] = useState(location?.state || '');
  const [postal, setPostal] = useState(location?.postal || '');
  const [country, setCountry] = useState(location?.country || '');
  const [buildingName, setBuildingName] = useState(location?.buildingName || '');
  const [geoCode, setGeoCode] = useState(location?.geoCode || '');
  const [note, setNote] = useState('');
  const valid = Boolean(name.trim() && addressOne.trim() && city.trim() && state.trim() && postal.trim() && country.trim() && timezone.trim() && ownerPropertyId);

  const submit = async () => {
    if (!valid) return;
    try {
      await saveLocation.mutateAsync({ locationId: location?.id, scopeType, scopeId, payload: {
        name: name.trim(), description: description.trim(), type, buildingName: buildingName.trim(),
        addressLines: [addressOne, addressTwo].map((value) => value.trim()).filter(Boolean), city: city.trim(),
        state: state.trim(), postal: postal.trim(), country: country.trim(), timezone: timezone.trim(),
        geoCode: geoCode.trim(), phones: splitValues(phones), mobiles: splitValues(mobiles), entity: ownerPropertyId,
        notes: note.trim() ? [{ note: note.trim() }] : undefined,
      } });
      toaster.create({ title: `Location ${location ? 'updated' : 'created'}`, type: 'success' });
      onClose();
    } catch (error) {
      toaster.create({ title: 'Could not save Location', description: parseApiError(error, 'OWPROV rejected the Location'), type: 'error' });
    }
  };

  const inputProps = { h: '38px', borderRadius: '11px', fontSize: '12px' } as const;
  return <Flex position="fixed" inset={0} zIndex={3100} bg={themeColors.modal.backdrop} align="center" justify="center" p={4} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><Box w="100%" maxW="720px" maxH="94vh" overflowY="auto" bg="#fff" borderRadius="12px" border="1px solid" borderColor="#1f2937" boxShadow="0 24px 80px rgba(0,0,0,.24)">
    <Flex px={5} py={3} bg="#eef8ff" justify="space-between" align="center" borderBottom="1px solid" borderColor="#1f2937"><Text fontSize="18px" fontWeight="700">{location ? 'Edit Location' : 'Create Location'}</Text><Flex gap={2}><Button aria-label="Save Location" minW="36px" w="36px" h="36px" p={0} borderRadius="11px" bg="#8ebcf0" color="#fff" disabled={!valid || saveLocation.isPending} onClick={submit}>{saveLocation.isPending ? <Spinner size="xs" /> : <Icon name="save" size={18} />}</Button><Button aria-label="Close" minW="36px" w="36px" h="36px" p={0} borderRadius="11px" bg="transparent" border="1px solid" borderColor="#1f2937" onClick={onClose}><Icon name="x" size={18} /></Button></Flex></Flex>
    <SimpleGrid columns={{ base: 1, md: 2 }} columnGap={4} rowGap={4} px={5} py={4}>
      <Box><FieldLabel required>Name</FieldLabel><Input {...inputProps} value={name} onChange={(e) => setName(e.target.value)} borderColor={!name.trim() ? '#f43f5e' : themeColors.input.border} /></Box>
      <Box><FieldLabel>Description</FieldLabel><Input {...inputProps} value={description} onChange={(e) => setDescription(e.target.value)} /></Box>
      <Box><FieldLabel>Type</FieldLabel><chakra.select value={type} onChange={(e) => setType(e.target.value)} h="38px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="11px" fontSize="12px">{['SERVICE', 'EQUIPMENT', 'AUTO', 'MANUAL', 'SPECIAL', 'CORPORATE', 'UNKNOWN'].map((value) => <option key={value}>{value}</option>)}</chakra.select></Box>
      <Box><FieldLabel>Phones</FieldLabel><Input {...inputProps} value={phones} onChange={(e) => setPhones(e.target.value)} placeholder="+1(202)555-0103" /></Box>
      <Box><FieldLabel>Mobiles</FieldLabel><Input {...inputProps} value={mobiles} onChange={(e) => setMobiles(e.target.value)} placeholder="+1(202)555-0103" /></Box>
      <Box />
      <Box gridColumn={{ md: 'span 2' }}>
        <FieldLabel>Quick-fill Address Line One</FieldLabel>
        <Input {...inputProps} value={addressLookup} onChange={(e) => setAddressLookup(e.target.value)} onBlur={() => { if (!addressOne.trim() && addressLookup.trim()) setAddressOne(addressLookup.trim()); }} placeholder="Paste an address, then tab away to copy it below" />
        <Text mt={1} fontSize="10px" color={themeColors.text.muted}>Address search and geocoding are not configured in Mango Operator UI. Verify the structured address fields before saving.</Text>
      </Box>
      <Box><FieldLabel required>Timezone</FieldLabel><chakra.select value={timezone} onChange={(e) => setTimezone(e.target.value)} h="38px" px={3} border="1px solid" borderColor={!timezone ? '#f43f5e' : themeColors.input.border} borderRadius="11px" fontSize="12px"><option value="">None</option>{timezones.map((value) => <option key={value}>{value}</option>)}</chakra.select></Box>
      <Box><FieldLabel required>Address Line One</FieldLabel><Input {...inputProps} value={addressOne} onChange={(e) => setAddressOne(e.target.value)} borderColor={!addressOne.trim() ? '#f43f5e' : themeColors.input.border} /></Box>
      <Box><FieldLabel>Address Line Two</FieldLabel><Input {...inputProps} value={addressTwo} onChange={(e) => setAddressTwo(e.target.value)} /></Box>
      <Box><FieldLabel required>City</FieldLabel><Input {...inputProps} value={city} onChange={(e) => setCity(e.target.value)} borderColor={!city.trim() ? '#f43f5e' : themeColors.input.border} /></Box>
      <Box><FieldLabel required>State/Province</FieldLabel><Input {...inputProps} value={state} onChange={(e) => setState(e.target.value)} borderColor={!state.trim() ? '#f43f5e' : themeColors.input.border} /></Box>
      <Box><FieldLabel required>ZIP/Postal Code</FieldLabel><Input {...inputProps} value={postal} onChange={(e) => setPostal(e.target.value)} borderColor={!postal.trim() ? '#f43f5e' : themeColors.input.border} /></Box>
      <Box><FieldLabel required>Country</FieldLabel><chakra.select value={country} onChange={(e) => setCountry(e.target.value)} h="38px" px={3} border="1px solid" borderColor={!country ? '#f43f5e' : themeColors.input.border} borderRadius="11px" fontSize="12px"><option value="">None</option>{COUNTRY_LIST.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</chakra.select></Box>
      <Box><FieldLabel>Building Name</FieldLabel><Input {...inputProps} value={buildingName} onChange={(e) => setBuildingName(e.target.value)} /></Box>
      <Box><FieldLabel>Geo Code</FieldLabel><Input {...inputProps} value={geoCode} onChange={(e) => setGeoCode(e.target.value)} /></Box>
      <Box><FieldLabel>Note</FieldLabel><Input {...inputProps} value={note} onChange={(e) => setNote(e.target.value)} /></Box>
    </SimpleGrid>
  </Box></Flex>;
};
