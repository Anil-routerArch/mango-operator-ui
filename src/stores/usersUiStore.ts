import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UsersUiState {
  mainTab: 'users' | 'policies';
  setMainTab: (tab: 'users' | 'policies') => void;
  selectedPolicyId: string;
  setSelectedPolicyId: (id: string) => void;
  policySubTab: 'overview' | 'permissions';
  setPolicySubTab: (tab: 'overview' | 'permissions') => void;
  userSubTab: 'profile' | 'scoped_access';
  setUserSubTab: (tab: 'profile' | 'scoped_access') => void;
}

export const useUsersUiStore = create<UsersUiState>()(
  persist(
    (set) => ({
      mainTab: 'users',
      setMainTab: (mainTab) => set({ mainTab }),
      selectedPolicyId: 'pol-net-op',
      setSelectedPolicyId: (selectedPolicyId) => set({ selectedPolicyId }),
      policySubTab: 'overview',
      setPolicySubTab: (policySubTab) => set({ policySubTab }),
      userSubTab: 'profile',
      setUserSubTab: (userSubTab) => set({ userSubTab }),
    }),
    {
      name: 'users_ui_store',
    }
  )
);
