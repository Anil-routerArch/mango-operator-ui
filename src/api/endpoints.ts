import { create } from 'zustand';
import {
  axiosSec,
  axiosProv,
  axiosProvV2,
  axiosMdu,
  axiosGw,
  axiosFms,
  axiosSub,
  axiosAnalytics,
} from './client';

export interface EndpointApiResponse {
  authenticationType: string;
  id: number;
  type: string;
  uri: string;
  vendor: string;
}

export interface EndpointsState {
  endpoints: Record<string, string>;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  setEndpoints: (endpoints: EndpointApiResponse[]) => void;
  fetchEndpoints: () => Promise<Record<string, string>>;
}

/**
 * Dynamically wires the base URLs of all OpenWiFi and Mango Axios clients
 * according to the live cluster service registry returned by OWSEC.
 */
export const applyDiscoveredEndpoints = (endpointList: EndpointApiResponse[]): Record<string, string> => {
  const map: Record<string, string> = {};

  for (const endpoint of endpointList) {
    const cleanUri = endpoint.uri.replace(/\/+$/, '');
    map[endpoint.type] = cleanUri;

    switch (endpoint.type) {
      case 'owprov':
        // Wire both API v1 and API v2 clients
        axiosProv.defaults.baseURL = `${cleanUri}/api/v1`;
        axiosProvV2.defaults.baseURL = `${cleanUri}/api/v2`;
        break;

      case 'mango-mdu-service':
        axiosMdu.defaults.baseURL = `${cleanUri}/api/v1`;
        break;

      case 'owgw':
        axiosGw.defaults.baseURL = `${cleanUri}/api/v1`;
        break;

      case 'owfms':
        axiosFms.defaults.baseURL = `${cleanUri}/api/v1`;
        break;

      case 'owsub':
        axiosSub.defaults.baseURL = `${cleanUri}/api/v1`;
        break;

      case 'owanalytics':
        axiosAnalytics.defaults.baseURL = `${cleanUri}/api/v1`;
        break;

      default:
        break;
    }
  }

  return map;
};

/**
 * Zustand store for discovered endpoints across the app
 */
export const useEndpointsStore = create<EndpointsState>((set, get) => ({
  endpoints: {},
  isLoaded: false,
  isLoading: false,
  error: null,

  setEndpoints: (newEndpoints: EndpointApiResponse[]) => {
    const map = applyDiscoveredEndpoints(newEndpoints);
    set({ endpoints: map, isLoaded: true, isLoading: false, error: null });
  },

  fetchEndpoints: async () => {
    // If already loading, return current endpoints
    if (get().isLoading) return get().endpoints;

    set({ isLoading: true, error: null });
    try {
      const response = await axiosSec.get<{ endpoints: EndpointApiResponse[] }>('systemEndpoints');
      const list = response.data?.endpoints || [];
      const map = applyDiscoveredEndpoints(list);
      set({ endpoints: map, isLoaded: true, isLoading: false, error: null });
      return map;
    } catch (err: any) {
      const errMsg = err?.response?.data?.ErrorDescription || err.message || 'Failed to discover system endpoints';
      set({ isLoading: false, error: errMsg });
      throw err;
    }
  },
}));

/**
 * Direct helper to fetch endpoints without Zustand hook if outside React tree
 */
export const fetchSystemEndpoints = async (): Promise<Record<string, string>> => {
  const response = await axiosSec.get<{ endpoints: EndpointApiResponse[] }>('systemEndpoints');
  const list = response.data?.endpoints || [];
  return applyDiscoveredEndpoints(list);
};

/**
 * Check if a specific service was discovered in the cluster
 */
export const hasEndpoint = (serviceType: string): boolean => {
  return Boolean(useEndpointsStore.getState().endpoints[serviceType]);
};

export const getEndpointUri = (serviceType: string): string | undefined => {
  return useEndpointsStore.getState().endpoints[serviceType];
};
