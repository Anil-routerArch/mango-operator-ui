import React, { useState, useEffect } from 'react';
import { Box, Textarea } from '@chakra-ui/react';
import { useUpdateDeviceTag } from '@/api/devices';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice } from '@/types/device';
import { normalizeRrmForSubmission } from './rrmHelper';

export interface StateSubTabProps {
  device: UnifiedFleetDevice;
  isDisabled?: boolean;
}

export const StateSubTab: React.FC<StateSubTabProps> = ({ device, isDisabled = false }) => {
  const [stateValue, setStateValue] = useState(device.state || '');

  useEffect(() => {
    if (device.state !== undefined) {
      setStateValue(device.state || '');
    }
  }, [device.state]);

  const updateMutation = useUpdateDeviceTag();

  const handleBlur = async () => {
    if (stateValue === (device.state || '')) return;
    try {
      const resolvedType =
        device.provTag?.deviceType ||
        (device.deviceType && !['ap', 'switch', 'olg'].includes(device.deviceType) ? device.deviceType : device.model) ||
        'asus_rt-ax53u';
      const resolvedGroup =
        device.provTag?.deviceGroup ||
        (['ap', 'switch', 'olg'].includes(device.deviceGroup) ? device.deviceGroup : 'ap');

      await updateMutation.mutateAsync({
        serialNumber: device.serialNumber,
        payload: {
          name: device.name || device.serialNumber,
          description: device.description || '',
          notes: (device.provTag?.notes || device.notes || []).map((n) => ({ note: n.note })),
          deviceType: resolvedType,
          deviceGroup: resolvedGroup,
          devClass: device.provTag?.devClass || 'venue',
          deviceConfiguration: device.provTag?.deviceConfiguration ?? (device.configId || ''),
          deviceRules: {
            firmwareUpgrade: (device.provTag?.deviceRules?.firmwareUpgrade as string) || 'inherit',
            rcOnly: (device.provTag?.deviceRules?.rcOnly as string) || 'inherit',
            rrm: normalizeRrmForSubmission(device.provTag?.deviceRules?.rrm),
          },
          doNotAllowOverrides: Boolean(device.provTag?.doNotAllowOverrides),
          entity: device.provTag?.entity || device.entityId || '',
          venue: device.provTag?.venue || device.venueId || '',
          subscriber: device.provTag?.subscriber ?? (device.subscriberId || ''),
          state: stateValue,
        },
      });
      toaster.create({
        title: 'State Saved',
        description: `State updated for ${device.serialNumber}`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Could not save state',
        type: 'error',
      });
    }
  };

  return (
    <Box p={6}>
      <Textarea
        value={stateValue}
        onChange={(e) => setStateValue(e.target.value)}
        onBlur={handleBlur}
        disabled={isDisabled}
        minH="100px"
        p={3}
        borderRadius="8px"
        borderColor="#3b82f6"
        bg="#ffffff"
        fontSize="13px"
        outline="none"
        _focus={{ borderColor: '#2563eb', boxShadow: '0 0 0 1px #2563eb' }}
      />
    </Box>
  );
};

export default StateSubTab;
