import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { GeneralInfoCard } from '../GeneralInfoCard';
import { SingleRadio } from './SingleRadio';
import { AddRadioModal } from './AddRadioModal';
import type { RadiosSectionData, SingleRadioConfigItem } from '../types';

export interface RadiosSectionProps {
  data: RadiosSectionData;
  onChange: (data: RadiosSectionData) => void;
  onDeleteSection: () => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const RadiosSection: React.FC<RadiosSectionProps> = ({
  data,
  onChange,
  onDeleteSection,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const [selectedRadioId, setSelectedRadioId] = useState<string>(
    () => data.bands[0]?.id || ''
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeRadio =
    data.bands.find((b) => b.id === selectedRadioId) || data.bands[0];

  const existingBands = useMemo(
    () => data.bands.map((b) => b.band),
    [data.bands]
  );

  const handleUpdateActiveRadio = (updated: SingleRadioConfigItem) => {
    onChange({
      ...data,
      bands: data.bands.map((b) => (b.id === updated.id ? updated : b)),
    });
  };

  const handleAddRadioBand = (band: SingleRadioConfigItem['band']) => {
    const newRadio: SingleRadioConfigItem = {
      id: `radio-${Date.now()}`,
      band,
      bandwidth: 5,
      country: 'US',
      channelMode: band === '6G' ? 'HE' : 'HT',
      channelWidth: band === '6G' ? 80 : 40,
      channel: 'auto',
      mimo: 'None',
      txPower: 20,
      legacyRates: false,
      maximumClients: 64,
      multipleBssid: false,
      allowDfs: true,
      beaconRate: 'None',
      beaconInterval: 100,
      hostapdIfaceRaw: '',
      multicast: 'None',
      ema: false,
      requireMode: 'None',
    };

    onChange({
      ...data,
      bands: [...data.bands, newRadio],
    });
    setSelectedRadioId(newRadio.id);
  };

  const handleDeleteRadio = (id: string) => {
    const filtered = data.bands.filter((b) => b.id !== id);
    onChange({
      ...data,
      bands: filtered,
    });
    if (selectedRadioId === id) {
      setSelectedRadioId(filtered[0]?.id || '');
    }
  };

  return (
    <VStack gap={4} align="stretch">
      {/* General Information Card */}
      <GeneralInfoCard
        meta={data.meta}
        onChange={(meta) => onChange({ ...data, meta })}
        onDeleteSection={onDeleteSection}
        disabled={disabled}
        isDefaultConfig={isDefaultConfig}
      />

      {/* Radios Container Card */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        overflow="hidden"
      >
        {/* Radio Bands Tab Bar */}
        {data.bands.length > 0 && (
          <Flex
            px={3}
            pt={2}
            bg="#f8fafc"
            borderBottom="1px solid"
            borderColor={themeColors.panel.divider}
            align="center"
            gap={1}
            overflowX="auto"
          >
            {data.bands.map((radio) => {
              const isTabActive = activeRadio?.id === radio.id;
              return (
                <Box
                  key={radio.id}
                  as="button"
                  px={3.5}
                  py={2}
                  fontSize="12px"
                  fontWeight="700"
                  cursor="pointer"
                  borderTop="2px solid"
                  borderColor={isTabActive ? themeColors.brand.accent : 'transparent'}
                  color={isTabActive ? themeColors.brand.accent : themeColors.text.secondary}
                  bg={isTabActive ? '#ffffff' : 'transparent'}
                  borderRadius="4px 4px 0 0"
                  borderLeft={isTabActive ? '1px solid' : 'none'}
                  borderRight={isTabActive ? '1px solid' : 'none'}
                  borderLeftColor={themeColors.panel.divider}
                  borderRightColor={themeColors.panel.divider}
                  onClick={() => setSelectedRadioId(radio.id)}
                >
                  {radio.band} Radio
                </Box>
              );
            })}

            {/* Plus button to open Add Radio modal */}
            {!disabled && (
              <Box
                as="button"
                w="26px"
                h="26px"
                borderRadius="4px"
                bg="#2563eb"
                color="#ffffff"
                display="grid"
                placeItems="center"
                cursor="pointer"
                _hover={{ bg: '#1d4ed8' }}
                onClick={() => setIsAddModalOpen(true)}
                title="Add Radio band"
                ml={1}
              >
                <Icon name="plus" size={14} />
              </Box>
            )}
          </Flex>
        )}

        {/* Active Radio Form Body or Empty State */}
        {data.bands.length === 0 ? (
          <Box p={8} textAlign="center" bg="#ffffff">
            <Text fontSize="14px" fontWeight="600" color={themeColors.text.title} mb={2}>
              No Radio Bands Configured
            </Text>
            <Text fontSize="12px" color={themeColors.text.secondary} mb={4}>
              No frequency bands have been added yet. Click below to add a radio band.
            </Text>
            {!disabled && (
              <Box
                as="button"
                display="inline-flex"
                alignItems="center"
                gap={1.5}
                px={4}
                py={2}
                borderRadius="4px"
                bg="#2563eb"
                color="#ffffff"
                fontSize="13px"
                fontWeight="600"
                cursor="pointer"
                _hover={{ bg: '#1d4ed8' }}
                onClick={() => setIsAddModalOpen(true)}
              >
                <Icon name="plus" size={14} />
                Add Radio Band
              </Box>
            )}
          </Box>
        ) : (
          activeRadio && (
            <SingleRadio
              radio={activeRadio}
              onChange={handleUpdateActiveRadio}
              onDelete={() => handleDeleteRadio(activeRadio.id)}
              canDelete={true}
              disabled={disabled}
              isDefaultConfig={isDefaultConfig}
            />
          )
        )}
      </Box>

      {/* Add Radio Modal */}
      <AddRadioModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        existingBands={existingBands}
        onAddRadio={handleAddRadioBand}
      />
    </VStack>
  );
};

