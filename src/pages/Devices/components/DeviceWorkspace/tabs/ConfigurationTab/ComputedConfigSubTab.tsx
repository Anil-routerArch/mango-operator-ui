import React, { useState } from 'react';
import {
  Box,
  Flex,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useDeviceComputedConfiguration } from '@/api/devices';
import { Icon } from '@/components/icons/Icon';
import type { UnifiedFleetDevice } from '@/types/device';

export interface ComputedConfigSubTabProps {
  device: UnifiedFleetDevice;
}

export const ComputedConfigSubTab: React.FC<ComputedConfigSubTabProps> = ({ device }) => {
  const { data: computedData, isLoading, isFetching, refetch } = useDeviceComputedConfiguration(device.serialNumber);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  if (isLoading && !computedData) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="md" color="#0d9488" />
      </Box>
    );
  }

  if (!computedData || computedData.config === 'none') {
    return (
      <Box p={6}>
        <Flex
          p={4}
          bg="#eff6ff"
          border="1px solid #bfdbfe"
          borderRadius="6px"
          align="center"
          gap={3}
        >
          <Icon name="info" size={16} />
          <Text fontSize="13px" color="#1e40af">
            No computed configuration available for this device.
          </Text>
        </Flex>
      </Box>
    );
  }

  const explanations = computedData.explanation || [];

  return (
    <Box p={6}>
      {/* 1. Configuration Header & Refresh */}
      <Flex mb={2} align="center" justify="space-between">
        <Text fontSize="15px" fontWeight="700" color="#111827">
          Configuration
        </Text>
        <Box
          as="button"
          w="30px"
          h="30px"
          borderRadius="full"
          border="1px solid"
          borderColor="#cbd5e1"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          bg="#ffffff"
          _hover={{ bg: '#f8fafc', borderColor: '#94a3b8' }}
          onClick={() => !isFetching && refetch()}
          opacity={isFetching ? 0.6 : 1}
          title="Refresh"
        >
          {isFetching ? (
            <Spinner size="xs" />
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#475569"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          )}
        </Box>
      </Flex>

      {/* 2. Configuration Code Box */}
      <Box
        border="1px solid"
        borderColor="#cbd5e1"
        borderRadius="5px"
        h="calc(30vh)"
        minH="180px"
        overflowY="auto"
        p={3}
        bg="#ffffff"
      >
        <pre style={{ margin: 0, fontSize: '13px', fontFamily: 'monospace', color: '#1e293b' }}>
          {JSON.stringify(computedData.config, null, 2)}
        </pre>
      </Box>

      {/* 3. Explanation Header */}
      <Text mt={4} mb={2} fontSize="15px" fontWeight="700" color="#111827">
        Explanation
      </Text>

      {/* 4. Explanation Accordion Box */}
      <Box
        border="1px solid"
        borderColor="#cbd5e1"
        borderRadius="5px"
        h="calc(30vh)"
        minH="180px"
        overflowY="auto"
        bg="#ffffff"
      >
        {explanations.length === 0 ? (
          <Box p={4}>
            <Text fontSize="13px" color="#64748b">
              No explanation data available.
            </Text>
          </Box>
        ) : (
          explanations.map((exp, idx) => {
            const isAdded = exp.action === 'added' || exp['from-name'] === 'overrides';
            const isExpanded = expandedIndices.has(idx);
            const bg = isAdded ? '#38a169' : '#fef08a';
            const hoverBg = isAdded ? '#2f855a' : '#fde047';
            const textColor = isAdded ? '#ffffff' : '#000000';
            const title = isAdded
              ? exp['from-name']
              : `${exp['from-name'] || 'CONFIG'}${exp.reason ? `: ${exp.reason}` : ''}`;

            return (
              <Box key={idx} borderBottom="1px solid" borderColor="#e2e8f0" _last={{ borderBottom: 'none' }}>
                <Flex
                  align="center"
                  justify="space-between"
                  px={4}
                  py={2}
                  bg={bg}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  userSelect="none"
                  onClick={() => toggleExpand(idx)}
                  color={textColor}
                >
                  <Text fontSize="13px" fontWeight="500">
                    {title}
                  </Text>
                  <Box
                    transform={isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}
                    transition="transform 0.15s ease"
                    display="flex"
                    alignItems="center"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </Box>
                </Flex>
                {isExpanded && (
                  <Box p={3} bg="#ffffff" borderTop="1px solid #e2e8f0" overflowX="auto">
                    <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', color: '#1e293b' }}>
                      {JSON.stringify(exp, null, 2)}
                    </pre>
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default ComputedConfigSubTab;
