from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageOps


def safe_stem(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:12]}"


def save_rgb_image(image: Image.Image, directory: Path, prefix: str) -> Path:
    path = directory / f"{safe_stem(prefix)}.png"
    ImageOps.exif_transpose(image).convert("RGB").save(path)
    return path


def save_mask_image(mask: Image.Image, directory: Path, prefix: str) -> Path:
    path = directory / f"{safe_stem(prefix)}.png"
    mask.convert("L").save(path)
    return path

