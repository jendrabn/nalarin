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

import { updateExamTypeAction } from "../actions"
import type { ExamTypeFormValues } from "../schemas"
import type { ExamTypeRow } from "../queries"
import { previewText } from "@/lib/utils"
import { ExamTypeFormDialog } from "./exam-type-form-dialog"

type ExamTypesPageProps = {
  examTypes: ExamTypeRow[]
  defaultEditExamType?: ExamTypeRow | null
  closeDestination?: string
}

const DEFAULT_COLUMN_VISIBILITY = {
  createdAt: false,
  updatedAt: false,
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
        subtitle="Edit the seeded exam types that power subjects, topics, practices, tryouts, and question filters."
        actions={null}
      />

      <AdminDataTable
        data={examTypes}
        searchPlaceholder="Search exam types..."
        emptyMessage="No exam types found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
          columns={[
            {
              id: "logo",
              header: () => "Logo",
              enableSorting: false,
              enableHiding: false,
              cell: ({ row }) => (
                <div className="flex justify-center">
                  <TaxonomyLogo src={row.original.logoUrl} alt={row.original.name} />
                </div>
              ),
            },
            {
              accessorKey: "name",
              meta: { label: "Name" },
              header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
              cell: ({ row }) => (
                <span className="truncate font-medium text-foreground">
                  {row.original.name}
                </span>
              ),
            },
          {
            accessorKey: "description",
            meta: { label: "Description" },
            header: ({ column }) => <SortableHeader column={column}>Description</SortableHeader>,
            cell: ({ row }) => (
              <span className="line-clamp-2 text-sm text-muted-foreground">
                {previewText(row.original.description ?? "-", 120)}
              </span>
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
        description="Update the exam type name and description."
        submitLabel="Save changes"
        initialValues={
          editingExamType
            ? {
                name: editingExamType.name,
                description: editingExamType.description ?? "",
                logoUrl: editingExamType.logoUrl ?? "",
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
