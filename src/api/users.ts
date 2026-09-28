import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { axiosSec, axiosProv, axiosProvV2 } from './client';
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
      const { data } = await axiosProvV2.post<{ roles: ManagementRole[] }>('managementRole/0', payload);
      return data?.roles || [];
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
      const { data } = await axiosProv.get<{ managementPolicies: ManagementPolicy[] }>('managementPolicy');
      return data?.managementPolicies || [];
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
};

export const useCreateManagementPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateManagementPolicyPayload) => {
      const id = payload.id || `policy-${Date.now()}`;
      const { data } = await axiosProv.post(`managementPolicy/${id}`, { ...payload, id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managementPolicies'] });
    },
  });
};
