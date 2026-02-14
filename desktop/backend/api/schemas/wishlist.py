from pydantic import BaseModel


class WishlistAddRequest(BaseModel):
    url: str
    title: str = "Unknown"
    artist: str = "Unknown"
    cover_url: str | None = None
    source: str = ""
    media_type: str = "album"
    year: str | None = None


class WishlistItem(BaseModel):
    id: str
    url: str
    title: str = "Unknown"
    artist: str = "Unknown"
    cover_url: str | None = None
    source: str = ""
    media_type: str = "album"
    year: str | None = None
    added_at: str


class WishlistResponse(BaseModel):
    items: list[WishlistItem]
    total: int
