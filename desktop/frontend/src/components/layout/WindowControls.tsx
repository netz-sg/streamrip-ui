import { useState } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

// Access electron API if available (running in Electron)
const electron = (window as unknown as { electron?: {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
} }).electron;

export default function WindowControls() {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!electron) return null; // Don't show in browser

  return (
    <div
      className="flex items-center gap-0.5"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Minimize */}
      <button
        onClick={() => electron.minimize()}
        onMouseEnter={() => setHovered('min')}
        onMouseLeave={() => setHovered(null)}
        className="w-11 h-8 flex items-center justify-center rounded-md transition-colors duration-150 hover:bg-bg-hover"
      >
        <Minus size={14} className="text-text-muted" strokeWidth={1.5} />
      </button>

      {/* Maximize */}
      <button
        onClick={() => electron.maximize()}
        onMouseEnter={() => setHovered('max')}
        onMouseLeave={() => setHovered(null)}
        className="w-11 h-8 flex items-center justify-center rounded-md transition-colors duration-150 hover:bg-bg-hover"
      >
        <Copy size={11} className="text-text-muted" strokeWidth={1.5} />
      </button>

      {/* Close */}
      <button
        onClick={() => electron.close()}
        onMouseEnter={() => setHovered('close')}
        onMouseLeave={() => setHovered(null)}
        className={`
          w-11 h-8 flex items-center justify-center rounded-md transition-colors duration-150
          ${hovered === 'close' ? 'bg-error' : 'hover:bg-bg-hover'}
        `}
      >
        <X
          size={14}
          className={hovered === 'close' ? 'text-white' : 'text-text-muted'}
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
}
