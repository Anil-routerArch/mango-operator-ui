import React, { useState } from 'react';
import { Box, Button, Flex, Input, SimpleGrid, Spinner, Text, chakra } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { toaster } from '@/components/ui/toaster';
import { parseApiError, useSaveContact, type ContactDetails, type PropertyScopeType } from '@/api';
import { themeColors } from '@/theme';

const splitValues = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => <Text fontSize="12px" fontWeight="500" mb={1.5}>{children}{required && <Text as="span" color="#e11d48"> *</Text>}</Text>;

export const ContactEditorModal: React.FC<{
  scopeType: PropertyScopeType;
  scopeId: string;
  ownerPropertyId: string;
  existingContactIds: string[];
  contact?: ContactDetails;
  onClose: () => void;
}> = ({ scopeType, scopeId, ownerPropertyId, existingContactIds, contact, onClose }) => {
  const saveContact = useSaveContact();
  const [name, setName] = useState(contact?.name || '');
  const [type, setType] = useState(contact?.type || 'SUBSCRIBER');
  const [salutation, setSalutation] = useState(contact?.salutation || '');
  const [title, setTitle] = useState(contact?.title || '');
  const [firstname, setFirstname] = useState(contact?.firstname || '');
  const [lastname, setLastname] = useState(contact?.lastname || '');
  const [initials, setInitials] = useState(contact?.initials || '');
  const [description, setDescription] = useState(contact?.description || '');
  const [primaryEmail, setPrimaryEmail] = useState(contact?.primaryEmail || '');
  const [secondaryEmail, setSecondaryEmail] = useState(contact?.secondaryEmail || '');
  const [phones, setPhones] = useState((contact?.phones || []).join(', '));
  const [mobiles, setMobiles] = useState((contact?.mobiles || []).join(', '));
  const [accessPIN, setAccessPIN] = useState(contact?.accessPIN || '');
  const [note, setNote] = useState('');
  const valid = Boolean(
    name.trim()
    && firstname.trim()
    && isValidEmail(primaryEmail)
    && (!secondaryEmail.trim() || isValidEmail(secondaryEmail))
    && ownerPropertyId
  );

  const submit = async () => {
    if (!valid) return;
    try {
      await saveContact.mutateAsync({
        contactId: contact?.id, scopeType, scopeId, existingContactIds,
        payload: {
          name: name.trim(), type, salutation, title: title.trim(), firstname: firstname.trim(),
          lastname: lastname.trim(), initials: initials.trim(), visual: contact?.visual || '',
          description: description.trim(), primaryEmail: primaryEmail.trim(), secondaryEmail: secondaryEmail.trim(),
          phones: splitValues(phones), mobiles: splitValues(mobiles), accessPIN: accessPIN.trim(),
          entity: ownerPropertyId,
          notes: note.trim() ? [{ note: note.trim() }] : undefined,
        },
      });
      toaster.create({ title: `Contact ${contact ? 'updated' : 'created'}`, type: 'success' });
      onClose();
    } catch (error) {
      toaster.create({ title: 'Could not save Contact', description: parseApiError(error, 'OWPROV rejected the Contact'), type: 'error' });
    }
  };

  const inputProps = { h: '38px', borderRadius: '11px', fontSize: '12px' } as const;
  return <Flex position="fixed" inset={0} zIndex={3100} bg={themeColors.modal.backdrop} align="center" justify="center" p={4} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <Box w="100%" maxW="720px" maxH="92vh" overflowY="auto" bg="#fff" borderRadius="12px" border="1px solid" borderColor="#1f2937" boxShadow="0 24px 80px rgba(0,0,0,.24)">
      <Flex px={5} py={3} bg="#eef8ff" justify="space-between" align="center" borderBottom="1px solid" borderColor="#1f2937">
        <Text fontSize="18px" fontWeight="700">{contact ? 'Edit Contact' : 'Create Contact'}</Text>
        <Flex gap={2}>
          <Button aria-label="Save Contact" minW="36px" w="36px" h="36px" p={0} borderRadius="11px" bg="#8ebcf0" color="#fff" disabled={!valid || saveContact.isPending} onClick={submit}>{saveContact.isPending ? <Spinner size="xs" /> : <Icon name="save" size={18} />}</Button>
          <Button aria-label="Close" minW="36px" w="36px" h="36px" p={0} borderRadius="11px" bg="transparent" border="1px solid" borderColor="#1f2937" onClick={onClose}><Icon name="x" size={18} /></Button>
        </Flex>
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2 }} columnGap={4} rowGap={4} px={5} py={4}>
        <Box><FieldLabel required>Visual</FieldLabel><Input {...inputProps} value={name} onChange={(e) => setName(e.target.value)} borderColor={!name.trim() ? '#f43f5e' : themeColors.input.border} />{!name.trim() && <Text color="#e11d48" fontSize="10px" mt={1}>Required</Text>}</Box>
        <Box><FieldLabel>Type</FieldLabel><chakra.select value={type} onChange={(e) => setType(e.target.value)} h="38px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="11px" fontSize="12px">{['SUBSCRIBER', 'USER', 'INSTALLER', 'CSR', 'MANAGER', 'BUSINESSOWNER', 'TECHNICIAN', 'CORPORATE', 'UNKNOWN'].map((value) => <option key={value} value={value}>{value}</option>)}</chakra.select></Box>
        <Box><FieldLabel>Salutation</FieldLabel><chakra.select value={salutation} onChange={(e) => setSalutation(e.target.value)} h="38px" px={3} border="1px solid" borderColor={themeColors.input.border} borderRadius="11px" fontSize="12px"><option value="">None</option>{['Mr.', 'Ms.', 'Mx.', 'Dr.'].map((value) => <option key={value}>{value}</option>)}</chakra.select></Box>
        <Box><FieldLabel>Title</FieldLabel><Input {...inputProps} value={title} onChange={(e) => setTitle(e.target.value)} /></Box>
        <Box><FieldLabel required>First Name</FieldLabel><Input {...inputProps} value={firstname} onChange={(e) => setFirstname(e.target.value)} borderColor={!firstname.trim() ? '#f43f5e' : themeColors.input.border} /></Box>
        <Box><FieldLabel>Last Name</FieldLabel><Input {...inputProps} value={lastname} onChange={(e) => setLastname(e.target.value)} /></Box>
        <Box><FieldLabel>Initials</FieldLabel><Input {...inputProps} value={initials} onChange={(e) => setInitials(e.target.value)} /></Box>
        <Box><FieldLabel>Description</FieldLabel><Input {...inputProps} value={description} onChange={(e) => setDescription(e.target.value)} /></Box>
        <Box><FieldLabel required>Primary Email</FieldLabel><Input {...inputProps} type="email" value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} borderColor={!isValidEmail(primaryEmail) ? '#f43f5e' : themeColors.input.border} />{primaryEmail.trim() && !isValidEmail(primaryEmail) && <Text color="#e11d48" fontSize="10px" mt={1}>Enter a valid email address</Text>}</Box>
        <Box><FieldLabel>Secondary Email</FieldLabel><Input {...inputProps} type="email" value={secondaryEmail} onChange={(e) => setSecondaryEmail(e.target.value)} borderColor={secondaryEmail.trim() && !isValidEmail(secondaryEmail) ? '#f43f5e' : themeColors.input.border} />{secondaryEmail.trim() && !isValidEmail(secondaryEmail) && <Text color="#e11d48" fontSize="10px" mt={1}>Enter a valid email address</Text>}</Box>
        <Box><FieldLabel>Phones</FieldLabel><Input {...inputProps} value={phones} onChange={(e) => setPhones(e.target.value)} placeholder="+1(202)555-0103" /></Box>
        <Box><FieldLabel>Mobiles</FieldLabel><Input {...inputProps} value={mobiles} onChange={(e) => setMobiles(e.target.value)} placeholder="+1(202)555-0103" /></Box>
        <Box><FieldLabel>Access PIN</FieldLabel><Input {...inputProps} value={accessPIN} onChange={(e) => setAccessPIN(e.target.value)} /></Box>
        <Box><FieldLabel>Note</FieldLabel><Input {...inputProps} value={note} onChange={(e) => setNote(e.target.value)} /></Box>
      </SimpleGrid>
    </Box>
  </Flex>;
};
