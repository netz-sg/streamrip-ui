"""Monkey-patch streamrip's progress module to capture real-time download progress.

Instead of rendering Rich progress bars to the terminal, this module intercepts
progress callbacks and forwards them to the DownloadManager via a callback function.
"""

import time
import logging
from dataclasses import dataclass, field
from typing import Callable

logger = logging.getLogger("streamrip_desktop")


@dataclass
class TrackProgress:
    """Per-track byte-level progress state."""
    desc: str
    total_bytes: int
    downloaded_bytes: int = 0
    start_time: float = field(default_factory=time.monotonic)

    @property
    def percent(self) -> float:
        if self.total_bytes <= 0:
            return 0.0
        return min(100.0, (self.downloaded_bytes / self.total_bytes) * 100.0)

    @property
    def speed_bps(self) -> float:
        elapsed = time.monotonic() - self.start_time
        if elapsed <= 0:
            return 0.0
        return self.downloaded_bytes / elapsed

    @property
    def eta_seconds(self) -> float | None:
        speed = self.speed_bps
        if speed <= 0:
            return None
        remaining = self.total_bytes - self.downloaded_bytes
        return remaining / speed


def _format_speed(bps: float) -> str:
    if bps >= 1_048_576:
        return f"{bps / 1_048_576:.1f} MB/s"
    if bps >= 1024:
        return f"{bps / 1024:.0f} KB/s"
    return f"{bps:.0f} B/s"


def _format_eta(seconds: float | None) -> str | None:
    if seconds is None or seconds < 0:
        return None
    seconds = int(seconds)
    if seconds >= 3600:
        h = seconds // 3600
        m = (seconds % 3600) // 60
        return f"{h}h {m}m"
    if seconds >= 60:
        m = seconds // 60
        s = seconds % 60
        return f"{m}m {s}s"
    return f"{seconds}s"


@dataclass
class _Handle:
    """Drop-in replacement for streamrip.progress.Handle."""
    update: Callable[[int], None]
    done: Callable[[], None]

    def __enter__(self):
        return self.update

    def __exit__(self, *_):
        self.done()


class ProgressHook:
    """Captures streamrip progress events and forwards them to a callback.

    Usage::

        hook = ProgressHook(on_update_callback)
        hook.install()       # monkey-patches streamrip.progress
        await main.rip()     # progress events flow through the hook
        hook.uninstall()     # restores original functions
    """

    def __init__(self, on_update: Callable[[], None]):
        self._on_update = on_update
        self._tracks: dict[int, TrackProgress] = {}
        self._track_counter = 0
        self._completed_tracks = 0
        self._current_titles: list[str] = []
        self._current_track_desc: str | None = None

        # total aggregate bytes across all tracks for overall progress
        self._total_bytes_all = 0
        self._downloaded_bytes_all = 0

        # store originals for uninstall
        self._originals: dict[str, object] = {}
        self._throttle_interval = 0.25  # seconds between updates
        self._last_update_time = 0.0

    # ── Public properties ────────────────────────────────────────────

    @property
    def progress(self) -> float:
        if self._total_bytes_all <= 0:
            return 0.0
        return min(99.9, (self._downloaded_bytes_all / self._total_bytes_all) * 100.0)

    @property
    def speed(self) -> str | None:
        # Aggregate speed from active tracks
        total_speed = sum(t.speed_bps for t in self._tracks.values() if t.downloaded_bytes < t.total_bytes)
        if total_speed <= 0:
            return None
        return _format_speed(total_speed)

    @property
    def eta(self) -> str | None:
        remaining = self._total_bytes_all - self._downloaded_bytes_all
        total_speed = sum(t.speed_bps for t in self._tracks.values() if t.downloaded_bytes < t.total_bytes)
        if total_speed <= 0:
            return None
        return _format_eta(remaining / total_speed)

    @property
    def current_track(self) -> str | None:
        return self._current_track_desc

    @property
    def completed_tracks(self) -> int:
        return self._completed_tracks

    # ── Install / Uninstall ──────────────────────────────────────────

    def install(self):
        """Monkey-patch streamrip.progress with our interceptors."""
        import streamrip.progress as prog

        self._originals = {
            "get_progress_callback": prog.get_progress_callback,
            "add_title": prog.add_title,
            "remove_title": prog.remove_title,
            "clear_progress": prog.clear_progress,
        }

        prog.get_progress_callback = self._get_progress_callback
        prog.add_title = self._add_title
        prog.remove_title = self._remove_title
        prog.clear_progress = self._clear_progress

    def uninstall(self):
        """Restore original streamrip.progress functions."""
        import streamrip.progress as prog

        for name, original in self._originals.items():
            setattr(prog, name, original)
        self._originals.clear()

    # ── Interceptor implementations ──────────────────────────────────

    def _get_progress_callback(self, enabled: bool, total: int, desc: str) -> _Handle:
        self._track_counter += 1
        track_id = self._track_counter

        track = TrackProgress(desc=desc, total_bytes=total)
        self._tracks[track_id] = track
        self._total_bytes_all += total
        self._current_track_desc = desc

        def _update(chunk_bytes: int):
            track.downloaded_bytes += chunk_bytes
            self._downloaded_bytes_all += chunk_bytes
            self._current_track_desc = desc
            self._throttled_notify()

        def _done():
            track.downloaded_bytes = track.total_bytes  # ensure 100%
            self._completed_tracks += 1
            self._current_track_desc = desc
            # Force immediate notification on track completion
            self._last_update_time = 0
            self._throttled_notify()
            # Cleanup
            if track_id in self._tracks:
                del self._tracks[track_id]

        return _Handle(_update, _done)

    def _add_title(self, title: str):
        self._current_titles.append(title.strip())

    def _remove_title(self, title: str):
        t = title.strip()
        if t in self._current_titles:
            self._current_titles.remove(t)

    def _clear_progress(self):
        pass  # No-op — we don't have a terminal to clear

    def _throttled_notify(self):
        now = time.monotonic()
        if now - self._last_update_time >= self._throttle_interval:
            self._last_update_time = now
            try:
                self._on_update()
            except Exception as e:
                logger.error(f"Progress hook notification error: {e}")
