import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Disc3,
  Inbox,
  RotateCcw,
} from 'lucide-react';
import { useDownloadStore } from '../stores/downloadStore';
import { wsManager } from '../api/websocket';
import type { DownloadStatus, MusicSource } from '../api/types';
import { SOURCE_COLORS, SOURCE_LABELS } from '../api/types';

const statusConfig = {
  queued: { icon: Clock, color: 'text-text-muted', bg: 'bg-text-muted/10', label: 'Queued' },
  downloading: { icon: Loader2, color: 'text-accent-primary', bg: 'bg-accent-primary/10', label: 'Downloading' },
  completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Completed' },
  failed: { icon: AlertCircle, color: 'text-error', bg: 'bg-error/10', label: 'Failed' },
  cancelled: { icon: X, color: 'text-text-muted', bg: 'bg-text-muted/10', label: 'Cancelled' },
};

function DownloadItem({ download }: { download: DownloadStatus }) {
  const cancel = useDownloadStore((s) => s.cancelDownload);
  const config = statusConfig[download.status];
  const Icon = config.icon;
  const sourceColor = SOURCE_COLORS[download.source as MusicSource] || '#6366f1';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass rounded-2xl p-4 group"
    >
      <div className="flex items-center gap-4">
        {/* Cover Art */}
        <div className="w-14 h-14 rounded-xl bg-bg-elevated shrink-0 overflow-hidden">
          {download.cover_url ? (
            <img
              src={download.cover_url}
              alt={download.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Disc3 size={20} className="text-text-muted/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-[13px] font-semibold text-text-primary truncate">
              {download.title}
            </h4>
            {download.source && (
              <span
                className="text-[9px] font-bold uppercase tracking-wider shrink-0"
                style={{ color: sourceColor }}
              >
                {SOURCE_LABELS[download.source as MusicSource] || download.source}
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-muted truncate mb-2">
            {download.artist}
          </p>

          {/* Progress Bar */}
          {download.status === 'downloading' && (
            <div className="space-y-1.5">
              <div className="relative h-1.5 bg-bg-hover rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full progress-glow"
                  initial={{ width: 0 }}
                  animate={{ width: `${download.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted truncate max-w-[60%]">
                  {download.current_track
                    ? `${download.completed_tracks}/${download.total_tracks} tracks — ${download.current_track}`
                    : download.total_tracks > 0
                      ? `${download.completed_tracks}/${download.total_tracks} tracks`
                      : 'Preparing...'
                  }
                </span>
                <span className="text-[10px] text-text-muted tabular-nums shrink-0">
                  {download.speed && <span>{download.speed}</span>}
                  {download.eta && <span className="ml-1.5">ETA {download.eta}</span>}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {download.status === 'downloading' && (
            <span className="text-[11px] text-accent-primary tabular-nums font-medium">
              {Math.round(download.progress)}%
            </span>
          )}
          <div className={`p-1.5 rounded-lg ${config.bg}`}>
            <Icon
              size={14}
              className={`${config.color} ${download.status === 'downloading' ? 'animate-spin' : ''}`}
            />
          </div>
          {(download.status === 'queued' || download.status === 'downloading') && (
            <button
              onClick={() => cancel(download.id)}
              className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function DownloadsPage() {
  const { downloads, refreshQueue, updateDownload } = useDownloadStore();

  useEffect(() => {
    refreshQueue();

    wsManager.connect();
    const unsub = wsManager.subscribe((msg) => {
      if (msg.type === 'download_update' && msg.data) {
        updateDownload(msg.data as DownloadStatus);
      }
    });

    const interval = setInterval(refreshQueue, 5000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [refreshQueue, updateDownload]);

  const active = downloads.filter(
    (d) => d.status === 'queued' || d.status === 'downloading',
  );
  const completed = downloads.filter((d) => d.status === 'completed');
  const failed = downloads.filter(
    (d) => d.status === 'failed' || d.status === 'cancelled',
  );

  return (
    <div className="h-full px-8 py-7">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary">
              Downloads
            </h1>
            <p className="text-[13px] text-text-muted mt-0.5">
              {downloads.length} total &middot; {active.length} active
            </p>
          </div>
          <button
            onClick={() => refreshQueue()}
            className="p-2.5 rounded-xl glass hover:bg-bg-hover transition-colors"
          >
            <RotateCcw size={15} className="text-text-muted" />
          </button>
        </div>
      </motion.div>

      {downloads.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-bg-surface flex items-center justify-center mb-6 border border-border-subtle">
            <Inbox size={28} className="text-text-muted/40" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-lg font-semibold text-text-secondary mb-2">
            No downloads yet
          </h3>
          <p className="text-[13px] text-text-muted max-w-sm">
            Paste a URL on the Home page and click Download to get started.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6 pb-8">
          {/* Active Downloads */}
          {active.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-3 px-1">
                Active
              </h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {active.map((d) => (
                    <DownloadItem key={d.id} download={d} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-3 px-1">
                Completed
              </h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {completed.map((d) => (
                    <DownloadItem key={d.id} download={d} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Failed */}
          {failed.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-3 px-1">
                Failed / Cancelled
              </h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {failed.map((d) => (
                    <DownloadItem key={d.id} download={d} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
