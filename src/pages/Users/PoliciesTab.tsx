import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  useGetPolicyOverview,
  queryClient,
  axiosMdu,
} from '@/api';
import type { ManagementPolicy, ManagementPolicyEntry } from '@/types/managementRole';
import { toaster } from '@/components/ui/toaster';

export interface ResourcePermission {
  resource: string;
  label: string;
  actions: string[];
  read?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}

export interface PolicyAssignedUser {
  id?: string;
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
  deviceCommandActions?: string[];
  assignedUsers: PolicyAssignedUser[];
  rawEntries?: ManagementPolicyEntry[];
}

export const RESOURCES = [
  'entity',
  'venue',
  'configuration',
  'inventory',
  'operator',
  'subscriber',
  'contact',
  'location',
  'deviceCommand',
];

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

export const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'FULL'];

export const DEVICE_COMMAND_ACTIONS = [
  'REBOOT',
  'CONFIGURE',
  'BLINK',
  'WIFI_SCAN',
  'TELEMETRY',
  'UPGRADE',
  'FACTORY_RESET',
  'TRACE',
  'RTTY',
  'SCRIPT',
  'RE_ENROLL',
  'EVENTQUEUE',
];

export const RESOURCE_DISPLAY_MAP: Record<string, string> = {
  entity: 'Entity',
  venue: 'Venue',
  configuration: 'Configuration',
  inventory: 'Inventory',
  operator: 'Operator',
  subscriber: 'Subscriber',
  contact: 'Contact',
  location: 'Location',
  deviceCommand: 'Device Commands',
};

export const getValidActionsForResource = (resource: string): string[] =>
  resource === 'deviceCommand' ? DEVICE_COMMAND_ACTIONS : ACTIONS;

export const filterValidActionsForResource = (resource: string, actions: string[] = []): string[] => {
  const allowed = getValidActionsForResource(resource);
  const filtered = Array.from(new Set(actions.filter((action) => allowed.includes(action))));
  return resource !== 'deviceCommand' && filtered.includes('FULL') ? ['FULL'] : filtered;
};

export const toggleActionForResource = (
  resource: string,
  action: string,
  currentActions: string[] = []
): string[] => {
  if (!getValidActionsForResource(resource).includes(action)) return currentActions;
  if (action === 'FULL') {
    return currentActions.includes('FULL') ? [] : ['FULL'];
  }

  const allowed = getValidActionsForResource(resource);
  const subActions = allowed.filter((a) => a !== 'FULL');
  let updated: string[];

  if (currentActions.includes('FULL')) {
    updated = subActions.filter((a) => a !== action);
  } else if (currentActions.includes(action)) {
    updated = currentActions.filter((a) => a !== action);
  } else {
    updated = [...currentActions, action];
    const allSelected = subActions.every((a) => updated.includes(a));
    if (resource !== 'deviceCommand' && allSelected) {
      updated = ['FULL'];
    }
  }

  return updated;
};

// Legacy toggle helper kept for backwards compatibility
export const toggleDeviceCommandAction = (current: string[] = [], action: string): string[] =>
  toggleActionForResource('deviceCommand', action, current);

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


export const MANAGED_RESOURCE_KEYS = new Set([
  'entity',
  'property',
  'venue',
  'configuration',
  'inventory',
  'device',
  'operator',
  'subscriber',
  'contact',
  'location',
  'devicecommand',
]);

export const parseEntriesToPermissions = (entries?: ManagementPolicyEntry[]): ResourcePermission[] => {
  const permMap = new Map<string, string[]>();

  for (const res of RESOURCES) {
    permMap.set(res, []);
  }

  if (entries && Array.isArray(entries)) {
    for (const entry of entries) {
      if (!entry) continue;

      // Only global, unscoped entries are represented in the UI matrix.
      const hasCustomScoping = Boolean(
        (entry as any).users?.length || (entry as any).policy
      );
      if (hasCustomScoping) {
        continue;
      }

      const accessList = (entry.access || []).map((a) => a.trim().toUpperCase());
      const isFull = accessList.includes('FULL') || accessList.includes('*');

      for (const rawRes of entry.resources || []) {
        const lower = rawRes.trim().toLowerCase();
        const isWildcard = lower === '*';

        const targetKeys = isWildcard
          ? RESOURCES
          : [
              lower === 'property'
                ? 'entity'
                : lower === 'device'
                ? 'inventory'
                : lower === 'devicecommand'
                ? 'deviceCommand'
                : lower,
            ];

        for (const key of targetKeys) {
          if (!permMap.has(key)) continue;

          const allowed = getValidActionsForResource(key);
          const current = permMap.get(key) || [];

          if (isFull && key !== 'deviceCommand') {
            permMap.set(key, ['FULL']);
            continue;
          }

          if (current.includes('FULL')) {
            continue;
          }

          const valid = accessList.filter((a) => allowed.includes(a));

          if (valid.length > 0) {
            const combined = Array.from(new Set([...current, ...valid]));
            const subActions = allowed.filter((a) => a !== 'FULL');
            if (key !== 'deviceCommand' && subActions.every((a) => combined.includes(a))) {
              permMap.set(key, ['FULL']);
            } else {
              permMap.set(key, combined);
            }
          }
        }
      }
    }
  }

  return RESOURCES.map((res) => {
    const actions = permMap.get(res) || [];
    const isFull = actions.includes('FULL');
    return {
      resource: res,
      label: RESOURCE_DISPLAY_MAP[res] || res,
      actions,
      read: isFull || actions.includes('READ'),
      create: isFull || actions.includes('CREATE'),
      update: isFull || actions.includes('UPDATE'),
      delete: isFull || actions.includes('DELETE'),
    };
  });
};

