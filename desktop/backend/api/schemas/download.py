from pydantic import BaseModel


class DownloadRequest(BaseModel):
    url: str


class DownloadStatus(BaseModel):
    id: str
    url: str
    title: str
    artist: str
    cover_url: str | None = None
    source: str
    status: str  # "queued", "downloading", "completed", "failed", "cancelled"
    progress: float = 0.0  # 0-100
    speed: str | None = None
    eta: str | None = None
    error: str | None = None
    current_track: str | None = None
    total_tracks: int = 0
    completed_tracks: int = 0
    download_path: str | None = None


class DownloadQueueResponse(BaseModel):
    downloads: list[DownloadStatus]


class DownloadHistoryItem(BaseModel):
    id: str
    url: str
    title: str = "Unknown"
    artist: str = "Unknown"
    cover_url: str | None = None
    source: str = ""
    status: str = "completed"
    error: str | None = None
    total_tracks: int = 0
    completed_tracks: int = 0
    download_path: str | None = None
    finished_at: str


class DownloadHistoryResponse(BaseModel):
    items: list[DownloadHistoryItem]
    total: int
