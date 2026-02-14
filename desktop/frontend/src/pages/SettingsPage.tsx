import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Loader2,
  Eye,
  EyeOff,
  FolderOpen,
  Key,
  Volume2,
  Image,
  FileText,
  Filter,
  Tags,
  Database,
} from 'lucide-react';
import { useConfigStore } from '../stores/configStore';
import type { MusicSource } from '../api/types';
import { SOURCE_COLORS, SOURCE_LABELS } from '../api/types';

type Tab = 'sources' | 'downloads' | 'quality' | 'artwork' | 'filepaths' | 'filters' | 'metadata' | 'database';

const tabs: { id: Tab; label: string; icon: typeof Key }[] = [
  { id: 'sources', label: 'Sources', icon: Key },
  { id: 'downloads', label: 'Downloads', icon: FolderOpen },
  { id: 'quality', label: 'Quality', icon: Volume2 },
  { id: 'artwork', label: 'Artwork', icon: Image },
  { id: 'filepaths', label: 'Filepaths', icon: FileText },
  { id: 'filters', label: 'Filters', icon: Filter },
  { id: 'metadata', label: 'Metadata', icon: Tags },
  { id: 'database', label: 'Database', icon: Database },
];

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && !showPassword ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-border-subtle text-[13px] text-text-primary placeholder:text-text-muted/40 focus:border-accent-primary/40 focus:ring-1 focus:ring-accent-primary/20 transition-all"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-border-subtle text-[13px] text-text-primary focus:border-accent-primary/40 transition-all appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-[13px] text-text-primary font-medium">{label}</p>
        {description && (
          <p className="text-[11px] text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`
          w-10 h-6 rounded-full transition-colors duration-200 relative
          ${value ? 'bg-accent-primary' : 'bg-bg-hover border border-border-default'}
        `}
      >
        <motion.div
          className="w-4 h-4 rounded-full bg-white shadow-sm absolute top-1"
          animate={{ left: value ? 20 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { config, loading, saving, loadConfig, saveConfig } = useConfigStore();
  const [activeTab, setActiveTab] = useState<Tab>('sources');
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (config) setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    if (localConfig) saveConfig(localConfig);
  };

  const updateLocal = (section: string, key: string, value: unknown) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      [section]: { ...localConfig[section as keyof typeof localConfig] as Record<string, unknown>, [key]: value },
    });
  };

  if (loading || !localConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={24} className="text-accent-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full px-8 py-7">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary">
            Settings
          </h1>
          <p className="text-[13px] text-text-muted mt-0.5">
            Configure your streaming sources and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary text-white text-[12px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </motion.div>

      <div className="flex gap-6 h-[calc(100%-80px)]">
        {/* Tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-left
                  ${activeTab === tab.id ? 'bg-bg-elevated text-text-primary border border-border-subtle' : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover/30'}
                `}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'sources' && (
                <div className="space-y-6">
                  {/* Qobuz */}
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_COLORS.qobuz }} />
                      <h3 className="text-[14px] font-semibold text-text-primary">Qobuz</h3>
                    </div>
                    <div className="space-y-3">
                      <InputField label="Email or User ID" value={localConfig.qobuz.email_or_userid} onChange={(v) => updateLocal('qobuz', 'email_or_userid', v)} placeholder="your@email.com" />
                      <InputField label="Password or Token" value={localConfig.qobuz.password_or_token} onChange={(v) => updateLocal('qobuz', 'password_or_token', v)} type="password" />
                      <ToggleField label="Use Auth Token" description="Use token instead of password" value={localConfig.qobuz.use_auth_token} onChange={(v) => updateLocal('qobuz', 'use_auth_token', v)} />
                    </div>
                  </div>

                  {/* Deezer */}
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_COLORS.deezer }} />
                      <h3 className="text-[14px] font-semibold text-text-primary">Deezer</h3>
                    </div>
                    <div className="space-y-3">
                      <InputField label="ARL Cookie" value={localConfig.deezer.arl} onChange={(v) => updateLocal('deezer', 'arl', v)} type="password" placeholder="Your Deezer ARL cookie" />
                      <ToggleField label="Use Deezloader" description="Free 320kbps MP3 downloads" value={localConfig.deezer.use_deezloader} onChange={(v) => updateLocal('deezer', 'use_deezloader', v)} />
                      <ToggleField label="Lower Quality Fallback" description="If target quality is unavailable, use best available" value={localConfig.deezer.lower_quality_if_not_available} onChange={(v) => updateLocal('deezer', 'lower_quality_if_not_available', v)} />
                      <ToggleField label="Deezloader Warnings" description="Warn when falling back to deezloader" value={localConfig.deezer.deezloader_warnings} onChange={(v) => updateLocal('deezer', 'deezloader_warnings', v)} />
                    </div>
                  </div>

                  {/* TIDAL */}
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_COLORS.tidal }} />
                      <h3 className="text-[14px] font-semibold text-text-primary">TIDAL</h3>
                    </div>
                    <p className="text-[12px] text-text-muted">
                      TIDAL uses OAuth login. Run <code className="px-1.5 py-0.5 rounded bg-bg-elevated text-accent-primary text-[11px]">rip config --tidal</code> in terminal to authenticate.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'downloads' && (
                <div className="space-y-6">
                  <div className="glass rounded-2xl p-5">
                    <h3 className="text-[14px] font-semibold text-text-primary mb-4">Download Settings</h3>
                    <div className="space-y-3">
                      <InputField label="Download Folder" value={localConfig.downloads.folder} onChange={(v) => updateLocal('downloads', 'folder', v)} placeholder="Path to download folder" />
                      <InputField label="Max Connections" value={localConfig.downloads.max_connections} onChange={(v) => updateLocal('downloads', 'max_connections', parseInt(v) || 6)} />
                      <ToggleField label="Source Subdirectories" description="Create Qobuz/, Tidal/ subfolders" value={localConfig.downloads.source_subdirectories} onChange={(v) => updateLocal('downloads', 'source_subdirectories', v)} />
                      <ToggleField label="Disc Subdirectories" description="Create Disc 1/, Disc 2/ subfolders" value={localConfig.downloads.disc_subdirectories} onChange={(v) => updateLocal('downloads', 'disc_subdirectories', v)} />
                      <ToggleField label="Concurrent Downloads" description="Download tracks in parallel" value={localConfig.downloads.concurrency} onChange={(v) => updateLocal('downloads', 'concurrency', v)} />
                      <InputField label="Requests Per Minute" value={localConfig.downloads.requests_per_minute} onChange={(v) => updateLocal('downloads', 'requests_per_minute', parseInt(v) || 60)} />
                      <ToggleField label="Verify SSL" description="Verify SSL certificates for API connections" value={localConfig.downloads.verify_ssl} onChange={(v) => updateLocal('downloads', 'verify_ssl', v)} />
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-5">
                    <h3 className="text-[14px] font-semibold text-text-primary mb-4">Conversion</h3>
                    <div className="space-y-3">
                      <ToggleField label="Enable Conversion" description="Convert after downloading" value={localConfig.conversion.enabled} onChange={(v) => updateLocal('conversion', 'enabled', v)} />
                      {localConfig.conversion.enabled && (
                        <>
                          <SelectField label="Codec" value={localConfig.conversion.codec} onChange={(v) => updateLocal('conversion', 'codec', v)} options={[
                            { value: 'ALAC', label: 'ALAC' },
                            { value: 'FLAC', label: 'FLAC' },
                            { value: 'MP3', label: 'MP3' },
                            { value: 'AAC', label: 'AAC' },
                            { value: 'OGG', label: 'OGG Vorbis' },
                            { value: 'OPUS', label: 'Opus' },
                          ]} />
                          <InputField label="Lossy Bitrate (kbps)" value={localConfig.conversion.lossy_bitrate} onChange={(v) => updateLocal('conversion', 'lossy_bitrate', parseInt(v) || 320)} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'quality' && (
                <div className="space-y-6">
                  {(['qobuz', 'tidal', 'deezer', 'soundcloud'] as MusicSource[]).map((src) => {
                    const qualityOptions = {
                      qobuz: [
                        { value: 1, label: 'MP3 320kbps' },
                        { value: 2, label: 'FLAC 16-bit/44.1kHz (CD)' },
                        { value: 3, label: 'FLAC 24-bit/96kHz (Hi-Res)' },
                        { value: 4, label: 'FLAC 24-bit/192kHz (Best)' },
                      ],
                      tidal: [
                        { value: 0, label: 'AAC 96kbps (Low)' },
                        { value: 1, label: 'AAC 320kbps (High)' },
                        { value: 2, label: 'FLAC 16-bit/44.1kHz (Lossless)' },
                        { value: 3, label: 'MQA FLAC 24-bit (Master)' },
                      ],
                      deezer: [
                        { value: 0, label: 'MP3 128kbps' },
                        { value: 1, label: 'MP3 320kbps' },
                        { value: 2, label: 'FLAC 16-bit/44.1kHz' },
                      ],
                      soundcloud: [
                        { value: 0, label: 'MP3 (Default)' },
                      ],
                    };

                    return (
                      <div key={src} className="glass rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_COLORS[src] }} />
                          <h3 className="text-[14px] font-semibold text-text-primary">{SOURCE_LABELS[src]}</h3>
                        </div>
                        <SelectField
                          label="Max Quality"
                          value={localConfig[src]?.quality ?? 0}
                          onChange={(v) => updateLocal(src, 'quality', parseInt(v))}
                          options={qualityOptions[src]}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'artwork' && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-[14px] font-semibold text-text-primary mb-4">Artwork Settings</h3>
                  <div className="space-y-3">
                    <ToggleField label="Embed Artwork" description="Embed cover art into audio files" value={localConfig.artwork.embed} onChange={(v) => updateLocal('artwork', 'embed', v)} />
                    <SelectField label="Embed Size" value={localConfig.artwork.embed_size} onChange={(v) => updateLocal('artwork', 'embed_size', v)} options={[
                      { value: 'thumbnail', label: 'Thumbnail (160px)' },
                      { value: 'small', label: 'Small (320px)' },
                      { value: 'large', label: 'Large (640px)' },
                      { value: 'original', label: 'Original (Full size)' },
                    ]} />
                    <InputField label="Embed Max Width (px)" value={localConfig.artwork.embed_max_width} onChange={(v) => updateLocal('artwork', 'embed_max_width', parseInt(v) || -1)} />
                    <ToggleField label="Save Artwork" description="Save cover as separate JPEG file" value={localConfig.artwork.save_artwork} onChange={(v) => updateLocal('artwork', 'save_artwork', v)} />
                    <InputField label="Saved Max Width (px)" value={localConfig.artwork.saved_max_width} onChange={(v) => updateLocal('artwork', 'saved_max_width', parseInt(v) || -1)} />
                  </div>
                </div>
              )}

              {activeTab === 'filepaths' && (
                <div className="space-y-6">
                  <div className="glass rounded-2xl p-5">
                    <h3 className="text-[14px] font-semibold text-text-primary mb-4">File Path Templates</h3>
                    <div className="space-y-4">
                      <div>
                        <InputField
                          label="Folder Format"
                          value={localConfig.filepaths?.folder_format ?? '{albumartist} - {title} ({year}) [{container}] [{bit_depth}B-{sampling_rate}kHz]'}
                          onChange={(v) => updateLocal('filepaths', 'folder_format', v)}
                          placeholder="{albumartist} - {title} ({year})"
                        />
                        <p className="text-[10px] text-text-muted/60 mt-1.5 px-1">
                          Keys: {'{albumartist}'}, {'{title}'}, {'{year}'}, {'{bit_depth}'}, {'{sampling_rate}'}, {'{id}'}, {'{albumcomposer}'}, {'{container}'}
                        </p>
                      </div>
                      <div>
                        <InputField
                          label="Track Format"
                          value={localConfig.filepaths?.track_format ?? '{tracknumber:02}. {artist} - {title}{explicit}'}
                          onChange={(v) => updateLocal('filepaths', 'track_format', v)}
                          placeholder="{tracknumber:02}. {artist} - {title}"
                        />
                        <p className="text-[10px] text-text-muted/60 mt-1.5 px-1">
                          Keys: {'{tracknumber}'}, {'{artist}'}, {'{albumartist}'}, {'{composer}'}, {'{title}'}, {'{albumcomposer}'}, {'{explicit}'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-5">
                    <h3 className="text-[14px] font-semibold text-text-primary mb-4">Path Options</h3>
                    <div className="space-y-3">
                      <ToggleField label="Add Singles to Folder" description="Create album-style folders for single tracks" value={localConfig.filepaths?.add_singles_to_folder ?? false} onChange={(v) => updateLocal('filepaths', 'add_singles_to_folder', v)} />
                      <ToggleField label="Restrict Characters" description="Only allow printable ASCII characters in filenames" value={localConfig.filepaths?.restrict_characters ?? false} onChange={(v) => updateLocal('filepaths', 'restrict_characters', v)} />
                      <InputField label="Truncate Filename To (chars)" value={localConfig.filepaths?.truncate_to ?? 120} onChange={(v) => updateLocal('filepaths', 'truncate_to', parseInt(v) || 120)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'filters' && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-[14px] font-semibold text-text-primary mb-2">Qobuz Discography Filters</h3>
                  <p className="text-[11px] text-text-muted mb-4">
                    Filter an artist's discography when downloading. Also applies to other sources but may not work correctly.
                  </p>
                  <div className="space-y-3">
                    <ToggleField label="Filter Extras" description="Remove Collector's Editions, live recordings, etc." value={localConfig.qobuz_filters?.extras ?? false} onChange={(v) => updateLocal('qobuz_filters', 'extras', v)} />
                    <ToggleField label="Filter Repeats" description="Pick highest quality among albums with identical titles" value={localConfig.qobuz_filters?.repeats ?? false} onChange={(v) => updateLocal('qobuz_filters', 'repeats', v)} />
                    <ToggleField label="Filter Non-Albums" description="Remove EPs and Singles" value={localConfig.qobuz_filters?.non_albums ?? false} onChange={(v) => updateLocal('qobuz_filters', 'non_albums', v)} />
                    <ToggleField label="Filter Features" description="Remove albums where the artist is a featured guest" value={localConfig.qobuz_filters?.features ?? false} onChange={(v) => updateLocal('qobuz_filters', 'features', v)} />
                    <ToggleField label="Non-Studio Albums" description="Skip live albums, compilations, etc." value={localConfig.qobuz_filters?.non_studio_albums ?? false} onChange={(v) => updateLocal('qobuz_filters', 'non_studio_albums', v)} />
                    <ToggleField label="Non-Remaster Only" description="Only download remastered versions" value={localConfig.qobuz_filters?.non_remaster ?? false} onChange={(v) => updateLocal('qobuz_filters', 'non_remaster', v)} />
                  </div>
                </div>
              )}

              {activeTab === 'metadata' && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-[14px] font-semibold text-text-primary mb-4">Metadata Options</h3>
                  <div className="space-y-3">
                    <ToggleField label="Set Playlist as Album" description="Use playlist name as the 'ALBUM' metadata field" value={localConfig.metadata?.set_playlist_to_album ?? true} onChange={(v) => updateLocal('metadata', 'set_playlist_to_album', v)} />
                    <ToggleField label="Renumber Playlist Tracks" description="Use playlist position instead of album track number" value={localConfig.metadata?.renumber_playlist_tracks ?? true} onChange={(v) => updateLocal('metadata', 'renumber_playlist_tracks', v)} />
                    <div>
                      <InputField
                        label="Exclude Tags (comma-separated)"
                        value={(localConfig.metadata?.exclude ?? []).join(', ')}
                        onChange={(v) => updateLocal('metadata', 'exclude', v.split(',').map((s: string) => s.trim()).filter(Boolean))}
                        placeholder="e.g. comment, lyrics"
                      />
                      <p className="text-[10px] text-text-muted/60 mt-1.5 px-1">
                        Tags listed here won't be written to audio files
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'database' && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-[14px] font-semibold text-text-primary mb-2">Download Database</h3>
                  <p className="text-[11px] text-text-muted mb-4">
                    Track downloaded items to automatically skip duplicates.
                  </p>
                  <div className="space-y-3">
                    <ToggleField label="Track Downloads" description="Skip previously downloaded tracks (recommended)" value={localConfig.database?.downloads_enabled ?? true} onChange={(v) => updateLocal('database', 'downloads_enabled', v)} />
                    <ToggleField label="Track Failed Downloads" description="Remember failed items for retry with 'rip repair'" value={localConfig.database?.failed_downloads_enabled ?? true} onChange={(v) => updateLocal('database', 'failed_downloads_enabled', v)} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
