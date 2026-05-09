"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"
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
  deleteBlogPostAction,
} from "../actions/blog-posts"
import type { BlogPostRow } from "../queries/blog-posts"
import { BlogPostsTable } from "./blog-posts-table"

type BlogPostsPageProps = {
  posts: BlogPostRow[]
}

export function BlogPostsPage({ posts }: BlogPostsPageProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<BlogPostRow | null>(null)

  function handleEdit(post: BlogPostRow) {
    router.push(`/admin/blog/${post.id}/edit`)
  }

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
        title="Blog"
        subtitle="Manage editorial posts, SEO metadata, thumbnails, and published content from one editorial workspace."
        actions={
          <Button asChild>
            <Link href="/admin/blog/create">
              <PlusIcon data-icon="inline-start" />
              Create Post
            </Link>
          </Button>
        }
      />

      <BlogPostsTable data={posts} onEdit={handleEdit} onDelete={setDeleteTarget} />

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

