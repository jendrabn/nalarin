"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react"
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

import {
  createTopicAction,
  deleteTopicAction,
  updateTopicAction,
} from "../actions"
import type { TopicFormValues } from "../schemas"
import type { ExamTypeLookup } from "../../exam-types/queries"
import type { SubjectLookup, TopicRow } from "../queries"
import { previewText } from "@/lib/utils"
import { TopicFormDialog } from "./topic-form-dialog"

type TopicsPageProps = {
  topics: TopicRow[]
  examTypes: ExamTypeLookup[]
  subjects: SubjectLookup[]
  defaultCreateOpen?: boolean
  defaultEditTopic?: TopicRow | null
  closeDestination?: string
}

export function TopicsPage({
  topics,
  examTypes,
  subjects,
  defaultCreateOpen = false,
  defaultEditTopic = null,
  closeDestination,
}: TopicsPageProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(defaultCreateOpen)
  const [editingTopic, setEditingTopic] = useState<TopicRow | null>(defaultEditTopic)
  const [deleteTarget, setDeleteTarget] = useState<TopicRow | null>(null)

  async function handleCreate(values: TopicFormValues) {
    return createTopicAction(values)
  }

  async function handleUpdate(values: TopicFormValues) {
    if (!editingTopic) {
      return {
        success: false as const,
        message: "No topic is currently selected.",
      }
    }

    return updateTopicAction(editingTopic.id, values)
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    const result = await deleteTopicAction(deleteTarget.id)

    if (result.success) {
      toast.success("Topic deleted.")
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
        title="Topics"
        subtitle="Manage the topic layer under subjects. Slugs are automatic and unique within each subject."
        actions={
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="shadow-sm shadow-primary/15"
          >
            <PlusIcon data-icon="inline-start" />
            Create Topic
          </Button>
        }
      />

      <AdminDataTable
        data={topics}
        searchPlaceholder="Search topics..."
        emptyMessage="No topics found."
        columns={[
          {
            accessorKey: "name",
            meta: { label: "Name" },
            header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
            cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
          },
          {
            accessorKey: "subjectName",
            meta: { label: "Subject" },
            header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
            cell: ({ row }) => <span>{row.original.subjectName}</span>,
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
            accessorKey: "questionCount",
            meta: { label: "Questions" },
            header: ({ column }) => <SortableHeader column={column}>Questions</SortableHeader>,
            cell: ({ row }) => <span className="tabular-nums">{row.original.questionCount}</span>,
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
                    <DropdownMenuItem onClick={() => setEditingTopic(row.original)}>
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

      <TopicFormDialog
        open={createOpen}
        mode="create"
        title="Create Topic"
        description="Create a new topic under a subject."
        submitLabel="Create topic"
        examTypes={examTypes}
        subjects={subjects}
        onOpenChange={(open) => {
          setCreateOpen(open)

          if (!open && closeDestination && defaultCreateOpen) {
            router.push(closeDestination)
          }
        }}
        onSubmit={handleCreate}
        onSuccess={async () => {
          toast.success("Topic created.")
          setCreateOpen(false)

          if (closeDestination && defaultCreateOpen) {
            router.push(closeDestination)
            return
          }

          router.refresh()
        }}
      />

      <TopicFormDialog
        open={Boolean(editingTopic)}
        mode="edit"
        title="Edit Topic"
        description="Update the topic name, description, or subject."
        submitLabel="Save changes"
        examTypes={examTypes}
        subjects={subjects}
        initialValues={
          editingTopic
            ? {
                subjectId: String(editingTopic.subjectId),
                name: editingTopic.name,
                description: editingTopic.description ?? "",
              }
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) {
            setEditingTopic(null)

            if (closeDestination && defaultEditTopic) {
              router.push(closeDestination)
            }
          }
        }}
        onSubmit={handleUpdate}
        onSuccess={async () => {
          toast.success("Topic updated.")
          setEditingTopic(null)

          if (closeDestination && defaultEditTopic) {
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
            <AlertDialogTitle>Delete topic?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The topic can only be deleted when it is no longer used
              by questions or practices.
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
