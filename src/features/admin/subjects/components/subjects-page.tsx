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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatAdminDateTime } from "@/lib/format"

import {
  createSubjectAction,
  deleteSubjectAction,
  deleteSubjectsAction,
  updateSubjectAction,
} from "../actions"
import type { SubjectFormValues } from "../schemas"
import type { SubjectRow } from "../queries"
import type { ExamTypeLookup } from "../../exam-types/queries"
import { SubjectFormDialog } from "./subject-form-dialog"

type SubjectsPageProps = {
  subjects: SubjectRow[]
  examTypes: ExamTypeLookup[]
  defaultCreateOpen?: boolean
  defaultEditSubject?: SubjectRow | null
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
        subtitle="Manage subjects to keep each exam type taxonomy organized."
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
                {formatAdminDateTime(row.original.createdAt)}
              </span>
            ),
          },
          {
            accessorKey: "updatedAt",
            meta: { label: "Updated At" },
            header: ({ column }) => <SortableHeader column={column}>Updated At</SortableHeader>,
            cell: ({ row }) => (
              <span className="text-sm text-muted-foreground">
                {formatAdminDateTime(row.original.updatedAt)}
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
