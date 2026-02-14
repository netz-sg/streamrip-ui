import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  ListMusic,
  Clock,
  Hash,
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
import type { TrackItem, MusicSource } from '../../api/types';
import { SOURCE_COLORS, SOURCE_LABELS } from '../../api/types';

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotalDuration(tracks: TrackItem[]): string {
  const total = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  if (total <= 0) return '';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

type TrackStatus = 'idle' | 'pending' | 'downloading' | 'completed';

function TrackRow({
  track,
  index,
  status = 'idle',
}: {
  track: TrackItem;
  index: number;
  status?: TrackStatus;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.02 * index, duration: 0.3 }}
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-200 cursor-default ${
        status === 'downloading' ? 'bg-accent-primary/6' : 'hover:bg-bg-hover/40'
      }`}
    >
      <span className="w-8 flex items-center justify-center shrink-0">
        {status === 'completed' ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </motion.div>
        ) : status === 'downloading' ? (
          <Loader2 size={14} className="text-accent-primary animate-spin" />
        ) : (
          <span className="text-[12px] text-text-muted font-medium tabular-nums text-right w-full">
            {track.track_number}
          </span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium truncate leading-tight ${
          status === 'completed' ? 'text-text-secondary' : status === 'downloading' ? 'text-accent-hover' : 'text-text-primary'
        }`}>
          {track.title}
          {track.explicit && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold bg-text-muted/20 text-text-muted align-middle">
              E
            </span>
          )}
        </p>
        <p className="text-[11px] text-text-muted truncate mt-0.5">{track.artist}</p>
      </div>
      <span className="text-[12px] text-text-muted tabular-nums shrink-0">
        {formatDuration(track.duration)}
      </span>
    </motion.div>
  );
}

export default function PlaylistPreview() {
  const { data, source } = useMetadataStore();
  const url = useMetadataStore((s) => s.url);
  const addDownload = useDownloadStore((s) => s.addDownload);
  const connectWs = useDownloadStore((s) => s.connectWs);
  const downloads = useDownloadStore((s) => s.downloads);
  const { addItem, removeItem, isInWishlist, items: wishlistItems } = useWishlistStore();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { connectWs(); }, [connectWs]);

  // Playlist data can come from data.playlist (dedicated) or data.album (fallback)
  const playlist = data?.playlist;
  const albumFallback = data?.type === 'playlist' ? data?.album : null;

  if (!playlist && !albumFallback) return null;

  const title = playlist?.name || albumFallback?.title || 'Unknown Playlist';
  const tracks = playlist?.tracks || albumFallback?.tracks || [];
  const trackTotal = playlist?.track_total || albumFallback?.track_total || tracks.length;
  const covers = playlist?.covers || albumFallback?.covers;
  const coverSrc = covers?.original || covers?.large || covers?.small;
  const sourceColor = SOURCE_COLORS[source as MusicSource] || '#6366f1';

  const activeDownload = downloads.find((d) => d.url === url);
  const hasActiveDownload = activeDownload && activeDownload.status !== 'cancelled';
  const isCompleted = activeDownload?.status === 'completed';
  const isFailed = activeDownload?.status === 'failed';

  const getTrackStatus = (index: number): TrackStatus => {
    if (!activeDownload || activeDownload.status === 'queued') return 'idle';
    if (activeDownload.status === 'completed') return 'completed';
    if (activeDownload.status === 'cancelled' || activeDownload.status === 'failed') return 'idle';
    if (index < activeDownload.completed_tracks) return 'completed';
    if (index === activeDownload.completed_tracks) return 'downloading';
    return 'pending';
  };

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
        {/* Header */}
        <div className="flex gap-7">
          {/* Cover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="w-[200px] shrink-0"
          >
            <div className="relative">
              {coverSrc ? (
                <img src={coverSrc} alt={title} className="w-full aspect-square rounded-2xl object-cover glow-cover" />
              ) : (
                <div className="w-full aspect-square rounded-2xl bg-bg-elevated flex items-center justify-center">
                  <ListMusic size={48} className="text-text-muted/30" />
                </div>
              )}
              <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <ListMusic size={18} className="text-white" />
              </div>
            </div>
          </motion.div>

          {/* Playlist Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
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
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                  <ListMusic size={11} className="inline mr-1" />
                  Playlist
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-2xl font-bold text-text-primary leading-tight mb-3"
              >
                {title}
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-text-muted" />
                  <span className="text-[12px] text-text-muted">
                    {trackTotal} track{trackTotal !== 1 ? 's' : ''}
                  </span>
                </div>
                {tracks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-text-muted" />
                    <span className="text-[12px] text-text-muted">
                      {formatTotalDuration(tracks)}
                    </span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Actions */}
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
                          <span className="flex items-center gap-1.5 text-emerald-400 font-medium"><CheckCircle2 size={13} /> Download complete</span>
                        ) : isFailed ? (
                          <span className="flex items-center gap-1.5 text-error"><AlertCircle size={13} /> {activeDownload.error || 'Failed'}</span>
                        ) : (
                          <span className="text-text-secondary">
                            Downloading {activeDownload.completed_tracks} of {activeDownload.total_tracks} tracks
                            {activeDownload.current_track && <span className="text-text-muted"> — {activeDownload.current_track}</span>}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-text-muted tabular-nums">
                        {!isCompleted && !isFailed && activeDownload.status !== 'queued' && (
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
                      {downloading ? 'Starting...' : 'Download Playlist'}
                    </button>
                    <button
                      onClick={async () => {
                        const saved = isInWishlist(url);
                        if (saved) {
                          const existing = wishlistItems.find((i) => i.url === url);
                          if (existing) await removeItem(existing.id);
                        } else {
                          await addItem({
                            url, title, artist: '', source: source || undefined, media_type: 'playlist',
                          });
                        }
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                        isInWishlist(url)
                          ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/25'
                          : 'glass text-text-muted hover:text-text-primary hover:bg-bg-hover/60'
                      }`}
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

        {/* Tracklist */}
        {tracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-5 border-t border-border-subtle"
          >
            <div className="flex items-center justify-between mb-3 px-4">
              <h3 className="text-[12px] font-semibold text-text-muted uppercase tracking-widest">
                Tracks
              </h3>
              {hasActiveDownload && !isCompleted && !isFailed && activeDownload.status !== 'queued' ? (
                <span className="text-[11px] text-accent-primary font-medium tabular-nums">
                  {activeDownload.completed_tracks}/{tracks.length} downloaded
                </span>
              ) : isCompleted ? (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 size={11} /> All tracks downloaded
                </span>
              ) : (
                <span className="text-[11px] text-text-muted">{tracks.length} tracks</span>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto pr-1 space-y-0.5">
              {tracks.map((track, i) => (
                <TrackRow key={track.id} track={track} index={i} status={getTrackStatus(i)} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
