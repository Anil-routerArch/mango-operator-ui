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
import type { RadiusLocalUser } from '../types/radius';

export interface RadiusUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: RadiusLocalUser[];
  onSave: (users: RadiusLocalUser[]) => void;
  disabled?: boolean;
}

type UserSortField = 'userName' | 'mac' | 'vlanId' | null;

const RadiusUsersDialog: React.FC<Omit<RadiusUsersModalProps, 'isOpen'>> = ({
  onClose,
  users,
  onSave,
  disabled = false,
}) => {
  const [draftUsers, setDraftUsers] = useState<RadiusLocalUser[]>(() => [...users]);

  // Form state
  const [mac, setMac] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [vlanId, setVlanId] = useState<number | string>(100);

  // Sorting & pagination
  const [sortField, setSortField] = useState<UserSortField>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleReset = () => {
    setMac('');
    setUserName('');
    setPassword('');
    setVlanId(100);
  };

  const isAddValid = useMemo(() => {
    if (!userName.trim()) return false;
    if (!mac.trim()) return false;
    if (!password) return false;
    const vlanNum = Number(vlanId);
    if (isNaN(vlanNum) || vlanNum < 1 || vlanNum > 4094) return false;
    return true;
  }, [userName, mac, password, vlanId]);

  const handleAdd = () => {
    if (!isAddValid) return;

    setDraftUsers((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        mac: mac.trim(),
        userName: userName.trim(),
        password,
        vlanId: Number(vlanId) || 100,
      },
    ]);

    handleReset();
  };

  const sortedList = useMemo(() => {
    if (!sortField) return draftUsers;
    return [...draftUsers].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'userName') {
        cmp = a.userName.localeCompare(b.userName);
      } else if (sortField === 'mac') {
        cmp = a.mac.localeCompare(b.mac);
      } else if (sortField === 'vlanId') {
        cmp = a.vlanId - b.vlanId;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [draftUsers, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedList.length / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const paginatedList = sortedList.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleDelete = (indexToDelete: number) => {
    const actualItem = paginatedList[indexToDelete];
    const updated = draftUsers.filter((u) => u !== actualItem);
    setDraftUsers(updated);
    const maxPage = Math.max(1, Math.ceil(updated.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  };

  const handleSave = () => {
    onSave(draftUsers);
    onClose();
  };

  const handleSort = (field: UserSortField) => {
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
            Local RADIUS Users
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
                title="Save users"
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
                  mac <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  value={mac}
                  onChange={(e) => setMac(e.target.value)}
                  placeholder="00:11:22:33:44:55 or *"
                  disabled={disabled}
                  borderRadius="8px"
                  borderColor="#cbd5e1"
                />
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  user-name <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Username"
                  disabled={disabled}
                  borderRadius="8px"
                  borderColor="#cbd5e1"
                />
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  password <Text as="span" color="#dc2626">*</Text>
                </Text>
                <HStack gap={1}>
                  <Input
                    size="sm"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    disabled={disabled}
                    borderRadius="8px"
                    borderColor="#cbd5e1"
                  />
                  <Box
                    as="button"
                    px={2.5}
                    py={1.5}
                    borderRadius="6px"
                    border="1px solid"
                    borderColor="#cbd5e1"
                    fontSize="11px"
                    fontWeight="600"
                    color="#475569"
                    bg="#f8fafc"
                    cursor="pointer"
                    _hover={{ bg: '#f1f5f9' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Box>
                </HStack>
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  vlan-id <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  type="number"
                  min={1}
                  max={4094}
                  value={vlanId}
                  onChange={(e) => setVlanId(e.target.value)}
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
                      onClick={() => handleSort('userName')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                    >
                      <HStack gap={1}>
                        <Text>user-name</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('mac')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      w="160px"
                    >
                      <HStack gap={1}>
                        <Text>mac</Text>
                        <Text fontSize="10px">⚬</Text>
                      </HStack>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort('vlanId')}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      w="100px"
                    >
                      <HStack gap={1}>
                        <Text>vlan-id</Text>
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
                  {draftUsers.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={4} py={8} textAlign="center">
                        <Text fontSize="13px" fontWeight="700" color="#334155">
                          Empty List
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedList.map((item, idx) => (
                      <Table.Row key={item.id || `user-${idx}`} _hover={{ bg: '#f8fafc' }}>
                        <Table.Cell fontSize="12px" color="#334155" fontWeight="500">
                          {item.userName}
                        </Table.Cell>
                        <Table.Cell fontSize="12px" color="#334155">
                          {item.mac}
                        </Table.Cell>
                        <Table.Cell fontSize="12px" color="#334155">
                          {item.vlanId}
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
                  Page <Text as="span" fontWeight="700">{draftUsers.length === 0 ? 1 : safePage}</Text> of{' '}
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

export const RadiusUsersModal: React.FC<RadiusUsersModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <RadiusUsersDialog {...props} />;
};

