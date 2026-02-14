from fastapi import APIRouter

from api.schemas.config import AppConfig, AuthStatusResponse

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("")
async def get_config():
    from core import get_wrapper
    wrapper = get_wrapper()
    return wrapper.get_config()


@router.put("")
async def update_config(config: AppConfig):
    from core import get_wrapper
    wrapper = get_wrapper()
    wrapper.update_config(config.model_dump(exclude_unset=True))
    return {"status": "ok"}


@router.get("/auth/status", response_model=AuthStatusResponse)
async def get_auth_status():
    from core import get_wrapper
    wrapper = get_wrapper()
    return wrapper.get_auth_status()
