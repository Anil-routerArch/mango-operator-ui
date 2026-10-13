import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConfigurationUiState {
  mainTab: 'configurations' | 'profiles';
  setMainTab: (tab: 'configurations' | 'profiles') => void;
  selectedConfigId: string | null;
  setSelectedConfigId: (id: string | null) => void;
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;
  isCreatingConfig: boolean;
  setIsCreatingConfig: (isCreating: boolean) => void;
}

export const useConfigurationUiStore = create<ConfigurationUiState>()(
  persist(
    (set) => ({
      mainTab: 'configurations',
      setMainTab: (mainTab) => set({ mainTab }),
      selectedConfigId: null,
      setSelectedConfigId: (selectedConfigId) => set({ selectedConfigId }),
      selectedProfileId: null,
      setSelectedProfileId: (selectedProfileId) => set({ selectedProfileId }),
      isCreatingConfig: false,
      setIsCreatingConfig: (isCreatingConfig) => set({ isCreatingConfig }),
    }),
    {
      name: 'configuration_ui_store',
    }
  )
);

