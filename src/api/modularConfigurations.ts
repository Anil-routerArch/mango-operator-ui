import { useQuery } from '@tanstack/react-query';
import { axiosProv } from './client';

export interface DeviceRulesPayload {
  rcOnly?: 'inherit' | 'yes' | 'no' | string;
  rrm?: 'inherit' | 'on' | 'off' | string;
  firmwareUpgrade?: 'inherit' | 'yes' | 'no' | string;
}

export interface ModularConfigElementPayload {
  name: string;
  description?: string;
  weight: number;
  configuration: string | Record<string, unknown>;
}

export interface ModularConfigurationPayload {
  name: string;
  description?: string;
  deviceGroup: 'ap' | 'switch' | 'olg' | string;
  deviceTypes: string[];
  deviceRules?: DeviceRulesPayload;
  notes?: Array<{ note: string }>;
  entity?: string;
  venue?: string;
  subscriber?: string;
  subscriberOnly?: boolean;
  variables?: string[];
  configuration: ModularConfigElementPayload[];
}

export interface ModularConfigurationApiResponse {
  id: string;
  name: string;
  description?: string;
  deviceGroup?: string;
  deviceTypes?: string[];
  deviceRules?: DeviceRulesPayload;
  notes?: Array<{ note: string; created?: number; author?: string; createdBy?: string }>;
  entity?: string;
  venue?: string;
  subscriber?: string;
  subscriberOnly?: boolean;
  created?: number;
  modified?: number;
  inUse?: string[];
  variables?: string[];
  configuration?: ModularConfigElementPayload[];
  tags?: string[];
}

/**
 * Retrieve a single batch of modular configurations from OWPROV
 * GET /api/v1/configuration?withExtendedInfo=true&limit={limit}&offset={offset}
 */
export const getModularConfigurationsBatch = async (
  offset: number = 0,
  limit: number = 500
): Promise<ModularConfigurationApiResponse[]> => {
  const response = await axiosProv.get<{
    configurations?: ModularConfigurationApiResponse[];
  }>(`configuration?withExtendedInfo=true&limit=${limit}&offset=${offset}`);
  return response.data.configurations || [];
};

/**
 * Retrieve modular configurations from OWPROV.
 * If offset and limit are explicitly provided, returns a single batch.
 * Otherwise, iteratively fetches all pages until all records are retrieved.
 */
export const getModularConfigurations = async (
  offset?: number,
  limit?: number
): Promise<ModularConfigurationApiResponse[]> => {
  if (typeof offset === 'number' && typeof limit === 'number') {
    return getModularConfigurationsBatch(offset, limit);
  }

  const batchSize = limit || 500;
  let currentOffset = offset || 0;
  let allConfigs: ModularConfigurationApiResponse[] = [];
  const MAX_PAGES = 50; // Safety guard: max 25,000 records
  let pageCount = 0;

  while (pageCount < MAX_PAGES) {
    const batch = await getModularConfigurationsBatch(currentOffset, batchSize);
    allConfigs = [...allConfigs, ...batch];
    pageCount++;
    if (batch.length < batchSize) {
      break;
    }
    currentOffset += batchSize;
  }

  return allConfigs;
};

/**
 * Retrieve a single modular configuration by ID from OWPROV
 * GET /api/v1/configuration/{id}?withExtendedInfo=true
 */
export const getModularConfigurationById = async (
  id: string
): Promise<ModularConfigurationApiResponse> => {
  const response = await axiosProv.get<ModularConfigurationApiResponse>(
    `configuration/${encodeURIComponent(id)}?withExtendedInfo=true`
  );
  return response.data;
};

/**
 * Create a new modular configuration in OWPROV
 * POST /api/v1/configuration/0
 */
export const createModularConfiguration = async (
  data: ModularConfigurationPayload
): Promise<ModularConfigurationApiResponse> => {
  const response = await axiosProv.post<ModularConfigurationApiResponse>(
    'configuration/0',
    data
  );
  return response.data;
};

/**
 * Update an existing modular configuration in OWPROV
 * PUT /api/v1/configuration/{id}
 */
export const updateModularConfiguration = async (
  id: string,
  data: Partial<ModularConfigurationPayload>
): Promise<ModularConfigurationApiResponse> => {
  const response = await axiosProv.put<ModularConfigurationApiResponse>(
    `configuration/${encodeURIComponent(id)}`,
    data
  );
  return response.data;
};

/**
 * Delete a modular configuration in OWPROV
 * DELETE /api/v1/configuration/{id}
 */
export const deleteModularConfiguration = async (
  id: string
): Promise<{ Code?: number; Details?: string }> => {
  const response = await axiosProv.delete<{ Code?: number; Details?: string }>(
    `configuration/${encodeURIComponent(id)}`
  );
  return response.data;
};

/**
 * Get affected devices for a configuration in OWPROV
 * GET /api/v1/configuration/{id}?computedAffected=true
 */
