import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Disc3,
  Clock,
  Music4,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  FolderOpen,
  Bookmark,
} from 'lucide-react';
import { useMetadataStore } from '../../stores/metadataStore';
import { useDownloadStore } from '../../stores/downloadStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import type { MusicSource } from '../../api/types';
import { SOURCE_COLORS, SOURCE_LABELS } from '../../api/types';

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackPreview() {
  const { data, source } = useMetadataStore();
  const url = useMetadataStore((s) => s.url);
  const addDownload = useDownloadStore((s) => s.addDownload);
  const connectWs = useDownloadStore((s) => s.connectWs);
  const downloads = useDownloadStore((s) => s.downloads);
  const { addItem, removeItem, isInWishlist, items: wishlistItems } = useWishlistStore();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { connectWs(); }, [connectWs]);

  if (!data?.track) return null;

  const track = data.track;
  const album = data.album;
  const coverSrc = track.covers.original || track.covers.large;
  const sourceColor = SOURCE_COLORS[source as MusicSource] || '#6366f1';

  const activeDownload = downloads.find((d) => d.url === url);
  const hasActiveDownload = activeDownload && activeDownload.status !== 'cancelled';
  const isCompleted = activeDownload?.status === 'completed';
  const isFailed = activeDownload?.status === 'failed';

  const handleDownload = async () => {
    setDownloading(true);
    try { await addDownload(url); } finally { setDownloading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {coverSrc && (
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none overflow-hidden opacity-[0.12] blur-[100px] -z-10">
          <img src={coverSrc} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
        <div className="flex gap-7">
          {/* Cover Art */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="w-[200px] shrink-0"
          >
            <div className="relative group">
              {coverSrc ? (
                <img
                  src={coverSrc}
                  alt={track.title}
                  className="w-full aspect-square rounded-2xl object-cover glow-cover"
                />
              ) : (
                <div className="w-full aspect-square rounded-2xl bg-bg-elevated flex items-center justify-center">
                  <Disc3 size={48} className="text-text-muted/30" />
                </div>
              )}
              {/* Single track indicator */}
              <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Music4 size={18} className="text-white" />
              </div>
            </div>
          </motion.div>

          {/* Track Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              {/* Badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2 mb-3"
              >
                {source && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border"
                    style={{ color: sourceColor, borderColor: `${sourceColor}30`, background: `${sourceColor}12` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: sourceColor }} />
                    {SOURCE_LABELS[source as MusicSource] || source}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide bg-accent-primary/10 text-accent-hover border border-accent-primary/20">
                  <Sparkles size={11} />
                  {track.quality.label}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-bg-elevated text-text-muted border border-border-subtle">
                  Single Track
                </span>
                {track.explicit && (
                  <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-error/10 text-error border border-error/20">
                    EXPLICIT
                  </span>
                )}
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-2xl font-bold text-text-primary leading-tight mb-1.5"
              >
                {track.title}
              </motion.h2>

              {/* Artist */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-[15px] text-text-secondary font-medium mb-4"
              >
                {track.artist}
              </motion.p>

              {/* Meta Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-x-6 gap-y-2"
              >
                {album && (
                  <div className="flex items-center gap-2">
                    <Disc3 size={12} className="text-text-muted" />
                    <span className="text-[12px] text-text-muted truncate">
                      {album.title}
                    </span>
                  </div>
                )}
                {track.year && track.year !== 'Unknown' && (
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-text-muted" />
                    <span className="text-[12px] text-text-muted">{track.year}</span>
                  </div>
                )}
                {track.duration && (
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-text-muted" />
                    <span className="text-[12px] text-text-muted">{formatDuration(track.duration)}</span>
                  </div>
                )}
                {track.genre.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Music4 size={12} className="text-text-muted" />
                    <span className="text-[12px] text-text-muted truncate">{track.genre.join(', ')}</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Download Button / Progress */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-5"
            >
              <AnimatePresence mode="wait">
                {hasActiveDownload ? (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-3"
                  >
                    <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isCompleted ? 'bg-emerald-400' : isFailed ? 'bg-error' : 'bg-gradient-to-r from-accent-primary to-accent-secondary'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(activeDownload.progress, isCompleted ? 100 : 0)}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px]">
                        {isCompleted ? (
                          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <CheckCircle2 size={13} /> Download complete
                          </span>
                        ) : isFailed ? (
                          <span className="flex items-center gap-1.5 text-error">
                            <AlertCircle size={13} /> {activeDownload.error || 'Download failed'}
                          </span>
                        ) : (
                          <span className="text-text-secondary">Downloading...</span>
                        )}
                      </span>
                      <span className="text-[11px] text-text-muted tabular-nums">
                        {!isCompleted && !isFailed && (
                          <>
                            {activeDownload.speed && <span>{activeDownload.speed}</span>}
                            {activeDownload.eta && <span className="ml-2">ETA {activeDownload.eta}</span>}
                            {!activeDownload.speed && !activeDownload.eta && <span>{Math.round(activeDownload.progress)}%</span>}
                          </>
                        )}
                      </span>
                    </div>
                    {(isCompleted || isFailed) && (
                      <div className="flex items-center gap-2 mt-1">
                        {isFailed && (
                          <button onClick={handleDownload} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-error/10 text-error text-[12px] font-semibold hover:bg-error/20 transition-colors">
                            <RotateCcw size={13} /> Retry
                          </button>
                        )}
                        {isCompleted && activeDownload.download_path && (
                          <button
                            onClick={() => {
                              const electron = (window as unknown as { electron?: { openFolder: (p: string) => void } }).electron;
                              electron?.openFolder(activeDownload.download_path!);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400/10 text-emerald-400 text-[12px] font-semibold hover:bg-emerald-400/20 transition-colors"
                          >
                            <FolderOpen size={13} /> Open Folder
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2"
                  >
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-[13px] font-semibold hover:shadow-lg hover:shadow-accent-primary/25 active:scale-[0.97] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                      {downloading ? 'Starting...' : 'Download Track'}
                    </button>
                    <button
                      onClick={async () => {
                        const saved = isInWishlist(url);
                        if (saved) {
                          const existing = wishlistItems.find((i) => i.url === url);
                          if (existing) await removeItem(existing.id);
                        } else {
                          await addItem({
                            url,
                            title: track.title,
                            artist: track.artist,
                            cover_url: track.covers.large || track.covers.original || null,
                            source: source || undefined,
                            media_type: 'track',
                            year: track.year && track.year !== 'Unknown' ? track.year : null,
                          });
                        }
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                        isInWishlist(url)
                          ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/25'
                          : 'glass text-text-muted hover:text-text-primary hover:bg-bg-hover/60'
                      }`}
                      title={isInWishlist(url) ? 'Remove from saved' : 'Save for later'}
                    >
                      <Bookmark size={15} fill={isInWishlist(url) ? 'currentColor' : 'none'} />
                      {isInWishlist(url) ? 'Saved' : 'Save'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
