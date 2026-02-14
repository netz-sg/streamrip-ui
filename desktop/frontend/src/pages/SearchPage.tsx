import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Disc3,
  Loader2,
  AlertCircle,
  Music2,
  User,
  ListMusic,
  Download,
  Bookmark,
} from 'lucide-react';
import { useSearchStore } from '../stores/searchStore';
import { useDownloadStore } from '../stores/downloadStore';
import { useWishlistStore } from '../stores/wishlistStore';
import type { SearchResultItem, MusicSource, MediaType } from '../api/types';
import { SOURCE_COLORS, SOURCE_LABELS } from '../api/types';

const sources: MusicSource[] = ['qobuz', 'tidal', 'deezer', 'soundcloud'];
const mediaTypes: { value: MediaType; label: string; icon: typeof Disc3 }[] = [
  { value: 'album', label: 'Albums', icon: Disc3 },
  { value: 'track', label: 'Tracks', icon: Music2 },
  { value: 'artist', label: 'Artists', icon: User },
  { value: 'playlist', label: 'Playlists', icon: ListMusic },
];

function ResultCard({ item, index }: { item: SearchResultItem; index: number }) {
  const addDownload = useDownloadStore((s) => s.addDownload);
  const { addItem, removeItem, isInWishlist, items } = useWishlistStore();
  const sourceColor = SOURCE_COLORS[item.source as MusicSource] || '#6366f1';
  const coverSrc = item.covers?.large || item.covers?.small || item.covers?.thumbnail;

  const url = `https://www.${item.source}.com/${item.type}/${item.id}`;
  const saved = isInWishlist(url);

  const handleDownload = async () => {
    await addDownload(url);
  };

  const handleToggleSave = async () => {
    if (saved) {
      const existing = items.find((i) => i.url === url);
      if (existing) await removeItem(existing.id);
    } else {
      await addItem({
        url,
        title: item.title,
        artist: item.artist,
        cover_url: coverSrc || null,
        source: item.source,
        media_type: item.type,
        year: item.year ?? null,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="glass rounded-2xl p-3 group hover:bg-bg-hover/30 transition-all duration-200 cursor-pointer"
    >
      <div className="aspect-square rounded-xl bg-bg-elevated mb-3 overflow-hidden relative">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 size={28} className="text-text-muted/20" />
          </div>
        )}
        {/* Action overlay */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
          <button
            onClick={handleToggleSave}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 ${
              saved
                ? 'bg-accent-primary text-white'
                : 'bg-bg-elevated/90 backdrop-blur-sm text-text-muted hover:text-accent-primary hover:bg-bg-elevated'
            }`}
            title={saved ? 'Remove from saved' : 'Save for later'}
          >
            <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleDownload}
            className="w-9 h-9 rounded-xl bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/30 hover:bg-accent-hover transition-all duration-200"
          >
            <Download size={14} className="text-white" />
          </button>
        </div>
      </div>

      <h4 className="text-[13px] font-semibold text-text-primary truncate leading-tight">
        {item.title}
      </h4>
      <p className="text-[11px] text-text-muted truncate mt-0.5">
        {item.artist}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span
          className="text-[9px] font-bold uppercase tracking-wider"
          style={{ color: sourceColor }}
        >
          {SOURCE_LABELS[item.source as MusicSource] || item.source}
        </span>
        {item.year && (
          <span className="text-[10px] text-text-muted">{item.year}</span>
        )}
      </div>
    </motion.div>
  );
}

export default function SearchPage() {
  const {
    query, source, mediaType, results, loading, error,
    setQuery, setSource, setMediaType, performSearch,
  } = useSearchStore();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') performSearch();
    },
    [performSearch],
  );

  return (
    <div className="h-full px-8 py-7">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-xl font-bold text-text-primary">
          Search
        </h1>
        <p className="text-[13px] text-text-muted mt-0.5">
          Find music across streaming platforms
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5"
      >
        <div className="glass rounded-2xl flex items-center">
          <div className="pl-5 pr-3">
            {loading ? (
              <Loader2 size={18} className="text-accent-primary animate-spin" />
            ) : (
              <Search size={18} className="text-text-muted" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for albums, tracks, artists..."
            className="flex-1 bg-transparent py-3.5 text-[14px] text-text-primary placeholder:text-text-muted/50"
          />
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-4 mb-6"
      >
        {/* Source Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-surface/50 border border-border-subtle">
          {sources.map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                source === s
                  ? 'bg-bg-elevated text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {SOURCE_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Media Type Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-surface/50 border border-border-subtle">
          {mediaTypes.map((mt) => {
            const Icon = mt.icon;
            return (
              <button
                key={mt.value}
                onClick={() => setMediaType(mt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                  mediaType === mt.value
                    ? 'bg-bg-elevated text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon size={12} />
                {mt.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={performSearch}
          disabled={loading || !query.trim()}
          className="ml-auto px-5 py-2 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-semibold hover:bg-accent-primary/20 transition-colors disabled:opacity-30"
        >
          Search
        </button>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5 flex items-center gap-3 px-5 py-3 rounded-2xl bg-error/8 border border-error/20"
          >
            <AlertCircle size={16} className="text-error" />
            <p className="text-[13px] text-error/90">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-4 gap-3 pb-8">
          {results.map((item, i) => (
            <ResultCard key={`${item.source}-${item.id}`} item={item} index={i} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={28} className="text-text-muted/20 mb-4" />
            <p className="text-[13px] text-text-muted">
              {query ? 'No results found' : 'Type something and press Enter to search'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
