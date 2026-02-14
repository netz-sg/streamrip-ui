"""Streamrip Desktop Backend - FastAPI server."""

import argparse
import asyncio
import logging
import platform
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api.endpoints.url import router as url_router
from api.endpoints.download import router as download_router
from api.endpoints.search import router as search_router
from api.endpoints.config import router as config_router
from api.endpoints.wishlist import router as wishlist_router
from api.websocket import WebSocketManager
from core import get_wrapper, get_download_manager, set_broadcast_fn, get_history_db, get_wishlist_db
from core.compat_check import assert_compatible

if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("streamrip_desktop")

ws_manager = WebSocketManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify streamrip API compatibility before anything else
    assert_compatible()

    set_broadcast_fn(ws_manager.broadcast)
    dm = get_download_manager()
    dm.start()
    logger.info("Backend started")
    yield
    wrapper = get_wrapper()
    await wrapper.close()
    get_history_db().close()
    get_wishlist_db().close()
    logger.info("Backend shutdown")


app = FastAPI(title="Streamrip Desktop API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(url_router)
app.include_router(download_router)
app.include_router(search_router)
app.include_router(config_router)
app.include_router(wishlist_router)


@app.get("/health")
async def health():
    try:
        import streamrip
        sr_version = getattr(streamrip, "__version__", "unknown")
    except ImportError:
        sr_version = "unavailable"
    return {"status": "ok", "version": "1.0.0", "streamrip_version": sr_version}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=18723)
    parser.add_argument("--host", type=str, default="127.0.0.1")
    args = parser.parse_args()

    print(f"BACKEND_READY:PORT={args.port}", flush=True)
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")
