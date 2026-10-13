import React, { useState } from 'react';
import { Box, Flex, HStack, Input, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import {
  QOS_SELECT_PORTS_OPTIONS,
  DSCP_OPTIONS,
} from './servicesConstants';
import { QosPortsModal, type QosClassifierPortItem } from './QosPortsModal';
import { QosDnsModal, type QosClassifierDnsItem } from './QosDnsModal';
import type { ServicesSectionData } from '../types';

interface QualityOfServiceProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const QualityOfService: React.FC<QualityOfServiceProps> = ({ data, onChange, disabled = false }) => {
  const [portsModalIndex, setPortsModalIndex] = useState<number | null>(null);
  const [dnsModalIndex, setDnsModalIndex] = useState<number | null>(null);

  const classifiers = data.qualityOfService.classifier || [];

  const handleAddClassifier = () => {
    const updated = [...classifiers, { dscp: 'CS0', ports: [], dns: [] }];
    onChange({
      ...data,
      qualityOfService: {
        ...data.qualityOfService,
        classifier: updated,
      },
    });
  };

  const handleRemoveClassifier = (idx: number) => {
    const updated = classifiers.filter((_, i) => i !== idx);
    onChange({
      ...data,
      qualityOfService: {
        ...data.qualityOfService,
        classifier: updated,
      },
    });
  };

  const handleDscpChange = (idx: number, newDscp: string) => {
    const updated = classifiers.map((c, i) => (i === idx ? { ...c, dscp: newDscp } : c));
    onChange({
      ...data,
      qualityOfService: {
        ...data.qualityOfService,
        classifier: updated,
      },
    });
  };

  const handleSavePorts = (idx: number, newPorts: QosClassifierPortItem[]) => {
    const updated = classifiers.map((c, i) => (i === idx ? { ...c, ports: newPorts } : c));
    onChange({
      ...data,
      qualityOfService: {
        ...data.qualityOfService,
        classifier: updated,
      },
    });
  };

  const handleSaveDns = (idx: number, newDns: QosClassifierDnsItem[]) => {
    const updated = classifiers.map((c, i) => (i === idx ? { ...c, dns: newDns } : c));
    onChange({
      ...data,
      qualityOfService: {
        ...data.qualityOfService,
        classifier: updated,
      },
    });
  };

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
            Quality of Service
          </Text>
        </Flex>

        <Box p={4}>
          <VStack gap={4} align="stretch">
            {/* select-ports */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                select-ports <Text as="span" color="#dc2626">*</Text>
              </Text>
              <MultiSelectDropdown
                value={data.qualityOfService.selectPorts}
                onChange={(val) =>
                  onChange({
                    ...data,
                    qualityOfService: {
                      ...data.qualityOfService,
                      selectPorts: val,
                    },
                  })
                }
                options={QOS_SELECT_PORTS_OPTIONS}
                disabled={disabled}
                placeholder="Select..."
              />
            </Box>

            {/* bandwidth-up */}
            <Box w="100px">
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                bandwidth-up <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                type="number"
                min={0}
                value={data.qualityOfService.bandwidthUp}
                onChange={(e) =>
                  onChange({
                    ...data,
                    qualityOfService: {
                      ...data.qualityOfService,
                      bandwidthUp: Number(e.target.value) || 0,
                    },
                  })
                }
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>

            {/* bandwidth-down */}
            <Box w="100px">
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                bandwidth-down <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                type="number"
                min={0}
                value={data.qualityOfService.bandwidthDown}
                onChange={(e) =>
                  onChange({
                    ...data,
                    qualityOfService: {
                      ...data.qualityOfService,
                      bandwidthDown: Number(e.target.value) || 0,
                    },
                  })
                }
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>

            {/* Bulk Detection */}
            <Box>
              <Flex align="center" gap={3}>
                <Text fontSize="12px" fontWeight="600" color="#334155">
                  Bulk Detection
                </Text>
                <ToggleSwitch
                  checked={Boolean(data.qualityOfService.bulkDetection)}
                  onChange={(checked) =>
                    onChange({
                      ...data,
                      qualityOfService: {
                        ...data.qualityOfService,
                        bulkDetection: checked,
                      },
                    })
                  }
                  disabled={disabled}
                />
              </Flex>

              {data.qualityOfService.bulkDetection && (
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4} mt={3} p={3} bg="#f8fafc" borderRadius="8px">
                  <Box w="120px">
                    <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                      dscp <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <SelectDropdown
                      size="sm"
                      value={data.qualityOfService.bulkDetectionDscp || 'CS0'}
                      onChange={(val) =>
                        onChange({
                          ...data,
                          qualityOfService: {
                            ...data.qualityOfService,
                            bulkDetectionDscp: String(val),
                          },
                        })
                      }
                      options={DSCP_OPTIONS}
                      disabled={disabled}
                      w="100%"
                    />
                  </Box>
                  <Box w="120px">
                    <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                      packets-per-second <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      size="sm"
                      type="number"
                      min={0}
                      value={data.qualityOfService.bulkDetectionPacketsPerSecond || 0}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          qualityOfService: {
                            ...data.qualityOfService,
                            bulkDetectionPacketsPerSecond: Number(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </Box>
                </SimpleGrid>
              )}
            </Box>

            {/* Classifiers */}
            <Box pt={1}>
              <HStack gap={2} mb={3}>
                <Text fontSize="13px" fontWeight="700" color="#1e293b">
                  Classifiers
                </Text>
                {!disabled && (
                  <Box
                    as="button"
                    w="22px"
                    h="22px"
                    borderRadius="50%"
                    bg="#2563eb"
                    color="#ffffff"
                    display="grid"
                    placeItems="center"
                    cursor="pointer"
                    _hover={{ bg: '#1d4ed8' }}
                    onClick={handleAddClassifier}
                    title="Add"
                  >
                    <Icon name="plus" size={14} />
                  </Box>
                )}
              </HStack>

              {classifiers.length > 0 && (
                <VStack gap={3} align="stretch">
                  {classifiers.map((classifier, idx) => (
                    <Box
                      key={`classifier-${idx}`}
                      border="1px solid"
                      borderColor="#cbd5e1"
                      borderRadius="8px"
                      p={3.5}
                      bg="#ffffff"
                    >
                      <Flex align="center" justify="space-between" mb={3}>
                        <Text fontSize="12px" fontWeight="700" color="#1e293b">
                          #{idx}
                        </Text>
                        {!disabled && (
                          <Box
                            as="button"
                            w="24px"
                            h="24px"
                            borderRadius="50%"
                            bg="#fee2e2"
                            color="#dc2626"
                            display="grid"
                            placeItems="center"
                            cursor="pointer"
                            _hover={{ bg: '#fca5a5' }}
                            onClick={() => handleRemoveClassifier(idx)}
                            title="Delete Classifier"
                          >
                            <Icon name="trash" size={13} />
                          </Box>
                        )}
                      </Flex>

                      <VStack gap={3.5} align="stretch">
                        {/* Row 1: dscp and ports */}
                        <Flex gap={4} wrap="wrap" align="flex-start" justify="space-between">
                          <Box w={{ base: '100%', sm: '120px' }}>
                            <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                              dscp <Text as="span" color="#dc2626">*</Text>
                            </Text>
                            <SelectDropdown
                              size="sm"
                              value={classifier.dscp || 'CS0'}
                              onChange={(val) => handleDscpChange(idx, String(val))}
                              options={DSCP_OPTIONS}
                              disabled={disabled}
                              w="100%"
                            />
                          </Box>

                          <Box flex="1" minW="160px">
                            <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                              ports <Text as="span" color="#dc2626">*</Text>
                            </Text>
                            <Box
                              as="button"
                              w="fit-content"
                              maxW="100%"
                              px={3.5}
                              py={1.5}
                              borderRadius="8px"
                              bg="#2563eb"
                              color="#ffffff"
                              fontSize="12px"
                              fontWeight="600"
                              cursor={disabled ? 'not-allowed' : 'pointer'}
                              _hover={disabled ? undefined : { bg: '#1d4ed8' }}
                              onClick={() => setPortsModalIndex(idx)}
                            >
                              Manage ports ({classifier.ports?.length || 0} entries)
                            </Box>
                          </Box>
                        </Flex>

                        {/* Row 2: dns (below) */}
                        <Box>
                          <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                            dns <Text as="span" color="#dc2626">*</Text>
                          </Text>
                          <Box
                            as="button"
                            w="fit-content"
                            maxW="100%"
                            px={3.5}
                            py={1.5}
                            borderRadius="8px"
                            bg="#2563eb"
                            color="#ffffff"
                            fontSize="12px"
                            fontWeight="600"
                            cursor={disabled ? 'not-allowed' : 'pointer'}
                            _hover={disabled ? undefined : { bg: '#1d4ed8' }}
                            onClick={() => setDnsModalIndex(idx)}
                          >
                            Manage dns ({classifier.dns?.length || 0} entries)
                          </Box>
                        </Box>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </Box>
      </Box>

      {/* Ports Modal */}
      {portsModalIndex !== null && (
        <QosPortsModal
          isOpen={portsModalIndex !== null}
          onClose={() => setPortsModalIndex(null)}
          classifierIndex={portsModalIndex}
          ports={classifiers[portsModalIndex]?.ports || []}
          onSave={(newPorts) => {
            handleSavePorts(portsModalIndex, newPorts);
          }}
          disabled={disabled}
        />
      )}

      {/* DNS Modal */}
      {dnsModalIndex !== null && (
        <QosDnsModal
          isOpen={dnsModalIndex !== null}
          onClose={() => setDnsModalIndex(null)}
          classifierIndex={dnsModalIndex}
          dns={classifiers[dnsModalIndex]?.dns || []}
          onSave={(newDns) => {
            handleSaveDns(dnsModalIndex, newDns);
          }}
          disabled={disabled}
        />
      )}
    </>
  );
};
