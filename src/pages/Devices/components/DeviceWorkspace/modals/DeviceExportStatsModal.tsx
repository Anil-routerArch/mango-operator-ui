import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceExportStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: UnifiedFleetDevice;
}

export const DeviceExportStatsModal: React.FC<DeviceExportStatsModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([
    'deviceInfo',
    'configuration',
    'status',
    'statistics',
  ]);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const toggleOption = (opt: string) => {
    if (selectedOptions.includes(opt)) {
      setSelectedOptions(selectedOptions.filter((o) => o !== opt));
    } else {
      setSelectedOptions([...selectedOptions, opt]);
    }
  };

  const handleExport = () => {
    if (selectedOptions.length === 0) {
      toaster.create({
        title: 'Validation Error',
        description: 'Please select at least one data category to export.',
        type: 'error',
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportPayload: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        serialNumber: device.serialNumber,
      };

      if (selectedOptions.includes('deviceInfo')) {
        exportPayload.deviceInfo = {
          name: device.name,
          serialNumber: device.serialNumber,
          model: device.model,
          manufacturer: device.manufacturer,
          deviceGroup: device.deviceGroup,
          deviceType: device.deviceType,
          macAddress: device.macAddress,
          ipAddress: device.ipAddress,
          firmware: device.firmware,
          locale: device.locale,
          createdTimestamp: device.createdTimestamp,
          modified: device.modified,
          entityName: device.entityName,
          venueName: device.venueName,
          subscriberEmail: device.subscriberEmail,
        };
      }

      if (selectedOptions.includes('configuration')) {
        exportPayload.configuration = device.configuration || device.gwDevice?.configuration || {};
      }

      if (selectedOptions.includes('status')) {
        exportPayload.status = {
          connected: device.connected,
          connectReason: device.connectReason,
          sanity: device.sanity,
          load: device.load,
          memoryUsedPct: device.memoryUsedPct,
          temperature: device.temperature,
          uptimeSeconds: device.uptimeSeconds,
          lastContact: device.lastContact,
          associationsTotal: device.associationsTotal,
          associations_2G: device.associations_2G,
          associations_5G: device.associations_5G,
          associations_6G: device.associations_6G,
          rxBytes: device.rxBytes,
          txBytes: device.txBytes,
        };
      }

      if (selectedOptions.includes('statistics')) {
        exportPayload.statistics = device.lastStats || {};
      }

      if (selectedOptions.includes('notes')) {
        exportPayload.notes = device.notes || [];
      }

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openwifi-device-export-${device.serialNumber}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toaster.create({
        title: 'Export Generated',
        description: `Exported telemetry and metadata for ${device.serialNumber}.`,
        type: 'success',
      });
      onClose();
    } catch (err: unknown) {
      toaster.create({
        title: 'Export Failed',
        description: err instanceof Error ? err.message : 'Could not compile export JSON',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(15, 23, 42, 0.65)"
      backdropFilter="blur(3px)"
      zIndex={1400}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="#ffffff"
        borderRadius="12px"
        w="100%"
        maxW="540px"
        boxShadow="0 20px 40px rgba(0,0,0,0.2)"
        border="1px solid"
        borderColor={themeColors.panel.border}
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          px={6}
          py={4}
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
        >
          <HStack gap={2.5}>
            <Box color="#0d9488">
              <Icon name="download" size={20} />
            </Box>
            <Box>
              <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                Export Device Statistics & Data
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted}>
                {device.serialNumber} · Download diagnostic bundle
              </Text>
            </Box>
          </HStack>
          <Button size="xs" variant="ghost" onClick={onClose} p={1}>
            <Icon name="x" size={16} />
          </Button>
        </Flex>

        {/* Body */}
        <Box p={6}>
          <VStack align="stretch" gap={3}>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Select Data Sets to Include in JSON Bundle:
            </Text>

            {[
              { id: 'deviceInfo', label: 'Device Metadata & Hardware Specs', desc: 'MAC, model, manufacturer, entity/venue hierarchy' },
              { id: 'configuration', label: 'Full Modular Configuration Profile', desc: 'Active UCInterface & radio JSON schema payload' },
              { id: 'status', label: 'Live Telemetry & Health Metrics', desc: 'Sanity score, CPU load, memory utilization, associations' },
              { id: 'statistics', label: 'Historical Traffic & Radio Frames', desc: 'Rx/Tx byte counters, channel utilization frames' },
              { id: 'notes', label: 'Audit Notes & System Annotations', desc: 'Maintenance records and timestamped system notes' },
            ].map((item) => {
              const isChecked = selectedOptions.includes(item.id);
              return (
                <Box
                  key={item.id}
                  p={3}
                  borderRadius="8px"
                  border="1px solid"
                  borderColor={isChecked ? '#99f6e4' : '#e2e8f0'}
                  bg={isChecked ? '#f0fdfa' : '#ffffff'}
                  cursor="pointer"
                  onClick={() => toggleOption(item.id)}
                  transition="all 0.15s ease"
                >
                  <HStack justify="space-between" align="center">
                    <Box>
                      <Text fontSize="13px" fontWeight="600" color={themeColors.text.title}>
                        {item.label}
                      </Text>
                      <Text fontSize="11px" color={themeColors.text.muted}>
                        {item.desc}
                      </Text>
                    </Box>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </HStack>
                </Box>
              );
            })}
          </VStack>
        </Box>

        {/* Footer */}
        <Flex
          justify="flex-end"
          gap={3}
          px={6}
          py={4}
          bg="#f8fafc"
          borderTop="1px solid"
          borderColor={themeColors.panel.divider}
        >
          <Button size="sm" variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            size="sm"
            colorPalette="teal"
            variant="solid"
            onClick={handleExport}
            disabled={isExporting || selectedOptions.length === 0}
          >
            {isExporting ? (
              <HStack gap={2}>
                <Spinner size="xs" />
                <Text>Generating...</Text>
              </HStack>
            ) : (
              'Download Export JSON'
            )}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DeviceExportStatsModal;

