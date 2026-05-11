"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import { EllipsisVerticalIcon, PencilLineIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
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
import { getModelEnumBadgeMeta } from "@/lib/model-enums"

import { deleteBlogPostAction } from "../actions/blog-posts"
import type { BlogPostRow } from "../queries/blog-posts"

type BlogPostsPageProps = {
  posts: BlogPostRow[]
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  slug: false,
  thumbnailUrl: false,
  publishedAt: false,
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
  onEdit: (post: BlogPostRow) => void
  onDelete: (post: BlogPostRow) => void
}): ColumnDef<BlogPostRow>[] {
  return [
    {
      accessorKey: "title",
      meta: { label: "Title" },
      header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">{row.original.title}</span>
          {row.original.excerpt ? (
            <p className="line-clamp-2 max-w-[32rem] whitespace-normal text-sm text-muted-foreground">
              {row.original.excerpt}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "slug",
      meta: { label: "Slug" },
      header: ({ column }) => <SortableHeader column={column}>Slug</SortableHeader>,
      cell: ({ row }) => <span>{row.original.slug}</span>,
    },
    {
      accessorKey: "categoryName",
      meta: { label: "Category" },
      header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
      cell: ({ row }) => <span>{row.original.categoryName ?? "Uncategorized"}</span>,
    },
    {
      accessorKey: "status",
      meta: { label: "Status" },
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }) => {
        const badge = getModelEnumBadgeMeta("contentStatus", row.original.status)

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "thumbnailUrl",
      meta: { label: "Thumbnail" },
      header: ({ column }) => <SortableHeader column={column}>Thumbnail</SortableHeader>,
      cell: ({ row }) =>
        row.original.thumbnailUrl ? (
          <div className="relative h-12 w-20 overflow-hidden rounded-lg border border-border/60">
            <Image
              src={row.original.thumbnailUrl}
              alt={row.original.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <span className="text-muted-foreground">No image</span>
        ),
    },
    {
      accessorKey: "readTimeMinutes",
      meta: { label: "Read Time" },
      header: ({ column }) => <SortableHeader column={column}>Read Time</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.original.readTimeMinutes ? `${row.original.readTimeMinutes} min` : "-"}
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
      accessorKey: "publishedAt",
      meta: { label: "Published At" },
      header: ({ column }) => <SortableHeader column={column}>Published At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.publishedAt ? formatDateTime(row.original.publishedAt) : "-"}
        </span>
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
                aria-label={`Open actions for ${row.original.title}`}
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

export function BlogPostsPage({ posts }: BlogPostsPageProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<BlogPostRow | null>(null)

  const columns = useMemo(
    () =>
      createColumns({
        onEdit: (post) => router.push(`/admin/blog/${post.id}/edit`),
        onDelete: setDeleteTarget,
      }),
    [router],
  )

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    const result = await deleteBlogPostAction(deleteTarget.id)

    if (result.success) {
      toast.success("Blog post deleted.")
      setDeleteTarget(null)
      router.refresh()
      return
    }

    toast.error(result.message)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Blog Posts"
        subtitle="Manage blog posts from the admin panel."
        actions={
          <Button asChild>
            <Link href="/admin/blog/create">
              <PlusIcon data-icon="inline-start" />
              Create Post
            </Link>
          </Button>
        }
      />

      <AdminDataTable
        data={posts}
        columns={columns}
        searchPlaceholder="Search posts..."
        emptyMessage="No blog posts found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        defaultPageSize="10"
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
            <AlertDialogTitle>Delete blog post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The article will be removed from the admin
              list and public blog pages.
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
