import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  chakra,
  Flex,
  HStack,
  Text,
  VStack,
  Input,
  Textarea,
  Spinner,
} from '@chakra-ui/react';
import { Header } from '@/layout/Header';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import {
  useGetUsers,
  useGetUserAvatar,
  useCreateUser,
  useUpdateUser,
  useSuspendUser,
  useApiRequirements,
  testPasswordPattern,
  getPasswordRequirementsDescription,
  parsePasswordPolicy,
  DEFAULT_PASSWORD_PATTERN,
} from '@/api';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/authStore';
import { UserScopedAccessTab } from './UserScopedAccessTab';
import { PoliciesTab } from './PoliciesTab';
import { useUsersUiStore } from '@/stores/usersUiStore';
import type { User, UpdateUserPayload } from '@/types/user';

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

// Component: Lazy loaded user avatar with fallback to role-colored initials
interface UserAvatarProps {
  userId?: string;
  avatarToken?: string;
  name?: string;
  email?: string;
  userRole?: string;
  size?: string;
  fontSize?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  avatarToken,
  name,
  email,
  userRole,
  size = '32px',
  fontSize = '12px',
}) => {
  const { data: avatarUrl } = useGetUserAvatar(userId, avatarToken);
  const avatarColor = getAvatarColor(userRole);
  const initials = getInitials(name, email);

  if (avatarUrl) {
    return (
      <Box
        w={size}
        h={size}
        borderRadius="50%"
        overflow="hidden"
        flexShrink={0}
      >
        <img
          src={avatarUrl}
          alt={name || email}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Box>
    );
  }

  return (
    <Flex
      w={size}
      h={size}
      borderRadius="50%"
      bg={avatarColor}
      color="#ffffff"
      align="center"
      justify="center"
      fontSize={fontSize}
      fontWeight="700"
      flexShrink={0}
    >
      {initials}
    </Flex>
  );
};

