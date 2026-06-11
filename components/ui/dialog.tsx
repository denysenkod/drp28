"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function Dialog({ open, title, children, onClose, className }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={onClose}>
      <div className={cn("relative max-h-[90vh] w-full max-w-xl overflow-auto rounded-hm border border-line bg-surface p-6 shadow-soft", className)} onMouseDown={(event) => event.stopPropagation()}>
        <Button className="absolute right-4 top-4" type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <h2 id="dialog-title" className="pr-10 font-serif text-3xl italic leading-none">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
