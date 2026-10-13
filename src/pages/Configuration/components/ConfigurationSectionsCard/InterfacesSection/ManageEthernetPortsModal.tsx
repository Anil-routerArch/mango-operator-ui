import React, { useMemo, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Input,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import {
  INTERFACE_ETHERNET_PORTS_OPTIONS,
  INTERFACE_ETHERNET_VLAN_TAG_OPTIONS,
} from './interfacesConstants';
import type { InterfaceEthernetItem } from '../types';

interface ManageEthernetPortsModalProps {
  isOpen: boolean;
  onClose: () => void;
  interfaceIndex: number;
  interfaceName: string;
  ethernet: InterfaceEthernetItem[];
  onSave: (ethernet: InterfaceEthernetItem[]) => void;
  disabled?: boolean;
}

type EthernetSortField = 'selectPorts' | 'macaddr' | 'multicast' | 'learning' | 'reversePath' | 'vlanTag' | null;

const ManageEthernetPortsDialog: React.FC<Omit<ManageEthernetPortsModalProps, 'isOpen'>> = ({
  onClose,
  interfaceIndex,
  ethernet,
  onSave,
  disabled = false,
}) => {
  const [draftEthernet, setDraftEthernet] = useState<InterfaceEthernetItem[]>(() => [...ethernet]);

  // Form State
  const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
  const [macaddr, setMacaddr] = useState<string>('');
  const [multicast, setMulticast] = useState<boolean>(true);
  const [learning, setLearning] = useState<boolean>(true);
  const [reversePath, setReversePath] = useState<boolean>(false);
  const [vlanTag, setVlanTag] = useState<string>('auto');

  // Sorting & pagination
  const [sortField, setSortField] = useState<EthernetSortField>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleReset = () => {
    setSelectedPorts([]);
    setMacaddr('');
    setMulticast(true);
    setLearning(true);
    setReversePath(false);
    setVlanTag('auto');
  };

  const handleAdd = () => {
    if (selectedPorts.length === 0) return;
    setDraftEthernet((prev) => [
      ...prev,
      {
        selectPorts: [...selectedPorts],
        macaddr: macaddr.trim() || undefined,
        multicast,
        learning,
        reversePath,
        vlanTag,
      },
    ]);
    handleReset();
  };

  const sortedList = useMemo(() => {
    if (!sortField) return draftEthernet;
    return [...draftEthernet].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'selectPorts') {
        cmp = a.selectPorts.join(',').localeCompare(b.selectPorts.join(','));
      } else if (sortField === 'macaddr') {
        cmp = (a.macaddr || '').localeCompare(b.macaddr || '');
      } else if (sortField === 'multicast') {
        cmp = Number(a.multicast) - Number(b.multicast);
      } else if (sortField === 'learning') {
        cmp = Number(a.learning) - Number(b.learning);
      } else if (sortField === 'reversePath') {
        cmp = Number(a.reversePath) - Number(b.reversePath);
      } else if (sortField === 'vlanTag') {
        cmp = a.vlanTag.localeCompare(b.vlanTag);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [draftEthernet, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedList.length / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const paginatedList = sortedList.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleDelete = (indexToDelete: number) => {
    const actualItem = paginatedList[indexToDelete];
    const updated = draftEthernet.filter((item) => item !== actualItem);
    setDraftEthernet(updated);
    const maxPage = Math.max(1, Math.ceil(updated.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  };

  const handleSave = () => {
    onSave(draftEthernet);
    onClose();
  };

  const handleSort = (field: EthernetSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const isAddDisabled = selectedPorts.length === 0;

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
            configuration[{interfaceIndex}].ethernet
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
                title="Save ethernet configuration"
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
                Ports <Text as="span" color="#dc2626">*</Text>
              </Text>
              <MultiSelectDropdown
                value={selectedPorts}
                onChange={setSelectedPorts}
                options={INTERFACE_ETHERNET_PORTS_OPTIONS}
                disabled={disabled}
                placeholder="Select..."
                label=""
              />
            </Box>

            <Box w="200px">
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                Mac Address
              </Text>
              <Input
                size="sm"
                value={macaddr}
                onChange={(e) => setMacaddr(e.target.value)}
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
                placeholder=""
              />
            </Box>

            {/* Row of toggles & Vlan Tag */}
            <Flex gap={8} align="flex-start" wrap="wrap">
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                  Multicast
                </Text>
                <ToggleSwitch
                  checked={multicast}
                  onChange={setMulticast}
                  label=""
                  disabled={disabled}
                />
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                  Learning
                </Text>
                <ToggleSwitch
                  checked={learning}
                  onChange={setLearning}
                  label=""
                  disabled={disabled}
                />
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                  Reverse Path
                </Text>
                <ToggleSwitch
                  checked={reversePath}
                  onChange={setReversePath}
                  label=""
                  disabled={disabled}
                />
              </Box>

              <Box minW="160px">
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  Vlan Tag
                </Text>
                <SelectDropdown
                  size="sm"
                  value={vlanTag}
                  onChange={(val) => setVlanTag(String(val))}
                  options={INTERFACE_ETHERNET_VLAN_TAG_OPTIONS}
                  disabled={disabled}
                  w="100%"
                />
              </Box>
            </Flex>

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
                      onClick={() => handleSort('selectPorts')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>PORTS</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('macaddr')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>MAC ADDRESS</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('multicast')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>MULTICAST</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('learning')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>LEARNING</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('reversePath')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>REVERSE PATH</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('vlanTag')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>VLAN TAG</Text>
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
                  {draftEthernet.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={7} py={8} textAlign="center">
                        <Text fontSize="13px" fontWeight="700" color="#334155">
                          Empty List
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedList.map((item, idx) => {
                      const vlanDisplay =
                        item.vlanTag === 'tagged'
                          ? 'Tagged'
                          : item.vlanTag === 'un-tagged'
                          ? 'Un-tagged'
                          : 'Auto';

                      return (
                        <Table.Row key={`eth-${idx}`} _hover={{ bg: '#f8fafc' }}>
                          <Table.Cell fontSize="12px" color="#334155" fontWeight="500">
                            {item.selectPorts.join(',') || 'None'}
                          </Table.Cell>
                          <Table.Cell fontSize="12px" color="#334155">
                            {item.macaddr || '-'}
                          </Table.Cell>
                          <Table.Cell fontSize="12px" color="#334155">
                            {item.multicast ? 'Yes' : 'No'}
                          </Table.Cell>
                          <Table.Cell fontSize="12px" color="#334155">
                            {item.learning ? 'Yes' : 'No'}
                          </Table.Cell>
                          <Table.Cell fontSize="12px" color="#334155">
                            {item.reversePath ? 'Yes' : 'No'}
                          </Table.Cell>
                          <Table.Cell fontSize="12px" color="#334155">
                            {vlanDisplay}
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
                      );
                    })
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
                  Page <Text as="span" fontWeight="700">{draftEthernet.length === 0 ? 1 : safePage}</Text> of{' '}
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

export const ManageEthernetPortsModal: React.FC<ManageEthernetPortsModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <ManageEthernetPortsDialog {...props} />;
};

