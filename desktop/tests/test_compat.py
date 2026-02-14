"""Tests for desktop backend compatibility with the streamrip library.

These tests verify that the desktop backend's adapter layer can still
interface with the streamrip library.  They are designed to run in CI
to catch breakage early when the core library changes.
"""

import importlib
import os
import sys

import pytest

# ── Setup: ensure repo/ is importable ────────────────────────────────
REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "repo"))
DESKTOP_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))

if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)
if DESKTOP_BACKEND_DIR not in sys.path:
    sys.path.insert(0, DESKTOP_BACKEND_DIR)


# ── Compat check module ─────────────────────────────────────────────

class TestCompatCheck:
    """Verify the compat_check module itself can run without errors."""

    def test_import_compat_check(self):
        from core.compat_check import run_checks, assert_compatible
        assert callable(run_checks)
        assert callable(assert_compatible)

    def test_run_checks_no_errors(self):
        from core.compat_check import run_checks
        issues = run_checks()
        errors = [i for i in issues if i.severity == "error"]
        if errors:
            msg = "\n".join(f"  - {e.message}" for e in errors)
            pytest.fail(f"Compatibility errors found:\n{msg}")

    def test_assert_compatible_passes(self):
        from core.compat_check import assert_compatible
        # Should not raise
        assert_compatible()


# ── Streamrip imports ────────────────────────────────────────────────

class TestStreamripImports:
    """Verify all required streamrip modules and symbols are importable."""

    @pytest.mark.parametrize("module_path,symbol", [
        ("streamrip.config", "Config"),
        ("streamrip.config", "DEFAULT_CONFIG_PATH"),
        ("streamrip.config", "BLANK_CONFIG_PATH"),
        ("streamrip.config", "set_user_defaults"),
        ("streamrip.client", "QobuzClient"),
        ("streamrip.client", "TidalClient"),
        ("streamrip.client", "DeezerClient"),
        ("streamrip.client", "SoundcloudClient"),
        ("streamrip.client", "Client"),
        ("streamrip.metadata.album", "AlbumMetadata"),
        ("streamrip.metadata.track", "TrackMetadata"),
        ("streamrip.metadata.covers", "Covers"),
        ("streamrip.metadata.util", "get_album_track_ids"),
        ("streamrip.db", "Database"),
        ("streamrip.rip.main", "Main"),
        ("streamrip.progress", "get_progress_callback"),
        ("streamrip.progress", "add_title"),
        ("streamrip.progress", "remove_title"),
        ("streamrip.progress", "clear_progress"),
    ])
    def test_symbol_exists(self, module_path, symbol):
        mod = importlib.import_module(module_path)
        assert hasattr(mod, symbol), f"'{symbol}' missing from {module_path}"


class TestAlbumMetadataAPI:
    """Verify AlbumMetadata exposes methods the desktop backend relies on."""

    def test_from_album_resp_exists(self):
        from streamrip.metadata.album import AlbumMetadata
        assert hasattr(AlbumMetadata, "from_album_resp")
        assert callable(AlbumMetadata.from_album_resp)

    def test_from_track_resp_exists(self):
        from streamrip.metadata.album import AlbumMetadata
        assert hasattr(AlbumMetadata, "from_track_resp")
        assert callable(AlbumMetadata.from_track_resp)

    def test_from_qobuz_exists(self):
        from streamrip.metadata.album import AlbumMetadata
        assert hasattr(AlbumMetadata, "from_qobuz")
        assert callable(AlbumMetadata.from_qobuz)

    def test_get_copyright_exists(self):
        from streamrip.metadata.album import AlbumMetadata
        assert hasattr(AlbumMetadata, "get_copyright")


class TestTrackMetadataAPI:
    """Verify TrackMetadata exposes methods the desktop backend relies on."""

    def test_from_resp_exists(self):
        from streamrip.metadata.track import TrackMetadata
        assert hasattr(TrackMetadata, "from_resp")
        assert callable(TrackMetadata.from_resp)


class TestCoversAPI:
    """Verify Covers exposes the internal _covers attribute."""

    def test_covers_has_internal_list(self):
        from streamrip.metadata.covers import Covers
        # Covers must have _covers attribute even if empty
        c = Covers()
        assert hasattr(c, "_covers")


class TestConfigSections:
    """Verify the Config session exposes all sections the desktop backend reads."""

    @pytest.fixture(scope="class")
    def session(self):
        from streamrip.config import Config, DEFAULT_CONFIG_PATH, set_user_defaults
        config_path = DEFAULT_CONFIG_PATH
        if not os.path.isfile(config_path):
            set_user_defaults(config_path)
        return Config(config_path).session

    @pytest.mark.parametrize("section", [
        "qobuz", "tidal", "deezer", "soundcloud",
        "downloads", "artwork", "conversion",
        "filepaths", "qobuz_filters", "metadata", "database",
    ])
    def test_section_exists(self, session, section):
        assert hasattr(session, section), f"Config section '{section}' missing"


class TestMainRipAPI:
    """Verify the Main class exposes the async context-manager and rip interface."""

    def test_main_is_async_context_manager(self):
        from streamrip.rip.main import Main
        assert hasattr(Main, "__aenter__")
        assert hasattr(Main, "__aexit__")

    def test_main_has_add(self):
        from streamrip.rip.main import Main
        assert hasattr(Main, "add")

    def test_main_has_rip(self):
        from streamrip.rip.main import Main
        assert hasattr(Main, "rip")

    def test_main_has_resolve(self):
        from streamrip.rip.main import Main
        assert hasattr(Main, "resolve")


class TestProgressAPI:
    """Verify the progress module has the functions we monkey-patch."""

    def test_get_progress_callback_signature(self):
        import inspect
        from streamrip.progress import get_progress_callback
        sig = inspect.signature(get_progress_callback)
        params = list(sig.parameters.keys())
        # Must accept (enabled, total, desc)
        assert len(params) >= 3, f"Expected ≥3 params, got {params}"


class TestVersionExists:
    """Verify streamrip exposes __version__."""

    def test_version_string(self):
        import streamrip
        assert hasattr(streamrip, "__version__")
        version = streamrip.__version__
        assert isinstance(version, str)
        parts = version.split(".")
        assert len(parts) >= 2, f"Version '{version}' doesn't look like semver"
