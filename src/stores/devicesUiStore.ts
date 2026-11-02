import { create } from 'zustand';

export type DevicesMainTab = 'all' | 'dashboard' | 'blacklist';
export type DeviceWorkspaceTab = 'overview' | 'radios' | 'configuration' | 'activity' | 'diagnostics';
export type DeviceConfigSubTab = 'main' | 'special' | 'computed' | 'overrides' | 'notes' | 'state';

export interface DevicesUiState {
  mainTab: DevicesMainTab;
  selectedSerialNumber: string | null;
  workspaceTab: DeviceWorkspaceTab;
  configSubTab: DeviceConfigSubTab;
  searchQuery: string;
  statusFilter: 'all' | 'online' | 'offline';
  unassignedOnly: boolean;
  pageIndex: number;
  pageSize: number;

  setMainTab: (tab: DevicesMainTab) => void;
  selectDevice: (serialNumber: string, defaultTab?: DeviceWorkspaceTab) => void;
  clearSelectedDevice: () => void;
  setWorkspaceTab: (tab: DeviceWorkspaceTab) => void;
  setConfigSubTab: (subTab: DeviceConfigSubTab) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: 'all' | 'online' | 'offline') => void;
  setUnassignedOnly: (unassigned: boolean) => void;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
}

export const useDevicesUiStore = create<DevicesUiState>((set) => ({
  mainTab: 'all',
  selectedSerialNumber: null,
  workspaceTab: 'overview',
  configSubTab: 'main',
  searchQuery: '',
  statusFilter: 'all',
  unassignedOnly: false,
  pageIndex: 0,
  pageSize: 10,

  setMainTab: (mainTab) => set({ mainTab, selectedSerialNumber: null }),
  selectDevice: (selectedSerialNumber, defaultTab = 'overview') =>
    set({ selectedSerialNumber, workspaceTab: defaultTab }),
  clearSelectedDevice: () => set({ selectedSerialNumber: null }),
  setWorkspaceTab: (workspaceTab) => set({ workspaceTab }),
  setConfigSubTab: (configSubTab) => set({ configSubTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery, pageIndex: 0 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, pageIndex: 0 }),
  setUnassignedOnly: (unassignedOnly) => set({ unassignedOnly, pageIndex: 0 }),
  setPageIndex: (pageIndex) => set({ pageIndex }),
  setPageSize: (pageSize) => set({ pageSize, pageIndex: 0 }),
}));

