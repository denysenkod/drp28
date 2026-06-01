from __future__ import annotations

import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageOps


def normalize_manual_mask(mask: Image.Image, size: tuple[int, int]) -> Image.Image:
    gray = ImageOps.exif_transpose(mask).convert("L").resize(size)
    arr = np.array(gray)
    arr = np.where(arr > 32, 255, 0).astype(np.uint8)
    return Image.fromarray(arr, "L").filter(ImageFilter.GaussianBlur(radius=3))


def create_hair_mask(image: Image.Image) -> Image.Image:
    """Create a conservative hair-region mask.

    This is intentionally simple: it finds the largest frontal face and masks the
    hairline/top/sides around it, while keeping the central face mostly locked.
    Replace this with SAM or a dedicated hair segmentation model for production.
    """
    rgb = ImageOps.exif_transpose(image).convert("RGB")
    width, height = rgb.size
    arr = np.array(rgb)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

    face = _largest_face(gray)
    mask = np.zeros((height, width), dtype=np.uint8)

    if face is None:
        x0, x1 = int(width * 0.18), int(width * 0.82)
        y0, y1 = int(height * 0.04), int(height * 0.48)
        cv2.ellipse(mask, ((x0 + x1) // 2, (y0 + y1) // 2), ((x1 - x0) // 2, (y1 - y0) // 2), 0, 0, 360, 255, -1)
    else:
        x, y, w, h = face
        cx = x + w // 2
        hair_center_y = max(0, y + int(h * 0.12))
        axes = (int(w * 0.78), int(h * 0.62))
        cv2.ellipse(mask, (cx, hair_center_y), axes, 0, 180, 360, 255, -1)

        side_top = max(0, y + int(h * 0.04))
        side_bottom = min(height, y + int(h * 0.58))
        left = max(0, x - int(w * 0.22))
        right = min(width, x + w + int(w * 0.22))
        cv2.rectangle(mask, (left, side_top), (right, side_bottom), 255, -1)

        face_lock = np.zeros_like(mask)
        cv2.ellipse(face_lock, (cx, y + int(h * 0.55)), (int(w * 0.46), int(h * 0.56)), 0, 0, 360, 255, -1)
        mask = cv2.bitwise_and(mask, cv2.bitwise_not(face_lock))

    kernel = np.ones((11, 11), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.GaussianBlur(mask, (25, 25), 0)
    mask = np.where(mask > 24, 255, 0).astype(np.uint8)
    return Image.fromarray(mask, "L")


def _largest_face(gray: np.ndarray) -> tuple[int, int, int, int] | None:
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    detector = cv2.CascadeClassifier(cascade_path)
    faces = detector.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=5, minSize=(80, 80))
    if len(faces) == 0:
        return None
    return tuple(max(faces, key=lambda item: item[2] * item[3]))

