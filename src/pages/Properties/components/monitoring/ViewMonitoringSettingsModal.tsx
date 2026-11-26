import React, { useState } from 'react';
import { Box, Button, Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { toaster } from '@/components/ui/toaster';
import { parseApiError } from '@/api/errors';
import { useStopVenueMonitoring, type VenueMonitoringResponse } from '@/api/monitoring';
import { themeColors } from '@/theme';

interface Props {
  venueId: string;
  venueName: string;
  monitoring?: VenueMonitoringResponse;
  isOpen: boolean;
  onClose: () => void;
  onStopped?: () => void;
}

export const ViewMonitoringSettingsModal: React.FC<Props> = ({
  venueId,
  venueName,
  monitoring,
  isOpen,
  onClose,
  onStopped,
}) => {
  const stopMonitoring = useStopVenueMonitoring(venueId);
  const [confirmStop, setConfirmStop] = useState(false);

  if (!isOpen) return null;

  const handleStop = async () => {
    try {
      await stopMonitoring.mutateAsync();
      toaster.create({
        title: 'Monitoring stopped',
        description: `Monitoring has been deactivated on venue "${venueName}".`,
        type: 'success',
      });
      setConfirmStop(false);
      onClose();
      onStopped?.();
    } catch (err) {
      toaster.create({
        title: 'Failed to stop monitoring',
        description: parseApiError(err, 'Failed to deactivate board in OWANALYTICS or OWPROV'),
        type: 'error',
      });
    }
  };

  const retentionDays = monitoring?.retention
    ? Math.round(monitoring.retention / 86400)
    : undefined;

  return (
    <Flex
      position="fixed"
      inset={0}
      zIndex={3000}
      bg={themeColors.modal.backdrop}
      align="center"
      justify="center"
      p={4}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <Box
        w="100%"
        maxW="500px"
        bg="#fff"
        borderRadius="12px"
        border="1px solid"
        borderColor={themeColors.modal.border}
        boxShadow="0 24px 80px rgba(0,0,0,.24)"
      >
        <Flex
          px={6}
          py={4}
          justify="space-between"
          align="center"
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
          bg="#f0fdfa"
        >
          <Flex align="center" gap={3}>
            <Flex
              w="36px"
              h="36px"
              borderRadius="8px"
              bg="#ccfbf1"
              color="#0d9488"
              align="center"
              justify="center"
            >
              <Icon name="gauge" size={20} />
            </Flex>
            <Box>
              <Text fontSize="18px" fontWeight="750" color="#134e4a">
                Monitoring Status & Settings
              </Text>
              <Text fontSize="11px" color={themeColors.text.muted}>
                Active telemetry tracking for {venueName}
              </Text>
            </Box>
          </Flex>
          <Button
            aria-label="Close"
            w="32px"
            h="32px"
            minW="32px"
            p={0}
            variant="outline"
            onClick={onClose}
          >
            <Icon name="x" size={16} />
          </Button>
        </Flex>

        <VStack p={6} align="stretch" gap={4}>
          <Box p={4} borderRadius="8px" bg="#f8fafc" border="1px solid #e2e8f0">
            <Flex justify="space-between" py={1.5} borderBottom="1px solid #f1f5f9">
              <Text fontSize="12px" color="#64748b" fontWeight="600">
                Status
              </Text>
              <Flex align="center" gap={1.5}>
                <Box w="8px" h="8px" borderRadius="full" bg="#16a34a" />
                <Text fontSize="12px" fontWeight="700" color="#16a34a">
                  Active
                </Text>
              </Flex>
            </Flex>
            <Flex justify="space-between" py={1.5} borderBottom="1px solid #f1f5f9">
              <Text fontSize="12px" color="#64748b" fontWeight="600">
                Board UUID
              </Text>
              <Text fontSize="12px" fontFamily="monospace" color="#0f172a">
                {monitoring?.boardId || 'N/A'}
              </Text>
            </Flex>
            <Flex justify="space-between" py={1.5} borderBottom="1px solid #f1f5f9">
              <Text fontSize="12px" color="#64748b" fontWeight="600">
                Telemetry Interval
              </Text>
              <Text fontSize="12px" fontWeight="650" color="#0f172a">
                {monitoring?.interval ? `${monitoring.interval}s` : '—'}
              </Text>
            </Flex>
            <Flex justify="space-between" py={1.5}>
              <Text fontSize="12px" color="#64748b" fontWeight="600">
                Data Retention
              </Text>
              <Text fontSize="12px" fontWeight="650" color="#0f172a">
                {retentionDays ? `${retentionDays} days (${monitoring?.retention}s)` : '—'}
              </Text>
            </Flex>
          </Box>

          {confirmStop ? (
            <Box p={4} borderRadius="8px" bg="#fef2f2" border="1px solid #fecaca">
              <Text fontSize="13px" fontWeight="700" color="#991b1b" mb={1}>
                Stop Venue Monitoring?
              </Text>
              <Text fontSize="11px" color="#7f1d1d" mb={3}>
                Stopping monitoring will disassociate and remove the board from OWANALYTICS.
                Historical telemetry charts will no longer update.
              </Text>
              <Flex gap={2} justify="flex-end">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setConfirmStop(false)}
                  disabled={stopMonitoring.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  bg="#dc2626"
                  _hover={{ bg: '#b91c1c' }}
                  color="#fff"
                  onClick={handleStop}
                  disabled={stopMonitoring.isPending}
                >
                  {stopMonitoring.isPending ? <Spinner size="xs" /> : 'Confirm Stop'}
                </Button>
              </Flex>
            </Box>
          ) : (
            <Flex justify="space-between" align="center" pt={2}>
              <Button
                variant="outline"
                colorScheme="red"
                borderColor="#fca5a5"
                color="#dc2626"
                _hover={{ bg: '#fee2e2' }}
                onClick={() => setConfirmStop(true)}
              >
                Stop Monitoring
              </Button>
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
            </Flex>
          )}
        </VStack>
      </Box>
    </Flex>
  );
};
