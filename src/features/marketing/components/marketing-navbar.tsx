"use client";

import Link from "next/link";
import { ChevronRightIcon, MenuIcon, UserRoundIcon } from "lucide-react";

import { SiteLogo } from "@/components/site-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navLinks } from "@/features/marketing/data/landing-content";

export type MarketingUser = {
  name: string;
  email?: string;
  avatarUrl?: string;
} | null;

type MarketingNavbarProps = {
  user: MarketingUser;
};

export function MarketingNavbar({ user }: MarketingNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-7">
          <SiteLogo />
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Button key={link.href} variant="ghost" size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? <UserMenu user={user} /> : <GuestActions />}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" aria-label="Buka navigasi">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[min(22rem,90vw)] gap-0 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col px-4 pb-4 pt-16">
                <div className="rounded-2xl bg-secondary/65 p-2 ring-1 ring-border/70">
                  {navLinks.map((link) => (
                    <SheetClose key={link.href} asChild>
                      <Button
                        variant="ghost"
                        className="h-12 w-full justify-between rounded-xl px-4 text-base font-medium"
                        asChild
                      >
                        <Link href={link.href}>
                          {link.label}
                          <ChevronRightIcon data-icon="inline-end" />
                        </Link>
                      </Button>
                    </SheetClose>
                  ))}
                </div>
                <div className="mt-4 border-t border-border/70 pt-4">
                  {user ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 rounded-2xl bg-secondary/65 p-4 ring-1 ring-border/70">
                        <Avatar className="size-10">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{user.name}</p>
                          {user.email ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <SheetClose asChild>
                        <Button className="h-11 w-full" variant="outline" asChild>
                          <Link href="/account/profile">Profil</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <GuestActions stacked />
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

function GuestActions({ stacked = false }: { stacked?: boolean }) {
  return (
    <div className={stacked ? "flex flex-col gap-2" : "flex items-center gap-2"}>
      <Button
        variant="ghost"
        className={stacked ? "h-11 w-full" : undefined}
        asChild
      >
        <Link href="/login">Masuk</Link>
      </Button>
      <Button
        variant="outline-primary"
        className={stacked ? "h-11 w-full" : undefined}
        asChild
      >
        <Link href="/register">Daftar</Link>
      </Button>
    </div>
  );
}

function UserMenu({ user }: { user: NonNullable<MarketingUser> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2">
          <Avatar className="size-8">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="max-w-32 truncate text-sm">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserRoundIcon />
          Akun
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account/profile">Profil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/security">Ubah Password</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/logout">Logout</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
