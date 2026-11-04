import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useUpdateDeviceTag, useGetDeviceTypeInfo } from '@/api/devices';
import { useGetEntities, useGetVenues } from '@/api/users';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice } from '@/types/device';
import { RrmEditorField } from './RrmEditorField';
import { normalizeRrmForSubmission } from './rrmHelper';

export interface MainConfigSubTabProps {
  device: UnifiedFleetDevice;
}

const DEVICE_TYPES_BY_GROUP: Record<string, string[]> = {
  ap: [
    'asus_rt-ax53u',
    'edgecore_eap104',
    'edgecore_eap102',
    'edgecore_eap101',
    'cig_wf188n',
    'cig_wf194c',
    'gl_inet_ax1800',
    'indio_um-305ac',
    'wlan_ap_generic',
  ],
  switch: [
    'edgecore_ecs4100_12ph',
    'edgecore_ecs4100_28p',
    'edgecore_ecs4100_52p',
    'generic_switch',
  ],
  olg: [
    'asus_rt-ax53u',
    'gl_inet_ax1800',
    'generic_olg',
    'openlan_gateway',
  ],
};

export const MainConfigSubTab: React.FC<MainConfigSubTabProps> = ({ device }) => {
  const resolveInitialParent = (d: UnifiedFleetDevice): string => {
    if (d.provTag?.venue) return `ven:${d.provTag.venue}`;
    if (d.provTag?.entity) return `ent:${d.provTag.entity}`;
    if (d.venueId) return `ven:${d.venueId}`;
    if (d.entityId) return `ent:${d.entityId}`;
    return '';
  };

  const resolveInitialGroup = (dev: UnifiedFleetDevice): string => {
    if (dev.provTag?.deviceGroup) return dev.provTag.deviceGroup;
    const rawGrp = dev.deviceGroup;
    if (rawGrp === 'ap' || rawGrp === 'switch' || rawGrp === 'olg') return rawGrp;
    return 'ap';
  };

  const resolveInitialType = (dev: UnifiedFleetDevice): string => {
    if (dev.provTag?.deviceType) return dev.provTag.deviceType;
    if (dev.deviceType && dev.deviceType !== 'ap' && dev.deviceType !== 'switch' && dev.deviceType !== 'olg') {
      return dev.deviceType;
    }
    if (dev.model && dev.model !== 'Universal AP') return dev.model;
    return 'asus_rt-ax53u';
  };

  const [name, setName] = useState(device.name || device.serialNumber);
  const [description, setDescription] = useState(device.description || '');
  const [deviceGroup, setDeviceGroup] = useState(resolveInitialGroup(device));
  const [deviceType, setDeviceType] = useState(resolveInitialType(device));
  const [parent, setParent] = useState(resolveInitialParent(device));
  const [rcOnly, setRcOnly] = useState<'inherit' | 'yes' | 'no'>(
    (device.provTag?.deviceRules?.rcOnly as 'inherit' | 'yes' | 'no') || 'inherit'
  );
  const [rrm, setRrm] = useState<string>(
    (device.provTag?.deviceRules?.rrm as string) || 'inherit'
  );
  const [firmwareUpgrade, setFirmwareUpgrade] = useState<'inherit' | 'yes' | 'no'>(
    (device.provTag?.deviceRules?.firmwareUpgrade as 'inherit' | 'yes' | 'no') || 'inherit'
  );
  const [devClass, setDevClass] = useState<'any' | 'entity' | 'venue' | 'subscriber'>(
    (device.provTag?.devClass as 'any' | 'entity' | 'venue' | 'subscriber') || 'any'
  );
  const [ignoreOverrides, setIgnoreOverrides] = useState<boolean>(
    Boolean(device.provTag?.doNotAllowOverrides)
  );

  useEffect(() => {
    if (device) {
      setName(device.name || device.serialNumber);
      setDescription(device.description || '');
      setDeviceGroup(resolveInitialGroup(device));
      setDeviceType(resolveInitialType(device));
      setParent(resolveInitialParent(device));
      if (device.provTag) {
        if (device.provTag.devClass) setDevClass(device.provTag.devClass as 'any' | 'entity' | 'venue' | 'subscriber');
        if (device.provTag.doNotAllowOverrides !== undefined) setIgnoreOverrides(device.provTag.doNotAllowOverrides);
        if (device.provTag.deviceRules) {
          if (device.provTag.deviceRules.rcOnly) setRcOnly(device.provTag.deviceRules.rcOnly as 'inherit' | 'yes' | 'no');
          if (device.provTag.deviceRules.rrm !== undefined) {
            setRrm((device.provTag.deviceRules.rrm as string) || 'inherit');
          }
          if (device.provTag.deviceRules.firmwareUpgrade) setFirmwareUpgrade(device.provTag.deviceRules.firmwareUpgrade as 'inherit' | 'yes' | 'no');
        }
      }
    }
  }, [device]);

  const { data: fmsDeviceTypeInfo } = useGetDeviceTypeInfo();
  const { data: entities = [] } = useGetEntities();
  const { data: venues = [] } = useGetVenues();

  const sortedEntities = useMemo(
    () => [...entities].sort((a, b) => a.name.localeCompare(b.name)),
    [entities]
  );
  const sortedVenues = useMemo(
    () => [...venues].sort((a, b) => a.name.localeCompare(b.name)),
    [venues]
  );

  const availableDeviceClasses = useMemo(() => {
    if (fmsDeviceTypeInfo?.deviceClasses && fmsDeviceTypeInfo.deviceClasses.length > 0) {
      return fmsDeviceTypeInfo.deviceClasses;
    }
    return ['ap', 'switch', 'olg'];
  }, [fmsDeviceTypeInfo]);

  const availableDeviceTypes = useMemo(() => {
    if (fmsDeviceTypeInfo?.deviceTypesByClass && fmsDeviceTypeInfo.deviceTypesByClass[deviceGroup]) {
      return fmsDeviceTypeInfo.deviceTypesByClass[deviceGroup];
    }
    return DEVICE_TYPES_BY_GROUP[deviceGroup] || ['asus_rt-ax53u', 'edgecore_eap104'];
  }, [fmsDeviceTypeInfo, deviceGroup]);

  // Handle group change
  const handleGroupChange = (newGroup: string) => {
    setDeviceGroup(newGroup);
    const validTypes =
      fmsDeviceTypeInfo?.deviceTypesByClass?.[newGroup] ||
      DEVICE_TYPES_BY_GROUP[newGroup] ||
      [];
    if (!validTypes.includes(deviceType)) {
      setDeviceType(validTypes[0] || 'asus_rt-ax53u');
    }
  };

  const updateMutation = useUpdateDeviceTag();

  const handleSave = async () => {
    try {
      const entityId = parent.startsWith('ent:') ? parent.slice(4) : '';
      const venueId = parent.startsWith('ven:') ? parent.slice(4) : '';

      await updateMutation.mutateAsync({
        serialNumber: device.serialNumber,
        payload: {
          name,
          description,
          notes: (device.provTag?.notes || device.notes || []).map((n) => ({ note: n.note })),
          deviceType,
          deviceGroup,
          devClass,
          deviceConfiguration: device.provTag?.deviceConfiguration ?? (device.configId || ''),
          deviceRules: {
            firmwareUpgrade,
            rcOnly,
            rrm: normalizeRrmForSubmission(rrm),
          },
          doNotAllowOverrides: ignoreOverrides,
          entity: entityId,
          venue: venueId,
          subscriber: device.provTag?.subscriber ?? (device.subscriberId || ''),
          state: device.provTag?.state ?? (device.state || ''),
        },
      });
      toaster.create({
        title: 'Device Tag Updated',
        description: `Configuration properties saved for ${device.serialNumber} in OWPROV`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Could not update device tag',
        type: 'error',
      });
    }
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    paddingLeft: '10px',
    paddingRight: '10px',
    borderRadius: '6px',
    border: `1px solid ${themeColors.input.border}`,
    fontSize: '13px',
    backgroundColor: '#ffffff',
    color: themeColors.text.primary,
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Row 1: Primary Identification & Platform Hierarchy */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4, xl: 7 }} gap={4}>
          {/* 1. Serial Number */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Serial Number <span style={{ color: '#ef4444' }}>*</span>
            </Text>
            <Input
              value={device.serialNumber}
              disabled
              bg="#f8fafc"
              borderColor={themeColors.input.border}
              fontSize="13px"
              fontFamily="monospace"
              h="36px"
            />
          </Box>

          {/* 2. Name */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Name <span style={{ color: '#ef4444' }}>*</span>
            </Text>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 60cf84f22290"
              borderColor={themeColors.input.border}
              fontSize="13px"
              h="36px"
            />
          </Box>

          {/* 3. Description */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Description
            </Text>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description..."
              borderColor={themeColors.input.border}
              fontSize="13px"
              h="36px"
            />
          </Box>

          {/* 4. Device Group */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Device Group <span style={{ color: '#ef4444' }}>*</span>
            </Text>
            <select
              value={deviceGroup}
              onChange={(e) => handleGroupChange(e.target.value)}
              style={selectStyle}
            >
              {availableDeviceClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === 'ap'
                    ? 'ap (Wi-Fi Access Point)'
                    : cls === 'switch'
                      ? 'switch (Network Switch)'
                      : cls === 'olg'
                        ? 'olg (OpenLAN Gateway)'
                        : cls}
                </option>
              ))}
            </select>
          </Box>

          {/* 5. Device Type */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Device Type <span style={{ color: '#ef4444' }}>*</span>
            </Text>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              style={selectStyle}
            >
              {availableDeviceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Box>

          {/* 6. Parent */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Parent
            </Text>
            <select
              value={parent}
              onChange={(e) => setParent(e.target.value)}
              style={selectStyle}
            >
              <option value="">None</option>

              {parent &&
                !sortedEntities.some((e) => `ent:${e.id}` === parent) &&
                !sortedVenues.some((v) => `ven:${v.id}` === parent) && (
                  <option value={parent}>
                    {parent.startsWith('ven:')
                      ? `${device.venueName || parent.slice(4)} (Venue)`
                      : parent.startsWith('ent:')
                        ? `${device.entityName || parent.slice(4)} (Entity)`
                        : parent}
                  </option>
                )}

              {sortedEntities.length > 0 && (
                <optgroup label="Entities">
                  {sortedEntities.map((ent) => (
                    <option key={`ent:${ent.id}`} value={`ent:${ent.id}`}>
                      {ent.name}{ent.description ? `: ${ent.description}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}

              {sortedVenues.length > 0 && (
                <optgroup label="Venues">
                  {sortedVenues.map((ven) => (
                    <option key={`ven:${ven.id}`} value={`ven:${ven.id}`}>
                      {ven.name}{ven.description ? `: ${ven.description}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </Box>

          {/* 7. Release Candidates Only */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Release Candidates Only
            </Text>
            <select
              value={rcOnly}
              onChange={(e) => setRcOnly(e.target.value as 'inherit' | 'yes' | 'no')}
              style={selectStyle}
            >
              <option value="inherit">Inherit</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Box>
        </SimpleGrid>

        {/* Row 2: Operational Rules, Classification & Overrides */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4} pt={2}>
          {/* 8. RRM */}
          <RrmEditorField
            value={rrm}
            onChange={setRrm}
            selectStyle={selectStyle}
          />

          {/* 9. Firmware Upgrade */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Firmware Upgrade
            </Text>
            <select
              value={firmwareUpgrade}
              onChange={(e) =>
                setFirmwareUpgrade(e.target.value as 'inherit' | 'yes' | 'no')
              }
              style={selectStyle}
            >
              <option value="inherit">Inherit</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Box>

          {/* 10. Device Class */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Device Class <span style={{ color: '#ef4444' }}>*</span>
            </Text>
            <select
              value={devClass}
              onChange={(e) =>
                setDevClass(e.target.value as 'any' | 'entity' | 'venue' | 'subscriber')
              }
              style={selectStyle}
            >
              <option value="any">any</option>
              <option value="entity">entity</option>
              <option value="venue">venue</option>
              <option value="subscriber">subscriber</option>
            </select>
          </Box>

          {/* 11. Ignore Configuration Overrides */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Ignore Configuration Overrides <span style={{ color: '#ef4444' }}>*</span>
            </Text>
            <Flex align="center" h="36px" gap={2.5}>
              <Box
                w="38px"
                h="22px"
                borderRadius="full"
                bg={ignoreOverrides ? '#0d9488' : '#cbd5e1'}
                position="relative"
                cursor="pointer"
                transition="background-color 0.2s"
                onClick={() => setIgnoreOverrides(!ignoreOverrides)}
              >
                <Box
                  w="18px"
                  h="18px"
                  borderRadius="full"
                  bg="#ffffff"
                  position="absolute"
                  top="2px"
                  left={ignoreOverrides ? '18px' : '2px'}
                  transition="left 0.2s"
                  boxShadow="0 1px 2px rgba(0,0,0,0.25)"
                />
              </Box>
              <Text fontSize="12px" fontWeight="500" color={ignoreOverrides ? '#0d9488' : themeColors.text.muted}>
                {ignoreOverrides ? 'Yes' : 'No'}
              </Text>
            </Flex>
          </Box>
        </SimpleGrid>

        {/* Save Bar */}
        <Flex justify="flex-end" pt={4} borderTop="1px solid" borderColor={themeColors.panel.divider}>
          <Button
            size="sm"
            bg={themeColors.brand.primary}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.primaryHover }}
            onClick={handleSave}
            disabled={updateMutation.isPending}
            gap={1.5}
            px={5}
          >
            {updateMutation.isPending ? <Spinner size="xs" /> : <Icon name="check" size={14} />}
            Save Changes
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default MainConfigSubTab;
