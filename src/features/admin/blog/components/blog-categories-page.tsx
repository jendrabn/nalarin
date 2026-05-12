"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import { EllipsisVerticalIcon, PencilLineIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
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

import {
  createBlogCategoryAction,
  deleteBlogCategoryAction,
  deleteBlogCategoriesAction,
  updateBlogCategoryAction,
} from "../actions"
import type { BlogCategoryDetails, BlogCategoryRow } from "../queries"
import { BlogCategoryFormDialog } from "./blog-category-form-dialog"

type BlogCategoriesPageProps = {
  categories: BlogCategoryRow[]
  defaultCreateOpen?: boolean
  defaultEditCategory?: BlogCategoryDetails | null
  closeDestination?: string
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  createdAt: false,
  updatedAt: false,
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function createColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (category: BlogCategoryRow) => void
  onDelete: (category: BlogCategoryRow) => void
}): ColumnDef<BlogCategoryRow>[] {
  return [
    {
      accessorKey: "name",
      meta: { label: "Name" },
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => <div className="font-medium text-foreground">{row.original.name}</div>,
    },
    {
      accessorKey: "blogCount",
      meta: { label: "Blog Count" },
      header: ({ column }) => <SortableHeader column={column}>Blog Count</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.original.blogCount.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      accessorKey: "viewCount",
      meta: { label: "View Count" },
      header: ({ column }) => <SortableHeader column={column}>View Count</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.original.viewCount.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      accessorKey: "description",
      meta: { label: "Description" },
      header: ({ column }) => <SortableHeader column={column}>Description</SortableHeader>,
      cell: ({ row }) => (
        <p className="max-w-[28rem] whitespace-normal text-sm text-muted-foreground">
          {row.original.description}
        </p>
      ),
    },
    {
      accessorKey: "createdAt",
      meta: { label: "Created At" },
      header: ({ column }) => <SortableHeader column={column}>Created At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: "Updated At" },
      header: ({ column }) => <SortableHeader column={column}>Updated At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      meta: { label: "Actions" },
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
                aria-label={`Open actions for ${row.original.name}`}
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <PencilLineIcon />
                Edit
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

export function BlogCategoriesPage({
  categories,
  defaultCreateOpen = false,
  defaultEditCategory = null,
  closeDestination,
}: BlogCategoriesPageProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(defaultCreateOpen)
  const [editingCategory, setEditingCategory] = useState<BlogCategoryDetails | null>(
    defaultEditCategory,
  )
  const [deleteTarget, setDeleteTarget] = useState<BlogCategoryRow | null>(null)

  const columns = useMemo(
    () =>
      createColumns({
        onEdit: setEditingCategory,
        onDelete: setDeleteTarget,
      }),
    [],
  )

  async function handleCreate(values: {
    name: string
    description: string
  }) {
    return createBlogCategoryAction(values)
  }

  async function handleUpdate(values: {
    name: string
    description: string
  }) {
    if (!editingCategory) {
      return {
        success: false as const,
        message: "No blog category is currently selected.",
      }
    }

    return updateBlogCategoryAction(editingCategory.id, values)
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    const result = await deleteBlogCategoryAction(deleteTarget.id)

    if (result.success) {
      toast.success("Blog category deleted.")
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
        title="Blog Categories"
        subtitle="Manage blog categories from the admin panel."
        actions={
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="shadow-sm shadow-primary/15"
          >
            <PlusIcon data-icon="inline-start" />
            Create Category
          </Button>
        }
      />

      <AdminDataTable
        data={categories}
        columns={columns}
        searchPlaceholder="Search categories..."
        emptyMessage="No blog categories found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        defaultPageSize="10"
        enableRowSelection
        getRowId={(category) => String(category.id)}
        onDeleteSelected={async (selectedCategories) => {
          const result = await deleteBlogCategoriesAction(
            selectedCategories.map((category) => category.id),
          )

          if (result.success) {
            toast.success(`${result.data.deletedCount} blog categories deleted.`)
            router.refresh()
            return true
          }

          toast.error(result.message)
          return false
        }}
      />

      <BlogCategoryFormDialog
        open={createOpen}
        mode="create"
        title="Create Blog Category"
        description="Create a new blog category."
        submitLabel="Create category"
        onOpenChange={(open) => {
          setCreateOpen(open)

          if (!open && closeDestination && defaultCreateOpen) {
            router.push(closeDestination)
          }
        }}
        onSubmit={handleCreate}
        onSuccess={async () => {
          toast.success("Blog category created.")
          setCreateOpen(false)

          if (closeDestination && defaultCreateOpen) {
            router.push(closeDestination)
            return
          }

          router.refresh()
        }}
      />

      <BlogCategoryFormDialog
        open={Boolean(editingCategory)}
        mode="edit"
        title="Edit Blog Category"
        description="Update the category name or description. The slug stays automatic and unique from the name."
        submitLabel="Save changes"
        initialValues={
          editingCategory
            ? {
                name: editingCategory.name,
                description: editingCategory.description ?? "",
              }
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) {
            setEditingCategory(null)

            if (closeDestination && defaultEditCategory) {
              router.push(closeDestination)
            }
          }
        }}
        onSubmit={handleUpdate}
        onSuccess={async () => {
          toast.success("Blog category updated.")
          setEditingCategory(null)

          if (closeDestination && defaultEditCategory) {
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
            <AlertDialogTitle>Delete blog category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The category will only be deleted if it
              has no blog posts attached to it.
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
