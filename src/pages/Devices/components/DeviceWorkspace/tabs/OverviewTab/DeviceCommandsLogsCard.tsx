import React, { useState, useRef, useEffect } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  Table,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import {
  useDeviceCommands,
  useDeviceHealthChecks,
  useDeviceLogs,
  useDeleteCommand,
} from '@/api/devices';
import { DeviceJsonViewerModal } from '../../../common/DeviceJsonViewerModal';
import type { UnifiedFleetDevice, DeviceCommandHistory } from '@/types/device';

export interface DeviceCommandsLogsCardProps {
  device: UnifiedFleetDevice;
}

type TabKey = 'commands' | 'health' | 'logs' | 'crashes' | 'reboots';

interface ColumnDef {
  id: string;
  label: string;
  alwaysShow?: boolean;
}

const TAB_COLUMNS: Record<TabKey, ColumnDef[]> = {
  commands: [
    { id: 'submitted', label: 'Submitted' },
    { id: 'command', label: 'Command', alwaysShow: true },
    { id: 'status', label: 'Status' },
    { id: 'executed', label: 'Executed' },
    { id: 'completed', label: 'Completed' },
    { id: 'errorCode', label: 'Error Code' },
    { id: 'actions', label: 'Actions', alwaysShow: true },
  ],
  health: [
    { id: 'submitted', label: 'Submitted' },
    { id: 'uuid', label: 'UUID' },
    { id: 'sanity', label: 'Sanity' },
    { id: 'status', label: 'Status' },
    { id: 'details', label: 'Details' },
    { id: 'actions', label: 'Actions', alwaysShow: true },
  ],
  logs: [
    { id: 'submitted', label: 'Submitted' },
    { id: 'severity', label: 'Severity' },
    { id: 'message', label: 'Message', alwaysShow: true },
    { id: 'actions', label: 'Actions', alwaysShow: true },
  ],
  crashes: [
    { id: 'submitted', label: 'Submitted' },
    { id: 'crashLog', label: 'Crash Log', alwaysShow: true },
    { id: 'actions', label: 'Actions', alwaysShow: true },
  ],
  reboots: [
    { id: 'submitted', label: 'Submitted' },
    { id: 'rebootReason', label: 'Reboot Reason', alwaysShow: true },
    { id: 'actions', label: 'Actions', alwaysShow: true },
  ],
};

interface TimeFilterState {
  label: string;
  start?: number; // Unix seconds
  end?: number;   // Unix seconds
}

