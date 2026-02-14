import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  Download,
  Disc3,
  AlertCircle,
  Music4,
  Clock,
  Hash,
  ChevronRight,
  Loader2,
  Sparkles,
  X,
  CheckCircle2,
  RotateCcw,
  FolderOpen,
  ListPlus,
  Trash2,
  Bookmark,
} from 'lucide-react';
import { useMetadataStore } from '../stores/metadataStore';
import { useDownloadStore } from '../stores/downloadStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { fetchBulkMetadata } from '../api/client';
import type { AlbumMetadata, TrackItem, MusicSource, DownloadStatus, BulkMetadataItem, MetadataResponse, CoverUrls } from '../api/types';
import { SOURCE_COLORS, SOURCE_LABELS } from '../api/types';
import TrackPreview from '../components/previews/TrackPreview';
import ArtistPreview from '../components/previews/ArtistPreview';
import PlaylistPreview from '../components/previews/PlaylistPreview';

type TrackStatus = 'idle' | 'pending' | 'downloading' | 'completed';

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function SourceBadge({ source }: { source: string }) {
  const color = SOURCE_COLORS[source as MusicSource] || '#6366f1';
  const label = SOURCE_LABELS[source as MusicSource] || source;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border"
      style={{
        color,
        borderColor: `${color}30`,
        background: `${color}12`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function QualityBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide bg-accent-primary/10 text-accent-hover border border-accent-primary/20">
      <Sparkles size={11} />
      {label}
    </span>
  );
}

function CoverArt({
  covers,
  title,
}: {
  covers: AlbumMetadata['covers'];
  title: string;
}) {
  const src = covers.original || covers.large || covers.small || covers.thumbnail;
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return (
      <div className="w-full aspect-square rounded-2xl bg-bg-elevated flex items-center justify-center">
        <Disc3 size={48} className="text-text-muted/30" />
      </div>
    );
  }

  return (
    <div className="relative group">
      {!loaded && (
        <div className="absolute inset-0 rounded-2xl shimmer" />
      )}
      <img
        src={src}
        alt={title}
        className={`
          w-full aspect-square rounded-2xl object-cover glow-cover
          transition-all duration-700
          ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
        onLoad={() => setLoaded(true)}
      />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

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
      className={`
        group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-200 cursor-default
        ${status === 'downloading' ? 'bg-accent-primary/6' : 'hover:bg-bg-hover/40'}
      `}
    >
      <span className="w-8 flex items-center justify-center shrink-0">
        {status === 'completed' ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
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
        <p className="text-[11px] text-text-muted truncate mt-0.5">
          {track.artist}
        </p>
      </div>
      <span className="text-[12px] text-text-muted tabular-nums shrink-0">
        {formatDuration(track.duration)}
      </span>
    </motion.div>
  );
}

function DownloadProgress({ download }: { download: DownloadStatus }) {
  const progress = download.progress;
  const isCompleted = download.status === 'completed';
  const isFailed = download.status === 'failed';

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isCompleted
              ? 'bg-emerald-400'
              : isFailed
                ? 'bg-error'
                : 'bg-gradient-to-r from-accent-primary to-accent-secondary'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(progress, isCompleted ? 100 : 0)}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between">
        <span className="text-[12px]">
          {isCompleted ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 size={13} />
              Download complete
            </span>
          ) : isFailed ? (
            <span className="flex items-center gap-1.5 text-error">
              <AlertCircle size={13} />
              {download.error || 'Download failed'}
            </span>
          ) : download.status === 'queued' ? (
            <span className="flex items-center gap-1.5 text-text-muted">
              <Clock size={13} />
              Queued...
            </span>
          ) : (
            <span className="text-text-secondary">
              Downloading {download.completed_tracks} of {download.total_tracks} tracks
              {download.current_track && (
                <span className="text-text-muted"> — {download.current_track}</span>
              )}
            </span>
          )}
        </span>
        <span className="text-[11px] text-text-muted tabular-nums">
          {!isCompleted && !isFailed && download.status !== 'queued' && (
            <>
              {download.speed && <span>{download.speed}</span>}
              {download.eta && <span className="ml-2">ETA {download.eta}</span>}
              {!download.speed && !download.eta && <span>{Math.round(progress)}%</span>}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

function AlbumPreview() {
  const { data, source } = useMetadataStore();
  const url = useMetadataStore((s) => s.url);
  const addDownload = useDownloadStore((s) => s.addDownload);
  const connectWs = useDownloadStore((s) => s.connectWs);
  const downloads = useDownloadStore((s) => s.downloads);
  const { addItem, removeItem, isInWishlist, items: wishlistItems } = useWishlistStore();
  const [downloading, setDownloading] = useState(false);

  // Connect WebSocket on mount
  useEffect(() => {
    connectWs();
  }, [connectWs]);

  if (!data) return null;

  const album = data.album;
  if (!album) return null;

  const coverSrc = album.covers.original || album.covers.large;

  // Find active download for this URL
  const activeDownload = downloads.find((d) => d.url === url);
  const hasActiveDownload = activeDownload && activeDownload.status !== 'cancelled';
  const isCompleted = activeDownload?.status === 'completed';
  const isFailed = activeDownload?.status === 'failed';

  // Derive per-track status from completed_tracks count
  const getTrackStatus = (index: number): TrackStatus => {
    if (!activeDownload || activeDownload.status === 'queued') return 'idle';
    if (activeDownload.status === 'completed') return 'completed';
    if (activeDownload.status === 'cancelled' || activeDownload.status === 'failed') return 'idle';
    // Downloading: use index to approximate track progress
    if (index < activeDownload.completed_tracks) return 'completed';
    if (index === activeDownload.completed_tracks) return 'downloading';
    return 'pending';
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await addDownload(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Ambient Background Glow from Cover Art */}
      {coverSrc && (
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none overflow-hidden opacity-[0.12] blur-[100px] -z-10">
          <img src={coverSrc} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
        {/* Top Section: Cover + Info */}
        <div className="flex gap-7">
          {/* Cover Art */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="w-[240px] shrink-0"
          >
            <CoverArt covers={album.covers} title={album.title} />
          </motion.div>

          {/* Album Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              {/* Source & Quality Badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2 mb-3"
              >
                {source && <SourceBadge source={source} />}
                <QualityBadge label={album.quality.label} />
                {album.explicit && (
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
                {album.title}
              </motion.h2>

              {/* Artist */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-[15px] text-text-secondary font-medium mb-4"
              >
                {album.artist}
              </motion.p>

              {/* Meta Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-x-6 gap-y-2"
              >
                {album.year && album.year !== 'Unknown' && (
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-text-muted" />
                    <span className="text-[12px] text-text-muted">
                      {album.year}
                    </span>
                  </div>
                )}
                {album.genre.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Music4 size={12} className="text-text-muted" />
                    <span className="text-[12px] text-text-muted truncate">
                      {album.genre.join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-text-muted" />
                  <span className="text-[12px] text-text-muted">
                    {album.track_total} track{album.track_total !== 1 ? 's' : ''}
                    {album.disc_total > 1 ? ` \u00b7 ${album.disc_total} discs` : ''}
                  </span>
                </div>
                {album.label && (
                  <div className="flex items-center gap-2">
                    <Disc3 size={12} className="text-text-muted" />
                    <span className="text-[12px] text-text-muted truncate">
                      {album.label}
                    </span>
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
                  >
                    <DownloadProgress download={activeDownload} />
                    {/* Retry / Open Folder buttons */}
                    {(isCompleted || isFailed) && (
                      <div className="flex items-center gap-2 mt-3">
                        {isFailed && (
                          <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-error/10 text-error text-[12px] font-semibold hover:bg-error/20 transition-colors"
                          >
                            <RotateCcw size={13} />
                            Retry
                          </button>
                        )}
                        {isCompleted && activeDownload.download_path && (
                          <button
                            onClick={() => {
                              const electron = (window as unknown as { electron?: { openFolder: (path: string) => void } }).electron;
                              electron?.openFolder(activeDownload.download_path!);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400/10 text-emerald-400 text-[12px] font-semibold hover:bg-emerald-400/20 transition-colors"
                          >
                            <FolderOpen size={13} />
                            Open Folder
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
                      className="
                        inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl
                        bg-gradient-to-r from-accent-primary to-accent-secondary
                        text-white text-[13px] font-semibold
                        hover:shadow-lg hover:shadow-accent-primary/25
                        active:scale-[0.97] transition-all duration-200
                        disabled:opacity-60 disabled:cursor-not-allowed
                      "
                    >
                      {downloading ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Download size={15} />
                      )}
                      {downloading ? 'Starting...' : 'Download Album'}
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
                            title: album.title,
                            artist: album.artist,
                            cover_url: album.covers.large || album.covers.original || null,
                            source: source || undefined,
                            media_type: 'album',
                            year: album.year && album.year !== 'Unknown' ? album.year : null,
                          });
                        }
                      }}
                      className={`
                        inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold
                        transition-all duration-200 active:scale-[0.97]
                        ${isInWishlist(url)
                          ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/25'
                          : 'glass text-text-muted hover:text-text-primary hover:bg-bg-hover/60'
                        }
                      `}
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

        {/* Tracklist */}
        {album.tracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-5 border-t border-border-subtle"
          >
            <div className="flex items-center justify-between mb-3 px-4">
              <h3 className="text-[12px] font-semibold text-text-muted uppercase tracking-widest">
                Tracklist
              </h3>
              {hasActiveDownload && !isCompleted && !isFailed && activeDownload.status !== 'queued' ? (
                <span className="text-[11px] text-accent-primary font-medium tabular-nums">
                  {activeDownload.completed_tracks}/{album.tracks.length} downloaded
                </span>
              ) : isCompleted ? (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  All tracks downloaded
                </span>
              ) : (
                <span className="text-[11px] text-text-muted">
                  {album.tracks.length} tracks
                </span>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto pr-1 space-y-0.5">
              {album.tracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={i}
                  status={getTrackStatus(i)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-bg-surface flex items-center justify-center mb-6 border border-border-subtle">
        <Link2 size={28} className="text-text-muted/40" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-lg font-semibold text-text-secondary mb-2">
        Paste a music URL
      </h3>
      <p className="text-[13px] text-text-muted max-w-sm leading-relaxed">
        Drop a link from Qobuz, TIDAL, Deezer, or SoundCloud to preview the
        album artwork, tracklist, and audio quality before downloading.
      </p>

      {/* Source Icons */}
      <div className="flex items-center gap-3 mt-6">
        {(['qobuz', 'tidal', 'deezer', 'soundcloud'] as MusicSource[]).map(
          (src) => (
            <span
              key={src}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border"
              style={{
                color: SOURCE_COLORS[src],
                borderColor: `${SOURCE_COLORS[src]}25`,
                background: `${SOURCE_COLORS[src]}08`,
              }}
            >
              {SOURCE_LABELS[src]}
            </span>
          ),
        )}
      </div>
    </motion.div>
  );
}

interface BulkItem {
  url: string;
  metadata: MetadataResponse | null;
  error: string | null;
  downloading: boolean;
}

function BulkAlbumCard({
  item,
  index,
  onDownload,
  onRemove,
  download,
}: {
  item: BulkItem;
  index: number;
  onDownload: (url: string) => void;
  onRemove: (url: string) => void;
  download?: DownloadStatus;
}) {
  const album = item.metadata?.album;
  const source = item.metadata?.source;
  const coverSrc = album?.covers.large || album?.covers.original || album?.covers.small;

  const isActive = download && download.status !== 'cancelled';
  const isCompleted = download?.status === 'completed';
  const isFailed = download?.status === 'failed';
  const isDownloading = download?.status === 'downloading';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: 0.03 * index, duration: 0.3 }}
      className="glass rounded-2xl p-3 flex gap-3 group relative"
    >
      {/* Cover */}
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-bg-elevated">
        {coverSrc ? (
          <img src={coverSrc} alt={album?.title ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 size={20} className="text-text-muted/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {item.error ? (
          <div>
            <p className="text-[12px] text-error truncate">{item.error}</p>
            <p className="text-[11px] text-text-muted truncate mt-0.5">{item.url}</p>
          </div>
        ) : album ? (
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              {source && <SourceBadge source={source} />}
              <span className="text-[10px] text-text-muted">
                {album.track_total} track{album.track_total !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[13px] text-text-primary font-medium truncate leading-tight">
              {album.title}
            </p>
            <p className="text-[11px] text-text-muted truncate">
              {album.artist}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Loader2 size={12} className="text-accent-primary animate-spin" />
            <span className="text-[12px] text-text-muted">Loading...</span>
          </div>
        )}

        {/* Progress bar for this item */}
        {isActive && (
          <div className="mt-1.5">
            <div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isCompleted
                    ? 'bg-emerald-400'
                    : isFailed
                      ? 'bg-error'
                      : 'bg-gradient-to-r from-accent-primary to-accent-secondary'
                }`}
                animate={{ width: `${isCompleted ? 100 : download.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[10px] mt-0.5 tabular-nums">
              {isCompleted ? (
                <span className="text-emerald-400">Complete</span>
              ) : isFailed ? (
                <span className="text-error">{download.error || 'Failed'}</span>
              ) : isDownloading ? (
                <span className="text-text-muted">
                  {download.completed_tracks}/{download.total_tracks} tracks
                </span>
              ) : (
                <span className="text-text-muted">Queued</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {isCompleted && download.download_path ? (
          <button
            onClick={() => {
              const electron = (window as unknown as { electron?: { openFolder: (p: string) => void } }).electron;
              electron?.openFolder(download.download_path!);
            }}
            className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-400/10 transition-colors"
            title="Open Folder"
          >
            <FolderOpen size={14} />
          </button>
        ) : !isActive && !item.error && album ? (
          <button
            onClick={() => onDownload(item.url)}
            disabled={item.downloading}
            className="p-2 rounded-lg text-accent-primary hover:bg-accent-primary/10 transition-colors disabled:opacity-40"
            title="Download"
          >
            {item.downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
          </button>
        ) : null}
        {!isActive && (
          <button
            onClick={() => onRemove(item.url)}
            className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function BulkImportSection() {
  const [bulkText, setBulkText] = useState('');
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [parsing, setParsing] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const addDownload = useDownloadStore((s) => s.addDownload);
  const connectWs = useDownloadStore((s) => s.connectWs);
  const downloads = useDownloadStore((s) => s.downloads);

  useEffect(() => {
    connectWs();
  }, [connectWs]);

  const handleParse = async () => {
    const urls = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http'));

    if (urls.length === 0) return;

    setParsing(true);
    // Initialize items immediately with loading state
    setBulkItems(urls.map((url) => ({ url, metadata: null, error: null, downloading: false })));

    try {
      const response = await fetchBulkMetadata(urls);
      setBulkItems(
        response.results.map((r) => ({
          url: r.url,
          metadata: r.metadata ?? null,
          error: r.error ?? null,
          downloading: false,
        })),
      );
    } catch (err) {
      setBulkItems(
        urls.map((url) => ({
          url,
          metadata: null,
          error: err instanceof Error ? err.message : 'Failed to fetch',
          downloading: false,
        })),
      );
    } finally {
      setParsing(false);
    }
  };

  const handleDownloadOne = async (url: string) => {
    setBulkItems((prev) =>
      prev.map((it) => (it.url === url ? { ...it, downloading: true } : it)),
    );
    try {
      await addDownload(url);
    } finally {
      setBulkItems((prev) =>
        prev.map((it) => (it.url === url ? { ...it, downloading: false } : it)),
      );
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    const downloadable = bulkItems.filter((it) => it.metadata && !it.error);
    for (const item of downloadable) {
      // Skip if already has an active download
      const existing = downloads.find((d) => d.url === item.url);
      if (existing && existing.status !== 'cancelled' && existing.status !== 'failed') continue;
      try {
        await addDownload(item.url);
      } catch {
        // continue with others
      }
    }
    setDownloadingAll(false);
  };

  const handleRemove = (url: string) => {
    setBulkItems((prev) => prev.filter((it) => it.url !== url));
  };

  const handleClear = () => {
    setBulkItems([]);
    setBulkText('');
  };

  const successCount = bulkItems.filter((it) => it.metadata && !it.error).length;
  const completedCount = bulkItems.filter((it) => {
    const dl = downloads.find((d) => d.url === it.url);
    return dl?.status === 'completed';
  }).length;

  return (
    <div className="space-y-4">
      {/* Textarea for URLs */}
      {bulkItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Paste multiple URLs here, one per line...\n\nhttps://open.qobuz.com/album/...\nhttps://tidal.com/browse/album/...\nhttps://www.deezer.com/album/..."}
            className="w-full h-40 px-5 py-4 rounded-2xl glass text-[13px] text-text-primary placeholder:text-text-muted/40 resize-none focus:outline-none focus:ring-1 focus:ring-accent-primary/30 transition-all"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-text-muted">
              {bulkText.split('\n').filter((l) => l.trim().startsWith('http')).length} URLs detected
            </span>
            <button
              onClick={handleParse}
              disabled={parsing || !bulkText.trim()}
              className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-gradient-to-r from-accent-primary to-accent-secondary
                text-white text-[12px] font-semibold
                hover:shadow-lg hover:shadow-accent-primary/25
                active:scale-[0.97] transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {parsing ? <Loader2 size={13} className="animate-spin" /> : <ListPlus size={13} />}
              {parsing ? 'Fetching metadata...' : 'Parse URLs'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Bulk Results */}
      {bulkItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Header bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold text-text-secondary">
                {successCount} album{successCount !== 1 ? 's' : ''} found
              </span>
              {completedCount > 0 && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  {completedCount} done
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadAll}
                disabled={downloadingAll || successCount === 0}
                className="
                  inline-flex items-center gap-2 px-4 py-2 rounded-xl
                  bg-gradient-to-r from-accent-primary to-accent-secondary
                  text-white text-[11px] font-semibold
                  hover:shadow-lg hover:shadow-accent-primary/25
                  active:scale-[0.97] transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                {downloadingAll ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Download All
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] text-text-muted hover:text-text-primary hover:bg-bg-hover/60 transition-colors"
              >
                <X size={12} />
                Clear
              </button>
            </div>
          </div>

          {/* Card list */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            <AnimatePresence>
              {bulkItems.map((item, i) => (
                <BulkAlbumCard
                  key={item.url}
                  item={item}
                  index={i}
                  onDownload={handleDownloadOne}
                  onRemove={handleRemove}
                  download={downloads.find((d) => d.url === item.url)}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { url, loading, error, data, fetch, clear, setUrl } = useMetadataStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

  const handleSubmit = useCallback(() => {
    if (url.trim()) {
      fetch(url.trim());
    }
  }, [url, fetch]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData('text');
      if (pasted.startsWith('http')) {
        setTimeout(() => fetch(pasted.trim()), 50);
      }
    },
    [fetch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
      if (e.key === 'Escape') clear();
    },
    [handleSubmit, clear],
  );

  // Auto-focus on mount
  useEffect(() => {
    if (!bulkMode) inputRef.current?.focus();
  }, [bulkMode]);

  return (
    <div className="h-full px-8 py-7 relative overflow-y-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-end justify-between"
      >
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary">
            Home
          </h1>
          <p className="text-[13px] text-text-muted mt-0.5">
            {bulkMode ? 'Import multiple URLs at once' : 'Paste a URL to preview and download music'}
          </p>
        </div>
        <button
          onClick={() => setBulkMode(!bulkMode)}
          className={`
            inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200
            ${bulkMode
              ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/25'
              : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover/60 border border-transparent'
            }
          `}
        >
          <ListPlus size={14} />
          Bulk Import
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {bulkMode ? (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <BulkImportSection />
          </motion.div>
        ) : (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* URL Input */}
            <div className="mb-8">
              <div
                className={`
                  relative flex items-center rounded-2xl transition-all duration-300
                  ${
                    inputFocused
                      ? 'glass-strong glow-accent ring-1 ring-accent-primary/30'
                      : 'glass hover:border-border-default'
                  }
                `}
              >
                <div className="pl-5 pr-3 flex items-center">
                  {loading ? (
                    <Loader2 size={18} className="text-accent-primary animate-spin" />
                  ) : (
                    <Link2
                      size={18}
                      className={
                        inputFocused ? 'text-accent-primary' : 'text-text-muted'
                      }
                    />
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Paste a Qobuz, TIDAL, Deezer, or SoundCloud URL..."
                  className="flex-1 bg-transparent py-4 text-[14px] text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                />
                {url && (
                  <button
                    onClick={clear}
                    className="px-2 py-1 mr-2 rounded-lg hover:bg-bg-hover transition-colors"
                  >
                    <X size={14} className="text-text-muted" />
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !url.trim()}
                  className="
                    mr-3 px-4 py-2 rounded-xl
                    bg-accent-primary/10 text-accent-primary text-[12px] font-semibold
                    hover:bg-accent-primary/20 transition-colors duration-200
                    disabled:opacity-30 disabled:cursor-not-allowed
                  "
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Error State */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-error/8 border border-error/20"
                >
                  <AlertCircle size={16} className="text-error shrink-0" />
                  <p className="text-[13px] text-error/90">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            <AnimatePresence mode="wait">
              {data ? (
                data.type === 'track' && data.track ? (
                  <TrackPreview key="track-preview" />
                ) : data.type === 'artist' && data.artist ? (
                  <ArtistPreview key="artist-preview" />
                ) : data.type === 'playlist' ? (
                  data.playlist ? (
                    <PlaylistPreview key="playlist-preview" />
                  ) : (
                    <AlbumPreview key="album-preview" />
                  )
                ) : (
                  <AlbumPreview key="preview" />
                )
              ) : (
                !loading && <EmptyState key="empty" />
              )}
            </AnimatePresence>

            {/* Loading Skeleton */}
            <AnimatePresence>
              {loading && !data && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-strong rounded-3xl p-6"
                >
                  <div className="flex gap-7">
                    <div className="w-[240px] shrink-0 aspect-square rounded-2xl shimmer" />
                    <div className="flex-1 space-y-4 py-2">
                      <div className="flex gap-2">
                        <div className="w-16 h-6 rounded-lg shimmer" />
                        <div className="w-24 h-6 rounded-lg shimmer" />
                      </div>
                      <div className="w-3/4 h-7 rounded-lg shimmer" />
                      <div className="w-1/2 h-5 rounded-lg shimmer" />
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="w-full h-4 rounded shimmer" />
                        <div className="w-full h-4 rounded shimmer" />
                        <div className="w-full h-4 rounded shimmer" />
                        <div className="w-full h-4 rounded shimmer" />
                      </div>
                      <div className="w-40 h-11 rounded-2xl shimmer mt-4" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
