import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosMdu, axiosProv } from './client';
import { getModularConfigurationsBatch, type ModularConfigurationApiResponse } from './modularConfigurations';

export type PropertyScopeType = 'property' | 'venue';
export type AvailabilityState = 'online' | 'offline' | 'unknown';

export const ROOT_PROPERTY_ID = '0000-0000-0000';

export interface PropertyTreeNode {
  id: string;
  type: PropertyScopeType;
  name: string;
  children: PropertyTreeNode[];
  summary?: ScopeSummary;
}

export interface PropertyPortfolio {
  nodes: PropertyTreeNode[];
  summary: ScopeSummary;
  dataQuality: DataQuality;
  propertyCount: number;
  venueCount: number;
  nestedVenueCount: number;
}

export interface PropertyMapDevice {
  serialNumber: string;
  name?: string;
  availability: AvailabilityState;
  sanity?: number;
}

export interface PropertyMapNode {
  id: string;
  type: PropertyScopeType;
  name: string;
  devices: PropertyMapDevice[];
  children: PropertyMapNode[];
}

export interface PropertyMapResponse {
  nodes: PropertyMapNode[];
  dataQuality: DataQuality;
}

export interface ScopeSummary {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  unknownDevices: number;
  statusMeasuredFor: number;
}

export interface DataQuality {
  state: 'complete' | 'partial' | 'stale' | 'unavailable';
  partial?: boolean;
  statusComplete?: boolean;
  authoritativeCounts?: {
    inventory?: boolean;
    availability?: boolean;
  };
  unknownDeviceCount?: number;
  asOf?: string;
  generatedAt?: string;
  freshnessWindowSeconds?: number;
  errors?: Array<{ source?: string; code?: string; retryable?: boolean }>;
}

export interface ScopeOverview {
  id: string;
  type: PropertyScopeType;
  name: string;
  summary: ScopeSummary;
  children: Array<{ id: string; type: PropertyScopeType; name: string; summary: ScopeSummary }>;
  dataQuality: DataQuality;
  includesDescendants: boolean;
}

export interface PropertyDevice {
  serialNumber: string;
  name: string;
  description?: string;
  deviceType?: string;
  deviceGroup?: string;
  entityId?: string;
  entityName?: string;
  venueId?: string;
  venueName?: string;
  availability: AvailabilityState;
  connected: boolean;
  statusKnown: boolean;
  ipAddress?: string;
  firmware?: string;
  lastContact?: number | string;
  sanity?: number;
}

