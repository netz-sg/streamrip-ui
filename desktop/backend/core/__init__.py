"""Core module - singleton instances for wrapper and download manager."""

from .streamrip_wrapper import StreamripWrapper
from .download_manager import DownloadManager
from .download_history import DownloadHistoryDB
from .wishlist import WishlistDB

_wrapper: StreamripWrapper | None = None
_download_manager: DownloadManager | None = None
_history_db: DownloadHistoryDB | None = None
_wishlist_db: WishlistDB | None = None


def get_wrapper() -> StreamripWrapper:
    global _wrapper
    if _wrapper is None:
        _wrapper = StreamripWrapper()
    return _wrapper


def get_history_db() -> DownloadHistoryDB:
    global _history_db
    if _history_db is None:
        _history_db = DownloadHistoryDB()
    return _history_db


def get_wishlist_db() -> WishlistDB:
    global _wishlist_db
    if _wishlist_db is None:
        _wishlist_db = WishlistDB()
    return _wishlist_db


def get_download_manager() -> DownloadManager:
    global _download_manager
    if _download_manager is None:
        _download_manager = DownloadManager(
            get_wrapper(),
            history_db=get_history_db(),
        )
    return _download_manager


def set_broadcast_fn(fn):
    dm = get_download_manager()
    dm.broadcast = fn
