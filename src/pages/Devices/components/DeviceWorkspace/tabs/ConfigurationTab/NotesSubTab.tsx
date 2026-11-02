import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice } from '@/types/device';

export interface NotesSubTabProps {
  device: UnifiedFleetDevice;
}

export const NotesSubTab: React.FC<NotesSubTabProps> = ({ device }) => {
  const [notes, setNotes] = useState([
    {
      date: '7 days ago',
      author: 'system',
      text: 'Auto-provisioned and assigned to Building B venue.',
    },
    {
      date: '2 days ago',
      author: 'admin@mangocloud.io',
      text: 'Updated channel plan to 20MHz on 2.4G due to high interference in hallway.',
    },
  ]);

  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (!newNote.trim()) return;
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
            gap={1.5}
            flexShrink={0}
          >
            <Icon name="plus" size={14} />
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

