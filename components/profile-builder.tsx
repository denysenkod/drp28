"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Copy, Heart, Info, Plus, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { createUserPhoto, listFavourites, listStyles, listUserPhotos, saveBrief } from "@/lib/api";
import { buildShareItems, fileToDataUrl, mergeReferences, photoToBriefItem, profileCompleteness, uploadToBriefItem } from "@/lib/brief";
import { BRIEF_DETAILS_KEY, BRIEF_ID_KEY, getSessionId, readBrief, readBriefDetails, readBriefId, writeBrief, writeBriefDetails, writeBriefId, writeStored } from "@/lib/storage";
import type { BriefDetails, BriefItem, Style } from "@/lib/types";
import { formatCount } from "@/lib/utils";

function PhotoTile({ item, onRemove, reference = false }: { item: BriefItem; onRemove?: (id: string) => void; reference?: boolean }) {
  return (
    <article className="overflow-hidden rounded-[16px] border border-line bg-surface">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#ede2c8]">
        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        {reference && item.source !== "upload" ? (
          <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-accent shadow-sm">
            <Heart className="h-4 w-4 fill-current" />
          </span>
        ) : null}
        {onRemove ? (
          <Button type="button" variant="dark" size="icon" className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/65 text-white" onClick={() => onRemove(item.id)} aria-label="Remove">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      {reference ? (
        <div className="px-3 py-2 text-xs text-muted">
          <b className="block text-sm text-ink">{item.source === "upload" ? item.name || "Reference photo" : item.name}</b>
          {item.source === "upload" ? "Uploaded" : "Saved to favourites"}
        </div>
      ) : (
        <div className="px-3 py-2 text-xs font-semibold text-muted">Uploaded</div>
      )}
    </article>
  );
}

function AddSlot({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="relative grid aspect-[3/4] place-items-center rounded-[16px] border border-dashed border-[#ddd0bd] bg-white/45 p-4 text-center hover:border-accent hover:bg-accent-soft/40">
      <div className="flex flex-col items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
          <Plus className="h-6 w-6" />
        </span>
        <span className="font-semibold text-accent">{title}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{hint}</span>
      </div>
      {children}
    </div>
  );
}

