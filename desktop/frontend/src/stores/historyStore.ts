import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DownloadHistoryItem } from '../api/types';
import {
  getDownloadHistory,
  deleteHistoryEntry,
  clearDownloadHistory,
} from '../api/client';

interface HistoryState {
  /** Cached items – hydrated from localStorage, refreshed from backend. */
  items: DownloadHistoryItem[];
  total: number;
  loading: boolean;
  error: string | null;

  /** Fetch full history from the backend (source of truth). */
  fetchHistory: () => Promise<void>;
  /** Remove a single entry. */
  removeEntry: (id: string) => Promise<void>;
  /** Wipe everything. */
  clearAll: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      total: 0,
      loading: false,
      error: null,

      fetchHistory: async () => {
        set({ loading: true, error: null });
        try {
          const resp = await getDownloadHistory();
          set({ items: resp.items, total: resp.total, loading: false });
        } catch (err) {
          set({
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load history',
          });
        }
      },

      removeEntry: async (id: string) => {
        try {
          await deleteHistoryEntry(id);
          set((s) => ({
            items: s.items.filter((i) => i.id !== id),
            total: Math.max(0, s.total - 1),
          }));
        } catch {
          // silent
        }
      },

      clearAll: async () => {
        try {
          await clearDownloadHistory();
          set({ items: [], total: 0 });
        } catch {
          // silent
        }
      },
    }),
    {
      name: 'streamrip-history',
      /** Only persist the items + total so the UI renders instantly on startup. */
      partialize: (state) => ({
        items: state.items,
        total: state.total,
      }),
    },
  ),
);
