import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { DownloadStatus } from '../api/types';
import { startDownload, getDownloadQueue, cancelDownload } from '../api/client';
import { wsManager } from '../api/websocket';

/** Fire a toast when a download transitions to a terminal or notable state. */
function notifyStatusChange(prev: DownloadStatus | undefined, next: DownloadStatus) {
  if (prev?.status === next.status) return;

  const label = next.title || next.url;

  switch (next.status) {
    case 'downloading':
      if (!prev || prev.status === 'queued') {
        toast('Download started', { description: label, duration: 3000 });
      }
      break;
    case 'completed':
      toast.success('Download complete', { description: label, duration: 5000 });
      break;
    case 'failed':
      toast.error('Download failed', {
        description: next.error || label,
        duration: 8000,
      });
      break;
    case 'cancelled':
      toast('Download cancelled', { description: label, duration: 3000 });
      break;
  }
}

interface DownloadState {
  downloads: DownloadStatus[];
  wsConnected: boolean;
  addDownload: (url: string) => Promise<string>;
  cancelDownload: (id: string) => Promise<void>;
  refreshQueue: () => Promise<void>;
  updateDownload: (update: DownloadStatus) => void;
  connectWs: () => void;
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: [],
      wsConnected: false,

      addDownload: async (url: string) => {
        const result = await startDownload(url);
        await get().refreshQueue();
        return result.id;
      },

      cancelDownload: async (id: string) => {
        await cancelDownload(id);
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id ? { ...d, status: 'cancelled' as const } : d,
          ),
        }));
      },

      refreshQueue: async () => {
        try {
          const { downloads } = await getDownloadQueue();
          set({ downloads });
        } catch {
          // silent
        }
      },

      updateDownload: (update: DownloadStatus) => {
        set((state) => {
          const existing = state.downloads.findIndex((d) => d.id === update.id);
          const prev = existing >= 0 ? state.downloads[existing] : undefined;

          notifyStatusChange(prev, update);

          if (existing >= 0) {
            const newDownloads = [...state.downloads];
            newDownloads[existing] = update;
            return { downloads: newDownloads };
          }
          return { downloads: [...state.downloads, update] };
        });
      },

      connectWs: () => {
        if (get().wsConnected) return;
        set({ wsConnected: true });
        wsManager.connect();
        wsManager.subscribe((msg) => {
          if (msg.type === 'download_update' && msg.data) {
            get().updateDownload(msg.data as unknown as DownloadStatus);
          }
        });
      },
    }),
    {
      name: 'streamrip-downloads',
      /** Persist only the download list – ws state is transient. */
      partialize: (state) => ({ downloads: state.downloads }),
    },
  ),
);
