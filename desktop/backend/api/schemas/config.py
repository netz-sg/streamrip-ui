from pydantic import BaseModel


class QobuzCredentials(BaseModel):
    use_auth_token: bool = False
    email_or_userid: str = ""
    password_or_token: str = ""
    quality: int = 3
    download_booklets: bool = True


class TidalCredentials(BaseModel):
    quality: int = 3
    download_videos: bool = True


class DeezerCredentials(BaseModel):
    arl: str = ""
    quality: int = 2
    use_deezloader: bool = True
    lower_quality_if_not_available: bool = True
    deezloader_warnings: bool = True


class SoundcloudCredentials(BaseModel):
    quality: int = 0


class DownloadsSettings(BaseModel):
    folder: str = ""
    source_subdirectories: bool = False
    disc_subdirectories: bool = True
    concurrency: bool = True
    max_connections: int = 6
    requests_per_minute: int = 60
    verify_ssl: bool = True


class ArtworkSettings(BaseModel):
    embed: bool = True
    embed_size: str = "large"
    embed_max_width: int = -1
    save_artwork: bool = True
    saved_max_width: int = -1


class ConversionSettings(BaseModel):
    enabled: bool = False
    codec: str = "ALAC"
    sampling_rate: int = 48000
    bit_depth: int = 24
    lossy_bitrate: int = 320


class FilepathsSettings(BaseModel):
    add_singles_to_folder: bool = False
    folder_format: str = "{albumartist} - {title} ({year}) [{container}] [{bit_depth}B-{sampling_rate}kHz]"
    track_format: str = "{tracknumber:02}. {artist} - {title}{explicit}"
    restrict_characters: bool = False
    truncate_to: int = 120


class QobuzFiltersSettings(BaseModel):
    extras: bool = False
    repeats: bool = False
    non_albums: bool = False
    features: bool = False
    non_studio_albums: bool = False
    non_remaster: bool = False


class MetadataTagSettings(BaseModel):
    set_playlist_to_album: bool = True
    renumber_playlist_tracks: bool = True
    exclude: list[str] = []


class DatabaseSettings(BaseModel):
    downloads_enabled: bool = True
    failed_downloads_enabled: bool = True


class AppConfig(BaseModel):
    qobuz: QobuzCredentials = QobuzCredentials()
    tidal: TidalCredentials = TidalCredentials()
    deezer: DeezerCredentials = DeezerCredentials()
    soundcloud: SoundcloudCredentials = SoundcloudCredentials()
    downloads: DownloadsSettings = DownloadsSettings()
    artwork: ArtworkSettings = ArtworkSettings()
    conversion: ConversionSettings = ConversionSettings()
    filepaths: FilepathsSettings = FilepathsSettings()
    qobuz_filters: QobuzFiltersSettings = QobuzFiltersSettings()
    metadata: MetadataTagSettings = MetadataTagSettings()
    database: DatabaseSettings = DatabaseSettings()


class AuthStatusResponse(BaseModel):
    qobuz: bool = False
    tidal: bool = False
    deezer: bool = False
    soundcloud: bool = False
