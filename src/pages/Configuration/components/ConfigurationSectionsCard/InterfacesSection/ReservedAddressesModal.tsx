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
import type { DhcpReservedAddressItem } from '../types';

interface ReservedAddressesModalProps {
  isOpen: boolean;
  onClose: () => void;
  interfaceName: string;
  reservedAddresses: DhcpReservedAddressItem[];
  onSave: (addresses: DhcpReservedAddressItem[]) => void;
  disabled?: boolean;
}

type ReservedSortField = 'macaddr' | 'staticLeaseOffset' | 'leaseTime' | 'publishHostname' | null;

const ReservedAddressesDialog: React.FC<Omit<ReservedAddressesModalProps, 'isOpen'>> = ({
  onClose,
  reservedAddresses,
  onSave,
  disabled = false,
}) => {
  const [draftAddresses, setDraftAddresses] = useState<DhcpReservedAddressItem[]>(() => [
    ...reservedAddresses,
  ]);

  // Form state
  const [macaddr, setMacaddr] = useState<string>('');
  const [staticLeaseOffset, setStaticLeaseOffset] = useState<number>(2);
  const [leaseTime, setLeaseTime] = useState<string>('6h');
  const [publishHostname, setPublishHostname] = useState<boolean>(true);

  // Sorting & pagination
  const [sortField, setSortField] = useState<ReservedSortField>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleReset = () => {
    setMacaddr('');
    setStaticLeaseOffset(2);
    setLeaseTime('6h');
    setPublishHostname(true);
  };

  const handleAdd = () => {
    if (!macaddr.trim()) return;
    setDraftAddresses((prev) => [
      ...prev,
      {
        macaddr: macaddr.trim(),
        staticLeaseOffset: Number(staticLeaseOffset) || 2,
        leaseTime: leaseTime.trim() || '6h',
        publishHostname,
      },
    ]);
    handleReset();
  };

  const sortedList = useMemo(() => {
    if (!sortField) return draftAddresses;
    return [...draftAddresses].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'macaddr') {
        cmp = a.macaddr.localeCompare(b.macaddr);
      } else if (sortField === 'staticLeaseOffset') {
        cmp = (a.staticLeaseOffset || 0) - (b.staticLeaseOffset || 0);
      } else if (sortField === 'leaseTime') {
        cmp = a.leaseTime.localeCompare(b.leaseTime);
      } else if (sortField === 'publishHostname') {
        cmp = Number(a.publishHostname) - Number(b.publishHostname);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [draftAddresses, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedList.length / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const paginatedList = sortedList.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleDelete = (indexToDelete: number) => {
    const actualItem = paginatedList[indexToDelete];
    const updated = draftAddresses.filter((item) => item !== actualItem);
    setDraftAddresses(updated);
    const maxPage = Math.max(1, Math.ceil(updated.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  };

  const handleSave = () => {
    onSave(draftAddresses);
    onClose();
  };

  const handleSort = (field: ReservedSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const isAddDisabled = !macaddr.trim();

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
        w="min(800px, 95vw)"
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
        {/* Modal Header */}
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
            Reserved Addresses
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
                title="Save reserved addresses"
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
        <Box p={5} overflowY="auto" flex="1">
          <VStack gap={4} align="stretch">
            {/* Form Fields */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={3}>
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  MAC Address <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  value={macaddr}
                  onChange={(e) => setMacaddr(e.target.value)}
                  placeholder="00:11:22:33:44:55"
                  disabled={disabled}
                  borderRadius="8px"
                  borderColor="#cbd5e1"
                />
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  static-lease-offset <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  type="number"
                  min={1}
                  value={staticLeaseOffset}
                  onChange={(e) => setStaticLeaseOffset(Number(e.target.value) || 1)}
                  disabled={disabled}
                  borderRadius="8px"
                  borderColor="#cbd5e1"
                />
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  lease-time <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  value={leaseTime}
                  onChange={(e) => setLeaseTime(e.target.value)}
                  placeholder="6h"
                  disabled={disabled}
                  borderRadius="8px"
                  borderColor="#cbd5e1"
                />
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                  publish-hostname
                </Text>
                <ToggleSwitch
                  checked={publishHostname}
                  onChange={setPublishHostname}
                  label=""
                  disabled={disabled}
                />
              </Box>
            </SimpleGrid>

            {/* Add & Reset Buttons */}
            {!disabled && (
              <Flex justify="flex-end" gap={2} mt={1}>
                <Box
                  as="button"
                  px={4}
                  py={1.5}
                  borderRadius="8px"
                  bg={isAddDisabled ? '#94a3b8' : '#2563eb'}
                  color="#ffffff"
                  fontSize="12px"
                  fontWeight="600"
                  cursor={isAddDisabled ? 'not-allowed' : 'pointer'}
                  _hover={isAddDisabled ? undefined : { bg: '#1d4ed8' }}
                  onClick={isAddDisabled ? undefined : handleAdd}
                >
                  Add
                </Box>
                <Box
                  as="button"
                  px={4}
                  py={1.5}
                  borderRadius="8px"
                  border="1px solid"
                  borderColor="#cbd5e1"
                  bg="#ffffff"
                  color="#334155"
                  fontSize="12px"
                  fontWeight="600"
                  cursor="pointer"
                  _hover={{ bg: '#f8fafc' }}
                  onClick={handleReset}
                >
                  Reset
                </Box>
              </Flex>
            )}

            {/* Table */}
            <Box
              border="1px solid"
              borderColor="#e2e8f0"
              borderRadius="8px"
              overflow="hidden"
              mt={3}
            >
              <Table.Root size="sm" variant="outline">
                <Table.Header bg="#f8fafc">
                  <Table.Row>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('macaddr')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>macaddr</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('staticLeaseOffset')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>static-lease-offset</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('leaseTime')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>lease-time</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('publishHostname')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>publish-hostname</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      textAlign="center"
                    >
                      ACTIONS
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {draftAddresses.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={5} py={8} textAlign="center">
                        <Text fontSize="13px" fontWeight="700" color="#334155">
                          Empty List
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedList.map((item, idx) => (
                      <Table.Row key={`addr-${idx}`} _hover={{ bg: '#f8fafc' }}>
                        <Table.Cell fontSize="12px" color="#334155" fontWeight="500">
                          {item.macaddr}
                        </Table.Cell>
                        <Table.Cell fontSize="12px" color="#334155">
                          {item.staticLeaseOffset ?? '-'}
                        </Table.Cell>
                        <Table.Cell fontSize="12px" color="#334155">
                          {item.leaseTime}
                        </Table.Cell>
                        <Table.Cell fontSize="12px" color="#334155">
                          {item.publishHostname ? 'Yes' : 'No'}
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          {!disabled && (
                            <Box
                              as="button"
                              w="24px"
                              h="24px"
                              borderRadius="50%"
                              bg="#fee2e2"
                              color="#dc2626"
                              display="inline-grid"
                              placeItems="center"
                              cursor="pointer"
                              _hover={{ bg: '#fca5a5' }}
                              onClick={() => handleDelete(idx)}
                              title="Remove"
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

            {/* Pagination Controls */}
            <Flex
              align="center"
              justify="space-between"
              px={2}
              py={3}
              fontSize="12px"
              color="#64748b"
              wrap="wrap"
              gap={2}
            >
              <HStack gap={1}>
                <Box
                  as="button"
                  px={2}
                  py={1}
                  borderRadius="4px"
                  border="1px solid"
                  borderColor="#cbd5e1"
                  cursor={safePage <= 1 ? 'not-allowed' : 'pointer'}
                  opacity={safePage <= 1 ? 0.4 : 1}
                  onClick={() => setCurrentPage(1)}
                  title="First page"
                >
                  «
                </Box>
                <Box
                  as="button"
                  px={2}
                  py={1}
                  borderRadius="4px"
                  border="1px solid"
                  borderColor="#cbd5e1"
                  cursor={safePage <= 1 ? 'not-allowed' : 'pointer'}
                  opacity={safePage <= 1 ? 0.4 : 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                >
                  ‹
                </Box>
              </HStack>

              <HStack gap={3}>
                <Text>
                  Page <Text as="span" fontWeight="700">{draftAddresses.length === 0 ? 1 : safePage}</Text> of{' '}
                  <Text as="span" fontWeight="700">{totalPages}</Text>
                </Text>
                <HStack gap={1}>
                  <Text>Go to page</Text>
                  <Input
                    size="xs"
                    w="45px"
                    type="number"
                    min={1}
                    max={totalPages || 1}
                    value={safePage}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      if (p >= 1 && p <= totalPages) setCurrentPage(p);
                    }}
                    textAlign="center"
                    borderRadius="4px"
                    borderColor="#dc2626"
                  />
                </HStack>
                <HStack gap={1}>
                  <Text>Show</Text>
                  <SelectDropdown
                    size="sm"
                    value={pageSize}
                    onChange={(val) => setPageSize(Number(val))}
                    options={[
                      { value: 10, label: '10' },
                      { value: 25, label: '25' },
                      { value: 50, label: '50' },
                    ]}
                    w="60px"
                  />
                </HStack>
              </HStack>

              <HStack gap={1}>
                <Box
                  as="button"
                  px={2}
                  py={1}
                  borderRadius="4px"
                  border="1px solid"
                  borderColor="#cbd5e1"
                  cursor={safePage >= totalPages ? 'not-allowed' : 'pointer'}
                  opacity={safePage >= totalPages ? 0.4 : 1}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                >
                  ›
                </Box>
                <Box
                  as="button"
                  px={2}
                  py={1}
                  borderRadius="4px"
                  border="1px solid"
                  borderColor="#cbd5e1"
                  cursor={safePage >= totalPages ? 'not-allowed' : 'pointer'}
                  opacity={safePage >= totalPages ? 0.4 : 1}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last page"
                >
                  »
                </Box>
              </HStack>
            </Flex>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export const ReservedAddressesModal: React.FC<ReservedAddressesModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <ReservedAddressesDialog {...props} />;
};

