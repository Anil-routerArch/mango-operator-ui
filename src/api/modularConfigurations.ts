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
  notes?: Array<{ note: string; created?: number; author?: string }>;
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
 * Retrieve a list of modular configurations from OWPROV
 * GET /api/v1/configuration?withExtendedInfo=true&limit=500&offset=0
 */
export const getModularConfigurations = async (
  offset: number = 0,
  limit: number = 500
): Promise<ModularConfigurationApiResponse[]> => {
  const response = await axiosProv.get<{
    configurations?: ModularConfigurationApiResponse[];
  }>(`configuration?withExtendedInfo=true&limit=${limit}&offset=${offset}`);
  return response.data.configurations || [];
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
  notes?: Array<{ note: string; created?: number; author?: string }>;
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
 * Fetch all variable blocks (profiles) from OWPROV
 * GET /api/v1/variable?withExtendedInfo=true&limit={limit}&offset={offset}
 */
export const getAllVariableBlocks = async (
  limit = 500,
  offset = 0
): Promise<VariableBlockApiResponse[]> => {
  const response = await axiosProv.get<{
    variableBlocks?: VariableBlockApiResponse[];
  }>(`variable?withExtendedInfo=true&limit=${limit}&offset=${offset}`);
  return response.data?.variableBlocks || [];
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
 * GET /api/v1/variable?select=uuid1,uuid2
 */
export const getVariableBlocksSelect = async (
  ids: string[]
): Promise<VariableBlockApiResponse[]> => {
  if (!ids || ids.length === 0) return [];
  try {
    const response = await axiosProv.get<{
      variableBlocks?: VariableBlockApiResponse[];
    }>(`variable?select=${ids.map((id) => encodeURIComponent(id)).join(',')}`);
    return response.data?.variableBlocks || [];
  } catch (err) {
    console.warn('Could not fetch variable blocks by select:', err);
    return [];
  }
};



