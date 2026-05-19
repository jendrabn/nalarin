import Image from "next/image";
import { CalendarDaysIcon, Clock3Icon, UserRoundIcon } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar, type SiteUser } from "@/components/site-navbar";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

import type {
  PublishedBlogPostDetails,
  PublishedBlogPostSummary,
} from "../queries";
import { formatBlogDate, isLocalImageUrl } from "../utils";
import { BlogCard } from "./blog-card";
import { BlogShareButton } from "./blog-share-button";

type BlogDetailPageProps = {
  user: SiteUser;
  post: PublishedBlogPostDetails;
  relatedPosts: PublishedBlogPostSummary[];
};

export function BlogDetailPage({ user, post, relatedPosts }: BlogDetailPageProps) {
  const categoryLabel = post.categoryName ?? "Umum";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={user} />
      <main>
        <article>
          <section className="border-b bg-secondary/35">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
              <Badge
                variant="outline"
                className="h-7 rounded-full border-primary/25 bg-primary/10 px-3 font-semibold text-primary"
              >
                {categoryLabel}
              </Badge>
              <PageHeader
                className="mb-0"
                title={post.title}
                subtitle={post.excerpt ?? undefined}
                actions={<BlogShareButton title={post.title} text={post.excerpt} />}
              />
              <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDaysIcon className="size-4" />
                    {formatBlogDate(post.publishedAt)}
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <UserRoundIcon className="size-4" />
                    <span className="truncate">
                      {post.authorName ?? "Tim Nalarin"}
                    </span>
                  </span>
                  {post.readTimeMinutes ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock3Icon className="size-4" />
                      {post.readTimeMinutes} menit
                    </span>
                  ) : null}
                </div>
              </div>
              <figure className="flex flex-col gap-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-secondary shadow-xl shadow-primary/10 ring-1 ring-border/70">
                  {post.thumbnailUrl && isLocalImageUrl(post.thumbnailUrl) ? (
                    <Image
                      src={post.thumbnailUrl}
                      alt=""
                      fill
                      sizes="(max-width: 896px) 100vw, 768px"
                      className="object-cover"
                      preload
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-end bg-[linear-gradient(135deg,var(--secondary),var(--accent))] p-6">
                      <div className="grid size-20 place-items-center rounded-lg bg-background/80 text-3xl font-black text-primary ring-1 ring-border backdrop-blur">
                        {post.title.slice(0, 1).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
                {post.thumbnailCaption ? (
                  <figcaption className="text-center text-sm leading-6 text-muted-foreground">
                    {post.thumbnailCaption}
                  </figcaption>
                ) : null}
              </figure>
            </div>
          </section>

          <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div
              className="min-w-0 text-base leading-8 text-foreground/90 sm:text-lg sm:leading-9 [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_blockquote]:my-7 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-secondary/60 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:text-muted-foreground [&_h2]:mt-11 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:tracking-normal [&_h3]:mt-9 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_img]:my-8 [&_img]:rounded-lg [&_img]:ring-1 [&_img]:ring-border [&_li]:my-2 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-6 [&_strong]:font-semibold [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        {relatedPosts.length ? (
          <section className="border-t bg-secondary/45 py-12 sm:py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  Artikel Terkait
                </h2>
              </div>
              <div className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
