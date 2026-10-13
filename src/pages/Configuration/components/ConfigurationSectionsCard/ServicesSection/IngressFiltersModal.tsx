import React, { useState } from 'react';
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

export interface IngressFilterItem {
  name: string;
  program: string;
}

interface IngressFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: IngressFilterItem[];
  onSave: (filters: IngressFilterItem[]) => void;
  disabled?: boolean;
}

export const IngressFiltersModal: React.FC<IngressFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onSave,
  disabled = false,
}) => {
  const [draftFilters, setDraftFilters] = useState<IngressFilterItem[]>(() => [...filters]);
  const [name, setName] = useState('');
  const [program, setProgram] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  if (!isOpen) return null;

  const totalPages = Math.max(1, Math.ceil(draftFilters.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedFilters = draftFilters.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleAdd = () => {
    if (!name.trim() || !program.trim()) return;
    setDraftFilters([...draftFilters, { name: name.trim(), program: program.trim() }]);
    setName('');
    setProgram('');
  };

  const handleReset = () => {
    setName('');
    setProgram('');
  };

  const handleDelete = (indexToDelete: number) => {
    const actualIndex = (safePage - 1) * pageSize + indexToDelete;
    const updated = draftFilters.filter((_, idx) => idx !== actualIndex);
    setDraftFilters(updated);
    if (safePage > Math.max(1, Math.ceil(updated.length / pageSize))) {
      setCurrentPage(Math.max(1, Math.ceil(updated.length / pageSize)));
    }
  };

  const handleSave = () => {
    onSave(draftFilters);
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
            configuration.data-plane.ingress-filters
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
                title="Save filters"
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
            {/* Input Form Row */}
            {!disabled && (
              <Box>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={3}>
                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                      name <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder=""
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                      size="sm"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                      program <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      placeholder=""
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                      size="sm"
                    />
                  </Box>
                </SimpleGrid>

                <Flex justify="flex-end" gap={2}>
                  <Box
                    as="button"
                    px={4}
                    py={1.5}
                    borderRadius="16px"
                    bg={name.trim() && program.trim() ? '#2563eb' : '#94a3b8'}
                    color="#ffffff"
                    fontSize="13px"
                    fontWeight="600"
                    cursor={name.trim() && program.trim() ? 'pointer' : 'not-allowed'}
                    _hover={name.trim() && program.trim() ? { bg: '#1d4ed8' } : undefined}
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
                    color="#64748b"
                    fontSize="13px"
                    fontWeight="600"
                    cursor="pointer"
                    _hover={{ bg: '#f8fafc', color: '#1e293b' }}
                    onClick={handleReset}
                  >
                    Reset
                  </Box>
                </Flex>
              </Box>
            )}

            {/* Table */}
            <Box border="1px solid" borderColor="#e2e8f0" borderRadius="8px" overflow="hidden">
              <Table.Root size="sm" variant="outline">
                <Table.Header bg="#f8fafc">
                  <Table.Row>
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      py={3}
                      px={4}
                    >
                      NAME
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      py={3}
                      px={4}
                    >
                      PROGRAM
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
                  {paginatedFilters.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={3} py={12} textAlign="center">
                        <Text fontSize="14px" fontWeight="700" color="#64748b">
                          Empty List
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedFilters.map((f, idx) => (
                      <Table.Row key={`${f.name}-${idx}`} _hover={{ bg: '#f8fafc' }}>
                        <Table.Cell py={3} px={4} fontSize="13px" fontWeight="600" color="#1e293b">
                          {f.name}
                        </Table.Cell>
                        <Table.Cell py={3} px={4} fontSize="13px" color="#475569">
                          {f.program}
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
                              title="Delete filter"
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

        {/* Pagination Footer matching screenshot */}
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
              Page <Text as="span" fontWeight="700" color="#0f172a">{draftFilters.length === 0 ? 0 : safePage}</Text> of{' '}
              <Text as="span" fontWeight="700" color="#0f172a">{draftFilters.length === 0 ? 0 : totalPages}</Text>
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

