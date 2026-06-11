"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addBriefFeedback, getBrief } from "@/lib/api";
import type { BriefItem, StyleBrief } from "@/lib/types";

function SharedTile({ item }: { item: BriefItem }) {
  return (
    <article className="overflow-hidden rounded-hm border border-line bg-surface">
      <div className="aspect-[3/4] overflow-hidden bg-[#ede2c8]">
        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-bold">{item.name || "Reference"}</h3>
        {item.annotation ? <p className="mt-2 text-sm leading-6 text-muted">{item.annotation}</p> : null}
      </div>
    </article>
  );
}

export function SharedProfile() {
  const params = useSearchParams();
  const id = params.get("brief") || "";
  const [brief, setBrief] = React.useState<StyleBrief | null>(null);
  const [status, setStatus] = React.useState("Loading profile...");
  const [author, setAuthor] = React.useState("Stylist");
  const [note, setNote] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (!id) {
      setStatus("This profile link is missing a brief id.");
      return;
    }
    getBrief(id)
      .then((item) => {
        setBrief(item);
        setStatus("");
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : "Could not load this profile."));
  }, [id]);

  async function submitFeedback(event: React.FormEvent) {
    event.preventDefault();
    if (!id || !note.trim()) return;
    setSending(true);
    try {
      await addBriefFeedback(id, note.trim(), author.trim() || "Stylist");
      const updated = await getBrief(id);
      setBrief(updated);
      setNote("");
    } finally {
      setSending(false);
    }
  }

  if (status) {
    return (
      <main className="mx-auto grid min-h-[60vh] w-[min(960px,calc(100%-32px))] place-items-center py-16 text-center">
        <div>
          <p className="eyebrow">Style brief</p>
          <h1 className="text-5xl font-extrabold leading-none">{status}</h1>
        </div>
      </main>
    );
  }

  if (!brief) return null;

  const self = brief.items.filter((item) => item.partition === "me");
  const refs = brief.items.filter((item) => item.partition === "references");
  const details = brief.details || {};
  const detailRows = [
    ["Colour", details.colour],
    ["Allergies", details.allergies],
    ["Previous treatments", details.previousTreatments],
    ["Damage", details.damage]
  ].filter(([, value]) => value);

  return (
    <main className="mx-auto w-[min(1320px,calc(100%-36px))] pb-20 pt-8">
      <header className="mb-9">
        <p className="eyebrow">Style brief</p>
        <h1 className="text-[clamp(42px,8vw,78px)] font-extrabold leading-none">
          Client hair <em className="font-serif font-normal italic text-accent">profile</em>
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <section>
            <div className="section-head">
              <h2 className="section-title">Their hair</h2>
            </div>
            <div className="profile-grid profile-grid-hair">
              {self.length ? self.map((item) => <SharedTile key={item.id} item={item} />) : <p className="text-muted">No photos added.</p>}
            </div>
          </section>

          <section>
            <div className="section-head">
              <h2 className="section-title">References</h2>
            </div>
            <div className="profile-grid profile-grid-ref">
              {refs.length ? refs.map((item) => <SharedTile key={item.id} item={item} />) : <p className="text-muted">No references added.</p>}
            </div>
          </section>
        </div>

        <aside className="rounded-[22px] border border-line bg-surface p-6 shadow-soft">
          <p className="eyebrow">Consultation notes</p>
          {detailRows.length ? (
            <dl className="mt-4 space-y-4">
              {detailRows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{label}</dt>
                  <dd className="mt-1 text-sm leading-6">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {details.notes ? (
            <div className="mt-6 border-t border-line pt-5">
              <h2 className="font-serif text-2xl italic">General notes</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{details.notes}</p>
            </div>
          ) : null}

          <form className="mt-6 border-t border-line pt-5" onSubmit={submitFeedback}>
            <h2 className="font-serif text-2xl italic">Stylist feedback</h2>
            <input value={author} onChange={(event) => setAuthor(event.target.value)} className="mt-4 w-full rounded-hm border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent" />
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add your thoughts..." className="mt-3 min-h-28 w-full resize-y rounded-hm border border-line bg-bg p-3 text-sm outline-none focus:border-accent" />
            <Button type="submit" className="mt-3 w-full" disabled={sending || !note.trim()}>
              <Send className="h-4 w-4" /> {sending ? "Sending..." : "Add feedback"}
            </Button>
          </form>

          {brief.feedback?.length ? (
            <div className="mt-6 space-y-3">
              {brief.feedback.map((entry) => (
                <div key={entry.id} className="rounded-hm border border-line bg-bg p-3">
                  <div className="text-sm font-bold">{entry.author || "Stylist"}</div>
                  <p className="mt-1 text-sm leading-6 text-muted">{entry.note}</p>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