export interface ScopedDevicesResponse {
  devices: PropertyDevice[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  summary: ScopeSummary;
  dataQuality: DataQuality;
}

export interface ScopeDetails {
  id: string;
  name: string;
  description?: string;
  parent?: string;
  operatorId?: string;
  entity?: string;
  children?: string[];
  venues?: string[];
  devices?: string[];
  contacts?: string[];
  locations?: string[];
  location?: string;
  configurations?: string[];
  sourceIP?: string[];
  deviceRules?: {
    rrm?: string;
    rcOnly?: string;
    firmwareUpgrade?: string;
    [key: string]: unknown;
  };
  notes?: Array<{ note?: string; created?: number; createdBy?: string; author?: string }>;
  created?: number;
  modified?: number;
  extendedInfo?: {
    entity?: { id?: string; name?: string; description?: string };
    location?: { id?: string; name?: string; description?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ContactDetails {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  title?: string;
  salutation?: string;
  initials?: string;
  visual?: string;
  firstname?: string;
  lastname?: string;
  primaryEmail?: string;
  secondaryEmail?: string;
  phones?: string[];
  mobiles?: string[];
  accessPIN?: string;
  entity?: string;
  venue?: string;
}

export interface LocationDetails {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  buildingName?: string;
  addressLines?: string[];
  city?: string;
  state?: string;
  postal?: string;
  country?: string;
  geoCode?: string;
  timezone?: string;
  phones?: string[];
  mobiles?: string[];
  entity?: string;
}

export interface ContactInput {
  name: string;
  description?: string;
  type: string;
  title?: string;
  salutation?: string;
  initials?: string;
  visual?: string;
  firstname: string;
  lastname?: string;
  primaryEmail: string;
  secondaryEmail?: string;
  phones: string[];
  mobiles: string[];
  accessPIN?: string;
  entity: string;
  notes?: Array<{ note: string }>;
}

export interface LocationInput {
  name: string;
  description?: string;
  type: string;
  buildingName: string;
  addressLines: string[];
  city: string;
  state: string;
  postal: string;
  country: string;
  phones: string[];
  mobiles: string[];
  entity: string;
  geoCode: string;
  timezone: string;
  notes?: Array<{ note: string }>;
}

export class CreatedResourceAssociationError extends Error {
  readonly resourceType: 'contact' | 'location';
  readonly resourceId: string;
  readonly associationError: unknown;

  constructor(resourceType: 'contact' | 'location', resourceId: string, associationError: unknown) {
    super(`${resourceType === 'contact' ? 'Contact' : 'Location'} was created but could not be associated with the Venue`);
    this.name = 'CreatedResourceAssociationError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    this.associationError = associationError;
  }
}

export interface ScopedDevicesFilters {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  venue?: string;
  availability?: string;
  type?: string;
  attention?: 'low-sanity' | 'sanity-unavailable';
}

const requireCompleteScopedDevicesResponse = (data: ScopedDevicesResponse): ScopedDevicesResponse => {
  const hasCompletePagination =
    Number.isInteger(data?.totalCount) && data.totalCount >= 0 &&
    Number.isInteger(data?.pageIndex) && data.pageIndex >= 0 &&
    Number.isInteger(data?.pageSize) && data.pageSize > 0 &&
    Number.isInteger(data?.totalPages) && data.totalPages >= 1;

  if (!Array.isArray(data?.devices) || !hasCompletePagination) {
    throw new Error('Complete scoped Device inventory is unavailable');
  }
  return data;
};

const normalizeTreeNode = (node: PropertyTreeNode): PropertyTreeNode => ({
  id: node.id,
  type: node.type,
  name: node.name,
  children: (node.children || []).map(normalizeTreeNode),
  ...(node.summary ? { summary: node.summary } : {}),
});

const normalizeTree = (nodes?: PropertyTreeNode[]): PropertyTreeNode[] =>
  (nodes || []).map(normalizeTreeNode);

export interface OwprovRawTreeNode {
  type: 'entity' | 'venue';
  name: string;
  uuid: string;
  children?: OwprovRawTreeNode[];
  venues?: OwprovRawTreeNode[];
  devices?: string[];
}

export const useOwprovRawTree = (enabled = true) =>
  useQuery<OwprovRawTreeNode>({
    queryKey: ['owprov-raw-tree'],
    queryFn: async () => {
      const { data } = await axiosProv.get<OwprovRawTreeNode>('entity?getTree=true');
      return data;
    },
    staleTime: 60_000,
    retry: 1,
    enabled,
  });

export const usePropertyTree = () =>
  useQuery({
    queryKey: ['property-tree'],
    queryFn: async () => {
      const { data } = await axiosMdu.get<{ nodes: PropertyTreeNode[] }>('properties/tree');
      // The MDU tree contract is structural. Older MDU/OWPROV payloads can
      // still contain Device arrays; normalize to the documented contract so
      // Device identities are consumed only through scoped inventory APIs.
      return normalizeTree(data.nodes);
    },
    staleTime: 60_000,
    retry: 1,
  });

export const usePropertyPortfolio = (enabled = true) =>
  useQuery({
    queryKey: ['property-portfolio'],
    queryFn: async () => {
      const { data } = await axiosMdu.get<PropertyPortfolio>('properties/portfolio');
      return { ...data, nodes: normalizeTree(data.nodes) };
    },
    staleTime: 30_000,
    retry: 1,
    enabled,
  });

export const usePropertyMap = (enabled = true) =>
  useQuery({
    queryKey: ['property-map'],
    queryFn: async () => {
      const { data } = await axiosMdu.get<PropertyMapResponse>('properties/map');
      return data;
    },
    staleTime: 30_000,
    retry: 1,
    enabled,
  });

export const useScopeOverview = (type?: PropertyScopeType, id?: string) =>
  useQuery({
    queryKey: ['scope-overview', type, id],
    queryFn: async () => {
      const collection = type === 'property' ? 'properties' : 'venues';
      const { data } = await axiosMdu.get<ScopeOverview>(`${collection}/${encodeURIComponent(id!)}/overview`);
      return data;
    },
    enabled: Boolean(type && id),
    staleTime: 30_000,
  });

export const useScopedDevices = (
  type?: PropertyScopeType,
  id?: string,
  filters: ScopedDevicesFilters = {}
) =>
  useQuery({
    queryKey: ['scope-devices', type, id, filters],
    queryFn: async () => {
      const collection = type === 'property' ? 'properties' : 'venues';
      const { data } = await axiosMdu.get<ScopedDevicesResponse>(
        `${collection}/${encodeURIComponent(id!)}/devices`,
        { params: filters }
      );
      return requireCompleteScopedDevicesResponse(data);
    },
    enabled: Boolean(type && id),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });

export const useScopeDetails = (type?: PropertyScopeType, id?: string) =>
  useQuery({
    queryKey: ['scope-details', type, id],
    queryFn: async () => {
      const resource = type === 'property' ? 'entity' : 'venue';
      const { data } = await axiosProv.get<ScopeDetails>(
        `${resource}/${encodeURIComponent(id!)}?withExtendedInfo=true`
      );
      return data;
    },
    enabled: Boolean(type && id),
    staleTime: 30_000,
  });

export const useScopeContacts = (ids: string[]) =>
  useQuery({
    queryKey: ['scope-contacts', [...ids].sort().join(',')],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data } = await axiosProv.get<{ contacts?: ContactDetails[] }>('contact', {
        params: { withExtendedInfo: true, select: ids.join(',') },
      });
      return data.contacts || [];
    },
    enabled: ids.length > 0,
    staleTime: 60_000,
  });

export const useScopeLocations = (ids: string[]) =>
  useQuery({
    queryKey: ['scope-locations', [...ids].sort().join(',')],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data } = await axiosProv.get<{ locations?: LocationDetails[] }>('location', {
        params: { withExtendedInfo: true, select: ids.join(',') },
      });
      return data.locations || [];
    },
    enabled: ids.length > 0,
    staleTime: 60_000,
  });

