import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Disc3,
  CheckCircle2,
  AlertCircle,
  X,
  Inbox,
  Trash2,
} from 'lucide-react';
import { useHistoryStore } from '../stores/historyStore';
import type { DownloadHistoryItem, MusicSource } from '../api/types';
import { SOURCE_COLORS, SOURCE_LABELS } from '../api/types';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function HistoryItem({
  item,
  index,
  onRemove,
}: {
  item: DownloadHistoryItem;
  index: number;
  onRemove: (id: string) => void;
}) {
  const sourceColor = SOURCE_COLORS[item.source as MusicSource] || '#6366f1';

  const statusIcon = {
    completed: <CheckCircle2 size={13} className="text-success" />,
    failed: <AlertCircle size={13} className="text-error" />,
    cancelled: <X size={13} className="text-text-muted" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-bg-hover/30 transition-colors group"
    >
      {/* Cover */}
      <div className="w-11 h-11 rounded-lg bg-bg-elevated shrink-0 overflow-hidden">
        {item.cover_url ? (
          <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 size={16} className="text-text-muted/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-text-primary truncate">{item.title}</p>
        <p className="text-[11px] text-text-muted truncate">{item.artist}</p>
      </div>

      {/* Date */}
      <span className="text-[10px] text-text-muted shrink-0 hidden sm:block">
        {formatDate(item.finished_at)}
      </span>

      {/* Source */}
      <span
        className="text-[9px] font-bold uppercase tracking-wider shrink-0"
        style={{ color: sourceColor }}
      >
        {SOURCE_LABELS[item.source as MusicSource] || item.source}
      </span>

      {/* Status */}
      <div className="shrink-0">
        {statusIcon[item.status as keyof typeof statusIcon] || null}
      </div>

      {/* Delete */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-1 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100 shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </motion.div>
  );
}

export default function HistoryPage() {
  const { items, total, loading, fetchHistory, removeEntry, clearAll } =
    useHistoryStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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
              History
            </h1>
            <p className="text-[13px] text-text-muted mt-0.5">
              {total} past download{total !== 1 ? 's' : ''}
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
            <Inbox size={28} className="text-text-muted/40" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-lg font-semibold text-text-secondary mb-2">
            No history yet
          </h3>
          <p className="text-[13px] text-text-muted max-w-sm">
            Completed downloads will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="glass rounded-2xl divide-y divide-border-subtle overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-2.5">
            <div className="w-11 shrink-0" />
            <span className="flex-1 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
              Title
            </span>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest hidden sm:block w-28 text-center">
              Date
            </span>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest w-20 text-center">
              Source
            </span>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest w-8 text-center">
              Status
            </span>
            <div className="w-7 shrink-0" />
          </div>

          {/* Items */}
          {items.map((item, i) => (
            <HistoryItem
              key={item.id}
              item={item}
              index={i}
              onRemove={removeEntry}
            />
          ))}
        </div>
      )}
    </div>
  );
}
