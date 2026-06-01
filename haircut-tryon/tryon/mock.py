from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


def create_mock_output(source_path: Path, mask_path: Path, output_path: Path, prompt: str) -> Path:
    source = Image.open(source_path).convert("RGB")
    mask = Image.open(mask_path).convert("L").resize(source.size).filter(ImageFilter.GaussianBlur(radius=10))

    overlay = Image.new("RGB", source.size, (126, 73, 39))
    preview = Image.composite(overlay, source, mask)
    preview = Image.blend(source, preview, 0.42)

    draw = ImageDraw.Draw(preview)
    label = "Mock preview - switch TRYON_BACKEND=diffusers for AI generation"
    prompt_text = f"Prompt: {prompt[:90]}"
    font = ImageFont.load_default()
    pad = 14
    box_h = 58
    draw.rectangle((0, preview.height - box_h, preview.width, preview.height), fill=(255, 250, 241))
    draw.text((pad, preview.height - box_h + 12), label, fill=(28, 24, 21), font=font)
    draw.text((pad, preview.height - box_h + 32), prompt_text, fill=(122, 111, 100), font=font)

    ImageOps.exif_transpose(preview).save(output_path)
    return output_path
