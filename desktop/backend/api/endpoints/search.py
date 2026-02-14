from fastapi import APIRouter, HTTPException

from api.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from api.schemas.metadata import CoverUrls

router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search(req: SearchRequest):
    from core import get_wrapper
    wrapper = get_wrapper()
    try:
        results = await wrapper.search(req.source, req.media_type, req.query, req.limit)
        items = []
        for r in results:
            covers_data = r.get("covers", {})
            covers = CoverUrls(
                thumbnail=covers_data.get("thumbnail"),
                small=covers_data.get("small"),
                large=covers_data.get("large"),
                original=covers_data.get("original"),
            )
            items.append(SearchResultItem(
                id=r.get("id", ""),
                type=r.get("type", req.media_type),
                title=r.get("title", "Unknown"),
                artist=r.get("artist", ""),
                year=r.get("year"),
                covers=covers,
                source=r.get("source", req.source),
                extra=r.get("extra"),
            ))
        return SearchResponse(results=items, total=len(items))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
