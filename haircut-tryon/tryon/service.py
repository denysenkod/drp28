from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from PIL import Image

from .config import Settings
from .diffusers_backend import DiffusersBackend, DiffusersBackendError
from .masking import create_hair_mask, normalize_manual_mask
from .mock import create_mock_output
from .storage import save_mask_image, save_rgb_image


DEFAULT_NEGATIVE_PROMPT = (
    "changed face, different person, distorted eyes, distorted mouth, warped face, "
    "extra head, bad haircut, blurry, low quality, artifacts"
)


class TryOnService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.diffusers = DiffusersBackend(settings)

    def generate(
        self,
        image: Image.Image | None,
        manual_mask: Image.Image | None,
        prompt: str,
        negative_prompt: str,
        seed: int,
        steps: int,
        cfg: float,
    ) -> tuple[list[str], Image.Image | None, str]:
        if image is None:
            return [], None, "Upload a face photo first."

        cleaned_prompt = (prompt or "").strip()
        if not cleaned_prompt:
            return [], None, "Describe the haircut you want to try."

        source_path = save_rgb_image(image, self.settings.input_dir, "face")
        mask_image = normalize_manual_mask(manual_mask, image.size) if manual_mask is not None else create_hair_mask(image)
        mask_path = save_mask_image(mask_image, self.settings.mask_dir, "hair-mask")

        try:
            if self.settings.backend == "mock":
                output_path = self.settings.output_dir / f"mock-tryon-{uuid4().hex[:12]}.png"
                create_mock_output(source_path, mask_path, output_path, cleaned_prompt)
                note = "Mock mode is on. The mask and page wiring work; switch TRYON_BACKEND to diffusers for real generation."
            elif self.settings.backend == "diffusers":
                output_path = self.settings.output_dir / f"tryon-{uuid4().hex[:12]}.png"
                self.diffusers.generate(
                    image_path=source_path,
                    mask_path=mask_path,
                    prompt=cleaned_prompt,
                    negative_prompt=(negative_prompt or DEFAULT_NEGATIVE_PROMPT).strip(),
                    seed=int(seed),
                    steps=int(steps),
                    cfg=float(cfg),
                    output_path=output_path,
                )
                note = "Generated locally with Diffusers."
            else:
                return [], mask_image, f"Unknown TRYON_BACKEND={self.settings.backend!r}. Use mock or diffusers."
        except (DiffusersBackendError, OSError, ValueError) as exc:
            return [], mask_image, f"Generation failed: {exc}"

        return [str(output_path)], mask_image, note
