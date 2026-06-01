from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import gradio as gr

from tryon.config import Settings
from tryon.ui import build_ui


settings = Settings.from_env()

api = FastAPI(
    title="HairMatch Virtual Hair Try-On",
    description="Local FastAPI + Gradio page for headless SDXL haircut inpainting.",
    version="0.1.0",
)


@api.get("/api/health")
def health() -> dict[str, object]:
    return {
        "ok": True,
        "backend": settings.backend,
        "model": settings.diffusers_model,
        "device": settings.diffusers_device,
        "ipAdapterEnabled": settings.use_ip_adapter,
    }


api.mount("/outputs", StaticFiles(directory=settings.output_dir), name="outputs")

app = gr.mount_gradio_app(api, build_ui(settings), path="/")


if __name__ == "__main__":
    uvicorn.run("app:app", host=settings.host, port=settings.port, reload=False)
