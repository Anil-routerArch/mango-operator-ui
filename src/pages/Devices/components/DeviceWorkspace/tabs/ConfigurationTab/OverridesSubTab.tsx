import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useDeviceOverrides, useUpdateDeviceOverrides } from '@/api/devices';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice, ConfigurationOverride } from '@/types/device';

export interface OverridesSubTabProps {
  device: UnifiedFleetDevice;
  isDisabled?: boolean;
}

// ---------------------------------------------------------------------------
// Standard Wi-Fi Channel Options (2.4GHz, 5GHz, 6GHz) matching OWPROV
// ---------------------------------------------------------------------------
const CHANNELS_MAP = {
  '2G': [1, 6, 11],
  '5G': {
    40: [36, 44, 52, 60, 100, 108, 116, 124, 132, 149, 157, 165, 173, 184, 192],
    80: [36, 52, 100, 116, 132, 149],
  },
  '5G-lower': {
    20: [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144],
    40: [38, 46, 54, 63, 102, 110, 118, 126, 134, 142],
    80: [42, 58, 106, 122, 138],
    160: [50, 114],
  },
  '5G-upper': {
    20: [149, 153, 157, 161, 165],
    40: [151, 159],
    80: [155],
  },
  '6G': {
    20: [
      1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81, 85, 89, 93, 97, 101, 105, 109,
      113, 117, 121, 125, 129, 133, 137, 141, 145, 149, 153, 157, 161, 165, 169, 173, 177, 181, 185, 189, 193, 197, 201,
      205, 209, 213, 217, 221, 225, 229, 233,
    ],
    40: [
      3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99, 107, 115, 123, 131, 139, 147, 155, 163, 171, 17, 187, 195, 203,
      211, 219, 227,
    ],
    80: [7, 23, 39, 55, 71, 87, 103, 119, 135, 151, 167, 183, 199, 215],
    160: [15, 47, 79, 143],
  },
};

const getChannelOptions = (): Array<{ value: string; label: string }> => {
  const set = new Set<number>();
  const add = (n: number) => set.add(n);

  CHANNELS_MAP['2G'].forEach(add);
  Object.values(CHANNELS_MAP['5G']).forEach((arr) => arr.forEach(add));
  Object.values(CHANNELS_MAP['5G-lower']).forEach((arr) => arr.forEach(add));
  Object.values(CHANNELS_MAP['5G-upper']).forEach((arr) => arr.forEach(add));
  Object.values(CHANNELS_MAP['6G']).forEach((arr) => arr.forEach(add));

  const sorted = Array.from(set).sort((a, b) => a - b);
  return [
    { value: 'auto', label: 'Auto' },
    ...sorted.map((ch) => ({ value: String(ch), label: String(ch) })),
  ];
};

const CHANNEL_OPTIONS = getChannelOptions();

// Available columns for column picker
export interface TableColumnDef {
  id: string;
  label: string;
  alwaysShow?: boolean;
}

const AVAILABLE_COLUMNS: TableColumnDef[] = [
  { id: 'source', label: 'Source' },
  { id: 'parameterName', label: 'Name', alwaysShow: true },
  { id: 'parameterValue', label: 'Value', alwaysShow: true },
  { id: 'reason', label: 'Reason' },
  { id: 'actions', label: 'Actions', alwaysShow: true },
];

const LOCAL_STORAGE_HIDDEN_COLUMNS_KEY = 'mango_configurationOverrides_hiddenColumns';

