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
import type { SsidMultiPskItem } from '../types';

interface MultiPskModalProps {
  isOpen: boolean;
  onClose: () => void;
  ssidName: string;
  multiPskList: SsidMultiPskItem[];
  onSave: (items: SsidMultiPskItem[]) => void;
  disabled?: boolean;
}

type PskSortField = 'mac' | 'key' | 'vlanId' | null;

const MultiPskDialog: React.FC<Omit<MultiPskModalProps, 'isOpen'>> = ({
  onClose,
  ssidName,
  multiPskList,
  onSave,
  disabled = false,
}) => {
  const [draftList, setDraftList] = useState<SsidMultiPskItem[]>(() => [...multiPskList]);

  // Form input state
  const [mac, setMac] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [vlanId, setVlanId] = useState<number>(1813);

  // Sorting & pagination
  const [sortField, setSortField] = useState<PskSortField>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleReset = () => {
    setMac('');
    setKey('');
    setVlanId(1813);
  };

  const isKeyValid = key.trim().length >= 8 && key.trim().length <= 63;
  const isVlanValid = vlanId >= 1 && vlanId <= 4096;
  const isAddDisabled = disabled || !isKeyValid || !isVlanValid;

  const handleAdd = () => {
    if (isAddDisabled) return;
    setDraftList((prev) => [
      ...prev,
      {
        mac: mac.trim() || undefined,
        key: key.trim(),
        vlanId: Number(vlanId) || 1813,
      },
    ]);
    handleReset();
  };

  const sortedList = useMemo(() => {
    if (!sortField) return draftList;
    return [...draftList].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'mac') {
        cmp = (a.mac || '').localeCompare(b.mac || '');
      } else if (sortField === 'key') {
        cmp = a.key.localeCompare(b.key);
      } else if (sortField === 'vlanId') {
        cmp = a.vlanId - b.vlanId;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [draftList, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedList.length / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const paginatedList = sortedList.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleDelete = (indexToDelete: number) => {
    const actualItem = paginatedList[indexToDelete];
    const updated = draftList.filter((item) => item !== actualItem);
    setDraftList(updated);
    const maxPage = Math.max(1, Math.ceil(updated.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  };

  const handleSave = () => {
    onSave(draftList);
    onClose();
  };

  const handleSort = (field: PskSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1400}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="rgba(15, 23, 42, 0.65)"
      backdropFilter="blur(3px)"
      p={4}
    >
      <Box
        bg="#ffffff"
        borderRadius="12px"
        boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        border="1px solid"
        borderColor="#cbd5e1"
        w="100%"
        maxW="800px"
        maxH="90vh"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          px={6}
          py={4}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor="#e2e8f0"
          bg="#f8fafc"
        >
          <Box>
            <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
              multi-psk
            </Text>
            {ssidName && (
              <Text fontSize="12px" color={themeColors.text.secondary} mt={0.5}>
                SSID: {ssidName}
              </Text>
            )}
          </Box>
          <Box
            as="button"
            p={1.5}
            borderRadius="6px"
            color="#64748b"
            _hover={{ bg: '#e2e8f0', color: '#1e293b' }}
            cursor="pointer"
            onClick={onClose}
          >
            <Icon name="x" size={18} />
          </Box>
        </Flex>

        {/* Content Body */}
        <Box p={6} overflowY="auto" flex={1}>
          <VStack gap={5} align="stretch">
            {/* Form to add item */}
            <Box
              p={4}
              borderRadius="8px"
              border="1px solid"
              borderColor="#e2e8f0"
              bg="#fbfcfd"
            >
              <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={3}>
                Add Multi-PSK Entry
              </Text>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    mac
                  </Text>
                  <Input
                    size="sm"
                    value={mac}
                    onChange={(e) => setMac(e.target.value)}
                    placeholder="aa:bb:cc:dd:ee:ff (optional)"
                    disabled={disabled}
                    borderRadius="6px"
                    borderColor="#cbd5e1"
                  />
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    key <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Input
                    size="sm"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Min 8, max 63 characters"
                    disabled={disabled}
                    borderRadius="6px"
                    borderColor={key.length > 0 && !isKeyValid ? '#ef4444' : '#cbd5e1'}
                  />
                  {key.length > 0 && !isKeyValid && (
                    <Text fontSize="10px" color="#dc2626" mt={0.5}>
                      Must be between 8 and 63 characters
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                    vlan-id <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    min={1}
                    max={4096}
                    value={vlanId}
                    onChange={(e) => setVlanId(Number(e.target.value))}
                    disabled={disabled}
                    borderRadius="6px"
                    borderColor={!isVlanValid ? '#ef4444' : '#cbd5e1'}
                  />
                  {!isVlanValid && (
                    <Text fontSize="10px" color="#dc2626" mt={0.5}>
                      VLAN must be 1 - 4096
                    </Text>
                  )}
                </Box>
              </SimpleGrid>

              {/* Action Buttons for Form */}
              <Flex justify="flex-end" gap={2}>
                <Box
                  as="button"
                  display="inline-flex"
                  alignItems="center"
                  gap={1.5}
                  px={3}
                  py={1.5}
                  borderRadius="6px"
                  border="1px solid"
                  borderColor="#cbd5e1"
                  bg="#ffffff"
                  color="#475569"
                  fontSize="12px"
                  fontWeight="600"
                  cursor={disabled ? 'not-allowed' : 'pointer'}
                  _hover={disabled ? {} : { bg: '#f1f5f9' }}
                  onClick={() => !disabled && handleReset()}
                >
                  <Icon name="refresh" size={13} />
                  Reset
                </Box>

                <Box
                  as="button"
                  display="inline-flex"
                  alignItems="center"
                  gap={1.5}
                  px={4}
                  py={1.5}
                  borderRadius="6px"
                  bg={isAddDisabled ? '#94a3b8' : '#2563eb'}
                  color="#ffffff"
                  fontSize="12px"
                  fontWeight="600"
                  cursor={isAddDisabled ? 'not-allowed' : 'pointer'}
                  _hover={isAddDisabled ? {} : { bg: '#1d4ed8' }}
                  onClick={handleAdd}
                >
                  <Icon name="plus" size={13} />
                  Add
                </Box>
              </Flex>
            </Box>

            {/* Entries Table */}
            <Box
              border="1px solid"
              borderColor="#e2e8f0"
              borderRadius="8px"
              overflow="hidden"
            >
              <Table.Root size="sm" variant="outline">
                <Table.Header bg="#f8fafc">
                  <Table.Row>
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#475569"
                      cursor="pointer"
                      onClick={() => handleSort('mac')}
                    >
                      <HStack gap={1}>
                        <Text>mac</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>

                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#475569"
                      cursor="pointer"
                      onClick={() => handleSort('key')}
                    >
                      <HStack gap={1}>
                        <Text>key</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>

                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#475569"
                      cursor="pointer"
                      onClick={() => handleSort('vlanId')}
                    >
                      <HStack gap={1}>
                        <Text>vlan-id</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>

                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#475569"
                      textAlign="right"
                      w="80px"
                    >
                      ACTIONS
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {paginatedList.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={4} textAlign="center" py={6} color="#94a3b8" fontSize="12px">
                        No entries found
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedList.map((entry, index) => (
                      <Table.Row key={`${entry.key}-${entry.vlanId}-${index}`} _hover={{ bg: '#f8fafc' }}>
                        <Table.Cell fontSize="12px" color="#1e293b" fontFamily="mono">
                          {entry.mac || '-'}
                        </Table.Cell>

                        <Table.Cell fontSize="12px" color="#1e293b" fontFamily="mono">
                          {entry.key}
                        </Table.Cell>

                        <Table.Cell fontSize="12px" color="#1e293b">
                          {entry.vlanId}
                        </Table.Cell>

                        <Table.Cell textAlign="right">
                          <Box
                            as="button"
                            p={1}
                            borderRadius="4px"
                            color="#dc2626"
                            cursor={disabled ? 'not-allowed' : 'pointer'}
                            _hover={{ bg: '#fee2e2' }}
                            onClick={() => !disabled && handleDelete(index)}
                            title="Delete entry"
                          >
                            <Icon name="trash" size={14} />
                          </Box>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>

              {/* Table Footer / Pagination */}
              <Flex
                px={4}
                py={2.5}
                align="center"
                justify="space-between"
                borderTop="1px solid"
                borderColor="#e2e8f0"
                bg="#f8fafc"
              >
                <HStack gap={2}>
                  <Text fontSize="11px" color="#64748b">
                    Rows per page:
                  </Text>
                  <SelectDropdown
                    value={pageSize}
                    onChange={(val) => {
                      setPageSize(Number(val));
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: 10, label: '10' },
                      { value: 20, label: '20' },
                      { value: 50, label: '50' },
                    ]}
                    w="70px"
                  />
                </HStack>

                <HStack gap={2}>
                  <Text fontSize="11px" color="#64748b">
                    Page {safePage} of {totalPages || 1} ({sortedList.length} total)
                  </Text>
                  <HStack gap={1}>
                    <Box
                      as="button"
                      px={2}
                      py={1}
                      borderRadius="4px"
                      border="1px solid"
                      borderColor="#cbd5e1"
                      bg="#ffffff"
                      color="#475569"
                      cursor={safePage <= 1 ? 'not-allowed' : 'pointer'}
                      opacity={safePage <= 1 ? 0.5 : 1}
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
                      bg="#ffffff"
                      color="#475569"
                      cursor={safePage <= 1 ? 'not-allowed' : 'pointer'}
                      opacity={safePage <= 1 ? 0.5 : 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      title="Previous page"
                    >
                      ‹
                    </Box>
                    <Box
                      as="button"
                      px={2}
                      py={1}
                      borderRadius="4px"
                      border="1px solid"
                      borderColor="#cbd5e1"
                      bg="#ffffff"
                      color="#475569"
                      cursor={safePage >= totalPages ? 'not-allowed' : 'pointer'}
                      opacity={safePage >= totalPages ? 0.5 : 1}
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
                      bg="#ffffff"
                      color="#475569"
                      cursor={safePage >= totalPages ? 'not-allowed' : 'pointer'}
                      opacity={safePage >= totalPages ? 0.5 : 1}
                      onClick={() => setCurrentPage(totalPages)}
                      title="Last page"
                    >
                      »
                    </Box>
                  </HStack>
                </HStack>
              </Flex>
            </Box>
          </VStack>
        </Box>

        {/* Modal Actions Footer */}
        <Flex
          px={6}
          py={3.5}
          align="center"
          justify="flex-end"
          gap={3}
          borderTop="1px solid"
          borderColor="#e2e8f0"
          bg="#f8fafc"
        >
          <Box
            as="button"
            px={4}
            py={1.5}
            borderRadius="6px"
            border="1px solid"
            borderColor="#cbd5e1"
            bg="#ffffff"
            color="#475569"
            fontSize="12px"
            fontWeight="600"
            cursor="pointer"
            _hover={{ bg: '#f1f5f9' }}
            onClick={onClose}
          >
            Close
          </Box>
          <Box
            as="button"
            px={5}
            py={1.5}
            borderRadius="6px"
            bg={disabled ? '#94a3b8' : '#2563eb'}
            color="#ffffff"
            fontSize="12px"
            fontWeight="600"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            _hover={disabled ? {} : { bg: '#1d4ed8' }}
            onClick={() => !disabled && handleSave()}
          >
            Save
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export const MultiPskModal: React.FC<MultiPskModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <MultiPskDialog {...props} />;
};