export const getConfigurationAffectedDevices = async (
  id: string
): Promise<string[]> => {
  const response = await axiosProv.get<{ affectedDevices?: string[] }>(
    `configuration/${encodeURIComponent(id)}?computedAffected=true`
  );
  return response.data?.affectedDevices || [];
};

export interface VariableItem {
  prefix: string;
  type: string;
  value: string | Record<string, unknown>;
  weight: number;
}

export interface VariableBlockApiResponse {
  id: string;
  name: string;
  description?: string;
  created?: number;
  modified?: number;
  notes?: Array<{ note: string; created?: number; author?: string; createdBy?: string }>;
  entity?: string;
  entityName?: string;
  venue?: string;
  venueName?: string;
  subscriber?: string;
  inventory?: string;
  configurations?: string[];
  managementPolicy?: string;
  deviceGroup?: string;
  variables?: VariableItem[];
  [key: string]: unknown;
}

/**
 * Retrieve a single batch of variable blocks (profiles) from OWPROV
 * GET /api/v1/variable?withExtendedInfo=true&limit={limit}&offset={offset}
 */
export const getVariableBlocksBatch = async (
  limit = 500,
  offset = 0
): Promise<VariableBlockApiResponse[]> => {
  const response = await axiosProv.get<{
    variableBlocks?: VariableBlockApiResponse[];
  }>(`variable?withExtendedInfo=true&limit=${limit}&offset=${offset}`);
  return response.data?.variableBlocks || [];
};

/**
 * Fetch variable blocks (profiles) from OWPROV.
 * If limit and offset are explicitly provided, returns a single batch.
 * Otherwise, iteratively fetches all pages until all records are retrieved.
 */
export const getAllVariableBlocks = async (
  limit?: number,
  offset?: number
): Promise<VariableBlockApiResponse[]> => {
  if (typeof offset === 'number' && typeof limit === 'number') {
    return getVariableBlocksBatch(limit, offset);
  }

  const batchSize = limit || 500;
  let currentOffset = offset || 0;
  let allBlocks: VariableBlockApiResponse[] = [];
  const MAX_PAGES = 50; // Safety guard: max 25,000 records
  let pageCount = 0;

  while (pageCount < MAX_PAGES) {
    const batch = await getVariableBlocksBatch(batchSize, currentOffset);
    allBlocks = [...allBlocks, ...batch];
    pageCount++;
    if (batch.length < batchSize) {
      break;
    }
    currentOffset += batchSize;
  }

  return allBlocks;
};

/**
 * Fetch a single variable block by ID from OWPROV
 * GET /api/v1/variable/{id}?withExtendedInfo=true
 */
export const getVariableBlockById = async (
  id: string
): Promise<VariableBlockApiResponse> => {
  const response = await axiosProv.get<VariableBlockApiResponse>(
    `variable/${encodeURIComponent(id)}?withExtendedInfo=true`
  );
  return response.data;
};

/**
 * Create a new variable block in OWPROV
 * POST /api/v1/variable/0
 */
export const createVariableBlock = async (
  data: Partial<VariableBlockApiResponse>
): Promise<VariableBlockApiResponse> => {
  const response = await axiosProv.post<VariableBlockApiResponse>(
    'variable/0',
    data
  );
  return response.data;
};

/**
 * Update an existing variable block in OWPROV
 * PUT /api/v1/variable/{id}
 */
export const updateVariableBlock = async (
  id: string,
  data: Partial<VariableBlockApiResponse>
): Promise<VariableBlockApiResponse> => {
  const response = await axiosProv.put<VariableBlockApiResponse>(
    `variable/${encodeURIComponent(id)}`,
    data
  );
  return response.data;
};

/**
 * Delete a variable block from OWPROV
 * DELETE /api/v1/variable/{id}
 */
export const deleteVariableBlock = async (id: string): Promise<void> => {
  await axiosProv.delete(`variable/${encodeURIComponent(id)}`);
};

/**
 * Fetch specific variable blocks (profiles) by their UUIDs using OWPROV ?select= batch query.
 * GET /api/v1/variable?withExtendedInfo=true&select=uuid1,uuid2
 *
 * Propagates backend errors to callers instead of silently returning an empty array,
 * allowing React Query and fallback mechanisms to properly handle failure states.
 */
export const getVariableBlocksSelect = async (
  ids: string[]
): Promise<VariableBlockApiResponse[]> => {
  if (!ids || ids.length === 0) return [];
  const response = await axiosProv.get<{
    variableBlocks?: VariableBlockApiResponse[];
  }>(`variable?withExtendedInfo=true&select=${ids.map((id) => encodeURIComponent(id)).join(',')}`);
  return response.data?.variableBlocks || [];
};

export const useGetVariableBlocksSelect = (ids: string[]) => {
  return useQuery({
    queryKey: ['variableBlocks', 'select', ids],
    queryFn: () => getVariableBlocksSelect(ids),
    enabled: Boolean(ids && ids.length > 0),
    staleTime: 30 * 1000,
  });
};