const selectStyle: React.CSSProperties = {
  width: '100%',
  height: '36px',
  padding: '0 10px',
  borderRadius: '6px',
  border: `1px solid ${themeColors.input.border}`,
  backgroundColor: '#ffffff',
  color: themeColors.text.primary,
  fontSize: '13px',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: themeColors.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '4px',
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const OverridesSubTab: React.FC<OverridesSubTabProps> = ({ device, isDisabled = false }) => {
  const serial = device?.serialNumber || '';
  const { data: serverOverrides, isLoading, isFetching, refetch } = useDeviceOverrides(serial);
  const updateMutation = useUpdateDeviceOverrides();

  // Local state initialized from server data
  const [overrides, setOverrides] = useState<ConfigurationOverride[]>([]);

  useEffect(() => {
    if (serverOverrides) {
      setOverrides(serverOverrides);
    }
  }, [serverOverrides]);

  // Column picker state persisted to localStorage
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HIDDEN_COLUMNS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);

  const toggleColumnVisibility = (colId: string) => {
    const col = AVAILABLE_COLUMNS.find((c) => c.id === colId);
    if (col?.alwaysShow) return;

    setHiddenColumns((prev) => {
      const next = prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId];
      try {
        localStorage.setItem(LOCAL_STORAGE_HIDDEN_COLUMNS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>('source');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleHeaderSort = (colId: string) => {
    if (colId === 'actions') return;
    if (sortColumn === colId) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(colId);
      setSortAsc(true);
    }
  };

  const sortedOverrides = useMemo(() => {
    if (!sortColumn) return overrides;
    return [...overrides].sort((a, b) => {
      const valA = String((a as any)[sortColumn] || '').toLowerCase();
      const valB = String((b as any)[sortColumn] || '').toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [overrides, sortColumn, sortAsc]);

  // Pagination state
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [goToPageInput, setGoToPageInput] = useState<string>('1');

  const totalPages = Math.max(1, Math.ceil(sortedOverrides.length / pageSize));
  const currentPage = pageIndex + 1;

  useEffect(() => {
    setGoToPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (pageIndex >= totalPages) {
      setPageIndex(Math.max(0, totalPages - 1));
    }
  }, [totalPages, pageIndex]);

  const pagedOverrides = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedOverrides.slice(start, start + pageSize);
  }, [sortedOverrides, pageIndex, pageSize]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<ConfigurationOverride | null>(null);
  const [deletingOverride, setDeletingOverride] = useState<ConfigurationOverride | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // -------------------------------------------------------------------------
  // Create Override Form State (Matching OWPROV Popover)
  // -------------------------------------------------------------------------
  const [createStartName, setCreateStartName] = useState<string>('radios');
  const [createNameIndex, setCreateNameIndex] = useState<number>(0);
  const [createEndName, setCreateEndName] = useState<'channel' | 'tx-power'>('channel');
  const [createValue, setCreateValue] = useState<string>('1');
  const [createReason, setCreateReason] = useState<string>('');

  const targetCreateParamName = `${createStartName}.${createNameIndex}.${createEndName}`;

  const createDuplicateError = useMemo(() => {
    const exists = overrides.some(
      (o) => (o.source || 'device') === 'device' && o.parameterName.toLowerCase() === targetCreateParamName.toLowerCase(),
    );
    return exists ? `Device override for "${targetCreateParamName}" already exists` : undefined;
  }, [overrides, targetCreateParamName]);

  const createValueError = useMemo(() => {
    if (createEndName === 'tx-power') {
      const num = parseInt(createValue, 10);
      if (isNaN(num) || num < 1 || num > 32) {
        return 'Tx power must be between 1 and 32 dBm';
      }
    }
    if (!createValue && createValue !== '0') {
      return 'Value is required';
    }
    return undefined;
  }, [createEndName, createValue]);

  const handleOpenCreate = () => {
    setCreateStartName('radios');
    setCreateNameIndex(0);
    setCreateEndName('channel');
    setCreateValue('1');
    setCreateReason('');
    setIsCreateOpen(true);
  };

  const handleEndNameChange = (newEnd: 'channel' | 'tx-power') => {
    setCreateEndName(newEnd);
    if (newEnd === 'channel') {
      setCreateValue('1');
    } else {
      setCreateValue('10');
    }
  };

  const handleSaveCreate = async () => {
    if (!device.provTag) {
      toaster.create({
        title: 'Action Blocked',
        description: 'Cannot modify overrides while authoritative inventory is unavailable from OWPROV',
        type: 'error',
      });
      return;
    }
    if (createDuplicateError || createValueError || createReason.length > 64) {
      return;
    }

    const newOverride: ConfigurationOverride = {
      source: 'device',
      parameterName: targetCreateParamName,
      parameterType: createEndName === 'tx-power' ? 'integer' : 'string',
      parameterValue: String(createValue),
      reason: createReason.trim(),
      modified: Math.floor(Date.now() / 1000),
    };

    const nextOverrides = [...overrides, newOverride];
    setOverrides(nextOverrides);
    setIsSaving(true);

    try {
      // OWPROV PUT ...?source=device only accepts overrides for 'device'.
      // Sending other sources causes OWPROV to duplicate them into device-level overrides.
      const deviceOverrides = nextOverrides.filter((o) => (o.source || 'device') === 'device');
      await updateMutation.mutateAsync({
        serialNumber: serial,
        overrides: deviceOverrides,
        source: 'device',
      });
      toaster.create({
        title: 'Override Created',
        description: `Successfully added ${targetCreateParamName}`,
        type: 'success',
      });
      setIsCreateOpen(false);
    } catch (err: any) {
      toaster.create({
        title: 'Failed to Save Override',
        description: err?.message || 'Failed to update configuration overrides on server.',
        type: 'error',
      });
      refetch();
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Edit Override Form State
  // -------------------------------------------------------------------------
  const [editValue, setEditValue] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');

  const handleOpenEdit = (override: ConfigurationOverride) => {
    setEditingOverride(override);
    setEditValue(override.parameterValue);
    setEditReason(override.reason || '');
  };

  const isEditTxPower = editingOverride?.parameterName.endsWith('tx-power');
  const isEditChannel = editingOverride?.parameterName.endsWith('channel');

  const editValueError = useMemo(() => {
    if (isEditTxPower) {
      const num = parseInt(editValue, 10);
      if (isNaN(num) || num < 1 || num > 32) {
        return 'Tx power must be between 1 and 32 dBm';
      }
    }
    if (!editValue && editValue !== '0') {
      return 'Value is required';
    }
    return undefined;
  }, [isEditTxPower, editValue]);

  const handleSaveEdit = async () => {
    if (!device.provTag) {
      toaster.create({
        title: 'Action Blocked',
        description: 'Cannot modify overrides while authoritative inventory is unavailable from OWPROV',
        type: 'error',
      });
      return;
    }
    if (!editingOverride || editValueError || editReason.length > 64) return;

    const targetSource = editingOverride.source || 'device';
    const updatedOverride: ConfigurationOverride = {
      ...editingOverride,
      parameterValue: String(editValue),
      reason: editReason.trim(),
      modified: Math.floor(Date.now() / 1000),
    };

    const nextOverrides = overrides.map((curr) => {
      if (curr.parameterName === editingOverride.parameterName && curr.source === editingOverride.source) {
        return updatedOverride;
      }
      return curr;
    });

    setOverrides(nextOverrides);
    setIsSaving(true);

    try {
      // Send ONLY overrides belonging to targetSource to prevent overwriting other sources
      const sourceOverrides = nextOverrides.filter((o) => (o.source || 'device') === targetSource);
      await updateMutation.mutateAsync({
        serialNumber: serial,
        overrides: sourceOverrides,
        source: targetSource,
      });
      toaster.create({
        title: 'Override Updated',
        description: `Successfully updated ${editingOverride.parameterName}`,
        type: 'success',
      });
      setEditingOverride(null);
    } catch (err: any) {
      toaster.create({
        title: 'Failed to Update Override',
        description: err?.message || 'Server error updating override.',
        type: 'error',
      });
      refetch();
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete Override
  // -------------------------------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deletingOverride) return;
    if (!device.provTag) {
      toaster.create({
        title: 'Action Blocked',
        description: 'Cannot delete overrides while authoritative inventory is unavailable from OWPROV',
        type: 'error',
      });
      return;
    }

    const targetSource = deletingOverride.source || 'device';
    const nextOverrides = overrides.filter(
      (curr) => !(curr.parameterName === deletingOverride.parameterName && curr.source === deletingOverride.source),
    );

    setOverrides(nextOverrides);
    setIsSaving(true);

    try {
      // Send ONLY remaining overrides for targetSource.
      // If none remain (empty array), OWPROV clears all overrides for this source.
      const remainingSourceOverrides = nextOverrides.filter((o) => (o.source || 'device') === targetSource);
      await updateMutation.mutateAsync({
        serialNumber: serial,
        overrides: remainingSourceOverrides,
        source: targetSource,
      });
      toaster.create({
        title: 'Override Removed',
        description: `Deleted ${deletingOverride.parameterName}`,
        type: 'info',
      });
      setDeletingOverride(null);
    } catch (err: any) {
      toaster.create({
        title: 'Failed to Delete Override',
        description: err?.message || 'Server error removing override.',
        type: 'error',
      });
      refetch();
    } finally {
      setIsSaving(false);
    }
  };

  // Source badge color helper
  const getSourceBadge = (source?: string) => {
    const s = (source || 'device').toLowerCase();
    let bg = '#e0f2fe';
    let color = '#0369a1';
    let border = '#bae6fd';

    if (s === 'venue') {
      bg = '#f3e8ff';
      color = '#7e22ce';
      border = '#e9d5ff';
    } else if (s === 'entity') {
      bg = '#ecfdf5';
      color = '#047857';
      border = '#a7f3d0';
    } else if (s === 'csr' || s === 'admin' || s === 'root') {
      bg = '#fef3c7';
      color = '#b45309';
      border = '#fde68a';
    }

    return (
      <Box
        as="span"
        px={2}
        py={0.5}
        borderRadius="4px"
        fontSize="11px"
        fontWeight="600"
        bg={bg}
        color={color}
        border="1px solid"
        borderColor={border}
        textTransform="lowercase"
      >
        {source || 'device'}
      </Box>
    );
  };

  const isColVisible = (colId: string) => !hiddenColumns.includes(colId);

  return (
    <Box p={6}>
      <VStack align="stretch" gap={5}>
        {/* Header Bar */}
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={3}
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
          pb={4}
        >
          <Box>
            <HStack gap={2}>
              <Text fontSize="15px" fontWeight="600" color={themeColors.text.title}>
                Configuration Overrides
              </Text>
              <Box
                as="span"
                px={2}
                py={0.5}
                borderRadius="12px"
                fontSize="11px"
                fontWeight="700"
                bg="#f1f5f9"
                color={themeColors.text.primary}
              >
                {overrides.length}
              </Box>
              {(isLoading || isFetching) && <Spinner size="xs" color={themeColors.brand.primary} />}
            </HStack>
            <Text fontSize="12px" color={themeColors.text.muted} mt={0.5}>
              Hardware and radio overrides applied specifically to this device.
            </Text>
          </Box>

          <HStack gap={2} position="relative">
            {/* Create Override Button matching OWPROV */}
            <Button
              size="sm"
              bg="#3b82f6"
              color="#ffffff"
              _hover={{ bg: '#2563eb' }}
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              disabled={isDisabled || isSaving}
              fontSize="13px"
              fontWeight="600"
              h="34px"
              px={3.5}
              borderRadius="8px"
            >
              Create +
            </Button>

            {/* Column Picker Button (Circular matching OWPROV) */}
            <Box position="relative">
              <Button
                size="sm"
                variant="outline"
                borderColor={themeColors.panel.border}
                bg="#ffffff"
                color={themeColors.text.primary}
                _hover={{ bg: '#f8fafc', borderColor: '#cbd5e1' }}
                onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
                w="34px"
                h="34px"
                p={0}
                borderRadius="50%"
                title="Columns"
              >
                <Icon name="sliders" size={14} />
              </Button>

              {isColumnPickerOpen && (
                <Box
                  position="absolute"
                  right="0"
                  top="100%"
                  mt={1.5}
                  w="200px"
                  bg="#ffffff"
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  borderRadius="8px"
                  boxShadow="0 10px 25px rgba(0,0,0,0.15)"
                  py={1.5}
                  zIndex="1200"
                >
                  <Box px={3} py={1.5} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                    <Text fontSize="11px" fontWeight="700" color={themeColors.text.muted} textTransform="uppercase">
                      Toggle Columns
                    </Text>
                  </Box>
                  {AVAILABLE_COLUMNS.map((col) => {
                    const checked = isColVisible(col.id);
                    return (
                      <Flex
                        key={col.id}
                        px={3}
                        py={1.5}
                        align="center"
                        gap={2.5}
                        fontSize="12px"
                        cursor={col.alwaysShow ? 'not-allowed' : 'pointer'}
                        opacity={col.alwaysShow ? 0.6 : 1}
                        _hover={!col.alwaysShow ? { bg: '#f1f5f9' } : undefined}
                        onClick={() => toggleColumnVisibility(col.id)}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={col.alwaysShow}
                          onChange={() => {}}
                          style={{ cursor: col.alwaysShow ? 'not-allowed' : 'pointer' }}
                        />
                        <Text color={themeColors.text.primary}>{col.label}</Text>
                        {col.alwaysShow && (
                          <Text fontSize="10px" color={themeColors.text.muted} ml="auto">
                            locked
                          </Text>
                        )}
                      </Flex>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Create Configuration Override Popover matching OWPROV screenshot */}
            {isCreateOpen && (
              <>
                {/* Backdrop to close on click outside */}
                <Box
                  position="fixed"
                  inset="0"
                  zIndex="1190"
                  onClick={() => !isSaving && setIsCreateOpen(false)}
                />

                <Box
                  position="absolute"
                  top="100%"
                  right="42px"
                  mt={2}
                  w="340px"
                  bg="#ffffff"
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  borderRadius="8px"
                  boxShadow="0 10px 30px rgba(0,0,0,0.12)"
                  zIndex="1200"
                  overflow="visible"
                >
                  {/* Pointer arrow pointing up to Create + */}
                  <Box
                    position="absolute"
                    top="-6px"
                    right="30px"
                    w="11px"
                    h="11px"
                    bg="#ffffff"
                    transform="rotate(45deg)"
                    borderTop="1px solid"
                    borderLeft="1px solid"
                    borderColor={themeColors.panel.border}
                    zIndex="1"
                  />

                  {/* Header */}
                  <Flex
                    px={4}
                    py={3}
                    borderBottom="1px solid"
                    borderColor="#f1f5f9"
                    justify="space-between"
                    align="center"
                    bg="#ffffff"
                    borderTopRadius="8px"
                  >
                    <Text fontSize="14px" fontWeight="600" color="#334155">
                      Create Configuration Override
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => !isSaving && setIsCreateOpen(false)}
                      w="22px"
                      h="22px"
                      p={0}
                      color="#64748b"
                      _hover={{ color: '#0f172a' }}
                    >
                      <Icon name="x" size={14} />
                    </Button>
                  </Flex>

                  {/* Body */}
                  <Box p={4}>
                    <VStack align="stretch" gap={3.5}>
                      {/* Parameter */}
                      <Box>
                        <Text fontSize="13px" fontWeight="500" color="#334155" mb={1.5}>
                          Parameter
                        </Text>
                        <HStack gap={1.5}>
                          <Box flex={1.2}>
                            <select
                              style={selectStyle}
                              value={createStartName}
                              onChange={(e) => setCreateStartName(e.target.value)}
                            >
                              <option value="radios">radios</option>
                            </select>
                          </Box>
                          <Box w="75px">
                            <select
                              style={selectStyle}
                              value={createNameIndex}
                              onChange={(e) => setCreateNameIndex(Number(e.target.value))}
                            >
                              <option value="0">0</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                            </select>
                          </Box>
                          <Box flex={1.2}>
                            <select
                              style={selectStyle}
                              value={createEndName}
                              onChange={(e) => handleEndNameChange(e.target.value as 'channel' | 'tx-power')}
                            >
                              <option value="channel">channel</option>
                              <option value="tx-power">tx-power</option>
                            </select>
                          </Box>
                        </HStack>
                        {createDuplicateError && (
                          <Text fontSize="11px" color="#dc2626" mt={1} fontWeight="500">
                            {createDuplicateError}
                          </Text>
                        )}
                      </Box>

                      {/* Value */}
                      <Box>
                        <Text fontSize="13px" fontWeight="500" color="#334155" mb={1.5}>
                          Value
                        </Text>
                        {createEndName === 'channel' ? (
                          <Box w="100px">
                            <select
                              style={selectStyle}
                              value={createValue}
                              onChange={(e) => setCreateValue(e.target.value)}
                            >
                              {CHANNEL_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </Box>
                        ) : (
                          <HStack gap={2}>
                            <Input
                              type="number"
                              min={1}
                              max={32}
                              size="sm"
                              value={createValue}
                              onChange={(e) => setCreateValue(e.target.value)}
                              borderColor={createValueError ? '#dc2626' : themeColors.input.border}
                              w="90px"
                              h="36px"
                            />
                            <Text fontSize="12px" color={themeColors.text.secondary}>
                              dBm (Valid range: 1 - 32)
                            </Text>
                          </HStack>
                        )}
                        {createValueError && (
                          <Text fontSize="11px" color="#dc2626" mt={1} fontWeight="500">
                            {createValueError}
                          </Text>
                        )}
                      </Box>

                      {/* Reason */}
                      <Box>
                        <Text fontSize="13px" fontWeight="500" color="#334155" mb={1.5}>
                          Reason
                        </Text>
                        <textarea
                          rows={3}
                          value={createReason}
                          onChange={(e) => setCreateReason(e.target.value)}
                          placeholder=""
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${
                              createReason.length > 64 ? '#dc2626' : themeColors.input.border
                            }`,
                            fontSize: '13px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                          }}
                        />
                        {createReason.length > 64 && (
                          <Text fontSize="11px" color="#dc2626" mt={1}>
                            Reason cannot exceed 64 characters
                          </Text>
                        )}
                      </Box>
                    </VStack>
                  </Box>

                  {/* Footer */}
                  <Flex
                    px={4}
                    py={3}
                    borderTop="1px solid"
                    borderColor="#f1f5f9"
                    justify="center"
                    gap={3}
                    bg="#ffffff"
                    borderBottomRadius="8px"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="#1e293b"
                      color="#0f172a"
                      bg="#ffffff"
                      _hover={{ bg: '#f8fafc' }}
                      borderRadius="20px"
                      px={6}
                      onClick={() => setIsCreateOpen(false)}
                      disabled={isSaving}
                      fontWeight="600"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      bg="#3b82f6"
                      color="#ffffff"
                      _hover={{ bg: '#2563eb' }}
                      borderRadius="20px"
                      px={6}
                      onClick={handleSaveCreate}
                      disabled={
                        Boolean(createDuplicateError) ||
                        Boolean(createValueError) ||
                        createReason.length > 64 ||
                        isSaving
                      }
                      fontWeight="600"
                    >
                      {isSaving ? <Spinner size="xs" mr={1.5} /> : null}
                      Save
                    </Button>
                  </Flex>
                </Box>
              </>
            )}
          </HStack>
        </Flex>

        {/* Table Container */}
        <Box
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="8px"
          overflow="hidden"
          bg="#ffffff"
        >
          <Box overflowX="auto">
            <Box as="table" w="100%" style={{ borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <Box as="thead" bg="#f8fafc" borderBottom="1px solid" borderColor={themeColors.panel.border}>
                <Box as="tr">
                  {isColVisible('source') && (
                    <Box
                      as="th"
                      py={3}
                      px={4}
                      fontSize="11px"
                      fontWeight="700"
                      color={themeColors.text.secondary}
                      textTransform="uppercase"
                      cursor="pointer"
                      userSelect="none"
                      onClick={() => handleHeaderSort('source')}
                    >
                      <HStack gap={1.5}>
                        <Text>Source</Text>
                        {sortColumn === 'source' && (
                          <Text as="span" color={themeColors.brand.primary}>
                            {sortAsc ? '▲' : '▼'}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                  )}

                  {isColVisible('parameterName') && (
                    <Box
                      as="th"
                      py={3}
                      px={4}
                      fontSize="11px"
                      fontWeight="700"
                      color={themeColors.text.secondary}
                      textTransform="uppercase"
                      cursor="pointer"
                      userSelect="none"
                      onClick={() => handleHeaderSort('parameterName')}
                    >
                      <HStack gap={1.5}>
                        <Text>Name</Text>
                        {sortColumn === 'parameterName' && (
                          <Text as="span" color={themeColors.brand.primary}>
                            {sortAsc ? '▲' : '▼'}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                  )}

                  {isColVisible('parameterValue') && (
                    <Box
                      as="th"
                      py={3}
                      px={4}
                      fontSize="11px"
                      fontWeight="700"
                      color={themeColors.text.secondary}
                      textTransform="uppercase"
                      cursor="pointer"
                      userSelect="none"
                      onClick={() => handleHeaderSort('parameterValue')}
                    >
                      <HStack gap={1.5}>
                        <Text>Value</Text>
                        {sortColumn === 'parameterValue' && (
                          <Text as="span" color={themeColors.brand.primary}>
                            {sortAsc ? '▲' : '▼'}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                  )}

                  {isColVisible('reason') && (
                    <Box
                      as="th"
                      py={3}
                      px={4}
                      fontSize="11px"
                      fontWeight="700"
                      color={themeColors.text.secondary}
                      textTransform="uppercase"
                      cursor="pointer"
                      userSelect="none"
                      onClick={() => handleHeaderSort('reason')}
                    >
                      <HStack gap={1.5}>
                        <Text>Reason</Text>
                        {sortColumn === 'reason' && (
                          <Text as="span" color={themeColors.brand.primary}>
                            {sortAsc ? '▲' : '▼'}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                  )}

                  {isColVisible('actions') && (
                    <Box
                      as="th"
                      py={3}
                      px={4}
                      fontSize="11px"
                      fontWeight="700"
                      color={themeColors.text.secondary}
                      textTransform="uppercase"
                      textAlign="right"
                      w="110px"
                    >
                      Actions
                    </Box>
                  )}
                </Box>
              </Box>

              <Box as="tbody">
                {pagedOverrides.length === 0 ? (
                  <Box as="tr">
                    <td
                      colSpan={AVAILABLE_COLUMNS.filter((c) => isColVisible(c.id)).length}
                      style={{ padding: '40px 16px', textAlign: 'center' }}
                    >
                      <VStack gap={2}>
                        <Box color={themeColors.text.muted}>
                          <Icon name="sliders" size={28} />
                        </Box>
                        <Text fontSize="14px" fontWeight="600" color={themeColors.text.primary}>
                          No configuration overrides defined
                        </Text>
                        <Text fontSize="12px" color={themeColors.text.muted} maxW="380px">
                          This device is using inheritances from its parent venue and device templates. Click Create
                          Override to add a channel or power override.
                        </Text>
                        <Button
                          size="xs"
                          mt={2}
                          bg={themeColors.brand.primary}
                          color="#ffffff"
                          _hover={{ bg: themeColors.brand.primaryHover }}
                          onClick={handleOpenCreate}
                          disabled={isDisabled}
                          gap={1}
                        >
                          <Icon name="plus" size={12} />
                          Create Override
                        </Button>
                      </VStack>
                    </td>
                  </Box>
                ) : (
                  pagedOverrides.map((override, idx) => {
                    return (
                      <Box
                        as="tr"
                        key={`${override.source}-${override.parameterName}-${idx}`}
                        borderBottom="1px solid"
                        borderColor={themeColors.panel.divider}
                        _hover={{ bg: '#f8fafc' }}
                      >
                        {isColVisible('source') && (
                          <Box as="td" py={3} px={4} fontSize="13px">
                            {getSourceBadge(override.source)}
                          </Box>
                        )}

                        {isColVisible('parameterName') && (
                          <Box as="td" py={3} px={4}>
                            <Box
                              as="span"
                              px={2}
                              py={1}
                              bg="#f1f5f9"
                              borderRadius="4px"
                              fontFamily="'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace"
                              fontSize="12px"
                              fontWeight="600"
                              color={themeColors.text.title}
                              border="1px solid"
                              borderColor="#e2e8f0"
                            >
                              {override.parameterName}
                            </Box>
                          </Box>
                        )}

                        {isColVisible('parameterValue') && (
                          <Box as="td" py={3} px={4}>
                            <Box
                              as="span"
                              px={2.5}
                              py={0.5}
                              borderRadius="4px"
                              fontFamily="'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace"
                              fontSize="12px"
                              fontWeight="700"
                              bg="#ecfdf5"
                              color="#065f46"
                              border="1px solid"
                              borderColor="#a7f3d0"
                            >
                              {override.parameterValue}
                            </Box>
                          </Box>
                        )}

                        {isColVisible('reason') && (
                          <Box as="td" py={3} px={4} fontSize="13px" color={themeColors.text.primary} maxW="300px">
                            {override.reason ? (
                              <Text truncate title={override.reason}>
                                {override.reason}
                              </Text>
                            ) : (
                              <Text color={themeColors.text.muted} fontStyle="italic">
                                -
                              </Text>
                            )}
                          </Box>
                        )}

                        {isColVisible('actions') && (
                          <Box as="td" py={3} px={4} textAlign="right">
                            <HStack gap={1.5} justify="flex-end">
                              <Button
                                size="xs"
                                variant="outline"
                                borderColor={themeColors.panel.border}
                                color={themeColors.text.primary}
                                bg="#ffffff"
                                _hover={{ bg: '#f1f5f9', borderColor: '#2563eb', color: '#2563eb' }}
                                onClick={() => handleOpenEdit(override)}
                                disabled={isDisabled || isSaving}
                                title="Edit override"
                                w="28px"
                                h="28px"
                                p={0}
                              >
                                <Icon name="edit" size={13} />
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                borderColor="#fee2e2"
                                color="#dc2626"
                                bg="#ffffff"
                                _hover={{ bg: '#fee2e2', borderColor: '#dc2626' }}
                                onClick={() => setDeletingOverride(override)}
                                disabled={isDisabled || isSaving}
                                title="Delete override"
                                w="28px"
                                h="28px"
                                p={0}
                              >
                                <Icon name="trash" size={13} />
                              </Button>
                            </HStack>
                          </Box>
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </Box>

          {/* Pagination Controls */}
          {overrides.length > 0 && (
            <Flex
              py={3}
              px={4}
              borderTop="1px solid"
              borderColor={themeColors.panel.border}
              bg="#ffffff"
              align="center"
              justify="space-between"
              wrap="wrap"
              gap={3}
              fontSize="12px"
              color={themeColors.text.secondary}
            >
              {/* Left Navigation: First & Prev */}
              <HStack gap={1}>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor={themeColors.panel.border}
                  color={pageIndex > 0 ? themeColors.text.primary : themeColors.text.muted}
                  bg={pageIndex > 0 ? '#ffffff' : '#f8fafc'}
                  _hover={pageIndex > 0 ? { bg: '#f1f5f9', borderColor: '#cbd5e1' } : undefined}
                  disabled={pageIndex <= 0 || isDisabled}
                  onClick={() => setPageIndex(0)}
                  title="First page"
                  w="30px"
                  h="28px"
                  p={0}
                  borderRadius="6px"
                >
                  <Icon name="chevronsLeft" size={13} />
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor={themeColors.panel.border}
                  color={pageIndex > 0 ? themeColors.text.primary : themeColors.text.muted}
                  bg={pageIndex > 0 ? '#ffffff' : '#f8fafc'}
                  _hover={pageIndex > 0 ? { bg: '#f1f5f9', borderColor: '#cbd5e1' } : undefined}
                  disabled={pageIndex <= 0 || isDisabled}
                  onClick={() => setPageIndex(pageIndex - 1)}
                  title="Previous page"
                  w="30px"
                  h="28px"
                  p={0}
                  borderRadius="6px"
                >
                  <Icon name="chevronLeft" size={13} />
                </Button>
              </HStack>

              {/* Middle Section: Page indicator, Go to Page, and Page Size Select */}
              <HStack gap={4} wrap="wrap" justify="center">
                <Text fontSize="12px">
                  Page{' '}
                  <Text as="span" fontWeight="700" color={themeColors.text.title}>
                    {currentPage}
                  </Text>{' '}
                  of{' '}
                  <Text as="span" fontWeight="700" color={themeColors.text.title}>
                    {totalPages}
                  </Text>
                </Text>

                <HStack gap={1.5}>
                  <Text fontSize="12px">Go to page</Text>
                  <Input
                    size="xs"
                    w="50px"
                    h="26px"
                    textAlign="center"
                    value={goToPageInput}
                    onChange={(e) => setGoToPageInput(e.target.value)}
                    onBlur={() => {
                      const parsed = parseInt(goToPageInput, 10);
                      if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
                        setPageIndex(parsed - 1);
                      } else {
                        setGoToPageInput(String(currentPage));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const parsed = parseInt(goToPageInput, 10);
                        if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
                          setPageIndex(parsed - 1);
                        } else {
                          setGoToPageInput(String(currentPage));
                        }
                      }
                    }}
                    disabled={isDisabled || totalPages <= 1}
                    borderColor={themeColors.input.border}
                    borderRadius="4px"
                    fontSize="12px"
                  />
                </HStack>

                <HStack gap={1.5}>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPageIndex(0);
                    }}
                    disabled={isDisabled}
                    style={{
                      fontSize: '12px',
                      height: '26px',
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      borderRadius: '4px',
                      border: `1px solid ${themeColors.input.border}`,
                      backgroundColor: '#ffffff',
                      color: themeColors.text.primary,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </HStack>
              </HStack>

              {/* Right Navigation: Next & Last */}
              <HStack gap={1}>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor={themeColors.panel.border}
                  color={pageIndex < totalPages - 1 ? themeColors.text.primary : themeColors.text.muted}
                  bg={pageIndex < totalPages - 1 ? '#ffffff' : '#f8fafc'}
                  _hover={pageIndex < totalPages - 1 ? { bg: '#f1f5f9', borderColor: '#cbd5e1' } : undefined}
                  disabled={pageIndex >= totalPages - 1 || isDisabled}
                  onClick={() => setPageIndex(pageIndex + 1)}
                  title="Next page"
                  w="30px"
                  h="28px"
                  p={0}
                  borderRadius="6px"
                >
                  <Icon name="chevronRight" size={13} />
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor={themeColors.panel.border}
                  color={pageIndex < totalPages - 1 ? themeColors.text.primary : themeColors.text.muted}
                  bg={pageIndex < totalPages - 1 ? '#ffffff' : '#f8fafc'}
                  _hover={pageIndex < totalPages - 1 ? { bg: '#f1f5f9', borderColor: '#cbd5e1' } : undefined}
                  disabled={pageIndex >= totalPages - 1 || isDisabled}
                  onClick={() => setPageIndex(totalPages - 1)}
                  title="Last page"
                  w="30px"
                  h="28px"
                  p={0}
                  borderRadius="6px"
                >
                  <Icon name="chevronsRight" size={13} />
                </Button>
              </HStack>
            </Flex>
          )}
        </Box>
      </VStack>

      {/* =================================================================== */}
      {/* Edit Override Modal                                                */}
      {/* =================================================================== */}
      {editingOverride && (
        <Box
          position="fixed"
          inset="0"
          bg="rgba(5, 12, 23, 0.54)"
          display="grid"
          placeItems="center"
          zIndex="1300"
          p={4}
          onClick={() => !isSaving && setEditingOverride(null)}
        >
          <Box
            w="min(460px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.25)"
            overflow="hidden"
            border="1px solid"
            borderColor={themeColors.panel.border}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <Flex
              px={5}
              py={3.5}
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
              justify="space-between"
              align="center"
              bg="#f8fafc"
            >
              <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                Edit Configuration Override
              </Text>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => !isSaving && setEditingOverride(null)}
                w="26px"
                h="26px"
                p={0}
              >
                <Icon name="x" size={16} />
              </Button>
            </Flex>

            {/* Body */}
            <Box p={5}>
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text style={labelStyle}>Parameter Name</Text>
                  <Box
                    p={2}
                    bg="#f1f5f9"
                    borderRadius="6px"
                    fontFamily="'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace"
                    fontSize="13px"
                    fontWeight="600"
                    color={themeColors.text.title}
                    border="1px solid"
                    borderColor="#e2e8f0"
                  >
                    {editingOverride.parameterName}
                  </Box>
                </Box>

                <Box>
                  <Text style={labelStyle}>Source</Text>
                  <Box>{getSourceBadge(editingOverride.source)}</Box>
                </Box>

                <Box>
                  <Text style={labelStyle}>Parameter Type</Text>
                  <Box
                    as="span"
                    px={2}
                    py={0.5}
                    borderRadius="4px"
                    fontSize="11px"
                    fontWeight="600"
                    bg="#f1f5f9"
                    color={themeColors.text.primary}
                    border="1px solid"
                    borderColor="#cbd5e1"
                  >
                    {editingOverride.parameterType || 'string'}
                  </Box>
                </Box>

                <Box>
                  <Text style={labelStyle}>Value</Text>
                  {isEditChannel ? (
                    <select
                      style={selectStyle}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    >
                      {CHANNEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : isEditTxPower ? (
                    <HStack gap={2}>
                      <Input
                        type="number"
                        min={1}
                        max={32}
                        size="sm"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        borderColor={editValueError ? '#dc2626' : themeColors.input.border}
                        w="120px"
                      />
                      <Text fontSize="12px" color={themeColors.text.secondary}>
                        dBm (Valid range: 1 - 32)
                      </Text>
                    </HStack>
                  ) : (
                    <Input
                      size="sm"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      borderColor={editValueError ? '#dc2626' : themeColors.input.border}
                    />
                  )}
                  {editValueError && (
                    <Text fontSize="11px" color="#dc2626" mt={1} fontWeight="500">
                      {editValueError}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text style={labelStyle}>Reason</Text>
                    <Text
                      fontSize="11px"
                      color={editReason.length > 64 ? '#dc2626' : themeColors.text.muted}
                    >
                      {editReason.length}/64
                    </Text>
                  </Flex>
                  <textarea
                    rows={2}
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Reason for overriding"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${
                        editReason.length > 64 ? '#dc2626' : themeColors.input.border
                      }`,
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                  {editReason.length > 64 && (
                    <Text fontSize="11px" color="#dc2626" mt={1}>
                      Reason cannot exceed 64 characters
                    </Text>
                  )}
                </Box>
              </VStack>
            </Box>

            {/* Footer */}
            <Flex
              px={5}
              py={3.5}
              borderTop="1px solid"
              borderColor={themeColors.panel.divider}
              justify="flex-end"
              gap={2}
              bg="#f8fafc"
            >
              <Button
                size="sm"
                variant="outline"
                borderColor={themeColors.panel.border}
                onClick={() => setEditingOverride(null)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                bg={themeColors.brand.primary}
                color="#ffffff"
                _hover={{ bg: themeColors.brand.primaryHover }}
                onClick={handleSaveEdit}
                disabled={Boolean(editValueError) || editReason.length > 64 || isSaving}
              >
                {isSaving ? <Spinner size="xs" mr={1.5} /> : null}
                Save Changes
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* =================================================================== */}
      {/* Delete Confirmation Dialog                                         */}
      {/* =================================================================== */}
      {deletingOverride && (
        <Box
          position="fixed"
          inset="0"
          bg="rgba(5, 12, 23, 0.54)"
          display="grid"
          placeItems="center"
          zIndex="1300"
          p={4}
          onClick={() => !isSaving && setDeletingOverride(null)}
        >
          <Box
            w="min(440px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.25)"
            overflow="hidden"
            border="1px solid"
            borderColor={themeColors.panel.border}
            onClick={(e) => e.stopPropagation()}
          >
            <Box p={6}>
              <HStack gap={3.5} align="flex-start">
                <Flex
                  w="38px"
                  h="38px"
                  borderRadius="50%"
                  bg="#fee2e2"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon name="trash" size={18} color="#dc2626" />
                </Flex>
                <Box>
                  <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                    Delete Configuration Override
                  </Text>
                  <Text fontSize="13px" color={themeColors.text.secondary} mt={1.5}>
                    Are you sure you want to delete the configuration override for{' '}
                    <Text as="span" fontWeight="700" color={themeColors.text.title}>
                      "{deletingOverride.parameterName}"
                    </Text>
                    ?
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Flex
              px={5}
              py={3.5}
              borderTop="1px solid"
              borderColor={themeColors.panel.divider}
              justify="flex-end"
              gap={2}
              bg="#f8fafc"
            >
              <Button
                size="sm"
                variant="outline"
                borderColor={themeColors.panel.border}
                onClick={() => setDeletingOverride(null)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                bg="#dc2626"
                color="#ffffff"
                _hover={{ bg: '#b91c1c' }}
                onClick={handleConfirmDelete}
                disabled={isSaving}
              >
                {isSaving ? <Spinner size="xs" mr={1.5} /> : null}
                Delete
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default OverridesSubTab;
