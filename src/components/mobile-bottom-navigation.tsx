"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  BookOpenCheckIcon,
  CrownIcon,
  TrophyIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { navLinks } from "@/features/landing/data";

const bottomNavIcons: Record<string, LucideIcon> = {
  "/practices": BookOpenCheckIcon,
  "/tryouts": TrophyIcon,
  "/progress": BarChart3Icon,
  "/pricing": CrownIcon,
  "/profile": UserIcon,
};

const mobileNavLinks = navLinks.map((item) =>
  item.href === "/blog"
    ? { label: "Profil", href: "/profile" }
    : item,
);

const hiddenRoutePrefixes = [
  "/admin",
  "/login",
  "/practice-sessions",
  "/tryout-sessions",
  "/vocabulary/play",
  "/logout",
];

export function MobileBottomNavigation() {
  const pathname = usePathname();

  if (hiddenRoutePrefixes.some((prefix) => isRouteMatch(pathname, prefix))) {
    return null;
  }

  return (
    <>
      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/94 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mobileNavLinks.map((item) => {
            const isActive = isRouteMatch(pathname, item.href);
            const Icon = bottomNavIcons[item.href];

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[0.68rem] font-semibold leading-none text-muted-foreground transition-colors",
                  "hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive && "bg-primary/10 text-primary",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0",
                    isActive && "stroke-[2.4]",
                  )}
                />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div
        aria-hidden="true"
        className="h-[calc(4.875rem+env(safe-area-inset-bottom))] md:hidden"
      />
    </>
  );
}

function isRouteMatch(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
