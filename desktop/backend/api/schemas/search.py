from pydantic import BaseModel

from .metadata import CoverUrls


class SearchRequest(BaseModel):
    source: str
    media_type: str  # "album", "track", "artist", "playlist"
    query: str
    limit: int = 20


class SearchResultItem(BaseModel):
    id: str
    type: str  # "album", "track", "artist", "playlist"
    title: str
    artist: str
    year: str | None = None
    covers: CoverUrls | None = None
    source: str
    extra: str | None = None


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
    total: int
