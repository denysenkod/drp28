"use client";

import * as React from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StyleCard } from "@/components/style-card";
import { listFavourites, listStyles, setFavourite } from "@/lib/api";
import { filterStyles } from "@/lib/quiz";
import { getSessionId, readAnswers } from "@/lib/storage";
import type { QuizAnswers, Style } from "@/lib/types";

export function SearchExperience() {
  const [sessionId, setSessionId] = React.useState("");
  const [styles, setStyles] = React.useState<Style[]>([]);
  const [favourites, setFavourites] = React.useState<Set<string>>(new Set());
  const [answers, setAnswers] = React.useState<QuizAnswers>({});
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
    setAnswers(readAnswers());
    listStyles().then(setStyles);
    listFavourites(id).then(setFavourites);
  }, []);

  async function toggle(id: string, next: boolean) {
    setFavourites((current) => {
      const copy = new Set(current);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
    try {
      await setFavourite(sessionId, id, next);
    } catch {
      setFavourites((current) => {
        const copy = new Set(current);
        if (next) copy.delete(id);
        else copy.add(id);
        return copy;
      });
    }
  }

  const results = filterStyles(styles, answers, query);

  return (
    <main className="mx-auto w-[min(1450px,calc(100%-24px))] pb-28 pt-5 md:pb-16">
      <section className="mb-5 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow">Search</p>
          <h1 className="text-[clamp(40px,7vw,78px)] font-extrabold leading-none">Curated for you</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted">Saved haircuts are added to your profile references automatically.</p>
        </div>
        <Button variant="secondary" asChild>
          <Link className="inline-flex items-center gap-2" href="/quiz/">
            <SlidersHorizontal className="h-4 w-4" /> Refine answers
          </Link>
        </Button>
      </section>

      <div className="mb-5 flex gap-3 rounded-full border border-line bg-surface px-4 py-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search cuts, texture, colour..."
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {results.map((style) => (
          <StyleCard key={style.id} style={style} favourite={favourites.has(style.id)} onFavourite={toggle} />
        ))}
      </section>

      {!results.length ? <p className="mt-12 text-center font-semibold text-muted">No matches yet. Try a broader search.</p> : null}
    </main>
  );
}
