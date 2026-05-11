"use client"

import { useEffect, useState } from "react"
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
  SlidersHorizontalIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
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

type AdminDataTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  searchPlaceholder: string
  emptyMessage: string
  defaultColumnVisibility?: VisibilityState
  defaultPageSize?: string
}

const PAGE_SIZE_OPTIONS = ["10", "25", "50", "100", "-1"] as const
const DEFAULT_PAGE_SIZE = "25"
const ALL_PAGE_SIZE = "-1"

export function SortableHeader<TData>({
  column,
  children,
}: {
  column: Column<TData>
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

function getPaginationItems(pageCount: number, currentPage: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", pageCount]
  }

  if (currentPage >= pageCount - 2) {
    return [1, "ellipsis", pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", pageCount]
}

export function AdminDataTable<TData>({
  data,
  columns,
  searchPlaceholder,
  emptyMessage,
  defaultColumnVisibility = {},
  defaultPageSize = DEFAULT_PAGE_SIZE,
}: AdminDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(defaultColumnVisibility)
  const [globalFilter, setGlobalFilter] = useState("")
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSizeValue, setPageSizeValue] = useState(defaultPageSize)

  const pageSize =
    pageSizeValue === ALL_PAGE_SIZE ? Math.max(data.length, 1) : Number(pageSizeValue)

  useEffect(() => {
    setPageIndex(0)
  }, [data.length])

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
        typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater

      setPageIndex(next.pageIndex)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const pageCount = Math.max(table.getPageCount(), 1)
  const currentPage = Math.min(pageIndex + 1, pageCount)
  const pageItems = getPaginationItems(pageCount, currentPage)
  const canPreviousPage = table.getCanPreviousPage()
  const canNextPage = table.getCanNextPage()
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())

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
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="sm:ml-auto">
              <SlidersHorizontalIcon data-icon="inline-start" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {hideableColumns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(checked) =>
                  column.toggleVisibility(checked === true)
                }
              >
                {column.columnDef.meta?.label ?? column.id}
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
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                      className={cn(cell.column.id === "actions" && "text-right")}
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
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Field orientation="horizontal" className="w-fit">
          <FieldLabel htmlFor="select-rows-per-page">Show</FieldLabel>
          <Select
            value={pageSizeValue}
            onValueChange={(value) => {
              setPageSizeValue(value)
              setPageIndex(0)
            }}
          >
            <SelectTrigger id="select-rows-per-page" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {PAGE_SIZE_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value === ALL_PAGE_SIZE ? "All" : value}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Previous"
                aria-disabled={!canPreviousPage}
                tabIndex={!canPreviousPage ? -1 : undefined}
                className={cn(!canPreviousPage && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  event.preventDefault()

                  if (canPreviousPage) {
                    table.previousPage()
                  }
                }}
              />
            </PaginationItem>

            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    size="icon"
                    isActive={item === currentPage}
                    aria-label={`Go to page ${item}`}
                    aria-current={item === currentPage ? "page" : undefined}
                    onClick={(event) => {
                      event.preventDefault()
                      table.setPageIndex(item - 1)
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                text="Next"
                aria-disabled={!canNextPage}
                tabIndex={!canNextPage ? -1 : undefined}
                className={cn(!canNextPage && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  event.preventDefault()

                  if (canNextPage) {
                    table.nextPage()
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
