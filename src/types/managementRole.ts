import type { Note } from './user';

export interface ManagementRole {
  id: string;
  name: string;
  description: string;
  managementPolicy: string;
  users: string[];
  entity: string;
  venue: string;
  venueIds?: string[];
  inUse?: string[];
  tags?: string[];
  notes?: Note[];
  created?: number;
  modified?: number;
}

export interface ManagementPolicyEntry {
  resources: string[];
  access: string[];
}

export interface ManagementPolicy {
  id: string;
  name: string;
  description: string;
  entity?: string;
  venue?: string;
  entries: ManagementPolicyEntry[];
  created?: number;
  modified?: number;
}

export interface CreateManagementRolePayload {
  name: string;
  description?: string;
  managementPolicy: string;
  users: string[];
  entity: string;
  venueIds?: string[];
  notes?: Note[];
}

export interface CreateManagementPolicyPayload {
  id?: string;
  name: string;
  description?: string;
  entity?: string;
  venue?: string;
  entries: ManagementPolicyEntry[];
}
