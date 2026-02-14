import asyncio

from fastapi import APIRouter, HTTPException

from api.schemas.url import (
    UrlParseRequest,
    UrlParseResponse,
    BulkMetadataRequest,
    BulkMetadataResponse,
    BulkMetadataItem,
)

router = APIRouter(prefix="/api/url", tags=["url"])


@router.post("/parse", response_model=UrlParseResponse)
async def parse_url(req: UrlParseRequest):
    from core import get_wrapper
    wrapper = get_wrapper()
    result = wrapper.parse_url(req.url)
    return UrlParseResponse(
        valid=result["valid"],
        source=result.get("source"),
        media_type=result.get("media_type"),
        item_id=result.get("item_id"),
        error=result.get("error"),
    )


@router.post("/metadata")
async def fetch_metadata(req: UrlParseRequest):
    from core import get_wrapper
    wrapper = get_wrapper()
    try:
        result = await wrapper.fetch_metadata(req.url)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch metadata: {str(e)}")


@router.post("/bulk-metadata", response_model=BulkMetadataResponse)
async def bulk_metadata(req: BulkMetadataRequest):
    """Fetch metadata for multiple URLs concurrently."""
    from core import get_wrapper
    wrapper = get_wrapper()

    async def fetch_one(url: str) -> BulkMetadataItem:
        try:
            parsed = wrapper.parse_url(url)
            if not parsed["valid"]:
                return BulkMetadataItem(url=url, error=parsed.get("error", "Invalid URL"))
            metadata = await wrapper.fetch_metadata(url)
            return BulkMetadataItem(url=url, metadata=metadata)
        except Exception as e:
            return BulkMetadataItem(url=url, error=str(e))

    results = await asyncio.gather(*(fetch_one(u.strip()) for u in req.urls if u.strip()))
    return BulkMetadataResponse(results=list(results))
