"use client";

import Link from "next/link";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MenuIcon,
} from "lucide-react";

import { SiteLogo } from "@/components/site-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
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
import { logoutAction } from "@/features/auth/actions";
import { navLinks } from "@/features/landing/data";

export type SiteUser = {
  name: string;
  email?: string;
  avatarUrl?: string | null;
  role?: "user" | "admin";
} | null;

type SiteNavbarProps = {
  user: SiteUser;
};

export function SiteNavbar({ user }: SiteNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/78 shadow-sm shadow-primary/5 backdrop-blur-xl">
      <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:hidden">
          <SiteLogo />
          <div className="flex items-center gap-1">
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
                            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
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
                        {user.role === "admin" ? (
                          <SheetClose asChild>
                            <Button className="h-11 w-full" variant="outline" asChild>
                              <Link href="/admin">Dashboard</Link>
                            </Button>
                          </SheetClose>
                        ) : null}
                        <SheetClose asChild>
                          <Button className="h-11 w-full" variant="outline" asChild>
                            <Link href="/profile">Profil</Link>
                          </Button>
                        </SheetClose>
                        <form action={logoutAction}>
                          <Button className="h-11 w-full" variant="ghost" type="submit">
                            Logout
                          </Button>
                        </form>
                      </div>
                    ) : (
                      <GuestActions stacked />
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden h-16 grid-cols-[1fr_auto_1fr] items-center md:grid">
          <div className="flex min-w-0 items-center">
            <SiteLogo />
          </div>
          <div className="flex items-center justify-center gap-2.5">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                className="h-9 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                asChild
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />
            {user ? <UserMenu user={user} /> : <GuestActions />}
          </div>
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

function UserMenu({ user }: { user: NonNullable<SiteUser> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 px-2 hover:bg-secondary/70 hover:text-foreground"
          aria-label={`Menu akun ${user.name}`}
          type="button"
        >
          <Avatar className="size-8">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="max-w-32 truncate text-sm">{user.name}</span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-2xl p-2">
        <DropdownMenuGroup>
          {user.role === "admin" ? (
            <DropdownMenuItem
              asChild
              className="h-10 rounded-xl px-3 focus:bg-secondary/70 focus:text-foreground hover:bg-secondary/70 hover:text-foreground"
            >
              <Link href="/admin">Dashboard</Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            asChild
            className="h-10 rounded-xl px-3 focus:bg-secondary/70 focus:text-foreground hover:bg-secondary/70 hover:text-foreground"
          >
            <Link href="/profile">Profil</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem
            asChild
            variant="destructive"
            className="h-10 rounded-xl px-3 focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <button type="submit" className="w-full text-left">
              Logout
            </button>
          </DropdownMenuItem>
        </form>
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
