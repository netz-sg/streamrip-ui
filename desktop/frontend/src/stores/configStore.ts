import { create } from 'zustand';
import { toast } from 'sonner';
import type { AppConfig } from '../api/types';
import { getConfig, updateConfig } from '../api/client';

interface ConfigState {
  config: AppConfig | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  loadConfig: () => Promise<void>;
  saveConfig: (updates: Partial<AppConfig>) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  loading: false,
  saving: false,
  error: null,

  loadConfig: async () => {
    set({ loading: true });
    try {
      const config = await getConfig();
      set({ config, loading: false });
    } catch {
      set({ loading: false, error: 'Failed to load config' });
    }
  },

  saveConfig: async (updates) => {
    set({ saving: true });
    try {
      await updateConfig(updates);
      const config = await getConfig();
      set({ config, saving: false });
      toast.success('Settings saved');
    } catch {
      set({ saving: false, error: 'Failed to save config' });
      toast.error('Failed to save settings');
    }
  },
}));
