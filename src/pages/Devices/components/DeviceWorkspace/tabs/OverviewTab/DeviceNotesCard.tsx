import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  NativeSelect,
  Spinner,
  Table,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import { useDeviceRecord, addDeviceNote } from '@/api/devices';
import type { UnifiedFleetDevice, DeviceNote } from '@/types/device';

export interface DeviceNotesCardProps {
  device: UnifiedFleetDevice;
  onRefresh?: () => void;
}

export const DeviceNotesCard: React.FC<DeviceNotesCardProps> = ({ device, onRefresh }) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  // Fetch device record (including live notes) from MDU backend with RBAC enforcement
  const { data: recordData, isLoading, isFetching, refetch } = useDeviceRecord(device.serialNumber);

  // Extract notes from MDU response or fallback to device properties
  const notes = useMemo<DeviceNote[]>(() => {
    const rawList = recordData?.notes || device.notes || [];
    return [...rawList].sort((a, b) => (b.created || 0) - (a.created || 0));
  }, [recordData?.notes, device.notes]);

  const totalPages = Math.max(1, Math.ceil(notes.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const displayedNotes = useMemo(() => {
    const start = currentPage * pageSize;
    return notes.slice(start, start + pageSize);
  }, [notes, currentPage, pageSize]);

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setIsSubmitting(true);
    try {
      // Route note addition through MDU backend with RBAC pre-flight validation
      await addDeviceNote(device.serialNumber, newNoteText.trim());

      setNewNoteText('');
      setIsAdding(false);

      // Invalidate cache to pull fresh device record
      queryClient.invalidateQueries({ queryKey: ['device-record', device.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['unified-fleet-device', device.serialNumber] });

      toaster.create({
        title: 'Note Added',
        description: 'Successfully appended note to device history via MDU',
        type: 'success',
      });
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      toaster.create({
        title: 'Failed to Add Note',
        description: err instanceof Error ? err.message : 'Error submitting device note',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNoteDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    const diff = Math.floor(Date.now() / 1000) - timestamp;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <Box
      bg="#ffffff"
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="12px"
      p={5}
      boxShadow="0 1px 3px rgba(0,0,0,0.03)"
    >
      {/* Header */}
      <Flex justify="space-between" align="center" mb={3} pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <HStack gap={2}>
          <Box color="#2563eb">
            <Icon name="file" size={18} />
          </Box>
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
            Notes
          </Text>
        </HStack>

        <HStack gap={2}>
          {isFetching && <Spinner size="xs" color="#2563eb" />}
          <IconButton
            size="xs"
            variant="ghost"
            title="Refresh notes"
            onClick={() => refetch()}
          >
            <Icon name="refresh" size={13} />
          </IconButton>
          <IconButton
            size="xs"
            colorPalette="teal"
            variant="solid"
            title="Add Note"
            borderRadius="full"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Icon name="plus" size={14} />
          </IconButton>
        </HStack>
      </Flex>

      {/* Add Note Form */}
      {isAdding && (
        <Box bg="#f8fafc" p={3} borderRadius="8px" mb={3} border="1px solid" borderColor="#e2e8f0">
          <Text fontSize="12px" fontWeight="600" mb={1.5} color={themeColors.text.title}>
            New Note:
          </Text>
          <Textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Type device note or maintenance record..."
            size="sm"
            bg="#ffffff"
            rows={2}
            mb={2}
          />
          <HStack justify="flex-end" gap={2}>
            <Button size="xs" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              colorPalette="teal"
              onClick={handleAddNote}
              loading={isSubmitting}
            >
              Save Note
            </Button>
          </HStack>
        </Box>
      )}

      {/* Notes Table */}
      <Box
        overflowX="auto"
        overflowY="auto"
        maxH="260px"
        mb={3}
        border="1px solid"
        borderColor={themeColors.panel.divider}
        borderRadius="8px"
      >
        <Table.Root size="sm" variant="outline">
          <Table.Header position="sticky" top={0} zIndex={1} bg="#f8fafc">
            <Table.Row bg="#f8fafc">
              <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase" width="130px">
                Date
              </Table.ColumnHeader>
              <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                Note
              </Table.ColumnHeader>
              <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase" width="120px">
                By
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading && notes.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={3} textAlign="center" py={4}>
                  <HStack justify="center" gap={2}>
                    <Spinner size="xs" color="#2563eb" />
                    <Text fontSize="12px" color={themeColors.text.muted}>
                      Loading notes...
                    </Text>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ) : displayedNotes.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={3} textAlign="center" py={4} color={themeColors.text.muted} fontSize="12px">
                  No notes recorded for this device yet.
                </Table.Cell>
              </Table.Row>
            ) : (
              displayedNotes.map((item, idx) => (
                <Table.Row key={idx} fontSize="12px" _hover={{ bg: '#f1f5f9' }}>
                  <Table.Cell color={themeColors.text.muted}>{formatNoteDate(item.created)}</Table.Cell>
                  <Table.Cell fontWeight="500" color={themeColors.text.primary} wordBreak="break-word">
                    {item.note}
                  </Table.Cell>
                  <Table.Cell color={themeColors.text.muted}>{item.createdBy || item.author || '-'}</Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Pagination Footer */}
      <Flex justify="space-between" align="center" fontSize="12px" color={themeColors.text.muted} pt={2}>
        <HStack gap={1}>
          <IconButton
            size="2xs"
            variant="outline"
            disabled={currentPage === 0}
            title="First page"
            onClick={() => setPageIndex(0)}
          >
            <Icon name="chevronsLeft" size={11} />
          </IconButton>
          <IconButton
            size="2xs"
            variant="outline"
            disabled={currentPage === 0}
            title="Previous page"
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          >
            <Icon name="chevronLeft" size={11} />
          </IconButton>
        </HStack>

        <HStack gap={3}>
          <Text>
            Page <Text as="span" fontWeight="700" color={themeColors.text.title}>{currentPage + 1}</Text> of {totalPages}
          </Text>
          <NativeSelect.Root size="xs" width="85px">
            <NativeSelect.Field
              value={pageSize.toString()}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(0);
              }}
              fontSize="11px"
            >
              <option value="10">Show 10</option>
              <option value="25">Show 25</option>
              <option value="50">Show 50</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
        </HStack>

        <HStack gap={1}>
          <IconButton
            size="2xs"
            variant="outline"
            disabled={currentPage >= totalPages - 1}
            title="Next page"
            onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
          >
            <Icon name="chevronRight" size={11} />
          </IconButton>
          <IconButton
            size="2xs"
            variant="outline"
            disabled={currentPage >= totalPages - 1}
            title="Last page"
            onClick={() => setPageIndex(totalPages - 1)}
          >
            <Icon name="chevronsRight" size={11} />
          </IconButton>
        </HStack>
      </Flex>
    </Box>
  );
};

export default DeviceNotesCard;
