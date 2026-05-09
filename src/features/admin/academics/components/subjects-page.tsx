"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
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

import {
  createSubjectAction,
  deleteSubjectAction,
  updateSubjectAction,
} from "../actions"
import type { SubjectFormValues } from "../schemas"
import type { ExamTypeLookup, SubjectRow } from "../queries"
import { previewText } from "../utils"
import { AdminDataTable, SortableHeader } from "./admin-data-table"
import { SubjectFormDialog } from "./subject-form-dialog"

type SubjectsPageProps = {
  subjects: SubjectRow[]
  examTypes: ExamTypeLookup[]
  defaultCreateOpen?: boolean
  defaultEditSubject?: SubjectRow | null
  closeDestination?: string
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
        getSearchText={(row) =>
          [row.name, row.slug, row.description ?? "", row.examTypeName, row.examTypeSlug].join(" ")
        }
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
            accessorKey: "examTypeName",
            header: ({ column }) => <SortableHeader column={column}>Exam Type</SortableHeader>,
            cell: ({ row }) => (
              <Badge variant="outline">{row.original.examTypeName}</Badge>
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
                    <DropdownMenuItem onClick={() => setEditingSubject(row.original)}>
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
