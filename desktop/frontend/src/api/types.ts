export interface CoverUrls {
  thumbnail?: string | null;
  small?: string | null;
  large?: string | null;
  original?: string | null;
}

export interface QualityInfo {
  quality_id: number;
  bit_depth?: number | null;
  sampling_rate?: number | null;
  container: string;
  label: string;
}

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  track_number: number;
  disc_number: number;
  duration?: number | null;
  explicit: boolean;
}

export interface AlbumMetadata {
  id: string;
  title: string;
  artist: string;
  year: string;
  genre: string[];
  covers: CoverUrls;
  track_total: number;
  disc_total: number;
  label?: string | null;
  copyright?: string | null;
  description?: string | null;
  explicit: boolean;
  quality: QualityInfo;
  tracks: TrackItem[];
  date?: string | null;
}

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  album_title: string;
  album_artist: string;
  track_number: number;
  disc_number: number;
  year: string;
  genre: string[];
  covers: CoverUrls;
  explicit: boolean;
  quality: QualityInfo;
  duration?: number | null;
}

export interface PlaylistMetadata {
  id: string;
  name: string;
  track_total: number;
  covers?: CoverUrls | null;
  tracks: TrackItem[];
}

export interface ArtistAlbumItem {
  id: string;
  title: string;
  year: string;
  covers: CoverUrls;
}

export interface ArtistMetadata {
  name: string;
  albums: ArtistAlbumItem[];
}

export interface MetadataResponse {
  type: string;
  source: string;
  album?: AlbumMetadata | null;
  track?: TrackMetadata | null;
  playlist?: PlaylistMetadata | null;
  artist?: ArtistMetadata | null;
}

export interface UrlParseResponse {
  valid: boolean;
  source?: string | null;
  media_type?: string | null;
  item_id?: string | null;
  error?: string | null;
}

export interface DownloadStatus {
  id: string;
  url: string;
  title: string;
  artist: string;
  cover_url?: string | null;
  source: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  speed?: string | null;
  eta?: string | null;
  error?: string | null;
  current_track?: string | null;
  total_tracks: number;
  completed_tracks: number;
  download_path?: string | null;
}

export interface DownloadHistoryItem {
  id: string;
  url: string;
  title: string;
  artist: string;
  cover_url?: string | null;
  source: string;
  status: string;
  error?: string | null;
  total_tracks: number;
  completed_tracks: number;
  download_path?: string | null;
  finished_at: string;
}

export interface DownloadHistoryResponse {
  items: DownloadHistoryItem[];
  total: number;
}

export interface WishlistItem {
  id: string;
  url: string;
  title: string;
  artist: string;
  cover_url?: string | null;
  source: string;
  media_type: string;
  year?: string | null;
  added_at: string;
}

export interface WishlistResponse {
  items: WishlistItem[];
  total: number;
}

export interface BulkMetadataItem {
  url: string;
  error?: string | null;
  metadata?: MetadataResponse | null;
}

export interface BulkMetadataResponse {
  results: BulkMetadataItem[];
}

export interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  artist: string;
  year?: string | null;
  covers?: CoverUrls | null;
  source: string;
  extra?: string | null;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
}

export interface AppConfig {
  qobuz: {
    use_auth_token: boolean;
    email_or_userid: string;
    password_or_token: string;
    quality: number;
    download_booklets: boolean;
  };
  tidal: {
    quality: number;
    download_videos: boolean;
  };
  deezer: {
    arl: string;
    quality: number;
    use_deezloader: boolean;
    lower_quality_if_not_available: boolean;
    deezloader_warnings: boolean;
  };
  soundcloud: {
    quality: number;
  };
  downloads: {
    folder: string;
    source_subdirectories: boolean;
    disc_subdirectories: boolean;
    concurrency: boolean;
    max_connections: number;
    requests_per_minute: number;
    verify_ssl: boolean;
  };
  artwork: {
    embed: boolean;
    embed_size: string;
    embed_max_width: number;
    save_artwork: boolean;
    saved_max_width: number;
  };
  conversion: {
    enabled: boolean;
    codec: string;
    sampling_rate: number;
    bit_depth: number;
    lossy_bitrate: number;
  };
  filepaths: {
    add_singles_to_folder: boolean;
    folder_format: string;
    track_format: string;
    restrict_characters: boolean;
    truncate_to: number;
  };
  qobuz_filters: {
    extras: boolean;
    repeats: boolean;
    non_albums: boolean;
    features: boolean;
    non_studio_albums: boolean;
    non_remaster: boolean;
  };
  metadata: {
    set_playlist_to_album: boolean;
    renumber_playlist_tracks: boolean;
    exclude: string[];
  };
  database: {
    downloads_enabled: boolean;
    failed_downloads_enabled: boolean;
  };
}

export type MusicSource = 'qobuz' | 'tidal' | 'deezer' | 'soundcloud';
export type MediaType = 'album' | 'track' | 'artist' | 'playlist';

export const SOURCE_COLORS: Record<MusicSource, string> = {
  qobuz: '#2C70BE',
  tidal: '#00FFFF',
  deezer: '#A238FF',
  soundcloud: '#FF5500',
};

export const SOURCE_LABELS: Record<MusicSource, string> = {
  qobuz: 'Qobuz',
  tidal: 'TIDAL',
  deezer: 'Deezer',
  soundcloud: 'SoundCloud',
};
