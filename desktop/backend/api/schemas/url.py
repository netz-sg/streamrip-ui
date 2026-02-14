from pydantic import BaseModel


class UrlParseRequest(BaseModel):
    url: str


class UrlParseResponse(BaseModel):
    valid: bool
    source: str | None = None
    media_type: str | None = None
    item_id: str | None = None
    error: str | None = None


class BulkMetadataRequest(BaseModel):
    urls: list[str]


class BulkMetadataItem(BaseModel):
    url: str
    error: str | None = None
    metadata: dict | None = None


class BulkMetadataResponse(BaseModel):
    results: list[BulkMetadataItem]
