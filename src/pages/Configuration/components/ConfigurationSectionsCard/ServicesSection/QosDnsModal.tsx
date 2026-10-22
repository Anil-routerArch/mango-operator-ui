import React, { useMemo, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';

export interface QosClassifierDnsItem {
  fqdn: string;
  suffixMatching: boolean;
  reclassify: boolean;
}

interface QosDnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classifierIndex: number;
  dns: QosClassifierDnsItem[];
  onSave: (dns: QosClassifierDnsItem[]) => void;
  disabled?: boolean;
}

type DnsSortField = 'fqdn' | 'suffixMatching' | 'reclassify' | null;

export const QosDnsModal: React.FC<QosDnsModalProps> = ({
  isOpen,
  onClose,
  classifierIndex,
  dns,
  onSave,
  disabled = false,
}) => {
  const [draftDns, setDraftDns] = useState<QosClassifierDnsItem[]>(() => [...dns]);

  // Form state
  const [fqdn, setFqdn] = useState<string>('');
  const [suffixMatching, setSuffixMatching] = useState<boolean>(true);
  const [reclassify, setReclassify] = useState<boolean>(true);

  // Sorting & pagination
  const [sortField, setSortField] = useState<DnsSortField>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const sortedDns = useMemo(() => {
    if (!sortField) return draftDns;
    return [...draftDns].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'fqdn') {
        cmp = a.fqdn.localeCompare(b.fqdn);
      } else if (sortField === 'suffixMatching') {
        cmp = Number(a.suffixMatching) - Number(b.suffixMatching);
      } else if (sortField === 'reclassify') {
        cmp = Number(a.reclassify) - Number(b.reclassify);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [draftDns, sortField, sortAsc]);

  if (!isOpen) return null;

  const totalPages = Math.max(1, Math.ceil(sortedDns.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedDns = sortedDns.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (field: DnsSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleReset = () => {
    setFqdn('');
    setSuffixMatching(true);
    setReclassify(true);
  };

  const handleAdd = () => {
    if (!fqdn.trim()) return;
    setDraftDns([
      ...draftDns,
      {
        fqdn: fqdn.trim(),
        suffixMatching,
        reclassify,
      },
    ]);
    handleReset();
  };

  const handleDelete = (indexToDelete: number) => {
    const actualItem = paginatedDns[indexToDelete];
    const updated = draftDns.filter((d) => d !== actualItem);
    setDraftDns(updated);
    if (safePage > Math.max(1, Math.ceil(updated.length / pageSize))) {
      setCurrentPage(Math.max(1, Math.ceil(updated.length / pageSize)));
    }
  };

  const handleSave = () => {
    onSave(draftDns);
    onClose();
  };

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1500"
      p={4}
    >
      <Box
        w="min(860px, 95vw)"
        maxH="90vh"
        display="flex"
        flexDirection="column"
        bg="#ffffff"
        borderRadius="12px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        border="1px solid"
        borderColor={themeColors.panel.border}
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          px={5}
          py={3.5}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor="#e2e8f0"
          bg="#ffffff"
        >
          <Text fontSize="15px" fontWeight="700" color="#1e293b">
            configuration.quality-of-service.classifier[{classifierIndex}].dns
          </Text>

          <HStack gap={2}>
            {!disabled && (
              <Box
                as="button"
                w="32px"
                h="32px"
                borderRadius="8px"
                bg="#2563eb"
                color="#ffffff"
                display="grid"
                placeItems="center"
                cursor="pointer"
                _hover={{ bg: '#1d4ed8' }}
                onClick={handleSave}
                title="Save dns"
              >
                <Icon name="save" size={16} />
              </Box>
            )}

            <Box
              as="button"
              w="32px"
              h="32px"
              borderRadius="50%"
              border="1px solid"
              borderColor="#cbd5e1"
              color="#64748b"
              display="grid"
              placeItems="center"
              cursor="pointer"
              _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
              onClick={onClose}
              title="Close"
            >
              <Icon name="x" size={15} />
            </Box>
          </HStack>
        </Flex>

        {/* Modal Scrollable Body */}
        <Box p={6} overflowY="auto" flex="1">
          <VStack gap={5} align="stretch">
            {/* Input Form Fields */}
            {!disabled && (
              <Box>
                <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4} mb={3.5} alignItems="flex-start">
                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                      fqdn <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      value={fqdn}
                      onChange={(e) => setFqdn(e.target.value)}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                      size="sm"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                      suffix-matching <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <ToggleSwitch
                      checked={suffixMatching}
                      onChange={(checked) => setSuffixMatching(checked)}
                      disabled={disabled}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                      reclassify <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <ToggleSwitch
                      checked={reclassify}
                      onChange={(checked) => setReclassify(checked)}
                      disabled={disabled}
                    />
                  </Box>
                </SimpleGrid>

                {/* Action Buttons */}
                <Flex justify="flex-end" gap={2}>
                  <Box
                    as="button"
                    px={4}
                    py={1.5}
                    borderRadius="16px"
                    bg={fqdn.trim() ? '#2563eb' : '#94a3b8'}
                    color="#ffffff"
                    fontSize="12px"
                    fontWeight="600"
                    cursor={fqdn.trim() ? 'pointer' : 'not-allowed'}
                    _hover={fqdn.trim() ? { bg: '#1d4ed8' } : undefined}
                    onClick={handleAdd}
                  >
                    Add
                  </Box>

                  <Box
                    as="button"
                    px={4}
                    py={1.5}
                    borderRadius="16px"
                    border="1px solid"
                    borderColor="#cbd5e1"
                    bg="#ffffff"
                    color="#475569"
                    fontSize="12px"
                    fontWeight="600"
                    cursor="pointer"
                    _hover={{ bg: '#f8fafc' }}
                    onClick={handleReset}
                  >
                    Reset
                  </Box>
                </Flex>
              </Box>
            )}

            {/* DNS Table */}
            <Box
              border="1px solid"
              borderColor="#e2e8f0"
              borderRadius="8px"
              overflow="hidden"
            >
              <Table.Root size="sm" variant="outline">
                <Table.Header bg="#ffffff">
                  <Table.Row borderBottom="1px solid #e2e8f0">
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      py={3}
                      px={4}
                      cursor="pointer"
                      onClick={() => handleSort('fqdn')}
                    >
                      FQDN ○
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      py={3}
                      px={4}
                      cursor="pointer"
                      onClick={() => handleSort('suffixMatching')}
                    >
                      SUFFIX-MATCHING ○
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      py={3}
                      px={4}
                      cursor="pointer"
                      onClick={() => handleSort('reclassify')}
                    >
                      RECLASSIFY ○
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      py={3}
                      px={4}
                      textAlign="right"
                    >
                      ACTIONS
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paginatedDns.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={4} py={12} textAlign="center">
                        <Text fontSize="14px" fontWeight="700" color="#64748b">
                          Empty List
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedDns.map((d, idx) => (
                      <Table.Row key={`${d.fqdn}-${idx}`} _hover={{ bg: '#f8fafc' }}>
                        <Table.Cell py={3} px={4} fontSize="13px" fontWeight="600" color="#1e293b">
                          {d.fqdn}
                        </Table.Cell>
                        <Table.Cell py={3} px={4} fontSize="13px" color="#475569">
                          {d.suffixMatching ? 'true' : 'false'}
                        </Table.Cell>
                        <Table.Cell py={3} px={4} fontSize="13px" color="#475569">
                          {d.reclassify ? 'true' : 'false'}
                        </Table.Cell>
                        <Table.Cell py={3} px={4} textAlign="right">
                          {!disabled && (
                            <Box
                              as="button"
                              w="26px"
                              h="26px"
                              borderRadius="4px"
                              bg="#fee2e2"
                              color="#dc2626"
                              display="inline-grid"
                              placeItems="center"
                              cursor="pointer"
                              _hover={{ bg: '#fca5a5' }}
                              onClick={() => handleDelete(idx)}
                              title="Delete DNS"
                            >
                              <Icon name="trash" size={13} />
                            </Box>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Box>
          </VStack>
        </Box>

        {/* Pagination Footer */}
        <Flex
          px={5}
          py={3}
          align="center"
          justify="space-between"
          borderTop="1px solid"
          borderColor="#e2e8f0"
          bg="#ffffff"
          wrap="wrap"
          gap={3}
        >
          <HStack gap={1.5}>
            <Box
              as="button"
              w="28px"
              h="28px"
              borderRadius="4px"
              border="1px solid"
              borderColor="#cbd5e1"
              display="grid"
              placeItems="center"
              fontSize="12px"
              color={safePage <= 1 ? '#cbd5e1' : '#64748b'}
              cursor={safePage <= 1 ? 'not-allowed' : 'pointer'}
              _hover={safePage <= 1 ? undefined : { bg: '#f1f5f9' }}
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              «
            </Box>
            <Box
              as="button"
              w="28px"
              h="28px"
              borderRadius="4px"
              border="1px solid"
              borderColor="#cbd5e1"
              display="grid"
              placeItems="center"
              fontSize="12px"
              color={safePage <= 1 ? '#cbd5e1' : '#64748b'}
              cursor={safePage <= 1 ? 'not-allowed' : 'pointer'}
              _hover={safePage <= 1 ? undefined : { bg: '#f1f5f9' }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              ‹
            </Box>
          </HStack>

          <HStack gap={3} fontSize="12px" color="#64748b">
            <Text>
              Page <Text as="span" fontWeight="700" color="#0f172a">{draftDns.length === 0 ? 0 : safePage}</Text> of{' '}
              <Text as="span" fontWeight="700" color="#0f172a">{draftDns.length === 0 ? 0 : totalPages}</Text>
            </Text>

            <HStack gap={1.5}>
              <Text>Go to page</Text>
              <Input
                size="xs"
                w="46px"
                h="26px"
                type="number"
                value={safePage}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= totalPages) {
                    setCurrentPage(val);
                  }
                }}
                textAlign="center"
                borderRadius="4px"
                borderColor="#cbd5e1"
              />
            </HStack>

            <Box w="100px">
              <SelectDropdown
                size="sm"
                value={pageSize}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                options={[
                  { value: '5', label: 'Show 5' },
                  { value: '10', label: 'Show 10' },
                  { value: '20', label: 'Show 20' },
                  { value: '50', label: 'Show 50' },
                ]}
              />
            </Box>
          </HStack>

          <HStack gap={1.5}>
            <Box
              as="button"
              w="28px"
              h="28px"
              borderRadius="4px"
              border="1px solid"
              borderColor="#cbd5e1"
              display="grid"
              placeItems="center"
              fontSize="12px"
              color={safePage >= totalPages ? '#cbd5e1' : '#64748b'}
              cursor={safePage >= totalPages ? 'not-allowed' : 'pointer'}
              _hover={safePage >= totalPages ? undefined : { bg: '#f1f5f9' }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              ›
            </Box>
            <Box
              as="button"
              w="28px"
              h="28px"
              borderRadius="4px"
              border="1px solid"
              borderColor="#cbd5e1"
              display="grid"
              placeItems="center"
              fontSize="12px"
              color={safePage >= totalPages ? '#cbd5e1' : '#64748b'}
              cursor={safePage >= totalPages ? 'not-allowed' : 'pointer'}
              _hover={safePage >= totalPages ? undefined : { bg: '#f1f5f9' }}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              »
            </Box>
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
};