export const useAvailableVenueLocations = (venueId?: string) =>
  useQuery({
    queryKey: ['available-venue-locations', venueId],
    queryFn: async () => {
      const { data } = await axiosProv.get<{ locations?: Array<{ uuid: string; name: string }> }>('venue', {
        params: { locationsForVenue: venueId },
      });
      return data.locations || [];
    },
    enabled: Boolean(venueId),
    staleTime: 60_000,
  });

export const useSaveContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, createdContactId, payload, scopeType, scopeId, existingContactIds = [] }: {
      contactId?: string;
      createdContactId?: string;
      payload: ContactInput;
      scopeType: PropertyScopeType;
      scopeId: string;
      existingContactIds?: string[];
    }) => {
      if (contactId) {
        const { data } = await axiosProv.put<ContactDetails>(`contact/${encodeURIComponent(contactId)}`, payload);
        return data;
      }
      let data: ContactDetails;
      if (createdContactId) {
        data = { id: createdContactId };
      } else {
        const response = await axiosProv.post<ContactDetails>('contact/0', payload);
        data = response.data;
      }
      if (scopeType === 'venue' && data.id) {
        try {
          await axiosProv.put(`venue/${encodeURIComponent(scopeId)}`, {
            contacts: [...new Set([...existingContactIds, data.id])],
          });
        } catch (error) {
          throw new CreatedResourceAssociationError('contact', data.id, error);
        }
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scope-details', variables.scopeType, variables.scopeId] });
      queryClient.invalidateQueries({ queryKey: ['scope-contacts'] });
    },
  });
};

export const useSaveLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ locationId, createdLocationId, payload, scopeType, scopeId }: {
      locationId?: string;
      createdLocationId?: string;
      payload: LocationInput;
      scopeType: PropertyScopeType;
      scopeId: string;
    }) => {
      if (locationId) {
        const { data } = await axiosProv.put<LocationDetails>(`location/${encodeURIComponent(locationId)}`, payload);
        return data;
      }
      let data: LocationDetails;
      if (createdLocationId) {
        data = { id: createdLocationId };
      } else {
        const response = await axiosProv.post<LocationDetails>('location/0', payload);
        data = response.data;
      }
      if (scopeType === 'venue' && data.id) {
        try {
          await axiosProv.put(`venue/${encodeURIComponent(scopeId)}`, { location: data.id });
        } catch (error) {
          throw new CreatedResourceAssociationError('location', data.id, error);
        }
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scope-details', variables.scopeType, variables.scopeId] });
      queryClient.invalidateQueries({ queryKey: ['scope-locations'] });
      queryClient.invalidateQueries({ queryKey: ['available-venue-locations', variables.scopeId] });
    },
  });
};

