import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
  Input,
  Badge,
  SimpleGrid,
  Spinner,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import { useUsersUiStore } from '@/stores/usersUiStore';
import { useAuthStore } from '@/stores/authStore';
import {
  useGetManagementPolicies,
  useUpdateManagementPolicy,
  useCreateManagementPolicy,
  useDeleteManagementPolicy,
} from '@/api';
import type { ManagementPolicy, ManagementPolicyEntry } from '@/types/managementRole';
import { toaster } from '@/components/ui/toaster';

export interface ResourcePermission {
  resource: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface PolicyAssignedUser {
  name: string;
  initials: string;
  avatarBg: string;
  property: string;
  venueScope: string;
}

export interface PolicyItem {
  id: string;
  name: string;
  type?: string;
  preset?: string;
  status: string;
  createdBy?: string;
  usedByUsers: number;
  scopedAssignmentsCount: number;
  propertiesCount: number;
  venuesCount: number;
  modified: string;
  description: string;
  permissions: ResourcePermission[];
  assignedUsers: PolicyAssignedUser[];
}

export const ALL_POLICY_RESOURCES = [
  'Entity',
  'Venue',
  'Configuration',
  'Inventory',
  'Operator',
  'Subscriber',
  'Contact',
  'Location',
];


// Helpers for API data mapping
const formatPolicyDate = (timestamp?: number): string => {
  if (!timestamp) return '—';
  try {
    const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp;
    const date = new Date(ms);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const RESOURCE_LABEL_MAP: Record<string, string> = {
  entity: 'Entity',
  property: 'Entity',
  venue: 'Venue',
  inventory: 'Inventory',
  device: 'Inventory',
  configuration: 'Configuration',
  operator: 'Operator',
  subscriber: 'Subscriber',
  contact: 'Contact',
  location: 'Location',
};

const UI_LABEL_TO_RESOURCE_KEY: Record<string, string> = {
  Entity: 'entity',
  Venue: 'venue',
  Configuration: 'configuration',
  Inventory: 'inventory',
  Operator: 'operator',
  Subscriber: 'subscriber',
  Contact: 'contact',
  Location: 'location',
};

const normalizeResourceName = (raw: string): string => {
  const lower = raw.trim().toLowerCase();
  if (RESOURCE_LABEL_MAP[lower]) {
    return RESOURCE_LABEL_MAP[lower];
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const parseEntriesToPermissions = (entries?: ManagementPolicyEntry[]): ResourcePermission[] => {
  const permMap = new Map<string, ResourcePermission>();

  // Always initialize ALL 8 resources in exact order
  for (const res of ALL_POLICY_RESOURCES) {
    permMap.set(res, {
      resource: res,
      read: false,
      create: false,
      update: false,
      delete: false,
    });
  }

  if (entries && Array.isArray(entries)) {
    for (const entry of entries) {
      const accessList = (entry.access || []).map((a) => a.toUpperCase());
      const isFull = accessList.includes('FULL') || accessList.includes('*');
      const canRead = isFull || accessList.includes('READ');
      const canCreate = isFull || accessList.includes('CREATE');
      const canUpdate = isFull || accessList.includes('UPDATE') || accessList.includes('MODIFY');
      const canDelete = isFull || accessList.includes('DELETE');

      for (const rawRes of entry.resources || []) {
        const lowerRes = rawRes.trim().toLowerCase();
        if (lowerRes === 'configurationprofile' || lowerRes === 'configuration profile') {
          continue;
        }
        const resName = normalizeResourceName(rawRes);
        const existing = permMap.get(resName) || {
          resource: resName,
          read: false,
          create: false,
          update: false,
          delete: false,
        };

        permMap.set(resName, {
          resource: resName,
          read: existing.read || canRead,
          create: existing.create || canCreate,
          update: existing.update || canUpdate,
          delete: existing.delete || canDelete,
        });
      }
    }
  }

  // Always return all 8 resources in the exact specified order
  const result: ResourcePermission[] = [];
  for (const res of ALL_POLICY_RESOURCES) {
    if (permMap.has(res)) {
      result.push(permMap.get(res)!);
    }
  }
  for (const [resName, perm] of permMap.entries()) {
    if (!ALL_POLICY_RESOURCES.includes(resName)) {
      result.push(perm);
    }
  }

  return result;
};

const mapApiPolicyToItem = (p: ManagementPolicy): PolicyItem => {
  const formattedDate = formatPolicyDate(p.modified || p.created);

  // Always parse all 8 resources from entries for every policy
  const perms = parseEntriesToPermissions(p.entries);

  return {
    id: p.id,
    name: p.name,
    preset: p.name,
    status: 'Active',
    usedByUsers: 0,
    scopedAssignmentsCount: 0,
    propertiesCount: 0,
    venuesCount: 0,
    modified: formattedDate,
    description: p.description || '',
    permissions: perms,
    assignedUsers: [],
  };
};

interface PoliciesTabProps {
  isCreatePolicyOpen?: boolean;
  onCloseCreatePolicy?: () => void;
  onNavigateToUsers?: () => void;
}

export const PoliciesTab: React.FC<PoliciesTabProps> = ({
  isCreatePolicyOpen = false,
  onCloseCreatePolicy,
  onNavigateToUsers,
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const isRoot = currentUser?.userRole?.toLowerCase() === 'root';
  const { data: apiPolicies = [], isLoading: isPoliciesLoading } = useGetManagementPolicies();
  const createPolicyMutation = useCreateManagementPolicy();
  const updatePolicyMutation = useUpdateManagementPolicy();
  const deletePolicyMutation = useDeleteManagementPolicy();
  const [policies, setPolicies] = useState<PolicyItem[]>([]);

  // Delete policy modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Edit policy state (only root can toggle)
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPermissions, setEditPermissions] = useState<ResourcePermission[]>([]);

  // Sync real policies from API
  useEffect(() => {
    if (apiPolicies) {
      setPolicies(apiPolicies.map(mapApiPolicyToItem));
    }
  }, [apiPolicies]);
  const {
    selectedPolicyId,
    setSelectedPolicyId,
    policySubTab: activeDetailTab,
    setPolicySubTab: setActiveDetailTab,
  } = useUsersUiStore();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('policies_page_size');
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
      localStorage.setItem('policies_page_size', String(pageSize));
    } catch {
      // LocalStorage access fallback
    }
  }, [pageSize]);

  // Reset pagination to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // New policy modal state
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyDesc, setNewPolicyDesc] = useState('');
  const [newPolicyPreset, setNewPolicyPreset] = useState<'custom' | 'full' | 'read'>('custom');
  const [newPolicyPermissions, setNewPolicyPermissions] = useState<ResourcePermission[]>(() =>
    ALL_POLICY_RESOURCES.map((res) => ({
      resource: res,
      read: true,
      create: false,
      update: false,
      delete: false,
    }))
  );

  const handleApplyPreset = (presetType: 'full' | 'read' | 'clear') => {
    if (presetType === 'full') {
      setNewPolicyPreset('full');
      setNewPolicyPermissions(
        ALL_POLICY_RESOURCES.map((res) => ({
          resource: res,
          read: true,
          create: true,
          update: true,
          delete: true,
        }))
      );
    } else if (presetType === 'read') {
      setNewPolicyPreset('read');
      setNewPolicyPermissions(
        ALL_POLICY_RESOURCES.map((res) => ({
          resource: res,
          read: true,
          create: false,
          update: false,
          delete: false,
        }))
      );
    } else {
      setNewPolicyPreset('custom');
      setNewPolicyPermissions(
        ALL_POLICY_RESOURCES.map((res) => ({
          resource: res,
          read: false,
          create: false,
          update: false,
          delete: false,
        }))
      );
    }
  };

  const handleToggleNewPolicyPermission = (
    resource: string,
    action: 'read' | 'create' | 'update' | 'delete'
  ) => {
    setNewPolicyPreset('custom');
    setNewPolicyPermissions((prev) =>
      prev.map((p) => {
        if (p.resource === resource) {
          return {
            ...p,
            [action]: !p[action],
          };
        }
        return p;
      })
    );
  };

  const handleToggleResourceAll = (resource: string) => {
    setNewPolicyPreset('custom');
    setNewPolicyPermissions((prev) =>
      prev.map((p) => {
        if (p.resource === resource) {
          const isFull = p.read && p.create && p.update && p.delete;
          return {
            ...p,
            read: !isFull,
            create: !isFull,
            update: !isFull,
            delete: !isFull,
          };
        }
        return p;
      })
    );
  };

  const handleCloseCreateModal = () => {
    setNewPolicyName('');
    setNewPolicyDesc('');
    setNewPolicyPreset('custom');
    setNewPolicyPermissions(
      ALL_POLICY_RESOURCES.map((res) => ({
        resource: res,
        read: true,
        create: false,
        update: false,
        delete: false,
      }))
    );
    if (onCloseCreatePolicy) onCloseCreatePolicy();
  };

  // Filtered policies list
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    });
  }, [policies, search]);

  // Keep selectedPolicyId valid if list updates
  useEffect(() => {
    if (policies.length > 0) {
      const exists = policies.some((p) => p.id === selectedPolicyId);
      if (!exists && policies[0]) {
        setSelectedPolicyId(policies[0].id);
      }
    }
  }, [policies, selectedPolicyId, setSelectedPolicyId]);

  // Selected policy
  const selectedPolicy = useMemo(() => {
    return (
      policies.find((p) => p.id === selectedPolicyId) ||
      filteredPolicies[0] ||
      policies[0] ||
      null
    );
  }, [policies, selectedPolicyId, filteredPolicies]);

  // Sync edit state with selectedPolicy
  useEffect(() => {
    if (selectedPolicy) {
      setEditName(selectedPolicy.name);
      setEditDescription(selectedPolicy.description || '');
      setEditPermissions(selectedPolicy.permissions.map((p) => ({ ...p })));
      setIsEditing(false);
    } else {
      setEditName('');
      setEditDescription('');
      setEditPermissions([]);
      setIsEditing(false);
    }
  }, [selectedPolicy?.id]);

  const handleTogglePermission = (resource: string, action: 'read' | 'create' | 'update' | 'delete') => {
    if (!isEditing || !isRoot) return;
    setEditPermissions((prev) =>
      prev.map((p) => {
        if (p.resource === resource) {
          return {
            ...p,
            [action]: !p[action],
          };
        }
        return p;
      })
    );
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / pageSize));
  const paginatedPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPolicies.slice(startIndex, startIndex + pageSize);
  }, [filteredPolicies, currentPage, pageSize]);

  // KPI Calculations
  const totalPoliciesCount = policies.length;

  // Handle Save Policy action
  const handleSavePolicy = async () => {
    if (!selectedPolicy) return;
    if (!isRoot) {
      toaster.error({
        title: 'Access Restricted',
        description: 'Only root administrators can edit management policies.',
      });
      return;
    }
    if (!editName.trim()) {
      toaster.warning({
        title: 'Validation Error',
        description: 'Policy name cannot be empty.',
      });
      return;
    }

    const accessGroups: Record<string, string[]> = {};
    editPermissions.forEach((perm) => {
      const isFull = perm.read && perm.create && perm.update && perm.delete;
      const access: string[] = [];
      if (isFull) {
        access.push('FULL');
      } else {
        if (perm.read) access.push('READ');
        if (perm.create) access.push('CREATE');
        if (perm.update) access.push('UPDATE');
        if (perm.delete) access.push('DELETE');
      }

      if (access.length > 0) {
        const key = [...access].sort().join(',');
        if (!accessGroups[key]) {
          accessGroups[key] = [];
        }
        const resKey = UI_LABEL_TO_RESOURCE_KEY[perm.resource] || perm.resource.toLowerCase();
        accessGroups[key].push(resKey);
      }
    });

    const entries: ManagementPolicyEntry[] = Object.entries(accessGroups).map(([key, resources]) => ({
      resources,
      access: key.split(','),
    }));

    try {
      await updatePolicyMutation.mutateAsync({
        id: selectedPolicy.id,
        name: editName.trim(),
        description: editDescription.trim(),
        entries,
      });

      setPolicies((prev) =>
        prev.map((p) => {
          if (p.id === selectedPolicy.id) {
            return {
              ...p,
              name: editName.trim(),
              description: editDescription.trim(),
              permissions: editPermissions.map((ep) => ({ ...ep })),
            };
          }
          return p;
        })
      );
      setIsEditing(false);
      toaster.success({
        title: 'Policy Updated',
        description: `Policy "${editName}" changes saved successfully.`,
      });
    } catch (err: any) {
      console.error('Failed to update policy:', err);
      const errorMsg =
        err?.response?.data?.ErrorDescription ||
        err?.message ||
        'Failed to update policy. Check permissions or network.';
      toaster.error({
        title: 'Update Failed',
        description: errorMsg,
      });
    }
  };

  // Handle Create Policy action via OWPROV API (POST managementPolicy/{id})
  const handleCreatePolicy = async () => {
    if (!isRoot) {
      toaster.error({
        title: 'Access Restricted',
        description: 'Only root administrators can create management policies.',
      });
      return;
    }
    if (!newPolicyName.trim()) {
      toaster.warning({
        title: 'Validation Error',
        description: 'Policy name is required.',
      });
      return;
    }

    const allResKeys = ALL_POLICY_RESOURCES.map(
      (r) => UI_LABEL_TO_RESOURCE_KEY[r] || r.toLowerCase()
    );

    let entries: ManagementPolicyEntry[] = [];

    if (newPolicyPreset === 'full') {
      entries = [
        {
          resources: allResKeys,
          access: ['FULL'],
        },
      ];
    } else if (newPolicyPreset === 'read') {
      entries = [
        {
          resources: allResKeys,
          access: ['READ'],
        },
      ];
    } else {
      // Group by access permissions list to make payload compact, matching owprov-ui
      const accessGroups: Record<string, string[]> = {};
      newPolicyPermissions.forEach((perm) => {
        const isFull = perm.read && perm.create && perm.update && perm.delete;
        const access: string[] = [];
        if (isFull) {
          access.push('FULL');
        } else {
          if (perm.read) access.push('READ');
          if (perm.create) access.push('CREATE');
          if (perm.update) access.push('UPDATE');
          if (perm.delete) access.push('DELETE');
        }

        if (access.length > 0) {
          const key = [...access].sort().join(',');
          if (!accessGroups[key]) {
            accessGroups[key] = [];
          }
          const resKey = UI_LABEL_TO_RESOURCE_KEY[perm.resource] || perm.resource.toLowerCase();
          accessGroups[key].push(resKey);
        }
      });

      entries = Object.entries(accessGroups).map(([key, resources]) => ({
        resources,
        access: key.split(','),
      }));
    }

    try {
      const res = await createPolicyMutation.mutateAsync({
        name: newPolicyName.trim(),
        description: newPolicyDesc.trim(),
        entity: '',
        venue: '',
        entries,
      });

      toaster.success({
        title: 'Policy Created',
        description: `Policy "${newPolicyName.trim()}" created successfully.`,
      });

      handleCloseCreateModal();
      if (res?.id) {
        setSelectedPolicyId(res.id);
      }
    } catch (err: any) {
      console.error('Failed to create policy:', err);
      const errorMsg =
        err?.response?.data?.ErrorDescription ||
        err?.message ||
        'Failed to create policy. Check permissions or network.';
      toaster.error({
        title: 'Creation Failed',
        description: errorMsg,
      });
    }
  };

  const handleDeletePolicy = async () => {
    if (!selectedPolicy) return;

    setDeleteError(null);
    try {
      await deletePolicyMutation.mutateAsync(selectedPolicy.id);

      toaster.success({
        title: 'Policy Deleted',
        description: `Policy "${selectedPolicy.name}" has been deleted successfully.`,
      });

      setIsDeleteModalOpen(false);

      // Select another remaining policy if available
      const remaining = policies.filter((p) => p.id !== selectedPolicy.id);
      if (remaining.length > 0) {
        setSelectedPolicyId(remaining[0].id);
      } else {
        setSelectedPolicyId('');
      }
    } catch (err: any) {
      console.error('Failed to delete policy:', err);
      const status = err?.response?.status;
      const errorCode = err?.response?.data?.ErrorCode || err?.response?.data?.errorCode;
      const errorDesc = err?.response?.data?.ErrorDescription || err?.response?.data?.errorDescription || '';
      const errorDetails = err?.response?.data?.ErrorDetails || err?.response?.data?.errorDetails || '';
      const rawMsg = `${errorDesc} ${errorDetails}`.toLowerCase();

      const isStillInUse =
        errorCode === 1005 ||
        rawMsg.includes('still in use') ||
        rawMsg.includes('stillinuse') ||
        rawMsg.includes('currently assigned') ||
        status === 409;

      let userFacingMessage = 'Failed to delete policy.';
      if (isStillInUse) {
        userFacingMessage = `Cannot delete "${selectedPolicy.name}": Management policy is currently assigned to one or more management roles.`;
        toaster.error({
          title: 'Policy In Use',
          description: userFacingMessage,
        });
      } else {
        userFacingMessage = errorDetails || errorDesc || err?.message || 'Failed to delete policy.';
        toaster.error({
          title: 'Delete Failed',
          description: userFacingMessage,
        });
      }
      setDeleteError(userFacingMessage);
    }
  };

  return (
    <VStack gap={4} align="stretch" w="100%">
      {/* Total Policies KPI Card */}
      <Flex
        w={{ base: '100%', sm: '260px' }}
        bg="#ffffff"
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="6px"
        p="16px"
        align="center"
        gap={3.5}
      >
        <Flex
          w="40px"
          h="40px"
          borderRadius="8px"
          bg="#eff6ff"
          border="1px solid #bfdbfe"
          color="#2563eb"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon name="shield" size={20} />
        </Flex>
        <Box>
          <Text fontSize="12px" fontWeight="500" color="#64748b">
            Total Policies
          </Text>
          <Text fontSize="22px" fontWeight="700" color="#0f172a" lineHeight="1.2">
            {totalPoliciesCount}
          </Text>
        </Box>
      </Flex>

      {/* 3. Split Panel: Policies Table (Left) + Policy Details (Right) */}
      <Flex gap={5} align="flex-start" direction={{ base: 'column', lg: 'row' }}>
        {/* Left Panel: Policies Table */}
        <Box
          flex="1"
          w="100%"
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          p={5}
        >
          <Text fontSize="16px" fontWeight="700" color="#0f172a" mb={4}>
            Policies
          </Text>

          {/* Search Bar */}
          <Box position="relative" mb={4}>
            <Box position="absolute" left="10px" top="10px" color="#94a3b8">
              <Icon name="search" size={16} />
            </Box>
            <Input
              placeholder="Search policies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              pl="34px"
              h="36px"
              fontSize="13px"
              borderRadius="4px"
            />
          </Box>

          {/* Table Header */}
          <Flex
            py={2.5}
            px={3}
            bg="#f8fafc"
            borderBottom="1px solid"
            borderColor={themeColors.panel.border}
            fontSize="11px"
            fontWeight="700"
            color="#64748b"
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            <Box flex="2">Policy</Box>
            <Box flex="1">Status</Box>
            <Box flex="1.2">Modified</Box>
            <Box w="24px" />
          </Flex>

          {/* Table Rows */}
          {paginatedPolicies.map((p) => {
            const isSelected = selectedPolicy ? p.id === selectedPolicy.id : false;
            return (
              <Flex
                key={p.id}
                align="center"
                py={3}
                px={3}
                borderBottom="1px solid"
                borderColor={themeColors.panel.divider}
                bg={isSelected ? '#eff6ff' : 'transparent'}
                border={isSelected ? '1px solid #bfdbfe' : undefined}
                borderRadius={isSelected ? '4px' : undefined}
                cursor="pointer"
                onClick={() => setSelectedPolicyId(p.id)}
                _hover={{ bg: isSelected ? '#eff6ff' : '#f8fafc' }}
                transition="all 0.15s ease"
              >
                {/* Policy Name & Icon */}
                <HStack flex="2" gap={2.5} minW={0} pr={2}>
                  <Flex
                    w="24px"
                    h="24px"
                    borderRadius="50%"
                    bg={isSelected ? '#dbeafe' : '#f1f5f9'}
                    color={isSelected ? '#1d4ed8' : '#64748b'}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Icon name="shield" size={13} />
                  </Flex>
                  <Text
                    fontSize="13px"
                    fontWeight={isSelected ? '700' : '600'}
                    color={isSelected ? '#1e40af' : '#0f172a'}
                    lineClamp={1}
                  >
                    {p.name}
                  </Text>
                </HStack>

                {/* Status */}
                <Box flex="1">
                  <Box
                    as="span"
                    display="inline-block"
                    fontSize="11px"
                    fontWeight="600"
                    px="8px"
                    py="1px"
                    borderRadius="12px"
                    bg="#ecfdf5"
                    color="#15803d"
                    border="1px solid #bbf7d0"
                    whiteSpace="nowrap"
                  >
                    {p.status || 'Active'}
                  </Box>
                </Box>

                {/* Modified */}
                <Box flex="1.2">
                  <Text fontSize="12px" color="#64748b">
                    {p.modified}
                  </Text>
                </Box>

                {/* Arrow */}
                <Box w="24px" textAlign="right" color={isSelected ? '#1e40af' : '#94a3b8'}>
                  <Icon name="chevronRight" size={15} />
                </Box>
              </Flex>
            );
          })}

          {/* Empty / Loading State */}
          {paginatedPolicies.length === 0 && (
            <Flex py={8} justify="center" align="center" color="#64748b" fontSize="13px">
              {isPoliciesLoading ? 'Loading policies...' : 'No policies found'}
            </Flex>
          )}

          {/* Pagination bar */}
          <Flex justify="space-between" align="center" mt={4} fontSize="12px" color={themeColors.text.secondary}>
            <HStack gap={3} align="center">
              <Text>
                Showing {filteredPolicies.length === 0 ? '0' : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredPolicies.length)}`} of {filteredPolicies.length}
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
        </Box>

        {/* Right Panel: Selected Policy Details */}
        <Box
          flex="1.05"
          w="100%"
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          p={5}
          position={{ base: 'static', lg: 'sticky' }}
          top="20px"
          maxH="calc(100vh - 40px)"
          overflowY="auto"
        >
          {!selectedPolicy ? (
            <Flex h="360px" justify="center" align="center" direction="column" gap={3} color="#64748b">
              <Icon name="shield" size={32} color="#cbd5e1" />
              <Text fontSize="14px" fontWeight="500">
                {isPoliciesLoading ? 'Loading policies...' : 'No policy selected'}
              </Text>
            </Flex>
          ) : (
            <>
              {/* Policy Title Row */}
              <Flex justify="space-between" align="flex-start" mb={4}>
            <HStack gap={3} align="flex-start">
              <Flex
                w="40px"
                h="40px"
                borderRadius="50%"
                bg="#eff6ff"
                border="1px solid #bfdbfe"
                color="#0869ff"
                align="center"
                justify="center"
                flexShrink={0}
                mt="2px"
              >
                <Icon name="shield" size={20} />
              </Flex>
              <Box>
                <HStack gap={2}>
                  <Text fontSize="17px" fontWeight="700" color="#0f172a">
                    {selectedPolicy.name}
                  </Text>
                  <Badge
                    bg="#ecfdf5"
                    color="#15803d"
                    border="1px solid #bbf7d0"
                    fontSize="11px"
                    px={2}
                    py="1px"
                    borderRadius="full"
                    fontWeight="600"
                  >
                    {selectedPolicy.status || 'Active'}
                  </Badge>
                </HStack>
                <Text fontSize="12px" color="#64748b" mt={0.5}>
                  {selectedPolicy.description}
                </Text>
              </Box>
            </HStack>

            {/* Action buttons - Only visible for Root */}
            {isRoot && (
              <HStack gap={2}>
                {!isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="xs"
                      h="28px"
                      px={3}
                      color="#2563eb"
                      borderColor="#bfdbfe"
                      bg="#eff6ff"
                      _hover={{ bg: '#dbeafe', borderColor: '#93c5fd' }}
                      onClick={() => {
                        setEditName(selectedPolicy.name);
                        setEditDescription(selectedPolicy.description || '');
                        setEditPermissions(selectedPolicy.permissions.map((p) => ({ ...p })));
                        setIsEditing(true);
                        setActiveDetailTab('permissions');
                      }}
                    >
                      <HStack gap={1.5}>
                        <Icon name="edit" size={13} />
                        <Text fontSize="12px" fontWeight="600">Edit policy</Text>
                      </HStack>
                    </Button>

                    <Button
                      variant="outline"
                      size="xs"
                      h="28px"
                      px={3}
                      color="#dc2626"
                      borderColor="#fecaca"
                      bg="#fef2f2"
                      _hover={{ bg: '#fee2e2', borderColor: '#fca5a5' }}
                      onClick={() => {
                        setDeleteError(null);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <HStack gap={1.5}>
                        <Icon name="trash" size={13} />
                        <Text fontSize="12px" fontWeight="600">Delete policy</Text>
                      </HStack>
                    </Button>
                  </>
                ) : (
                  <Badge colorScheme="purple" variant="subtle" fontSize="11px" px={2.5} py={1} borderRadius="4px">
                    Editing Mode
                  </Badge>
                )}
              </HStack>
            )}
          </Flex>

          {/* Subtabs: Overview & Permissions */}
          <Flex borderBottom="1px solid" borderColor={themeColors.panel.divider} gap={4} mb={4}>
            <Button
              variant="plain"
              onClick={() => setActiveDetailTab('overview')}
              px={2}
              pb={2}
              pt={1}
              fontSize="13px"
              fontWeight={activeDetailTab === 'overview' ? '600' : '400'}
              color={activeDetailTab === 'overview' ? '#0f172a' : '#64748b'}
              position="relative"
              _after={
                activeDetailTab === 'overview'
                  ? {
                      content: '""',
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      bg: '#0869ff',
                    }
                  : undefined
              }
            >
              Overview
            </Button>
            <Button
              variant="plain"
              onClick={() => setActiveDetailTab('permissions')}
              px={2}
              pb={2}
              pt={1}
              fontSize="13px"
              fontWeight={activeDetailTab === 'permissions' ? '600' : '400'}
              color={activeDetailTab === 'permissions' ? '#0f172a' : '#64748b'}
              position="relative"
              _after={
                activeDetailTab === 'permissions'
                  ? {
                      content: '""',
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      bg: '#0869ff',
                    }
                  : undefined
              }
            >
              Permissions
            </Button>
          </Flex>

          {activeDetailTab === 'permissions' ? (
            <VStack gap={4} align="stretch">
              {/* Policy Preset Field */}
              <Box>
                <Text fontSize="11px" fontWeight="600" color="#64748b" mb={1}>
                  Policy name
                </Text>
                <Input
                  value={selectedPolicy.name}
                  readOnly
                  disabled
                  bg="#f8fafc"
                  h="36px"
                  fontSize="13px"
                  borderRadius="4px"
                  borderColor={themeColors.panel.border}
                />
                <Text fontSize="11px" color="#94a3b8" mt={1}>
                  Management policy for scoped entity and venue role assignments.
                </Text>
              </Box>

              {/* Resource permissions Table */}
              <Box>
                <Flex justify="space-between" align="center" mb={2.5}>
                  <Text fontSize="13px" fontWeight="700" color="#0f172a">
                    Resource permissions
                  </Text>
                  {isEditing && (
                    <Text fontSize="11px" color="#2563eb" fontWeight="500">
                      Click any cell to toggle permissions
                    </Text>
                  )}
                </Flex>

                <Box
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  borderRadius="6px"
                  overflow="hidden"
                >
                  {/* Table Header */}
                  <Flex
                    bg="#f8fafc"
                    py={2}
                    px={3}
                    borderBottom="1px solid"
                    borderColor={themeColors.panel.border}
                    fontSize="11px"
                    fontWeight="700"
                    color="#64748b"
                  >
                    <Box flex="1.8">Resource</Box>
                    <Box flex="1" textAlign="center">Read</Box>
                    <Box flex="1" textAlign="center">Create</Box>
                    <Box flex="1" textAlign="center">Update</Box>
                    <Box flex="1" textAlign="center">Delete</Box>
                  </Flex>

                  {/* Rows */}
                  {(isEditing ? editPermissions : selectedPolicy.permissions).map((perm) => (
                    <Flex
                      key={perm.resource}
                      py={2.5}
                      px={3}
                      borderBottom="1px solid"
                      borderColor={themeColors.panel.divider}
                      _last={{ borderBottom: 'none' }}
                      align="center"
                      fontSize="12px"
                    >
                      <Box flex="1.8" fontWeight="600" color="#0f172a">
                        {perm.resource}
                      </Box>

                      {/* Read */}
                      <Flex
                        flex="1"
                        justify="center"
                        cursor={isEditing ? 'pointer' : 'default'}
                        onClick={() => isEditing && handleTogglePermission(perm.resource, 'read')}
                        py={1}
                        borderRadius="4px"
                        _hover={isEditing ? { bg: '#eff6ff' } : undefined}
                      >
                        {perm.read ? (
                          <Flex
                            w="18px"
                            h="18px"
                            borderRadius="50%"
                            border="1.5px solid #16a34a"
                            bg={isEditing ? '#dcfce7' : 'transparent'}
                            color="#16a34a"
                            align="center"
                            justify="center"
                            transition="all 0.15s ease"
                          >
                            <Icon name="check" size={11} />
                          </Flex>
                        ) : isEditing ? (
                          <Flex
                            w="18px"
                            h="18px"
                            borderRadius="50%"
                            border="1.5px dashed #cbd5e1"
                            color="#94a3b8"
                            align="center"
                            justify="center"
                            _hover={{ borderColor: '#16a34a', color: '#16a34a', bg: '#f0fdf4' }}
                            transition="all 0.15s ease"
                          >
                            <Icon name="plus" size={10} />
                          </Flex>
                        ) : (
                          <Text color="#94a3b8" fontWeight="600">—</Text>
                        )}
                      </Flex>

                      {/* Create */}
                      <Flex
                        flex="1"
                        justify="center"
                        cursor={isEditing ? 'pointer' : 'default'}
                        onClick={() => isEditing && handleTogglePermission(perm.resource, 'create')}
                        py={1}
                        borderRadius="4px"
                        _hover={isEditing ? { bg: '#eff6ff' } : undefined}
                      >
                        {perm.create ? (
                          <Flex
                            w="18px"
                            h="18px"
                            borderRadius="50%"
                            border="1.5px solid #16a34a"
                            bg={isEditing ? '#dcfce7' : 'transparent'}
                            color="#16a34a"
                            align="center"
                            justify="center"
                            transition="all 0.15s ease"
                          >
                            <Icon name="check" size={11} />
                          </Flex>
                        ) : isEditing ? (
                          <Flex
                            w="18px"
                            h="18px"
                            borderRadius="50%"
                            border="1.5px dashed #cbd5e1"
                            color="#94a3b8"
                            align="center"
                            justify="center"
                            _hover={{ borderColor: '#16a34a', color: '#16a34a', bg: '#f0fdf4' }}
                            transition="all 0.15s ease"
                          >
                            <Icon name="plus" size={10} />
                          </Flex>
                        ) : (
                          <Text color="#94a3b8" fontWeight="600">—</Text>
                        )}
                      </Flex>

                      {/* Update */}
                      <Flex
                        flex="1"
                        justify="center"
                        cursor={isEditing ? 'pointer' : 'default'}
                        onClick={() => isEditing && handleTogglePermission(perm.resource, 'update')}
                        py={1}
                        borderRadius="4px"
                        _hover={isEditing ? { bg: '#eff6ff' } : undefined}
                      >
                        {perm.update ? (
                          <Flex
                            w="18px"
                            h="18px"
                            borderRadius="50%"
                            border="1.5px solid #16a34a"
                            bg={isEditing ? '#dcfce7' : 'transparent'}
                            color="#16a34a"
                            align="center"
                            justify="center"
                            transition="all 0.15s ease"
                          >
                            <Icon name="check" size={11} />
                          </Flex>
                        ) : isEditing ? (
                          <Flex
                            w="18px"
                            h="18px"
                            borderRadius="50%"
                            border="1.5px dashed #cbd5e1"
                            color="#94a3b8"
                            align="center"
                            justify="center"
                            _hover={{ borderColor: '#16a34a', color: '#16a34a', bg: '#f0fdf4' }}
                            transition="all 0.15s ease"
                          >
                            <Icon name="plus" size={10} />
                          </Flex>
                        ) : (
                          <Text color="#94a3b8" fontWeight="600">—</Text>
                        )}
                      </Flex>

                      {/* Delete */}
                      <Flex
                        flex="1"
                        justify="center"
                        cursor={isEditing ? 'pointer' : 'default'}
                        onClick={() => isEditing && handleTogglePermission(perm.resource, 'delete')}
                        py={1}
                        borderRadius="4px"
                        _hover={isEditing ? { bg: '#eff6ff' } : undefined}
                      >
                        {perm.delete ? (
                          <Flex
                            w="18px"
                            h="18px"
                            borderRadius="50%"
                            border="1.5px solid #16a34a"
                            bg={isEditing ? '#dcfce7' : 'transparent'}
                            color="#16a34a"
                            align="center"
                            justify="center"
                            transition="all 0.15s ease"
                          >
                            <Icon name="check" size={11} />
                          </Flex>
                        ) : isEditing ? (
                          <Flex
                            w="18px"
                            h="18px"
                            borderRadius="50%"
                            border="1.5px dashed #cbd5e1"
                            color="#94a3b8"
                            align="center"
                            justify="center"
                            _hover={{ borderColor: '#16a34a', color: '#16a34a', bg: '#f0fdf4' }}
                            transition="all 0.15s ease"
                          >
                            <Icon name="plus" size={10} />
                          </Flex>
                        ) : (
                          <Text color="#94a3b8" fontWeight="600">—</Text>
                        )}
                      </Flex>
                    </Flex>
                  ))}
                </Box>
              </Box>

              {/* Policy impact callout box */}
              <Flex
                p={3}
                borderRadius="6px"
                bg="#eff6ff"
                border="1px solid #bfdbfe"
                gap={2.5}
                align="flex-start"
              >
                <Box color="#0869ff" mt="1px">
                  <Icon name="info" size={16} />
                </Box>
                <Box>
                  <Text fontSize="12px" fontWeight="700" color="#1e40af">
                    Policy impact
                  </Text>
                  <Text fontSize="11px" color="#1e40af" mt={0.5}>
                    {selectedPolicy.usedByUsers} users across {selectedPolicy.scopedAssignmentsCount} scoped assignments will be affected by permission changes.
                  </Text>
                </Box>
              </Flex>

              {/* Bottom Actions - only displayed in Edit Mode for Root */}
              {isEditing && isRoot && (
                <Flex justify="space-between" pt={2}>
                  <Button
                    variant="outline"
                    size="sm"
                    h="34px"
                    px={4}
                    borderRadius="4px"
                    onClick={() => {
                      if (selectedPolicy) {
                        setEditName(selectedPolicy.name);
                        setEditDescription(selectedPolicy.description || '');
                        setEditPermissions(selectedPolicy.permissions.map((p) => ({ ...p })));
                      }
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    h="34px"
                    px={5}
                    bg="#1a9c52"
                    color="#ffffff"
                    _hover={{ bg: '#15803d' }}
                    borderRadius="4px"
                    fontWeight="600"
                    loading={updatePolicyMutation.isPending}
                    disabled={updatePolicyMutation.isPending}
                    onClick={handleSavePolicy}
                  >
                    Save policy
                  </Button>
                </Flex>
              )}
            </VStack>
          ) : (
            /* Overview Subtab */
            <VStack gap={4} align="stretch">
              {/* Section 1: Usage summary */}
              <Box>
                <Text fontSize="12px" fontWeight="700" color="#0f172a" mb={2}>
                  Usage summary
                </Text>
                <SimpleGrid columns={{ base: 2, sm: 4 }} gap={2.5}>
                  {/* Users */}
                  <Flex
                    bg="#ffffff"
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    p="10px 12px"
                    align="center"
                    gap={2.5}
                  >
                    <Box color="#2563eb" flexShrink={0}>
                      <Icon name="users" size={18} />
                    </Box>
                    <Box minW={0}>
                      <Text fontSize="11px" color="#64748b" fontWeight="500" whiteSpace="nowrap">
                        Users
                      </Text>
                      <Text fontSize="18px" fontWeight="700" color="#0f172a" lineHeight="1.1">
                        {selectedPolicy.usedByUsers}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Scoped assignments */}
                  <Flex
                    bg="#ffffff"
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    p="10px 12px"
                    align="center"
                    gap={2.5}
                  >
                    <Box color="#7c3aed" flexShrink={0}>
                      <Icon name="link" size={18} />
                    </Box>
                    <Box minW={0}>
                      <Text fontSize="11px" color="#64748b" fontWeight="500" whiteSpace="nowrap">
                        Scoped assignments
                      </Text>
                      <Text fontSize="18px" fontWeight="700" color="#0f172a" lineHeight="1.1">
                        {selectedPolicy.scopedAssignmentsCount}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Properties */}
                  <Flex
                    bg="#ffffff"
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    p="10px 12px"
                    align="center"
                    gap={2.5}
                  >
                    <Box color="#16a34a" flexShrink={0}>
                      <Icon name="building" size={18} />
                    </Box>
                    <Box minW={0}>
                      <Text fontSize="11px" color="#64748b" fontWeight="500" whiteSpace="nowrap">
                        Properties
                      </Text>
                      <Text fontSize="18px" fontWeight="700" color="#0f172a" lineHeight="1.1">
                        {selectedPolicy.propertiesCount}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Venues */}
                  <Flex
                    bg="#ffffff"
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    p="10px 12px"
                    align="center"
                    gap={2.5}
                  >
                    <Box color="#ea580c" flexShrink={0}>
                      <Icon name="landmark" size={18} />
                    </Box>
                    <Box minW={0}>
                      <Text fontSize="11px" color="#64748b" fontWeight="500" whiteSpace="nowrap">
                        Venues
                      </Text>
                      <Text fontSize="18px" fontWeight="700" color="#0f172a" lineHeight="1.1">
                        {selectedPolicy.venuesCount}
                      </Text>
                    </Box>
                  </Flex>
                </SimpleGrid>
              </Box>

              {/* Section 2: Policy details */}
              <Box>
                <Text fontSize="12px" fontWeight="700" color="#0f172a" mb={2}>
                  Policy details
                </Text>
                <Box
                  bg="#ffffff"
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  borderRadius="6px"
                  p="14px 16px"
                >
                  <VStack gap={2.5} align="stretch" fontSize="12px">
                    <Flex align="center">
                      <Text w="140px" color="#64748b" flexShrink={0}>
                        Policy name
                      </Text>
                      <Text color="#0f172a" fontWeight="500">
                        {selectedPolicy.name}
                      </Text>
                    </Flex>

                    <Flex align="center">
                      <Text w="140px" color="#64748b" flexShrink={0}>
                        Status
                      </Text>
                      <Box>
                        <Badge
                          bg="#ecfdf5"
                          color="#15803d"
                          border="1px solid #bbf7d0"
                          borderRadius="full"
                          px={2.5}
                          py="1px"
                          fontSize="11px"
                          fontWeight="600"
                          textTransform="capitalize"
                        >
                          {selectedPolicy.status || 'Active'}
                        </Badge>
                      </Box>
                    </Flex>

                    <Flex align="center">
                      <Text w="140px" color="#64748b" flexShrink={0}>
                        Last modified
                      </Text>
                      <Text color="#0f172a">
                        {selectedPolicy.modified}
                      </Text>
                    </Flex>

                    <Flex align="flex-start">
                      <Text w="140px" color="#64748b" flexShrink={0}>
                        Description
                      </Text>
                      <Text color="#0f172a">
                        {selectedPolicy.description || '—'}
                      </Text>
                    </Flex>

                    <HStack gap={1.5} pt={2} color="#64748b" fontSize="11px" align="center">
                      <Icon name="lock" size={13} color="#64748b" />
                      <Text color="#64748b">
                        Policies assigned to active management roles are protected from deletion by OWPROV.
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </Box>

              {/* Section 3: Users with this policy */}
              <Box>
                <HStack gap={2} mb={2} align="center">
                  <Text fontSize="12px" fontWeight="700" color="#0f172a">
                    Users with this policy
                  </Text>
                  <Flex
                    w="18px"
                    h="18px"
                    borderRadius="50%"
                    bg="#f1f5f9"
                    color="#64748b"
                    align="center"
                    justify="center"
                    fontSize="11px"
                    fontWeight="600"
                  >
                    {selectedPolicy.usedByUsers}
                  </Flex>
                </HStack>

                {selectedPolicy.assignedUsers && selectedPolicy.assignedUsers.length > 0 ? (
                  <Box
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    overflow="hidden"
                    bg="#ffffff"
                  >
                    {selectedPolicy.assignedUsers.map((u, idx) => (
                      <Flex
                        key={u.name + idx}
                        align="center"
                        justify="space-between"
                        py={2.5}
                        px={3}
                        borderBottom="1px solid"
                        borderColor={themeColors.panel.divider}
                        _last={{ borderBottom: 'none' }}
                        fontSize="12px"
                      >
                        {/* User Avatar & Name */}
                        <HStack gap={2.5} flex="1.4" minW={0} align="center">
                          <Flex
                            w="26px"
                            h="26px"
                            borderRadius="50%"
                            bg={u.avatarBg}
                            color="#ffffff"
                            align="center"
                            justify="center"
                            fontSize="11px"
                            fontWeight="700"
                            flexShrink={0}
                          >
                            {u.initials}
                          </Flex>
                          <Text
                            fontSize="12px"
                            fontWeight="600"
                            color="#0f172a"
                            lineClamp={1}
                          >
                            {u.name}
                          </Text>
                        </HStack>

                        {/* Property */}
                        <Box flex="1.5" px={2}>
                          <Text fontSize="12px" color="#64748b" lineClamp={1}>
                            {u.property}
                          </Text>
                        </Box>

                        {/* Venue Scope Badge */}
                        <Box textAlign="right" flexShrink={0}>
                          <Badge
                            bg="#f1f5f9"
                            color="#475569"
                            border="1px solid #e2e8f0"
                            borderRadius="full"
                            px={2.5}
                            py="2px"
                            fontSize="11px"
                            fontWeight="500"
                            textTransform="none"
                          >
                            {u.venueScope}
                          </Badge>
                        </Box>
                      </Flex>
                    ))}
                  </Box>
                ) : (
                  <Box
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    p={4}
                    textAlign="center"
                    bg="#ffffff"
                  >
                    <Text fontSize="12px" color="#94a3b8">
                      No users currently assigned to this policy.
                    </Text>
                  </Box>
                )}

                {selectedPolicy.usedByUsers > 0 && (
                  <Box mt={2}>
                    <Text
                      as="span"
                      fontSize="12px"
                      color="#0869ff"
                      fontWeight="500"
                      cursor="pointer"
                      _hover={{ textDecoration: 'underline' }}
                      onClick={onNavigateToUsers}
                    >
                      View all {selectedPolicy.usedByUsers} users
                    </Text>
                  </Box>
                )}
              </Box>
            </VStack>
          )}
        </>
      )}
    </Box>
      </Flex>

      {/* 4. Create Policy Modal */}
      {isCreatePolicyOpen && (
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
            w="min(640px, 95vw)"
            maxH="90vh"
            display="flex"
            flexDirection="column"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.3)"
            overflow="hidden"
          >
            {/* Header */}
            <Flex
              justify="space-between"
              align="center"
              p={5}
              pb={3}
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <HStack gap={2}>
                <Box color="#0869ff">
                  <Icon name="shield" size={20} />
                </Box>
                <Text fontSize="16px" fontWeight="700" color="#0f172a">
                  Create new policy
                </Text>
              </HStack>
              <Button
                variant="plain"
                size="xs"
                p={1}
                cursor="pointer"
                onClick={handleCloseCreateModal}
              >
                <Icon name="x" size={18} />
              </Button>
            </Flex>

            {/* Scrollable Content */}
            <Box p={5} overflowY="auto" flex="1">
              <VStack gap={4} align="stretch">
                <Box>
                  <Text fontSize="12px" fontWeight="600" color="#64748b" mb={1}>
                    Policy Name <Box as="span" color="#ef4444">*</Box>
                  </Text>
                  <Input
                    placeholder="e.g. Venue Support Engineer"
                    value={newPolicyName}
                    onChange={(e) => setNewPolicyName(e.target.value)}
                    h="36px"
                    fontSize="13px"
                    borderRadius="4px"
                  />
                </Box>

                <Box>
                  <Text fontSize="12px" fontWeight="600" color="#64748b" mb={1}>
                    Description
                  </Text>
                  <Input
                    placeholder="Describe permitted capabilities and operations"
                    value={newPolicyDesc}
                    onChange={(e) => setNewPolicyDesc(e.target.value)}
                    h="36px"
                    fontSize="13px"
                    borderRadius="4px"
                  />
                </Box>

                {/* Permissions Configuration */}
                <Box pt={1}>
                  <Flex justify="space-between" align="center" mb={2.5}>
                    <Box>
                      <Text fontSize="13px" fontWeight="700" color="#0f172a">
                        Permissions Configuration
                      </Text>
                      <Text fontSize="11px" color="#64748b">
                        Set resource-level permissions (matching OpenWiFi OWPROV schema)
                      </Text>
                    </Box>

                    {/* Quick Preset Buttons */}
                    <HStack gap={1.5}>
                      <Button
                        size="xs"
                        variant={newPolicyPreset === 'full' ? 'solid' : 'outline'}
                        bg={newPolicyPreset === 'full' ? '#0869ff' : 'transparent'}
                        color={newPolicyPreset === 'full' ? '#ffffff' : '#0869ff'}
                        borderColor="#0869ff"
                        _hover={{ bg: newPolicyPreset === 'full' ? '#0650c5' : '#eff6ff' }}
                        h="26px"
                        px={2.5}
                        fontSize="11px"
                        fontWeight="600"
                        borderRadius="4px"
                        onClick={() => handleApplyPreset('full')}
                      >
                        Full Access
                      </Button>
                      <Button
                        size="xs"
                        variant={newPolicyPreset === 'read' ? 'solid' : 'outline'}
                        bg={newPolicyPreset === 'read' ? '#0869ff' : 'transparent'}
                        color={newPolicyPreset === 'read' ? '#ffffff' : '#0869ff'}
                        borderColor="#0869ff"
                        _hover={{ bg: newPolicyPreset === 'read' ? '#0650c5' : '#eff6ff' }}
                        h="26px"
                        px={2.5}
                        fontSize="11px"
                        fontWeight="600"
                        borderRadius="4px"
                        onClick={() => handleApplyPreset('read')}
                      >
                        Read-Only
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        borderColor="#cbd5e1"
                        color="#64748b"
                        _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
                        h="26px"
                        px={2}
                        fontSize="11px"
                        fontWeight="500"
                        borderRadius="4px"
                        onClick={() => handleApplyPreset('clear')}
                      >
                        Clear All
                      </Button>
                    </HStack>
                  </Flex>

                  {/* Resource Permissions Matrix */}
                  <Box
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    overflow="hidden"
                  >
                    {/* Header */}
                    <Flex
                      bg="#f8fafc"
                      py={2}
                      px={3}
                      borderBottom="1px solid"
                      borderColor={themeColors.panel.border}
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      align="center"
                    >
                      <Box flex="1.8">Resource</Box>
                      <Box flex="1" textAlign="center">Read</Box>
                      <Box flex="1" textAlign="center">Create</Box>
                      <Box flex="1" textAlign="center">Update</Box>
                      <Box flex="1" textAlign="center">Delete</Box>
                      <Box flex="1" textAlign="center">Set All</Box>
                    </Flex>

                    {/* Rows */}
                    {newPolicyPermissions.map((perm) => {
                      const isFull = perm.read && perm.create && perm.update && perm.delete;
                      return (
                        <Flex
                          key={perm.resource}
                          py={2}
                          px={3}
                          borderBottom="1px solid"
                          borderColor={themeColors.panel.divider}
                          _last={{ borderBottom: 'none' }}
                          align="center"
                          fontSize="12px"
                          _hover={{ bg: '#f8fafc' }}
                        >
                          <Box flex="1.8" fontWeight="600" color="#0f172a">
                            {perm.resource}
                          </Box>

                          {/* Read */}
                          <Flex
                            flex="1"
                            justify="center"
                            cursor="pointer"
                            onClick={() => handleToggleNewPolicyPermission(perm.resource, 'read')}
                            py={1}
                            borderRadius="4px"
                            _hover={{ bg: '#eff6ff' }}
                          >
                            {perm.read ? (
                              <Flex
                                w="18px"
                                h="18px"
                                borderRadius="50%"
                                border="1.5px solid #16a34a"
                                bg="#dcfce7"
                                color="#16a34a"
                                align="center"
                                justify="center"
                              >
                                <Icon name="check" size={11} />
                              </Flex>
                            ) : (
                              <Flex
                                w="18px"
                                h="18px"
                                borderRadius="50%"
                                border="1.5px dashed #cbd5e1"
                                color="#94a3b8"
                                align="center"
                                justify="center"
                                _hover={{ borderColor: '#16a34a', color: '#16a34a', bg: '#f0fdf4' }}
                              >
                                <Icon name="plus" size={10} />
                              </Flex>
                            )}
                          </Flex>

                          {/* Create */}
                          <Flex
                            flex="1"
                            justify="center"
                            cursor="pointer"
                            onClick={() => handleToggleNewPolicyPermission(perm.resource, 'create')}
                            py={1}
                            borderRadius="4px"
                            _hover={{ bg: '#eff6ff' }}
                          >
                            {perm.create ? (
                              <Flex
                                w="18px"
                                h="18px"
                                borderRadius="50%"
                                border="1.5px solid #16a34a"
                                bg="#dcfce7"
                                color="#16a34a"
                                align="center"
                                justify="center"
                              >
                                <Icon name="check" size={11} />
                              </Flex>
                            ) : (
                              <Flex
                                w="18px"
                                h="18px"
                                borderRadius="50%"
                                border="1.5px dashed #cbd5e1"
                                color="#94a3b8"
                                align="center"
                                justify="center"
                                _hover={{ borderColor: '#16a34a', color: '#16a34a', bg: '#f0fdf4' }}
                              >
                                <Icon name="plus" size={10} />
                              </Flex>
                            )}
                          </Flex>

                          {/* Update */}
                          <Flex
                            flex="1"
                            justify="center"
                            cursor="pointer"
                            onClick={() => handleToggleNewPolicyPermission(perm.resource, 'update')}
                            py={1}
                            borderRadius="4px"
                            _hover={{ bg: '#eff6ff' }}
                          >
                            {perm.update ? (
                              <Flex
                                w="18px"
                                h="18px"
                                borderRadius="50%"
                                border="1.5px solid #16a34a"
                                bg="#dcfce7"
                                color="#16a34a"
                                align="center"
                                justify="center"
                              >
                                <Icon name="check" size={11} />
                              </Flex>
                            ) : (
                              <Flex
                                w="18px"
                                h="18px"
                                borderRadius="50%"
                                border="1.5px dashed #cbd5e1"
                                color="#94a3b8"
                                align="center"
                                justify="center"
                                _hover={{ borderColor: '#16a34a', color: '#16a34a', bg: '#f0fdf4' }}
                              >
                                <Icon name="plus" size={10} />
                              </Flex>
                            )}
                          </Flex>

                          {/* Delete */}
                          <Flex
                            flex="1"
                            justify="center"
                            cursor="pointer"
                            onClick={() => handleToggleNewPolicyPermission(perm.resource, 'delete')}
                            py={1}
                            borderRadius="4px"
                            _hover={{ bg: '#eff6ff' }}
                          >
                            {perm.delete ? (
                              <Flex
                                w="18px"
                                h="18px"
                                borderRadius="50%"
                                border="1.5px solid #16a34a"
                                bg="#dcfce7"
                                color="#16a34a"
                                align="center"
                                justify="center"
                              >
                                <Icon name="check" size={11} />
                              </Flex>
                            ) : (
                              <Flex
                                w="18px"
                                h="18px"
                                borderRadius="50%"
                                border="1.5px dashed #cbd5e1"
                                color="#94a3b8"
                                align="center"
                                justify="center"
                                _hover={{ borderColor: '#16a34a', color: '#16a34a', bg: '#f0fdf4' }}
                              >
                                <Icon name="plus" size={10} />
                              </Flex>
                            )}
                          </Flex>

                          {/* Set All / Full */}
                          <Flex flex="1" justify="center" align="center">
                            <Button
                              size="xs"
                              variant="plain"
                              h="22px"
                              px={2}
                              fontSize="10px"
                              fontWeight="600"
                              color={isFull ? '#16a34a' : '#64748b'}
                              bg={isFull ? '#dcfce7' : '#f1f5f9'}
                              borderRadius="4px"
                              _hover={{ bg: isFull ? '#bbf7d0' : '#e2e8f0' }}
                              onClick={() => handleToggleResourceAll(perm.resource)}
                            >
                              {isFull ? 'FULL' : 'SET'}
                            </Button>
                          </Flex>
                        </Flex>
                      );
                    })}
                  </Box>
                </Box>
              </VStack>
            </Box>

            {/* Footer */}
            <Flex
              justify="flex-end"
              gap={2}
              p={4}
              px={5}
              borderTop="1px solid"
              borderColor={themeColors.panel.divider}
              bg="#f8fafc"
            >
              <Button
                variant="outline"
                size="sm"
                h="34px"
                px={4}
                onClick={handleCloseCreateModal}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                h="34px"
                px={5}
                bg="#1a9c52"
                color="#ffffff"
                _hover={{ bg: '#15803d' }}
                fontWeight="600"
                loading={createPolicyMutation.isPending}
                disabled={createPolicyMutation.isPending}
                onClick={handleCreatePolicy}
              >
                Create policy
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* Delete Policy Confirmation Modal */}
      {isDeleteModalOpen && selectedPolicy && (
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
            w="min(460px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.3)"
            overflow="hidden"
          >
            {/* Header */}
            <Flex
              justify="space-between"
              align="center"
              p={5}
              pb={3}
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <HStack gap={2}>
                <Flex
                  w="28px"
                  h="28px"
                  borderRadius="50%"
                  bg="#fee2e2"
                  color="#dc2626"
                  align="center"
                  justify="center"
                >
                  <Icon name="trash" size={15} />
                </Flex>
                <Text fontSize="16px" fontWeight="700" color="#0f172a">
                  Delete management policy
                </Text>
              </HStack>
              <Button
                variant="plain"
                size="xs"
                p={1}
                cursor="pointer"
                disabled={deletePolicyMutation.isPending}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteError(null);
                }}
              >
                <Icon name="x" size={18} />
              </Button>
            </Flex>

            {/* Body */}
            <Box p={5}>
              <Text fontSize="13px" color="#334155" mb={2} lineHeight="1.5">
                Are you sure you want to delete <strong>"{selectedPolicy.name}"</strong>?
              </Text>
              <Text fontSize="12px" color="#64748b" mb={4} lineHeight="1.5">
                This action is permanent and will remove the policy from OpenWiFi. If this policy is currently assigned to any management roles, OWPROV will reject the request.
              </Text>

              {deleteError && (
                <Box
                  p={3}
                  mb={4}
                  borderRadius="6px"
                  bg="#fef2f2"
                  border="1px solid #fecaca"
                  color="#b91c1c"
                  fontSize="12px"
                  lineHeight="1.5"
                >
                  <HStack gap={1.5} align="flex-start">
                    <Box pt="2px">
                      <Icon name="x" size={14} color="#dc2626" />
                    </Box>
                    <Text>{deleteError}</Text>
                  </HStack>
                </Box>
              )}

              <HStack justify="flex-end" gap={3} pt={2}>
                <Button
                  variant="outline"
                  size="sm"
                  borderColor={themeColors.panel.border}
                  color={themeColors.text.primary}
                  disabled={deletePolicyMutation.isPending}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteError(null);
                  }}
                  cursor="pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  bg="#dc2626"
                  color="#ffffff"
                  _hover={{ bg: '#b91c1c' }}
                  disabled={deletePolicyMutation.isPending}
                  onClick={handleDeletePolicy}
                  cursor={deletePolicyMutation.isPending ? 'not-allowed' : 'pointer'}
                  fontWeight="600"
                >
                  <HStack gap={1.5}>
                    {deletePolicyMutation.isPending && <Spinner size="xs" color="#ffffff" />}
                    <Text>{deletePolicyMutation.isPending ? 'Deleting...' : 'Delete policy'}</Text>
                  </HStack>
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}
    </VStack>
  );
};

export default PoliciesTab;
