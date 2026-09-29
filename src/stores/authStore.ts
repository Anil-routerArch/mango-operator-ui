import { create } from 'zustand';
import {
  axiosSec,
  setApiToken,
  fetchSystemEndpoints,
  getApiErrorMessage,
} from '@/api';
import type { User, LoginCredentials, LoginApiResponse } from '@/types/auth';

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  mfaChallenge: { uuid: string; method?: string } | null;

  // Lifecycle & Auth Actions
  initializeAuth: () => Promise<void>;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<boolean>;
  submitMfa: (answer: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<User | null>;
  clearError: () => void;

  // Role & Authorization Helpers
  isRoot: () => boolean;
  isAdmin: () => boolean;
}

const STORAGE_KEY = 'access_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  mfaChallenge: null,

  clearError: () => set({ error: null }),

  /**
   * Bootstraps the user session on application start.
   * Checks localStorage/sessionStorage, restores Bearer token headers,
   * and fetches profile + cluster endpoints in parallel.
   */
  initializeAuth: async () => {
    const savedToken =
      sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);

    if (!savedToken) {
      set({ isInitialized: true, isAuthenticated: false, token: null, user: null });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      setApiToken(savedToken);

      // Fetch user profile and cluster service endpoints in parallel
      const [profileRes] = await Promise.all([
        axiosSec.get<User>('oauth2?me=true'),
        fetchSystemEndpoints().catch((err) => {
          console.warn('System endpoints discovery notice during boot:', err);
          return {};
        }),
      ]);

      set({
        token: savedToken,
        user: profileRes.data,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch (err: any) {
      console.warn('Failed to restore active session:', err);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      setApiToken(null);
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /**
   * Executes OWSEC OAuth2 Login Flow.
   */
  login: async (credentials: LoginCredentials, rememberMe = true): Promise<boolean> => {
    set({ isLoading: true, error: null, mfaChallenge: null });

    try {
      const { data } = await axiosSec.post<LoginApiResponse>('oauth2', credentials);

      // Check if MFA Challenge is required
      if (data.uuid) {
        set({
          mfaChallenge: { uuid: data.uuid, method: data.method },
          isLoading: false,
        });
        return false; // MFA pending
      }

      if (!data.access_token) {
        throw new Error('No access token received from authentication server.');
      }

      const token = data.access_token;

      // Propagate token to Axios instances to fetch profile and endpoints
      setApiToken(token);

      // Concurrently fetch profile and discover endpoints
      const [profileRes] = await Promise.all([
        axiosSec.get<User>('oauth2?me=true'),
        fetchSystemEndpoints().catch(() => ({})),
      ]);

      // Only persist to storage once profile retrieval succeeds
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, token);
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, token);
        localStorage.removeItem(STORAGE_KEY);
      }

      set({
        token,
        user: profileRes.data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        mfaChallenge: null,
      });

      return true;
    } catch (err: any) {
      // Deterministically clean up any partially attached token or storage on failure
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      setApiToken(null);

      const message = getApiErrorMessage(err, 'Invalid credentials. Please try again.');
      set({
        token: null,
        user: null,
        isLoading: false,
        error: message,
        isAuthenticated: false,
      });
      throw new Error(message);
    }
  },

  /**
   * Completes an MFA challenge if required during login
   */
  submitMfa: async (answer: string, rememberMe = true): Promise<boolean> => {
    const { mfaChallenge } = get();
    if (!mfaChallenge?.uuid) {
      throw new Error('No active MFA challenge found.');
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await axiosSec.post<LoginApiResponse>(
        'oauth2?completeMFAChallenge=true',
        { uuid: mfaChallenge.uuid, answer }
      );

      if (!data.access_token) {
        throw new Error('Invalid MFA code. Please try again.');
      }

      const token = data.access_token;

      // Propagate token to Axios instances to fetch profile and endpoints
      setApiToken(token);

      const [profileRes] = await Promise.all([
        axiosSec.get<User>('oauth2?me=true'),
        fetchSystemEndpoints().catch(() => ({})),
      ]);

      // Only persist to storage once profile retrieval succeeds
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, token);
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, token);
        localStorage.removeItem(STORAGE_KEY);
      }

      set({
        token,
        user: profileRes.data,
        isAuthenticated: true,
        isLoading: false,
        mfaChallenge: null,
        error: null,
      });

      return true;
    } catch (err: any) {
      // Deterministically clean up any partially attached token or storage on failure
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      setApiToken(null);

      const message = getApiErrorMessage(err, 'MFA verification failed.');
      set({
        token: null,
        user: null,
        isLoading: false,
        error: message,
        isAuthenticated: false,
      });
      throw new Error(message);
    }
  },

  /**
   * Terminates the session in OWSEC and clears local state.
   */
  logout: async () => {
    const { token } = get();
    set({ isLoading: true });

    try {
      if (token) {
        await axiosSec.delete(`oauth2/${token}`).catch(() => {});
      }
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      setApiToken(null);
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        mfaChallenge: null,
        error: null,
      });
    }
  },

  /**
   * Refreshes the currently logged in user profile.
   */
  fetchProfile: async () => {
    try {
      const { data } = await axiosSec.get<User>('oauth2?me=true');
      set({ user: data });
      return data;
    } catch (err) {
      console.warn('Failed to refetch user profile:', err);
      return null;
    }
  },

  // Role Checks
  isRoot: () => get().user?.userRole === 'root',
  isAdmin: () => {
    const role = get().user?.userRole;
    return role === 'root' || role === 'admin';
  },
}));
