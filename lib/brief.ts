import type { BriefDetails, BriefItem, Style, UserPhoto } from "@/lib/types";
import { uid } from "@/lib/utils";

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

export function styleToReference(style: Style, source: "favourite" | "saved" = "favourite"): BriefItem {
  return {
    id: `style-${style.id}`,
    source,
    partition: "references",
    styleId: style.id,
    referenceStyleId: style.id,
    imageUrl: style.imageUrl,
    name: style.name,
    firstChoice: true,
    annotation: ""
  };
}

export function photoToBriefItem(photo: UserPhoto): BriefItem {
  return {
    id: `photo-${photo.id}`,
    source: "upload",
    partition: "me",
    imageUrl: photo.imageData,
    name: photo.label || "Your hair",
    annotation: photo.description || ""
  };
}

export function uploadToBriefItem(imageUrl: string, name: string, partition: "me" | "references"): BriefItem {
  return {
    id: uid(partition === "me" ? "hair" : "ref"),
    source: "upload",
    partition,
    imageUrl,
    name,
    annotation: ""
  };
}

export function mergeReferences(localItems: BriefItem[], favouriteStyles: Style[]) {
  const existing = new Map<string, BriefItem>();
  for (const item of localItems.filter((entry) => entry.partition === "references")) {
    const key = item.styleId || item.referenceStyleId || item.id;
    existing.set(key, item);
  }

  for (const style of favouriteStyles) {
    const key = style.id;
    if (!existing.has(key)) existing.set(key, styleToReference(style, "favourite"));
  }

  return Array.from(existing.values());
}

export function buildShareItems(localItems: BriefItem[], selfPhotos: BriefItem[], favouriteStyles: Style[]) {
  const self = new Map<string, BriefItem>();
  for (const item of [...selfPhotos, ...localItems.filter((entry) => entry.partition === "me")]) {
    self.set(item.id, { ...item, partition: "me", source: "upload" });
  }

  return [...Array.from(self.values()), ...mergeReferences(localItems, favouriteStyles)];
}

export function profileCompleteness(selfCount: number, refCount: number, details: BriefDetails) {
  const checks = [
    selfCount > 0,
    refCount > 0,
    Boolean(details.colour || details.allergies || details.previousTreatments || details.damage),
    Boolean(details.notes)
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
