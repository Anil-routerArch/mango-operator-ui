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
import type { Ipv4PortForwardItem } from '../types/ipv4';

export interface PortForwardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  portForward: Ipv4PortForwardItem[];
  onSave: (rules: Ipv4PortForwardItem[]) => void;
  disabled?: boolean;
}

type PortSortField = 'protocol' | 'externalPort' | 'internalPort' | 'internalAddress' | null;

const PortForwardingDialog: React.FC<Omit<PortForwardingModalProps, 'isOpen'>> = ({
  onClose,
  portForward,
  onSave,
  disabled = false,
}) => {
  const [draftRules, setDraftRules] = useState<Ipv4PortForwardItem[]>(() => [
    ...portForward,
  ]);

  // Form state
  const [protocol, setProtocol] = useState<string>('any');
  const [extMode, setExtMode] = useState<'single' | 'range'>('single');
  const [extSingle, setExtSingle] = useState<number | string>(1000);
  const [extStart, setExtStart] = useState<number | string>(1000);
  const [extEnd, setExtEnd] = useState<number | string>(1010);

  const [intMode, setIntMode] = useState<'single' | 'range'>('single');
  const [intSingle, setIntSingle] = useState<number | string>(2000);
  const [intStart, setIntStart] = useState<number | string>(2000);
  const [intEnd, setIntEnd] = useState<number | string>(2010);

  const [internalAddress, setInternalAddress] = useState<string>('');

  // Sorting & pagination
  const [sortField, setSortField] = useState<PortSortField>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleReset = () => {
    setProtocol('any');
    setExtMode('single');
    setExtSingle(1000);
    setExtStart(1000);
    setExtEnd(1010);
    setIntMode('single');
    setIntSingle(2000);
    setIntStart(2000);
    setIntEnd(2010);
    setInternalAddress('');
  };

  const isAddValid = useMemo(() => {
    if (!internalAddress.trim()) return false;
    if (extMode === 'single' && (!extSingle || Number(extSingle) <= 0)) return false;
    if (extMode === 'range' && (!extStart || !extEnd || Number(extStart) <= 0 || Number(extEnd) < Number(extStart))) return false;
    if (intMode === 'single' && (!intSingle || Number(intSingle) <= 0)) return false;
    if (intMode === 'range' && (!intStart || !intEnd || Number(intStart) <= 0 || Number(intEnd) < Number(intStart))) return false;
    return true;
  }, [internalAddress, extMode, extSingle, extStart, extEnd, intMode, intSingle, intStart, intEnd]);

  const handleAdd = () => {
    if (!isAddValid) return;

    const externalPort =
      extMode === 'range'
        ? `${Number(extStart)}-${Number(extEnd)}`
        : Number(extSingle);

    const internalPort =
      intMode === 'range'
        ? `${Number(intStart)}-${Number(intEnd)}`
        : Number(intSingle);

    setDraftRules((prev) => [
      ...prev,
      {
        id: `pf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        protocol,
        externalPort,
        internalPort,
        internalAddress: internalAddress.trim(),
      },
    ]);

    handleReset();
  };

  const sortedList = useMemo(() => {
    if (!sortField) return draftRules;
    return [...draftRules].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'protocol') {
        cmp = a.protocol.localeCompare(b.protocol);
      } else if (sortField === 'externalPort') {
        cmp = String(a.externalPort).localeCompare(String(b.externalPort));
      } else if (sortField === 'internalPort') {
        cmp = String(a.internalPort).localeCompare(String(b.internalPort));
      } else if (sortField === 'internalAddress') {
        cmp = a.internalAddress.localeCompare(b.internalAddress);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [draftRules, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedList.length / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const paginatedList = sortedList.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleDelete = (indexToDelete: number) => {
    const actualItem = paginatedList[indexToDelete];
    const updated = draftRules.filter((item) => item !== actualItem);
    setDraftRules(updated);
    const maxPage = Math.max(1, Math.ceil(updated.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  };

  const handleSave = () => {
    onSave(draftRules);
    onClose();
  };

  const handleSort = (field: PortSortField) => {
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
            IPv4 Port Forwarding
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
                title="Save port forwarding rules"
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
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                protocol <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Box w="120px">
                <SelectDropdown
                  size="sm"
                  value={protocol}
                  onChange={(val) => setProtocol(String(val))}
                  options={[
                    { value: 'any', label: 'any' },
                    { value: 'tcp', label: 'tcp' },
                    { value: 'udp', label: 'udp' },
                  ]}
                  disabled={disabled}
                />
              </Box>
            </Box>

            {/* external-port */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                external-port <Text as="span" color="#dc2626">*</Text>
              </Text>
              <HStack gap={2} align="center">
                <Box w="110px">
                  <SelectDropdown
                    size="sm"
                    value={extMode}
                    onChange={(val) => setExtMode(val as 'single' | 'range')}
                    options={[
                      { value: 'single', label: 'Single' },
                      { value: 'range', label: 'Range' },
                    ]}
                    disabled={disabled}
                  />
                </Box>
                {extMode === 'single' ? (
                  <Input
                    size="sm"
                    w="110px"
                    type="number"
                    min={1}
                    max={65535}
                    value={extSingle}
                    onChange={(e) => setExtSingle(e.target.value)}
                    disabled={disabled}
                    borderRadius="8px"
                    borderColor="#cbd5e1"
                  />
                ) : (
                  <HStack gap={2}>
                    <Input
                      size="sm"
                      w="100px"
                      type="number"
                      min={1}
                      max={65535}
                      value={extStart}
                      onChange={(e) => setExtStart(e.target.value)}
                      placeholder="Start"
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                    <Text fontSize="12px" color="#64748b">-</Text>
                    <Input
                      size="sm"
                      w="100px"
                      type="number"
                      min={1}
                      max={65535}
                      value={extEnd}
                      onChange={(e) => setExtEnd(e.target.value)}
                      placeholder="End"
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  </HStack>
                )}
              </HStack>
            </Box>

            {/* internal-port & internal-address */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  internal-port <Text as="span" color="#dc2626">*</Text>
                </Text>
                <HStack gap={2} align="center">
                  <Box w="110px">
                    <SelectDropdown
                      size="sm"
                      value={intMode}
                      onChange={(val) => setIntMode(val as 'single' | 'range')}
                      options={[
                        { value: 'single', label: 'Single' },
                        { value: 'range', label: 'Range' },
                      ]}
                      disabled={disabled}
                    />
                  </Box>
                  {intMode === 'single' ? (
                    <Input
                      size="sm"
                      w="110px"
                      type="number"
                      min={1}
                      max={65535}
                      value={intSingle}
                      onChange={(e) => setIntSingle(e.target.value)}
                      disabled={disabled}
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                    />
                  ) : (
                    <HStack gap={2}>
                      <Input
                        size="sm"
                        w="100px"
                        type="number"
                        min={1}
                        max={65535}
                        value={intStart}
                        onChange={(e) => setIntStart(e.target.value)}
                        placeholder="Start"
                        disabled={disabled}
                        borderRadius="8px"
                        borderColor="#cbd5e1"
                      />
                      <Text fontSize="12px" color="#64748b">-</Text>
                      <Input
                        size="sm"
                        w="100px"
                        type="number"
                        min={1}
                        max={65535}
                        value={intEnd}
                        onChange={(e) => setIntEnd(e.target.value)}
                        placeholder="End"
                        disabled={disabled}
                        borderRadius="8px"
                        borderColor="#cbd5e1"
                      />
                    </HStack>
                  )}
                </HStack>
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  internal-address <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  value={internalAddress}
                  onChange={(e) => setInternalAddress(e.target.value)}
                  placeholder="0.0.0.120"
                  disabled={disabled}
                  borderRadius="8px"
                  borderColor="#cbd5e1"
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
                  bg={!isAddValid ? '#94a3b8' : '#2563eb'}
                  color="#ffffff"
                  fontSize="12px"
                  fontWeight="600"
                  cursor={!isAddValid ? 'not-allowed' : 'pointer'}
                  _hover={!isAddValid ? undefined : { bg: '#1d4ed8' }}
                  onClick={!isAddValid ? undefined : handleAdd}
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
                      onClick={() => handleSort('protocol')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      w="100px"
                    >
                      <HStack gap={1}>
                        <Text>PROTOCOL</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('externalPort')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>EXTERNAL-PORT</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('internalPort')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>INTERNAL-PORT</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('internalAddress')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      w="160px"
                    >
                      <HStack gap={1}>
                        <Text>INTERNAL-ADDRESS</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      textAlign="center"
                      w="80px"
                    >
                      ACTIONS
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {draftRules.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={5} py={8} textAlign="center">
                        <Text fontSize="13px" fontWeight="700" color="#334155">
                          Empty List
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedList.map((item, idx) => (
                      <Table.Row key={item.id || `rule-${idx}`} _hover={{ bg: '#f8fafc' }}>
                        <Table.Cell fontSize="12px" color="#334155" fontWeight="500">
                          {item.protocol}
                        </Table.Cell>
                        <Table.Cell fontSize="12px" color="#334155">
                          {String(item.externalPort)}
                        </Table.Cell>
                        <Table.Cell fontSize="12px" color="#334155">
                          {String(item.internalPort)}
                        </Table.Cell>
                        <Table.Cell fontSize="12px" color="#334155">
                          {item.internalAddress}
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
                  Page <Text as="span" fontWeight="700">{draftRules.length === 0 ? 1 : safePage}</Text> of{' '}
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

export const PortForwardingModal: React.FC<PortForwardingModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <PortForwardingDialog {...props} />;
};

