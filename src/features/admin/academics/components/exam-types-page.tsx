"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVerticalIcon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { updateExamTypeAction } from "../actions"
import type { ExamTypeFormValues } from "../schemas"
import type { ExamTypeRow } from "../queries"
import { previewText } from "../utils"
import { AdminDataTable, SortableHeader } from "./admin-data-table"
import { ExamTypeFormDialog } from "./exam-type-form-dialog"

type ExamTypesPageProps = {
  examTypes: ExamTypeRow[]
  defaultEditExamType?: ExamTypeRow | null
  closeDestination?: string
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
        getSearchText={(row) => [row.name, row.slug, row.description ?? ""].join(" ")}
        columns={[
          {
            accessorKey: "name",
            header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
            cell: ({ row }) => (
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">{row.original.name}</span>
                <span className="text-sm text-muted-foreground">{row.original.slug}</span>
              </div>
            ),
          },
          {
            accessorKey: "description",
            header: ({ column }) => <SortableHeader column={column}>Description</SortableHeader>,
            cell: ({ row }) => (
              <span className="line-clamp-2 text-sm text-muted-foreground">
                {previewText(row.original.description ?? "-", 120)}
              </span>
            ),
          },
          {
            accessorKey: "subjectCount",
            header: ({ column }) => <SortableHeader column={column}>Subjects</SortableHeader>,
            cell: ({ row }) => <Badge variant="outline">{row.original.subjectCount}</Badge>,
          },
          {
            accessorKey: "topicCount",
            header: ({ column }) => <SortableHeader column={column}>Topics</SortableHeader>,
            cell: ({ row }) => <Badge variant="outline">{row.original.topicCount}</Badge>,
          },
          {
            accessorKey: "questionCount",
            header: ({ column }) => <SortableHeader column={column}>Questions</SortableHeader>,
            cell: ({ row }) => <Badge variant="secondary">{row.original.questionCount}</Badge>,
          },
          {
            id: "actions",
            header: () => null,
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
                      aria-label={`Open actions for ${row.original.name}`}
                    >
                      <EllipsisVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setEditingExamType(row.original)}>
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