export function ProfileBuilder() {
  const [sessionId, setSessionId] = React.useState("");
  const [styles, setStyles] = React.useState<Style[]>([]);
  const [favourites, setFavourites] = React.useState<Set<string>>(new Set());
  const [brief, setBriefState] = React.useState<BriefItem[]>([]);
  const [userPhotos, setUserPhotos] = React.useState<BriefItem[]>([]);
  const [details, setDetails] = React.useState<BriefDetails>({});
  const [briefId, setBriefId] = React.useState<string | null>(null);
  const [completeOpen, setCompleteOpen] = React.useState(false);
  const [shareStatus, setShareStatus] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
    setBriefState(readBrief());
    setDetails(readBriefDetails());
    setBriefId(readBriefId());
    listStyles().then(setStyles);
    listFavourites(id).then(setFavourites);
    listUserPhotos(id).then((photos) => setUserPhotos(photos.map(photoToBriefItem)));
  }, []);

  const favouriteStyles = styles.filter((style) => favourites.has(style.id));
  const selfItems = [...userPhotos, ...brief.filter((item) => item.partition === "me")].filter((item, index, list) => list.findIndex((entry) => entry.id === item.id) === index);
  const referenceItems = mergeReferences(brief, favouriteStyles);
  const completeness = profileCompleteness(selfItems.length, referenceItems.length, details);

  function commitBrief(next: BriefItem[]) {
    setBriefState(next);
    writeBrief(next);
  }

  function commitDetails(next: BriefDetails) {
    setDetails(next);
    writeBriefDetails(next);
  }

  async function upload(files: FileList | null, partition: "me" | "references") {
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;
    const added: BriefItem[] = [];
    for (const file of imageFiles) {
      const dataUrl = await fileToDataUrl(file);
      const item = uploadToBriefItem(dataUrl, partition === "me" ? "Your hair" : file.name || "Uploaded reference", partition);
      if (partition === "me") {
        try {
          const saved = await createUserPhoto(sessionId, dataUrl, item.name, "Your hair now");
          setUserPhotos((current) => [photoToBriefItem(saved), ...current]);
        } catch {
          added.push(item);
        }
      } else {
        added.push(item);
      }
    }
    commitBrief([...added, ...brief]);
  }

  function removeItem(id: string) {
    commitBrief(brief.filter((item) => item.id !== id));
    setUserPhotos((items) => items.filter((item) => item.id !== id));
  }

  async function completeProfile() {
    setSaving(true);
    setShareStatus("");
    try {
      const items = buildShareItems(brief, selfItems, favouriteStyles);
      const saved = await saveBrief(sessionId, items, details);
      setBriefId(saved.id);
      writeBriefId(saved.id);
      writeStored(BRIEF_DETAILS_KEY, details);
      writeStored(BRIEF_ID_KEY, saved.id);
      const url = `${window.location.origin}/shared/?brief=${encodeURIComponent(saved.id)}`;
      await navigator.clipboard?.writeText(url);
      setShareStatus("Copied profile link");
      setCompleteOpen(false);
    } catch (err) {
      setShareStatus(err instanceof Error ? err.message : "Could not create the share link.");
    } finally {
      setSaving(false);
    }
  }

  const shareUrl = briefId ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/?brief=${encodeURIComponent(briefId)}` : "Complete profile to create a link";

  return (
    <main className="mx-auto w-[min(1320px,calc(100%-36px))] pb-32 pt-6 md:pb-16 md:pt-10">
      <div className="grid gap-9 lg:grid-cols-[1fr_348px] lg:gap-14">
        <div>
          <header className="mb-9">
            <p className="eyebrow">Your profile</p>
            <h1 className="text-[clamp(46px,10vw,84px)] font-extrabold leading-[0.94] tracking-normal">
              Your hair <em className="font-serif font-normal italic text-accent">brief</em>
            </h1>
            <p className="mt-5 max-w-xl leading-7 text-muted">
              Gather photos of your hair today and the looks you are after, add colour details and notes, then share one link with your stylist.
            </p>
          </header>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Your hair</h2>
              <p className="section-sub">Photos of your hair right now.</p>
            </div>
            <div className="profile-grid profile-grid-hair">
              {selfItems.map((item) => (
                <PhotoTile key={item.id} item={item} onRemove={removeItem} />
              ))}
              <AddSlot title="Add a photo of you" hint="Upload from device">
                <input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="image/*" multiple aria-label="Add a photo of you" onChange={(event) => upload(event.target.files, "me")} />
              </AddSlot>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">References</h2>
              <p className="section-sub">Every saved haircut appears here automatically. Uploaded phone references are marked as uploaded.</p>
            </div>
            <div className="profile-grid profile-grid-ref">
              {referenceItems.map((item) => (
                <PhotoTile key={item.id} item={item} reference onRemove={item.source === "upload" ? removeItem : undefined} />
              ))}
              <AddSlot title="Add a reference" hint="Upload or choose saved">
                <input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="image/*" multiple aria-label="Upload a reference" onChange={(event) => upload(event.target.files, "references")} />
              </AddSlot>
            </div>
            <Button className="mt-4" variant="secondary" asChild>
              <Link className="inline-flex items-center gap-2" href="/search/">
                Choose from saved styles
              </Link>
            </Button>
          </section>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Colour &amp; treatment</h2>
              <p className="section-sub">What you have now and where you would like it to go.</p>
            </div>
            <div className="rounded-[22px] border border-line bg-surface p-5">
              <div className="grid gap-x-8 sm:grid-cols-2">
                {[
                  ["Current colour", "colour", "e.g. Natural dark brown"],
                  ["Allergies", "allergies", "e.g. PPD allergy or none"],
                  ["Previous treatments", "previousTreatments", "e.g. Box dye 3 months ago"],
                  ["Damage", "damage", "e.g. Dry ends, heat damage"]
                ].map(([label, key, placeholder]) => (
                  <label key={key} className="border-b border-line py-4">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{label}</span>
                    <input
                      value={String(details[key as keyof BriefDetails] || "")}
                      onChange={(event) => commitDetails({ ...details, [key]: event.target.value, detailsOpen: true })}
                      placeholder={placeholder}
                      className="mt-2 w-full bg-transparent text-sm font-medium outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">General notes</h2>
              <p className="section-sub">Anything else you would like your stylist to know.</p>
            </div>
            <div className="rounded-[22px] border border-line bg-surface p-5">
              <textarea
                value={details.notes || ""}
                onChange={(event) => commitDetails({ ...details, notes: event.target.value })}
                placeholder="Anything else you would like your stylist to know..."
                className="min-h-32 w-full resize-y rounded-[14px] border border-line bg-bg p-4 outline-none focus:border-accent"
              />
            </div>
          </section>
        </div>

        <aside className="brief-panel">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Your brief</span>
            <span className="text-[11px] tracking-[0.06em] text-muted">{briefId ? `REF ${briefId.slice(0, 4).toUpperCase()}` : "Draft"}</span>
          </div>
          <h2 className="mt-2 font-serif text-3xl italic leading-none">{completeness >= 75 ? "Almost ready" : "In progress"}</h2>
          <div className="my-5">
            <div className="mb-2 flex justify-between text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              <span>Completeness</span>
              <b className="font-serif text-base italic normal-case tracking-normal text-ink">{completeness}%</b>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent" style={{ width: `${completeness}%` }} />
            </div>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {[
              ["Your hair", formatCount(selfItems.length, "photo")],
              ["References", `${referenceItems.length} · ${favouriteStyles.length} favourites`],
              ["Colour & treatment", details.colour || details.allergies || details.previousTreatments || details.damage ? "Added" : "Optional"],
              ["General notes", details.notes ? "Added" : "Optional"]
            ].map(([label, count]) => (
              <li key={label} className="flex items-center gap-3 py-3 text-sm">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                  <Check className="h-3 w-3" />
                </span>
                <span className="flex-1 font-semibold">{label}</span>
                <span className="text-xs text-muted">{count}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-line pt-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Shareable link</p>
            <div className="flex items-center gap-2 rounded-[12px] border border-line bg-bg py-1 pl-3 pr-1">
              <span className="min-w-0 flex-1 truncate text-sm">{shareUrl}</span>
              <Button type="button" variant="dark" size="sm" onClick={() => briefId && navigator.clipboard?.writeText(shareUrl)}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            </div>
            <Button type="button" className="mt-3 w-full" onClick={() => setCompleteOpen(true)}>
              <Share2 className="h-4 w-4" /> Complete your profile
            </Button>
            {shareStatus ? <p className="mt-3 text-sm font-semibold text-accent">{shareStatus}</p> : null}
            <p className="mt-3 flex gap-2 text-xs leading-5 text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Anyone with the link can view your brief.
            </p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">Brief {completeness}% ready</div>
          <div className="text-xs text-muted">{selfItems.length} photos · {referenceItems.length} references</div>
        </div>
        <Button type="button" onClick={() => setCompleteOpen(true)}>Complete</Button>
      </div>

      <Dialog open={completeOpen} title="Is there anything else you would like to tell your barber?" onClose={() => setCompleteOpen(false)}>
        <div className="mt-5">
          <textarea
            value={details.notes || ""}
            onChange={(event) => commitDetails({ ...details, notes: event.target.value })}
            className="min-h-36 w-full resize-y rounded-[14px] border border-line bg-bg p-4 outline-none focus:border-accent"
            placeholder="Anything else you would like your barber to know?"
          />
          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button type="button" onClick={completeProfile} disabled={saving}>
              <Share2 className="h-4 w-4" /> {saving ? "Sharing..." : "Share"}
            </Button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