export const UsersPage: React.FC = () => {
  // Fetch real users from OWSEC API using token
  const { data: users = [], isLoading, isFetching, isError, error, refetch } = useGetUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const suspendUserMutation = useSuspendUser();

  // TC-USR-012/013: Inspect error status to distinguish 403 Access Restricted from other errors
  const isAccessDenied = useMemo(() => {
    if (!isError || !error) return false;
    if (axios.isAxiosError(error)) {
      return error.response?.status === 403;
    }
    return (error as any)?.response?.status === 403;
  }, [isError, error]);

  // Selection & UI State (persisted via Zustand)
  const {
    mainTab,
    setMainTab,
    userSubTab: activeDetailTab,
    setUserSubTab: setActiveDetailTab,
    selectedUserId,
    setSelectedUserId,
  } = useUsersUiStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatePolicyOpen, setIsCreatePolicyOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('users_page_size');
      if (saved) {
        const parsed = Number(saved);
        if ([5, 10, 20, 50].includes(parsed)) {
          return parsed;
        }
      }
    } catch {
      // LocalStorage access fallback
    }
    return 5;
  });

  // Persist pageSize to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('users_page_size', String(pageSize));
    } catch {
      // LocalStorage access fallback
    }
  }, [pageSize]);

  const currentUser = useAuthStore((s) => s.user);
  const isCurrentUserRoot = currentUser?.userRole?.toLowerCase() === 'root';

  // Self-account exclusion (TC-USR-001/002):
  // Exclude the currently logged-in user from manageable users collection
  const manageableUsers = useMemo(() => {
    if (!users || users.length === 0) return [];
    if (!currentUser?.id) return users;
    return users.filter((u) => u.id !== currentUser.id);
  }, [users, currentUser?.id]);

  // Auto-select first user when manageable users list loads
  useEffect(() => {
    if (manageableUsers.length > 0) {
      const exists = manageableUsers.some((u) => u.id === selectedUserId);
      if (!exists) {
        setSelectedUserId(manageableUsers[0].id);
      }
    } else if (selectedUserId !== null) {
      setSelectedUserId(null);
    }
  }, [manageableUsers, selectedUserId, setSelectedUserId]);

  const selectedUser = useMemo(() => {
    return manageableUsers.find((u) => u.id === selectedUserId) || manageableUsers[0] || null;
  }, [manageableUsers, selectedUserId]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return manageableUsers.filter((u) => {
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
  }, [manageableUsers, search, roleFilter, statusFilter]);

  // Reset pagination to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  // Ensure current page shows the selected user when selectedUserId changes
  useEffect(() => {
    if (selectedUserId && filteredUsers.length > 0) {
      const idx = filteredUsers.findIndex((u) => u.id === selectedUserId);
      if (idx !== -1) {
        const targetPage = Math.floor(idx / pageSize) + 1;
        setCurrentPage((prev) => (prev === targetPage ? prev : targetPage));
      }
    }
  }, [selectedUserId, pageSize, filteredUsers]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  // Paginated Users for Table Display (5 users per page)
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Derived KPI Counts (calculated from manageableUsers per TC-USR-001/002)
  const totalUsersCount = manageableUsers.length;
  const activeCount = manageableUsers.filter((u) => !u.suspended).length;
  const suspendedCount = manageableUsers.filter((u) => u.suspended).length;
  const mfaEnabledCount = manageableUsers.filter((u) => u.userTypeProprietaryInfo?.mfa?.enabled).length;

  return (
    <Box w="100%" pb={8}>
      {/* Header */}
      <Header
        title="Users & Access"
        subtitle="Manage users, system roles, and scoped permissions."
        onRefresh={() => refetch()}
        primaryAction={
          mainTab === 'users'
            ? !isAccessDenied && !isError
              ? {
                  label: 'Create user',
                  onClick: () => setIsCreateModalOpen(true),
                }
              : undefined
            : isCurrentUserRoot
            ? {
                label: 'Create policy',
                onClick: () => setIsCreatePolicyOpen(true),
              }
            : undefined
        }
      />

      {/* Main Top Navigation Subtabs: Users & Policies */}
      <Flex borderBottom="1px solid" borderColor={themeColors.panel.divider} gap={6} mb={4} mt={1}>
        <Button
          variant="plain"
          onClick={() => setMainTab('users')}
          px={1}
          pb={2}
          pt={1}
          fontSize="14px"
          fontWeight={mainTab === 'users' ? '600' : '500'}
          color={mainTab === 'users' ? themeColors.text.title : themeColors.text.secondary}
          position="relative"
          cursor="pointer"
          _after={
            mainTab === 'users'
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
          Users
        </Button>
        <Button
          variant="plain"
          onClick={() => setMainTab('policies')}
          px={1}
          pb={2}
          pt={1}
          fontSize="14px"
          fontWeight={mainTab === 'policies' ? '600' : '500'}
          color={mainTab === 'policies' ? themeColors.text.title : themeColors.text.secondary}
          position="relative"
          cursor="pointer"
          _after={
            mainTab === 'policies'
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
          Policies
        </Button>
      </Flex>

      {mainTab === 'policies' ? (
        <PoliciesTab
          isCreatePolicyOpen={isCreatePolicyOpen}
          onCloseCreatePolicy={() => setIsCreatePolicyOpen(false)}
          onNavigateToUsers={() => setMainTab('users')}
        />
      ) : (
        <>
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
              {isAccessDenied || isError ? '—' : isLoading ? '...' : totalUsersCount}
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
              {isAccessDenied || isError ? '—' : isLoading ? '...' : activeCount}
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
              {isAccessDenied || isError ? '—' : isLoading ? '...' : suspendedCount}
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
              {isAccessDenied || isError ? '—' : isLoading ? '...' : `${mfaEnabledCount} of ${totalUsersCount}`}
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
              opacity={isAccessDenied || isError ? 0.6 : 1}
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
                disabled={isAccessDenied || isError}
              />
            </Flex>

            <SelectDropdown
              value={roleFilter}
              onChange={(val) => {
                setRoleFilter(val);
                setCurrentPage(1);
              }}
              options={['All Roles', 'root', 'admin', 'csr', 'noc', 'installer']}
              w="150px"
              h="38px"
              borderColor={themeColors.input.filterBorder}
              disabled={isAccessDenied || isError}
            />

            <SelectDropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={['All Status', 'Active', 'Suspended']}
              w="130px"
              h="38px"
              borderColor={themeColors.input.filterBorder}
              disabled={isAccessDenied || isError}
            />
          </Flex>

          {/* Table Container */}
          {isAccessDenied ? (
            <AccessRestrictedState
              isRetrying={isFetching}
              onRetry={() => refetch()}
              onNavigateToPolicies={() => setMainTab('policies')}
            />
          ) : isError ? (
            <DirectoryErrorState
              error={error}
              isRetrying={isFetching}
              onRetry={() => refetch()}
            />
          ) : (
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
                <Box flex="2">User</Box>
                <Box flex="1.2">System Role</Box>
                <Box flex="0.8">Status</Box>
                <Box flex="1">Last Login</Box>
                <Box w="20px" />
              </Flex>

              {isLoading ? (
                <Flex justify="center" align="center" minH="200px" direction="column" gap={3}>
                  <Spinner size="md" color={themeColors.brand.primary} />
                  <Text fontSize="13px" color={themeColors.text.secondary}>
                    Loading users from OpenWiFi...
                  </Text>
                </Flex>
              ) : manageableUsers.length === 0 ? (
                <Flex
                  justify="center"
                  align="center"
                  direction="column"
                  minH="220px"
                  p={6}
                  textAlign="center"
                >
                  <Flex
                    w="44px"
                    h="44px"
                    borderRadius="50%"
                    bg={themeColors.brand.accentLight}
                    color={themeColors.brand.accent}
                    align="center"
                    justify="center"
                    mb={3}
                  >
                    <Icon name="users" size={22} />
                  </Flex>
                  <Text fontSize="14px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    No users in directory
                  </Text>
                  <Text fontSize="12px" color={themeColors.text.secondary} maxW="320px" mb={4}>
                    There are currently no manageable users configured in OpenWiFi. Create your first user account to get started.
                  </Text>
                  <Button
                    size="sm"
                    bg={themeColors.brand.primary}
                    color="#ffffff"
                    _hover={{ bg: themeColors.brand.primaryHover }}
                    onClick={() => setIsCreateModalOpen(true)}
                    fontWeight="600"
                  >
                    <HStack gap={1.5}>
                      <Icon name="plus" size={13} />
                      <Text>Create user</Text>
                    </HStack>
                  </Button>
                </Flex>
              ) : filteredUsers.length === 0 ? (
                <Flex
                  justify="center"
                  align="center"
                  direction="column"
                  minH="180px"
                  p={6}
                  textAlign="center"
                >
                  <Flex
                    w="40px"
                    h="40px"
                    borderRadius="50%"
                    bg="#f1f5f9"
                    color={themeColors.text.secondary}
                    align="center"
                    justify="center"
                    mb={2.5}
                  >
                    <Icon name="search" size={20} />
                  </Flex>
                  <Text fontSize="14px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    No matching users
                  </Text>
                  <Text fontSize="12px" color={themeColors.text.secondary} maxW="300px" mb={3}>
                    No users match your active search and filter criteria.
                  </Text>
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor={themeColors.panel.border}
                    color={themeColors.text.primary}
                    onClick={() => {
                      setSearch('');
                      setRoleFilter('All Roles');
                      setStatusFilter('All Status');
                    }}
                    cursor="pointer"
                  >
                    Reset filters
                  </Button>
                </Flex>
              ) : (
                paginatedUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;

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
                      <HStack flex="2" gap={3} minW={0} pr={2}>
                        <UserAvatar
                          userId={u.id}
                          avatarToken={u.avatar}
                          name={u.name}
                          email={u.email}
                          userRole={u.userRole}
                          size="32px"
                          fontSize="12px"
                        />
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
                      <Box flex="1.2" color={themeColors.text.primary} textTransform="capitalize">
                        {u.userRole}
                      </Box>

                      {/* Status */}
                      <Box flex="0.8">
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
                      <Box flex="1" color={themeColors.text.secondary}>
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
        )}

          {/* Pagination bar */}
          {!isAccessDenied && !isError && manageableUsers.length > 0 && (
            <Flex justify="space-between" align="center" mt={4} fontSize="12px" color={themeColors.text.secondary}>
            <HStack gap={3} align="center">
              <Text>
                Showing {filteredUsers.length === 0 ? '0' : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredUsers.length)}`} of {filteredUsers.length}
              </Text>

              {/* Rows Per Page Selector */}
              <HStack gap={1} align="center">
                <Text fontSize="11px" color={themeColors.text.muted}>Rows:</Text>
                <SelectDropdown
                  value={pageSize}
                  onChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                  options={[5, 10, 20, 50]}
                  w="66px"
                  h="26px"
                  fontSize="11px"
                  borderColor={themeColors.panel.border}
                />
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
        )}
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
          position={{ base: 'static', xl: 'sticky' }}
          top="20px"
          maxH="calc(100vh - 40px)"
          overflowY="auto"
        >
          {selectedUser ? (
            <>
              {/* User Detail Head */}
              <Flex align="center" gap={3} pb={3}>
                <UserAvatar
                  userId={selectedUser.id}
                  avatarToken={selectedUser.avatar}
                  name={selectedUser.name}
                  email={selectedUser.email}
                  userRole={selectedUser.userRole}
                  size="44px"
                  fontSize="16px"
                />
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

              {/* Subtabs: Profile & Scoped Access */}
              <Flex borderBottom="1px solid" borderColor={themeColors.panel.divider} h="38px" gap={4} mb={4} mt={2}>
                <Button
                  variant="plain"
                  onClick={() => setActiveDetailTab('profile')}
                  px={2}
                  h="100%"
                  fontSize="13px"
                  fontWeight={activeDetailTab === 'profile' ? '600' : '400'}
                  color={activeDetailTab === 'profile' ? themeColors.text.primary : themeColors.text.secondary}
                  position="relative"
                  _after={
                    activeDetailTab === 'profile'
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
                  onClick={() => setActiveDetailTab('scoped_access')}
                  px={2}
                  h="100%"
                  fontSize="13px"
                  fontWeight={activeDetailTab === 'scoped_access' ? '600' : '400'}
                  color={activeDetailTab === 'scoped_access' ? themeColors.text.primary : themeColors.text.secondary}
                  position="relative"
                  _after={
                    activeDetailTab === 'scoped_access'
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

              {activeDetailTab === 'profile' ? (
                <UserProfileForm
                  user={selectedUser}
                  onSave={(payload, onSuccess) =>
                    updateUserMutation.mutate(payload, {
                      onSuccess: () => {
                        onSuccess?.();
                      },
                    })
                  }
                  isSaving={updateUserMutation.isPending}
                />
              ) : (
                <UserScopedAccessTab user={selectedUser} />
              )}
            </>
          ) : isAccessDenied ? (
            <Flex
              justify="center"
              align="center"
              direction="column"
              minH="260px"
              color={themeColors.text.secondary}
              p={6}
              textAlign="center"
            >
              <Flex
                w="44px"
                h="44px"
                borderRadius="50%"
                bg="#fff7ed"
                color="#ea580c"
                border="1px solid #fed7aa"
                align="center"
                justify="center"
                mb={3}
              >
                <Icon name="lock" size={20} />
              </Flex>
              <Text fontSize="14px" fontWeight="600" color={themeColors.text.title} mb={1}>
                User details unavailable
              </Text>
              <Text fontSize="12px" color={themeColors.text.secondary} maxW="280px">
                User directory access is restricted. Authorize permissions to view user details.
              </Text>
            </Flex>
          ) : isError ? (
            <Flex
              justify="center"
              align="center"
              direction="column"
              minH="260px"
              color={themeColors.text.secondary}
              p={6}
              textAlign="center"
            >
              <Flex
                w="44px"
                h="44px"
                borderRadius="50%"
                bg="#fef2f2"
                color="#dc2626"
                border="1px solid #fecaca"
                align="center"
                justify="center"
                mb={3}
              >
                <Icon name="x" size={20} />
              </Flex>
              <Text fontSize="14px" fontWeight="600" color={themeColors.text.title} mb={1}>
                User details unavailable
              </Text>
              <Text fontSize="12px" color={themeColors.text.secondary} maxW="280px">
                Directory request failed. User profile cannot be loaded.
              </Text>
            </Flex>
          ) : (
            <Flex justify="center" align="center" minH="200px" color={themeColors.text.secondary}>
              <Text fontSize="13px">Select a user to view details</Text>
            </Flex>
          )}
        </Box>
      </Flex>
        </>
      )}

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
    </Box>
  );
};

// Sub-component: Access Restricted State (TC-USR-012/013: OWSEC 403 ACCESS_DENIED)
const AccessRestrictedState: React.FC<{
  isRetrying?: boolean;
  onRetry: () => void;
  onNavigateToPolicies: () => void;
}> = ({ isRetrying, onRetry, onNavigateToPolicies }) => {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      p={{ base: 6, md: 8 }}
      bg="#fcfdfe"
      borderRadius="6px"
      border="1px dashed"
      borderColor="#fed7aa"
      textAlign="center"
      minH="300px"
      my={2}
    >
      <Flex
        w="48px"
        h="48px"
        borderRadius="50%"
        bg="#fff7ed"
        border="1px solid #fed7aa"
        color="#ea580c"
        align="center"
        justify="center"
        mb={3}
      >
        <Icon name="lock" size={24} />
      </Flex>

      <Box
        as="span"
        fontSize="11px"
        fontWeight="700"
        px={2.5}
        py="2px"
        borderRadius="4px"
        bg="#ffedd5"
        color="#c2410c"
        border="1px solid #fed7aa"
        mb={2}
        textTransform="uppercase"
        letterSpacing="0.5px"
      >
        HTTP 403 · Access Restricted
      </Box>

      <Text fontSize="16px" fontWeight="700" color={themeColors.text.title} mb={2}>
        User Directory Access Denied
      </Text>

      <Text fontSize="12px" color={themeColors.text.secondary} maxW="460px" mb={5} lineHeight="1.6">
        Your current account role does not have authorization to view or manage the uCentralSec user directory.
        OWSEC rejected the directory lookup with an <strong>ACCESS_DENIED</strong> code.
        Please contact your platform administrator if you require user management privileges.
      </Text>

      <HStack gap={3}>
        <Button
          variant="outline"
          size="sm"
          borderColor={themeColors.panel.border}
          color={themeColors.text.primary}
          disabled={isRetrying}
          onClick={onRetry}
          _hover={{ bg: themeColors.canvas.bg }}
          cursor="pointer"
        >
          <HStack gap={1.5}>
            <Icon name="refresh" size={13} />
            <Text>{isRetrying ? 'Retrying...' : 'Retry request'}</Text>
          </HStack>
        </Button>
        <Button
          bg={themeColors.brand.primary}
          color="#ffffff"
          _hover={{ bg: themeColors.brand.primaryHover }}
          size="sm"
          onClick={onNavigateToPolicies}
          cursor="pointer"
          fontWeight="600"
        >
          <HStack gap={1.5}>
            <Icon name="shield" size={13} />
            <Text>View security policies</Text>
          </HStack>
        </Button>
      </HStack>
    </Flex>
  );
};

// Sub-component: Request Error State (TC-USR-012/013: 500, Network, Timeout)
const DirectoryErrorState: React.FC<{
  error: unknown;
  isRetrying?: boolean;
  onRetry: () => void;
}> = ({ error, isRetrying, onRetry }) => {
  const errorMessage =
    (error as any)?.response?.data?.ErrorDescription ||
    (error as any)?.message ||
    'Failed to communicate with OpenWiFi Security service';

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      p={{ base: 6, md: 8 }}
      bg="#fffbfa"
      borderRadius="6px"
      border="1px dashed"
      borderColor="#fecaca"
      textAlign="center"
      minH="300px"
      my={2}
    >
      <Flex
        w="48px"
        h="48px"
        borderRadius="50%"
        bg="#fef2f2"
        border="1px solid #fecaca"
        color="#dc2626"
        align="center"
        justify="center"
        mb={3}
      >
        <Icon name="x" size={24} />
      </Flex>

      <Box
        as="span"
        fontSize="11px"
        fontWeight="700"
        px={2.5}
        py="2px"
        borderRadius="4px"
        bg="#fee2e2"
        color="#b91c1c"
        border="1px solid #fecaca"
        mb={2}
        textTransform="uppercase"
        letterSpacing="0.5px"
      >
        Directory Request Failed
      </Box>

      <Text fontSize="16px" fontWeight="700" color={themeColors.text.title} mb={2}>
        Unable to Load User Directory
      </Text>

      <Text fontSize="12px" color={themeColors.text.secondary} maxW="440px" mb={3} lineHeight="1.6">
        An unexpected error occurred while communicating with uCentralSec. Check your network connection or verify that OWSEC is operating.
      </Text>

      <Box
        as="code"
        fontSize="11px"
        color="#b91c1c"
        bg="#fef2f2"
        p={2}
        borderRadius="4px"
        border="1px solid #fecaca"
        fontFamily="monospace"
        maxW="440px"
        mb={5}
        wordBreak="break-word"
      >
        {errorMessage}
      </Box>

      <Button
        bg={themeColors.brand.primary}
        color="#ffffff"
        _hover={{ bg: themeColors.brand.primaryHover }}
        size="sm"
        disabled={isRetrying}
        onClick={onRetry}
        cursor="pointer"
        fontWeight="600"
      >
        <HStack gap={1.5}>
          <Icon name="refresh" size={13} />
          <Text>{isRetrying ? 'Retrying...' : 'Retry request'}</Text>
        </HStack>
      </Button>
    </Flex>
  );
};

// Sub-component: User Profile Form
const UserProfileForm: React.FC<{
  user: User;
  onSave: (
    payload: UpdateUserPayload,
    onSuccess?: () => void
  ) => void;
  isSaving: boolean;
}> = ({ user, onSave, isSaving }) => {
  const currentUser = useAuthStore((s) => s.user);
  const isCurrentUserRoot = currentUser?.userRole?.toLowerCase() === 'root';
  const { passwordPattern, passwordPolicyLink } = useApiRequirements();

  const availableRoles = [
    ...(isCurrentUserRoot || user.userRole?.toLowerCase() === 'root'
      ? [{ label: 'Root', value: 'root' }]
      : []),
    { label: 'Admin', value: 'admin' },
    { label: 'CSR', value: 'csr' },
    { label: 'NOC', value: 'noc' },
    { label: 'Installer', value: 'installer' },
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [role, setRole] = useState(user.userRole || 'admin');
  const [description, setDescription] = useState(user.description || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  const isPasswordValid = useMemo(
    () => !password.trim() || testPasswordPattern(password.trim(), passwordPattern),
    [password, passwordPattern]
  );

  useEffect(() => {
    setName(user.name || '');
    setRole(user.userRole || 'admin');
    setDescription(user.description || '');
    setPassword('');
    setShowPassword(false);
    setPasswordTouched(false);
    setIsEditing(false);
  }, [user]);

  const handleCancel = () => {
    setName(user.name || '');
    setRole(user.userRole || 'admin');
    setDescription(user.description || '');
    setPassword('');
    setShowPassword(false);
    setPasswordTouched(false);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (password.trim() && !testPasswordPattern(password.trim(), passwordPattern)) {
      setPasswordTouched(true);
      toaster.warning({
        title: 'Validation Error',
        description: `Password must satisfy: ${getPasswordRequirementsDescription(passwordPattern)}`,
      });
      return;
    }
    if (!isCurrentUserRoot && role === 'root' && user.userRole?.toLowerCase() !== 'root') {
      toaster.error({
        title: 'Permission Denied',
        description: 'Only root administrators can assign the root role.',
      });
      return;
    }
    const payload: UpdateUserPayload = {
      id: user.id,
      name,
      userRole: role,
      description,
      ...(password.trim() ? { currentPassword: password.trim() } : {}),
    };
    onSave(payload, () => {
      setIsEditing(false);
    });
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Header with Title, Mode Badge, and Edit Icon Button */}
      <Flex justify="space-between" align="center">
        <HStack gap={2}>
          <Text fontSize="14px" fontWeight="600" color={themeColors.text.title}>
            Profile information
          </Text>
          <Box
            as="span"
            fontSize="10px"
            fontWeight="600"
            px={2}
            py="2px"
            borderRadius="4px"
            bg={isEditing ? themeColors.brand.accentLight : '#f1f5f9'}
            color={isEditing ? themeColors.brand.accent : themeColors.text.muted}
            border="1px solid"
            borderColor={isEditing ? themeColors.brand.accent : themeColors.panel.border}
          >
            {isEditing ? 'Editing' : 'Read-only'}
          </Box>
        </HStack>

        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            if (isEditing) {
              handleCancel();
            } else {
              setIsEditing(true);
            }
          }}
          borderColor={isEditing ? themeColors.panel.border : themeColors.brand.accent}
          color={isEditing ? themeColors.text.secondary : themeColors.brand.accent}
          _hover={{ bg: isEditing ? themeColors.canvas.bg : themeColors.brand.accentLight }}
          cursor="pointer"
          h="28px"
          px={2.5}
        >
          <HStack gap={1.5}>
            <Icon name={isEditing ? 'x' : 'edit'} size={13} />
            <Text fontSize="12px" fontWeight="600">
              {isEditing ? 'Cancel Edit' : 'Edit'}
            </Text>
          </HStack>
        </Button>
      </Flex>

      {/* Email & Name */}
      <Flex gap={3}>
        <Box flex="1">
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            Email
          </Text>
          <Input
            value={user.email || ''}
            size="sm"
            borderRadius="4px"
            borderColor={themeColors.input.border}
            bg={themeColors.input.bg}
            readOnly
            disabled
            cursor="default"
          />
          {isEditing && (
            <Text fontSize="10px" color={themeColors.text.muted} mt={1}>
              Email is immutable and cannot be modified.
            </Text>
          )}
        </Box>
        <Box flex="1">
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            Name {isEditing && <Box as="span" color={themeColors.text.required}>*</Box>}
          </Text>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="sm"
            borderRadius="4px"
            borderColor={themeColors.input.border}
            bg={isEditing ? '#ffffff' : themeColors.input.bg}
            readOnly={!isEditing}
            disabled={!isEditing}
            cursor={!isEditing ? 'default' : 'text'}
          />
        </Box>
      </Flex>

      {/* System Role */}
      <Box>
        <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          System Role {isEditing && <Box as="span" color={themeColors.text.required}>*</Box>}
        </Text>
        <SelectDropdown
          value={role}
          onChange={(val) => setRole(val as any)}
          options={availableRoles}
          w="100%"
          h="36px"
          borderColor={themeColors.input.border}
          disabled={!isEditing}
          bg={isEditing ? '#ffffff' : themeColors.input.bg}
        />
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
            onBlur={() => {
              if (password.trim()) setPasswordTouched(true);
            }}
            placeholder={isEditing ? 'Enter new password to change' : '••••••••••••'}
            size="sm"
            borderRadius="4px"
            pr={isEditing ? '75px' : '12px'}
            borderColor={
              isEditing && passwordTouched && !isPasswordValid
                ? themeColors.text.required
                : themeColors.input.border
            }
            bg={isEditing ? '#ffffff' : themeColors.input.bg}
            letterSpacing={!showPassword && password ? '2px' : 'normal'}
            readOnly={!isEditing}
            disabled={!isEditing}
            cursor={!isEditing ? 'default' : 'text'}
          />
          {isEditing && (
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
          )}
        </Flex>
        {isEditing && passwordTouched && !isPasswordValid ? (
          <Text fontSize="11px" color={themeColors.text.required} mt={1}>
            Password must meet requirements ({getPasswordRequirementsDescription(passwordPattern)})
          </Text>
        ) : (
          <Text fontSize="11px" color={themeColors.text.muted} mt={1}>
            {isEditing
              ? `Leave blank to keep current password. Requirements: ${getPasswordRequirementsDescription(passwordPattern)}`
              : 'Password is encrypted and protected.'}
          </Text>
        )}
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
          bg={isEditing ? '#ffffff' : themeColors.input.bg}
          placeholder={isEditing ? 'Describe user responsibility' : 'No description provided.'}
          readOnly={!isEditing}
          disabled={!isEditing}
          cursor={!isEditing ? 'default' : 'text'}
        />
      </Box>

      {/* View Password Policy Modal Trigger */}
      <Box mt={1}>
        <Button
          type="button"
          variant="plain"
          p={0}
          h="auto"
          fontSize="12px"
          color={themeColors.brand.accent}
          _hover={{ textDecoration: 'underline' }}
          onClick={() => setIsPolicyModalOpen(true)}
          cursor="pointer"
        >
          <HStack gap={1}>
            <Text>View password policy</Text>
            <Icon name="info" size={13} />
          </HStack>
        </Button>
      </Box>

      {/* Dynamic OWSEC Password Policy Modal */}
      <PasswordPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        passwordPattern={passwordPattern}
        passwordPolicyLink={passwordPolicyLink}
        currentPassword={password}
      />

      {/* Form Action Buttons - Only visible when editing */}
      {isEditing && (
        <Flex justify="flex-end" align="center" gap={3} pt={4} mt={2} borderTop="1px solid" borderColor={themeColors.panel.divider}>
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
            disabled={isSaving || (passwordTouched && !isPasswordValid)}
            onClick={handleSave}
            fontWeight="600"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </Flex>
      )}
    </VStack>
  );
};

// Sub-component: Dynamic OWSEC Password Policy Modal
const PasswordPolicyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  passwordPattern?: string | null;
  passwordPolicyLink?: string;
  currentPassword?: string;
}> = ({ isOpen, onClose, passwordPattern, passwordPolicyLink, currentPassword = '' }) => {
  if (!isOpen) return null;

  const rules = parsePasswordPolicy(passwordPattern);
  const activePattern = passwordPattern || DEFAULT_PASSWORD_PATTERN;
  const hasPasswordInput = currentPassword.trim().length > 0;

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1200"
      p={4}
    >
      <Box
        w="min(520px, 95vw)"
        bg="#ffffff"
        borderRadius="8px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        p={6}
      >
        <Flex justify="space-between" align="flex-start" mb={3}>
          <HStack gap={2.5}>
            <Flex
              w="36px"
              h="36px"
              borderRadius="8px"
              bg={themeColors.brand.accentLight}
              color={themeColors.brand.accent}
              align="center"
              justify="center"
            >
              <Icon name="shield" size={20} />
            </Flex>
            <Box>
              <HStack gap={2}>
                <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                  Password Policy
                </Text>
                <Box
                  as="span"
                  fontSize="10px"
                  fontWeight="600"
                  px={1.5}
                  py="1px"
                  borderRadius="4px"
                  bg="#eff6ff"
                  color="#2563eb"
                  border="1px solid #bfdbfe"
                >
                  OWSEC Authoritative
                </Box>
              </HStack>
              <Text fontSize="12px" color={themeColors.text.secondary}>
                Enforced dynamically via backend security configuration
              </Text>
            </Box>
          </HStack>
          <Button
            variant="plain"
            onClick={onClose}
            p={1}
            minW="auto"
            h="auto"
            color={themeColors.text.secondary}
            _hover={{ color: themeColors.text.primary }}
          >
            <Icon name="x" size={18} />
          </Button>
        </Flex>

        <Text fontSize="13px" color={themeColors.text.secondary} mb={3.5}>
          Passwords must meet the following complexity rules derived from uCentralSec:
        </Text>

        {/* Dynamic Rules Checklist */}
        <VStack gap={2} align="stretch" mb={4}>
          {rules.map((rule) => {
            const isMet = hasPasswordInput ? rule.test(currentPassword.trim()) : null;
            return (
              <Flex
                key={rule.id}
                p={2.5}
                borderRadius="6px"
                bg={hasPasswordInput ? (isMet ? '#f0fdf4' : '#fff1f2') : '#f8fafc'}
                border="1px solid"
                borderColor={hasPasswordInput ? (isMet ? '#bbf7d0' : '#fecdd3') : '#e2e8f0'}
                align="flex-start"
                gap={2.5}
              >
                <Box
                  mt="2px"
                  color={
                    hasPasswordInput
                      ? isMet
                        ? '#16a34a'
                        : '#e11d48'
                      : '#16a34a'
                  }
                >
                  <Icon name={hasPasswordInput ? (isMet ? 'check' : 'x') : 'check'} size={15} />
                </Box>
                <Box flex="1">
                  <Text
                    fontSize="13px"
                    fontWeight="600"
                    color={
                      hasPasswordInput
                        ? isMet
                          ? '#15803d'
                          : '#be123c'
                        : themeColors.text.primary
                    }
                  >
                    {rule.label}
                  </Text>
                  <Text fontSize="11px" color={themeColors.text.muted}>
                    {rule.detail}
                  </Text>
                </Box>
                {hasPasswordInput && (
                  <Box
                    fontSize="11px"
                    fontWeight="700"
                    color={isMet ? '#16a34a' : '#e11d48'}
                  >
                    {isMet ? 'Satisfied' : 'Missing'}
                  </Box>
                )}
              </Flex>
            );
          })}
        </VStack>

        {/* Raw OWSEC Pattern Section */}
        <Box
          p={2.5}
          borderRadius="6px"
          bg="#f8fafc"
          border="1px solid #e2e8f0"
          mb={4}
        >
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
              Backend Regex Pattern
            </Text>
            <Text fontSize="10px" color={themeColors.text.muted}>
              contract from /api/v1/oauth2
            </Text>
          </Flex>
          <Box
            as="code"
            display="block"
            fontSize="10px"
            color="#475569"
            bg="#ffffff"
            p={1.5}
            borderRadius="4px"
            border="1px solid #e2e8f0"
            fontFamily="monospace"
            wordBreak="break-all"
            userSelect="all"
          >
            {activePattern}
          </Box>
        </Box>

        {/* Footer */}
        <Flex justify="space-between" align="center" pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
          {passwordPolicyLink ? (
            <chakra.a
              href={passwordPolicyLink}
              target="_blank"
              rel="noopener noreferrer"
              fontSize="12px"
              color={themeColors.brand.accent}
              _hover={{ textDecoration: 'underline' }}
              display="inline-flex"
              alignItems="center"
              gap={1}
            >
              <Text>Open official policy page</Text>
              <Icon name="external" size={12} />
            </chakra.a>
          ) : (
            <Box />
          )}

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
  const currentUser = useAuthStore((s) => s.user);
  const isCurrentUserRoot = currentUser?.userRole?.toLowerCase() === 'root';
  const { passwordPattern, passwordPolicyLink } = useApiRequirements();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [changePassword, setChangePassword] = useState(true);
  const [emailValidation, setEmailValidation] = useState(false);

  const isPasswordValid = useMemo(
    () => testPasswordPattern(password, passwordPattern),
    [password, passwordPattern]
  );

  const roleOptions = [
    ...(isCurrentUserRoot ? [{ label: 'Root', value: 'root' }] : []),
    { label: 'Admin', value: 'admin' },
    { label: 'CSR', value: 'csr' },
    { label: 'NOC', value: 'noc' },
    { label: 'Installer', value: 'installer' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);
    if (!email || !name) return;
    if (!testPasswordPattern(password, passwordPattern)) {
      toaster.warning({
        title: 'Validation Error',
        description: `Password must satisfy: ${getPasswordRequirementsDescription(passwordPattern)}`,
      });
      return;
    }
    if (!isCurrentUserRoot && userRole === 'root') {
      toaster.error({
        title: 'Permission Denied',
        description: 'Only root administrators can create users with the root role.',
      });
      return;
    }
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
              <SelectDropdown
                value={userRole}
                onChange={(val) => setUserRole(String(val))}
                options={roleOptions}
                w="100%"
                h="36px"
              />
            </Box>
            <Box flex="1">
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Password <Box as="span" color={themeColors.text.required}>*</Box>
              </Text>
              <Flex position="relative" align="center">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="Enter password"
                  size="sm"
                  borderRadius="4px"
                  pr="75px"
                  borderColor={
                    passwordTouched && !isPasswordValid
                      ? themeColors.text.required
                      : undefined
                  }
                  letterSpacing={!showPassword && password ? '2px' : 'normal'}
                  required
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
              <Flex justify="space-between" align="center" mt={1}>
                <Text
                  fontSize="11px"
                  color={passwordTouched && !isPasswordValid ? themeColors.text.required : themeColors.text.muted}
                >
                  {passwordTouched && !isPasswordValid
                    ? `Password must meet requirements (${getPasswordRequirementsDescription(passwordPattern)})`
                    : getPasswordRequirementsDescription(passwordPattern)}
                </Text>
                <Button
                  type="button"
                  variant="plain"
                  p={0}
                  h="auto"
                  fontSize="11px"
                  color={themeColors.brand.accent}
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => setIsPolicyModalOpen(true)}
                  cursor="pointer"
                >
                  <HStack gap={1}>
                    <Text>Password policy</Text>
                    <Icon name="info" size={11} />
                  </HStack>
                </Button>
              </Flex>
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
              disabled={isLoading || (passwordTouched && !isPasswordValid)}
            >
              {isLoading ? 'Creating...' : 'Create user'}
            </Button>
          </Flex>
        </Box>

        {/* Dynamic OWSEC Password Policy Modal */}
        <PasswordPolicyModal
          isOpen={isPolicyModalOpen}
          onClose={() => setIsPolicyModalOpen(false)}
          passwordPattern={passwordPattern}
          passwordPolicyLink={passwordPolicyLink}
          currentPassword={password}
        />
      </Box>
    </Box>
  );
};

export default UsersPage;
