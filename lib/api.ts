import { fallbackStyles } from "@/lib/fallback-styles";
import type { BriefDetails, BriefItem, GalleryImage, Style, StyleBrief, UserPhoto } from "@/lib/types";

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";

async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Request failed.");
  }
  return data as T;
}

export function galleryItemToStyle(item: GalleryImage): Style {
  const analysis = item.analysis || {};
  const labels = [...(item.labels || []), ...(item.features || [])].filter(Boolean);
  return {
    id: String(item.id),
    name: analysis.haircutName || item.title || "Haircut",
    imageUrl: item.imageUrl || "",
    description: item.description || analysis.maintenance || "",
    gender: analysis.gender || item.gender || "Unisex",
    length: analysis.length || item.length || "",
    hairType: analysis.hairType || item.hairType || "",
    hairThickness: analysis.hairThickness || item.hairThickness || "",
    upkeep: analysis.upkeep || item.maintenanceLevel || "",
    faceShape: analysis.faceShape || "",
    hairColour: analysis.hairColour || "",
    labels
  };
}

export async function listStyles(): Promise<Style[]> {
  try {
    const data = await apiJson<{ ok: true; items: GalleryImage[] }>("/api/gallery");
    const styles = data.items.map(galleryItemToStyle).filter((style) => style.imageUrl);
    return styles.length ? styles : fallbackStyles;
  } catch {
    return fallbackStyles;
  }
}

export async function listFavourites(sessionId: string): Promise<Set<string>> {
  if (!sessionId) return new Set();
  try {
    const data = await apiJson<{ ok: true; items: Array<{ imageId: string }> }>(
      `/api/favorites?sessionId=${encodeURIComponent(sessionId)}`
    );
    return new Set(data.items.map((item) => item.imageId));
  } catch {
    return new Set();
  }
}

export async function setFavourite(sessionId: string, imageId: string, on: boolean) {
  if (!sessionId || !imageId) return;
  if (on) {
    await apiJson("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ sessionId, imageId })
    });
    return;
  }

  await apiJson("/api/favorites", {
    method: "DELETE",
    body: JSON.stringify({ sessionId, imageId })
  });
}

export async function listUserPhotos(sessionId: string): Promise<UserPhoto[]> {
  if (!sessionId) return [];
  try {
    const data = await apiJson<{ ok: true; items: UserPhoto[] }>(
      `/api/user-photos?sessionId=${encodeURIComponent(sessionId)}`
    );
    return data.items || [];
  } catch {
    return [];
  }
}

export async function createUserPhoto(sessionId: string, imageData: string, label: string, description = "") {
  const data = await apiJson<{ ok: true; item: UserPhoto }>("/api/user-photos", {
    method: "POST",
    body: JSON.stringify({ sessionId, imageData, label, description })
  });
  return data.item;
}

export async function saveBrief(sessionId: string, items: BriefItem[], details: BriefDetails) {
  const data = await apiJson<{ ok: true; item: StyleBrief }>("/api/briefs", {
    method: "POST",
    body: JSON.stringify({ sessionId, items, details })
  });
  return data.item;
}

export async function getBrief(id: string) {
  const data = await apiJson<{ ok: true; item: StyleBrief }>(`/api/briefs/${encodeURIComponent(id)}`);
  return data.item;
}

export async function addBriefFeedback(id: string, note: string, author = "Stylist") {
  const data = await apiJson<{ ok: true; item: unknown }>(`/api/briefs/${encodeURIComponent(id)}/feedback`, {
    method: "POST",
    body: JSON.stringify({ note, author })
  });
  return data.item;
}
