import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { AUTH_EXPIRED_TOKEN_CODE, AUTH_INVALID_TOKEN_CODE, DEFAULT_TIMEOUT_MS } from './constants';

declare global {
  interface Window {
    _env_?: Record<string, string | undefined>;
  }
}

// 1. Resolve OWSEC & OWPROV Base URLs from Runtime Environment (window._env_) or Build-time (.env)
export const getSecBaseUrl = (): string => {
  const raw = window._env_?.VITE_UCENTRALSEC_URL || import.meta.env.VITE_UCENTRALSEC_URL || 'https://openwifi.wlan.local:16001';
  return `${raw.replace(/\/+$/, '')}/api/v1`;
};

export const getProvBaseUrl = (): string => {
  const raw = window._env_?.VITE_UCENTRALPROV_URL || import.meta.env.VITE_UCENTRALPROV_URL || 'https://openwifi.wlan.local:16005';
  return `${raw.replace(/\/+$/, '')}/api/v1`;
};

export const getProvV2BaseUrl = (): string => {
  const raw = window._env_?.VITE_UCENTRALPROV_URL || import.meta.env.VITE_UCENTRALPROV_URL || 'https://openwifi.wlan.local:16005';
  return `${raw.replace(/\/+$/, '')}/api/v2`;
};

export const getMduBaseUrl = (): string => {
  const raw = window._env_?.VITE_MANGO_MDU_URL || import.meta.env.VITE_MANGO_MDU_URL || 'https://openwifi.wlan.local:16010';
  return `${raw.replace(/\/+$/, '')}/api/v1`;
};

// 2. Base Configuration for all OpenWiFi & Mango Clients
export const defaultClientConfig = {
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

// 3. Instantiate Axios Clients
// OWSEC client (only one with pre-configured baseURL for login)
export const axiosSec: AxiosInstance = axios.create({
  ...defaultClientConfig,
  baseURL: getSecBaseUrl(),
});

// Mango MDU client (discovered dynamically from OWSEC systemEndpoints or default VITE_MANGO_MDU_URL)
export const axiosMdu: AxiosInstance = axios.create({
  ...defaultClientConfig,
  baseURL: getMduBaseUrl(),
});

// OWPROV API v1 and v2 clients (dynamically updated upon endpoint discovery or defaulting to 16005)
export const axiosProv: AxiosInstance = axios.create({
  ...defaultClientConfig,
  baseURL: getProvBaseUrl(),
});
export const axiosProvV2: AxiosInstance = axios.create({
  ...defaultClientConfig,
  baseURL: getProvV2BaseUrl(),
});

// Additional OpenWiFi Services (all sharing the same uniform configuration)
export const axiosGw: AxiosInstance = axios.create(defaultClientConfig);
export const axiosFms: AxiosInstance = axios.create(defaultClientConfig);
export const axiosSub: AxiosInstance = axios.create(defaultClientConfig);
export const axiosAnalytics: AxiosInstance = axios.create(defaultClientConfig);

// Registry of all managed clients
export const allAxiosInstances: AxiosInstance[] = [
  axiosSec,
  axiosMdu,
  axiosProv,
  axiosProvV2,
  axiosGw,
  axiosFms,
  axiosSub,
  axiosAnalytics,
];

// 3. Centralized Token Propagation
export const setApiToken = (token: string | null) => {
  allAxiosInstances.forEach((client) => {
    if (token) {
      client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete client.defaults.headers.common.Authorization;
    }
  });
};

// 4. Request Interceptor: Attach stored token if not already explicitly present
const attachAuthToken = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  if (!config.headers.Authorization) {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

// 5. Response Interceptor: Handle 401/403 Token Expiration & Redirection
interface ApiErrorData {
  ErrorCode?: number;
  ErrorDescription?: string;
  error?: string;
}

const handleResponseError = (error: AxiosError<ApiErrorData>) => {
  if (error.response) {
    const { status, data } = error.response;

    // 403 Forbidden with OpenWiFi Expired or Invalid token codes
    if (
      status === 403 &&
      (data?.ErrorCode === AUTH_EXPIRED_TOKEN_CODE || data?.ErrorCode === AUTH_INVALID_TOKEN_CODE)
    ) {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      setApiToken(null);
      
      // Redirect to login preserving hash routing if present
      if (!window.location.href.includes('/login')) {
        window.location.href = '/#/login';
      }
    }

    // 401 Unauthorized handling
    if (status === 401) {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      setApiToken(null);
      if (!window.location.href.includes('/login')) {
        window.location.href = '/#/login';
      }
    }
  }

  return Promise.reject(error);
};

// Attach interceptors to all instances
allAxiosInstances.forEach((client) => {
  client.interceptors.request.use(attachAuthToken, (error) => Promise.reject(error));
  client.interceptors.response.use(undefined, handleResponseError);
});
