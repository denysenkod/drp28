"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search/", label: "Search", icon: Search },
  { href: "/profile/", label: "Profile", icon: UserRound }
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 hidden min-h-16 items-center justify-between border-b border-line bg-bg/90 px-8 backdrop-blur md:flex">
        <Link href="/" className="font-serif text-[28px] italic leading-none">
          HairMatch
        </Link>
        <nav className="flex items-center gap-2" aria-label="Primary">
          {links.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold hover:bg-[#ede2c8]",
                pathname === link.href && "bg-accent text-white hover:bg-accent"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-bg/95 px-2 pb-[max(6px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden" aria-label="Primary">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={cn("flex min-h-12 flex-1 items-center justify-center text-muted", active && "text-accent")} aria-label={link.label}>
              <Icon className="h-6 w-6" />
              <span className="sr-only">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
