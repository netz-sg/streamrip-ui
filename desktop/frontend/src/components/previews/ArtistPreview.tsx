import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Disc3,
  User,
  Loader2,
  Bookmark,
} from 'lucide-react';
import { useMetadataStore } from '../../stores/metadataStore';
import { useDownloadStore } from '../../stores/downloadStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import type { ArtistAlbumItem, MusicSource, CoverUrls } from '../../api/types';
import { SOURCE_COLORS, SOURCE_LABELS } from '../../api/types';

function AlbumCard({
  album,
  index,
  source,
  onSelect,
}: {
  album: ArtistAlbumItem;
  index: number;
  source: string;
  onSelect: (album: ArtistAlbumItem) => void;
}) {
  const coverSrc = album.covers.large || album.covers.original || album.covers.small || album.covers.thumbnail;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index, duration: 0.3 }}
      onClick={() => onSelect(album)}
      className="group text-left rounded-2xl glass p-3 hover:bg-bg-hover/40 transition-all duration-200"
    >
      <div className="relative mb-3">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={album.title}
            className="w-full aspect-square rounded-xl object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full aspect-square rounded-xl bg-bg-elevated flex items-center justify-center">
            <Disc3 size={28} className="text-text-muted/30" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/30">
            <Download size={16} className="text-white" />
          </div>
        </div>
      </div>
      <p className="text-[13px] text-text-primary font-medium truncate leading-tight">
        {album.title}
      </p>
      {album.year && (
        <p className="text-[11px] text-text-muted mt-0.5">{album.year}</p>
      )}
    </motion.button>
  );
}

export default function ArtistPreview() {
  const { data, source, fetch: fetchMetadata } = useMetadataStore();
  const url = useMetadataStore((s) => s.url);
  const addDownload = useDownloadStore((s) => s.addDownload);
  const connectWs = useDownloadStore((s) => s.connectWs);
  const { addItem, removeItem, isInWishlist, items: wishlistItems } = useWishlistStore();
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => { connectWs(); }, [connectWs]);

  if (!data?.artist) return null;

  const artist = data.artist;
  const sourceColor = SOURCE_COLORS[source as MusicSource] || '#6366f1';

  const handleSelectAlbum = (album: ArtistAlbumItem) => {
    // Construct album URL from source + album ID
    const urlMap: Record<string, (id: string) => string> = {
      qobuz: (id) => `https://open.qobuz.com/album/${id}`,
      tidal: (id) => `https://tidal.com/browse/album/${id}`,
      deezer: (id) => `https://www.deezer.com/album/${id}`,
    };
    const builder = urlMap[source || ''];
    if (builder) {
      fetchMetadata(builder(album.id));
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      await addDownload(url);
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
        {/* Artist Header */}
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-bg-elevated flex items-center justify-center border border-border-subtle">
            <User size={32} className="text-text-muted/30" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {source && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border"
                  style={{ color: sourceColor, borderColor: `${sourceColor}30`, background: `${sourceColor}12` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sourceColor }} />
                  {SOURCE_LABELS[source as MusicSource] || source}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-bg-elevated text-text-muted border border-border-subtle">
                Artist
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary leading-tight">
              {artist.name}
            </h2>
            <p className="text-[13px] text-text-muted mt-1">
              {artist.albums.length} album{artist.albums.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-[13px] font-semibold hover:shadow-lg hover:shadow-accent-primary/25 active:scale-[0.97] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloadingAll ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              {downloadingAll ? 'Starting...' : 'Download All'}
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
                    title: artist.name,
                    artist: artist.name,
                    source: source || undefined,
                    media_type: 'artist',
                  });
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                isInWishlist(url)
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/25'
                  : 'glass text-text-muted hover:text-text-primary hover:bg-bg-hover/60'
              }`}
            >
              <Bookmark size={15} fill={isInWishlist(url) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Albums Grid */}
        {artist.albums.length > 0 ? (
          <div>
            <h3 className="text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-4 px-1">
              Discography
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {artist.albums.map((album, i) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  index={i}
                  source={source || ''}
                  onSelect={handleSelectAlbum}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Disc3 size={32} className="text-text-muted/30 mb-3" />
            <p className="text-[13px] text-text-muted">
              No albums found for this artist on {SOURCE_LABELS[source as MusicSource] || source}.
            </p>
            <p className="text-[11px] text-text-muted/60 mt-1">
              Try downloading the full discography using the Download All button.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
