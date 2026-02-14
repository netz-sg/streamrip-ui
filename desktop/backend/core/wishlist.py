"""SQLite-backed wishlist / 'Save for Later' that persists across restarts."""

import logging
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("streamrip_desktop")

_DB_DIR = os.path.join(os.path.expanduser("~"), ".config", "streamrip")
_DB_PATH = os.path.join(_DB_DIR, "desktop_history.db")


class WishlistDB:
    """Stores items the user wants to download later."""

    def __init__(self, db_path: str = _DB_PATH):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._path = db_path
        self._conn: sqlite3.Connection | None = None
        self._ensure_table()

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
            CREATE TABLE IF NOT EXISTS wishlist (
                id          TEXT PRIMARY KEY,
                url         TEXT NOT NULL,
                title       TEXT NOT NULL DEFAULT 'Unknown',
                artist      TEXT NOT NULL DEFAULT 'Unknown',
                cover_url   TEXT,
                source      TEXT NOT NULL DEFAULT '',
                media_type  TEXT NOT NULL DEFAULT 'album',
                year        TEXT,
                added_at    TEXT NOT NULL
            )
            """
        )
        conn.commit()

    # -- public API ----------------------------------------------------------

    def add(self, entry: dict[str, Any]) -> dict[str, Any]:
        """Add an item. Returns the stored row as a dict."""
        conn = self._get_conn()
        entry_id = entry.get("id") or str(uuid.uuid4())[:8]
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            """
            INSERT OR REPLACE INTO wishlist
                (id, url, title, artist, cover_url, source, media_type, year, added_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                entry_id,
                entry["url"],
                entry.get("title", "Unknown"),
                entry.get("artist", "Unknown"),
                entry.get("cover_url"),
                entry.get("source", ""),
                entry.get("media_type", "album"),
                entry.get("year"),
                entry.get("added_at", now),
            ),
        )
        conn.commit()
        return {
            "id": entry_id,
            "url": entry["url"],
            "title": entry.get("title", "Unknown"),
            "artist": entry.get("artist", "Unknown"),
            "cover_url": entry.get("cover_url"),
            "source": entry.get("source", ""),
            "media_type": entry.get("media_type", "album"),
            "year": entry.get("year"),
            "added_at": entry.get("added_at", now),
        }

    def get_all(self, limit: int = 500, offset: int = 0) -> list[dict[str, Any]]:
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT * FROM wishlist ORDER BY added_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(r) for r in rows]

    def get_count(self) -> int:
        conn = self._get_conn()
        row = conn.execute("SELECT COUNT(*) FROM wishlist").fetchone()
        return row[0] if row else 0

    def exists_url(self, url: str) -> bool:
        conn = self._get_conn()
        row = conn.execute("SELECT 1 FROM wishlist WHERE url = ?", (url,)).fetchone()
        return row is not None

    def delete(self, entry_id: str) -> bool:
        conn = self._get_conn()
        cur = conn.execute("DELETE FROM wishlist WHERE id = ?", (entry_id,))
        conn.commit()
        return cur.rowcount > 0

    def clear(self):
        conn = self._get_conn()
        conn.execute("DELETE FROM wishlist")
        conn.commit()

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None
