"""Async download manager with queue and progress tracking."""

import asyncio
import logging
import os
import pathlib
import sys
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable

REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "repo"))
if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)

logger = logging.getLogger("streamrip_desktop")

try:
    from streamrip.config import Config, DEFAULT_CONFIG_PATH
    from streamrip.rip.main import Main
except ImportError as exc:
    logger.critical("Failed to import streamrip in download_manager: %s", exc)
    raise RuntimeError(f"streamrip import failed: {exc}") from exc

from .progress_hook import ProgressHook

# Avoid circular import – use TYPE_CHECKING for type hints only
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .download_history import DownloadHistoryDB


@dataclass
class DownloadJob:
    id: str
    url: str
    title: str = "Unknown"
    artist: str = "Unknown"
    cover_url: str | None = None
    source: str = ""
    status: str = "queued"
    progress: float = 0.0
    speed: str | None = None
    eta: str | None = None
    error: str | None = None
    current_track: str | None = None
    total_tracks: int = 0
    completed_tracks: int = 0
    download_path: str | None = None
    task: asyncio.Task | None = field(default=None, repr=False)


class DownloadManager:
    def __init__(self, wrapper, broadcast_fn: Callable | None = None, history_db: "DownloadHistoryDB | None" = None):
        self.wrapper = wrapper
        self.jobs: dict[str, DownloadJob] = {}
        self.broadcast = broadcast_fn
        self.history_db = history_db
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task: asyncio.Task | None = None
        self._max_concurrent = 2

    def start(self):
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._worker())

    async def _worker(self):
        while True:
            job_id = await self._queue.get()
            job = self.jobs.get(job_id)
            if job is None or job.status == "cancelled":
                self._queue.task_done()
                continue

            job.status = "downloading"
            await self._notify(job)

            try:
                await self._run_download(job)
                job.status = "completed"
                job.progress = 100.0
            except asyncio.CancelledError:
                job.status = "cancelled"
            except Exception as e:
                job.status = "failed"
                job.error = str(e)
                logger.error(f"Download failed for {job.url}: {e}")
            finally:
                await self._notify(job)
                self._save_to_history(job)
                self._queue.task_done()

    async def _run_download(self, job: DownloadJob):
        self.wrapper._ensure_config()
        config = self.wrapper.config
        base_folder = config.session.downloads.folder

        # Create progress hook that broadcasts real-time updates via WebSocket
        def _on_progress():
            job.progress = hook.progress
            job.speed = hook.speed
            job.eta = hook.eta
            job.current_track = hook.current_track
            job.completed_tracks = hook.completed_tracks
            asyncio.ensure_future(self._notify(job))

        hook = ProgressHook(_on_progress)

        async with Main(config) as main:
            await main.add(job.url)
            await main.resolve()

            for media in main.media:
                meta = getattr(media, "meta", None)
                if meta:
                    job.title = getattr(meta, "album", job.title)
                    job.artist = getattr(meta, "albumartist", job.artist)

                tracks = getattr(media, "tracks", [])
                job.total_tracks = len(tracks) if tracks else 1
                await self._notify(job)

            hook.install()
            try:
                await main.rip()
            finally:
                hook.uninstall()

        # Determine actual download path
        job.download_path = self._find_download_path(
            base_folder, config, job.artist, job.title, job.source,
        )

    @staticmethod
    def _find_download_path(
        base_folder: str, config, artist: str, title: str, source: str,
    ) -> str:
        """Find the actual album folder after download."""
        candidates = []
        base = pathlib.Path(base_folder)

        # Try with source subdirectory
        if config.session.downloads.source_subdirectories and source:
            candidates.append(base / source / artist / title)
            candidates.append(base / source / artist)
            candidates.append(base / source)

        # Try without source subdirectory
        candidates.append(base / artist / title)
        candidates.append(base / artist)

        for path in candidates:
            if path.exists():
                return str(path)

        return base_folder

    async def add_download(self, url: str, metadata: dict | None = None) -> str:
        job_id = str(uuid.uuid4())[:8]
        job = DownloadJob(id=job_id, url=url)

        if metadata:
            album = metadata.get("album", {})
            job.title = album.get("title", "Unknown")
            job.artist = album.get("artist", "Unknown")
            covers = album.get("covers", {})
            job.cover_url = covers.get("large") or covers.get("original")
            job.source = metadata.get("source", "")

        self.jobs[job_id] = job
        await self._queue.put(job_id)
        await self._notify(job)
        return job_id

    async def cancel_download(self, job_id: str) -> bool:
        job = self.jobs.get(job_id)
        if job is None:
            return False
        if job.task and not job.task.done():
            job.task.cancel()
        job.status = "cancelled"
        await self._notify(job)
        return True

    def get_all_jobs(self) -> list[dict]:
        return [
            {
                "id": j.id,
                "url": j.url,
                "title": j.title,
                "artist": j.artist,
                "cover_url": j.cover_url,
                "source": j.source,
                "status": j.status,
                "progress": j.progress,
                "speed": j.speed,
                "eta": j.eta,
                "error": j.error,
                "current_track": j.current_track,
                "total_tracks": j.total_tracks,
                "completed_tracks": j.completed_tracks,
                "download_path": j.download_path,
            }
            for j in self.jobs.values()
        ]

    async def _notify(self, job: DownloadJob):
        if self.broadcast:
            await self.broadcast({
                "type": "download_update",
                "data": {
                    "id": job.id,
                    "url": job.url,
                    "title": job.title,
                    "artist": job.artist,
                    "cover_url": job.cover_url,
                    "source": job.source,
                    "status": job.status,
                    "progress": job.progress,
                    "speed": job.speed,
                    "eta": job.eta,
                    "error": job.error,
                    "current_track": job.current_track,
                    "total_tracks": job.total_tracks,
                    "completed_tracks": job.completed_tracks,
                    "download_path": job.download_path,
                },
            })

    def _save_to_history(self, job: DownloadJob):
        """Persist finished job to the SQLite history database."""
        if self.history_db is None:
            return
        if job.status not in ("completed", "failed", "cancelled"):
            return
        from datetime import datetime, timezone

        try:
            self.history_db.add({
                "id": job.id,
                "url": job.url,
                "title": job.title,
                "artist": job.artist,
                "cover_url": job.cover_url,
                "source": job.source,
                "status": job.status,
                "error": job.error,
                "total_tracks": job.total_tracks,
                "completed_tracks": job.completed_tracks,
                "download_path": job.download_path,
                "finished_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as exc:
            logger.error(f"Failed to save history for job {job.id}: {exc}")
