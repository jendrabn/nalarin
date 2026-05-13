import Form from "next/form";
import Link from "next/link";
import { LibraryBigIcon, SearchIcon } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar, type SiteUser } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";

import type { BlogListingResult } from "../queries";
import { BlogCard } from "./blog-card";
import { BlogPagination } from "./blog-pagination";

type BlogIndexPageProps = {
  user: SiteUser;
  listing: BlogListingResult;
  query: string;
  categorySlug: string;
};

export function BlogIndexPage({
  user,
  listing,
  query,
  categorySlug,
}: BlogIndexPageProps) {
  const visibleCategories = listing.categories.length
    ? listing.categories
    : fallbackCategories;
  const hasActiveFilter = Boolean(query || categorySlug);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={user} />
      <main>
        <section className="relative isolate overflow-hidden border-b bg-background">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_12%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_42%),linear-gradient(180deg,var(--background)_0%,var(--secondary)_58%,var(--background)_100%)]" />
          <div className="absolute inset-0 -z-10 opacity-[0.34] [background-image:linear-gradient(0deg,color-mix(in_oklch,var(--foreground)_4%,transparent)_1px,transparent_1px)] [background-size:100%_18px]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-b from-transparent to-background" />
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-14 lg:px-8">
            <h1 className="max-w-4xl text-balance text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Strategi Belajar, Pembahasan, dan Ritme Persiapan Tes
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Baca artikel tentang UTBK, UTUL UGM, SIMAK UI, CPNS, tryout, dan
              cara membangun kebiasaan belajar yang lebih terukur.
            </p>
            <Form
              action="/blog"
              role="search"
              className="mt-8 w-full max-w-xl"
            >
              <label className="sr-only" htmlFor="blog-search">
                Cari artikel
              </label>
              <div className="relative rounded-full bg-background/90 p-1 shadow-lg shadow-primary/5 ring-1 ring-border/80 backdrop-blur transition-all focus-within:ring-primary/35">
                <SearchIcon className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="blog-search"
                  name="q"
                  type="search"
                  defaultValue={query}
                  placeholder="Cari strategi UTBK, tryout, SIMAK UI..."
                  className="h-12 rounded-full border-0 bg-transparent pl-11 pr-5 text-base shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
                />
                {categorySlug ? (
                  <input type="hidden" name="category" value={categorySlug} />
                ) : null}
              </div>
            </Form>
            <div
              aria-label="Kategori blog"
              className="mt-6 flex w-full max-w-3xl items-center gap-7 overflow-x-auto px-1 pb-2 text-sm text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center"
            >
              <Link
                href={buildCategoryHref("", query)}
                className="shrink-0 pb-1.5 text-sm font-semibold leading-none text-muted-foreground transition-colors hover:text-primary"
                aria-current={!categorySlug ? "page" : undefined}
              >
                Semua
              </Link>
              {visibleCategories.map((category) => {
                const isActive = category.slug === categorySlug;

                return (
                  <Link
                    key={category.slug}
                    href={buildCategoryHref(category.slug, query)}
                    className="shrink-0 pb-1.5 text-sm font-semibold leading-none text-muted-foreground transition-colors hover:text-primary"
                    aria-current={isActive ? "page" : undefined}
                  >
                    {category.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-background py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {listing.posts.length ? (
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
                {listing.posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : null}

            {!listing.posts.length ? (
              <Empty className="mt-8 border bg-secondary/35">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    {query ? <SearchIcon /> : <LibraryBigIcon />}
                  </EmptyMedia>
                  <EmptyTitle>
                    {hasActiveFilter
                      ? "Artikel tidak ditemukan"
                      : "Belum ada artikel publish"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {hasActiveFilter
                      ? "Coba kata kunci atau kategori lain, atau kembali ke daftar artikel terbaru."
                      : "Artikel yang sudah dipublish akan muncul di halaman ini."}
                  </EmptyDescription>
                </EmptyHeader>
                {hasActiveFilter ? (
                  <EmptyContent>
                    <Button variant="outline" asChild>
                      <Link href="/blog">Lihat semua artikel</Link>
                    </Button>
                  </EmptyContent>
                ) : null}
              </Empty>
            ) : null}

            <BlogPagination
              currentPage={listing.currentPage}
              totalPages={listing.totalPages}
              query={query}
              categorySlug={categorySlug}
            />
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}

const fallbackCategories = [
  { name: "UTBK", slug: "utbk" },
  { name: "UTUL UGM", slug: "utul-ugm" },
  { name: "SIMAK UI", slug: "simak-ui" },
  { name: "CPNS", slug: "cpns" },
];

function buildCategoryHref(categorySlug: string, query: string) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (categorySlug) {
    params.set("category", categorySlug);
  }

  const queryString = params.toString();

  return queryString ? `/blog?${queryString}` : "/blog";
}
