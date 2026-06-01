from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path

from dotenv import load_dotenv


def _bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    base_dir: Path
    host: str
    port: int
    backend: str
    hf_token: str
    input_dir: Path
    mask_dir: Path
    output_dir: Path
    diffusers_model: str
    diffusers_device: str
    diffusers_variant: str
    diffusers_width: int
    diffusers_height: int
    diffusers_strength: float
    ip_adapter_repo: str
    ip_adapter_subfolder: str
    ip_adapter_weight_name: str
    ip_adapter_scale: float

    @property
    def mock_mode(self) -> bool:
        return self.backend == "mock"

    @property
    def use_ip_adapter(self) -> bool:
        return bool(self.ip_adapter_repo and self.ip_adapter_weight_name)

    @classmethod
    def from_env(cls) -> "Settings":
        base_dir = Path(__file__).resolve().parents[1]
        load_dotenv(base_dir / ".env")

        data_dir = base_dir / "data"
        input_dir = data_dir / "inputs"
        mask_dir = data_dir / "masks"
        output_dir = data_dir / "outputs"
        for directory in (input_dir, mask_dir, output_dir):
            directory.mkdir(parents=True, exist_ok=True)

        return cls(
            base_dir=base_dir,
            host=os.getenv("TRYON_HOST", "127.0.0.1"),
            port=_int_env("TRYON_PORT", 7860),
            backend=os.getenv("TRYON_BACKEND", "mock").strip().lower(),
            hf_token=os.getenv("HF_TOKEN", "").strip(),
            input_dir=input_dir,
            mask_dir=mask_dir,
            output_dir=output_dir,
            diffusers_model=os.getenv("DIFFUSERS_MODEL", "diffusers/stable-diffusion-xl-1.0-inpainting-0.1"),
            diffusers_device=os.getenv("DIFFUSERS_DEVICE", "cuda").strip().lower(),
            diffusers_variant=os.getenv("DIFFUSERS_VARIANT", "fp16").strip(),
            diffusers_width=_int_env("DIFFUSERS_WIDTH", 1024),
            diffusers_height=_int_env("DIFFUSERS_HEIGHT", 1024),
            diffusers_strength=float(os.getenv("DIFFUSERS_STRENGTH", "0.86")),
            ip_adapter_repo=os.getenv("IP_ADAPTER_REPO", "").strip(),
            ip_adapter_subfolder=os.getenv("IP_ADAPTER_SUBFOLDER", "").strip(),
            ip_adapter_weight_name=os.getenv("IP_ADAPTER_WEIGHT_NAME", "").strip(),
            ip_adapter_scale=float(os.getenv("IP_ADAPTER_SCALE", "0.45")),
        )
