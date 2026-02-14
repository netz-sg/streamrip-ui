import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Disc3,
  Download,
  Trash2,
  Inbox,
  Clock,
} from 'lucide-react';
import { useWishlistStore } from '../stores/wishlistStore';
import { useDownloadStore } from '../stores/downloadStore';
import type { WishlistItem as WishlistItemType, MusicSource } from '../api/types';
import { SOURCE_COLORS, SOURCE_LABELS } from '../api/types';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function WishlistCard({
  item,
  index,
  onRemove,
  onDownload,
}: {
  item: WishlistItemType;
  index: number;
  onRemove: (id: string) => void;
  onDownload: (url: string) => void;
}) {
  const sourceColor = SOURCE_COLORS[item.source as MusicSource] || '#6366f1';
  const coverSrc = item.cover_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="glass rounded-2xl p-3 group hover:bg-bg-hover/30 transition-all duration-200"
    >
      {/* Cover */}
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
        <div className="absolute inset-0 flex items-end justify-end gap-1.5 p-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={() => onDownload(item.url)}
            className="w-9 h-9 rounded-xl bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/30 translate-y-1 group-hover:translate-y-0 transition-all duration-200 hover:bg-accent-hover"
            title="Download"
          >
            <Download size={14} className="text-white" />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="w-9 h-9 rounded-xl bg-bg-elevated/90 backdrop-blur-sm flex items-center justify-center shadow-lg translate-y-1 group-hover:translate-y-0 transition-all duration-200 hover:bg-error/20"
            title="Remove"
          >
            <Trash2 size={14} className="text-text-muted group-hover:text-error transition-colors" />
          </button>
        </div>
      </div>

      {/* Info */}
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
        <span className="text-[10px] text-text-muted/50 ml-auto">
          {formatDate(item.added_at)}
        </span>
      </div>
    </motion.div>
  );
}

export default function WishlistPage() {
  const { items, total, loading, fetchWishlist, removeItem, clearAll } =
    useWishlistStore();
  const addDownload = useDownloadStore((s) => s.addDownload);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleDownload = async (url: string) => {
    await addDownload(url);
  };

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
              Saved for Later
            </h1>
            <p className="text-[13px] text-text-muted mt-0.5">
              {total} item{total !== 1 ? 's' : ''} saved
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => clearAll()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-[11px] font-medium text-text-muted hover:text-error hover:bg-error/10 transition-colors"
            >
              <Trash2 size={13} />
              Clear all
            </button>
          )}
        </div>
      </motion.div>

      {loading && items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-24"
        >
          <Clock size={20} className="text-text-muted animate-pulse" />
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-bg-surface flex items-center justify-center mb-6 border border-border-subtle">
            <Bookmark size={28} className="text-text-muted/40" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-lg font-semibold text-text-secondary mb-2">
            Nothing saved yet
          </h3>
          <p className="text-[13px] text-text-muted max-w-sm">
            Use the bookmark button on search results or album previews to save
            items here for later.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-4 gap-3 pb-8">
          <AnimatePresence>
            {items.map((item, i) => (
              <WishlistCard
                key={item.id}
                item={item}
                index={i}
                onRemove={removeItem}
                onDownload={handleDownload}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
