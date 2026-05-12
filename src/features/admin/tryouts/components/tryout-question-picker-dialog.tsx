"use client"

import { useEffect, useMemo, useState } from "react"
import type {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { SortableHeader } from "@/components/admin-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { cn } from "@/lib/utils"

import type { TryoutQuestionLookupOption } from "../queries"
import { previewText } from "../utils/tryout"

type TryoutQuestionPickerDialogProps = {
  open: boolean
  questions: TryoutQuestionLookupOption[]
  sectionTitle: string
  onOpenChange: (open: boolean) => void
  onAddQuestions: (questions: TryoutQuestionLookupOption[]) => void
}

const PAGE_SIZE_OPTIONS = ["10", "25", "50", "100", "-1"] as const
const ALL_PAGE_SIZE = "-1"

function getPaginationItems(
  pageCount: number,
  currentPage: number,
): Array<number | "ellipsis"> {
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

export function TryoutQuestionPickerDialog({
  open,
  questions,
  sectionTitle,
  onOpenChange,
  onAddQuestions,
}: TryoutQuestionPickerDialogProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [pageSizeValue, setPageSizeValue] = useState("10")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  useEffect(() => {
    if (open) {
      setRowSelection({})
      setGlobalFilter("")
      setPagination((current) => ({ ...current, pageIndex: 0 }))
    }
  }, [open, questions.length])

  const columns = useMemo<ColumnDef<TryoutQuestionLookupOption>[]>(
    () => [
      {
        id: "select",
        enableGlobalFilter: false,
        enableHiding: false,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(checked === true)
            }
            aria-label="Select visible questions"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
            aria-label={`Select question ${row.original.id}`}
          />
        ),
      },
      {
        id: "question",
        meta: { label: "Question" },
        accessorFn: (row) =>
          [
            row.title,
            row.content,
            row.topicName,
            row.type,
            row.difficulty,
            row.year,
          ]
            .filter(Boolean)
            .join(" "),
        header: ({ column }) => <SortableHeader column={column}>Question</SortableHeader>,
        cell: ({ row }) => {
          const question = row.original

          return (
            <div className="flex min-w-[22rem] max-w-[36rem] flex-col gap-1 whitespace-normal">
              <div className="font-medium">
                {previewText(question.title, `Question ${question.id}`)}
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {previewText(question.content)}
              </p>
            </div>
          )
        },
      },
      {
        accessorKey: "topicName",
        meta: { label: "Topic" },
        header: ({ column }) => <SortableHeader column={column}>Topic</SortableHeader>,
        cell: ({ row }) => (
          <span className="whitespace-normal text-sm">
            {row.original.topicName ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "type",
        meta: { label: "Type" },
        header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
        cell: ({ row }) => {
          const badge = getModelEnumBadgeMeta("questionType", row.original.type)

          return (
            <Badge variant="soft" className={badge.className}>
              {badge.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: "difficulty",
        meta: { label: "Difficulty" },
        header: ({ column }) => <SortableHeader column={column}>Difficulty</SortableHeader>,
        cell: ({ row }) => {
          const badge = getModelEnumBadgeMeta(
            "questionDifficulty",
            row.original.difficulty,
          )

          return (
            <Badge variant="soft" className={badge.className}>
              {badge.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: "points",
        meta: { label: "Point" },
        header: ({ column }) => <SortableHeader column={column}>Point</SortableHeader>,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{row.original.points}</span>
        ),
      },
      {
        accessorKey: "year",
        meta: { label: "Year" },
        header: ({ column }) => <SortableHeader column={column}>Year</SortableHeader>,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.year ?? "-"}
          </span>
        ),
      },
    ],
    [],
  )

  const pageSize =
    pageSizeValue === ALL_PAGE_SIZE ? Math.max(questions.length, 1) : Number(pageSizeValue)

  const table = useReactTable({
    data: questions,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize,
      },
      rowSelection,
    },
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: pagination.pageIndex, pageSize })
          : updater

      setPagination((current) => ({
        ...current,
        pageIndex: next.pageIndex,
      }))
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const selectedQuestions = table
    .getSelectedRowModel()
    .flatRows.map((row) => row.original)
  const filteredCount = table.getFilteredRowModel().rows.length
  const pageCount = Math.max(table.getPageCount(), 1)
  const currentPage = Math.min(table.getState().pagination.pageIndex + 1, pageCount)
  const pageItems = getPaginationItems(pageCount, currentPage)
  const leafColumnCount = table.getAllLeafColumns().length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden p-0">
        <div className="flex min-h-0 flex-col gap-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle>Add Questions</DialogTitle>
            <DialogDescription>
              Select published questions for {sectionTitle}. Search can match
              title, content, topic, type, difficulty, and year.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-col gap-4 p-4 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full lg:max-w-sm">
                <Input
                  value={globalFilter}
                  onChange={(event) => {
                    setGlobalFilter(event.target.value)
                    table.setPageIndex(0)
                  }}
                  placeholder="Search questions..."
                  aria-label="Search questions"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{filteredCount} available</Badge>
                <Badge variant="secondary">
                  {selectedQuestions.length} selected
                </Badge>
              </div>
            </div>

            <div className="min-h-0 overflow-hidden rounded-2xl border border-border/60">
              <div className="max-h-[48vh] overflow-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={cn(
                              "bg-background text-[0.64rem] uppercase tracking-[0.16em] text-muted-foreground",
                              header.column.id === "select" && "w-10",
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
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() ? "selected" : undefined}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                cell.column.id === "question" && "whitespace-normal",
                              )}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={leafColumnCount}
                          className="h-24 text-center text-sm text-muted-foreground"
                        >
                          No published questions match this section.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Field orientation="horizontal" className="w-fit">
                <FieldLabel htmlFor="select-picker-rows-per-page">Show</FieldLabel>
                <Select
                  value={pageSizeValue}
                  onValueChange={(value) => {
                    setPageSizeValue(value)
                    table.setPageIndex(0)
                  }}
                >
                  <SelectTrigger id="select-picker-rows-per-page" className="w-20">
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
                      aria-disabled={!table.getCanPreviousPage()}
                      tabIndex={!table.getCanPreviousPage() ? -1 : undefined}
                      className={cn(
                        !table.getCanPreviousPage() && "pointer-events-none opacity-50",
                      )}
                      onClick={(event) => {
                        event.preventDefault()

                        if (table.getCanPreviousPage()) {
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
                      aria-disabled={!table.getCanNextPage()}
                      tabIndex={!table.getCanNextPage() ? -1 : undefined}
                      className={cn(
                        !table.getCanNextPage() && "pointer-events-none opacity-50",
                      )}
                      onClick={(event) => {
                        event.preventDefault()

                        if (table.getCanNextPage()) {
                          table.nextPage()
                        }
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={selectedQuestions.length === 0}
              onClick={() => onAddQuestions(selectedQuestions)}
            >
              Add Selected
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