export const parseDeviceCommandActions = (entries?: ManagementPolicyEntry[]): string[] => {
  const perms = parseEntriesToPermissions(entries);
  const cmd = perms.find((p) => p.resource === 'deviceCommand');
  return cmd?.actions || [];
};

export const mergePolicyEntries = (
  originalEntries: ManagementPolicyEntry[] = [],
  editedPermissions: ResourcePermission[],
  editedDeviceCommandActions?: string[]
): ManagementPolicyEntry[] => {
  // 1. Extract and preserve any entries or resources not managed by the UI
  const preservedUnmanagedEntries: ManagementPolicyEntry[] = [];

  for (const entry of originalEntries) {
    if (!entry || !Array.isArray(entry.resources)) continue;

    const hasCustomScoping = Boolean(
      (entry as any).users?.length || (entry as any).policy
    );

    const unmanagedResources = entry.resources.filter(
      (r) => !MANAGED_RESOURCE_KEYS.has(r.trim().toLowerCase())
    );

    if (hasCustomScoping) {
      preservedUnmanagedEntries.push({
        ...entry,
        resources: [...entry.resources],
        access: [...(entry.access || [])],
      });
    } else if (unmanagedResources.length > 0) {
      preservedUnmanagedEntries.push({
        ...entry,
        resources: unmanagedResources,
        access: [...(entry.access || [])],
      });
    }
  }

  // 2. Build access mapping from editedPermissions
  const accessGroups: Record<string, string[]> = {};

  editedPermissions.forEach((perm) => {
    let actions: string[] = [];
    if (perm.actions && perm.actions.length > 0) {
      actions = perm.actions.includes('FULL') ? ['FULL'] : [...perm.actions];
    } else {
      if (perm.read && perm.create && perm.update && perm.delete) {
        actions = ['FULL'];
      } else {
        if (perm.read) actions.push('READ');
        if (perm.create) actions.push('CREATE');
        if (perm.update) actions.push('UPDATE');
        if (perm.delete) actions.push('DELETE');
      }
    }

    if (perm.resource === 'deviceCommand' && editedDeviceCommandActions !== undefined) {
      actions = [...editedDeviceCommandActions];
    }

    actions = filterValidActionsForResource(perm.resource, actions);
    if (actions.length > 0) {
      const key = [...actions].sort().join(',');
      if (!accessGroups[key]) {
        accessGroups[key] = [];
      }
      accessGroups[key].push(perm.resource);
    }
  });

  // If editedDeviceCommandActions passed separately and not in editedPermissions
  if (
    editedDeviceCommandActions &&
    editedDeviceCommandActions.length > 0 &&
    !editedPermissions.some((p) => p.resource === 'deviceCommand')
  ) {
    const cleanActions = filterValidActionsForResource('deviceCommand', editedDeviceCommandActions);
    if (cleanActions.length > 0) {
      const key = [...cleanActions].sort().join(',');
      if (!accessGroups[key]) {
        accessGroups[key] = [];
      }
      accessGroups[key].push('deviceCommand');
    }
  }

  const managedEntries: ManagementPolicyEntry[] = Object.entries(accessGroups).map(([key, resources]) => ({
    resources,
    access: key.split(','),
  }));

  return [...preservedUnmanagedEntries, ...managedEntries];
};

const mapApiPolicyToItem = (p: ManagementPolicy): PolicyItem => {
  const formattedDate = formatPolicyDate(p.modified || p.created);
  const perms = parseEntriesToPermissions(p.entries);
  const commandActions = perms.find((perm) => perm.resource === 'deviceCommand')?.actions || [];

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
    deviceCommandActions: commandActions,
    assignedUsers: [],
    rawEntries: p.entries ? JSON.parse(JSON.stringify(p.entries)) : [],
  };
};

