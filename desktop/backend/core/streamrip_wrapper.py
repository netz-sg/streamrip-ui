"""Wraps streamrip library for API-friendly metadata fetching and downloads."""

import asyncio
import logging
import os
import re
import sys

# Add streamrip repo to path
REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "repo"))
if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)

logger = logging.getLogger("streamrip_desktop")

try:
    from streamrip.config import Config, DEFAULT_CONFIG_PATH, BLANK_CONFIG_PATH, set_user_defaults
    from streamrip.client import QobuzClient, TidalClient, DeezerClient, SoundcloudClient, Client
    from streamrip.metadata.album import AlbumMetadata
    from streamrip.metadata.track import TrackMetadata
    from streamrip.metadata.covers import Covers
    from streamrip.metadata.util import get_album_track_ids
    from streamrip import db
except ImportError as exc:
    logger.critical(
        "Failed to import streamrip modules. "
        "Ensure the 'repo/' directory is present and contains a valid streamrip checkout. "
        "Error: %s", exc,
    )
    raise RuntimeError(
        f"streamrip import failed: {exc}. "
        f"Check that repo/ exists at {REPO_DIR}"
    ) from exc

URL_REGEX = re.compile(
    r"https?://(?:www|open|play|listen)?\.?(qobuz|tidal|deezer)\.com?(?:(?:/(album|artist|track|playlist|video|label))|(?:\/[-\w]+?))+\/([-\w]+)",
)
SOUNDCLOUD_URL_REGEX = re.compile(r"https://soundcloud.com/[-\w:/]+")
LASTFM_URL_REGEX = re.compile(r"https://www.last.fm/user/\w+/playlists/\w+")
QOBUZ_INTERPRETER_URL_REGEX = re.compile(
    r"https?://www\.qobuz\.com/\w\w-\w\w/interpreter/[-\w]+/([-\w]+)",
)


def _get_quality_label(quality_id: int, bit_depth: int | None, sampling_rate: float | None, container: str) -> str:
    if container == "MP3":
        if quality_id == 0:
            return "MP3 128kbps"
        return "MP3 320kbps"
    if bit_depth and sampling_rate:
        sr = sampling_rate if sampling_rate > 1000 else sampling_rate * 1000
        return f"{container} {bit_depth}-bit/{sr/1000:.1f}kHz"
    return container


def _covers_to_dict(covers: Covers) -> dict:
    """Safely extract cover URLs from a Covers object."""
    result = {}
    try:
        for size_name, url, _ in covers._covers:
            result[size_name] = url
    except (AttributeError, TypeError) as exc:
        logger.warning("Cover extraction failed (API may have changed): %s", exc)
    return result


def _safe_attr(obj, attr: str, default=None):
    """Safely get an attribute, returning *default* if missing."""
    try:
        return getattr(obj, attr, default)
    except Exception:
        return default


def _extract_tracks_from_resp(source: str, resp: dict, album_meta: AlbumMetadata) -> list[dict]:
    """Extract track info from raw API response without creating downloadable objects."""
    tracks = []
    tracklist = resp.get("tracks", [])

    if source == "qobuz":
        tracklist = tracklist.get("items", []) if isinstance(tracklist, dict) else tracklist
        for t in tracklist:
            artist = ""
            if "performer" in t and t["performer"]:
                artist = t["performer"].get("name", "")
            if not artist and "artist" in t:
                artist = t["artist"].get("name", "") if isinstance(t["artist"], dict) else ""
            title = t.get("title", "Unknown")
            version = t.get("version")
            if version and version not in title:
                title = f"{title} ({version})"
            tracks.append({
                "id": str(t["id"]),
                "title": title,
                "artist": artist or album_meta.albumartist,
                "track_number": t.get("track_number", 1),
                "disc_number": t.get("media_number", 1),
                "duration": t.get("duration"),
                "explicit": False,
            })

    elif source == "tidal":
        for t in tracklist:
            artists = t.get("artists", [])
            artist = ", ".join(a["name"] for a in artists) if artists else t.get("artist", {}).get("name", "")
            title = t.get("title", "Unknown")
            version = t.get("version")
            if version:
                title = f"{title} ({version})"
            tracks.append({
                "id": str(t["id"]),
                "title": title,
                "artist": artist or album_meta.albumartist,
                "track_number": t.get("trackNumber", 1),
                "disc_number": t.get("volumeNumber", 1),
                "duration": t.get("duration"),
                "explicit": t.get("explicit", False),
            })

    elif source == "deezer":
        for t in tracklist:
            tracks.append({
                "id": str(t["id"]),
                "title": t.get("title", "Unknown"),
                "artist": t.get("artist", {}).get("name", album_meta.albumartist),
                "track_number": t.get("track_position", 1),
                "disc_number": t.get("disk_number", 1),
                "duration": t.get("duration"),
                "explicit": t.get("explicit_lyrics", False),
            })

    elif source == "soundcloud":
        tracks.append({
            "id": str(resp.get("id", "")),
            "title": resp.get("title", "Unknown"),
            "artist": resp.get("user", {}).get("username", "Unknown"),
            "track_number": 1,
            "disc_number": 1,
            "duration": (resp.get("duration") or 0) // 1000,
            "explicit": False,
        })

    return tracks


