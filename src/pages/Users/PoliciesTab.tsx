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
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import { useUsersUiStore } from '@/stores/usersUiStore';
import { useAuthStore } from '@/stores/authStore';
import { useGetManagementPolicies, useUpdateManagementPolicy } from '@/api';
import type { ManagementPolicy, ManagementPolicyEntry } from '@/types/managementRole';

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
  type: 'Built-in' | 'Custom';
  preset?: string;
  status: string;
  createdBy: string;
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

const buildInitialPermissions = (
  granted: Record<string, { read?: boolean; create?: boolean; update?: boolean; delete?: boolean }>
): ResourcePermission[] => {
  return ALL_POLICY_RESOURCES.map((res) => {
    const perm = granted[res] || {};
    return {
      resource: res,
      read: !!perm.read,
      create: !!perm.create,
      update: !!perm.update,
      delete: !!perm.delete,
    };
  });
};

// Initial dummy policies matching the exact layout and data
const INITIAL_POLICIES: PolicyItem[] = [
  {
    id: 'pol-admin',
    name: 'Administrator',
    type: 'Built-in',
    preset: 'Administrator',
    status: 'Active',
    createdBy: 'System',
    usedByUsers: 6,
    scopedAssignmentsCount: 8,
    propertiesCount: 4,
    venuesCount: 8,
    modified: '1 Sep 2026',
    description: 'Full administrative access across all resources and operations.',
    permissions: buildInitialPermissions({
      Entity: { read: true, create: true, update: true, delete: true },
      Venue: { read: true, create: true, update: true, delete: true },
      Configuration: { read: true, create: true, update: true, delete: true },
      Inventory: { read: true, create: true, update: true, delete: true },
      Operator: { read: true, create: true, update: true, delete: true },
      Subscriber: { read: true, create: true, update: true, delete: true },
      Contact: { read: true, create: true, update: true, delete: true },
      Location: { read: true, create: true, update: true, delete: true },
    }),
    assignedUsers: [
      { name: 'Marcus Vance', initials: 'MV', avatarBg: '#1e3a8a', property: 'All Properties', venueScope: 'Global' },
      { name: 'Sarah Chen', initials: 'SC', avatarBg: '#059669', property: 'Sunset Heights', venueScope: 'All venues' },
      { name: 'Alex Rivera', initials: 'AR', avatarBg: '#7c3aed', property: 'Oakwood Housing', venueScope: 'Building B' },
    ],
  },
  {
    id: 'pol-net-op',
    name: 'Network Operator',
    type: 'Built-in',
    preset: 'Network Operator',
    status: 'Active',
    createdBy: 'System',
    usedByUsers: 9,
    scopedAssignmentsCount: 14,
    propertiesCount: 6,
    venuesCount: 8,
    modified: '2 Sep 2026',
    description: 'Monitor devices and manage network configuration.',
    permissions: buildInitialPermissions({
      Entity: { read: true },
      Venue: { read: true },
      Configuration: { read: true, create: true, update: true },
      Inventory: { read: true, update: true },
      Operator: { read: true },
      Subscriber: { read: true },
      Contact: { read: true },
      Location: { read: true },
    }),
    assignedUsers: [
      { name: 'Anita Sharma', initials: 'AS', avatarBg: '#1e3a8a', property: 'Sunrise Apartments', venueScope: 'All venues' },
      { name: 'David Okafor', initials: 'DO', avatarBg: '#581c87', property: 'Oakwood Housing', venueScope: 'Building A' },
      { name: 'Meera Joshi', initials: 'MJ', avatarBg: '#d97706', property: 'Lakeview Residences', venueScope: '2 venues' },
    ],
  },
  {
    id: 'pol-installer',
    name: 'Installer',
    type: 'Built-in',
    preset: 'Installer',
    status: 'Active',
    createdBy: 'System',
    usedByUsers: 4,
    scopedAssignmentsCount: 6,
    propertiesCount: 3,
    venuesCount: 6,
    modified: '28 Aug 2026',
    description: 'Device onboarding, inventory provisioning and local venue testing.',
    permissions: buildInitialPermissions({
      Venue: { read: true },
      Configuration: { read: true },
      Inventory: { read: true, update: true },
      Contact: { read: true },
      Location: { read: true },
    }),
    assignedUsers: [
      { name: 'Lucas Scott', initials: 'LS', avatarBg: '#0284c7', property: 'Sunrise Apartments', venueScope: 'Tower 1' },
      { name: 'Elena Rostova', initials: 'ER', avatarBg: '#d97706', property: 'Lakeview Residences', venueScope: 'North Wing' },
    ],
  },
  {
    id: 'pol-csr',
    name: 'CSR',
    type: 'Built-in',
    preset: 'CSR',
    status: 'Active',
    createdBy: 'System',
    usedByUsers: 3,
    scopedAssignmentsCount: 4,
    propertiesCount: 2,
    venuesCount: 4,
    modified: '28 Aug 2026',
    description: 'Customer service support, monitoring and end-user assistance.',
    permissions: buildInitialPermissions({
      Entity: { read: true },
      Venue: { read: true },
      Configuration: { read: true },
      Inventory: { read: true },
      Subscriber: { read: true, update: true },
      Contact: { read: true },
    }),
    assignedUsers: [
      { name: 'Priya Patel', initials: 'PP', avatarBg: '#db2777', property: 'Oakwood Housing', venueScope: 'All venues' },
    ],
  },
  {
    id: 'pol-readonly',
    name: 'Read Only',
    type: 'Built-in',
    preset: 'Read Only',
    status: 'Active',
    createdBy: 'System',
    usedByUsers: 5,
    scopedAssignmentsCount: 7,
    propertiesCount: 5,
    venuesCount: 7,
    modified: '28 Aug 2026',
    description: 'Audit and reporting view-only access across properties.',
    permissions: buildInitialPermissions({
      Entity: { read: true },
      Venue: { read: true },
      Configuration: { read: true },
      Inventory: { read: true },
      Operator: { read: true },
      Subscriber: { read: true },
      Contact: { read: true },
      Location: { read: true },
    }),
    assignedUsers: [
      { name: 'Tom Bradley', initials: 'TB', avatarBg: '#475569', property: 'Grand Avenue Complex', venueScope: 'All venues' },
    ],
  },
  {
    id: 'pol-firmware',
    name: 'Firmware Operator',
    type: 'Custom',
    preset: 'Network Operator',
    status: 'Active',
    createdBy: 'Marcus Vance',
    usedByUsers: 2,
    scopedAssignmentsCount: 3,
    propertiesCount: 2,
    venuesCount: 3,
    modified: '25 Aug 2026',
    description: 'Dedicated firmware upgrade and scheduled rollout management.',
    permissions: buildInitialPermissions({
      Venue: { read: true },
      Configuration: { read: true },
      Inventory: { read: true, update: true },
    }),
    assignedUsers: [
      { name: 'David Okafor', initials: 'DO', avatarBg: '#581c87', property: 'Oakwood Housing', venueScope: 'Building A' },
    ],
  },
  {
    id: 'pol-prop-mgr',
    name: 'Property Manager',
    type: 'Custom',
    preset: 'Network Operator',
    status: 'Active',
    createdBy: 'Sarah Chen',
    usedByUsers: 1,
    scopedAssignmentsCount: 2,
    propertiesCount: 1,
    venuesCount: 2,
    modified: '20 Aug 2026',
    description: 'Property and venue configuration boundary management.',
    permissions: buildInitialPermissions({
      Entity: { read: true, update: true },
      Venue: { read: true, create: true, update: true },
      Configuration: { read: true },
      Inventory: { read: true },
    }),
    assignedUsers: [
      { name: 'Anita Sharma', initials: 'AS', avatarBg: '#1e3a8a', property: 'Sunrise Apartments', venueScope: 'All venues' },
    ],
  },
  {
    id: 'pol-auditor',
    name: 'Auditor',
    type: 'Custom',
    preset: 'Read Only',
    status: 'Active',
    createdBy: 'System',
    usedByUsers: 0,
    scopedAssignmentsCount: 0,
    propertiesCount: 0,
    venuesCount: 0,
    modified: '15 Aug 2026',
    description: 'Compliance inspection and security policy review.',
    permissions: buildInitialPermissions({
      Entity: { read: true },
      Venue: { read: true },
      Configuration: { read: true },
      Inventory: { read: true },
      Operator: { read: true },
      Subscriber: { read: true },
      Contact: { read: true },
      Location: { read: true },
    }),
    assignedUsers: [],
  },
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
  const mockMatch = INITIAL_POLICIES.find(
    (m) =>
      m.id === p.id ||
      m.name.trim().toLowerCase() === p.name.trim().toLowerCase()
  );

  const formattedDate = formatPolicyDate(p.modified || p.created);

  // Always parse all 8 resources from entries for every policy
  const perms = parseEntriesToPermissions(p.entries);

  if (mockMatch) {
    return {
      ...mockMatch,
      id: p.id,
      name: p.name,
      description: p.description || mockMatch.description,
      type: p.entity ? 'Custom' : mockMatch.type,
      modified: formattedDate !== '—' ? formattedDate : mockMatch.modified,
      permissions: perms,
    };
  }

  return {
    id: p.id,
    name: p.name,
    type: p.entity ? 'Custom' : 'Built-in',
    preset: p.name,
    status: 'Active',
    createdBy: p.entity ? 'Custom' : 'System',
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
  const updatePolicyMutation = useUpdateManagementPolicy();
  const [policies, setPolicies] = useState<PolicyItem[]>(INITIAL_POLICIES);

  // Edit policy state (only root can toggle)
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPermissions, setEditPermissions] = useState<ResourcePermission[]>([]);

  // Sync real policies from API
  useEffect(() => {
    if (apiPolicies && apiPolicies.length > 0) {
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
  const [newPolicyPreset, setNewPolicyPreset] = useState('Network Operator');

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
      INITIAL_POLICIES[0]
    );
  }, [policies, selectedPolicyId, filteredPolicies]);

  // Sync edit state with selectedPolicy
  useEffect(() => {
    if (selectedPolicy) {
      setEditName(selectedPolicy.name);
      setEditDescription(selectedPolicy.description || '');
      setEditPermissions(selectedPolicy.permissions.map((p) => ({ ...p })));
      setIsEditing(false);
    }
  }, [selectedPolicy.id]);

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
    if (!isRoot) {
      alert('Only root administrators can edit management policies.');
      return;
    }
    if (!editName.trim()) {
      alert('Policy name cannot be empty.');
      return;
    }

    const accessGroups: Record<string, string[]> = {};
    editPermissions.forEach((perm) => {
      const access: string[] = [];
      if (perm.read) access.push('READ');
      if (perm.create) access.push('CREATE');
      if (perm.update) access.push('UPDATE');
      if (perm.delete) access.push('DELETE');

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
      alert(`Policy "${editName}" changes saved successfully.`);
    } catch (err: any) {
      console.error('Failed to update policy:', err);
      alert('Failed to update policy. Check permissions or network.');
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
            <Box flex="1.8">Policy</Box>
            <Box flex="1">Type</Box>
            <Box flex="1">Used By</Box>
            <Box flex="1.2">Modified</Box>
            <Box w="24px" />
          </Flex>

          {/* Table Rows */}
          {paginatedPolicies.map((p) => {
            const isSelected = p.id === selectedPolicy.id;
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
                <HStack flex="1.8" gap={2.5} minW={0} pr={2}>
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

                {/* Type */}
                <Box flex="1">
                  <Text fontSize="12px" color="#64748b">
                    {p.type}
                  </Text>
                </Box>

                {/* Used By */}
                <Box flex="1">
                  <Text fontSize="12px" color="#64748b" />
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
        >
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
                    colorScheme="blue"
                    variant="subtle"
                    fontSize="11px"
                    px={2}
                    borderRadius="4px"
                  >
                    {selectedPolicy.type}
                  </Badge>
                </HStack>
                <Text fontSize="12px" color="#64748b" mt={0.5}>
                  {selectedPolicy.description}
                </Text>
              </Box>
            </HStack>

            {/* Edit policy button - Only visible for Root */}
            {isRoot && (
              !isEditing ? (
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
              ) : (
                <Badge colorScheme="purple" variant="subtle" fontSize="11px" px={2.5} py={1} borderRadius="4px">
                  Editing Mode
                </Badge>
              )
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
                  Policy preset
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
                  {selectedPolicy.type === 'Built-in'
                    ? 'Built-in presets are protected from deletion.'
                    : 'Custom policy assigned to scoped entity/venue assignments.'}
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
                        Type
                      </Text>
                      <Text color="#0f172a" fontWeight="500">
                        {selectedPolicy.type}
                      </Text>
                    </Flex>

                    <Flex align="center">
                      <Text w="140px" color="#64748b" flexShrink={0}>
                        Preset
                      </Text>
                      <Text color="#0f172a" fontWeight="500">
                        {selectedPolicy.preset || selectedPolicy.name}
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

                    <Flex align="center">
                      <Text w="140px" color="#64748b" flexShrink={0}>
                        Created by
                      </Text>
                      <Text color="#0f172a">
                        {selectedPolicy.createdBy || 'System'}
                      </Text>
                    </Flex>

                    <Flex align="flex-start">
                      <Text w="140px" color="#64748b" flexShrink={0}>
                        Description
                      </Text>
                      <Text color="#0f172a">
                        {selectedPolicy.description}
                      </Text>
                    </Flex>

                    <HStack gap={1.5} pt={2} color="#64748b" fontSize="11px" align="center">
                      <Icon name="lock" size={13} color="#64748b" />
                      <Text color="#64748b">
                        {selectedPolicy.type === 'Built-in'
                          ? 'Built-in policies cannot be deleted.'
                          : 'Custom policies can be edited and deleted.'}
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
            w="min(520px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.3)"
            p={6}
          >
            <Flex justify="space-between" align="center" pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
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
                onClick={onCloseCreatePolicy}
              >
                <Icon name="x" size={18} />
              </Button>
            </Flex>

            <VStack gap={3.5} align="stretch" mt={4}>
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

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#64748b" mb={1}>
                  Clone from preset
                </Text>
                <SelectDropdown
                  value={newPolicyPreset}
                  onChange={(val) => setNewPolicyPreset(String(val))}
                  options={['Network Operator', 'Installer', 'CSR', 'Read Only']}
                  w="100%"
                  h="36px"
                />
              </Box>
            </VStack>

            <Flex justify="flex-end" gap={2} mt={6} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
              <Button
                variant="outline"
                size="sm"
                h="34px"
                px={4}
                onClick={onCloseCreatePolicy}
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
                onClick={() => {
                  if (!newPolicyName.trim()) return;
                  const newPol: PolicyItem = {
                    id: `pol-${Date.now()}`,
                    name: newPolicyName.trim(),
                    type: 'Custom',
                    preset: newPolicyPreset,
                    status: 'Active',
                    createdBy: 'Current User',
                    usedByUsers: 0,
                    scopedAssignmentsCount: 0,
                    propertiesCount: 0,
                    venuesCount: 0,
                    modified: 'Just now',
                    description: newPolicyDesc.trim() || 'Custom operator policy.',
                    permissions: parseEntriesToPermissions([]),
                    assignedUsers: [],
                  };
                  setPolicies((prev) => [newPol, ...prev]);
                  setSelectedPolicyId(newPol.id);
                  setNewPolicyName('');
                  setNewPolicyDesc('');
                  if (onCloseCreatePolicy) onCloseCreatePolicy();
                }}
              >
                Create policy
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </VStack>
  );
};

export default PoliciesTab;