interface ResourcePermissionInputProps {
  resource: string;
  selectedActions: string[];
  onToggle: (resource: string, action: string) => void;
  isDisabled?: boolean;
}

export const ResourcePermissionInput: React.FC<ResourcePermissionInputProps> = ({
  resource,
  selectedActions,
  onToggle,
  isDisabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const availableActions = getValidActionsForResource(resource);

  const updateDropdownDirection = () => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const dropdownHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUpwards(spaceBelow < dropdownHeight + 20 && spaceAbove > spaceBelow);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      updateDropdownDirection();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updateDropdownDirection);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updateDropdownDirection);
    };
  }, [isOpen]);

  const handleToggleDropdown = () => {
    if (isDisabled) return;
    if (!isOpen) {
      updateDropdownDirection();
    }
    setIsOpen((prev) => !prev);
  };

  const removeAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    onToggle(resource, action);
  };

  const isFull = selectedActions.includes('FULL');

  return (
    <Box position="relative" ref={dropdownRef} w="100%" zIndex={isOpen ? 3000 : 'auto'}>
      <Flex
        align="center"
        justify="space-between"
        minH="36px"
        p={1.5}
        px={2.5}
        bg={isDisabled ? '#f8fafc' : '#ffffff'}
        border="1px solid"
        borderColor={isOpen ? themeColors.brand.accent : themeColors.panel.border}
        borderRadius="4px"
        cursor={isDisabled ? 'default' : 'pointer'}
        opacity={isDisabled ? 0.9 : 1}
        boxShadow={isOpen ? `0 0 0 1px ${themeColors.brand.accent}` : undefined}
        onClick={handleToggleDropdown}
        _hover={!isDisabled ? { borderColor: themeColors.brand.accent } : undefined}
        transition="border-color 0.15s ease, box-shadow 0.15s ease"
      >
        <Flex wrap="wrap" gap={1.5} align="center" flex="1" minW={0} pr={1}>
          {selectedActions.length === 0 ? (
            <Text fontSize="12px" color="#94a3b8" fontStyle="italic" px={1}>
              No permissions selected (NOACCESS)
            </Text>
          ) : isFull ? (
            <HStack
              gap={1}
              bg="#f3e8ff"
              color="#7e22ce"
              border="1px solid #e9d5ff"
              px="8px"
              py="2px"
              borderRadius="12px"
              fontSize="11px"
              fontWeight="700"
            >
              <Text>FULL</Text>
              {!isDisabled && (
                <Box
                  as="button"
                  display="inline-flex"
                  alignItems="center"
                  cursor="pointer"
                  onClick={(e: React.MouseEvent) => removeAction('FULL', e)}
                >
                  <Icon name="x" size={10} />
                </Box>
              )}
            </HStack>
          ) : (
            selectedActions.map((action) => {
              const isDelete = action === 'DELETE';
              return (
                <HStack
                  key={action}
                  gap={1}
                  bg={isDelete ? '#fee2e2' : '#eff6ff'}
                  color={isDelete ? '#b91c1c' : '#1e40af'}
                  border={`1px solid ${isDelete ? '#fecaca' : '#bfdbfe'}`}
                  px="8px"
                  py="2px"
                  borderRadius="12px"
                  fontSize="11px"
                  fontWeight="600"
                >
                  <Text>{action}</Text>
                  {!isDisabled && (
                    <Box
                      as="button"
                      display="inline-flex"
                      alignItems="center"
                      cursor="pointer"
                      onClick={(e: React.MouseEvent) => removeAction(action, e)}
                    >
                      <Icon name="x" size={10} />
                    </Box>
                  )}
                </HStack>
              );
            })
          )}
        </Flex>

        {!isDisabled && (
          <Box
            transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
            transition="transform 0.2s ease"
            color="#94a3b8"
            flexShrink={0}
          >
            <Icon name="chevronDown" size={13} />
          </Box>
        )}
      </Flex>

      {/* Dropdown Menu */}
      {isOpen && !isDisabled && (
        <Box
          position="absolute"
          top={openUpwards ? 'auto' : 'calc(100% + 4px)'}
          bottom={openUpwards ? 'calc(100% + 4px)' : 'auto'}
          left={0}
          right={0}
          minW="200px"
          maxW="320px"
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          boxShadow="0 10px 25px rgba(0, 0, 0, 0.16)"
          zIndex={9999}
          py={1}
          maxH="220px"
          overflowY="auto"
        >
          {availableActions.map((action) => {
            const isSelected = isFull ? action === 'FULL' : selectedActions.includes(action);
            return (
              <Flex
                key={action}
                align="center"
                justify="space-between"
                px={3}
                py={1.5}
                fontSize="12px"
                cursor="pointer"
                _hover={{ bg: '#f8fafc' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(resource, action);
                }}
              >
                <Text
                  fontWeight={action === 'FULL' ? '700' : '500'}
                  color={action === 'FULL' ? '#7e22ce' : '#334155'}
                >
                  {action}
                </Text>
                {isSelected && (
                  <Box color="#16a34a">
                    <Icon name="check" size={13} />
                  </Box>
                )}
              </Flex>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

interface PoliciesTabProps {
  isCreatePolicyOpen?: boolean;
  onCloseCreatePolicy?: () => void;
  onNavigateToUsers?: (userId?: string) => void;
}

// Debounce policy ID changes when switching rapidly across un-cached policies
function useDebouncedPolicyId(policyId?: string, delayMs = 250): string | undefined {
  const [debouncedId, setDebouncedId] = useState<string | undefined>(policyId);

  useEffect(() => {
    if (!policyId) {
      setDebouncedId(undefined);
      return;
    }

    // If data is already cached in React Query, update immediately with zero debounce delay
    const isCached = Boolean(queryClient.getQueryData(['policyOverview', policyId]));
    if (isCached) {
      setDebouncedId(policyId);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedId(policyId);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [policyId, delayMs]);

  return debouncedId;
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
  const [editDeviceCommandActions, setEditDeviceCommandActions] = useState<string[]>([]);

  // Sync real policies from API
  useEffect(() => {
    if (apiPolicies) {
      setPolicies(apiPolicies.map(mapApiPolicyToItem));
    }
  }, [apiPolicies]);
  const {
    setMainTab,
    setSelectedUserId,
    setUserSubTab,
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
    RESOURCES.map((res) => ({
      resource: res,
      label: RESOURCE_DISPLAY_MAP[res] || res,
      actions: [],
      read: false,
      create: false,
      update: false,
      delete: false,
    }))
  );
  const [newDeviceCommandActions, setNewDeviceCommandActions] = useState<string[]>([]);

  const handleApplyPreset = (presetType: 'full' | 'read' | 'clear') => {
    if (presetType === 'full') {
      setNewPolicyPreset('full');
      setNewPolicyPermissions(
        RESOURCES.map((res) => ({
          resource: res,
          label: RESOURCE_DISPLAY_MAP[res] || res,
          actions: res === 'deviceCommand' ? [] : ['FULL'],
          read: res !== 'deviceCommand',
          create: res !== 'deviceCommand',
          update: res !== 'deviceCommand',
          delete: res !== 'deviceCommand',
        }))
      );
      setNewDeviceCommandActions([]);
    } else if (presetType === 'read') {
      setNewPolicyPreset('read');
      setNewPolicyPermissions(
        RESOURCES.map((res) => ({
          resource: res,
          label: RESOURCE_DISPLAY_MAP[res] || res,
          actions: res === 'deviceCommand' ? [] : ['READ'],
          read: res !== 'deviceCommand',
          create: false,
          update: false,
          delete: false,
        }))
      );
      setNewDeviceCommandActions([]);
    } else {
      setNewPolicyPreset('custom');
      setNewPolicyPermissions(
        RESOURCES.map((res) => ({
          resource: res,
          label: RESOURCE_DISPLAY_MAP[res] || res,
          actions: [],
          read: false,
          create: false,
          update: false,
          delete: false,
        }))
      );
      setNewDeviceCommandActions([]);
    }
  };

  const handleToggleNewPolicyAction = (resource: string, action: string) => {
    setNewPolicyPreset('custom');
    setNewPolicyPermissions((prev) =>
      prev.map((p) => {
        if (p.resource === resource) {
          const updatedActions = toggleActionForResource(resource, action, p.actions || []);
          const isFull = updatedActions.includes('FULL');
          return {
            ...p,
            actions: updatedActions,
            read: isFull || updatedActions.includes('READ'),
            create: isFull || updatedActions.includes('CREATE'),
            update: isFull || updatedActions.includes('UPDATE'),
            delete: isFull || updatedActions.includes('DELETE'),
          };
        }
        return p;
      })
    );
    if (resource === 'deviceCommand') {
      setNewDeviceCommandActions((prev) => toggleActionForResource('deviceCommand', action, prev));
    }
  };

  const handleCloseCreateModal = () => {
    setNewPolicyName('');
    setNewPolicyDesc('');
    setNewPolicyPreset('custom');
    setNewPolicyPermissions(
      RESOURCES.map((res) => ({
        resource: res,
        label: RESOURCE_DISPLAY_MAP[res] || res,
        actions: [],
        read: false,
        create: false,
        update: false,
        delete: false,
      }))
    );
    setNewDeviceCommandActions([]);
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

  // Active state flag: only query overview when the Overview sub-tab is active or permissions are being edited
  const isOverviewActive = activeDetailTab === 'overview' || isEditing;

  // Debounce policy ID when switching rapidly between un-cached policies
  const debouncedPolicyId = useDebouncedPolicyId(selectedPolicy?.id, 250);

  // Fetch policy overview from mango-mdu-service
  const {
    data: policyOverview,
    isLoading: isOverviewQueryLoading,
    isError: isOverviewError,
    isFetching: isOverviewFetching,
    refetch: refetchOverview,
  } = useGetPolicyOverview(debouncedPolicyId, isOverviewActive);

  // Check if MDU service is available in the cluster or configured via environment
  const isMduConfigured = Boolean(axiosMdu.defaults.baseURL);

  // Active loading state taking debounce settling into account
  const isOverviewLoading =
    isOverviewActive &&
    isMduConfigured &&
    Boolean(selectedPolicy?.id) &&
    (isOverviewQueryLoading || debouncedPolicyId !== selectedPolicy?.id);

  // Check if current cached policy overview matches the selected policy
  const hasValidPolicyData = Boolean(
    policyOverview && policyOverview.policy?.id === selectedPolicy?.id
  );

  const overviewStats = useMemo(() => {
    // If we have valid policy data (either live or cached)
    if (hasValidPolicyData && policyOverview) {
      const assignedUsers: PolicyAssignedUser[] = (policyOverview.usersWithPolicy || []).map((u) => {
        const name = u.name || u.email || 'Unknown User';
        const initials =
          name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';

        const propertyNames =
          Array.from(new Set((u.scopes || []).map((s) => s.entityName).filter(Boolean))).join(', ') || '—';
        const venueNames =
          Array.from(new Set((u.scopes || []).map((s) => s.venueName).filter(Boolean))).join(', ') || 'All venues';

        return {
          id: u.id,
          name,
          initials,
          avatarBg: '#2563eb',
          property: propertyNames,
          venueScope: venueNames,
        };
      });

      return {
        usedByUsers: policyOverview.totalUsers ?? 0,
        scopedAssignmentsCount: policyOverview.totalScopedAssignments ?? 0,
        propertiesCount: policyOverview.totalProperties ?? 0,
        venuesCount: policyOverview.totalVenues ?? 0,
        assignedUsers,
      };
    }

    // Return empty fallback stats when metrics are unavailable or loading
    return {
      usedByUsers: 0,
      scopedAssignmentsCount: 0,
      propertiesCount: 0,
      venuesCount: 0,
      assignedUsers: [],
    };
  }, [hasValidPolicyData, policyOverview]);

  // Sync edit state with selectedPolicy
  useEffect(() => {
    if (selectedPolicy) {
      setEditName(selectedPolicy.name);
      setEditDescription(selectedPolicy.description || '');
      setEditPermissions(selectedPolicy.permissions.map((p) => ({ ...p })));
      setEditDeviceCommandActions([...(selectedPolicy.deviceCommandActions || [])]);
      setIsEditing(false);
    } else {
      setEditName('');
      setEditDescription('');
      setEditPermissions([]);
      setEditDeviceCommandActions([]);
      setIsEditing(false);
    }
  }, [selectedPolicy?.id]);

  const handleTogglePermissionAction = (resource: string, action: string) => {
    if (!isEditing || !isRoot) return;
    setEditPermissions((prev) =>
      prev.map((p) => {
        if (p.resource === resource) {
          const updatedActions = toggleActionForResource(resource, action, p.actions || []);
          const isFull = updatedActions.includes('FULL');
          return {
            ...p,
            actions: updatedActions,
            read: isFull || updatedActions.includes('READ'),
            create: isFull || updatedActions.includes('CREATE'),
            update: isFull || updatedActions.includes('UPDATE'),
            delete: isFull || updatedActions.includes('DELETE'),
          };
        }
        return p;
      })
    );
    if (resource === 'deviceCommand') {
      setEditDeviceCommandActions((prev) => toggleActionForResource('deviceCommand', action, prev));
    }
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

    const mergedEntries = mergePolicyEntries(
      selectedPolicy.rawEntries || [],
      editPermissions,
      editDeviceCommandActions
    );

    try {
      const updatedPolicy = await updatePolicyMutation.mutateAsync({
        id: selectedPolicy.id,
        name: editName.trim(),
        description: editDescription.trim(),
        entries: mergedEntries,
      });

      setPolicies((prev) =>
        prev.map((p) => {
          if (p.id === selectedPolicy.id) {
            return {
              ...p,
              name: editName.trim(),
              description: editDescription.trim(),
              permissions: editPermissions.map((ep) => ({ ...ep })),
              deviceCommandActions: [...editDeviceCommandActions],
              rawEntries: updatedPolicy?.entries || mergedEntries,
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

    let entries: ManagementPolicyEntry[] = [];

    if (newPolicyPreset === 'full') {
      entries = [
        {
          resources: RESOURCES.filter((r) => r !== 'deviceCommand'),
          access: ['FULL'],
        },
      ];
    } else if (newPolicyPreset === 'read') {
      entries = [
        {
          resources: RESOURCES.filter((r) => r !== 'deviceCommand'),
          access: ['READ'],
        },
      ];
    } else {
      entries = mergePolicyEntries([], newPolicyPermissions, newDeviceCommandActions);
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
                        setEditDeviceCommandActions([...(selectedPolicy.deviceCommandActions || [])]);
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
              {/* Resource permissions Table */}
              <Box>
                <Flex justify="space-between" align="center" mb={2.5}>
                  <Text fontSize="13px" fontWeight="700" color="#0f172a">
                    Resource permissions
                  </Text>
                  {isEditing && (
                    <Text fontSize="11px" color="#2563eb" fontWeight="500">
                      Select access permissions from dropdown
                    </Text>
                  )}
                </Flex>

                <Box
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  borderRadius="6px"
                >
                  {/* Table Header */}
                  <Flex
                    bg="#f8fafc"
                    py={2}
                    px={3}
                    borderBottom="1px solid"
                    borderColor={themeColors.panel.border}
                    borderTopRadius="5px"
                    fontSize="11px"
                    fontWeight="700"
                    color="#64748b"
                    align="center"
                  >
                    <Box w="160px" flexShrink={0}>Resource</Box>
                    <Box flex="1">Access Level Permissions</Box>
                  </Flex>

                  {/* Rows */}
                  {(isEditing ? editPermissions : selectedPolicy.permissions).map((perm) => (
                    <Flex
                      key={perm.resource}
                      py={2}
                      px={3}
                      borderBottom="1px solid"
                      borderColor={themeColors.panel.divider}
                      _last={{ borderBottom: 'none', borderBottomRadius: '5px' }}
                      align="center"
                      fontSize="12px"
                      gap={3}
                    >
                      <Box w="160px" flexShrink={0} fontWeight="600" color="#0f172a">
                        {perm.label || RESOURCE_DISPLAY_MAP[perm.resource] || perm.resource}
                      </Box>
                      <Box flex="1" minW={0}>
                        <ResourcePermissionInput
                          resource={perm.resource}
                          selectedActions={perm.actions || []}
                          onToggle={handleTogglePermissionAction}
                          isDisabled={!isEditing || !isRoot}
                        />
                      </Box>
                    </Flex>
                  ))}
                </Box>
              </Box>

              {/* Policy impact callout box - visible during editing or if metrics already loaded */}
              {(isEditing || hasValidPolicyData) && (
                <Flex
                  p={3}
                  borderRadius="6px"
                  bg={
                    !isMduConfigured
                      ? '#f8fafc'
                      : isOverviewError
                        ? '#fffbeb'
                        : '#eff6ff'
                  }
                  border="1px solid"
                  borderColor={
                    !isMduConfigured
                      ? '#e2e8f0'
                      : isOverviewError
                        ? '#fef3c7'
                        : '#bfdbfe'
                  }
                  gap={2.5}
                  align="flex-start"
                >
                  <Box
                    color={
                      !isMduConfigured
                        ? '#64748b'
                        : isOverviewError
                          ? '#d97706'
                          : '#0869ff'
                    }
                    mt="1px"
                  >
                    <Icon name="info" size={16} />
                  </Box>
                  <Box flex="1">
                    <Text
                      fontSize="12px"
                      fontWeight="700"
                      color={
                        !isMduConfigured
                          ? '#475569'
                          : isOverviewError
                            ? '#92400e'
                            : '#1e40af'
                      }
                    >
                      Policy impact
                    </Text>
                    {!isMduConfigured ? (
                      <Text fontSize="11px" color="#64748b" mt={0.5}>
                        Policy impact metrics are unavailable because MDU service is not deployed in this cluster.
                      </Text>
                    ) : isOverviewLoading && !hasValidPolicyData ? (
                      <HStack gap={1.5} mt={0.5} align="center">
                        <Spinner size="xs" color="#1e40af" />
                        <Text fontSize="11px" color="#1e40af">
                          Calculating policy impact metrics...
                        </Text>
                      </HStack>
                    ) : isOverviewError && !hasValidPolicyData ? (
                      <Text fontSize="11px" color="#92400e" mt={0.5}>
                        Policy impact cannot be loaded from service. Review user assignments before modifying permissions.
                      </Text>
                    ) : isOverviewError && hasValidPolicyData ? (
                      <Text fontSize="11px" color="#92400e" mt={0.5}>
                        Previously loaded: {overviewStats.usedByUsers} users across {overviewStats.scopedAssignmentsCount} scoped assignments. Refresh failed — verify assignments before saving changes.
                      </Text>
                    ) : (
                      <Text fontSize="11px" color="#1e40af" mt={0.5}>
                        {overviewStats.usedByUsers} users across {overviewStats.scopedAssignmentsCount} scoped assignments will be affected by permission changes.
                      </Text>
                    )}
                  </Box>
                </Flex>
              )}

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
          ) : !isMduConfigured ? (
            <Flex
              p={6}
              direction="column"
              align="center"
              justify="center"
              border="1px dashed"
              borderColor={themeColors.panel.border}
              borderRadius="6px"
              bg="#f8fafc"
              textAlign="center"
              gap={2}
            >
              <Box color="#64748b">
                <Icon name="info" size={20} />
              </Box>
              <Text fontSize="13px" fontWeight="600" color="#334155">
                MDU service not available in this cluster
              </Text>
              <Text fontSize="11px" color="#64748b">
                Policy usage metrics and impact analytics are disabled because mango-mdu-service was not discovered.
              </Text>
            </Flex>
          ) : isOverviewLoading && !hasValidPolicyData ? (
            <Flex h="200px" justify="center" align="center" direction="column" gap={3}>
              <Spinner size="md" color="#0869ff" />
              <Text fontSize="12px" color="#64748b">Loading policy overview...</Text>
            </Flex>
          ) : (
            /* Overview Subtab */
            <VStack gap={4} align="stretch">
              {isOverviewError && (
                <Flex
                  align="center"
                  justify="space-between"
                  bg="#fffbeb"
                  border="1px solid #fef3c7"
                  borderRadius="6px"
                  py={2}
                  px={3}
                  fontSize="12px"
                  color="#92400e"
                >
                  <HStack gap={2}>
                    <Icon name="info" size={15} color="#d97706" />
                    <Text fontWeight="500">
                      {hasValidPolicyData
                        ? 'Unable to refresh metrics from service. Displaying previously loaded data.'
                        : 'Policy overview metrics could not be loaded from service.'}
                    </Text>
                  </HStack>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="#b45309"
                    _hover={{ bg: '#fef3c7' }}
                    h="24px"
                    px={2}
                    fontSize="11px"
                    loading={isOverviewFetching}
                    onClick={() => refetchOverview()}
                  >
                    <HStack gap={1}>
                      <Icon name="refresh" size={12} />
                      <Text>Retry</Text>
                    </HStack>
                  </Button>
                </Flex>
              )}

              {/* Section 1: Usage summary */}
              <Box>
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack gap={2} align="center">
                    <Text fontSize="12px" fontWeight="700" color="#0f172a">
                      Usage summary
                    </Text>
                    {isOverviewError && hasValidPolicyData && (
                      <Badge colorScheme="yellow" fontSize="10px" px={1.5} py={0.5} borderRadius="4px">
                        Refresh failed — cached
                      </Badge>
                    )}
                  </HStack>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="#64748b"
                    _hover={{ color: '#0f172a', bg: '#f1f5f9' }}
                    h="24px"
                    px={2}
                    fontSize="11px"
                    loading={isOverviewFetching}
                    disabled={isOverviewFetching || !isMduConfigured}
                    onClick={() => refetchOverview()}
                    title="Refresh metrics from service"
                  >
                    <HStack gap={1}>
                      <Icon name="refresh" size={12} />
                      <Text>Refresh</Text>
                    </HStack>
                  </Button>
                </Flex>
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
                      <Text fontSize="18px" fontWeight="700" color={isOverviewError && !hasValidPolicyData ? "#94a3b8" : "#0f172a"} lineHeight="1.1">
                        {isOverviewLoading && !hasValidPolicyData ? (
                          <Spinner size="xs" color="#2563eb" />
                        ) : isOverviewError && !hasValidPolicyData ? (
                          '—'
                        ) : (
                          overviewStats.usedByUsers
                        )}
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
                      <Text fontSize="18px" fontWeight="700" color={isOverviewError && !hasValidPolicyData ? "#94a3b8" : "#0f172a"} lineHeight="1.1">
                        {isOverviewLoading && !hasValidPolicyData ? (
                          <Spinner size="xs" color="#7c3aed" />
                        ) : isOverviewError && !hasValidPolicyData ? (
                          '—'
                        ) : (
                          overviewStats.scopedAssignmentsCount
                        )}
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
                      <Text fontSize="18px" fontWeight="700" color={isOverviewError && !hasValidPolicyData ? "#94a3b8" : "#0f172a"} lineHeight="1.1">
                        {isOverviewLoading && !hasValidPolicyData ? (
                          <Spinner size="xs" color="#16a34a" />
                        ) : isOverviewError && !hasValidPolicyData ? (
                          '—'
                        ) : (
                          overviewStats.propertiesCount
                        )}
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
                      <Text fontSize="18px" fontWeight="700" color={isOverviewError && !hasValidPolicyData ? "#94a3b8" : "#0f172a"} lineHeight="1.1">
                        {isOverviewLoading && !hasValidPolicyData ? (
                          <Spinner size="xs" color="#ea580c" />
                        ) : isOverviewError && !hasValidPolicyData ? (
                          '—'
                        ) : (
                          overviewStats.venuesCount
                        )}
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
                    {isOverviewLoading && !hasValidPolicyData ? (
                      <Spinner size="xs" color="#64748b" />
                    ) : isOverviewError && !hasValidPolicyData ? (
                      '—'
                    ) : (
                      overviewStats.usedByUsers
                    )}
                  </Flex>
                </HStack>

                {isOverviewLoading && !hasValidPolicyData ? (
                  <Flex
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    p={6}
                    align="center"
                    justify="center"
                    direction="column"
                    gap={2}
                    bg="#ffffff"
                  >
                    <Spinner size="sm" color="#0869ff" />
                    <Text fontSize="12px" color="#64748b">Loading assigned users...</Text>
                  </Flex>
                ) : isOverviewError && !hasValidPolicyData ? (
                  <Box
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    p={4}
                    textAlign="center"
                    bg="#ffffff"
                  >
                    <Text fontSize="12px" color="#64748b" mb={2}>
                      Unable to load assigned users from service.
                    </Text>
                    <Button
                      size="xs"
                      variant="outline"
                      borderColor="#cbd5e1"
                      color="#475569"
                      h="26px"
                      fontSize="11px"
                      onClick={() => refetchOverview()}
                    >
                      <HStack gap={1.5}>
                        <Icon name="refresh" size={12} />
                        <Text>Retry request</Text>
                      </HStack>
                    </Button>
                  </Box>
                ) : overviewStats.assignedUsers && overviewStats.assignedUsers.length > 0 ? (
                  <Box
                    border="1px solid"
                    borderColor={themeColors.panel.border}
                    borderRadius="6px"
                    overflow="hidden"
                    bg="#ffffff"
                  >
                    {overviewStats.assignedUsers.map((u, idx) => (
                      <Flex
                        key={u.id || u.name + idx}
                        align="center"
                        justify="space-between"
                        py={2.5}
                        px={3}
                        borderBottom="1px solid"
                        borderColor={themeColors.panel.divider}
                        _last={{ borderBottom: 'none' }}
                        fontSize="12px"
                        cursor={u.id ? 'pointer' : 'default'}
                        _hover={u.id ? { bg: '#f8fafc' } : undefined}
                        transition="background-color 0.15s ease"
                        onClick={() => {
                          if (!u.id) return;
                          if (onNavigateToUsers) {
                            onNavigateToUsers(u.id);
                          } else {
                            setSelectedUserId(u.id);
                            setUserSubTab('profile');
                            setMainTab('users');
                          }
                        }}
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

                {overviewStats.usedByUsers > 0 && (
                  <Box mt={2}>
                    <Text
                      as="span"
                      fontSize="12px"
                      color="#0869ff"
                      fontWeight="500"
                      cursor="pointer"
                      onClick={() => {
                        if (onNavigateToUsers) {
                          onNavigateToUsers();
                        } else {
                          setMainTab('users');
                        }
                      }}
                    >
                      View all {overviewStats.usedByUsers} users
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
                  >
                    {/* Header */}
                    <Flex
                      bg="#f8fafc"
                      py={2}
                      px={3}
                      borderBottom="1px solid"
                      borderColor={themeColors.panel.border}
                      borderTopRadius="5px"
                      fontSize="11px"
                      fontWeight="700"
                      color="#64748b"
                      align="center"
                    >
                      <Box w="160px" flexShrink={0}>Resource</Box>
                      <Box flex="1">Access Level Permissions</Box>
                    </Flex>

                    {/* Rows */}
                    {newPolicyPermissions.map((perm) => (
                      <Flex
                        key={perm.resource}
                        py={2}
                        px={3}
                        borderBottom="1px solid"
                        borderColor={themeColors.panel.divider}
                        _last={{ borderBottom: 'none', borderBottomRadius: '5px' }}
                        align="center"
                        fontSize="12px"
                        gap={3}
                      >
                        <Box w="160px" flexShrink={0} fontWeight="600" color="#0f172a">
                          {perm.label || RESOURCE_DISPLAY_MAP[perm.resource] || perm.resource}
                        </Box>
                        <Box flex="1" minW={0}>
                          <ResourcePermissionInput
                            resource={perm.resource}
                            selectedActions={perm.actions || []}
                            onToggle={handleToggleNewPolicyAction}
                            isDisabled={false}
                          />
                        </Box>
                      </Flex>
                    ))}
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
