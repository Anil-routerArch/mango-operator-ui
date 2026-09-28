import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
  Input,
  Textarea,
  NativeSelect,
  Spinner,
} from '@chakra-ui/react';
import { Header } from '@/layout/Header';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useGetUsers, useCreateUser, useUpdateUser, useSuspendUser } from '@/api';
import type { User } from '@/types/user';

// Helper: Format unix timestamp to human readable relative time
const formatLastLogin = (timestamp?: number): string => {
  if (!timestamp || timestamp === 0) return 'Never';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Helper: Get avatar background color by role
const getAvatarColor = (role?: string): string => {
  switch (role?.toLowerCase()) {
    case 'root':
    case 'admin':
      return themeColors.avatar.blue;
    case 'installer':
      return themeColors.avatar.purple;
    case 'csr':
      return themeColors.avatar.teal;
    case 'noc':
    case 'accounting':
      return themeColors.avatar.orange;
    default:
      return themeColors.avatar.green;
  }
};

// Helper: Get Initials from Name or Email
const getInitials = (name?: string, email?: string): string => {
  const source = name?.trim() || email?.split('@')[0] || 'U';
  const parts = source.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

export const UsersPage: React.FC = () => {
  // Fetch real users from OWSEC API using token
  const { data: users = [], isLoading, isFetching, refetch } = useGetUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const suspendUserMutation = useSuspendUser();

  // Selection & UI State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'profile' | 'access'>('profile');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordPolicyOpen, setIsPasswordPolicyOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Auto-select first user when users list loads
  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || users[0] || null;
  }, [users, selectedUserId]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.userRole || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'All Roles' || u.userRole === roleFilter;
      const matchesStatus =
        statusFilter === 'All Status' ||
        (statusFilter === 'Active' && !u.suspended) ||
        (statusFilter === 'Suspended' && u.suspended);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Reset pagination to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  // Paginated Users for Table Display (5 users per page)
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Derived KPI Counts
  const totalUsersCount = users.length;
  const activeCount = users.filter((u) => !u.suspended).length;
  const suspendedCount = users.filter((u) => u.suspended).length;
  const mfaEnabledCount = users.filter((u) => u.userTypeProprietaryInfo?.mfa?.enabled).length;

  return (
    <Box w="100%" pb={8}>
      {/* Header */}
      <Header
        title="Users & Access"
        subtitle="Manage users, system roles, and scoped permissions."
        onRefresh={() => refetch()}
        primaryAction={{
          label: 'Create user',
          onClick: () => setIsCreateModalOpen(true),
        }}
      />

      {/* Info Banner Architecture Visualizer */}
      <Flex
        minH="77px"
        border="1px solid"
        borderColor={themeColors.infoBanner.border}
        borderRadius="4px"
        bg={themeColors.infoBanner.bg}
        align="center"
        justify="space-between"
        px={{ base: 4, md: 10 }}
        py={3}
        mb={4}
      >
        <HStack gap={4}>
          <Flex
            w="48px"
            h="48px"
            borderRadius="50%"
            border="1px solid"
            borderColor={themeColors.infoBanner.iconBorder}
            color={themeColors.infoBanner.iconColor}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon name="shield" size={24} />
          </Flex>
          <Box>
            <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
              System Role
            </Text>
            <Text fontSize="12px" color={themeColors.text.secondary}>
              Determines platform-wide capabilities in OpenWiFi
            </Text>
          </Box>
        </HStack>

        <Box px={4} color={themeColors.infoBanner.arrowColor}>
          <Icon name="arrowRight" size={28} />
        </Box>

        <HStack gap={4}>
          <Flex
            w="48px"
            h="48px"
            borderRadius="50%"
            border="1px solid"
            borderColor={themeColors.infoBanner.iconBorder}
            color={themeColors.infoBanner.iconColor}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon name="building" size={24} />
          </Flex>
          <Box>
            <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
              Scoped Access
            </Text>
            <Text fontSize="12px" color={themeColors.text.secondary}>
              Determines which properties and venues capabilities apply to
            </Text>
          </Box>
        </HStack>
      </Flex>

      {/* KPI Metric Cards */}
      <Flex gap={4} mb={5}>
        <Flex
          flex="1"
          border="1px solid"
          borderColor={themeColors.kpi.border}
          borderRadius="4px"
          bg="#ffffff"
          p="14px 18px"
          align="center"
          gap={4}
        >
          <Icon name="users" size={28} color={themeColors.kpi.totalUsers} />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>
              Total Users
            </Text>
            <Text fontSize="22px" fontWeight="600" color={themeColors.text.title}>
              {isLoading ? '...' : totalUsersCount}
            </Text>
          </Box>
        </Flex>

        <Flex
          flex="1"
          border="1px solid"
          borderColor={themeColors.kpi.border}
          borderRadius="4px"
          bg="#ffffff"
          p="14px 18px"
          align="center"
          gap={4}
        >
          <Icon name="users" size={28} color={themeColors.kpi.activeUsers} />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>
              Active
            </Text>
            <Text fontSize="22px" fontWeight="600" color={themeColors.text.title}>
              {isLoading ? '...' : activeCount}
            </Text>
          </Box>
        </Flex>

        <Flex
          flex="1"
          border="1px solid"
          borderColor={themeColors.kpi.border}
          borderRadius="4px"
          bg="#ffffff"
          p="14px 18px"
          align="center"
          gap={4}
        >
          <Icon name="users" size={28} color={themeColors.kpi.suspendedUsers} />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>
              Suspended
            </Text>
            <Text fontSize="22px" fontWeight="600" color={themeColors.text.title}>
              {isLoading ? '...' : suspendedCount}
            </Text>
          </Box>
        </Flex>

        <Flex
          flex="1"
          border="1px solid"
          borderColor={themeColors.kpi.border}
          borderRadius="4px"
          bg="#ffffff"
          p="14px 18px"
          align="center"
          gap={4}
        >
          <Icon name="shield" size={28} color={themeColors.kpi.mfaEnabled} />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>
              MFA Enabled
            </Text>
            <Text fontSize="22px" fontWeight="600" color={themeColors.text.title}>
              {isLoading ? '...' : `${mfaEnabledCount} of ${totalUsersCount}`}
            </Text>
          </Box>
        </Flex>
      </Flex>

      {/* Two-Panel Workspace */}
      <Flex gap={4} align="flex-start" direction={{ base: 'column', xl: 'row' }}>
        {/* Left Panel: Users Table */}
        <Box
          flex="1.35"
          w="100%"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="4px"
          bg="#ffffff"
          p={5}
          minH="500px"
          boxSizing="border-box"
        >
          <HStack justify="space-between" mb={3}>
            <Text fontSize="18px" fontWeight="700" color={themeColors.text.title}>
              Users
            </Text>
            {isFetching && (
              <HStack gap={2} fontSize="12px" color={themeColors.text.secondary}>
                <Spinner size="xs" color={themeColors.brand.primary} />
                <Text>Updating...</Text>
              </HStack>
            )}
          </HStack>

          {/* Search & Filters */}
          <Flex gap={3} mb={4} wrap="wrap">
            <Flex
              flex="1"
              minW="180px"
              h="38px"
              border="1px solid"
              borderColor={themeColors.input.filterBorder}
              borderRadius="4px"
              align="center"
              px={3}
              gap={2}
            >
              <Icon name="search" size={16} color={themeColors.text.secondary} />
              <Input
                variant="flushed"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fontSize="13px"
                border="none"
                _focus={{ outline: 'none', border: 'none' }}
                p={0}
                h="auto"
              />
            </Flex>

            <NativeSelect.Root w="150px">
              <NativeSelect.Field
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                h="38px"
                fontSize="13px"
                borderColor={themeColors.input.filterBorder}
              >
                <option value="All Roles">All Roles</option>
                <option value="root">root</option>
                <option value="admin">admin</option>
                <option value="installer">installer</option>
                <option value="csr">csr</option>
                <option value="noc">noc</option>
                <option value="accounting">accounting</option>
              </NativeSelect.Field>
            </NativeSelect.Root>

            <NativeSelect.Root w="130px">
              <NativeSelect.Field
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                h="38px"
                fontSize="13px"
                borderColor={themeColors.input.filterBorder}
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Flex>

          {/* Table */}
          <Box overflowX="auto">
            <Box minW="550px">
              <Flex
                borderBottom="1px solid"
                borderColor={themeColors.panel.divider}
                py={2}
                px={2}
                fontSize="12px"
                fontWeight="600"
                color={themeColors.text.secondary}
              >
                <Box flex="1.7">User</Box>
                <Box flex="1.15">System Role</Box>
                <Box flex="1.1">Scoped Access</Box>
                <Box flex="0.75">Status</Box>
                <Box flex="0.85">Last Login</Box>
                <Box w="20px" />
              </Flex>

              {isLoading ? (
                <Flex justify="center" align="center" minH="200px" direction="column" gap={3}>
                  <Spinner size="md" color={themeColors.brand.primary} />
                  <Text fontSize="13px" color={themeColors.text.secondary}>
                    Loading users from OpenWiFi...
                  </Text>
                </Flex>
              ) : filteredUsers.length === 0 ? (
                <Flex justify="center" align="center" minH="180px" color={themeColors.text.secondary}>
                  <Text fontSize="13px">No users found</Text>
                </Flex>
              ) : (
                paginatedUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const initials = getInitials(u.name, u.email);
                  const avatarColor = getAvatarColor(u.userRole);

                  return (
                    <Flex
                      key={u.id}
                      align="center"
                      borderBottom="1px solid"
                      borderColor={themeColors.panel.divider}
                      minH="54px"
                      px={2}
                      py={2}
                      fontSize="12px"
                      cursor="pointer"
                      borderRadius="4px"
                      bg={isSelected ? '#fbfdff' : 'transparent'}
                      outline={isSelected ? `1px solid ${themeColors.brand.accent}` : 'none'}
                      _hover={{ bg: isSelected ? '#fbfdff' : '#f8fafc' }}
                      onClick={() => setSelectedUserId(u.id)}
                      transition="background 0.15s ease"
                    >
                      {/* Identity */}
                      <HStack flex="1.7" gap={3} minW={0} pr={2}>
                        {u.avatar && u.avatar.startsWith('data:') ? (
                          <Box
                            w="32px"
                            h="32px"
                            borderRadius="50%"
                            overflow="hidden"
                            flexShrink={0}
                          >
                            <img
                              src={u.avatar}
                              alt={u.name || u.email}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                        ) : (
                          <Flex
                            w="32px"
                            h="32px"
                            borderRadius="50%"
                            bg={avatarColor}
                            color="#ffffff"
                            align="center"
                            justify="center"
                            fontSize="12px"
                            fontWeight="700"
                            flexShrink={0}
                          >
                            {initials}
                          </Flex>
                        )}
                        <Box minW={0} overflow="hidden">
                          <Text
                            fontSize="13px"
                            fontWeight="600"
                            color={themeColors.text.title}
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                          >
                            {u.name || u.email}
                          </Text>
                          <Text
                            fontSize="11px"
                            color={themeColors.text.secondary}
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                          >
                            {u.email}
                          </Text>
                        </Box>
                      </HStack>

                      {/* System Role */}
                      <Box flex="1.15" color={themeColors.text.primary} textTransform="capitalize">
                        {u.userRole}
                      </Box>

                      {/* Scoped Access */}
                      <Box flex="1.1" color={themeColors.text.secondary}>
                        {u.location || 'All properties'}
                      </Box>

                      {/* Status */}
                      <Box flex="0.75">
                        <Box
                          as="span"
                          display="inline-block"
                          fontSize="11px"
                          fontWeight="600"
                          px="10px"
                          py="2px"
                          borderRadius="15px"
                          bg={u.suspended ? themeColors.status.suspended.bg : themeColors.status.active.bg}
                          color={u.suspended ? themeColors.status.suspended.text : themeColors.status.active.text}
                          border="1px solid"
                          borderColor={u.suspended ? themeColors.status.suspended.border : themeColors.status.active.border}
                          whiteSpace="nowrap"
                        >
                          {u.suspended ? 'Suspended' : 'Active'}
                        </Box>
                      </Box>

                      {/* Last Login */}
                      <Box flex="0.85" color={themeColors.text.secondary}>
                        {formatLastLogin(u.lastLogin)}
                      </Box>

                      {/* Action */}
                      <Box w="20px" color={themeColors.text.secondary}>
                        <Icon name="chevron" size={16} />
                      </Box>
                    </Flex>
                  );
                })
              )}
            </Box>
          </Box>

          {/* Pagination bar */}
          <Flex justify="space-between" align="center" mt={4} fontSize="12px" color={themeColors.text.secondary}>
            <HStack gap={3} align="center">
              <Text>
                Showing {filteredUsers.length === 0 ? '0' : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredUsers.length)}`} of {filteredUsers.length}
              </Text>

              {/* Rows Per Page Selector */}
              <HStack gap={1} align="center">
                <Text fontSize="11px" color={themeColors.text.muted}>Rows:</Text>
                <NativeSelect.Root w="64px" size="xs">
                  <NativeSelect.Field
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    h="26px"
                    fontSize="11px"
                    borderColor={themeColors.panel.border}
                    bg="#ffffff"
                    borderRadius="4px"
                    cursor="pointer"
                    px={2}
                    py={0}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </HStack>
            </HStack>

            <HStack gap={1}>
              {/* Previous Page */}
              <Button
                size="xs"
                w="28px"
                h="28px"
                minW="28px"
                p={0}
                variant="outline"
                borderColor={themeColors.panel.border}
                color={themeColors.text.secondary}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                cursor={currentPage <= 1 ? 'not-allowed' : 'pointer'}
                borderRadius="4px"
                bg="#ffffff"
                _hover={{ borderColor: themeColors.brand.accent }}
                aria-label="Previous page"
              >
                <Icon name="chevronLeft" size={14} />
              </Button>

              {/* Numbered Page Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <Button
                    key={pageNum}
                    size="xs"
                    w="28px"
                    h="28px"
                    minW="28px"
                    p={0}
                    fontSize="12px"
                    fontWeight={isActive ? '700' : '400'}
                    bg="#ffffff"
                    color={isActive ? themeColors.brand.accent : themeColors.text.secondary}
                    border="1px solid"
                    borderColor={isActive ? themeColors.brand.accent : themeColors.panel.border}
                    borderRadius="4px"
                    onClick={() => setCurrentPage(pageNum)}
                    cursor="pointer"
                    _hover={{
                      borderColor: themeColors.brand.accent,
                      color: themeColors.brand.accent,
                    }}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              {/* Next Page */}
              <Button
                size="xs"
                w="28px"
                h="28px"
                minW="28px"
                p={0}
                variant="outline"
                borderColor={themeColors.panel.border}
                color={themeColors.text.secondary}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                cursor={currentPage >= totalPages ? 'not-allowed' : 'pointer'}
                borderRadius="4px"
                bg="#ffffff"
                _hover={{ borderColor: themeColors.brand.accent }}
                aria-label="Next page"
              >
                <Icon name="chevronRight" size={14} />
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Right Panel: Selected User Detail */}
        <Box
          flex="1"
          w="100%"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="4px"
          bg="#ffffff"
          p={5}
          minH="500px"
          boxSizing="border-box"
        >
          {selectedUser ? (
            <>
              {/* User Detail Head */}
              <Flex align="center" gap={3} pb={3}>
                {selectedUser.avatar && selectedUser.avatar.startsWith('data:') ? (
                  <Box
                    w="44px"
                    h="44px"
                    borderRadius="50%"
                    overflow="hidden"
                    flexShrink={0}
                  >
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name || selectedUser.email}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ) : (
                  <Flex
                    w="44px"
                    h="44px"
                    borderRadius="50%"
                    bg={getAvatarColor(selectedUser.userRole)}
                    color="#ffffff"
                    align="center"
                    justify="center"
                    fontSize="16px"
                    fontWeight="700"
                    flexShrink={0}
                  >
                    {getInitials(selectedUser.name, selectedUser.email)}
                  </Flex>
                )}
                <Box flex="1">
                  <Text fontSize="18px" fontWeight="700" color={themeColors.text.title} lineHeight="1.2">
                    {selectedUser.name || selectedUser.email}
                  </Text>
                  <HStack gap={2} mt={1}>
                    <Text fontSize="12px" color={themeColors.text.secondary}>
                      {selectedUser.email}
                    </Text>
                    <Box
                      as="span"
                      fontSize="10px"
                      fontWeight="600"
                      px="8px"
                      py="1px"
                      borderRadius="12px"
                      bg={selectedUser.suspended ? themeColors.status.suspended.bg : themeColors.status.active.bg}
                      color={selectedUser.suspended ? themeColors.status.suspended.text : themeColors.status.active.text}
                      border="1px solid"
                      borderColor={selectedUser.suspended ? themeColors.status.suspended.border : themeColors.status.active.border}
                    >
                      {selectedUser.suspended ? 'Suspended' : 'Active'}
                    </Box>
                  </HStack>
                </Box>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    suspendUserMutation.mutate({
                      id: selectedUser.id,
                      suspended: !selectedUser.suspended,
                    })
                  }
                  color={selectedUser.suspended ? themeColors.status.active.text : themeColors.status.error.text}
                >
                  {selectedUser.suspended ? 'Activate' : 'Suspend'}
                </Button>
              </Flex>

              {/* Subtabs: Profile / Scoped Access */}
              <Flex borderBottom="1px solid" borderColor={themeColors.panel.divider} h="38px" gap={4} mb={4}>
                <Button
                  variant="plain"
                  onClick={() => setDetailTab('profile')}
                  px={2}
                  h="100%"
                  fontSize="13px"
                  fontWeight={detailTab === 'profile' ? '600' : '400'}
                  color={detailTab === 'profile' ? themeColors.text.primary : themeColors.text.secondary}
                  position="relative"
                  _after={
                    detailTab === 'profile'
                      ? {
                          content: '""',
                          position: 'absolute',
                          bottom: '-1px',
                          left: 0,
                          right: 0,
                          height: '2px',
                          bg: themeColors.brand.accent,
                        }
                      : undefined
                  }
                >
                  Profile
                </Button>
                <Button
                  variant="plain"
                  onClick={() => setDetailTab('access')}
                  px={2}
                  h="100%"
                  fontSize="13px"
                  fontWeight={detailTab === 'access' ? '600' : '400'}
                  color={detailTab === 'access' ? themeColors.text.primary : themeColors.text.secondary}
                  position="relative"
                  _after={
                    detailTab === 'access'
                      ? {
                          content: '""',
                          position: 'absolute',
                          bottom: '-1px',
                          left: 0,
                          right: 0,
                          height: '2px',
                          bg: themeColors.brand.accent,
                        }
                      : undefined
                  }
                >
                  Scoped Access
                </Button>
              </Flex>

              {detailTab === 'profile' ? (
                <UserProfileForm
                  user={selectedUser}
                  onSave={(payload) => updateUserMutation.mutate(payload)}
                  isSaving={updateUserMutation.isPending}
                  onOpenPasswordPolicy={() => setIsPasswordPolicyOpen(true)}
                />
              ) : (
                <UserScopedAccessTab user={selectedUser} />
              )}
            </>
          ) : (
            <Flex justify="center" align="center" minH="200px" color={themeColors.text.secondary}>
              <Text fontSize="13px">Select a user to view details</Text>
            </Flex>
          )}
        </Box>
      </Flex>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <CreateUserModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={(payload) => {
            createUserMutation.mutate(payload, {
              onSuccess: () => setIsCreateModalOpen(false),
            });
          }}
          isLoading={createUserMutation.isPending}
        />
      )}

      {/* Password Policy Modal */}
      <PasswordPolicyModal
        isOpen={isPasswordPolicyOpen}
        onClose={() => setIsPasswordPolicyOpen(false)}
      />
    </Box>
  );
};

// Sub-component: User Profile Form
const UserProfileForm: React.FC<{
  user: User;
  onSave: (payload: { id: string; name: string; email: string; userRole: string; description: string; currentPassword?: string }) => void;
  isSaving: boolean;
  onOpenPasswordPolicy: () => void;
}> = ({ user, onSave, isSaving, onOpenPasswordPolicy }) => {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState(user.userRole || 'admin');
  const [description, setDescription] = useState(user.description || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setName(user.name || '');
    setEmail(user.email || '');
    setRole(user.userRole || 'admin');
    setDescription(user.description || '');
    setPassword('');
    setShowPassword(false);
  }, [user]);

  const handleCancel = () => {
    setName(user.name || '');
    setEmail(user.email || '');
    setRole(user.userRole || 'admin');
    setDescription(user.description || '');
    setPassword('');
    setShowPassword(false);
  };

  const handleSave = () => {
    const payload: { id: string; name: string; email: string; userRole: string; description: string; currentPassword?: string } = {
      id: user.id,
      name,
      email,
      userRole: role,
      description,
    };
    if (password.trim()) {
      payload.currentPassword = password.trim();
    }
    onSave(payload);
  };

  return (
    <VStack gap={4} align="stretch">
      <Text fontSize="14px" fontWeight="600" color={themeColors.text.title}>
        Profile information
      </Text>

      {/* Email & Name */}
      <Flex gap={3}>
        <Box flex="1">
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            Email <Box as="span" color={themeColors.text.required}>*</Box>
          </Text>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="sm"
            borderRadius="4px"
            borderColor={themeColors.input.border}
            bg={themeColors.input.bg}
          />
        </Box>
        <Box flex="1">
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            Name <Box as="span" color={themeColors.text.required}>*</Box>
          </Text>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="sm"
            borderRadius="4px"
            borderColor={themeColors.input.border}
            bg={themeColors.input.bg}
          />
        </Box>
      </Flex>

      {/* System Role */}
      <Box>
        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          System Role <Box as="span" color={themeColors.text.required}>*</Box>
        </Text>
        <NativeSelect.Root>
          <NativeSelect.Field
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            h="36px"
            fontSize="13px"
            borderColor={themeColors.input.border}
            bg={themeColors.input.bg}
          >
            <option value="root">root</option>
            <option value="admin">admin</option>
            <option value="installer">installer</option>
            <option value="csr">csr</option>
            <option value="noc">noc</option>
            <option value="accounting">accounting</option>
          </NativeSelect.Field>
        </NativeSelect.Root>
        <Text fontSize="11px" color={themeColors.text.muted} mt={1}>
          Controls platform capabilities.
        </Text>
      </Box>

      {/* Password Field */}
      <Box>
        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          Password
        </Text>
        <Flex position="relative" align="center">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            size="sm"
            borderRadius="4px"
            pr="75px"
            borderColor={themeColors.input.border}
            bg={themeColors.input.bg}
            letterSpacing={!showPassword && password ? '2px' : 'normal'}
          />
          <Button
            type="button"
            variant="plain"
            position="absolute"
            right="6px"
            h="26px"
            px={2}
            fontSize="11px"
            color={themeColors.text.secondary}
            onClick={() => setShowPassword(!showPassword)}
            cursor="pointer"
            _hover={{ color: themeColors.text.primary }}
          >
            <HStack gap={1}>
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={14} />
              <Text>{showPassword ? 'Hide' : 'Show'}</Text>
            </HStack>
          </Button>
        </Flex>
        <Text fontSize="11px" color={themeColors.text.muted} mt={1}>
          Leave unchanged to keep the current password.
        </Text>
      </Box>

      {/* Description */}
      <Box>
        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          Description
        </Text>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          size="sm"
          borderRadius="4px"
          minH="60px"
          borderColor={themeColors.input.border}
          bg={themeColors.input.bg}
          placeholder="Network operations across assigned properties and venues."
        />
      </Box>

      {/* View Password Policy Link */}
      <Box mt={1}>
        <Button
          variant="plain"
          p={0}
          h="auto"
          fontSize="12px"
          color={themeColors.brand.accent}
          _hover={{ textDecoration: 'underline' }}
          onClick={onOpenPasswordPolicy}
          cursor="pointer"
        >
          <HStack gap={1}>
            <Text>View password policy</Text>
            <Icon name="external" size={13} />
          </HStack>
        </Button>
      </Box>

      {/* Form Action Buttons */}
      <Flex justify="space-between" align="center" pt={4} mt={2}>
        <Button
          variant="outline"
          size="sm"
          minW="90px"
          borderColor={themeColors.panel.border}
          color={themeColors.text.primary}
          onClick={handleCancel}
          _hover={{ bg: themeColors.canvas.bg }}
        >
          Cancel
        </Button>
        <Button
          bg={themeColors.brand.primary}
          color="#ffffff"
          _hover={{ bg: themeColors.brand.primaryHover }}
          _active={{ bg: themeColors.brand.primaryActive }}
          size="sm"
          minW="120px"
          disabled={isSaving}
          onClick={handleSave}
          fontWeight="600"
        >
          {isSaving ? 'Saving...' : 'Save profile'}
        </Button>
      </Flex>
    </VStack>
  );
};

// Sub-component: Password Policy Modal
const PasswordPolicyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1100"
      p={4}
    >
      <Box
        w="min(480px, 95vw)"
        bg="#ffffff"
        borderRadius="8px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        p={6}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <HStack gap={2}>
            <Icon name="shield" size={20} color={themeColors.brand.primary} />
            <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
              Password Policy
            </Text>
          </HStack>
          <Button
            variant="plain"
            onClick={onClose}
            p={1}
            minW="auto"
            h="auto"
            color={themeColors.text.secondary}
          >
            <Icon name="x" size={18} />
          </Button>
        </Flex>

        <Text fontSize="13px" color={themeColors.text.secondary} mb={4}>
          To maintain security compliance across OpenWiFi and Mango Cloud services, your password must meet the following complexity requirements:
        </Text>

        <VStack gap={2} align="stretch" mb={6} fontSize="13px" color={themeColors.text.primary}>
          <HStack gap={2} align="flex-start">
            <Box color="#16a34a" mt="2px"><Icon name="check" size={15} /></Box>
            <Text>Minimum length of <strong>8 characters</strong></Text>
          </HStack>
          <HStack gap={2} align="flex-start">
            <Box color="#16a34a" mt="2px"><Icon name="check" size={15} /></Box>
            <Text>At least one <strong>uppercase letter (A–Z)</strong></Text>
          </HStack>
          <HStack gap={2} align="flex-start">
            <Box color="#16a34a" mt="2px"><Icon name="check" size={15} /></Box>
            <Text>At least one <strong>lowercase letter (a–z)</strong></Text>
          </HStack>
          <HStack gap={2} align="flex-start">
            <Box color="#16a34a" mt="2px"><Icon name="check" size={15} /></Box>
            <Text>At least one <strong>number (0–9)</strong></Text>
          </HStack>
          <HStack gap={2} align="flex-start">
            <Box color="#16a34a" mt="2px"><Icon name="check" size={15} /></Box>
            <Text>At least one <strong>special character</strong> (e.g. !@#$%^&*)</Text>
          </HStack>
          <HStack gap={2} align="flex-start">
            <Box color="#16a34a" mt="2px"><Icon name="check" size={15} /></Box>
            <Text>Must not match user's name or email</Text>
          </HStack>
        </VStack>

        <Flex justify="flex-end">
          <Button
            bg={themeColors.brand.primary}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.primaryHover }}
            size="sm"
            px={5}
            onClick={onClose}
          >
            Got it
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

// Sub-component: User Scoped Access Tab
const UserScopedAccessTab: React.FC<{ user: User }> = ({ user }) => {
  return (
    <VStack gap={4} align="stretch">
      <Box>
        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          Platform Role
        </Text>
        <Box
          p={3}
          border="1px solid"
          borderColor={themeColors.input.border}
          borderRadius="4px"
          bg="#fafafa"
        >
          <HStack justify="space-between">
            <Text fontSize="13px" fontWeight="700" textTransform="capitalize">
              {user.userRole}
            </Text>
            <Box
              fontSize="10px"
              fontWeight="600"
              bg="#edf2f7"
              color={themeColors.text.secondary}
              border="1px solid #d7dee8"
              borderRadius="10px"
              px={2}
              py="1px"
            >
              System Wide
            </Box>
          </HStack>
          <Text fontSize="11px" color={themeColors.text.secondary} mt={1}>
            User has platform-level capabilities defined by their system role.
          </Text>
        </Box>
      </Box>

      <Box>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            Assigned Scope
          </Text>
        </HStack>

        <Flex
          align="center"
          h="48px"
          border="1px solid"
          borderColor={themeColors.input.border}
          borderRadius="4px"
          px={3}
          gap={3}
        >
          <Icon name="building" size={18} color={themeColors.text.secondary} />
          <Box flex="1">
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
              {user.location || 'Global Entity'}
            </Text>
            <Text fontSize="10px" color={themeColors.text.subtle}>
              All associated venues & access points
            </Text>
          </Box>
          <Box
            fontSize="10px"
            border="1px solid #bcd2f8"
            borderRadius="12px"
            bg="#f3f7ff"
            color={themeColors.brand.accent}
            px="10px"
            py="2px"
          >
            {user.userRole}
          </Box>
        </Flex>
      </Box>

      <Box
        border="1px solid #7dafef"
        bg="#f2f7ff"
        p={3}
        borderRadius="4px"
        fontSize="11px"
        color={themeColors.text.primary}
      >
        <HStack gap={2} mb={1}>
          <Icon name="info" size={15} color={themeColors.brand.accent} />
          <Text fontWeight="700">Effective access</Text>
        </HStack>
        <Text color={themeColors.text.secondary} pl={6}>
          Direct {user.userRole} access granted across {user.location || 'all cloud tenant entities'}.
        </Text>
      </Box>
    </VStack>
  );
};

// Sub-component: Create User Modal
const CreateUserModal: React.FC<{
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    email: string;
    userRole: string;
    currentPassword?: string;
    description?: string;
    emailValidation?: boolean;
    changePassword?: boolean;
  }) => void;
  isLoading: boolean;
}> = ({ onClose, onCreate, isLoading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('admin');
  const [password, setPassword] = useState('InitialPass123!');
  const [description, setDescription] = useState('');
  const [changePassword, setChangePassword] = useState(true);
  const [emailValidation, setEmailValidation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    onCreate({
      name,
      email,
      userRole,
      currentPassword: password,
      description,
      changePassword,
      emailValidation,
    });
  };

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1000"
      p={4}
    >
      <Box
        w="min(600px, 95vw)"
        maxH="90vh"
        bg="#ffffff"
        borderRadius="8px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        overflowY="auto"
      >
        <Flex
          h="76px"
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
          align="center"
          gap={4}
          px={6}
        >
          <Flex color={themeColors.brand.accent}>
            <Icon name="users" size={32} />
          </Flex>
          <Box flex="1">
            <Text fontSize="18px" fontWeight="700" color={themeColors.text.title}>
              Create user
            </Text>
            <Text fontSize="12px" color={themeColors.text.secondary}>
              Create an account in uCentralSec with designated role.
            </Text>
          </Box>
          <Button variant="plain" onClick={onClose} p={1} color={themeColors.text.secondary}>
            <Icon name="x" size={20} />
          </Button>
        </Flex>

        <Box as="form" onSubmit={handleSubmit} p={6}>
          <Flex gap={3} mb={3}>
            <Box flex="1">
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Email <Box as="span" color={themeColors.text.required}>*</Box>
              </Text>
              <Input
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="sm"
                borderRadius="4px"
                required
              />
            </Box>
            <Box flex="1">
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Name <Box as="span" color={themeColors.text.required}>*</Box>
              </Text>
              <Input
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                size="sm"
                borderRadius="4px"
                required
              />
            </Box>
          </Flex>

          <Flex gap={3} mb={3}>
            <Box flex="1">
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                System role <Box as="span" color={themeColors.text.required}>*</Box>
              </Text>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  h="36px"
                  fontSize="13px"
                >
                  <option value="admin">admin</option>
                  <option value="installer">installer</option>
                  <option value="csr">csr</option>
                  <option value="noc">noc</option>
                  <option value="accounting">accounting</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>
            <Box flex="1">
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Password <Box as="span" color={themeColors.text.required}>*</Box>
              </Text>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="sm"
                borderRadius="4px"
                required
              />
            </Box>
          </Flex>

          <Box mb={4}>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              Description
            </Text>
            <Input
              placeholder="Describe responsibility"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              size="sm"
              borderRadius="4px"
            />
          </Box>

          {/* Toggles */}
          <Flex gap={3} mb={4}>
            <Flex
              flex="1"
              border="1px solid"
              borderColor={themeColors.panel.border}
              borderRadius="4px"
              p={3}
              justify="space-between"
              align="center"
              cursor="pointer"
              onClick={() => setChangePassword(!changePassword)}
            >
              <Box>
                <Text fontSize="12px" fontWeight="700">Force password change</Text>
                <Text fontSize="10px" color={themeColors.text.secondary}>Require a new password at first sign-in.</Text>
              </Box>
              <Box
                w="30px"
                h="18px"
                bg={changePassword ? themeColors.brand.accent : '#cbd5e1'}
                borderRadius="10px"
                position="relative"
              >
                <Box
                  w="14px"
                  h="14px"
                  bg="#ffffff"
                  borderRadius="50%"
                  position="absolute"
                  top="2px"
                  right={changePassword ? '2px' : '14px'}
                  transition="right 0.15s ease"
                />
              </Box>
            </Flex>

            <Flex
              flex="1"
              border="1px solid"
              borderColor={themeColors.panel.border}
              borderRadius="4px"
              p={3}
              justify="space-between"
              align="center"
              cursor="pointer"
              onClick={() => setEmailValidation(!emailValidation)}
            >
              <Box>
                <Text fontSize="12px" fontWeight="700">Email validation</Text>
                <Text fontSize="10px" color={themeColors.text.secondary}>Require user to verify email address.</Text>
              </Box>
              <Box
                w="30px"
                h="18px"
                bg={emailValidation ? themeColors.brand.accent : '#cbd5e1'}
                borderRadius="10px"
                position="relative"
              >
                <Box
                  w="14px"
                  h="14px"
                  bg="#ffffff"
                  borderRadius="50%"
                  position="absolute"
                  top="2px"
                  right={emailValidation ? '2px' : '14px'}
                  transition="right 0.15s ease"
                />
              </Box>
            </Flex>
          </Flex>

          <Flex justify="space-between" borderTop="1px solid" borderColor={themeColors.panel.divider} pt={4}>
            <Button variant="outline" onClick={onClose} minW="120px">
              Cancel
            </Button>
            <Button
              type="submit"
              bg={themeColors.brand.primary}
              color="#ffffff"
              _hover={{ bg: themeColors.brand.primaryHover }}
              minW="120px"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create user'}
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default UsersPage;
