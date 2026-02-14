import { create } from 'zustand';
import type { MetadataResponse } from '../api/types';
import { fetchMetadata, parseUrl } from '../api/client';

interface MetadataState {
  url: string;
  loading: boolean;
  error: string | null;
  data: MetadataResponse | null;
  source: string | null;
  setUrl: (url: string) => void;
  fetch: (url: string) => Promise<void>;
  clear: () => void;
}

export const useMetadataStore = create<MetadataState>((set) => ({
  url: '',
  loading: false,
  error: null,
  data: null,
  source: null,

  setUrl: (url) => set({ url }),

  fetch: async (url: string) => {
    set({ loading: true, error: null, url });

    try {
      const parsed = await parseUrl(url);
      if (!parsed.valid) {
        set({ loading: false, error: parsed.error || 'Invalid URL' });
        return;
      }
      set({ source: parsed.source });

      const metadata = await fetchMetadata(url);
      set({ data: metadata, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch metadata';
      set({ loading: false, error: message });
    }
  },

  clear: () => set({ url: '', data: null, error: null, source: null, loading: false }),
}));
