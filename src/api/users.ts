import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { axiosSec, axiosProv, axiosProvV2, getSecBaseUrl } from './client';
import type { User, CreateUserPayload, UpdateUserPayload } from '@/types/user';
import type {
  ManagementRole,
  ManagementPolicy,
  CreateManagementRolePayload,
  UpdateManagementRolePayload,
  CreateManagementPolicyPayload,
  EntityInfo,
  VenueInfo,
} from '@/types/managementRole';

// ==========================================
// 1. AVATAR FETCHING & CONVERSION
// ==========================================
const getAvatarPromises = (userList: User[], queryClient: QueryClient) => {
  return userList.map(async (user) => {
    if (user.avatar && user.avatar !== '' && user.avatar !== '0') {
      const cachedAvatar = queryClient.getQueryData<string>(['avatar', user.id, user.avatar]);
      if (cachedAvatar) return cachedAvatar;

      try {
        const response = await axiosSec.get(`avatar/${user.id}?cache=${user.avatar}`, {
          responseType: 'arraybuffer',
        });
        const uint8 = new Uint8Array(response.data);
        let binary = '';
        for (let i = 0; i < uint8.byteLength; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64 = `data:image/png;base64,${btoa(binary)}`;
        queryClient.setQueryData(['avatar', user.id, user.avatar], base64);
        return base64;
      } catch (err) {
        console.warn(`Failed to fetch avatar for user ${user.id}:`, err);
        return '';
      }
    }
    return '';
  });
};

// ==========================================
// 2. USERS BATCH FETCHING (OWSEC: Port 16001)
// ==========================================
export const getBatchUsers = async (offset = 0, limit = 500): Promise<User[]> => {
  const { data } = await axiosSec.get<{ users: User[] }>(
    `users?offset=${offset}&limit=${limit}&withExtendedInfo=true`
  );
  return data?.users || [];
};

export const getAllUsers = async (queryClient: QueryClient): Promise<User[]> => {
  let allUsers: User[] = [];
  let offset = 0;
  const limit = 500;
  let lastLength = 0;

  do {
    const batch = await getBatchUsers(offset, limit);
    allUsers = [...allUsers, ...batch];
    offset += limit;
    lastLength = batch.length;
  } while (lastLength === limit);

  // Concurrently resolve avatars
  const avatarResults = await Promise.allSettled(getAvatarPromises(allUsers, queryClient));
  const avatars = avatarResults.map((r) => (r.status === 'fulfilled' ? r.value : ''));

  return allUsers.map((u, i) => ({
    ...u,
    avatar: avatars[i] || u.avatar || '',
  }));
};

// ==========================================
// 3. REACT QUERY HOOKS FOR USERS
// ==========================================
export const useGetUsers = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['users'],
    queryFn: () => getAllUsers(queryClient),
    staleTime: 30 * 1000,
    retry: 1,
  });
};

export const useGetUser = (id?: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID required');
      const { data } = await axiosSec.get<User>(`user/${id}?withExtendedInfo=true`);
      return data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const url = `user/0${payload.emailValidation ? '?email_verification=true' : ''}`;
      const { data } = await axiosSec.post(url, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateUserPayload) => {
      const { id, ...body } = payload;
      const { data } = await axiosSec.put(`user/${id}`, body);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, suspended }: { id: string; suspended: boolean }) => {
      const { data } = await axiosSec.put(`user/${id}`, { suspended });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await axiosSec.delete(`user/${userId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// ==========================================
// 4. MANAGEMENT ROLES (SCOPED ACCESS: OWPROV Port 16005)
// ==========================================
export const useGetManagementRoles = (userId?: string) => {
  return useQuery({
    queryKey: ['managementRoles', userId],
    queryFn: async () => {
      const { data } = await axiosProv.get<{ roles: ManagementRole[] }>('managementRole', {
        params: userId ? { userId } : undefined,
      });
      return data?.roles || [];
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
};

export const useCreateManagementRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateManagementRolePayload) => {
      const { data } = await axiosProvV2.post<any>('managementRole/0', payload);
      if (Array.isArray(data?.roles)) {
        return data.roles as ManagementRole[];
      }
      if (Array.isArray(data)) {
        return data as ManagementRole[];
      }
      return data ? [data as ManagementRole] : [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managementRoles'] });
    },
  });
};

export const useUpdateManagementRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateManagementRolePayload) => {
      const { data } = await axiosProvV2.put<ManagementRole>(`managementRole/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managementRoles'] });
    },
  });
};

