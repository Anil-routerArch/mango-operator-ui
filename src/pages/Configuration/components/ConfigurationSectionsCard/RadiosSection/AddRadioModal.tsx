import React from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { SingleRadioConfigItem } from '../types';

interface AddRadioModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBands: SingleRadioConfigItem['band'][];
  onAddRadio: (band: SingleRadioConfigItem['band']) => void;
}

const ALL_BANDS: { key: SingleRadioConfigItem['band']; label: string }[] = [
  { key: '2G', label: '2G' },
  { key: '5G', label: '5G' },
  { key: '5G-lower', label: '5G-lower' },
  { key: '5G-upper', label: '5G-upper' },
  { key: '6G', label: '6G' },
];

export const AddRadioModal: React.FC<AddRadioModalProps> = ({
  isOpen,
  onClose,
  existingBands,
  onAddRadio,
}) => {
  if (!isOpen) return null;

  const isAtLimit = existingBands.length >= 5;

  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(15, 23, 42, 0.45)"
      backdropFilter="blur(2px)"
      display="grid"
      placeItems="center"
      zIndex={1000}
      p={4}
      onClick={onClose}
    >
      <Box
        w="100%"
        maxW="340px"
        bg="#ffffff"
        borderRadius="12px"
        boxShadow="0 10px 30px rgba(0,0,0,0.15)"
        border="1px solid"
        borderColor="#cbd5e1"
        overflow="hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching screenshot */}
        <Flex
          px={5}
          py={3.5}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor="#e2e8f0"
        >
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
            Add Radio
          </Text>

          <Box
            as="button"
            w="28px"
            h="28px"
            borderRadius="50%"
            border="1px solid"
            borderColor="#cbd5e1"
            display="grid"
            placeItems="center"
            cursor="pointer"
            color="#64748b"
            _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
            onClick={onClose}
            title="Close"
          >
            <Icon name="x" size={14} />
          </Box>
        </Flex>

        {/* Body with vertical pill buttons matching screenshot */}
        <Box px={5} py={6}>
          {isAtLimit && (
            <Box
              mb={4}
              p={3}
              borderRadius="8px"
              bg="#fee2e2"
              border="1px solid #fecaca"
              color="#dc2626"
              fontSize="12px"
              fontWeight="600"
              textAlign="center"
            >
              Maximum limit of 5 radio bands reached.
            </Box>
          )}

          <VStack gap={3.5} align="center">
            {ALL_BANDS.map(({ key, label }) => {
              const isAlreadyAdded = existingBands.includes(key);
              const isDisabled = isAlreadyAdded || isAtLimit;

              return (
                <Box
                  key={key}
                  as="button"
                  px={6}
                  py={2}
                  w="170px"
                  borderRadius="20px"
                  bg={isAlreadyAdded ? '#e2e8f0' : '#2563eb'}
                  color={isAlreadyAdded ? '#94a3b8' : '#ffffff'}
                  fontSize="13px"
                  fontWeight="600"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  cursor={isDisabled ? 'not-allowed' : 'pointer'}
                  opacity={isDisabled ? 0.6 : 1}
                  transition="all 0.15s ease"
                  _hover={
                    !isDisabled
                      ? {
                          bg: '#1d4ed8',
                          transform: 'scale(1.02)',
                        }
                      : {}
                  }
                  onClick={() => {
                    if (isDisabled) return;
                    onAddRadio(key);
                    onClose();
                  }}
                  title={
                    isAlreadyAdded
                      ? `${label} is already added`
                      : `Add ${label} radio`
                  }
                >
                  <Text as="span">{label}</Text>
                  <Icon name="plus" size={12} />
                </Box>
              );
            })}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

