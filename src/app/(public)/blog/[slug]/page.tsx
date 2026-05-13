import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/session";
import { BlogDetailPage } from "@/features/blog/components/blog-detail-page";
import {
  getPublishedBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/features/blog/queries";
import {
  absoluteUrl,
  jsonLdScript,
  stripHtml,
  truncateText,
} from "@/features/blog/utils";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Artikel tidak ditemukan",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    getArticleDescription(post);
  const image = post.thumbnailUrl ? absoluteUrl(post.thumbnailUrl) : undefined;

  return {
    title: post.seoTitle ?? post.title,
    description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    authors: [{ name: post.authorName ?? "Tim Nalarin" }],
    openGraph: {
      title: post.seoTitle ?? post.title,
      description,
      url: `/blog/${post.slug}`,
      siteName: "Nalarin.id",
      type: "article",
      locale: "id_ID",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName ?? "Tim Nalarin"],
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle ?? post.title,
      description,
      images: image ? [image] : undefined,
    },
    keywords: post.tags ?? undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function Page({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [user, relatedPosts] = await Promise.all([
    getCurrentUser(),
    getRelatedBlogPosts(post),
  ]);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: getArticleDescription(post),
    image: post.thumbnailUrl ? [absoluteUrl(post.thumbnailUrl)] : undefined,
    author: {
      "@type": "Person",
      name: post.authorName ?? "Tim Nalarin",
    },
    publisher: {
      "@type": "Organization",
      name: "Nalarin.id",
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/favicon.ico"),
      },
    },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    articleSection: post.categoryName ?? "Blog",
    keywords: post.tags ?? undefined,
    inLanguage: "id-ID",
    url: absoluteUrl(`/blog/${post.slug}`),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: absoluteUrl("/blog"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: absoluteUrl(`/blog/${post.slug}`),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([articleJsonLd, breadcrumbJsonLd]),
        }}
      />
      <BlogDetailPage user={user} post={post} relatedPosts={relatedPosts} />
    </>
  );
}

function getArticleDescription(post: Awaited<ReturnType<typeof getPublishedBlogPostBySlug>>) {
  const metaDescription = post.metaDescription?.trim();
  const excerpt = post.excerpt?.trim();
  const contentFallback = buildContentDescription(post.content, post.title);

  if (metaDescription && metaDescription !== post.title && metaDescription.length >= 80) {
    return metaDescription;
  }

  if (excerpt && excerpt !== post.title && excerpt.length >= 80) {
    return excerpt;
  }

  if (contentFallback !== post.title && contentFallback.length >= 80) {
    return contentFallback;
  }

  const topic = (post.categoryName ?? "topik belajar").toLowerCase();

  return `Baca ${post.title} di Nalarin. Dapatkan ringkasan, pembahasan, dan catatan penting seputar ${topic} untuk belajar yang lebih terarah.`;
}

function buildContentDescription(content: string, title: string) {
  const firstParagraph = extractFirstParagraph(content);

  if (firstParagraph && firstParagraph !== title) {
    return truncateText(firstParagraph, 155);
  }

  const plainText = stripHtml(content)
    .replace(new RegExp(`^${escapeRegExp(title)}\\s*`, "i"), "")
    .trim();

  return truncateText(plainText || title, 155);
}

function extractFirstParagraph(content: string) {
  const match = content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);

  if (!match) {
    return "";
  }

  return stripHtml(match[1]).trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
