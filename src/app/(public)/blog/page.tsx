import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/services/session";
import { BlogIndexPage } from "@/features/blog/components/blog-index-page";
import {
  getPublishedBlogCategories,
  getPublishedBlogListing,
} from "@/features/blog/queries";
import {
  absoluteUrl,
  getSingleSearchParam,
  jsonLdScript,
  normalizePageParam,
} from "@/features/blog/utils";

const BLOG_DESCRIPTION =
  "Artikel Nalarin tentang strategi belajar, pembahasan soal, dan panduan tryout untuk UTBK, UTUL UGM, SIMAK UI, dan CPNS.";
const BLOG_KEYWORDS = [
  "blog belajar UTBK",
  "strategi belajar",
  "pembahasan soal",
  "tryout UTBK",
  "SIMAK UI",
  "UTUL UGM",
  "CPNS",
  "Nalarin.id",
];

type BlogPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = getSingleSearchParam(resolvedSearchParams.q);
  const categorySlug = getSingleSearchParam(resolvedSearchParams.category);
  const page = normalizePageParam(resolvedSearchParams.page);

  const isFiltered = Boolean(query || categorySlug);
  const isPaginated = page > 1 && !isFiltered;

  let categoryName: string | null = null;

  if (categorySlug) {
    const categories = await getPublishedBlogCategories();
    categoryName =
      categories.find((category) => category.slug === categorySlug)?.name ??
      humanizeSlug(categorySlug);
  }

  const title = query
    ? `Hasil pencarian: ${query}`
    : categoryName
      ? `Kategori ${categoryName}`
      : isPaginated
        ? `Blog Belajar - Halaman ${page}`
        : "Blog Belajar";

  const description = query
    ? `Menampilkan artikel blog yang cocok dengan pencarian "${query}".`
    : categoryName
      ? `Kumpulan artikel blog pada kategori ${categoryName}.`
      : isPaginated
        ? `Halaman ${page} daftar artikel Nalarin tentang strategi belajar, UTBK, UTUL UGM, SIMAK UI, CPNS, dan tryout.`
        : BLOG_DESCRIPTION;

  const canonical = isFiltered
    ? "/blog"
    : isPaginated
      ? `/blog?page=${page}`
      : "/blog";

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Nalarin.id",
      type: "website",
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords: [
      ...(query ? [query] : []),
      ...(categoryName ? [categoryName] : []),
      ...BLOG_KEYWORDS,
    ],
    robots: {
      index: !isFiltered,
      follow: true,
      googleBot: {
        index: !isFiltered,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function Page({ searchParams }: BlogPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = getSingleSearchParam(resolvedSearchParams.q);
  const categorySlug = getSingleSearchParam(resolvedSearchParams.category);
  const page = normalizePageParam(resolvedSearchParams.page);
  const [user, listing] = await Promise.all([
    getCurrentUser(),
    getPublishedBlogListing({ page, query, categorySlug }),
  ]);
  const blogJsonLd =
    !query && !categorySlug
      ? buildBlogListingJsonLd({
          page,
          listing,
        })
      : null;

  return (
    <>
      {blogJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(blogJsonLd) }}
        />
      ) : null}
      <BlogIndexPage
        user={user}
        listing={listing}
        query={query}
        categorySlug={categorySlug}
      />
    </>
  );
}

function buildBlogListingJsonLd({
  page,
  listing,
}: {
  page: number;
  listing: Awaited<ReturnType<typeof getPublishedBlogListing>>;
}) {
  const basePath = page > 1 ? `/blog?page=${page}` : "/blog";
  const itemOffset = (page - 1) * listing.pageSize;

    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Blog Belajar Nalarin",
      description: BLOG_DESCRIPTION,
      url: absoluteUrl(basePath),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: listing.posts.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: listing.posts.map((post, index) => ({
        "@type": "ListItem",
        position: itemOffset + index + 1,
        url: absoluteUrl(`/blog/${post.slug}`),
        name: post.title,
        image: post.thumbnailUrl ? absoluteUrl(post.thumbnailUrl) : undefined,
      })),
    },
  };
}

function humanizeSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
