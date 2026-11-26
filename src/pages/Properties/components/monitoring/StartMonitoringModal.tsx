import React, { useState } from 'react';
import { Box, Button, Flex, Input, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { toaster } from '@/components/ui/toaster';
import { parseApiError } from '@/api/errors';
import { useStartVenueMonitoring } from '@/api/monitoring';
import { themeColors } from '@/theme';

interface Props {
  venueId: string;
  venueName: string;
  isOpen: boolean;
  onClose: () => void;
  onStarted?: () => void;
}

export const StartMonitoringModal: React.FC<Props> = ({
  venueId,
  venueName,
  isOpen,
  onClose,
  onStarted,
}) => {
  const startMonitoring = useStartVenueMonitoring(venueId);
  const [name, setName] = useState(venueName || '');
  const [interval, setInterval] = useState(60);
  const [retentionDays, setRetentionDays] = useState(7);
  const [monitorSubVenues, setMonitorSubVenues] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      await startMonitoring.mutateAsync({
        name: name.trim() || venueName,
        interval: Number(interval) || 60,
        retention: (Number(retentionDays) || 7) * 86400,
        monitorSubVenues,
      });
      toaster.create({
        title: 'Monitoring activated',
        description: `Telemetry job initiated for venue "${venueName}".`,
        type: 'success',
      });
      onClose();
      onStarted?.();
    } catch (err) {
      toaster.create({
        title: 'Failed to activate monitoring',
        description: parseApiError(err, 'OWANALYTICS or OWPROV rejected the request'),
        type: 'error',
      });
    }
  };

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
        maxW="540px"
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
                Activate Monitoring
              </Text>
              <Text fontSize="11px" color={themeColors.text.muted}>
                Collect and aggregate live telemetry for this venue
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
          <Box>
            <Text fontSize="11px" fontWeight="700" mb={1}>
              Board Name
            </Text>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Board display name"
            />
          </Box>

          <SimpleGrid columns={2} gap={4}>
            <Box>
              <Text fontSize="11px" fontWeight="700" mb={1}>
                Interval (seconds)
              </Text>
              <Input
                type="number"
                min={10}
                max={3600}
                value={interval}
                onChange={(e) => setInterval(Math.max(10, parseInt(e.target.value, 10) || 60))}
              />
              <Text fontSize="10px" color={themeColors.text.muted} mt={1}>
                Default: 60s
              </Text>
            </Box>

            <Box>
              <Text fontSize="11px" fontWeight="700" mb={1}>
                Retention (days)
              </Text>
              <Input
                type="number"
                min={1}
                max={90}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Math.max(1, parseInt(e.target.value, 10) || 7))}
              />
              <Text fontSize="10px" color={themeColors.text.muted} mt={1}>
                Default: 7 days
              </Text>
            </Box>
          </SimpleGrid>

          <Flex
            align="center"
            justify="space-between"
            p={3}
            borderRadius="8px"
            bg="#f8fafc"
            border="1px solid #e2e8f0"
          >
            <Box>
              <Text fontSize="13px" fontWeight="650">
                Monitor Sub-Venues
              </Text>
              <Text fontSize="11px" color={themeColors.text.muted}>
                Automatically collect telemetry for nested sub-venues
              </Text>
            </Box>
            <input
              type="checkbox"
              checked={monitorSubVenues}
              onChange={(e) => setMonitorSubVenues(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </Flex>

          <Flex justify="flex-end" gap={2} pt={2}>
            <Button variant="outline" onClick={onClose} disabled={startMonitoring.isPending}>
              Cancel
            </Button>
            <Button
              bg="#0d9488"
              _hover={{ bg: '#0f766e' }}
              color="#fff"
              onClick={handleSubmit}
              disabled={startMonitoring.isPending}
            >
              {startMonitoring.isPending ? <Spinner size="xs" /> : 'Start Monitoring'}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Flex>
  );
};
