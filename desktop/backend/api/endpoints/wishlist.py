from fastapi import APIRouter, HTTPException

from api.schemas.wishlist import WishlistAddRequest, WishlistItem, WishlistResponse

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


@router.get("", response_model=WishlistResponse)
async def get_wishlist(limit: int = 500, offset: int = 0):
    from core import get_wishlist_db
    db = get_wishlist_db()
    items = db.get_all(limit=limit, offset=offset)
    total = db.get_count()
    return WishlistResponse(items=items, total=total)


@router.post("", response_model=WishlistItem)
async def add_to_wishlist(req: WishlistAddRequest):
    from core import get_wishlist_db
    db = get_wishlist_db()
    stored = db.add(req.model_dump())
    return WishlistItem(**stored)


@router.delete("/{item_id}")
async def remove_from_wishlist(item_id: str):
    from core import get_wishlist_db
    db = get_wishlist_db()
    success = db.delete(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return {"status": "deleted"}


@router.delete("")
async def clear_wishlist():
    from core import get_wishlist_db
    db = get_wishlist_db()
    db.clear()
    return {"status": "cleared"}
