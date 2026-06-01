from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageOps

from .config import Settings


class DiffusersBackendError(RuntimeError):
    pass


class DiffusersBackend:
    """Headless SDXL inpainting backend.

    Imports are lazy so the Gradio app can still run in mock mode without
    installing PyTorch and the model stack.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self._pipe = None
        self._torch = None

    def generate(
        self,
        image_path: Path,
        mask_path: Path,
        prompt: str,
        negative_prompt: str,
        seed: int,
        steps: int,
        cfg: float,
        output_path: Path,
    ) -> Path:
        pipe, torch = self._load_pipeline()
        image = self._prepare_image(Image.open(image_path).convert("RGB"))
        mask = self._prepare_image(Image.open(mask_path).convert("L"))
        generator = None

        if seed >= 0:
            generator = torch.Generator(device=self._generator_device(torch)).manual_seed(int(seed))
        else:
            generator = torch.Generator(device=self._generator_device(torch)).manual_seed(random.randint(1, 2**31 - 1))

        kwargs = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "image": image,
            "mask_image": mask,
            "num_inference_steps": int(steps),
            "guidance_scale": float(cfg),
            "strength": float(self.settings.diffusers_strength),
            "generator": generator,
        }
        if self.settings.use_ip_adapter:
            kwargs["ip_adapter_image"] = image

        with torch.inference_mode():
            result = pipe(**kwargs)

        output = result.images[0]
        output.save(output_path)
        return output_path

    def _load_pipeline(self):
        if self._pipe is not None and self._torch is not None:
            return self._pipe, self._torch

        try:
            import torch
            from diffusers import AutoPipelineForInpainting, EulerAncestralDiscreteScheduler
        except ImportError as exc:
            raise DiffusersBackendError(
                "The diffusers backend is not installed. Run .\\install-diffusers.ps1 from haircut-tryon."
            ) from exc

        device = self._resolve_device(torch)
        dtype = torch.float16 if device == "cuda" else torch.float32
        token = self.settings.hf_token or None
        variant = self.settings.diffusers_variant or None

        try:
            pipe = AutoPipelineForInpainting.from_pretrained(
                self.settings.diffusers_model,
                torch_dtype=dtype,
                variant=variant,
                use_safetensors=True,
                token=token,
            )
        except Exception as exc:
            raise DiffusersBackendError(f"Could not load model {self.settings.diffusers_model!r}: {exc}") from exc

        pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
        pipe = pipe.to(device)
        if hasattr(pipe, "enable_vae_slicing"):
            pipe.enable_vae_slicing()

        if self.settings.use_ip_adapter:
            try:
                pipe.load_ip_adapter(
                    self.settings.ip_adapter_repo,
                    subfolder=self.settings.ip_adapter_subfolder or None,
                    weight_name=self.settings.ip_adapter_weight_name,
                    token=token,
                )
                pipe.set_ip_adapter_scale(self.settings.ip_adapter_scale)
            except Exception as exc:
                raise DiffusersBackendError(f"Could not load IP-Adapter weights: {exc}") from exc
        else:
            # Attention slicing conflicts with IP-Adapter attention processors in
            # some Diffusers versions. Only use it for the plain inpainting path.
            pipe.enable_attention_slicing()

        self._pipe = pipe
        self._torch = torch
        return pipe, torch

    def _resolve_device(self, torch) -> str:
        requested = self.settings.diffusers_device
        if requested == "cuda" and not torch.cuda.is_available():
            raise DiffusersBackendError("DIFFUSERS_DEVICE=cuda, but torch.cuda.is_available() is false.")
        return requested

    def _generator_device(self, torch) -> str:
        return "cuda" if self.settings.diffusers_device == "cuda" and torch.cuda.is_available() else "cpu"

    def _prepare_image(self, image: Image.Image) -> Image.Image:
        width = self._multiple_of_8(self.settings.diffusers_width)
        height = self._multiple_of_8(self.settings.diffusers_height)
        return ImageOps.exif_transpose(image).resize((width, height), Image.Resampling.LANCZOS)

    @staticmethod
    def _multiple_of_8(value: int) -> int:
        return max(64, int(value) - (int(value) % 8))
