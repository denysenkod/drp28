"use client";

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Images, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StyleCard } from "@/components/style-card";
import { listStyles } from "@/lib/api";
import type { Style } from "@/lib/types";

export function HomeExperience() {
  const [styles, setStyles] = React.useState<Style[]>([]);

  React.useEffect(() => {
    listStyles().then((items) => setStyles(items.slice(0, 8)));
  }, []);

  return (
    <main className="mx-auto w-[min(1480px,calc(100%-40px))] pb-24 pt-10 md:pb-16">
      <section className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <div className="mb-12 hidden font-serif text-6xl italic leading-none md:block">HairMatch</div>
        <h1 className="max-w-4xl text-[clamp(44px,8vw,88px)] font-extrabold leading-[0.96] tracking-normal">
          Find a haircut that feels like <span className="block font-serif font-normal italic text-accent">you</span>
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
          Answer a few questions, save references you like, and build a clean profile to share before the appointment.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link className="inline-flex items-center gap-2" href="/quiz/">
              Start questionnaire <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link className="inline-flex items-center gap-2" href="/search/">
              Browse styles <Search className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {([
          { title: "Questionnaire", copy: "Shape the search around texture, length, face shape, and upkeep.", icon: Images },
          { title: "Search", copy: "Save haircuts you like; every favourite becomes a profile reference.", icon: Search },
          { title: "Profile", copy: "Add photos of your hair now and share a single stylist-ready link.", icon: UserRound }
        ] satisfies Array<{ title: string; copy: string; icon: LucideIcon }>).map(({ title, copy, icon: IconComponent }) => {
          return (
            <div key={title} className="rounded-hm border border-line bg-surface p-6">
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-hm bg-accent-soft text-accent">
                <IconComponent className="h-6 w-6" />
              </span>
              <h2 className="text-2xl font-extrabold">{title}</h2>
              <p className="mt-3 leading-7 text-muted">{copy}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {styles.map((style) => (
          <StyleCard key={style.id} style={style} compact />
        ))}
      </section>
    </main>
  );
}
