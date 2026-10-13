import React, { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { RadiusProxyRealmsModal, type RadiusProxyRealmItem } from './RadiusProxyRealmsModal';
import type { ServicesSectionData } from '../types';

interface RadiusProxyProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const RadiusProxy: React.FC<RadiusProxyProps> = ({ data, onChange, disabled = false }) => {
  const [isRealmsModalOpen, setIsRealmsModalOpen] = useState(false);

  return (
    <>
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        position="relative"
        overflow="visible"
      >
        <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
          <Text
            fontSize="14px"
            fontWeight="700"
            color={themeColors.text.title}
            textDecoration="underline"
            textUnderlineOffset="3px"
          >
            Radius Proxy
          </Text>
        </Flex>
        <Box p={4}>
          <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
            realms <Text as="span" color="#dc2626">*</Text>
          </Text>
          <Box
            as="button"
            px={4}
            py={2}
            borderRadius="8px"
            bg="#2563eb"
            color="#ffffff"
            fontSize="12px"
            fontWeight="600"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            _hover={disabled ? undefined : { bg: '#1d4ed8' }}
            onClick={() => setIsRealmsModalOpen(true)}
          >
            Manage realms ({data.radiusProxy.realms.length} entries)
          </Box>
        </Box>
      </Box>

      {/* Realms Modal */}
      <RadiusProxyRealmsModal
        isOpen={isRealmsModalOpen}
        onClose={() => setIsRealmsModalOpen(false)}
        realms={data.radiusProxy.realms}
        onSave={(newRealms: RadiusProxyRealmItem[]) =>
          onChange({
            ...data,
            radiusProxy: {
              ...data.radiusProxy,
              realms: newRealms,
            },
          })
        }
        disabled={disabled}
      />
    </>
  );
};
