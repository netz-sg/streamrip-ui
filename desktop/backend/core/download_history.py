"""SQLite-backed download history that persists across app restarts."""

import logging
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("streamrip_desktop")

# Store next to streamrip's own config
_DB_DIR = os.path.join(os.path.expanduser("~"), ".config", "streamrip")
_DB_PATH = os.path.join(_DB_DIR, "desktop_history.db")


class DownloadHistoryDB:
    """Thin synchronous wrapper around SQLite – all methods are fast enough
    for the single-user desktop scenario."""

    def __init__(self, db_path: str = _DB_PATH):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._path = db_path
        self._conn: sqlite3.Connection | None = None
        self._ensure_table()

    # -- connection helpers --------------------------------------------------

    def _get_conn(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = sqlite3.connect(self._path, check_same_thread=False)
            self._conn.row_factory = sqlite3.Row
            self._conn.execute("PRAGMA journal_mode=WAL")
        return self._conn

    def _ensure_table(self):
        conn = self._get_conn()
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS download_history (
                id          TEXT PRIMARY KEY,
                url         TEXT NOT NULL,
                title       TEXT NOT NULL DEFAULT 'Unknown',
                artist      TEXT NOT NULL DEFAULT 'Unknown',
                cover_url   TEXT,
                source      TEXT NOT NULL DEFAULT '',
                status      TEXT NOT NULL DEFAULT 'completed',
                error       TEXT,
                total_tracks    INTEGER NOT NULL DEFAULT 0,
                completed_tracks INTEGER NOT NULL DEFAULT 0,
                download_path   TEXT,
                finished_at TEXT NOT NULL
            )
            """
        )
        conn.commit()

    # -- public API ----------------------------------------------------------

    def add(self, entry: dict[str, Any]):
        """Insert or replace a history entry."""
        conn = self._get_conn()
        conn.execute(
            """
            INSERT OR REPLACE INTO download_history
                (id, url, title, artist, cover_url, source, status,
                 error, total_tracks, completed_tracks, download_path, finished_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                entry["id"],
                entry["url"],
                entry.get("title", "Unknown"),
                entry.get("artist", "Unknown"),
                entry.get("cover_url"),
                entry.get("source", ""),
                entry.get("status", "completed"),
                entry.get("error"),
                entry.get("total_tracks", 0),
                entry.get("completed_tracks", 0),
                entry.get("download_path"),
                entry.get("finished_at", datetime.now(timezone.utc).isoformat()),
            ),
        )
        conn.commit()

    def get_all(self, limit: int = 500, offset: int = 0) -> list[dict[str, Any]]:
        """Return history newest-first."""
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT * FROM download_history ORDER BY finished_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(r) for r in rows]

    def get_count(self) -> int:
        conn = self._get_conn()
        row = conn.execute("SELECT COUNT(*) FROM download_history").fetchone()
        return row[0] if row else 0

    def delete(self, entry_id: str) -> bool:
        conn = self._get_conn()
        cur = conn.execute("DELETE FROM download_history WHERE id = ?", (entry_id,))
        conn.commit()
        return cur.rowcount > 0

    def clear(self):
        conn = self._get_conn()
        conn.execute("DELETE FROM download_history")
        conn.commit()

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None
