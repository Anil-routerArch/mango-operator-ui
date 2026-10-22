import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { AUTH_EXPIRED_TOKEN_CODE, AUTH_INVALID_TOKEN_CODE, DEFAULT_TIMEOUT_MS } from './constants';

declare global {
  interface Window {
    _env_?: Record<string, string | undefined>;
  }
}

// 1. Resolve OWSEC & Optional Microservice Base URLs from Runtime Environment (window._env_) or Build-time (.env)
// Note: Only OWSEC requires a pre-configured URL to authenticate; all other microservices (OWPROV, OWGW, etc.)
// are dynamically discovered from OWSEC's /api/v1/systemEndpoints registry at runtime unless explicitly overridden.
export const getSecBaseUrl = (): string => {
  const raw = window._env_?.VITE_UCENTRALSEC_URL || import.meta.env?.VITE_UCENTRALSEC_URL || 'https://openwifi.wlan.local:16001';
  return `${raw.replace(/\/+$/, '')}/api/v1`;
};

export const getProvBaseUrl = (): string | undefined => {
  const raw = window._env_?.VITE_UCENTRALPROV_URL || import.meta.env?.VITE_UCENTRALPROV_URL;
  return raw ? `${raw.replace(/\/+$/, '')}/api/v1` : undefined;
};

export const getProvV2BaseUrl = (): string | undefined => {
  const raw = window._env_?.VITE_UCENTRALPROV_URL || import.meta.env?.VITE_UCENTRALPROV_URL;
  return raw ? `${raw.replace(/\/+$/, '')}/api/v2` : undefined;
};

export const getGwBaseUrl = (): string | undefined => {
  const raw = window._env_?.VITE_UCENTRALGW_URL || import.meta.env?.VITE_UCENTRALGW_URL;
  return raw ? `${raw.replace(/\/+$/, '')}/api/v1` : undefined;
};
export const getMduBaseUrl = (): string | undefined => {
  const raw = window._env_?.VITE_MANGO_MDU_URL || import.meta.env?.VITE_MANGO_MDU_URL;
  return raw ? `${raw.replace(/\/+$/, '')}/api/v1` : undefined;
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

// Mango MDU client (discovered dynamically from OWSEC systemEndpoints or optional VITE_MANGO_MDU_URL)
const initialMduBaseUrl = getMduBaseUrl();
export const axiosMdu: AxiosInstance = axios.create({
  ...defaultClientConfig,
  ...(initialMduBaseUrl ? { baseURL: initialMduBaseUrl } : {}),
});

// OWPROV API v1 and v2 clients (dynamically updated upon endpoint discovery from OWSEC systemEndpoints)
const initialProvBaseUrl = getProvBaseUrl();
export const axiosProv: AxiosInstance = axios.create({
  ...defaultClientConfig,
  ...(initialProvBaseUrl ? { baseURL: initialProvBaseUrl } : {}),
});
const initialProvV2BaseUrl = getProvV2BaseUrl();
export const axiosProvV2: AxiosInstance = axios.create({
  ...defaultClientConfig,
  ...(initialProvV2BaseUrl ? { baseURL: initialProvV2BaseUrl } : {}),
});

// OWGW client (dynamically updated upon endpoint discovery from OWSEC systemEndpoints)
const initialGwBaseUrl = getGwBaseUrl();
export const axiosGw: AxiosInstance = axios.create({
  ...defaultClientConfig,
  ...(initialGwBaseUrl ? { baseURL: initialGwBaseUrl } : {}),
});
export const axiosFms: AxiosInstance = axios.create(defaultClientConfig);
export const axiosSub: AxiosInstance = axios.create(defaultClientConfig);
export const axiosAnalytics: AxiosInstance = axios.create(defaultClientConfig);

// Core OpenWiFi clients whose authentication failures indicate session expiration
export const coreAxiosInstances: AxiosInstance[] = [
  axiosSec,
  axiosProv,
  axiosProvV2,
  axiosGw,
  axiosFms,
  axiosSub,
  axiosAnalytics,
];

// Registry of all managed clients
export const allAxiosInstances: AxiosInstance[] = [
  ...coreAxiosInstances,
  axiosMdu,
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

// Helper to identify unauthenticated login / MFA credential submissions
export const isAuthEndpoint = (url?: string, method?: string): boolean => {
  if (!url) return false;
  const isPost = !method || method.toLowerCase() === 'post';
  return isPost && url.includes('oauth2') && !url.includes('oauth2?me=true');
};

export const isLoginRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hash.includes('/login') ||
    window.location.pathname.includes('/login')
  );
};

/**
 * Cleanly terminates the local session and reloads the active application document.
 * Sets the hash to '#/login' so the reloaded document lands on the login page,
 * while window.location.reload() natively preserves the current URL prefix (root, subpath, reverse proxy).
 */
export const teardownSessionAndReload = () => {
  localStorage.removeItem('access_token');
  sessionStorage.removeItem('access_token');
  setApiToken(null);

  if (typeof window !== 'undefined' && window.location) {
    window.location.hash = '#/login';
    if (typeof window.location.reload === 'function') {
      window.location.reload();
    }
  }
};

const handleResponseError = (error: AxiosError<ApiErrorData>) => {
  if (error.response) {
    const { status, data } = error.response;
    const url = error.config?.url;
    const method = error.config?.method;

    // Never redirect on 401/403 from login or MFA endpoints, allowing the login form
    // to receive the rejected promise and display validation errors.
    if (isAuthEndpoint(url, method)) {
      return Promise.reject(error);
    }

    // 403 Forbidden with OpenWiFi Expired or Invalid token codes
    if (
      status === 403 &&
      (data?.ErrorCode === AUTH_EXPIRED_TOKEN_CODE || data?.ErrorCode === AUTH_INVALID_TOKEN_CODE)
    ) {
      if (!isLoginRoute()) {
        teardownSessionAndReload();
      }
    }

    // 401 Unauthorized handling on authenticated requests
    if (status === 401) {
      if (!isLoginRoute()) {
        teardownSessionAndReload();
      }
    }
  }

  return Promise.reject(error);
};

// Attach request interceptor to all instances (for auth token attachment)
allAxiosInstances.forEach((client) => {
  client.interceptors.request.use(attachAuthToken, (error) => Promise.reject(error));
});

// Attach response interceptor only to core OpenWiFi instances.
// Auxiliary microservices (such as axiosMdu) reject errors locally so service-specific
// failures do not terminate the entire OpenWiFi operator session.
coreAxiosInstances.forEach((client) => {
  client.interceptors.response.use(undefined, handleResponseError);
});
