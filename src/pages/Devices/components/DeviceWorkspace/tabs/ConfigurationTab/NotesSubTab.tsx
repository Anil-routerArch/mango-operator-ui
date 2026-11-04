import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import { useUpdateDeviceTag, formatRelativeTime } from '@/api/devices';
import type { UnifiedFleetDevice, DeviceNote } from '@/types/device';
import { normalizeRrmForSubmission } from './rrmHelper';

export interface NotesSubTabProps {
  device: UnifiedFleetDevice;
}

export const NotesSubTab: React.FC<NotesSubTabProps> = ({ device }) => {
  const [notes, setNotes] = useState<Array<{ date: string; author: string; text: string }>>([]);
  const [newNote, setNewNote] = useState('');
  const updateMutation = useUpdateDeviceTag();

  useEffect(() => {
    const rawNotes: DeviceNote[] = device.provTag?.notes || device.notes || [];
    if (rawNotes.length > 0) {
      setNotes(
        [...rawNotes]
          .sort((a, b) => (b.created || 0) - (a.created || 0))
          .map((n) => ({
            date: n.created ? formatRelativeTime(n.created) : 'Recent',
            author: n.author || n.createdBy || 'system',
            text: n.note,
          }))
      );
    } else {
      setNotes([
        {
          date: 'Recent',
          author: 'system',
          text: 'Auto-provisioned device tag.',
        },
      ]);
    }
  }, [device]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const resolvedType =
        device.provTag?.deviceType ||
        (device.deviceType && !['ap', 'switch', 'olg'].includes(device.deviceType) ? device.deviceType : device.model) ||
        'asus_rt-ax53u';
      const resolvedGroup =
        device.provTag?.deviceGroup ||
        (['ap', 'switch', 'olg'].includes(device.deviceGroup) ? device.deviceGroup : 'ap');

      await updateMutation.mutateAsync({
        serialNumber: device.serialNumber,
        payload: {
          name: device.name || device.serialNumber,
          description: device.description || '',
          notes: [{ note: newNote.trim() }],
          deviceType: resolvedType,
          deviceGroup: resolvedGroup,
          devClass: device.provTag?.devClass || 'venue',
          deviceConfiguration: device.provTag?.deviceConfiguration ?? (device.configId || ''),
          deviceRules: {
            firmwareUpgrade: (device.provTag?.deviceRules?.firmwareUpgrade as string) || 'inherit',
            rcOnly: (device.provTag?.deviceRules?.rcOnly as string) || 'inherit',
            rrm: normalizeRrmForSubmission(device.provTag?.deviceRules?.rrm),
          },
          doNotAllowOverrides: Boolean(device.provTag?.doNotAllowOverrides),
          entity: device.provTag?.entity || device.entityId || '',
          venue: device.provTag?.venue || device.venueId || '',
          subscriber: device.provTag?.subscriber ?? (device.subscriberId || ''),
          state: device.provTag?.state ?? (device.state || ''),
        },
      });

      setNotes([
        {
          date: 'Just now',
          author: 'Current User',
          text: newNote.trim(),
        },
        ...notes,
      ]);
      setNewNote('');
      toaster.create({
        title: 'Note Added',
        description: 'Device operational note saved.',
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Could not add note',
        type: 'error',
      });
    }
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={5}>
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="15px" fontWeight="600" color={themeColors.text.title}>
              Device Operator Notes
            </Text>
            <Text fontSize="12px" color={themeColors.text.muted}>
              Operational records and engineer handover notes for {device.serialNumber}.
            </Text>
          </Box>
        </Flex>

        {/* Add Note Input */}
        <Flex gap={3} align="center">
          <Input
            size="sm"
            placeholder="Type an engineer note or maintenance memo..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            borderColor={themeColors.input.border}
          />
          <Button
            size="sm"
            bg={themeColors.brand.primary}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.primaryHover }}
            onClick={handleAddNote}
            disabled={updateMutation.isPending}
            gap={1.5}
            flexShrink={0}
          >
            {updateMutation.isPending ? <Spinner size="xs" /> : <Icon name="plus" size={14} />}
            Add Note
          </Button>
        </Flex>

        {/* Notes Table */}
        <Box border="1px solid" borderColor={themeColors.panel.divider} borderRadius="8px" overflow="hidden">
          <Flex
            bg="#f8fafc"
            borderBottom="1px solid"
            borderColor={themeColors.panel.divider}
            py={2.5}
            px={4}
            fontSize="11px"
            fontWeight="700"
            color={themeColors.text.muted}
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            <Box w="120px">DATE</Box>
            <Box flex="1">NOTE</Box>
            <Box w="180px">RECORDED BY</Box>
          </Flex>

          {notes.map((n, idx) => (
            <Flex
              key={idx}
              align="center"
              py={3}
              px={4}
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
              fontSize="12px"
              _last={{ borderBottom: 'none' }}
              _hover={{ bg: '#fafbfc' }}
            >
              <Box w="120px" color={themeColors.text.muted} fontSize="12px" whiteSpace="nowrap">
                {n.date}
              </Box>
              <Box flex="1" color={themeColors.text.primary} fontSize="13px">
                {n.text}
              </Box>
              <Box w="180px" color={themeColors.text.secondary} fontSize="12px">
                {n.author}
              </Box>
            </Flex>
          ))}
        </Box>
      </VStack>
    </Box>
  );
};

export default NotesSubTab;