export const useDeleteManagementRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const { data } = await axiosProvV2.delete(`managementRole/${roleId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managementRoles'] });
    },
  });
};

// ==========================================
// 5. ENTITIES & VENUES (OWPROV Port 16005)
// ==========================================
export const useGetEntities = () => {
  return useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const { data } = await axiosProv.get<{ entities: EntityInfo[] }>('entity');
      return data?.entities || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useGetVenues = () => {
  return useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const { data } = await axiosProv.get<{ venues: VenueInfo[] }>('venue');
      return data?.venues || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// ==========================================
// 6. MANAGEMENT POLICIES (OWPROV Port 16005)
// ==========================================
export const useGetManagementPolicies = () => {
  return useQuery({
    queryKey: ['managementPolicies'],
    queryFn: async () => {
      const { data } = await axiosProv.get<any>('managementPolicy');
      if (Array.isArray(data?.managementPolicies)) {
        return data.managementPolicies as ManagementPolicy[];
      }
      if (Array.isArray(data)) {
        return data as ManagementPolicy[];
      }
      return [];
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
};

export const useCreateManagementPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateManagementPolicyPayload) => {
      const id = payload.id || crypto.randomUUID();
      const { data } = await axiosProv.post(`managementPolicy/${id}`, {
        entity: '',
        venue: '',
        ...payload,
        id,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managementPolicies'] });
    },
  });
};

export const useUpdateManagementPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ManagementPolicy> & { id: string }) => {
      const { data } = await axiosProv.put(`managementPolicy/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managementPolicies'] });
    },
  });
};

