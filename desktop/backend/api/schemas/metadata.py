from pydantic import BaseModel


class CoverUrls(BaseModel):
    thumbnail: str | None = None
    small: str | None = None
    large: str | None = None
    original: str | None = None


class QualityInfo(BaseModel):
    quality_id: int
    bit_depth: int | None = None
    sampling_rate: float | None = None
    container: str
    label: str


class TrackItem(BaseModel):
    id: str
    title: str
    artist: str
    track_number: int
    disc_number: int
    duration: int | None = None
    explicit: bool = False


class AlbumMetadataResponse(BaseModel):
    id: str
    title: str
    artist: str
    year: str
    genre: list[str]
    covers: CoverUrls
    track_total: int
    disc_total: int
    label: str | None = None
    copyright: str | None = None
    description: str | None = None
    explicit: bool = False
    quality: QualityInfo
    tracks: list[TrackItem]
    date: str | None = None


class TrackMetadataResponse(BaseModel):
    id: str
    title: str
    artist: str
    album_title: str
    album_artist: str
    track_number: int
    disc_number: int
    year: str
    genre: list[str]
    covers: CoverUrls
    explicit: bool = False
    quality: QualityInfo
    duration: int | None = None


class PlaylistMetadataResponse(BaseModel):
    id: str
    name: str
    track_total: int
    covers: CoverUrls | None = None
    tracks: list[TrackItem]


class ArtistAlbumItem(BaseModel):
    id: str
    title: str
    year: str = ""
    covers: CoverUrls = CoverUrls()


class ArtistMetadataResponse(BaseModel):
    name: str
    albums: list[ArtistAlbumItem] = []


class MetadataResponse(BaseModel):
    type: str  # "album", "track", "playlist", "artist"
    source: str
    album: AlbumMetadataResponse | None = None
    track: TrackMetadataResponse | None = None
    playlist: PlaylistMetadataResponse | None = None
    artist: ArtistMetadataResponse | None = None
