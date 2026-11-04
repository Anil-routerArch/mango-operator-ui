import React, { useState } from 'react';
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
import { DeviceCard } from '../common/DeviceCard';
import { DeviceActionConfirmModal } from '../common/DeviceActionConfirmModal';
import {
  useBlacklistDevices,
  useAddDeviceToBlacklist,
  useRemoveDeviceFromBlacklist,
} from '@/api/devices';
import { toaster } from '@/components/ui/toaster';
import type { BlacklistDevice } from '@/types/device';

export const DeviceBlacklistTab: React.FC = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deviceToRemove, setDeviceToRemove] = useState<BlacklistDevice | null>(null);
  const [newMac, setNewMac] = useState('');
  const [newReason, setNewReason] = useState('');

  const { data: blacklist, isLoading, refetch } = useBlacklistDevices();
  const addMutation = useAddDeviceToBlacklist();
  const removeMutation = useRemoveDeviceFromBlacklist();

  const blacklistItems: BlacklistDevice[] = blacklist ?? [];

  const handleAdd = async () => {
    if (!newMac.trim()) {
      toaster.create({
        title: 'Validation Error',
        description: 'Please enter a valid MAC address or Serial number',
        type: 'error',
      });
      return;
    }
    try {
      await addMutation.mutateAsync({
        serialNumber: newMac.trim(),
        reason: newReason.trim() || 'Blocked by security operator',
      });
      toaster.create({
        title: 'Device Blacklisted',
        description: `${newMac} has been added to the blacklist`,
        type: 'success',
      });
      setIsAddOpen(false);
      setNewMac('');
      setNewReason('');
    } catch (err: unknown) {
      toaster.create({
        title: 'Add Failed',
        description: err instanceof Error ? err.message : 'Could not add device to blacklist',
        type: 'error',
      });
    }
  };

  const handleRemove = async () => {
    if (!deviceToRemove) return;
    try {
      await removeMutation.mutateAsync(deviceToRemove.serialNumber);
      toaster.create({
        title: 'Device Removed',
        description: `${deviceToRemove.serialNumber} removed from blacklist`,
        type: 'success',
      });
      setDeviceToRemove(null);
    } catch (err: unknown) {
      toaster.create({
        title: 'Remove Failed',
        description: err instanceof Error ? err.message : 'Could not remove device',
        type: 'error',
      });
    }
  };

  return (
    <DeviceCard
      title={`Blacklisted Devices (${blacklistItems.length})`}
      subtitle="Prevent unauthorized MACs or compromised serial numbers from connecting to the gateway"
      action={
        <HStack gap={2}>
          <Button
            size="sm"
            variant="outline"
            borderColor={themeColors.input.iconBtnBorder}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <Icon name="refresh" size={14} />
          </Button>
          <Button
            size="sm"
            bg="#dc2626"
            color="#ffffff"
            _hover={{ bg: '#b91c1c' }}
            onClick={() => setIsAddOpen(true)}
            gap={1.5}
          >
            <Icon name="plus" size={14} />
            Block Device
          </Button>
        </HStack>
      }
    >
      <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" overflow="hidden" bg="#ffffff" mt={2}>
        {/* Table Header */}
        <Flex
          bg="#f8fafc"
          borderBottom="1px solid"
          borderColor={themeColors.panel.border}
          py={2.5}
          px={4}
          fontSize="11px"
          fontWeight="700"
          color={themeColors.text.secondary}
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          <Box flex="1.5">MAC / Serial Number</Box>
          <Box flex="2">Block Reason</Box>
          <Box flex="1">Added Date</Box>
          <Box flex="1">Operator</Box>
          <Box w="80px" textAlign="right">Action</Box>
        </Flex>

        {/* Table Rows / Empty State */}
        {isLoading ? (
          <Flex justify="center" align="center" py={12} gap={2}>
            <Spinner size="sm" color={themeColors.brand.accent} />
            <Text fontSize="13px" color={themeColors.text.muted}>
              Loading blacklisted devices...
            </Text>
          </Flex>
        ) : blacklistItems.length === 0 ? (
          <Flex direction="column" align="center" justify="center" py={12} px={4} textAlign="center">
            <Box color={themeColors.text.muted} mb={2}>
              <Icon name="shield" size={32} />
            </Box>
            <Text fontSize="14px" fontWeight="600" color={themeColors.text.title} mb={1}>
              No Blacklisted Devices
            </Text>
            <Text fontSize="12px" color={themeColors.text.muted} maxW="380px">
              No devices or MAC addresses are currently blocked from connecting to the gateway.
            </Text>
          </Flex>
        ) : (
          blacklistItems.map((item, idx) => (
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
              <Box flex="1.5" fontWeight="600" color="#dc2626" fontFamily="monospace">
                {item.serialNumber}
              </Box>
              <Box flex="2" color={themeColors.text.primary}>
                {item.reason}
              </Box>
              <Box flex="1" color={themeColors.text.muted}>
                {item.created ? new Date(item.created * 1000).toLocaleDateString() : '-'}
              </Box>
              <Box flex="1" color={themeColors.text.secondary}>
                {item.author || 'admin'}
              </Box>
              <Box w="80px" textAlign="right">
                <Button
                  size="xs"
                  variant="outline"
                  color="#dc2626"
                  borderColor="#fca5a5"
                  _hover={{ bg: '#fee2e2' }}
                  onClick={() => setDeviceToRemove(item)}
                >
                  Unblock
                </Button>
              </Box>
            </Flex>
          ))
        )}
      </Box>

      {/* Add to Blacklist Modal */}
      {isAddOpen && (
        <Box
          position="fixed"
          inset="0"
          bg="rgba(5, 12, 23, 0.54)"
          display="grid"
          placeItems="center"
          zIndex="1200"
          p={4}
        >
          <Box
            w="min(480px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            border="1px solid"
            borderColor={themeColors.panel.border}
            overflow="hidden"
            boxShadow="0 20px 50px rgba(0,0,0,0.3)"
          >
            <Flex
              px={6}
              py={4}
              justify="space-between"
              align="center"
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <Box>
                <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                  Add Device to Blacklist
                </Text>
                <Text fontSize="12px" color={themeColors.text.muted} mt={0.5}>
                  Specify the serial or MAC address to block from gateway connections
                </Text>
              </Box>
              <Button size="sm" variant="ghost" onClick={() => setIsAddOpen(false)}>
                <Icon name="x" size={16} />
              </Button>
            </Flex>

            <Box p={6}>
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    Serial Number or MAC Address <span style={{ color: themeColors.text.required }}>*</span>
                  </Text>
                  <Input
                    placeholder="e.g. 60cf84f22290 or 00:11:22:33:44:55"
                    value={newMac}
                    onChange={(e) => setNewMac(e.target.value)}
                    borderColor={themeColors.input.border}
                    fontSize="13px"
                  />
                </Box>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    Reason for Blocking
                  </Text>
                  <Input
                    placeholder="e.g. Compromised firmware or rogue testing AP"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    borderColor={themeColors.input.border}
                    fontSize="13px"
                  />
                </Box>
              </VStack>
            </Box>

            <Flex
              px={6}
              py={3}
              bg="#f8fafc"
              borderTop="1px solid"
              borderColor={themeColors.panel.divider}
              justify="flex-end"
              gap={3}
            >
              <Button size="sm" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                bg="#dc2626"
                color="#ffffff"
                _hover={{ bg: '#b91c1c' }}
                onClick={handleAdd}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? <Spinner size="xs" /> : 'Confirm Block'}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* Remove Confirmation Modal */}
      {deviceToRemove && (
        <DeviceActionConfirmModal
          isOpen={!!deviceToRemove}
          onClose={() => setDeviceToRemove(null)}
          onConfirm={handleRemove}
          title="Unblock Device"
          description={`Are you sure you want to remove ${deviceToRemove.serialNumber} from the blacklist? This device will be permitted to connect again.`}
          confirmLabel="Unblock Device"
          confirmVariant="primary"
          icon="device"
        />
      )}
    </DeviceCard>
  );
};

export default DeviceBlacklistTab;

