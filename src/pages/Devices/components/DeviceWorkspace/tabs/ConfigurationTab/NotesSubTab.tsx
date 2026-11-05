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
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import { useUpdateDeviceTag, formatRelativeTime } from '@/api/devices';
import type { UnifiedFleetDevice, DeviceNote } from '@/types/device';

export interface NotesSubTabProps {
  device: UnifiedFleetDevice;
}

export const NotesSubTab: React.FC<NotesSubTabProps> = ({ device }) => {
  const [notes, setNotes] = useState<Array<{ date: string; author: string; text: string }>>([]);
  const [newNote, setNewNote] = useState('');
  const queryClient = useQueryClient();
  const updateMutation = useUpdateDeviceTag();

  useEffect(() => {
    // Read strictly from OWPROV inventory tag notes
    const rawNotes: DeviceNote[] = device.provTag?.notes || [];
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
      setNotes([]);
    }
  }, [device]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const authoritativeDevClass = device.provTag?.devClass || 'any';

      // Field-scoped update (Issue #4):
      // Only submit the new note plus minimum required validation fields to OWPROV inventory.
      // Omit configuration IDs, device rules, parent associations, subscriber, and hardware type.
      const res = await updateMutation.mutateAsync({
        serialNumber: device.serialNumber,
        payload: {
          name: device.name || device.serialNumber,
          devClass: authoritativeDevClass,
          notes: [{ note: newNote.trim() }],
        },
      });

      // Authoritative refresh from OWPROV response:
      // res.notes contains the persisted note list with server-generated timestamps and author
      const authoritativeNotes: DeviceNote[] = res?.notes || [];
      if (authoritativeNotes.length > 0) {
        setNotes(
          [...authoritativeNotes]
            .sort((a, b) => (b.created || 0) - (a.created || 0))
            .map((n) => ({
              date: n.created ? formatRelativeTime(n.created) : 'Just now',
              author: n.author || n.createdBy || 'system',
              text: n.note,
            }))
        );
      } else {
        setNotes([
          {
            date: 'Just now',
            author: 'Current User',
            text: newNote.trim(),
          },
          ...notes,
        ]);
      }
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', device.serialNumber] });
      toaster.create({
        title: 'Note Added',
        description: 'Device note saved.',
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
              Device Notes
            </Text>
            <Text fontSize="12px" color={themeColors.text.muted}>
              Configuration records and maintenance notes for {device.serialNumber}.
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

          {notes.length === 0 ? (
            <Flex py={6} justify="center" align="center" color={themeColors.text.muted} fontSize="13px">
              No notes recorded for this device yet.
            </Flex>
          ) : (
            notes.map((n, idx) => (
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
            ))
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default NotesSubTab;

