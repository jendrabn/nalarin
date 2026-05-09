"use client"

import { useEffect, useMemo, useState } from "react"
import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
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
  SparklesIcon,
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

import {
  questionColumnLabels,
  questionDifficultyLabels,
  questionStatusLabels,
  questionTypeLabels,
  type QuestionDifficulty,
  type QuestionRow,
  type QuestionStatus,
  type QuestionType,
} from "../constants"
import { previewQuestionContent } from "../utils/question"

type QuestionsTableProps = {
  data: QuestionRow[]
  onEdit: (question: QuestionRow) => void
  onGenerateExplanation: (question: QuestionRow) => void
  onDelete: (question: QuestionRow) => void
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  id: false,
  topic: true,
  createdAt: false,
  updatedAt: false,
}

function getQuestionColumnLabel(columnId: string) {
  switch (columnId) {
    case "examTypeName":
      return questionColumnLabels.examType
    case "subjectName":
      return questionColumnLabels.subject
    case "topicName":
      return questionColumnLabels.topic
    case "type":
      return questionColumnLabels.type
    case "difficulty":
      return questionColumnLabels.difficulty
    case "title":
      return questionColumnLabels.title
    case "status":
      return questionColumnLabels.status
    case "points":
      return questionColumnLabels.points
    case "year":
      return questionColumnLabels.year
    case "optionCount":
      return questionColumnLabels.optionCount
    case "createdAt":
      return questionColumnLabels.createdAt
    case "updatedAt":
      return questionColumnLabels.updatedAt
    case "id":
      return questionColumnLabels.id
    default:
      return columnId
  }
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function getQuestionStatusVariant(status: QuestionStatus) {
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
  column: Column<QuestionRow>
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

function QuestionsPagination({
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
      <Button type="button" variant="outline-primary" size="icon-sm" className="rounded-full border-primary/20" onClick={onFirstPage} disabled={!canPreviousPage} aria-label="First page">
        <ChevronsLeftIcon />
      </Button>
      <Button type="button" variant="outline-primary" size="icon-sm" className="rounded-full border-primary/20" onClick={onPreviousPage} disabled={!canPreviousPage} aria-label="Previous page">
        <ChevronLeftIcon />
      </Button>

      <div className="min-w-16 px-2 text-center text-base font-medium text-foreground tabular-nums">
        {Math.min(pageIndex + 1, pageCount)} / {pageCount}
      </div>

      <Button type="button" variant="outline-primary" size="icon-sm" className="rounded-full border-primary/20" onClick={onNextPage} disabled={!canNextPage} aria-label="Next page">
        <ChevronRightIcon />
      </Button>
      <Button type="button" variant="outline-primary" size="icon-sm" className="rounded-full border-primary/20" onClick={onLastPage} disabled={!canNextPage} aria-label="Last page">
        <ChevronsRightIcon />
      </Button>
    </div>
  )
}

function createColumns({
  onEdit,
  onGenerateExplanation,
  onDelete,
}: {
  onEdit: (question: QuestionRow) => void
  onGenerateExplanation: (question: QuestionRow) => void
  onDelete: (question: QuestionRow) => void
}): ColumnDef<QuestionRow>[] {
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
        <SortableHeader column={column}>{questionColumnLabels.title}</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">
            {row.original.title || "Untitled question"}
          </span>
          <p className="line-clamp-2 max-w-[34rem] whitespace-normal text-sm text-muted-foreground">
            {previewQuestionContent(row.original.content)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "examTypeName",
      header: ({ column }) => (
        <SortableHeader column={column}>{questionColumnLabels.examType}</SortableHeader>
      ),
      cell: ({ row }) => <Badge variant="outline">{row.original.examTypeName}</Badge>,
    },
    {
      accessorKey: "subjectName",
      header: ({ column }) => (
        <SortableHeader column={column}>{questionColumnLabels.subject}</SortableHeader>
      ),
      cell: ({ row }) => <span>{row.original.subjectName}</span>,
    },
    {
      accessorKey: "topicName",
      header: ({ column }) => (
        <SortableHeader column={column}>{questionColumnLabels.topic}</SortableHeader>
      ),
      cell: ({ row }) =>
        row.original.topicName ? (
          <Badge variant="secondary">{row.original.topicName}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <SortableHeader column={column}>{questionColumnLabels.type}</SortableHeader>
      ),
      cell: ({ row }) => (
        <span>{questionTypeLabels[row.original.type as QuestionType]}</span>
      ),
    },
    {
      accessorKey: "difficulty",
      header: ({ column }) => (
        <SortableHeader column={column}>{questionColumnLabels.difficulty}</SortableHeader>
      ),
      cell: ({ row }) => (
        <Badge variant="outline">
          {questionDifficultyLabels[row.original.difficulty as QuestionDifficulty]}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>{questionColumnLabels.status}</SortableHeader>
      ),
      cell: ({ row }) => (
        <Badge variant={getQuestionStatusVariant(row.original.status)}>
          {questionStatusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "points",
      header: ({ column }) => (
        <SortableHeader column={column}>{questionColumnLabels.points}</SortableHeader>
      ),
      cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.points}</span>,
    },
    {
      accessorKey: "year",
      header: ({ column }) => (
        <SortableHeader column={column}>{questionColumnLabels.year}</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.year ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "optionCount",
      header: ({ column }) => (
        <SortableHeader column={column}>{questionColumnLabels.optionCount}</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">{row.original.optionCount}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>{questionColumnLabels.createdAt}</SortableHeader>
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
        <SortableHeader column={column}>{questionColumnLabels.updatedAt}</SortableHeader>
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
                aria-label={`Open actions for ${row.original.title || "question"}`}
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <PencilLineIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerateExplanation(row.original)}>
                <SparklesIcon />
                AI Explanation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
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

export function QuestionsTable({
  data,
  onEdit,
  onGenerateExplanation,
  onDelete,
}: QuestionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_COLUMN_VISIBILITY,
  )
  const [globalFilter, setGlobalFilter] = useState("")
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSizeValue, setPageSizeValue] = useState("10")
  const pageSize = pageSizeValue === "-1" ? Math.max(data.length, 1) : Number(pageSizeValue)

  useEffect(() => {
    setPageIndex(0)
  }, [data.length])

  const columns = useMemo(
    () =>
      createColumns({
        onEdit,
        onGenerateExplanation,
        onDelete,
      }),
    [onDelete, onEdit, onGenerateExplanation],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    globalFilterFn: "includesString",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
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
            placeholder="Search questions..."
            aria-label="Search questions"
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
                  {getQuestionColumnLabel(column.id)}
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
                      header.column.id === "examTypeName" && "min-w-[11rem]",
                      header.column.id === "subjectName" && "min-w-[11rem]",
                      header.column.id === "topicName" && "min-w-[10rem]",
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
                      className={cn(
                        cell.column.id === "actions" && "text-right",
                        cell.column.id === "optionCount" && "text-right",
                        cell.column.id === "points" && "text-right",
                        cell.column.id === "year" && "text-right",
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
                  No questions found.
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

        <QuestionsPagination
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
