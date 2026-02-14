import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WishlistItem } from '../api/types';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from '../api/client';

interface WishlistState {
  items: WishlistItem[];
  total: number;
  loading: boolean;
  error: string | null;

  fetchWishlist: () => Promise<void>;
  addItem: (item: {
    url: string;
    title?: string;
    artist?: string;
    cover_url?: string | null;
    source?: string;
    media_type?: string;
    year?: string | null;
  }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  isInWishlist: (url: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      loading: false,
      error: null,

      fetchWishlist: async () => {
        set({ loading: true, error: null });
        try {
          const resp = await getWishlist();
          set({ items: resp.items, total: resp.total, loading: false });
        } catch (err) {
          set({
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load wishlist',
          });
        }
      },

      addItem: async (item) => {
        try {
          const stored = await addToWishlist(item);
          set((s) => ({
            items: [stored, ...s.items],
            total: s.total + 1,
          }));
        } catch {
          // silent
        }
      },

      removeItem: async (id: string) => {
        try {
          await removeFromWishlist(id);
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
          await clearWishlist();
          set({ items: [], total: 0 });
        } catch {
          // silent
        }
      },

      isInWishlist: (url: string) => {
        return get().items.some((i) => i.url === url);
      },
    }),
    {
      name: 'streamrip-wishlist',
      partialize: (state) => ({
        items: state.items,
        total: state.total,
      }),
    },
  ),
);
