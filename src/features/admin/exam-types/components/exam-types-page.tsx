"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVerticalIcon, PencilLineIcon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
import { TaxonomyLogo } from "@/components/taxonomy-logo"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { updateExamTypeAction } from "../actions"
import type { ExamTypeFormValues } from "../schemas"
import type { ExamTypeRow } from "../queries"
import { ExamTypeFormDialog } from "./exam-type-form-dialog"

type ExamTypesPageProps = {
  examTypes: ExamTypeRow[]
  defaultEditExamType?: ExamTypeRow | null
  closeDestination?: string
}

const DEFAULT_COLUMN_VISIBILITY = {
  logo: false,
  createdAt: false,
  updatedAt: false,
}

function TableColumnHeader({ children }: { children: string }) {
  return (
    <span className="-ml-2 inline-flex h-8 items-center px-2 text-[0.8rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  )
}

function DescriptionCell({ description }: { description?: string | null }) {
  const value = description?.trim()

  if (!value) {
    return <span className="block w-full truncate text-sm text-muted-foreground">-</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={value}
          className="block w-full max-w-[28rem] truncate text-sm text-muted-foreground outline-none"
        >
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-sm">
        <p className="whitespace-pre-wrap text-left">{value}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function formatDateTimeLocal(value?: Date | null) {
  if (!value) {
    return ""
  }

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  const hour = String(value.getHours()).padStart(2, "0")
  const minute = String(value.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hour}:${minute}`
}

export function ExamTypesPage({
  examTypes,
  defaultEditExamType = null,
  closeDestination,
}: ExamTypesPageProps) {
  const router = useRouter()
  const [editingExamType, setEditingExamType] = useState<ExamTypeRow | null>(
    defaultEditExamType,
  )

  const handleUpdate = async (values: ExamTypeFormValues) =>
    updateExamTypeAction(editingExamType?.id ?? 0, values)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exam Types"
        subtitle="Manage exam types for the admin area."
        actions={null}
      />

      <AdminDataTable
        data={examTypes}
        searchPlaceholder="Search exam types..."
        emptyMessage="No exam types found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        columns={[
          {
            accessorKey: "name",
            meta: { label: "Name" },
            header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
            cell: ({ row }) => (
              <span className="truncate font-medium text-foreground">{row.original.name}</span>
            ),
          },
          {
            accessorKey: "description",
            meta: { label: "Description" },
            header: ({ column }) => <SortableHeader column={column}>Description</SortableHeader>,
            cell: ({ row }) => <DescriptionCell description={row.original.description} />,
          },
          {
            id: "logo",
            meta: { label: "Logo" },
            header: () => <TableColumnHeader>Logo</TableColumnHeader>,
            enableSorting: false,
            enableHiding: true,
            cell: ({ row }) => (
              <div className="flex justify-center">
                <TaxonomyLogo src={row.original.logoUrl} alt={row.original.name} />
              </div>
            ),
          },
          {
            accessorKey: "subjectCount",
            meta: { label: "Subjects" },
            header: ({ column }) => <SortableHeader column={column}>Subjects</SortableHeader>,
            cell: ({ row }) => <span className="tabular-nums">{row.original.subjectCount}</span>,
          },
          {
            accessorKey: "topicCount",
            meta: { label: "Topics" },
            header: ({ column }) => <SortableHeader column={column}>Topics</SortableHeader>,
            cell: ({ row }) => <span className="tabular-nums">{row.original.topicCount}</span>,
          },
          {
            accessorKey: "questionCount",
            meta: { label: "Questions" },
            header: ({ column }) => <SortableHeader column={column}>Questions</SortableHeader>,
            cell: ({ row }) => <span className="tabular-nums">{row.original.questionCount}</span>,
          },
          {
            accessorKey: "createdAt",
            meta: { label: "Created At" },
            header: ({ column }) => <SortableHeader column={column}>Created At</SortableHeader>,
            cell: ({ row }) => (
              <span className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(row.original.createdAt)}
              </span>
            ),
          },
          {
            accessorKey: "updatedAt",
            meta: { label: "Updated At" },
            header: ({ column }) => <SortableHeader column={column}>Updated At</SortableHeader>,
            cell: ({ row }) => (
              <span className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(row.original.updatedAt)}
              </span>
            ),
          },
          {
            id: "actions",
            header: () => null,
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => (
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full"
                      aria-label={`Open actions for ${row.original.name}`}
                    >
                      <EllipsisVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setEditingExamType(row.original)}>
                      <PencilLineIcon />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
        ]}
      />

      <ExamTypeFormDialog
        open={Boolean(editingExamType)}
        mode="edit"
        title="Edit Exam Type"
        description="Update the exam type details, schedule, and information content."
        submitLabel="Save changes"
        initialValues={
          editingExamType
            ? {
                name: editingExamType.name,
                description: editingExamType.description ?? "",
                logoUrl: editingExamType.logoUrl ?? "",
                coverUrl: editingExamType.coverUrl ?? "",
                packageIsActive: editingExamType.packageIsActive,
                packagePrice: editingExamType.packagePrice,
                packageDiscountPercent: editingExamType.packageDiscountPercent,
                packageDurationMonths: editingExamType.packageDurationMonths,
                practiceQuotaPerMonth: editingExamType.practiceQuotaPerMonth,
                quizQuotaPerMonth: editingExamType.quizQuotaPerMonth,
                tryoutQuotaPerMonth: editingExamType.tryoutQuotaPerMonth,
                aiExplanationQuotaPerMonth: editingExamType.aiExplanationQuotaPerMonth,
                premiumPracticesEnabled: editingExamType.premiumPracticesEnabled,
                premiumTryoutsEnabled: editingExamType.premiumTryoutsEnabled,
                rankingEnabled: editingExamType.rankingEnabled,
                countdownTitle: editingExamType.countdownTitle ?? "",
                countdownTargetAt: formatDateTimeLocal(editingExamType.countdownTargetAt),
                registrationStartAt: formatDateTimeLocal(editingExamType.registrationStartAt),
                registrationEndAt: formatDateTimeLocal(editingExamType.registrationEndAt),
                examStartAt: formatDateTimeLocal(editingExamType.examStartAt),
                examEndAt: formatDateTimeLocal(editingExamType.examEndAt),
                announcementAt: formatDateTimeLocal(editingExamType.announcementAt),
                informationContent: editingExamType.informationContent ?? "",
              }
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) {
            setEditingExamType(null)

            if (closeDestination && defaultEditExamType) {
              router.push(closeDestination)
            }
          }
        }}
        onSubmit={handleUpdate}
        onSuccess={async () => {
          toast.success("Exam type updated.")
          setEditingExamType(null)

          if (closeDestination && defaultEditExamType) {
            router.push(closeDestination)
            return
          }

          router.refresh()
        }}
      />
    </div>
  )
}
