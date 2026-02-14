import { create } from 'zustand';
import type { SearchResultItem, MusicSource, MediaType } from '../api/types';
import { search } from '../api/client';

interface SearchState {
  query: string;
  source: MusicSource;
  mediaType: MediaType;
  results: SearchResultItem[];
  loading: boolean;
  error: string | null;
  setQuery: (q: string) => void;
  setSource: (s: MusicSource) => void;
  setMediaType: (t: MediaType) => void;
  performSearch: () => Promise<void>;
  clear: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  source: 'qobuz',
  mediaType: 'album',
  results: [],
  loading: false,
  error: null,

  setQuery: (query) => set({ query }),
  setSource: (source) => set({ source }),
  setMediaType: (mediaType) => set({ mediaType }),

  performSearch: async () => {
    const { query, source, mediaType } = get();
    if (!query.trim()) return;

    set({ loading: true, error: null });
    try {
      const resp = await search(source, mediaType, query);
      set({ results: resp.results, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Search failed',
      });
    }
  },

  clear: () => set({ query: '', results: [], error: null }),
}));
