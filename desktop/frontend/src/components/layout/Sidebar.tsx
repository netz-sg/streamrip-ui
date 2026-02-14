import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Download,
  Search,
  Settings,
  Clock,
  Bookmark,
} from 'lucide-react';
import { useDownloadStore } from '../../stores/downloadStore';
import { checkHealth } from '../../api/client';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/downloads', icon: Download, label: 'Downloads' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/wishlist', icon: Bookmark, label: 'Saved' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const downloads = useDownloadStore((s) => s.downloads);
  const activeCount = downloads.filter(
    (d) => d.status === 'downloading' || d.status === 'queued',
  ).length;

  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      const ok = await checkHealth();
      if (mounted) setHealthy(ok);
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <aside className="w-[220px] h-full flex flex-col bg-bg-secondary/60 border-r border-border-subtle shrink-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="streamrip-ui"
          className="w-9 h-9 rounded-xl object-contain"
          draggable={false}
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[15px] font-semibold tracking-tight text-text-primary">
              streamrip
            </h1>
            <span className="px-1.5 py-0.5 rounded-md bg-accent-primary/15 border border-accent-primary/30 text-[9px] font-bold uppercase tracking-widest text-accent-hover">
              Beta
            </span>
          </div>
          <p className="text-[10px] text-text-muted tracking-widest uppercase font-medium">
            ui
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            const Icon = item.icon;

            return (
              <NavLink key={item.to} to={item.to} className="block">
                <motion.div
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                    transition-colors duration-200 group
                    ${
                      isActive
                        ? 'text-text-primary'
                        : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover/50'
                    }
                  `}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-bg-elevated border border-border-subtle"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={`relative z-10 transition-colors ${
                      isActive ? 'text-accent-primary' : 'group-hover:text-text-secondary'
                    }`}
                  />
                  <span className="relative z-10">{item.label}</span>

                  {/* Active download badge */}
                  <AnimatePresence>
                    {item.to === '/downloads' && activeCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="relative z-10 ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent-primary text-[10px] font-bold text-white tabular-nums"
                      >
                        {activeCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 pb-5 mt-auto">
        <div className="p-3 rounded-xl bg-bg-surface/50 border border-border-subtle">
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                healthy === null
                  ? 'bg-yellow-400 animate-pulse'
                  : healthy
                    ? 'bg-success animate-pulse'
                    : 'bg-red-500'
              }`}
            />
            <span className="text-[11px] text-text-muted font-medium">
              {healthy === null ? 'Connecting…' : healthy ? 'Backend' : 'Offline'}
            </span>
          </div>
          <p className="text-[10px] text-text-muted/60">v1.0.4 &middot; Beta</p>
        </div>
      </div>
    </aside>
  );
}
