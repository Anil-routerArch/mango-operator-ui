import React, { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { IngressFiltersModal } from './IngressFiltersModal';
import type { ServicesSectionData } from '../types';

interface DataPlaneProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const DataPlane: React.FC<DataPlaneProps> = ({
  data,
  onChange,
  disabled = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        overflow="hidden"
      >
        <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
          <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
            Data Plane
          </Text>
        </Flex>
        <Box p={4}>
          <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={2}>
            ingress-filters <Text as="span" color="#dc2626">*</Text>
          </Text>
          <Box
            as="button"
            w="100%"
            py={1.5}
            px={3}
            borderRadius="6px"
            bg="#2563eb"
            color="#ffffff"
            fontSize="12px"
            fontWeight="600"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            _hover={{ bg: '#1d4ed8' }}
            onClick={() => !disabled && setIsModalOpen(true)}
          >
            Manage ingress-filters ({data.dataPlane.ingressFilters.length} entries)
          </Box>
        </Box>
      </Box>

      <IngressFiltersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        filters={data.dataPlane.ingressFilters}
        onSave={(updatedFilters) =>
          onChange({
            ...data,
            dataPlane: {
              ...data.dataPlane,
              ingressFilters: updatedFilters,
            },
          })
        }
        disabled={disabled}
      />
    </>
  );
};
