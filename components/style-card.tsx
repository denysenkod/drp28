"use client";

import { Heart } from "lucide-react";
import type { Style } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StyleCardProps = {
  style: Style;
  favourite?: boolean;
  onFavourite?: (id: string, next: boolean) => void;
  compact?: boolean;
};

export function StyleCard({ style, favourite = false, onFavourite, compact = false }: StyleCardProps) {
  return (
    <article className="group overflow-hidden rounded-hm border border-line bg-surface">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#ede2c8]">
        {style.imageUrl ? (
          <img src={style.imageUrl} alt={style.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" referrerPolicy="no-referrer" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center p-4 text-center text-sm font-semibold text-muted">{style.name}</div>
        )}
        {onFavourite ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className={cn("absolute right-2 top-2 h-9 w-9 rounded-full bg-white/95", favourite && "text-accent")}
            aria-label={favourite ? "Remove from favourites" : "Add to favourites"}
            onClick={() => onFavourite(style.id, !favourite)}
          >
            <Heart className={cn("h-4 w-4", favourite && "fill-current")} />
          </Button>
        ) : null}
      </div>
      {!compact ? (
        <div className="p-3">
          <h2 className="line-clamp-1 text-sm font-bold">{style.name}</h2>
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-muted">
            {[style.length, style.hairType, style.upkeep].filter(Boolean).join(" · ") || style.gender}
          </p>
        </div>
      ) : null}
    </article>
  );
}
