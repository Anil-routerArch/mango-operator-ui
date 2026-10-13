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

export interface Ieee8021xUserItem {
  mac: string;
  userName: string;
  vlanId: number;
  password: string;
}

interface Ieee8021xUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: Ieee8021xUserItem[];
  onSave: (users: Ieee8021xUserItem[]) => void;
  disabled?: boolean;
}

type SortField = 'userName' | 'mac' | 'vlanId' | null;

export const Ieee8021xUsersModal: React.FC<Ieee8021xUsersModalProps> = ({
  isOpen,
  onClose,
  users,
  onSave,
  disabled = false,
}) => {
  const [draftUsers, setDraftUsers] = useState<Ieee8021xUserItem[]>(() => [...users]);
  const [mac, setMac] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [vlanId, setVlanId] = useState<number>(1);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const sortedUsers = useMemo(() => {
    if (!sortField) return draftUsers;
    return [...draftUsers].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'vlanId') {
        cmp = a.vlanId - b.vlanId;
      } else if (sortField === 'userName') {
        cmp = a.userName.localeCompare(b.userName);
      } else if (sortField === 'mac') {
        cmp = a.mac.localeCompare(b.mac);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [draftUsers, sortField, sortAsc]);

  if (!isOpen) return null;

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedUsers = sortedUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleAdd = () => {
    if (!userName.trim() || !mac.trim() || !password.trim()) return;
    setDraftUsers([
      ...draftUsers,
      {
        mac: mac.trim(),
        userName: userName.trim(),
        password: password.trim(),
        vlanId: Number(vlanId) || 1,
      },
    ]);
    setMac('');
    setUserName('');
    setPassword('');
    setVlanId(1);
    setShowPassword(false);
  };

  const handleReset = () => {
    setMac('');
    setUserName('');
    setPassword('');
    setVlanId(1);
    setShowPassword(false);
  };

  const handleDelete = (indexToDelete: number) => {
    const actualUser = paginatedUsers[indexToDelete];
    const updated = draftUsers.filter((u) => u !== actualUser);
    setDraftUsers(updated);
    if (safePage > Math.max(1, Math.ceil(updated.length / pageSize))) {
      setCurrentPage(Math.max(1, Math.ceil(updated.length / pageSize)));
    }
  };

  const handleSave = () => {
    onSave(draftUsers);
    onClose();
  };

  const isAddValid = Boolean(mac.trim() && userName.trim() && password.trim());

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
            configuration.ieee8021x.users
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
        <Box p={6} overflowY="auto" flex="1">
          <VStack gap={5} align="stretch">
            {/* Input Form Fields */}
            {!disabled && (
              <Box>
                {/* Row 1: mac, user-name, password */}
                <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4} mb={3.5}>
                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                      mac <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      value={mac}
                      onChange={(e) => setMac(e.target.value)}
                      placeholder=""
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                      size="sm"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                      user-name <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Input
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder=""
                      borderRadius="8px"
                      borderColor="#cbd5e1"
                      size="sm"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                      password <Text as="span" color="#dc2626">*</Text>
                    </Text>
                    <Box position="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder=""
                        borderRadius="8px"
                        borderColor="#cbd5e1"
                        size="sm"
                        pr="62px"
                      />
                      <Box
                        as="button"
                        position="absolute"
                        right="6px"
                        top="50%"
                        transform="translateY(-50%)"
                        px={2.5}
                        py={0.5}
                        fontSize="11px"
                        fontWeight="600"
                        borderRadius="12px"
                        border="1px solid"
                        borderColor="#cbd5e1"
                        bg="#ffffff"
                        color="#475569"
                        cursor="pointer"
                        _hover={{ bg: '#f1f5f9' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </Box>
                    </Box>
                  </Box>
                </SimpleGrid>

                {/* Row 2: vlan-id */}
                <Box mb={4} w="120px">
                  <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                    vlan-id <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Input
                    type="number"
                    min={1}
                    max={65535}
                    value={vlanId}
                    onChange={(e) => setVlanId(Number(e.target.value) || 1)}
                    borderRadius="8px"
                    borderColor="#cbd5e1"
                    size="sm"
                  />
                </Box>

                {/* Action Buttons: Add, Reset */}
                <Flex justify="flex-end" gap={2}>
                  <Box
                    as="button"
                    px={4}
                    py={1.5}
                    borderRadius="16px"
                    bg={isAddValid ? '#2563eb' : '#94a3b8'}
                    color="#ffffff"
                    fontSize="12px"
                    fontWeight="600"
                    cursor={isAddValid ? 'pointer' : 'not-allowed'}
                    _hover={isAddValid ? { bg: '#1d4ed8' } : undefined}
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

            {/* Users Table */}
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
                      onClick={() => handleSort('userName')}
                    >
                      USER-NAME ○
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      py={3}
                      px={4}
                      cursor="pointer"
                      onClick={() => handleSort('mac')}
                    >
                      MAC ○
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      py={3}
                      px={4}
                      cursor="pointer"
                      onClick={() => handleSort('vlanId')}
                    >
                      VLAN-ID ○
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
                  {paginatedUsers.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={4} py={12} textAlign="center">
                        <Text fontSize="14px" fontWeight="700" color="#64748b">
                          Empty List
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedUsers.map((u, idx) => (
                      <Table.Row key={`${u.userName}-${u.mac}-${idx}`} _hover={{ bg: '#f8fafc' }}>
                        <Table.Cell py={3} px={4} fontSize="13px" fontWeight="600" color="#1e293b">
                          {u.userName}
                        </Table.Cell>
                        <Table.Cell py={3} px={4} fontSize="13px" color="#475569">
                          {u.mac}
                        </Table.Cell>
                        <Table.Cell py={3} px={4} fontSize="13px" color="#475569">
                          {u.vlanId}
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
                              title="Delete User"
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
              Page <Text as="span" fontWeight="700" color="#0f172a">{draftUsers.length === 0 ? 0 : safePage}</Text> of{' '}
              <Text as="span" fontWeight="700" color="#0f172a">{draftUsers.length === 0 ? 0 : totalPages}</Text>
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
