import { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Link2 } from 'lucide-react';
import Sidebar from './Sidebar';
import WindowControls from './WindowControls';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useMetadataStore } from '../../stores/metadataStore';

/** Extract the first URL-like string from dropped text. */
function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

export default function AppShell() {
  useKeyboardShortcuts();
  const navigate = useNavigate();
  const fetchMeta = useMetadataStore((s) => s.fetch);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set false when leaving the root container (not children)
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      // Try text/plain first (dragged link or selected text)
      let url = extractUrl(e.dataTransfer.getData('text/plain') || '');

      // Fallback: text/uri-list
      if (!url) {
        url = extractUrl(e.dataTransfer.getData('text/uri-list') || '');
      }

      if (url) {
        navigate('/');
        fetchMeta(url);
      }
    },
    [navigate, fetchMeta],
  );

  return (
    <div
      className="flex h-full w-full bg-bg-primary noise"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative">
        {/* Draggable titlebar area + window controls */}
        <div
          className="h-10 shrink-0 flex items-center justify-end pr-1 select-none"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <WindowControls />
        </div>
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>

        {/* Drop zone overlay */}
        <AnimatePresence>
          {dragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="flex flex-col items-center gap-4 p-10 rounded-2xl border-2 border-dashed border-accent-primary/50 bg-bg-surface/60"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center">
                  <Link2 size={28} className="text-accent-primary" />
                </div>
                <div className="text-center">
                  <p className="text-text-primary font-display font-semibold text-lg">
                    Drop URL
                  </p>
                  <p className="text-text-muted text-sm mt-1">
                    Qobuz, TIDAL, Deezer, or SoundCloud link
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
