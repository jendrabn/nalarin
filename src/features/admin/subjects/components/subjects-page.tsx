"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVerticalIcon, PencilLineIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
import { TaxonomyLogo } from "@/components/taxonomy-logo"

import {
  createSubjectAction,
  deleteSubjectAction,
  deleteSubjectsAction,
  updateSubjectAction,
} from "../actions"
import type { SubjectFormValues } from "../schemas"
import type { SubjectRow } from "../queries"
import type { ExamTypeLookup } from "../../exam-types/queries"
import { previewText } from "@/lib/utils"
import { SubjectFormDialog } from "./subject-form-dialog"

type SubjectsPageProps = {
  subjects: SubjectRow[]
  examTypes: ExamTypeLookup[]
  defaultCreateOpen?: boolean
  defaultEditSubject?: SubjectRow | null
  closeDestination?: string
}

const DEFAULT_COLUMN_VISIBILITY = {
  createdAt: false,
  updatedAt: false,
}

export function SubjectsPage({
  subjects,
  examTypes,
  defaultCreateOpen = false,
  defaultEditSubject = null,
  closeDestination,
}: SubjectsPageProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(defaultCreateOpen)
  const [editingSubject, setEditingSubject] = useState<SubjectRow | null>(defaultEditSubject)
  const [deleteTarget, setDeleteTarget] = useState<SubjectRow | null>(null)

  async function handleCreate(values: SubjectFormValues) {
    return createSubjectAction(values)
  }

  async function handleUpdate(values: SubjectFormValues) {
    if (!editingSubject) {
      return {
        success: false as const,
        message: "No subject is currently selected.",
      }
    }

    return updateSubjectAction(editingSubject.id, values)
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    const result = await deleteSubjectAction(deleteTarget.id)

    if (result.success) {
      toast.success("Subject deleted.")
      setDeleteTarget(null)

      if (closeDestination) {
        router.push(closeDestination)
      } else {
        router.refresh()
      }
      return
    }

    toast.error(result.message)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subjects"
        subtitle="Manage subjects under each exam type. Slugs are generated automatically from the name."
        actions={
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="shadow-sm shadow-primary/15"
          >
            <PlusIcon data-icon="inline-start" />
            Create Subject
          </Button>
        }
      />

      <AdminDataTable
        data={subjects}
        searchPlaceholder="Search subjects..."
        emptyMessage="No subjects found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        enableRowSelection
        getRowId={(subject) => String(subject.id)}
        onDeleteSelected={async (selectedSubjects) => {
          const result = await deleteSubjectsAction(
            selectedSubjects.map((subject) => subject.id),
          )

          if (result.success) {
            toast.success(`${result.data.deletedCount} subjects deleted.`)
            router.refresh()
            return true
          }

          toast.error(result.message)
          return false
        }}
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
            accessorKey: "examTypeName",
            meta: { label: "Exam Type" },
            header: ({ column }) => <SortableHeader column={column}>Exam Type</SortableHeader>,
            cell: ({ row }) => <span>{row.original.examTypeName}</span>,
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
                    <DropdownMenuItem onClick={() => setEditingSubject(row.original)}>
                      <PencilLineIcon />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(row.original)}
                    >
                      <Trash2Icon />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
        ]}
      />

      <SubjectFormDialog
        open={createOpen}
        mode="create"
        title="Create Subject"
        description="Create a new subject under an exam type."
        submitLabel="Create subject"
        examTypes={examTypes}
        onOpenChange={(open) => {
          setCreateOpen(open)

          if (!open && closeDestination && defaultCreateOpen) {
            router.push(closeDestination)
          }
        }}
        onSubmit={handleCreate}
        onSuccess={async () => {
          toast.success("Subject created.")
          setCreateOpen(false)

          if (closeDestination && defaultCreateOpen) {
            router.push(closeDestination)
            return
          }

          router.refresh()
        }}
      />

      <SubjectFormDialog
        open={Boolean(editingSubject)}
        mode="edit"
        title="Edit Subject"
        description="Update the subject name, description, or exam type."
        submitLabel="Save changes"
        examTypes={examTypes}
        initialValues={
          editingSubject
            ? {
                examTypeId: String(editingSubject.examTypeId),
                name: editingSubject.name,
                description: editingSubject.description ?? "",
                logoUrl: editingSubject.logoUrl ?? "",
              }
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) {
            setEditingSubject(null)

            if (closeDestination && defaultEditSubject) {
              router.push(closeDestination)
            }
          }
        }}
        onSubmit={handleUpdate}
        onSuccess={async () => {
          toast.success("Subject updated.")
          setEditingSubject(null)

          if (closeDestination && defaultEditSubject) {
            router.push(closeDestination)
            return
          }

          router.refresh()
        }}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The subject can only be deleted when it no longer has
              topics, questions, practices, or tryout sections attached to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" variant="destructive" onClick={() => void handleDelete()}>
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
