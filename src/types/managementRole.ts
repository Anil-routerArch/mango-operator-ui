import type { Note } from './user';

export interface EntityInfo {
  id: string;
  name: string;
  description?: string;
  parent?: string;
  venues?: string[];
}

export interface VenueInfo {
  id: string;
  name: string;
  entity: string;
  description?: string;
}

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

export interface UpdateManagementRolePayload {
  id: string;
  name?: string;
  description?: string;
  managementPolicy?: string;
  notes?: Note[];
  tags?: string[];
}

export interface CreateManagementPolicyPayload {
  id?: string;
  name: string;
  description?: string;
  entity?: string;
  venue?: string;
  entries: ManagementPolicyEntry[];
}
