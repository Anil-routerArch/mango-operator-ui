import { axiosGw } from './client';

export interface DefaultConfigurationPayload {
  name: string;
  description: string;
  modelIds: string[];
  platform: 'ap' | 'switch' | 'olg' | string;
  configuration: string;
}

export interface DefaultConfigurationApiResponse {
  name: string;
  description: string;
  modelIds: string[];
  platform: 'ap' | 'switch' | 'olg' | string;
  configuration: string | Record<string, unknown>;
  created?: number;
  lastModified?: number;
}

export interface OwgwSuccessResponse {
  Code?: number;
  Details?: string;
  Operation?: string;
}

/**
 * Retrieve a single batch of default configurations from OWGW
 * GET /api/v1/default_configurations?limit={limit}&offset={offset}
 */
export const getDefaultConfigurationsBatch = async (
  offset: number = 0,
  limit: number = 500
): Promise<DefaultConfigurationApiResponse[]> => {
  const response = await axiosGw.get<{
    configurations?: DefaultConfigurationApiResponse[];
    defaultConfigurations?: DefaultConfigurationApiResponse[];
  }>(`default_configurations?limit=${limit}&offset=${offset}`);
  return response.data.configurations || response.data.defaultConfigurations || [];
};

/**
 * Retrieve default configurations from OWGW.
 * If offset and limit are explicitly provided, returns a single batch.
 * Otherwise, iteratively fetches all pages until all records are retrieved.
 */
export const getDefaultConfigurations = async (
  offset?: number,
  limit?: number
): Promise<DefaultConfigurationApiResponse[]> => {
  if (typeof offset === 'number' && typeof limit === 'number') {
    return getDefaultConfigurationsBatch(offset, limit);
  }

  const batchSize = limit || 500;
  let currentOffset = offset || 0;
  let allConfigs: DefaultConfigurationApiResponse[] = [];
  const MAX_PAGES = 50; // Safety guard: max 25,000 records
  let pageCount = 0;

  while (pageCount < MAX_PAGES) {
    const batch = await getDefaultConfigurationsBatch(currentOffset, batchSize);
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
 * Retrieve a single default configuration by name from OWGW
 * GET /api/v1/default_configuration/{name}
 */
export const getDefaultConfigurationByName = async (
  name: string
): Promise<DefaultConfigurationApiResponse> => {
  const response = await axiosGw.get<DefaultConfigurationApiResponse>(
    `default_configuration/${encodeURIComponent(name)}`
  );
  return response.data;
};

/**
 * Create a new default configuration in OWGW
 * POST /api/v1/default_configuration/{name}
 */
export const createDefaultConfiguration = async (
  data: DefaultConfigurationPayload,
  strict: boolean = false
): Promise<OwgwSuccessResponse> => {
  const response = await axiosGw.post<OwgwSuccessResponse>(
    `default_configuration/${encodeURIComponent(data.name)}${strict ? '?strict=true' : ''}`,
    data
  );
  return response.data;
};

/**
 * Update an existing default configuration in OWGW
 * PUT /api/v1/default_configuration/{name}
 */
export const updateDefaultConfiguration = async (
  data: DefaultConfigurationPayload,
  strict: boolean = false
): Promise<DefaultConfigurationApiResponse | OwgwSuccessResponse> => {
  const response = await axiosGw.put<DefaultConfigurationApiResponse | OwgwSuccessResponse>(
    `default_configuration/${encodeURIComponent(data.name)}${strict ? '?strict=true' : ''}`,
    data
  );
  return response.data;
};

/**
 * Delete a default configuration in OWGW
 * DELETE /api/v1/default_configuration/{name}
 */
export const deleteDefaultConfiguration = async (
  name: string
): Promise<OwgwSuccessResponse> => {
  const response = await axiosGw.delete<OwgwSuccessResponse>(
    `default_configuration/${encodeURIComponent(name)}`
  );
  return response.data;
};