class StreamripWrapper:
    def __init__(self):
        self.config: Config | None = None
        self.clients: dict[str, Client] = {}
        self._initialized = False

    def _ensure_config(self):
        if self.config is not None:
            return
        config_path = DEFAULT_CONFIG_PATH
        if not os.path.isfile(config_path):
            set_user_defaults(config_path)
        self.config = Config(config_path)

    def _ensure_clients(self):
        self._ensure_config()
        if not self.clients:
            self.clients = {
                "qobuz": QobuzClient(self.config),
                "tidal": TidalClient(self.config),
                "deezer": DeezerClient(self.config),
                "soundcloud": SoundcloudClient(self.config),
            }

    def parse_url(self, url: str) -> dict:
        """Parse URL to identify source, media type, and ID."""
        url = url.strip()

        generic = URL_REGEX.match(url)
        if generic:
            source, media_type, item_id = generic.groups()
            return {"valid": True, "source": source, "media_type": media_type, "item_id": item_id}

        qobuz = QOBUZ_INTERPRETER_URL_REGEX.match(url)
        if qobuz:
            return {"valid": True, "source": "qobuz", "media_type": "artist", "item_id": qobuz.group(1)}

        sc = SOUNDCLOUD_URL_REGEX.match(url)
        if sc:
            return {"valid": True, "source": "soundcloud", "media_type": "unknown", "item_id": url}

        lastfm = LASTFM_URL_REGEX.match(url)
        if lastfm:
            return {"valid": True, "source": "lastfm", "media_type": "playlist", "item_id": url}

        return {"valid": False, "error": "Unrecognized URL format"}

    async def _get_client(self, source: str) -> Client:
        self._ensure_clients()
        client = self.clients.get(source)
        if client is None:
            raise ValueError(f"No client for source: {source}")
        if not client.logged_in:
            await client.login()
        return client

    async def fetch_metadata(self, url: str) -> dict:
        """Fetch metadata for URL without downloading."""
        parsed = self.parse_url(url)
        if not parsed["valid"]:
            raise ValueError(parsed.get("error", "Invalid URL"))

        source = parsed["source"]
        media_type = parsed["media_type"]
        item_id = parsed["item_id"]

        if source == "soundcloud":
            client = await self._get_client(source)
            resolved = await client.resolve_url(item_id)
            media_type = resolved.get("kind", "track")
            resp = resolved
        else:
            client = await self._get_client(source)
            resp = await client.get_metadata(item_id, media_type)

        if media_type in ("album", "playlist"):
            return self._build_album_response(source, media_type, resp)
        elif media_type == "track":
            return self._build_track_response(source, resp)
        elif media_type == "artist":
            return self._build_artist_response(source, resp)
        else:
            return self._build_album_response(source, media_type, resp)

    def _build_album_response(self, source: str, media_type: str, resp: dict) -> dict:
        try:
            meta = AlbumMetadata.from_album_resp(resp, source)
        except Exception as exc:
            logger.error("AlbumMetadata.from_album_resp failed: %s", exc)
            raise ValueError(f"Failed to parse album metadata: {exc}") from exc
        if meta is None:
            raise ValueError("Album not available for streaming")

        tracks = _extract_tracks_from_resp(source, resp, meta)
        covers = _covers_to_dict(meta.covers)

        quality_label = _get_quality_label(
            _safe_attr(meta.info, 'quality', 0),
            _safe_attr(meta.info, 'bit_depth'),
            _safe_attr(meta.info, 'sampling_rate'),
            _safe_attr(meta.info, 'container', 'FLAC'),
        )

        return {
            "type": media_type,
            "source": source,
            "album": {
                "id": meta.info.id,
                "title": meta.album,
                "artist": meta.albumartist,
                "year": meta.year,
                "genre": meta.genre,
                "covers": covers,
                "track_total": meta.tracktotal,
                "disc_total": meta.disctotal,
                "label": meta.info.label,
                "copyright": meta.get_copyright(),
                "description": meta.description,
                "explicit": meta.info.explicit,
                "date": meta.date,
                "quality": {
                    "quality_id": meta.info.quality,
                    "bit_depth": meta.info.bit_depth,
                    "sampling_rate": meta.info.sampling_rate,
                    "container": meta.info.container,
                    "label": quality_label,
                },
                "tracks": tracks,
            },
        }

    def _build_track_response(self, source: str, resp: dict) -> dict:
        try:
            album_meta = AlbumMetadata.from_track_resp(resp, source)
        except Exception as exc:
            logger.error("AlbumMetadata.from_track_resp failed: %s", exc)
            raise ValueError(f"Failed to parse track metadata: {exc}") from exc
        if album_meta is None:
            raise ValueError("Track not available for streaming")

        try:
            track_meta = TrackMetadata.from_resp(album_meta, source, resp)
        except Exception as exc:
            logger.error("TrackMetadata.from_resp failed: %s", exc)
            raise ValueError(f"Failed to parse track details: {exc}") from exc
        if track_meta is None:
            raise ValueError("Track metadata not available")

        covers = _covers_to_dict(album_meta.covers)
        quality_label = _get_quality_label(
            _safe_attr(album_meta.info, 'quality', 0),
            _safe_attr(album_meta.info, 'bit_depth'),
            _safe_attr(album_meta.info, 'sampling_rate'),
            _safe_attr(album_meta.info, 'container', 'FLAC'),
        )

        return {
            "type": "track",
            "source": source,
            "track": {
                "id": track_meta.info.id,
                "title": track_meta.title,
                "artist": track_meta.artist,
                "album_title": album_meta.album,
                "album_artist": album_meta.albumartist,
                "track_number": track_meta.tracknumber,
                "disc_number": track_meta.discnumber,
                "year": album_meta.year,
                "genre": album_meta.genre,
                "covers": covers,
                "explicit": track_meta.info.explicit,
                "quality": {
                    "quality_id": album_meta.info.quality,
                    "bit_depth": album_meta.info.bit_depth,
                    "sampling_rate": album_meta.info.sampling_rate,
                    "container": album_meta.info.container,
                    "label": quality_label,
                },
            },
            "album": {
                "id": album_meta.info.id,
                "title": album_meta.album,
                "artist": album_meta.albumartist,
                "year": album_meta.year,
                "genre": album_meta.genre,
                "covers": covers,
                "track_total": album_meta.tracktotal,
                "disc_total": album_meta.disctotal,
                "label": album_meta.info.label,
                "copyright": album_meta.get_copyright(),
                "description": album_meta.description,
                "explicit": album_meta.info.explicit,
                "date": album_meta.date,
                "quality": {
                    "quality_id": album_meta.info.quality,
                    "bit_depth": album_meta.info.bit_depth,
                    "sampling_rate": album_meta.info.sampling_rate,
                    "container": album_meta.info.container,
                    "label": quality_label,
                },
                "tracks": [],
            },
        }

    def _build_artist_response(self, source: str, resp: dict) -> dict:
        name = ""
        albums = []

        if source == "qobuz":
            name = resp.get("name", "Unknown Artist")
            for album_resp in resp.get("albums", {}).get("items", []):
                try:
                    meta = AlbumMetadata.from_qobuz(album_resp)
                    covers = _covers_to_dict(meta.covers)
                    albums.append({
                        "id": _safe_attr(meta.info, 'id', ''),
                        "title": _safe_attr(meta, 'album', 'Unknown'),
                        "year": _safe_attr(meta, 'year', ''),
                        "covers": covers,
                    })
                except Exception as exc:
                    logger.debug("Skipping artist album: %s", exc)
                    continue
        elif source == "tidal":
            name = resp.get("name", "Unknown Artist")
        elif source == "deezer":
            name = resp.get("name", "Unknown Artist")

        return {
            "type": "artist",
            "source": source,
            "artist": {
                "name": name,
                "albums": albums,
            },
        }

    async def search(self, source: str, media_type: str, query: str, limit: int = 20) -> list[dict]:
        client = await self._get_client(source)
        pages = await client.search(media_type, query, limit=limit)
        results = []

        for page in pages:
            # Each client returns pages as raw API response dicts.
            # Extract the actual item list depending on the source.
            items: list[dict] = []
            if source == "qobuz":
                # Qobuz pages: {"{type}s": {"items": [...]}}
                key = f"{media_type}s"
                items = page.get(key, {}).get("items", [])
            elif source == "tidal":
                # Tidal pages: {"items": [...]}
                items = page.get("items", [])
            elif source == "deezer":
                # Deezer pages: {"data": [...]}
                items = page.get("data", [])
            elif source == "soundcloud":
                # SoundCloud pages: {"collection": [...]}
                items = page.get("collection", [])

            for item in items:
                result = {"source": source, "type": media_type}
                if media_type == "album":
                    result["id"] = str(item.get("id", ""))
                    result["title"] = item.get("title", "Unknown")
                    if source == "qobuz":
                        result["artist"] = item.get("artist", {}).get("name", "")
                        result["year"] = str(item.get("release_date_original", ""))[:4]
                        img = item.get("image", {})
                        result["covers"] = {"large": img.get("large"), "small": img.get("small"), "thumbnail": img.get("thumbnail")}
                    elif source == "tidal":
                        artists = item.get("artists", [])
                        result["artist"] = ", ".join(a["name"] for a in artists) if artists else item.get("artist", {}).get("name", "")
                        result["year"] = str(item.get("releaseDate", ""))[:4]
                        cover = item.get("cover")
                        if cover:
                            uuid = cover.replace("-", "/")
                            result["covers"] = {
                                "large": f"https://resources.tidal.com/images/{uuid}/640x640.jpg",
                                "small": f"https://resources.tidal.com/images/{uuid}/320x320.jpg",
                                "thumbnail": f"https://resources.tidal.com/images/{uuid}/160x160.jpg",
                            }
                    elif source == "deezer":
                        result["artist"] = item.get("artist", {}).get("name", "")
                        result["year"] = ""
                        result["covers"] = {
                            "large": item.get("cover_big"),
                            "small": item.get("cover_medium"),
                            "thumbnail": item.get("cover_small"),
                        }
                elif media_type == "track":
                    result["id"] = str(item.get("id", ""))
                    result["title"] = item.get("title", "Unknown")
                    if source == "qobuz":
                        result["artist"] = item.get("performer", {}).get("name", "")
                        result["year"] = str(item.get("album", {}).get("release_date_original", ""))[:4]
                        img = item.get("album", {}).get("image", {})
                        result["covers"] = {"large": img.get("large"), "small": img.get("small")}
                    elif source == "tidal":
                        artists = item.get("artists", [])
                        result["artist"] = ", ".join(a["name"] for a in artists) if artists else ""
                        album = item.get("album", {})
                        cover = album.get("cover")
                        if cover:
                            uuid = cover.replace("-", "/")
                            result["covers"] = {"large": f"https://resources.tidal.com/images/{uuid}/640x640.jpg"}
                    elif source == "deezer":
                        result["artist"] = item.get("artist", {}).get("name", "")
                        album = item.get("album", {})
                        result["covers"] = {"large": album.get("cover_big"), "small": album.get("cover_medium")}
                    else:
                        result["artist"] = item.get("user", {}).get("username", "")
                else:
                    result["id"] = str(item.get("id", ""))
                    result["title"] = item.get("name", item.get("title", "Unknown"))
                    result["artist"] = ""

                if "covers" not in result:
                    result["covers"] = {}
                if "artist" not in result:
                    result["artist"] = ""
                if "year" not in result:
                    result["year"] = ""

                results.append(result)

        return results[:limit]

    def get_config(self) -> dict:
        self._ensure_config()
        c = self.config.session
        return {
            "qobuz": {
                "use_auth_token": c.qobuz.use_auth_token,
                "email_or_userid": c.qobuz.email_or_userid,
                "password_or_token": c.qobuz.password_or_token,
                "quality": c.qobuz.quality,
                "download_booklets": c.qobuz.download_booklets,
            },
            "tidal": {
                "quality": c.tidal.quality,
                "download_videos": c.tidal.download_videos,
            },
            "deezer": {
                "arl": c.deezer.arl,
                "quality": c.deezer.quality,
                "use_deezloader": c.deezer.use_deezloader,
                "lower_quality_if_not_available": c.deezer.lower_quality_if_not_available,
                "deezloader_warnings": c.deezer.deezloader_warnings,
            },
            "soundcloud": {
                "quality": c.soundcloud.quality,
            },
            "downloads": {
                "folder": c.downloads.folder,
                "source_subdirectories": c.downloads.source_subdirectories,
                "disc_subdirectories": c.downloads.disc_subdirectories,
                "concurrency": c.downloads.concurrency,
                "max_connections": c.downloads.max_connections,
                "requests_per_minute": c.downloads.requests_per_minute,
                "verify_ssl": c.downloads.verify_ssl,
            },
            "artwork": {
                "embed": c.artwork.embed,
                "embed_size": c.artwork.embed_size,
                "embed_max_width": c.artwork.embed_max_width,
                "save_artwork": c.artwork.save_artwork,
                "saved_max_width": c.artwork.saved_max_width,
            },
            "conversion": {
                "enabled": c.conversion.enabled,
                "codec": c.conversion.codec,
                "sampling_rate": c.conversion.sampling_rate,
                "bit_depth": c.conversion.bit_depth,
                "lossy_bitrate": c.conversion.lossy_bitrate,
            },
            "filepaths": {
                "add_singles_to_folder": c.filepaths.add_singles_to_folder,
                "folder_format": c.filepaths.folder_format,
                "track_format": c.filepaths.track_format,
                "restrict_characters": c.filepaths.restrict_characters,
                "truncate_to": c.filepaths.truncate_to,
            },
            "qobuz_filters": {
                "extras": c.qobuz_filters.extras,
                "repeats": c.qobuz_filters.repeats,
                "non_albums": c.qobuz_filters.non_albums,
                "features": c.qobuz_filters.features,
                "non_studio_albums": c.qobuz_filters.non_studio_albums,
                "non_remaster": c.qobuz_filters.non_remaster,
            },
            "metadata": {
                "set_playlist_to_album": c.metadata.set_playlist_to_album,
                "renumber_playlist_tracks": c.metadata.renumber_playlist_tracks,
                "exclude": list(c.metadata.exclude),
            },
            "database": {
                "downloads_enabled": c.database.downloads_enabled,
                "failed_downloads_enabled": c.database.failed_downloads_enabled,
            },
        }

    def update_config(self, updates: dict):
        self._ensure_config()
        c = self.config.file

        for section_name, section_data in updates.items():
            section = getattr(c, section_name, None)
            if section is None:
                logger.warning("Config section '%s' not found — skipping", section_name)
                continue
            for key, value in section_data.items():
                if hasattr(section, key):
                    setattr(section, key, value)
                else:
                    logger.warning("Config key '%s.%s' not found — skipping", section_name, key)

        try:
            c.set_modified()
            self.config.save_file()
        except AttributeError:
            # Fallback if set_modified / save_file API changed
            logger.warning("config.file.set_modified() or save_file() not available — saving via alternative method")
            try:
                self.config.file.save()
            except Exception as exc:
                logger.error("Failed to persist config: %s", exc)
                raise

        # Refresh session config
        import copy
        self.config.session = copy.deepcopy(self.config.file)
        # Reset clients so they pick up new config
        self.clients = {}

    def get_auth_status(self) -> dict:
        self._ensure_clients()
        return {
            name: client.logged_in
            for name, client in self.clients.items()
        }

    async def close(self):
        for client in self.clients.values():
            if hasattr(client, "session") and client.session and not client.session.closed:
                await client.session.close()
