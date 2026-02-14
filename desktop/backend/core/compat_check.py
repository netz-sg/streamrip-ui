"""Startup compatibility check for streamrip library.

Verifies that the streamrip version in ``repo/`` exposes all the classes,
functions, and attributes the desktop backend relies on.  This runs once at
import time (during FastAPI startup) and raises a clear, actionable error
instead of cryptic AttributeErrors later at runtime.
"""

import importlib
import logging
import sys
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger("streamrip_desktop")

# ── Minimum supported streamrip version ──────────────────────────────
MIN_VERSION = "2.0.0"

# ── Contract: modules → expected symbols ─────────────────────────────
# Each entry is  (module_path, symbol_name, kind)
# kind is used only for the error message ("class", "function", "constant").

_REQUIRED_SYMBOLS: list[tuple[str, str, str]] = [
    # Config
    ("streamrip.config", "Config", "class"),
    ("streamrip.config", "DEFAULT_CONFIG_PATH", "constant"),
    ("streamrip.config", "BLANK_CONFIG_PATH", "constant"),
    ("streamrip.config", "set_user_defaults", "function"),
    # Clients
    ("streamrip.client", "QobuzClient", "class"),
    ("streamrip.client", "TidalClient", "class"),
    ("streamrip.client", "DeezerClient", "class"),
    ("streamrip.client", "SoundcloudClient", "class"),
    ("streamrip.client", "Client", "class"),
    # Metadata
    ("streamrip.metadata.album", "AlbumMetadata", "class"),
    ("streamrip.metadata.track", "TrackMetadata", "class"),
    ("streamrip.metadata.covers", "Covers", "class"),
    ("streamrip.metadata.util", "get_album_track_ids", "function"),
    # Database
    ("streamrip.db", "Database", "class"),
    # Rip entry-point
    ("streamrip.rip.main", "Main", "class"),
    # Progress (monkey-patched by progress_hook.py)
    ("streamrip.progress", "get_progress_callback", "function"),
    ("streamrip.progress", "add_title", "function"),
    ("streamrip.progress", "remove_title", "function"),
    ("streamrip.progress", "clear_progress", "function"),
]

# AlbumMetadata methods / classmethods we call
_REQUIRED_METHODS: list[tuple[str, str, list[str]]] = [
    ("streamrip.metadata.album", "AlbumMetadata", [
        "from_album_resp",
        "from_track_resp",
        "from_qobuz",
        "get_copyright",
    ]),
    ("streamrip.metadata.track", "TrackMetadata", [
        "from_resp",
    ]),
]

# Config session sub-sections we read
_REQUIRED_CONFIG_SECTIONS = [
    "qobuz", "tidal", "deezer", "soundcloud",
    "downloads", "artwork", "conversion",
    "filepaths", "qobuz_filters", "metadata", "database",
]


# ── Helpers ──────────────────────────────────────────────────────────

def _parse_version(version_str: str) -> tuple[int, ...]:
    """Parse '2.2.0' → (2, 2, 0).  Ignores pre-release suffixes."""
    parts = version_str.split(".")
    result = []
    for p in parts:
        digits = ""
        for ch in p:
            if ch.isdigit():
                digits += ch
            else:
                break
        result.append(int(digits) if digits else 0)
    return tuple(result)


@dataclass
class CompatIssue:
    """A single compatibility problem."""
    severity: str  # "error" | "warning"
    message: str


def run_checks() -> list[CompatIssue]:
    """Return a list of compatibility issues (empty = all good)."""
    issues: list[CompatIssue] = []

    # 1) Version check
    try:
        import streamrip
        version = getattr(streamrip, "__version__", None)
        if version is None:
            issues.append(CompatIssue("warning", "streamrip.__version__ not found — cannot verify version"))
        elif _parse_version(version) < _parse_version(MIN_VERSION):
            issues.append(CompatIssue("error", f"streamrip {version} is too old (minimum {MIN_VERSION})"))
        else:
            logger.info(f"streamrip version: {version}")
    except ImportError:
        issues.append(CompatIssue("error", "Cannot import streamrip — is repo/ on sys.path?"))
        return issues  # nothing else can succeed

    # 2) Required symbols
    for module_path, symbol, kind in _REQUIRED_SYMBOLS:
        try:
            mod = importlib.import_module(module_path)
            if not hasattr(mod, symbol):
                issues.append(CompatIssue(
                    "error",
                    f"Missing {kind} '{symbol}' in {module_path}. "
                    f"The streamrip API may have changed."
                ))
        except ImportError:
            issues.append(CompatIssue(
                "error",
                f"Cannot import module '{module_path}'. "
                f"The streamrip package structure may have changed."
            ))

    # 3) Required methods on classes
    for module_path, class_name, methods in _REQUIRED_METHODS:
        try:
            mod = importlib.import_module(module_path)
            cls = getattr(mod, class_name, None)
            if cls is None:
                continue  # already reported above
            for method in methods:
                if not hasattr(cls, method):
                    issues.append(CompatIssue(
                        "error",
                        f"Missing method '{method}' on {class_name} ({module_path}). "
                        f"The streamrip API may have changed."
                    ))
        except ImportError:
            pass  # already reported above

    # 4) Config session sections
    try:
        from streamrip.config import Config, DEFAULT_CONFIG_PATH, set_user_defaults
        import os
        config_path = DEFAULT_CONFIG_PATH
        if not os.path.isfile(config_path):
            set_user_defaults(config_path)
        cfg = Config(config_path)
        session = cfg.session
        for section in _REQUIRED_CONFIG_SECTIONS:
            if not hasattr(session, section):
                issues.append(CompatIssue(
                    "warning",
                    f"Config section '{section}' not found in streamrip config. "
                    f"Some settings may not work."
                ))
    except Exception as e:
        issues.append(CompatIssue(
            "warning",
            f"Could not verify config sections: {e}"
        ))

    return issues


def assert_compatible():
    """Run all checks and raise if there are errors.  Warnings are logged."""
    issues = run_checks()

    warnings = [i for i in issues if i.severity == "warning"]
    errors = [i for i in issues if i.severity == "error"]

    for w in warnings:
        logger.warning(f"[compat] {w.message}")

    if errors:
        msg_lines = [
            "",
            "=" * 60,
            " STREAMRIP COMPATIBILITY CHECK FAILED",
            "=" * 60,
            "",
            f" {len(errors)} error(s) detected.  The streamrip library in repo/",
            " has changed in ways that break the desktop backend.",
            "",
        ]
        for i, e in enumerate(errors, 1):
            msg_lines.append(f"  {i}. {e.message}")
        msg_lines += [
            "",
            " Please update the desktop backend to match the new streamrip API,",
            " or revert to a compatible streamrip version.",
            "=" * 60,
        ]
        full_msg = "\n".join(msg_lines)
        logger.error(full_msg)
        raise RuntimeError(full_msg)

    if not warnings and not errors:
        logger.info("[compat] All streamrip compatibility checks passed ✓")
