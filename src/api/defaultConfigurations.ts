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
 * Retrieve a list of default configurations from OWGW
 * GET /api/v1/default_configurations?limit=500&offset=0
 */
export const getDefaultConfigurations = async (
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

