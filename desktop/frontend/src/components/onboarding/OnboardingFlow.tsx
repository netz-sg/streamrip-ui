import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Link2,
  Search,
  Download,
  ListPlus,
  Sparkles,
  Music4,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  Zap,
  Shield,
  Rocket,
} from 'lucide-react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useConfigStore } from '../../stores/configStore';
import { SOURCE_COLORS, SOURCE_LABELS } from '../../api/types';
import type { MusicSource } from '../../api/types';

const TOTAL_STEPS = 6;

/* ─── Shared animation variants ─── */
const pageVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ═══════════════════════════════════════════════════════════════════════
   Step 0 — Welcome
   ═══════════════════════════════════════════════════════════════════ */
function StepWelcome() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center text-center h-full px-8"
    >
      {/* Animated Logo */}
      <motion.div
        variants={fadeUp}
        className="relative mb-8"
      >
        <motion.div
          className="absolute inset-0 rounded-3xl bg-accent-primary/20 blur-[60px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="streamrip"
          className="w-24 h-24 rounded-3xl object-contain relative z-10"
          draggable={false}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
          Welcome to{' '}
          <span className="text-gradient-accent">streamrip</span>
        </h1>
      </motion.div>

      <motion.p
        variants={fadeUp}
        className="text-[15px] text-text-secondary max-w-md leading-relaxed mt-3"
      >
        Your personal music downloader. Preview artwork, tracklists, and audio quality
        from your favorite streaming services — then download in lossless quality.
      </motion.p>

      {/* Floating service pills */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-3 mt-10"
      >
        {(['qobuz', 'tidal', 'deezer', 'soundcloud'] as MusicSource[]).map((src, i) => (
          <motion.span
            key={src}
            className="px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border"
            style={{
              color: SOURCE_COLORS[src],
              borderColor: `${SOURCE_COLORS[src]}30`,
              background: `${SOURCE_COLORS[src]}10`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            {SOURCE_LABELS[src]}
          </motion.span>
        ))}
      </motion.div>

      {/* Subtle animated dots */}
      <motion.div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          className="w-1.5 h-1.5 rounded-full bg-accent-primary/40"
        />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          className="w-1.5 h-1.5 rounded-full bg-accent-primary/40"
        />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          className="w-1.5 h-1.5 rounded-full bg-accent-primary/40"
        />
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Step 1 — URL Paste & Preview
   ═══════════════════════════════════════════════════════════════════ */
function StepUrlPreview() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center text-center h-full px-8"
    >
      <motion.div variants={fadeUp} className="relative mb-6">
        <motion.div
          className="w-20 h-20 rounded-3xl bg-linear-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Link2 size={32} className="text-accent-primary" />
        </motion.div>
      </motion.div>

      <motion.h2 variants={fadeUp} className="font-display text-2xl font-bold text-text-primary mb-2">
        Paste & Preview
      </motion.h2>
      <motion.p variants={fadeUp} className="text-[14px] text-text-secondary max-w-lg leading-relaxed">
        Copy a URL from any supported streaming service and paste it into the app.
        You'll instantly see album artwork, tracklists, and audio quality
        before downloading anything.
      </motion.p>

      {/* Mock URL bar */}
      <motion.div
        variants={fadeUp}
        className="w-full max-w-lg mt-10"
      >
        <motion.div
          className="glass-strong rounded-2xl flex items-center gap-3 px-5 py-4 glow-accent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link2 size={18} className="text-accent-primary shrink-0" />
          <motion.span
            className="text-[13px] text-text-muted"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            https://open.qobuz.com/album/example...
          </motion.span>
          <motion.div
            className="ml-auto px-3 py-1.5 rounded-lg bg-accent-primary/15 text-accent-primary"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.4, type: 'spring', stiffness: 300 }}
          >
            <ChevronRight size={14} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Feature pills */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 mt-6 flex-wrap justify-center">
        {[
          { icon: Eye, label: 'Artwork Preview' },
          { icon: Music4, label: 'Tracklist' },
          { icon: Sparkles, label: 'Quality Info' },
        ].map(({ icon: Icon, label }, i) => (
          <motion.div
            key={label}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface/60 border border-border-subtle text-[12px] text-text-secondary"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.15 }}
          >
            <Icon size={13} className="text-accent-primary" />
            {label}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Step 2 — Search & Discovery
   ═══════════════════════════════════════════════════════════════════ */
function StepSearch() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center text-center h-full px-8"
    >
      <motion.div variants={fadeUp} className="relative mb-6">
        <motion.div
          className="w-20 h-20 rounded-3xl bg-linear-to-br from-accent-secondary/20 to-accent-primary/20 border border-accent-secondary/30 flex items-center justify-center"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Search size={32} className="text-accent-secondary" />
        </motion.div>
      </motion.div>

      <motion.h2 variants={fadeUp} className="font-display text-2xl font-bold text-text-primary mb-2">
        Search & Discover
      </motion.h2>
      <motion.p variants={fadeUp} className="text-[14px] text-text-secondary max-w-lg leading-relaxed">
        Search across all your connected services at once. Find albums, tracks,
        artists, and playlists — all from one unified search bar.
      </motion.p>

      {/* Animated search results mockup */}
      <motion.div
        variants={fadeUp}
        className="w-full max-w-md mt-10 space-y-2"
      >
        {[
          { title: 'Random Access Memories', artist: 'Daft Punk', color: SOURCE_COLORS.qobuz, source: 'Qobuz' },
          { title: 'Discovery', artist: 'Daft Punk', color: SOURCE_COLORS.tidal, source: 'TIDAL' },
          { title: 'Homework', artist: 'Daft Punk', color: SOURCE_COLORS.deezer, source: 'Deezer' },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            className="glass rounded-xl px-4 py-3 flex items-center gap-3 text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
            whileHover={{ x: 4 }}
          >
            <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
              <Music4 size={16} className="text-text-muted/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-text-primary font-medium truncate">{item.title}</p>
              <p className="text-[11px] text-text-muted truncate">{item.artist}</p>
            </div>
            <span
              className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border"
              style={{
                color: item.color,
                borderColor: `${item.color}30`,
                background: `${item.color}10`,
              }}
            >
              {item.source}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Step 3 — Bulk Import & Downloads
   ═══════════════════════════════════════════════════════════════════ */
function StepDownloads() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center text-center h-full px-8"
    >
      <motion.div variants={fadeUp} className="flex gap-4 mb-6">
        <motion.div
          className="w-16 h-16 rounded-2xl bg-linear-to-br from-success/20 to-accent-primary/10 border border-success/30 flex items-center justify-center"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Download size={24} className="text-success" />
        </motion.div>
        <motion.div
          className="w-16 h-16 rounded-2xl bg-linear-to-br from-accent-primary/20 to-accent-secondary/10 border border-accent-primary/30 flex items-center justify-center"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        >
          <ListPlus size={24} className="text-accent-primary" />
        </motion.div>
      </motion.div>

      <motion.h2 variants={fadeUp} className="font-display text-2xl font-bold text-text-primary mb-2">
        Downloads & Bulk Import
      </motion.h2>
      <motion.p variants={fadeUp} className="text-[14px] text-text-secondary max-w-lg leading-relaxed">
        Download single albums or paste multiple URLs at once with Bulk Import.
        Track progress in real-time, save items to your wishlist, and manage your
        entire download history.
      </motion.p>

      {/* Feature grid */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 gap-3 mt-10 w-full max-w-md"
      >
        {[
          { icon: Zap, title: 'Real-Time Progress', desc: 'Live track-by-track updates' },
          { icon: ListPlus, title: 'Bulk Import', desc: 'Multiple URLs at once' },
          { icon: Shield, title: 'Skip Duplicates', desc: 'Smart download tracking' },
          { icon: Sparkles, title: 'Lossless Quality', desc: 'FLAC, Hi-Res, MQA' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            className="glass rounded-2xl p-4 text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            whileHover={{ y: -2, borderColor: 'rgba(99, 102, 241, 0.3)' }}
          >
            <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mb-2.5">
              <Icon size={16} className="text-accent-primary" />
            </div>
            <h4 className="text-[13px] font-semibold text-text-primary">{title}</h4>
            <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Step 4 — Choose Service & Login
   ═══════════════════════════════════════════════════════════════════ */
const serviceInfo: Record<string, {
  name: string;
  desc: string;
  color: string;
  fields: { key: string; label: string; type: string; placeholder: string }[];
  note?: string;
}> = {
  qobuz: {
    name: 'Qobuz',
    desc: 'Hi-Res lossless up to 24-bit/192kHz',
    color: SOURCE_COLORS.qobuz,
    fields: [
      { key: 'email_or_userid', label: 'Email or User ID', type: 'text', placeholder: 'your@email.com' },
      { key: 'password_or_token', label: 'Password or Token', type: 'password', placeholder: 'Your password' },
    ],
  },
  deezer: {
    name: 'Deezer',
    desc: 'FLAC 16-bit/44.1kHz with ARL cookie',
    color: SOURCE_COLORS.deezer,
    fields: [
      { key: 'arl', label: 'ARL Cookie', type: 'password', placeholder: 'Your Deezer ARL cookie' },
    ],
    note: 'To find your ARL: Log in to Deezer in your browser → open DevTools (F12) → Application tab → Cookies → copy the "arl" value.',
  },
  tidal: {
    name: 'TIDAL',
    desc: 'MQA / FLAC quality via OAuth',
    color: SOURCE_COLORS.tidal,
    fields: [],
    note: 'TIDAL uses OAuth. After setup, run "rip config --tidal" in a terminal to authenticate. You can do this later in Settings.',
  },
  soundcloud: {
    name: 'SoundCloud',
    desc: 'MP3 downloads — no login needed',
    color: SOURCE_COLORS.soundcloud,
    fields: [],
    note: 'SoundCloud requires no authentication. You\'re ready to go!',
  },
};

function StepServiceSelect() {
  const { selectedService, selectService } = useOnboardingStore();
  const { config, loadConfig, saveConfig } = useConfigStore();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const info = selectedService ? serviceInfo[selectedService] : null;

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSaveCredentials = async () => {
    if (!selectedService || !config) return;
    const updates: Record<string, unknown> = {};

    if (selectedService === 'qobuz') {
      updates.qobuz = {
        ...config.qobuz,
        email_or_userid: credentials.email_or_userid || config.qobuz.email_or_userid,
        password_or_token: credentials.password_or_token || config.qobuz.password_or_token,
      };
    } else if (selectedService === 'deezer') {
      updates.deezer = {
        ...config.deezer,
        arl: credentials.arl || config.deezer.arl,
      };
    }

    if (Object.keys(updates).length > 0) {
      await saveConfig(updates as Partial<typeof config>);
      setSaved(true);
    }
  };

  const hasFields = info && info.fields.length > 0;
  const hasFilledFields = hasFields && info.fields.every((f) => credentials[f.key]?.trim());

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center h-full px-8 pt-6 overflow-y-auto"
    >
      <motion.h2 variants={fadeUp} className="font-display text-2xl font-bold text-text-primary mb-2 text-center">
        Choose Your Service
      </motion.h2>
      <motion.p variants={fadeUp} className="text-[14px] text-text-secondary max-w-lg text-center leading-relaxed mb-8">
        Select the streaming service you want to use. You can add more services
        later in Settings.
      </motion.p>

      {/* Service Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 w-full max-w-lg mb-6">
        {Object.entries(serviceInfo).map(([key, svc], i) => {
          const isSelected = selectedService === key;
          return (
            <motion.button
              key={key}
              onClick={() => {
                selectService(key);
                setCredentials({});
                setSaved(false);
              }}
              className={`
                relative p-4 rounded-2xl text-left transition-all duration-200
                ${isSelected
                  ? 'glass-strong ring-1'
                  : 'glass hover:bg-bg-hover/40'
                }
              `}
              style={{
                borderColor: isSelected ? `${svc.color}40` : undefined,
                boxShadow: isSelected ? `0 0 0 1px ${svc.color}50` : undefined,
              }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <motion.div
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: svc.color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Check size={12} className="text-white" />
                </motion.div>
              )}
              <div
                className="w-3 h-3 rounded-full mb-3"
                style={{ background: svc.color }}
              />
              <h4 className="text-[14px] font-semibold text-text-primary">{svc.name}</h4>
              <p className="text-[11px] text-text-muted mt-1">{svc.desc}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Credential Form */}
      <AnimatePresence mode="wait">
        {selectedService && info && (
          <motion.div
            key={selectedService}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
          >
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: info.color }} />
                <h3 className="text-[14px] font-semibold text-text-primary">
                  {info.name} Setup
                </h3>
              </div>

              {hasFields && (
                <div className="space-y-3 mb-4">
                  {info.fields.map((field) => (
                    <div key={field.key}>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                        {field.label}
                      </label>
                      <div className="relative">
                        <input
                          type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                          value={credentials[field.key] || ''}
                          onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-border-subtle text-[13px] text-text-primary placeholder:text-text-muted/40 focus:border-accent-primary/40 focus:ring-1 focus:ring-accent-primary/20 transition-all"
                        />
                        {field.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => setShowPasswords((p) => ({ ...p, [field.key]: !p[field.key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                          >
                            {showPasswords[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <motion.button
                    onClick={handleSaveCredentials}
                    disabled={!hasFilledFields || saved}
                    className={`
                      w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200
                      ${saved
                        ? 'bg-success/15 text-success border border-success/30'
                        : 'bg-accent-primary text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed'
                      }
                    `}
                    whileTap={{ scale: 0.98 }}
                  >
                    {saved ? (
                      <span className="flex items-center justify-center gap-2">
                        <Check size={14} /> Saved
                      </span>
                    ) : (
                      'Save Credentials'
                    )}
                  </motion.button>
                </div>
              )}

              {info.note && (
                <div className="px-4 py-3 rounded-xl bg-bg-surface/50 border border-border-subtle">
                  <p className="text-[12px] text-text-muted leading-relaxed">{info.note}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Step 5 — All Set!
   ═══════════════════════════════════════════════════════════════════ */
function StepComplete({ onFinish }: { onFinish: () => void }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center text-center h-full px-8"
    >
      {/* Animated checkmark */}
      <motion.div
        variants={fadeUp}
        className="relative mb-8"
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-success/20 blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="w-24 h-24 rounded-full bg-linear-to-br from-success/20 to-accent-primary/10 border-2 border-success/40 flex items-center justify-center relative z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
          >
            <Rocket size={36} className="text-success" />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold text-text-primary mb-2">
        You're All Set!
      </motion.h2>
      <motion.p variants={fadeUp} className="text-[14px] text-text-secondary max-w-md leading-relaxed">
        Everything is configured. Start by pasting a music URL on the Home page
        or use Search to find your favorite albums.
      </motion.p>

      <motion.p variants={fadeUp} className="text-[12px] text-text-muted mt-4 max-w-sm">
        You can always change your services and settings later, or restart this
        setup from the Settings page.
      </motion.p>

      <motion.button
        variants={fadeUp}
        onClick={onFinish}
        className="
          mt-10 inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl
          bg-linear-to-r from-accent-primary to-accent-secondary
          text-white text-[14px] font-semibold
          hover:shadow-lg hover:shadow-accent-primary/25
          active:scale-[0.97] transition-all duration-200
        "
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        Start Using streamrip
        <ArrowRight size={16} />
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Onboarding Flow
   ═══════════════════════════════════════════════════════════════════ */
export default function OnboardingFlow() {
  const { currentStep, nextStep, prevStep, completeOnboarding } = useOnboardingStore();
  const [direction, setDirection] = useState(1);

  const goNext = useCallback(() => {
    setDirection(1);
    if (currentStep === TOTAL_STEPS - 1) {
      completeOnboarding();
    } else {
      nextStep();
    }
  }, [currentStep, nextStep, completeOnboarding]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    prevStep();
  }, [prevStep]);

  const steps = [
    <StepWelcome key="welcome" />,
    <StepUrlPreview key="url" />,
    <StepSearch key="search" />,
    <StepDownloads key="downloads" />,
    <StepServiceSelect key="service" />,
    <StepComplete key="complete" onFinish={completeOnboarding} />,
  ];

  return (
    <div className="fixed inset-0 z-100 bg-bg-primary noise flex flex-col overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-125 h-125 rounded-full bg-accent-primary/5 blur-[120px]"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-100 h-100 rounded-full bg-accent-secondary/5 blur-[100px]"
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 20, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-8 pt-6">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-bg-elevated">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-accent-primary to-accent-secondary"
                initial={{ width: '0%' }}
                animate={{ width: i <= currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] text-text-muted mt-2 tabular-nums">
          {currentStep + 1} / {TOTAL_STEPS}
        </p>
      </div>

      {/* Step Content */}
      <div className="flex-1 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center"
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="relative z-10 px-8 pb-8">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
              <motion.button
                onClick={goPrev}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] text-text-muted hover:text-text-primary hover:bg-bg-hover/50 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileTap={{ scale: 0.97 }}
              >
                <ChevronLeft size={16} />
                Back
              </motion.button>
            )}
          </div>

          {currentStep < TOTAL_STEPS - 1 && (
            <motion.button
              onClick={goNext}
              className="
                inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
                bg-accent-primary text-white text-[13px] font-semibold
                hover:bg-accent-hover transition-colors duration-200
              "
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {currentStep === 0 ? 'Get Started' : 'Continue'}
              <ChevronRight size={16} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Skip link */}
      {currentStep < TOTAL_STEPS - 1 && (
        <motion.button
          onClick={completeOnboarding}
          className="absolute top-6 right-8 z-20 text-[12px] text-text-muted hover:text-text-secondary transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Skip Setup
        </motion.button>
      )}
    </div>
  );
}
