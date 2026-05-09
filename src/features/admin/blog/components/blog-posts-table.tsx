"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import type {
  Column,
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  EllipsisVerticalIcon,
  PencilLineIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { blogPostColumnLabels, blogPostStatusLabels, type BlogPostStatus } from "../constants"
import type { BlogPostRow } from "../queries/blog-posts"

type BlogPostsTableProps = {
  data: BlogPostRow[]
  onEdit: (post: BlogPostRow) => void
  onDelete: (post: BlogPostRow) => void
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  id: false,
  slug: false,
  thumbnailUrl: false,
  publishedAt: false,
  createdAt: false,
  updatedAt: false,
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function getBlogPostColumnLabel(columnId: string) {
  switch (columnId) {
    case "title":
      return blogPostColumnLabels.title
    case "categoryName":
      return blogPostColumnLabels.category
    case "status":
      return blogPostColumnLabels.status
    case "excerpt":
      return blogPostColumnLabels.excerpt
    case "readTimeMinutes":
      return blogPostColumnLabels.readTimeMinutes
    case "viewCount":
      return blogPostColumnLabels.viewCount
    case "thumbnailUrl":
      return blogPostColumnLabels.thumbnail
    case "publishedAt":
      return blogPostColumnLabels.publishedAt
    case "createdAt":
      return blogPostColumnLabels.createdAt
    case "updatedAt":
      return blogPostColumnLabels.updatedAt
    case "slug":
      return blogPostColumnLabels.slug
    case "id":
      return blogPostColumnLabels.id
    default:
      return columnId
  }
}

function getBlogPostStatusVariant(status: BlogPostStatus) {
  if (status === "published") {
    return "default" as const
  }

  if (status === "archived") {
    return "outline" as const
  }

  return "secondary" as const
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<BlogPostRow>
  children: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 px-2 uppercase tracking-[0.16em]"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      {column.getIsSorted() === "asc" ? (
        <ArrowUpIcon data-icon="inline-end" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDownIcon data-icon="inline-end" />
      ) : (
        <ArrowUpDownIcon data-icon="inline-end" />
      )}
    </Button>
  )
}

function BlogPostsPagination({
  pageIndex,
  pageCount,
  canPreviousPage,
  canNextPage,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
}: {
  pageIndex: number
  pageCount: number
  canPreviousPage: boolean
  canNextPage: boolean
  onFirstPage: () => void
  onPreviousPage: () => void
  onNextPage: () => void
  onLastPage: () => void
}) {
  return (
    <div className="ml-auto flex items-center gap-2 rounded-2xl border border-border/60 bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
      <Button
        type="button"
        variant="outline-primary"
        size="icon-sm"
        className="rounded-full border-primary/20"
        onClick={onFirstPage}
        disabled={!canPreviousPage}
        aria-label="First page"
      >
        <ChevronsLeftIcon />
      </Button>
      <Button
        type="button"
        variant="outline-primary"
        size="icon-sm"
        className="rounded-full border-primary/20"
        onClick={onPreviousPage}
        disabled={!canPreviousPage}
        aria-label="Previous page"
      >
        <ChevronLeftIcon />
      </Button>

      <div className="min-w-16 px-2 text-center text-base font-medium text-foreground tabular-nums">
        {Math.min(pageIndex + 1, pageCount)} / {pageCount}
      </div>

      <Button
        type="button"
        variant="outline-primary"
        size="icon-sm"
        className="rounded-full border-primary/20"
        onClick={onNextPage}
        disabled={!canNextPage}
        aria-label="Next page"
      >
        <ChevronRightIcon />
      </Button>
      <Button
        type="button"
        variant="outline-primary"
        size="icon-sm"
        className="rounded-full border-primary/20"
        onClick={onLastPage}
        disabled={!canNextPage}
        aria-label="Last page"
      >
        <ChevronsRightIcon />
      </Button>
    </div>
  )
}

function createColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (post: BlogPostRow) => void
  onDelete: (post: BlogPostRow) => void
}): ColumnDef<BlogPostRow>[] {
  return [
    {
      accessorKey: "id",
      header: () => (
        <span className="flex h-8 w-full items-center justify-center px-2 uppercase tracking-[0.16em] text-sm">
          ID
        </span>
      ),
      enableHiding: true,
      cell: ({ row }) => <span className="block w-full text-center">{row.original.id}</span>,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <SortableHeader column={column}>{blogPostColumnLabels.title}</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">{row.original.title}</span>
          {row.original.excerpt ? (
            <p className="line-clamp-2 max-w-[32rem] whitespace-normal text-sm text-muted-foreground">
              {row.original.excerpt}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "slug",
      header: ({ column }) => (
        <SortableHeader column={column}>{blogPostColumnLabels.slug}</SortableHeader>
      ),
      cell: ({ row }) => <span>{row.original.slug}</span>,
    },
    {
      accessorKey: "categoryName",
      header: ({ column }) => (
        <SortableHeader column={column}>{blogPostColumnLabels.category}</SortableHeader>
      ),
      cell: ({ row }) =>
        row.original.categoryName ? (
          <Badge variant="outline">{row.original.categoryName}</Badge>
        ) : (
          <span className="text-muted-foreground">Uncategorized</span>
        ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>{blogPostColumnLabels.status}</SortableHeader>
      ),
      cell: ({ row }) => (
        <Badge variant={getBlogPostStatusVariant(row.original.status)}>
          {blogPostStatusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "thumbnailUrl",
      header: ({ column }) => (
        <SortableHeader column={column}>{blogPostColumnLabels.thumbnail}</SortableHeader>
      ),
      cell: ({ row }) =>
        row.original.thumbnailUrl ? (
          <div className="relative h-12 w-20 overflow-hidden rounded-lg border border-border/60">
            <Image
              src={row.original.thumbnailUrl}
              alt={row.original.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <span className="text-muted-foreground">No image</span>
        ),
    },
    {
      accessorKey: "readTimeMinutes",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {blogPostColumnLabels.readTimeMinutes}
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.original.readTimeMinutes ? `${row.original.readTimeMinutes} min` : "-"}
        </span>
      ),
    },
    {
      accessorKey: "viewCount",
      header: ({ column }) => (
        <SortableHeader column={column}>{blogPostColumnLabels.viewCount}</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.original.viewCount.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      accessorKey: "publishedAt",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {blogPostColumnLabels.publishedAt}
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.publishedAt ? formatDateTime(row.original.publishedAt) : "-"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {blogPostColumnLabels.createdAt}
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {blogPostColumnLabels.updatedAt}
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => null,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label={`Open actions for ${row.original.title}`}
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <PencilLineIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(row.original)}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
}

export function BlogPostsTable({ data, onEdit, onDelete }: BlogPostsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_COLUMN_VISIBILITY,
  )
  const [globalFilter, setGlobalFilter] = useState("")
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSizeValue, setPageSizeValue] = useState("10")
  const pageSize =
    pageSizeValue === "-1" ? Math.max(data.length, 1) : Number(pageSizeValue)

  useEffect(() => {
    setPageIndex(0)
  }, [data.length])

  const columns = useMemo(
    () => createColumns({ onEdit, onDelete }),
    [onEdit, onDelete],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    globalFilterFn: "includesString",
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater

      setPageIndex(next.pageIndex)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableHiding: true,
  })

  const pageCount = Math.max(table.getPageCount(), 1)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            value={globalFilter ?? ""}
            onChange={(event) => {
              setGlobalFilter(event.target.value)
              setPageIndex(0)
            }}
            placeholder="Search posts..."
            aria-label="Search posts"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline">
              <SlidersHorizontalIcon data-icon="inline-start" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) =>
                    column.toggleVisibility(checked === true)
                  }
                >
                  {getBlogPostColumnLabel(column.id)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "uppercase tracking-[0.16em] text-[0.64rem] text-muted-foreground",
                      header.column.id === "actions" && "w-16 text-right",
                      header.column.id === "title" && "min-w-[20rem]",
                      header.column.id === "thumbnailUrl" && "w-28",
                      header.column.id === "viewCount" && "w-[10rem] text-right",
                      header.column.id === "readTimeMinutes" && "w-[8rem] text-right",
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === "actions" && "text-right",
                        cell.column.id === "viewCount" && "text-right",
                        cell.column.id === "readTimeMinutes" && "text-right",
                        cell.column.id === "excerpt" &&
                          "whitespace-normal align-top",
                        cell.column.id === "thumbnailUrl" &&
                          "align-middle whitespace-normal",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No blog posts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select
            value={pageSizeValue}
            onValueChange={(value) => {
              setPageSizeValue(value)
              setPageIndex(0)
            }}
          >
            <SelectTrigger className="w-[9rem]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="-1">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <BlogPostsPagination
          pageIndex={pageIndex}
          pageCount={pageCount}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onFirstPage={() => table.setPageIndex(0)}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
          onLastPage={() => table.setPageIndex(pageCount - 1)}
        />
      </div>
    </div>
  )
}