export interface ScopedConfigurationsResult {
  configurations: ModularConfigurationApiResponse[];
  retrievedCount: number;
  complete: boolean;
}

export const useScopedConfigurations = (scopeIds: string[]) =>
  useQuery({
    queryKey: ['scope-configurations', [...scopeIds].sort().join(',')],
    queryFn: async () => {
      const ids = new Set(scopeIds);
      const pageSize = 500;
      const maxPages = 100;
      const authorizedConfigurations: ModularConfigurationApiResponse[] = [];
      let complete = false;

      for (let page = 0; page < maxPages; page += 1) {
        const batch = await getModularConfigurationsBatch(page * pageSize, pageSize);
        authorizedConfigurations.push(...batch);
        if (batch.length < pageSize) {
          complete = true;
          break;
        }
      }

      const configurations = authorizedConfigurations.filter((config) =>
        Boolean((config.entity && ids.has(config.entity)) || (config.venue && ids.has(config.venue)))
      );
      return { configurations, retrievedCount: authorizedConfigurations.length, complete };
    },
    enabled: scopeIds.length > 0,
    staleTime: 30_000,
  });

export interface CreateScopePayload {
  type: PropertyScopeType;
  name: string;
  description?: string;
  parentProperty?: string;
  parentOperatorId?: string;
  property?: string;
  parentVenue?: string;
  note?: string;
  sourceIP?: string[];
  deviceRules?: ScopeDetails['deviceRules'];
  location?: string;
}

export const useCreateScope = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateScopePayload) => {
      if (payload.type === 'property') {
        if (!payload.parentProperty) {
          throw new Error('A parent Property is required');
        }
        if (payload.parentProperty !== ROOT_PROPERTY_ID && !payload.parentOperatorId?.trim()) {
          throw new Error('Child Properties can only be created under Root or an Operator-linked Property');
        }
        const { data } = await axiosProv.post<ScopeDetails>('entity/0', {
          name: payload.name,
          description: payload.description || '',
          parent: payload.parentProperty,
          notes: payload.note ? [{ note: payload.note }] : [],
          sourceIP: payload.sourceIP || [],
          deviceRules: payload.deviceRules,
        });
        return data;
      }
      if (payload.property === ROOT_PROPERTY_ID) {
        throw new Error('Venues cannot be created directly under Root; create a child Property first');
      }
      if (!payload.property && !payload.parentVenue) {
        throw new Error('A non-Root Property or parent Venue is required');
      }
      const body: Record<string, unknown> = {
        name: payload.name,
        description: payload.description || '',
        notes: payload.note ? [{ note: payload.note }] : [],
        sourceIP: payload.sourceIP || [],
        deviceRules: payload.deviceRules,
        location: payload.location || '',
      };
      if (payload.parentVenue) body.parent = payload.parentVenue;
      else if (payload.property) body.entity = payload.property;
      const { data } = await axiosProv.post<ScopeDetails>('venue/0', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-tree'] });
      queryClient.invalidateQueries({ queryKey: ['property-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};

export const useUpdateScope = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, id, changes }: { type: PropertyScopeType; id: string; changes: Partial<ScopeDetails> }) => {
      const resource = type === 'property' ? 'entity' : 'venue';
      const { data } = await axiosProv.put<ScopeDetails>(`${resource}/${encodeURIComponent(id)}`, changes);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-tree'] });
      queryClient.invalidateQueries({ queryKey: ['property-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['scope-details', variables.type, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['scope-overview', variables.type, variables.id] });
    },
  });
};

export const useDeleteScope = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, id, operatorId }: { type: PropertyScopeType; id: string; operatorId?: string }) => {
      if (type === 'property' && id === ROOT_PROPERTY_ID) {
        throw new Error('Root cannot be deleted');
      }
      if (type === 'property' && operatorId?.trim()) {
        throw new Error('Operator-linked Properties must be deleted through Operator administration');
      }
      const resource = type === 'property' ? 'entity' : 'venue';
      await axiosProv.delete(`${resource}/${encodeURIComponent(id)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-tree'] });
      queryClient.invalidateQueries({ queryKey: ['property-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};

export type ScopedConfiguration = ModularConfigurationApiResponse;
