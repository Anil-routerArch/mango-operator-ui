import React, { useState, useEffect } from 'react';
import { Box, Textarea } from '@chakra-ui/react';
import { useUpdateDeviceTag } from '@/api/devices';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice } from '@/types/device';

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
    if (!device.provTag) {
      toaster.create({
        title: 'Action Blocked',
        description: 'Cannot update state while authoritative inventory is unavailable from OWPROV',
        type: 'error',
      });
      return;
    }
    try {
      const authoritativeDevClass = device.provTag?.devClass || 'any';

      // Field-scoped update (Issue #4):
      // Only submit the fields managed by StateSubTab plus minimum required validation fields.
      // Omit configuration IDs, device rules, parent associations, subscriber, and hardware type.
      await updateMutation.mutateAsync({
        serialNumber: device.serialNumber,
        payload: {
          name: device.name || device.serialNumber,
          devClass: authoritativeDevClass,
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