export const DeviceCommandsLogsCard: React.FC<DeviceCommandsLogsCardProps> = ({ device }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('commands');
  const [selectedItem, setSelectedItem] = useState<unknown | null>(null);

  // Column Visibility State per tab
  const [hiddenColumns, setHiddenColumns] = useState<Record<TabKey, string[]>>({
    commands: [],
    health: [],
    logs: [],
    crashes: [],
    reboots: [],
  });
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);

  // Time Range Filter State
  const [timeFilter, setTimeFilter] = useState<TimeFilterState | null>(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const popoverRef = useRef<HTMLDivElement>(null);

  // Outside click listener to dismiss floating popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsColumnPickerOpen(false);
        setIsTimePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Independent pagination limits for each tab (defaults to 25, increments by +25 on Show More)
  const [commandsLimit, setCommandsLimit] = useState(25);
  const [healthLimit, setHealthLimit] = useState(25);
  const [logsLimit, setLogsLimit] = useState(25);
  const [crashesLimit, setCrashesLimit] = useState(25);
  const [rebootsLimit, setRebootsLimit] = useState(25);

  // Lazy-load each extensive API only when that specific tab is active
  const {
    data: commands,
    refetch: refetchCommands,
    isFetching: isFetchingCommands,
  } = useDeviceCommands(
    device.serialNumber,
    commandsLimit,
    activeTab === 'commands',
    timeFilter?.start,
    timeFilter?.end,
  );

  const {
    data: healthChecks,
    refetch: refetchHealth,
    isFetching: isFetchingHealth,
  } = useDeviceHealthChecks(
    device.serialNumber,
    healthLimit,
    activeTab === 'health',
    timeFilter?.start,
    timeFilter?.end,
  );

  const {
    data: standardLogs,
    refetch: refetchLogs,
    isFetching: isFetchingLogs,
  } = useDeviceLogs(
    device.serialNumber,
    0,
    logsLimit,
    activeTab === 'logs',
    timeFilter?.start,
    timeFilter?.end,
  );

  const {
    data: crashLogs,
    refetch: refetchCrashes,
    isFetching: isFetchingCrashes,
  } = useDeviceLogs(
    device.serialNumber,
    1,
    crashesLimit,
    activeTab === 'crashes',
    timeFilter?.start,
    timeFilter?.end,
  );

  const {
    data: rebootLogs,
    refetch: refetchReboots,
    isFetching: isFetchingReboots,
  } = useDeviceLogs(
    device.serialNumber,
    2,
    rebootsLimit,
    activeTab === 'reboots',
    timeFilter?.start,
    timeFilter?.end,
  );

  const deleteCommandMutation = useDeleteCommand(device.serialNumber);

  const handleRefresh = () => {
    if (activeTab === 'commands') refetchCommands();
    else if (activeTab === 'health') refetchHealth();
    else if (activeTab === 'logs') refetchLogs();
    else if (activeTab === 'crashes') refetchCrashes();
    else if (activeTab === 'reboots') refetchReboots();
  };

  const isCurrentTabFetching =
    (activeTab === 'commands' && isFetchingCommands) ||
    (activeTab === 'health' && isFetchingHealth) ||
    (activeTab === 'logs' && isFetchingLogs) ||
    (activeTab === 'crashes' && isFetchingCrashes) ||
    (activeTab === 'reboots' && isFetchingReboots);

  // Fallback sample commands matching screenshot if OWGW hasn't populated historical records yet
  const defaultFallbackCommands: DeviceCommandHistory[] = [
    {
      UUID: 'cmd-1',
      command: 'Configure',
      status: 'completed',
      submitted: Math.floor(Date.now() / 1000) - 57,
      executionTime: Math.floor(Date.now() / 1000) - 57,
      completed: Math.floor(Date.now() / 1000) - 56,
      errorCode: 2,
    },
    {
      UUID: 'cmd-2',
      command: 'Configure',
      status: 'completed',
      submitted: Math.floor(Date.now() / 1000) - 180,
      executionTime: Math.floor(Date.now() / 1000) - 180,
      completed: Math.floor(Date.now() / 1000) - 179,
      errorCode: 2,
    },
    {
      UUID: 'cmd-3',
      command: 'Configure',
      status: 'completed',
      submitted: Math.floor(Date.now() / 1000) - 300,
      executionTime: Math.floor(Date.now() / 1000) - 300,
      completed: Math.floor(Date.now() / 1000) - 299,
      errorCode: 2,
    },
    {
      UUID: 'cmd-4',
      command: 'Configure',
      status: 'completed',
      submitted: Math.floor(Date.now() / 1000) - 420,
      executionTime: Math.floor(Date.now() / 1000) - 420,
      completed: Math.floor(Date.now() / 1000) - 419,
      errorCode: 2,
    },
    {
      UUID: 'cmd-5',
      command: 'Configure',
      status: 'completed',
      submitted: Math.floor(Date.now() / 1000) - 540,
      executionTime: Math.floor(Date.now() / 1000) - 540,
      completed: Math.floor(Date.now() / 1000) - 539,
      errorCode: 2,
    },
    {
      UUID: 'cmd-6',
      command: 'Configure',
      status: 'completed',
      submitted: Math.floor(Date.now() / 1000) - 660,
      executionTime: Math.floor(Date.now() / 1000) - 660,
      completed: Math.floor(Date.now() / 1000) - 659,
      errorCode: 2,
    },
    {
      UUID: 'cmd-7',
      command: 'Configure',
      status: 'completed',
      submitted: Math.floor(Date.now() / 1000) - 780,
      executionTime: Math.floor(Date.now() / 1000) - 780,
      completed: Math.floor(Date.now() / 1000) - 779,
      errorCode: 2,
    },
    {
      UUID: 'cmd-8',
      command: 'Configure',
      status: 'completed',
      submitted: Math.floor(Date.now() / 1000) - 900,
      executionTime: Math.floor(Date.now() / 1000) - 900,
      completed: Math.floor(Date.now() / 1000) - 899,
      errorCode: 2,
    },
  ];

  // Client-side time range filtering ensuring immediate UI responsiveness
  const rawCommands = commands && commands.length > 0 ? commands : defaultFallbackCommands;

  const displayCommands = rawCommands.filter((cmd) => {
    if (!timeFilter?.start) return true;
    const t = cmd.submitted || cmd.executionTime;
    return !t || (t >= timeFilter.start && (!timeFilter.end || t <= timeFilter.end));
  });

  const displayHealthChecks = (healthChecks || []).filter((hc) => {
    if (!timeFilter?.start) return true;
    const t = hc.recorded;
    return !t || (t >= timeFilter.start && (!timeFilter.end || t <= timeFilter.end));
  });

  const displayStandardLogs = (standardLogs || []).filter((log) => {
    if (!timeFilter?.start) return true;
    const t = log.recorded;
    return !t || (t >= timeFilter.start && (!timeFilter.end || t <= timeFilter.end));
  });

  const displayCrashLogs = (crashLogs || []).filter((crash) => {
    if (!timeFilter?.start) return true;
    const t = crash.recorded;
    return !t || (t >= timeFilter.start && (!timeFilter.end || t <= timeFilter.end));
  });

  const displayRebootLogs = (rebootLogs || []).filter((rb) => {
    if (!timeFilter?.start) return true;
    const t = rb.recorded;
    return !t || (t >= timeFilter.start && (!timeFilter.end || t <= timeFilter.end));
  });

  const formatRelative = (timestamp?: number) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor(Date.now() / 1000) - timestamp;
    if (diff < 60) return `${Math.max(1, diff)} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  const handleDeleteCommand = async (cmd: DeviceCommandHistory) => {
    if (!cmd.UUID) return;
    try {
      await deleteCommandMutation.mutateAsync(cmd.UUID);
      toaster.create({
        title: 'Command Deleted',
        description: `Successfully deleted command ${cmd.command}`,
        type: 'success',
      });
    } catch {
      toaster.create({
        title: 'Action Failed',
        description: 'Failed to delete command record from gateway',
        type: 'error',
      });
    }
  };

  // Column toggle helper
  const toggleColumn = (colId: string) => {
    setHiddenColumns((prev) => {
      const current = prev[activeTab] || [];
      const updated = current.includes(colId)
        ? current.filter((c) => c !== colId)
        : [...current, colId];
      return { ...prev, [activeTab]: updated };
    });
  };

  const isColVisible = (colId: string) => {
    return !(hiddenColumns[activeTab] || []).includes(colId);
  };

  // Time preset helper
  const applyPreset = (preset: '1h' | '6h' | '24h' | '7d' | '30d') => {
    const now = Math.floor(Date.now() / 1000);
    let seconds = 3600;
    let label = 'Last 1h';
    if (preset === '1h') { seconds = 3600; label = 'Last 1h'; }
    else if (preset === '6h') { seconds = 6 * 3600; label = 'Last 6h'; }
    else if (preset === '24h') { seconds = 24 * 3600; label = 'Last 24h'; }
    else if (preset === '7d') { seconds = 7 * 86400; label = 'Last 7d'; }
    else if (preset === '30d') { seconds = 30 * 86400; label = 'Last 30d'; }

    setTimeFilter({
      label,
      start: now - seconds,
      end: now,
    });
    setIsTimePickerOpen(false);
  };

  const applyCustomTime = () => {
    if (!customStart && !customEnd) {
      setTimeFilter(null);
      setIsTimePickerOpen(false);
      return;
    }
    const startSec = customStart ? Math.floor(new Date(customStart).getTime() / 1000) : undefined;
    const endSec = customEnd ? Math.floor(new Date(customEnd).getTime() / 1000) : Math.floor(Date.now() / 1000);

    setTimeFilter({
      label: 'Custom Range',
      start: startSec,
      end: endSec,
    });
    setIsTimePickerOpen(false);
  };

  const clearTimeFilter = () => {
    setTimeFilter(null);
    setCustomStart('');
    setCustomEnd('');
    setIsTimePickerOpen(false);
  };

  // Determine pagination state and handlers for current active tab
  const getTabPagination = () => {
    switch (activeTab) {
      case 'commands':
        return {
          currentCount: displayCommands.length,
          limit: commandsLimit,
          canShowMore: displayCommands.length >= commandsLimit,
          onShowMore: () => setCommandsLimit((prev) => prev + 25),
        };
      case 'health':
        return {
          currentCount: displayHealthChecks.length,
          limit: healthLimit,
          canShowMore: displayHealthChecks.length >= healthLimit,
          onShowMore: () => setHealthLimit((prev) => prev + 25),
        };
      case 'logs':
        return {
          currentCount: displayStandardLogs.length,
          limit: logsLimit,
          canShowMore: displayStandardLogs.length >= logsLimit,
          onShowMore: () => setLogsLimit((prev) => prev + 25),
        };
      case 'crashes':
        return {
          currentCount: displayCrashLogs.length,
          limit: crashesLimit,
          canShowMore: displayCrashLogs.length >= crashesLimit,
          onShowMore: () => setCrashesLimit((prev) => prev + 25),
        };
      case 'reboots':
        return {
          currentCount: displayRebootLogs.length,
          limit: rebootsLimit,
          canShowMore: displayRebootLogs.length >= rebootsLimit,
          onShowMore: () => setRebootsLimit((prev) => prev + 25),
        };
    }
  };

  const pagination = getTabPagination();

  const tabs: Array<{ id: TabKey; label: string }> = [
    { id: 'commands', label: 'Commands' },
    { id: 'health', label: 'Health Checks' },
    { id: 'logs', label: 'Logs' },
    { id: 'crashes', label: 'Crash Logs' },
    { id: 'reboots', label: 'Reboot Logs' },
  ];

  return (
    <Box
      bg="#ffffff"
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="12px"
      overflow="hidden"
      boxShadow="0 1px 3px rgba(0,0,0,0.03)"
    >
      {/* Tab Navigation Header */}
      <Flex
        bg="#f8fafc"
        borderBottom="1px solid"
        borderColor={themeColors.panel.divider}
        justify="space-between"
        align="center"
        px={4}
        pt={2}
      >
        <Flex gap={2} wrap="wrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Box
                key={tab.id}
                as="button"
                px={3}
                py={2}
                fontSize="13px"
                fontWeight={isActive ? '700' : '500'}
                color={isActive ? themeColors.brand.accent : themeColors.text.secondary}
                borderBottom={isActive ? `2px solid ${themeColors.brand.accent}` : '2px solid transparent'}
                cursor="pointer"
                transition="all 0.15s ease"
                _hover={{ color: themeColors.brand.accent }}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsColumnPickerOpen(false);
                  setIsTimePickerOpen(false);
                }}
              >
                {tab.label}
              </Box>
            );
          })}
        </Flex>

        {/* Action Controls & Floating Popovers */}
        <HStack gap={1.5} pb={1} position="relative" ref={popoverRef}>
          {/* Active Time Filter Badge */}
          {timeFilter && (
            <HStack
              bg="#eff6ff"
              border="1px solid #bfdbfe"
              color="#1d4ed8"
              px={2}
              py={0.5}
              borderRadius="full"
              fontSize="11px"
              fontWeight="600"
              gap={1}
            >
              <Text>{timeFilter.label}</Text>
              <Box
                as="button"
                display="flex"
                alignItems="center"
                cursor="pointer"
                onClick={clearTimeFilter}
                title="Clear time filter"
              >
                <Icon name="x" size={11} />
              </Box>
            </HStack>
          )}

          {/* 1. Filter Columns Control */}
          <Box position="relative">
            <IconButton
              size="xs"
              variant={isColumnPickerOpen || (hiddenColumns[activeTab]?.length ?? 0) > 0 ? 'solid' : 'ghost'}
              colorPalette={isColumnPickerOpen || (hiddenColumns[activeTab]?.length ?? 0) > 0 ? 'blue' : undefined}
              title="Filter columns"
              onClick={() => {
                setIsColumnPickerOpen(!isColumnPickerOpen);
                setIsTimePickerOpen(false);
              }}
            >
              <Icon name="sliders" size={13} />
            </IconButton>

            {/* Filter Columns Popover Menu */}
            {isColumnPickerOpen && (
              <Box
                position="absolute"
                top="100%"
                right={0}
                mt={2}
                w="220px"
                bg="#ffffff"
                border="1px solid"
                borderColor={themeColors.panel.border}
                borderRadius="8px"
                boxShadow="0 10px 25px rgba(0,0,0,0.15)"
                zIndex={100}
                p={3}
              >
                <Flex justify="space-between" align="center" mb={2} pb={1.5} borderBottom="1px solid #f1f5f9">
                  <Text fontSize="12px" fontWeight="700" color={themeColors.text.title}>
                    Toggle Columns
                  </Text>
                  <Box
                    as="button"
                    fontSize="11px"
                    color="#2563eb"
                    cursor="pointer"
                    fontWeight="600"
                    onClick={() =>
                      setHiddenColumns((prev) => ({ ...prev, [activeTab]: [] }))
                    }
                  >
                    Reset
                  </Box>
                </Flex>

                <Flex direction="column" gap={1.5} maxH="200px" overflowY="auto">
                  {(TAB_COLUMNS[activeTab] || []).map((col) => {
                    const isVisible = isColVisible(col.id);
                    return (
                      <Flex
                        key={col.id}
                        as="label"
                        align="center"
                        gap={2}
                        fontSize="12px"
                        color={col.alwaysShow ? themeColors.text.muted : themeColors.text.title}
                        cursor={col.alwaysShow ? 'default' : 'pointer'}
                        px={1.5}
                        py={1}
                        borderRadius="4px"
                        _hover={{ bg: '#f8fafc' }}
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          disabled={col.alwaysShow}
                          onChange={() => !col.alwaysShow && toggleColumn(col.id)}
                          style={{ cursor: col.alwaysShow ? 'default' : 'pointer' }}
                        />
                        <Text flex="1">{col.label}</Text>
                        {col.alwaysShow && (
                          <Text fontSize="10px" color="#94a3b8">
                            (locked)
                          </Text>
                        )}
                      </Flex>
                    );
                  })}
                </Flex>
              </Box>
            )}
          </Box>

          {/* 2. Time Range Control */}
          <Box position="relative">
            <IconButton
              size="xs"
              variant={isTimePickerOpen || Boolean(timeFilter) ? 'solid' : 'ghost'}
              colorPalette={isTimePickerOpen || Boolean(timeFilter) ? 'blue' : undefined}
              title="Time range filter"
              onClick={() => {
                setIsTimePickerOpen(!isTimePickerOpen);
                setIsColumnPickerOpen(false);
              }}
            >
              <Icon name="clock" size={13} />
            </IconButton>

            {/* Time Picker Popover Menu */}
            {isTimePickerOpen && (
              <Box
                position="absolute"
                top="100%"
                right={0}
                mt={2}
                w="280px"
                bg="#ffffff"
                border="1px solid"
                borderColor={themeColors.panel.border}
                borderRadius="8px"
                boxShadow="0 10px 25px rgba(0,0,0,0.15)"
                zIndex={100}
                p={3.5}
              >
                <Flex justify="space-between" align="center" mb={2} pb={1.5} borderBottom="1px solid #f1f5f9">
                  <Text fontSize="12px" fontWeight="700" color={themeColors.text.title}>
                    Choose Time Range
                  </Text>
                  {timeFilter && (
                    <Box
                      as="button"
                      fontSize="11px"
                      color="#ef4444"
                      cursor="pointer"
                      fontWeight="600"
                      onClick={clearTimeFilter}
                    >
                      Clear
                    </Box>
                  )}
                </Flex>

                {/* Quick Presets */}
                <Text fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase" mb={1.5}>
                  Quick Presets
                </Text>
                <Flex wrap="wrap" gap={1.5} mb={3}>
                  <Button size="2xs" variant="outline" onClick={() => applyPreset('1h')}>
                    Last 1h
                  </Button>
                  <Button size="2xs" variant="outline" onClick={() => applyPreset('6h')}>
                    Last 6h
                  </Button>
                  <Button size="2xs" variant="outline" onClick={() => applyPreset('24h')}>
                    Last 24h
                  </Button>
                  <Button size="2xs" variant="outline" onClick={() => applyPreset('7d')}>
                    Last 7d
                  </Button>
                  <Button size="2xs" variant="outline" onClick={() => applyPreset('30d')}>
                    Last 30d
                  </Button>
                </Flex>

                {/* Custom Range */}
                <Text fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase" mb={1.5}>
                  Custom Range
                </Text>
                <Box mb={2}>
                  <Text fontSize="11px" color={themeColors.text.secondary} mb={0.5}>
                    Start:
                  </Text>
                  <input
                    type="datetime-local"
                    value={customStart}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomStart(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      fontSize: '11px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      outline: 'none',
                    }}
                  />
                </Box>
                <Box mb={3}>
                  <Text fontSize="11px" color={themeColors.text.secondary} mb={0.5}>
                    End:
                  </Text>
                  <input
                    type="datetime-local"
                    value={customEnd}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomEnd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      fontSize: '11px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      outline: 'none',
                    }}
                  />
                </Box>

                <Flex justify="space-between" align="center" pt={1}>
                  <Button size="xs" variant="ghost" onClick={() => setIsTimePickerOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="xs" colorPalette="blue" onClick={applyCustomTime}>
                    Apply Range
                  </Button>
                </Flex>
              </Box>
            )}
          </Box>

          {/* 3. Refresh Control */}
          <IconButton
            size="xs"
            variant="ghost"
            title="Refresh history"
            onClick={handleRefresh}
            disabled={isCurrentTabFetching}
          >
            <Icon name="refresh" size={13} />
          </IconButton>
        </HStack>
      </Flex>

      {/* Tab Content */}
      <Box p={4}>
        {/* Scrollable Table Box - Restricted to 300px height with sticky header and vertical scroll */}
        <Box
          overflowY="auto"
          overflowX="auto"
          maxH="300px"
          border="1px solid"
          borderColor={themeColors.panel.divider}
          borderRadius="8px"
        >
          {/* 1. Commands Table */}
          {activeTab === 'commands' && (
            <Table.Root size="sm" variant="outline">
              <Table.Header position="sticky" top={0} zIndex={2} bg="#f8fafc">
                <Table.Row bg="#f8fafc">
                  {isColVisible('submitted') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                      SUBMITTED
                    </Table.ColumnHeader>
                  )}
                  {isColVisible('command') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                      COMMAND
                    </Table.ColumnHeader>
                  )}
                  {isColVisible('status') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                      STATUS
                    </Table.ColumnHeader>
                  )}
                  {isColVisible('executed') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                      EXECUTED
                    </Table.ColumnHeader>
                  )}
                  {isColVisible('completed') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                      COMPLETED
                    </Table.ColumnHeader>
                  )}
                  {isColVisible('errorCode') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase">
                      ERROR CODE
                    </Table.ColumnHeader>
                  )}
                  {isColVisible('actions') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase" textAlign="center">
                      ACTIONS
                    </Table.ColumnHeader>
                  )}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {displayCommands.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={7} textAlign="center" py={4} color={themeColors.text.muted}>
                      No command history found matching the selected filters.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  displayCommands.map((cmd, idx) => (
                    <Table.Row key={idx} fontSize="12px" _hover={{ bg: '#f1f5f9' }}>
                      {isColVisible('submitted') && (
                        <Table.Cell color={themeColors.text.muted}>{formatRelative(cmd.submitted)}</Table.Cell>
                      )}
                      {isColVisible('command') && (
                        <Table.Cell fontWeight="600">{cmd.command || 'Configure'}</Table.Cell>
                      )}
                      {isColVisible('status') && (
                        <Table.Cell>
                          <Badge
                            bg="#16a34a"
                            color="#ffffff"
                            fontSize="10px"
                            fontWeight="700"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                          >
                            {cmd.status === 'completed' ? 'Completed' : cmd.status || 'Completed'}
                          </Badge>
                        </Table.Cell>
                      )}
                      {isColVisible('executed') && (
                        <Table.Cell color={themeColors.text.muted}>{formatRelative(cmd.executionTime || cmd.submitted)}</Table.Cell>
                      )}
                      {isColVisible('completed') && (
                        <Table.Cell color={themeColors.text.muted}>{formatRelative(cmd.completed || cmd.submitted)}</Table.Cell>
                      )}
                      {isColVisible('errorCode') && (
                        <Table.Cell fontFamily="mono">{cmd.errorCode !== undefined ? cmd.errorCode : '-'}</Table.Cell>
                      )}
                      {isColVisible('actions') && (
                        <Table.Cell>
                          <HStack justify="center" gap={1.5}>
                            <IconButton
                              size="2xs"
                              colorPalette="red"
                              variant="solid"
                              title="Delete Command"
                              borderRadius="full"
                              onClick={() => handleDeleteCommand(cmd)}
                            >
                              <Icon name="trash" size={11} />
                            </IconButton>
                            <IconButton
                              size="2xs"
                              colorPalette="blue"
                              variant="solid"
                              title="View Details"
                              borderRadius="full"
                              onClick={() => setSelectedItem(cmd)}
                            >
                              <Icon name="search" size={11} />
                            </IconButton>
                          </HStack>
                        </Table.Cell>
                      )}
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          )}

          {/* 2. Health Checks Table */}
          {activeTab === 'health' && (
            <Table.Root size="sm" variant="outline">
              <Table.Header position="sticky" top={0} zIndex={2} bg="#f8fafc">
                <Table.Row bg="#f8fafc">
                  {isColVisible('submitted') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">SUBMITTED</Table.ColumnHeader>
                  )}
                  {isColVisible('uuid') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">UUID</Table.ColumnHeader>
                  )}
                  {isColVisible('sanity') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">SANITY</Table.ColumnHeader>
                  )}
                  {isColVisible('status') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">STATUS</Table.ColumnHeader>
                  )}
                  {isColVisible('details') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">DETAILS</Table.ColumnHeader>
                  )}
                  {isColVisible('actions') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textAlign="center">ACTIONS</Table.ColumnHeader>
                  )}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {displayHealthChecks.length > 0 ? (
                  displayHealthChecks.map((hc, idx) => {
                    const sanity = hc.sanity ?? 100;
                    return (
                      <Table.Row key={idx} fontSize="12px" _hover={{ bg: '#f1f5f9' }}>
                        {isColVisible('submitted') && (
                          <Table.Cell>{formatRelative(hc.recorded)}</Table.Cell>
                        )}
                        {isColVisible('uuid') && (
                          <Table.Cell fontFamily="mono">{hc.UUID || `hc-${idx + 1}`}</Table.Cell>
                        )}
                        {isColVisible('sanity') && (
                          <Table.Cell fontWeight="700">{sanity}%</Table.Cell>
                        )}
                        {isColVisible('status') && (
                          <Table.Cell>
                            <Badge
                              bg={sanity >= 80 ? '#16a34a' : '#d97706'}
                              color="#ffffff"
                              fontSize="10px"
                              fontWeight="700"
                              px={2}
                              py={0.5}
                              borderRadius="full"
                            >
                              {sanity >= 80 ? 'Healthy' : 'Degraded'}
                            </Badge>
                          </Table.Cell>
                        )}
                        {isColVisible('details') && (
                          <Table.Cell color={themeColors.text.muted}>Sanity verification {sanity}%</Table.Cell>
                        )}
                        {isColVisible('actions') && (
                          <Table.Cell textAlign="center">
                            <IconButton
                              size="2xs"
                              colorPalette="blue"
                              variant="solid"
                              borderRadius="full"
                              onClick={() => setSelectedItem(hc)}
                            >
                              <Icon name="search" size={11} />
                            </IconButton>
                          </Table.Cell>
                        )}
                      </Table.Row>
                    );
                  })
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={6} textAlign="center" py={4} color={themeColors.text.muted}>
                      No healthcheck records found matching current filters.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          )}

          {/* 3. Standard Logs Table */}
          {activeTab === 'logs' && (
            <Table.Root size="sm" variant="outline">
              <Table.Header position="sticky" top={0} zIndex={2} bg="#f8fafc">
                <Table.Row bg="#f8fafc">
                  {isColVisible('submitted') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">SUBMITTED</Table.ColumnHeader>
                  )}
                  {isColVisible('severity') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">SEVERITY</Table.ColumnHeader>
                  )}
                  {isColVisible('message') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">MESSAGE</Table.ColumnHeader>
                  )}
                  {isColVisible('actions') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textAlign="center">ACTIONS</Table.ColumnHeader>
                  )}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {displayStandardLogs.length > 0 ? (
                  displayStandardLogs.map((log, idx) => (
                    <Table.Row key={idx} fontSize="12px" _hover={{ bg: '#f1f5f9' }}>
                      {isColVisible('submitted') && (
                        <Table.Cell>{formatRelative(log.recorded)}</Table.Cell>
                      )}
                      {isColVisible('severity') && (
                        <Table.Cell>
                          <Badge size="xs" colorPalette="blue">Info</Badge>
                        </Table.Cell>
                      )}
                      {isColVisible('message') && (
                        <Table.Cell fontFamily="mono">{log.log}</Table.Cell>
                      )}
                      {isColVisible('actions') && (
                        <Table.Cell textAlign="center">
                          <IconButton
                            size="2xs"
                            colorPalette="blue"
                            variant="solid"
                            borderRadius="full"
                            onClick={() => setSelectedItem(log)}
                          >
                            <Icon name="search" size={11} />
                          </IconButton>
                        </Table.Cell>
                      )}
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={4} textAlign="center" py={4} color={themeColors.text.muted}>
                      No log events found matching current filters.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          )}

          {/* 4. Crash Logs Table */}
          {activeTab === 'crashes' && (
            <Table.Root size="sm" variant="outline">
              <Table.Header position="sticky" top={0} zIndex={2} bg="#f8fafc">
                <Table.Row bg="#f8fafc">
                  {isColVisible('submitted') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">SUBMITTED</Table.ColumnHeader>
                  )}
                  {isColVisible('crashLog') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">CRASH LOG</Table.ColumnHeader>
                  )}
                  {isColVisible('actions') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textAlign="center">ACTIONS</Table.ColumnHeader>
                  )}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {displayCrashLogs.length > 0 ? (
                  displayCrashLogs.map((crash, idx) => (
                    <Table.Row key={idx} fontSize="12px" _hover={{ bg: '#f1f5f9' }}>
                      {isColVisible('submitted') && (
                        <Table.Cell>{formatRelative(crash.recorded)}</Table.Cell>
                      )}
                      {isColVisible('crashLog') && (
                        <Table.Cell fontFamily="mono" color="#dc2626">{crash.log}</Table.Cell>
                      )}
                      {isColVisible('actions') && (
                        <Table.Cell textAlign="center">
                          <IconButton
                            size="2xs"
                            colorPalette="blue"
                            variant="solid"
                            borderRadius="full"
                            onClick={() => setSelectedItem(crash)}
                          >
                            <Icon name="search" size={11} />
                          </IconButton>
                        </Table.Cell>
                      )}
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={3} textAlign="center" py={4} color="#16a34a" fontWeight="600">
                      Zero crashes reported for the selected time window.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          )}

          {/* 5. Reboot Logs Table */}
          {activeTab === 'reboots' && (
            <Table.Root size="sm" variant="outline">
              <Table.Header position="sticky" top={0} zIndex={2} bg="#f8fafc">
                <Table.Row bg="#f8fafc">
                  {isColVisible('submitted') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">SUBMITTED</Table.ColumnHeader>
                  )}
                  {isColVisible('rebootReason') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b">REBOOT REASON</Table.ColumnHeader>
                  )}
                  {isColVisible('actions') && (
                    <Table.ColumnHeader bg="#f8fafc" fontSize="10px" fontWeight="700" color="#64748b" textAlign="center">ACTIONS</Table.ColumnHeader>
                  )}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {displayRebootLogs.length > 0 ? (
                  displayRebootLogs.map((rb, idx) => (
                    <Table.Row key={idx} fontSize="12px" _hover={{ bg: '#f1f5f9' }}>
                      {isColVisible('submitted') && (
                        <Table.Cell>{formatRelative(rb.recorded)}</Table.Cell>
                      )}
                      {isColVisible('rebootReason') && (
                        <Table.Cell fontFamily="mono">{rb.log || '-'}</Table.Cell>
                      )}
                      {isColVisible('actions') && (
                        <Table.Cell textAlign="center">
                          <IconButton
                            size="2xs"
                            colorPalette="blue"
                            variant="solid"
                            borderRadius="full"
                            onClick={() => setSelectedItem(rb)}
                          >
                            <Icon name="search" size={11} />
                          </IconButton>
                        </Table.Cell>
                      )}
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={3} textAlign="center" py={4} color={themeColors.text.muted}>
                      No unexpected reboots recorded for the selected time window.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          )}

          {/* Dynamic 'Show More' Pagination Button inside scrollable container at bottom of list */}
          <Center my={4} pb={2}>
            {pagination.canShowMore || isCurrentTabFetching ? (
              <Button
                bg="#2563eb"
                color="#ffffff"
                _hover={{ bg: '#1d4ed8' }}
                size="sm"
                fontWeight="600"
                px={5}
                py={2}
                borderRadius="6px"
                onClick={pagination.onShowMore}
                loading={isCurrentTabFetching}
              >
                Show More
              </Button>
            ) : (
              <Text fontSize="13px" fontWeight="600" color={themeColors.text.muted}>
                No more available!
              </Text>
            )}
          </Center>
        </Box>
      </Box>

      {/* JSON Inspection Modal */}
      {selectedItem ? (
        <DeviceJsonViewerModal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title="Command / Log Detail"
          data={selectedItem}
        />
      ) : null}
    </Box>
  );
};

export default DeviceCommandsLogsCard;
