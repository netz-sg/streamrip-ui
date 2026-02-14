from fastapi import APIRouter, HTTPException

from api.schemas.download import (
    DownloadRequest,
    DownloadQueueResponse,
    DownloadHistoryResponse,
)

router = APIRouter(prefix="/api/download", tags=["download"])


@router.post("/start")
async def start_download(req: DownloadRequest):
    from core import get_wrapper, get_download_manager
    wrapper = get_wrapper()

    # First fetch metadata for the job info
    metadata = None
    try:
        metadata = await wrapper.fetch_metadata(req.url)
    except Exception:
        pass

    dm = get_download_manager()
    job_id = await dm.add_download(req.url, metadata)
    return {"id": job_id, "status": "queued"}


@router.get("/queue", response_model=DownloadQueueResponse)
async def get_queue():
    from core import get_download_manager
    dm = get_download_manager()
    return DownloadQueueResponse(downloads=dm.get_all_jobs())


@router.delete("/{download_id}")
async def cancel_download(download_id: str):
    from core import get_download_manager
    dm = get_download_manager()
    success = await dm.cancel_download(download_id)
    if not success:
        raise HTTPException(status_code=404, detail="Download not found")
    return {"status": "cancelled"}


# ── History endpoints ──────────────────────────────────────────────────

@router.get("/history", response_model=DownloadHistoryResponse)
async def get_history(limit: int = 500, offset: int = 0):
    from core import get_history_db
    db = get_history_db()
    items = db.get_all(limit=limit, offset=offset)
    total = db.get_count()
    return DownloadHistoryResponse(items=items, total=total)


@router.delete("/history/{entry_id}")
async def delete_history_entry(entry_id: str):
    from core import get_history_db
    db = get_history_db()
    success = db.delete(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="History entry not found")
    return {"status": "deleted"}


@router.delete("/history")
async def clear_history():
    from core import get_history_db
    db = get_history_db()
    db.clear()
    return {"status": "cleared"}
