import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type BlogPaginationProps = {
  currentPage: number;
  totalPages: number;
  query: string;
  categorySlug: string;
};

export function BlogPagination({
  currentPage,
  totalPages,
  query,
  categorySlug,
}: BlogPaginationProps) {
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="mt-10 flex justify-center">
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={buildBlogHref(
                Math.max(currentPage - 1, 1),
                query,
                categorySlug,
              )}
              text="Previous"
              aria-disabled={currentPage <= 1}
              tabIndex={currentPage <= 1 ? -1 : undefined}
              className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  href={buildBlogHref(page, query, categorySlug)}
                  size="icon"
                  isActive={page === currentPage}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href={buildBlogHref(
                Math.min(currentPage + 1, totalPages),
                query,
                categorySlug,
              )}
              text="Next"
              aria-disabled={currentPage >= totalPages}
              tabIndex={currentPage >= totalPages ? -1 : undefined}
              className={cn(
                currentPage >= totalPages && "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function buildBlogHref(page: number, query: string, categorySlug: string) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (categorySlug) {
    params.set("category", categorySlug);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString ? `/blog?${queryString}` : "/blog";
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}
