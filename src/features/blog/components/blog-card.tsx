import Image from "next/image";
import Link from "next/link";
import { CalendarDaysIcon, UserRoundIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { PublishedBlogPostSummary } from "../queries";
import { formatBlogDate, isLocalImageUrl } from "../utils";

type BlogCardProps = {
  post: PublishedBlogPostSummary;
};

export function BlogCard({ post }: BlogCardProps) {
  const titleId = `blog-card-title-${post.id}`;

  return (
    <Card
      role="article"
      aria-labelledby={titleId}
      className="h-full gap-0 overflow-visible border-transparent bg-transparent py-0 text-foreground shadow-none ring-0 transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group flex items-center gap-3 rounded-lg outline-none sm:block"
        aria-label={`Baca artikel ${post.title}`}
      >
        <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-secondary shadow-sm shadow-primary/5 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-primary/15 group-focus-visible:shadow-xl group-focus-visible:shadow-primary/15 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background min-[380px]:w-32 sm:aspect-[16/9] sm:w-auto motion-reduce:transition-none">
          <BlogThumbnail post={post} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90 group-focus-visible:opacity-90 motion-reduce:transition-none"
          />
          {post.categoryName ? (
            <Badge
              variant="outline"
              className="pointer-events-none absolute top-2 left-2 h-5 max-w-[calc(100%-1rem)] border-primary/15 bg-background/90 px-2 text-[10px] text-primary shadow-sm shadow-primary/10 backdrop-blur-md sm:top-3 sm:left-3 sm:text-xs"
            >
              <span className="truncate">{post.categoryName}</span>
            </Badge>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col sm:flex-none">
          <CardHeader className="gap-0 px-0 pt-0 pb-0 sm:pt-3">
            <CardTitle
              id={titleId}
              className="line-clamp-2 text-balance text-sm leading-snug font-semibold tracking-normal transition-colors group-hover:text-primary group-focus-visible:text-primary min-[380px]:text-base sm:text-lg motion-reduce:transition-none"
            >
              {post.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-0 pt-2 pb-0 text-xs text-muted-foreground sm:text-sm">
            <time
              dateTime={post.publishedAt?.toISOString()}
              className="inline-flex min-w-0 items-center gap-1.5"
            >
              <CalendarDaysIcon aria-hidden="true" className="size-3.5" />
              {formatBlogDate(post.publishedAt)}
            </time>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <UserRoundIcon aria-hidden="true" className="size-3.5" />
              <span className="truncate">
                {post.authorName ?? "Tim Nalarin"}
              </span>
            </span>
          </CardContent>
          <div
            aria-hidden="true"
            className="mt-2 h-px w-5 bg-primary/45 opacity-60 transition-all duration-300 group-hover:w-10 group-hover:opacity-100 group-focus-visible:w-10 group-focus-visible:opacity-100 sm:mt-3 motion-reduce:transition-none"
          />
        </div>
      </Link>
    </Card>
  );
}

function BlogThumbnail({
  post,
}: {
  post: PublishedBlogPostSummary;
}) {
  if (post.thumbnailUrl && isLocalImageUrl(post.thumbnailUrl)) {
    return (
      <Image
        src={post.thumbnailUrl}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition duration-500 group-hover:scale-[1.035] group-hover:saturate-110 group-hover:contrast-105 group-focus-visible:scale-[1.035] group-focus-visible:saturate-110 group-focus-visible:contrast-105 motion-reduce:transform-none motion-reduce:transition-none"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-end bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_16%,var(--secondary)),var(--accent))] p-4"
    >
      <div className="grid size-14 place-items-center rounded-lg bg-background/85 text-xl font-black text-primary ring-1 ring-border backdrop-blur">
        {post.title.slice(0, 1).toUpperCase()}
      </div>
    </div>
  );
}