export const useDeleteManagementPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosProv.delete(`managementPolicy/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managementPolicies'] });
    },
  });
};

// ==========================================
// 7. SECURITY REQUIREMENTS & PASSWORD POLICY (OWSEC: TC-USR-007)
// ==========================================
export interface SecurityRequirements {
  passwordPattern?: string;
  accessPolicy?: string;
  passwordPolicy?: string;
}

export interface ApiRequirements {
  passwordPattern: string | null;
  passwordPolicyLink: string;
  accessPolicyLink: string;
  isLoaded: boolean;
  isLoading: boolean;
}

export const DEFAULT_PASSWORD_PATTERN =
  '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[\\{\\}\\(\\)~_\\+\\|\\\\\\[\\]\\;\\:\\<\\>\\.\\,\\/\\?\\"\\\'\\`\\=#?!@$%^&*-]).{8,}$';

export const useGetRequirements = () => {
  return useQuery<SecurityRequirements>({
    queryKey: ['securityRequirements'],
    queryFn: async () => {
      const { data } = await axiosSec.post('oauth2?requirements=true', {});
      return data;
    },
    staleTime: Infinity,
    retry: 1,
  });
};

export const useApiRequirements = (): ApiRequirements => {
  const { data: requirements, isLoading, isSuccess } = useGetRequirements();

  return useMemo(() => {
    const secBase = getSecBaseUrl().split('/api/v1')[0];

    const resolveLink = (isAccess: boolean, apiResult?: string): string => {
      const defaultPath = isAccess ? '/wwwassets/access_policy.html' : '/wwwassets/password_policy.html';
      if (!apiResult) return `${secBase}${defaultPath}`;
      if (apiResult.startsWith('http://') || apiResult.startsWith('https://')) return apiResult;

      // Sanitize filesystem paths like $OWSEC_ROOT/persist/wwwassets/... to web route /wwwassets/...
      const wwwAssetsIdx = apiResult.indexOf('wwwassets');
      if (wwwAssetsIdx !== -1) {
        return `${secBase}/${apiResult.substring(wwwAssetsIdx)}`;
      }

      const cleanPath = apiResult.startsWith('/') ? apiResult : `/${apiResult}`;
      return `${secBase}${cleanPath}`;
    };

    return {
      passwordPattern: requirements?.passwordPattern ?? null,
      passwordPolicyLink: resolveLink(false, requirements?.passwordPolicy),
      accessPolicyLink: resolveLink(true, requirements?.accessPolicy),
      isLoaded: isSuccess && requirements !== undefined,
      isLoading,
    };
  }, [requirements, isLoading, isSuccess]);
};

export const testPasswordPattern = (password: string, pattern?: string | null): boolean => {
  if (!password) return false;
  const regexStr = pattern || DEFAULT_PASSWORD_PATTERN;
  try {
    const regex = new RegExp(regexStr);
    return regex.test(password);
  } catch (err) {
    console.warn('Invalid regex in passwordPattern, falling back to default:', err);
    try {
      return new RegExp(DEFAULT_PASSWORD_PATTERN).test(password);
    } catch {
      return password.length >= 8;
    }
  }
};

export const getPasswordRequirementsDescription = (pattern?: string | null): string => {
  const raw = pattern || DEFAULT_PASSWORD_PATTERN;
  let minLen = 8;
  const lenMatch = raw.match(/\{(\d+),/);
  if (lenMatch && lenMatch[1]) {
    minLen = parseInt(lenMatch[1], 10);
  }

  const parts: string[] = [`Min ${minLen} chars`];
  if (raw.includes('[A-Z]')) parts.push('uppercase');
  if (raw.includes('[a-z]')) parts.push('lowercase');
  if (raw.includes('[0-9]')) parts.push('number');
  if (raw.includes('?') || raw.includes('!') || raw.includes('@') || raw.includes('$')) {
    parts.push('symbol');
  }

  if (parts.length <= 1) return `Min ${minLen} characters`;
  const last = parts.pop();
  return `${parts.join(', ')} & ${last}`;
};

export interface PasswordPolicyRule {
  id: string;
  label: string;
  detail: string;
  test: (password: string) => boolean;
}

export const parsePasswordPolicy = (pattern?: string | null): PasswordPolicyRule[] => {
  const raw = pattern || DEFAULT_PASSWORD_PATTERN;
  const rules: PasswordPolicyRule[] = [];

  let minLen = 8;
  const lenMatch = raw.match(/\{(\d+),/);
  if (lenMatch && lenMatch[1]) {
    minLen = parseInt(lenMatch[1], 10);
  }
  rules.push({
    id: 'length',
    label: `Minimum length of ${minLen} characters`,
    detail: `Must contain at least ${minLen} characters in total`,
    test: (pw) => pw.length >= minLen,
  });

  if (raw.includes('[A-Z]')) {
    rules.push({
      id: 'uppercase',
      label: 'At least one uppercase letter (A–Z)',
      detail: 'Must contain an uppercase Latin letter (A–Z)',
      test: (pw) => /[A-Z]/.test(pw),
    });
  }

  if (raw.includes('[a-z]')) {
    rules.push({
      id: 'lowercase',
      label: 'At least one lowercase letter (a–z)',
      detail: 'Must contain a lowercase Latin letter (a–z)',
      test: (pw) => /[a-z]/.test(pw),
    });
  }

  if (raw.includes('[0-9]') || raw.includes('\\d')) {
    rules.push({
      id: 'number',
      label: 'At least one number (0–9)',
      detail: 'Must contain at least one numeric digit (0–9)',
      test: (pw) => /[0-9]/.test(pw),
    });
  }

  if (
    raw.includes('?') ||
    raw.includes('!') ||
    raw.includes('@') ||
    raw.includes('$') ||
    raw.includes('^') ||
    raw.includes('&')
  ) {
    rules.push({
      id: 'symbol',
      label: 'At least one special character',
      detail: 'Allowed symbols: ! @ # $ % ^ & * - _ + = ~ ( ) { } [ ] : ; < > . , / ?',
      test: (pw) => /[#?!@$%^&*\-_+=\~(){}[\]:;<>,.?/\\|`'"]/.test(pw),
    });
  }

  return rules;
};
