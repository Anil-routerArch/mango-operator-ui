import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useDevicesUiStore } from '@/stores/devicesUiStore';
import {
  usePaginatedFleetDevices,
  useDeviceEventsStream,
  useRebootDevice,
  useWifiScanDevice,
  usePushDeviceConfig,
  useDeleteDeviceFromFleet,
} from '@/api/devices';
import { toaster } from '@/components/ui/toaster';
import { DevicePaginationControls } from './DevicePaginationControls';
import { DeviceRowActions } from './DeviceRowActions';
import { DeviceConnectionBadge } from './DeviceConnectionBadge';
import {
  formatBytes,
  formatUptimeDuration,
  formatCertExpiry,
  formatRelative,
  getRevision,
  getCountryFlag,
} from './deviceTableHelpers';
import type { DeviceWorkspaceTab } from '@/types/device';

export const DeviceFleetTable: React.FC = () => {
  const [, setSearchParams] = useSearchParams();

  const {
    selectDevice,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    unassignedOnly,
    setUnassignedOnly,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
  } = useDevicesUiStore();

  const [deleteTargetSerial, setDeleteTargetSerial] = useState<string | null>(null);

  const handleSelectDevice = (serial: string, tab: DeviceWorkspaceTab = 'overview') => {
    selectDevice(serial, tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('serial', serial);
      if (tab !== 'overview') {
        next.set('tab', tab);
      }
      return next;
    });
  };

  const {
    data: paginatedData,
    isLoading,
    refetch,
    isFetching,
  } = usePaginatedFleetDevices({
    pageIndex,
    pageSize,
    unassignedOnly,
  });

  const rebootMutation = useRebootDevice();
  const wifiScanMutation = useWifiScanDevice();
  const syncMutation = usePushDeviceConfig();
  const deleteMutation = useDeleteDeviceFromFleet();

  const devices = paginatedData?.devices ?? [];

  const currentSerials = useMemo(() => {
    return devices.map((d) => d.serialNumber);
  }, [devices]);

  useDeviceEventsStream(currentSerials);
  const totalCount = paginatedData?.totalCount ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;

  // Filter devices on the current page by search term and status
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (statusFilter === 'online' && !d.connected) return false;
      if (statusFilter === 'offline' && d.connected) return false;

      if (!searchQuery) return true;
      const term = searchQuery.toLowerCase();
      return (
        d.serialNumber.toLowerCase().includes(term) ||
        (d.name && d.name.toLowerCase().includes(term)) ||
        (d.entityName && d.entityName.toLowerCase().includes(term)) ||
        (d.venueName && d.venueName.toLowerCase().includes(term)) ||
        (d.subscriberEmail && d.subscriberEmail.toLowerCase().includes(term)) ||
        (d.model && d.model.toLowerCase().includes(term)) ||
        (d.ipAddress && d.ipAddress.includes(term)) ||
        (d.macAddress && d.macAddress.toLowerCase().includes(term))
      );
    });
  }, [devices, statusFilter, searchQuery]);

  const handleCopyIp = (e: React.MouseEvent, ip: string) => {
    e.stopPropagation();
    if (!ip || ip === '-') return;
    navigator.clipboard.writeText(ip);
    toaster.create({
      title: 'Copied to Clipboard',
      description: `IP address ${ip} copied`,
      type: 'info',
    });
  };

  const handleQuickReboot = async (serial: string) => {
    try {
      await rebootMutation.mutateAsync({ serialNumber: serial });
      toaster.create({
        title: 'Reboot Scheduled',
        description: `Reboot command sent to ${serial}`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Reboot Failed',
        description: err instanceof Error ? err.message : 'Failed to reboot device',
        type: 'error',
      });
    }
  };

  const handleWifiScan = async (serial: string) => {
    try {
      await wifiScanMutation.mutateAsync({ serialNumber: serial, verbose: true });
      toaster.create({
        title: 'Wi-Fi Scan Initiated',
        description: `Radio analysis requested for ${serial}`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Scan Request Failed',
        description: err instanceof Error ? err.message : 'Failed to request scan',
        type: 'error',
      });
    }
  };

  const handleSyncTelemetry = async (serial: string) => {
    try {
      await syncMutation.mutateAsync(serial);
      toaster.create({
        title: 'Configuration Pushed',
        description: `Sync request dispatched to ${serial}`,
        type: 'success',
      });
      refetch();
    } catch (err: unknown) {
      toaster.create({
        title: 'Sync Failed',
        description: err instanceof Error ? err.message : 'Failed to push configuration',
        type: 'error',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetSerial) return;
    try {
      await deleteMutation.mutateAsync(deleteTargetSerial);
      toaster.create({
        title: 'Device Removed',
        description: `Device ${deleteTargetSerial} successfully deleted`,
        type: 'success',
      });
      setDeleteTargetSerial(null);
      refetch();
    } catch (err: unknown) {
      toaster.create({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Could not delete device',
        type: 'error',
      });
    }
  };

  const handleExportCsv = () => {
    if (devices.length === 0) return;
    const headers = [
      'SerialNumber',
      'Status',
      'MemoryPct',
      'Sanity',
      'Load',
      'Temperature',
      'Revision',
      'Type',
      'IP',
      'Provisioning',
      'Radius',
      'GPS',
      'Uptime',
      'LastConnected',
      'LastContact',
      'LastUpgrade',
      'RxBytes',
      'TxBytes',
      '2G',
      '5G',
      '6G',
      'ConnectReason',
      'CertExpiry',
    ];

    const rows = devices.map((d) => [
      d.serialNumber,
      d.connected ? 'Online' : 'Offline',
      d.memoryUsedPct !== undefined ? `${d.memoryUsedPct}%` : '',
      d.sanity !== undefined ? `${d.sanity}%` : '',
      d.load !== undefined ? `${d.load}%` : '',
      d.temperature !== undefined ? `${d.temperature}°C` : '',
      getRevision(d.firmware),
      d.deviceType || d.model,
      d.ipAddress || '',
      d.subscriberEmail || d.venueName || d.entityName || '',
      d.hasRADIUSSessions || '',
      d.hasGPS ? 'Yes' : 'No',
      formatUptimeDuration(d.uptimeSeconds),
      formatRelative(d.lastRecordedContact),
      formatRelative(d.lastContactTimestamp),
      formatRelative(d.lastFWUpdate),
      formatBytes(d.rxBytes),
      formatBytes(d.txBytes),
      d.associations_2G || 0,
      d.associations_5G || 0,
      d.associations_6G || 0,
      d.connectReason || '',
      formatCertExpiry(d.certificateExpiryDate),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mango_devices_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      {/* Top Header Bar Matching OWGW / OWPROV */}
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
        <HStack gap={3} flex="1" maxW="720px" wrap="wrap">
          {/* Device Count Heading */}
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title} whiteSpace="nowrap">
            {totalCount} Devices
          </Text>

          {/* Search Box */}
          <Box position="relative" flex="1" minW="260px">
            <Input
              size="sm"
              placeholder="Search MACs or radius clients"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderColor={themeColors.input.border}
              borderRadius="6px"
              pl="32px"
              bg="#ffffff"
            />
            <Box position="absolute" left="10px" top="8px" color={themeColors.text.muted}>
              <Icon name="search" size={15} />
            </Box>
          </Box>

          {/* Status Filter Segmented Controls */}
          <HStack gap={1} bg="#f1f5f9" p={1} borderRadius="6px">
            {(['all', 'online', 'offline'] as const).map((st) => (
              <Button
                key={st}
                size="xs"
                variant={statusFilter === st ? 'solid' : 'ghost'}
                bg={statusFilter === st ? '#ffffff' : 'transparent'}
                color={statusFilter === st ? themeColors.text.title : themeColors.text.secondary}
                boxShadow={statusFilter === st ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}
                _hover={{ color: themeColors.text.title }}
                onClick={() => setStatusFilter(st)}
                textTransform="capitalize"
                px={2.5}
              >
                {st}
              </Button>
            ))}
          </HStack>
        </HStack>

        <HStack gap={2}>
          {/* Unassigned Only Toggle */}
          <Button
            size="sm"
            variant={unassignedOnly ? 'solid' : 'outline'}
            bg={unassignedOnly ? themeColors.brand.accent : 'transparent'}
            color={unassignedOnly ? '#ffffff' : themeColors.text.secondary}
            borderColor={themeColors.input.iconBtnBorder}
            _hover={{
              bg: unassignedOnly ? themeColors.brand.accentHover : '#f8fafc',
            }}
            onClick={() => setUnassignedOnly(!unassignedOnly)}
            fontSize="12px"
            px={3}
            title="Filter unassigned devices"
          >
            Unassigned Only
          </Button>

          {/* Export Button */}
          <IconButton
            aria-label="Export devices table"
            size="sm"
            variant="outline"
            borderColor={themeColors.input.iconBtnBorder}
            color={themeColors.brand.accent}
            _hover={{ bg: themeColors.brand.accentLight }}
            onClick={handleExportCsv}
            title="Export CSV"
          >
            <Icon name="upload" size={15} />
          </IconButton>

          {/* Refresh Fleet Button */}
          <IconButton
            aria-label="Refresh devices"
            size="sm"
            variant="outline"
            borderColor={themeColors.input.iconBtnBorder}
            color={themeColors.text.primary}
            _hover={{ bg: '#f1f5f9' }}
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh fleet telemetry"
          >
            {isFetching ? <Spinner size="xs" /> : <Icon name="refresh" size={15} />}
          </IconButton>
        </HStack>
      </Flex>

      {/* Fleet Table Card Container */}
      <Box
        bg={themeColors.panel.bg}
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        overflow="hidden"
        boxShadow="0 1px 3px rgba(0,0,0,0.04)"
      >
        {isLoading ? (
          <Flex justify="center" align="center" minH="340px" direction="column" gap={3}>
            <Spinner size="lg" color={themeColors.brand.accent} />
            <Text fontSize="13px" color={themeColors.text.muted}>
              Synchronizing fleet devices across gateway and inventory...
            </Text>
          </Flex>
        ) : filteredDevices.length === 0 ? (
          <Flex justify="center" align="center" minH="280px" color={themeColors.text.muted}>
            <Text fontSize="14px">No devices match your filter criteria.</Text>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Box minW="2400px">
              {/* Table Header: All 24 Columns */}
              <Flex
                bg="#f8fafc"
                borderBottom="1px solid"
                borderColor={themeColors.panel.border}
                py={2.5}
                px={3}
                fontSize="11px"
                fontWeight="700"
                color={themeColors.text.secondary}
                textTransform="uppercase"
                letterSpacing="0.5px"
                align="center"
              >
                <Box w="45px" minW="45px" flexShrink={0} textAlign="center"></Box>
                <Box w="130px" minW="130px" flexShrink={0}>Serial Number</Box>
                <Box w="85px" minW="85px" flexShrink={0} textAlign="center">Memory</Box>
                <Box w="85px" minW="85px" flexShrink={0} textAlign="center">Sanity</Box>
                <Box w="85px" minW="85px" flexShrink={0} textAlign="center">Load</Box>
                <Box w="65px" minW="65px" flexShrink={0} textAlign="center">Temp</Box>
                <Box w="220px" minW="220px" flexShrink={0}>Revision</Box>
                <Box w="160px" minW="160px" flexShrink={0}>Type</Box>
                <Box w="160px" minW="160px" flexShrink={0}>IP</Box>
                <Box w="190px" minW="190px" flexShrink={0}>Provisioning</Box>
                <Box w="45px" minW="45px" flexShrink={0} textAlign="center">Rad</Box>
                <Box w="45px" minW="45px" flexShrink={0} textAlign="center">GPS</Box>
                <Box w="130px" minW="130px" flexShrink={0}>Uptime</Box>
                <Box w="120px" minW="120px" flexShrink={0}>Last Connected</Box>
                <Box w="110px" minW="110px" flexShrink={0}>Last Contact</Box>
                <Box w="110px" minW="110px" flexShrink={0}>Last Upgrade</Box>
                <Box w="80px" minW="80px" flexShrink={0} textAlign="right">Rx</Box>
                <Box w="80px" minW="80px" flexShrink={0} textAlign="right">Tx</Box>
                <Box w="45px" minW="45px" flexShrink={0} textAlign="center">2G</Box>
                <Box w="45px" minW="45px" flexShrink={0} textAlign="center">5G</Box>
                <Box w="45px" minW="45px" flexShrink={0} textAlign="center">6G</Box>
                <Box w="120px" minW="120px" flexShrink={0}>Connect Reason</Box>
                <Box w="55px" minW="55px" flexShrink={0} textAlign="center">Exp</Box>
                <Box w="230px" minW="230px" flexShrink={0} textAlign="center">Actions</Box>
              </Flex>

              {/* Table Rows */}
              {filteredDevices.map((dev) => {
                const isOnline = Boolean(dev.connected);
                const memoryVal = dev.memoryUsedPct ?? dev.memoryUsed;
                const loadVal = dev.load;
                const tempVal = dev.temperature;

                return (
                  <Flex
                    key={dev.serialNumber}
                    align="center"
                    py={2.5}
                    px={3}
                    borderBottom="1px solid"
                    borderColor={themeColors.panel.divider}
                    fontSize="12px"
                    _last={{ borderBottom: 'none' }}
                    _hover={{ bg: '#f8fafc', cursor: 'pointer' }}
                    onClick={() => handleSelectDevice(dev.serialNumber)}
                    transition="background 0.1s ease"
                  >
                    {/* 1. Dedicated Online / Offline Hardware Badge */}
                    <Box w="45px" minW="45px" flexShrink={0} display="flex" justifyContent="center">
                      <DeviceConnectionBadge
                        connected={Boolean(dev.connected)}
                        deviceType={dev.deviceType || dev.model}
                        restricted={Boolean(dev.restricted)}
                        simulated={Boolean(dev.simulated)}
                      />
                    </Box>

                    {/* 2. Serial Number */}
                    <Box
                      w="130px"
                      minW="130px"
                      flexShrink={0}
                      fontFamily="monospace"
                      fontSize="12px"
                      fontWeight="600"
                      color={themeColors.brand.accent}
                    >
                      {dev.serialNumber}
                    </Box>

                    {/* 3. Memory Pill */}
                    <Box w="85px" minW="85px" flexShrink={0} display="flex" justifyContent="center">
                      {isOnline && memoryVal !== undefined ? (
                        <HStack
                          gap={1}
                          px={2}
                          py="2px"
                          borderRadius="full"
                          bg={memoryVal <= 60 ? '#dcfce7' : memoryVal <= 85 ? '#fef3c7' : '#fee2e2'}
                          color={memoryVal <= 60 ? '#15803d' : memoryVal <= 85 ? '#b45309' : '#b91c1c'}
                          fontSize="11px"
                          fontWeight="600"
                        >
                          <Text>{Math.round(memoryVal)}%</Text>
                          <Icon name="check" size={10} />
                        </HStack>
                      ) : (
                        <Text color={themeColors.text.muted}>-</Text>
                      )}
                    </Box>

                    {/* 4. Sanity Pill */}
                    <Box w="85px" minW="85px" flexShrink={0} display="flex" justifyContent="center">
                      {isOnline && dev.sanity !== undefined ? (
                        <HStack
                          gap={1}
                          px={2}
                          py="2px"
                          borderRadius="full"
                          bg={dev.sanity >= 80 ? '#dcfce7' : dev.sanity >= 50 ? '#fef3c7' : '#fee2e2'}
                          color={dev.sanity >= 80 ? '#15803d' : dev.sanity >= 50 ? '#b45309' : '#b91c1c'}
                          fontSize="11px"
                          fontWeight="600"
                        >
                          <Text>{Math.round(dev.sanity)}%</Text>
                          <Icon name="heart" size={10} />
                        </HStack>
                      ) : (
                        <Text color={themeColors.text.muted}>-</Text>
                      )}
                    </Box>

                    {/* 5. Load Pill */}
                    <Box w="85px" minW="85px" flexShrink={0} display="flex" justifyContent="center">
                      {isOnline && loadVal !== undefined ? (
                        <HStack
                          gap={1}
                          px={2}
                          py="2px"
                          borderRadius="full"
                          bg={loadVal <= 5 ? '#dcfce7' : loadVal <= 20 ? '#fef3c7' : '#fee2e2'}
                          color={loadVal <= 5 ? '#15803d' : loadVal <= 20 ? '#b45309' : '#b91c1c'}
                          fontSize="11px"
                          fontWeight="600"
                        >
                          <Text>{typeof loadVal === 'number' ? loadVal.toFixed(2) : loadVal}%</Text>
                          <Icon name="check" size={10} />
                        </HStack>
                      ) : (
                        <Text color={themeColors.text.muted}>-</Text>
                      )}
                    </Box>

                    {/* 6. Temp */}
                    <Box w="65px" minW="65px" flexShrink={0} display="flex" justifyContent="center">
                      {isOnline && tempVal !== undefined && tempVal > 0 ? (
                        <HStack
                          gap={1}
                          fontSize="11px"
                          color={tempVal <= 75 ? '#15803d' : '#b45309'}
                        >
                          <Icon name="thermometer" size={12} />
                          <Text>{Math.round(tempVal > 1000 ? tempVal / 1000 : tempVal)}°C</Text>
                        </HStack>
                      ) : (
                        <Text color={themeColors.text.muted}>-</Text>
                      )}
                    </Box>

                    {/* 7. Revision Pill (Guaranteed Single-Line <> and revision data) */}
                    <Box w="220px" minW="220px" flexShrink={0}>
                      <span
                        style={{
                          display: 'inline-flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#fef3c7',
                          border: '1px solid #fde68a',
                          color: '#92400e',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap',
                          fontSize: '11px',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontWeight: 600,
                          lineHeight: '1.2',
                        }}
                        title={dev.firmware}
                      >
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#b45309', flexShrink: 0 }}>
                          &lt;&gt;
                        </span>
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {getRevision(dev.firmware)}
                        </span>
                      </span>
                    </Box>

                    {/* 8. Type */}
                    <Box w="160px" minW="160px" flexShrink={0} color={themeColors.text.primary} fontSize="12px" lineClamp={1}>
                      {dev.deviceType || dev.model || 'Universal AP'}
                    </Box>

                    {/* 9. IP with Country Flag & Copy Button */}
                    <Box w="160px" minW="160px" flexShrink={0}>
                      {dev.ipAddress && dev.ipAddress !== '-' ? (
                        <HStack gap={1.5} align="center">
                          <Text fontSize="14px">{getCountryFlag(dev.locale)}</Text>
                          <IconButton
                            aria-label="Copy IP"
                            size="xs"
                            variant="ghost"
                            w="20px"
                            h="20px"
                            minW="20px"
                            p={0}
                            color={themeColors.text.muted}
                            _hover={{ color: themeColors.brand.accent }}
                            onClick={(e) => handleCopyIp(e, dev.ipAddress)}
                            title="Copy IP"
                          >
                            <Icon name="copy" size={12} />
                          </IconButton>
                          <Text
                            fontFamily="monospace"
                            fontSize="11px"
                            color={themeColors.text.secondary}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                          >
                            {dev.ipAddress}
                          </Text>
                        </HStack>
                      ) : (
                        <Text color={themeColors.text.muted}>-</Text>
                      )}
                    </Box>

                    {/* 10. Provisioning (Subscriber or Venue/Entity) */}
                    <Box w="190px" minW="190px" flexShrink={0} fontSize="12px" color={themeColors.text.secondary}>
                      {dev.subscriberEmail ? (
                        <Text
                          color={themeColors.brand.accent}
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          title={dev.subscriberEmail}
                        >
                          {dev.subscriberEmail}
                        </Text>
                      ) : dev.venueName || dev.entityName ? (
                        <Text
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          title={`${dev.venueName || ''} (${dev.entityName || ''})`}
                        >
                          {dev.venueName || dev.entityName}
                        </Text>
                      ) : (
                        <Text color={themeColors.text.muted}>-</Text>
                      )}
                    </Box>

                    {/* 11. Radius (RAD) */}
                    <Box w="45px" minW="45px" flexShrink={0} textAlign="center" color={themeColors.text.secondary}>
                      {dev.hasRADIUSSessions && typeof dev.hasRADIUSSessions === 'number'
                        ? dev.hasRADIUSSessions
                        : '-'}
                    </Box>

                    {/* 12. GPS */}
                    <Box w="45px" minW="45px" flexShrink={0} textAlign="center" color={themeColors.text.secondary}>
                      {dev.hasGPS ? 'Yes' : '-'}
                    </Box>

                    {/* 13. Uptime */}
                    <Box w="130px" minW="130px" flexShrink={0} fontFamily="monospace" fontSize="11px" color={themeColors.text.secondary}>
                      {isOnline ? formatUptimeDuration(dev.uptimeSeconds) : '-'}
                    </Box>

                    {/* 14. Last Connected */}
                    <Box w="120px" minW="120px" flexShrink={0} fontSize="11px" color={themeColors.text.secondary}>
                      {formatRelative(dev.lastRecordedContact)}
                    </Box>

                    {/* 15. Last Contact */}
                    <Box w="110px" minW="110px" flexShrink={0} fontSize="11px" color={themeColors.text.secondary}>
                      {formatRelative(dev.lastContactTimestamp)}
                    </Box>

                    {/* 16. Last Upgrade */}
                    <Box w="110px" minW="110px" flexShrink={0} fontSize="11px" color={themeColors.text.secondary}>
                      {formatRelative(dev.lastFWUpdate)}
                    </Box>

                    {/* 17. Rx */}
                    <Box w="80px" minW="80px" flexShrink={0} textAlign="right" fontFamily="monospace" fontSize="11px" color={themeColors.text.secondary}>
                      {isOnline && dev.rxBytes ? formatBytes(dev.rxBytes) : '-'}
                    </Box>

                    {/* 18. Tx */}
                    <Box w="80px" minW="80px" flexShrink={0} textAlign="right" fontFamily="monospace" fontSize="11px" color={themeColors.text.secondary}>
                      {isOnline && dev.txBytes ? formatBytes(dev.txBytes) : '-'}
                    </Box>

                    {/* 19. 2G */}
                    <Box w="45px" minW="45px" flexShrink={0} textAlign="center" fontSize="11px" color={themeColors.text.secondary}>
                      {dev.associations_2G ? dev.associations_2G : '-'}
                    </Box>

                    {/* 20. 5G */}
                    <Box w="45px" minW="45px" flexShrink={0} textAlign="center" fontSize="11px" color={themeColors.text.secondary}>
                      {dev.associations_5G ? dev.associations_5G : '-'}
                    </Box>

                    {/* 21. 6G */}
                    <Box w="45px" minW="45px" flexShrink={0} textAlign="center" fontSize="11px" color={themeColors.text.secondary}>
                      {dev.associations_6G ? dev.associations_6G : '-'}
                    </Box>

                    {/* 22. Connect Reason */}
                    <Box w="120px" minW="120px" flexShrink={0} fontSize="11px" color={themeColors.text.muted}>
                      {dev.connectReason || (isOnline ? 'socket' : '-')}
                    </Box>

                    {/* 23. Exp (Cert Expiry) */}
                    <Box w="55px" minW="55px" flexShrink={0} textAlign="center" fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                      {formatCertExpiry(dev.certificateExpiryDate)}
                    </Box>

                    {/* 24. Actions (7 Circular Buttons) */}
                    <Box w="230px" minW="230px" flexShrink={0} textAlign="center">
                      <DeviceRowActions
                        device={dev}
                        onSelect={handleSelectDevice}
                        onReboot={handleQuickReboot}
                        onDelete={(s) => setDeleteTargetSerial(s)}
                        onWifiScan={handleWifiScan}
                        onSync={handleSyncTelemetry}
                      />
                    </Box>
                  </Flex>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Modular Pagination Controls */}
        <DevicePaginationControls
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={(newIdx) => setPageIndex(newIdx)}
          onPageSizeChange={(newSize) => setPageSize(newSize)}
          isDisabled={isLoading || isFetching}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      {deleteTargetSerial && (
        <Box
          position="fixed"
          inset={0}
          bg="rgba(0,0,0,0.5)"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <Box
            bg="#ffffff"
            borderRadius="8px"
            p={6}
            maxW="420px"
            w="100%"
            boxShadow="0 10px 25px rgba(0,0,0,0.2)"
          >
            <VStack gap={3} align="start">
              <HStack gap={2} color="#dc2626">
                <Icon name="alertTriangle" size={20} />
                <Text fontSize="16px" fontWeight="700">
                  Delete Device
                </Text>
              </HStack>
              <Text fontSize="13px" color={themeColors.text.secondary}>
                Are you sure you want to delete device{' '}
                <Text as="span" fontFamily="monospace" fontWeight="700" color={themeColors.text.title}>
                  {deleteTargetSerial}
                </Text>{' '}
                from inventory and gateway? This operation cannot be undone.
              </Text>
              <HStack gap={3} justify="flex-end" w="100%" mt={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteTargetSerial(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  bg="#dc2626"
                  color="#ffffff"
                  _hover={{ bg: '#b91c1c' }}
                  onClick={handleConfirmDelete}
                >
                  Confirm Delete
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DeviceFleetTable;
