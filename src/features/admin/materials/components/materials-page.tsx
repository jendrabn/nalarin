"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PencilLineIcon,
  PlusIcon,
  RocketIcon,
  ArchiveIcon,
  Trash2Icon,
} from "lucide-react"
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
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import {
  archiveMaterialAction,
  deleteMaterialAction,
  publishMaterialAction,
} from "../actions"
import type {
  MaterialExamTypeLookup,
  MaterialRow,
  MaterialSubjectLookup,
  MaterialTopicLookup,
} from "../queries"
import { getMaterialContentMode, previewMaterialContent } from "../utils/material"

type MaterialsPageProps = {
  materials: MaterialRow[]
  lookups: {
    examTypes: MaterialExamTypeLookup[]
    subjects: MaterialSubjectLookup[]
    topics: MaterialTopicLookup[]
  }
}

type DialogTarget =
  | { type: "publish"; material: MaterialRow }
  | { type: "archive"; material: MaterialRow }
  | { type: "delete"; material: MaterialRow }
  | null

const ALL_VALUE = "__all__"

function contentModeBadge(mode: ReturnType<typeof getMaterialContentMode>) {
  if (mode === "mixed") {
    return {
      label: "Video + Text",
      className: "border-chart-2/20 bg-chart-2/10 text-chart-2",
    }
  }

  if (mode === "video") {
    return {
      label: "Video",
      className: "border-chart-1/20 bg-chart-1/10 text-chart-1",
    }
  }

  if (mode === "text") {
    return {
      label: "Text",
      className: "border-chart-3/20 bg-chart-3/10 text-chart-3",
    }
  }

  return {
    label: "Empty",
    className: "border-border bg-muted text-muted-foreground",
  }
}

function createColumns({
  onView,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
}: {
  onView: (material: MaterialRow) => void
  onEdit: (material: MaterialRow) => void
  onPublish: (material: MaterialRow) => void
  onArchive: (material: MaterialRow) => void
  onDelete: (material: MaterialRow) => void
}): ColumnDef<MaterialRow>[] {
  return [
    {
      accessorKey: "title",
      meta: { label: "Title" },
      header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
      cell: ({ row }) => {
        const material = row.original
        const summary =
          material.excerpt || previewMaterialContent(material.content) || "No description available."

        return (
          <div className="flex min-w-0 items-start gap-3">
            <div className="relative mt-0.5 h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/30">
              {material.thumbnailUrl ? (
                <Image
                  src={material.thumbnailUrl}
                  alt={material.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <span className="block font-medium text-foreground">{material.title}</span>
              <p className="line-clamp-2 max-w-[34rem] whitespace-normal text-sm text-muted-foreground">
                {summary}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "examTypeName",
      meta: { label: "Exam Type" },
      header: ({ column }) => <SortableHeader column={column}>Exam Type</SortableHeader>,
    },
    {
      accessorKey: "subjectName",
      meta: { label: "Subject" },
      header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
    },
    {
      accessorKey: "topicName",
      meta: { label: "Topic" },
      header: ({ column }) => <SortableHeader column={column}>Topic</SortableHeader>,
      cell: ({ row }) => <span>{row.original.topicName ?? "-"}</span>,
    },
    {
      id: "contentMode",
      meta: { label: "Content" },
      header: ({ column }) => <SortableHeader column={column}>Content</SortableHeader>,
      cell: ({ row }) => {
        const badge = contentModeBadge(getMaterialContentMode(row.original.youtubeUrl, row.original.content))

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "isFree",
      meta: { label: "Access" },
      header: ({ column }) => <SortableHeader column={column}>Access</SortableHeader>,
      cell: ({ row }) => (
        <Badge variant={row.original.isFree ? "secondary" : "outline"}>
          {row.original.isFree ? "Free" : "Paid"}
        </Badge>
      ),
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
      accessorKey: "publishedAt",
      meta: { label: "Published At" },
      header: ({ column }) => <SortableHeader column={column}>Published At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatAdminDateTime(row.original.publishedAt)}
        </span>
      ),
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView(row.original)}>
                <EyeIcon />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <PencilLineIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.original.status === "published" ? (
                <DropdownMenuItem onClick={() => onArchive(row.original)}>
                  <ArchiveIcon />
                  Archive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onPublish(row.original)}>
                  <RocketIcon />
                  Publish
                </DropdownMenuItem>
              )}
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

export function MaterialsPage({ materials, lookups }: MaterialsPageProps) {
  const router = useRouter()
  const [dialogTarget, setDialogTarget] = useState<DialogTarget>(null)
  const [examTypeFilter, setExamTypeFilter] = useState(ALL_VALUE)
  const [subjectFilter, setSubjectFilter] = useState(ALL_VALUE)
  const [statusFilter, setStatusFilter] = useState(ALL_VALUE)

  const filteredSubjects = useMemo(() => {
    if (examTypeFilter === ALL_VALUE) {
      return lookups.subjects
    }

    const selectedExamTypeId = Number(examTypeFilter)
    return lookups.subjects.filter((subject) => subject.examTypeId === selectedExamTypeId)
  }, [examTypeFilter, lookups.subjects])

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      if (examTypeFilter !== ALL_VALUE && material.examTypeId !== Number(examTypeFilter)) {
        return false
      }

      if (subjectFilter !== ALL_VALUE && material.subjectId !== Number(subjectFilter)) {
        return false
      }

      if (statusFilter !== ALL_VALUE && material.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [examTypeFilter, materials, statusFilter, subjectFilter])

  const columns = useMemo(
    () =>
      createColumns({
        onView: (material) => router.push(`/admin/materials/${material.id}`),
        onEdit: (material) => router.push(`/admin/materials/${material.id}/edit`),
        onPublish: (material) => setDialogTarget({ type: "publish", material }),
        onArchive: (material) => setDialogTarget({ type: "archive", material }),
        onDelete: (material) => setDialogTarget({ type: "delete", material }),
      }),
    [router],
  )

  async function handleDialogAction() {
    if (!dialogTarget) {
      return
    }

    const result =
      dialogTarget.type === "publish"
        ? await publishMaterialAction(dialogTarget.material.id)
        : dialogTarget.type === "archive"
          ? await archiveMaterialAction(dialogTarget.material.id)
          : await deleteMaterialAction(dialogTarget.material.id)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success(
      dialogTarget.type === "publish"
        ? "Material published."
        : dialogTarget.type === "archive"
          ? "Material archived."
          : "Material deleted.",
    )
    setDialogTarget(null)
    router.refresh()
  }

  const dialogCopy =
    dialogTarget?.type === "publish"
      ? {
          title: "Publish material?",
          description:
            "This will publish the material immediately. The content must include a YouTube URL or Tiptap content.",
          action: "Publish",
          variant: "default" as const,
        }
      : dialogTarget?.type === "archive"
        ? {
            title: "Archive material?",
            description:
              "Archived materials are hidden from the public listing but remain available in the admin panel.",
            action: "Archive",
            variant: "destructive" as const,
          }
        : {
            title: "Delete material?",
            description:
              "Only draft materials that have never been published can be deleted.",
            action: "Delete",
            variant: "destructive" as const,
          }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Materials"
        subtitle="Manage video and text materials for each exam type, subject, and topic."
        actions={
          <Button asChild>
            <Link href="/admin/materials/create">
              <PlusIcon data-icon="inline-start" />
              Create Material
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:grid-cols-4">
        <Field>
          <FieldContent>
            <FieldLabel>Exam Type</FieldLabel>
          </FieldContent>
          <Select
            value={examTypeFilter}
            onValueChange={(value) => {
              setExamTypeFilter(value)
              setSubjectFilter(ALL_VALUE)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All exam types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All exam types</SelectItem>
              {lookups.examTypes.map((examType) => (
                <SelectItem key={examType.id} value={String(examType.id)}>
                  {examType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldContent>
            <FieldLabel>Subject</FieldLabel>
          </FieldContent>
          <Select
            value={subjectFilter}
            onValueChange={setSubjectFilter}
            disabled={filteredSubjects.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All subjects</SelectItem>
                {filteredSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={String(subject.id)}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

        <Field>
          <FieldContent>
            <FieldLabel>Status</FieldLabel>
          </FieldContent>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <div className="flex items-end justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => {
              setExamTypeFilter(ALL_VALUE)
              setSubjectFilter(ALL_VALUE)
              setStatusFilter(ALL_VALUE)
            }}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      <AdminDataTable
        data={filteredMaterials}
        columns={columns}
        searchPlaceholder="Search materials..."
        emptyMessage="No materials found."
        defaultColumnVisibility={{
          publishedAt: false,
          createdAt: false,
          updatedAt: false,
        }}
        defaultPageSize="10"
      />

      <AlertDialog
        open={dialogTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogCopy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant={dialogCopy.variant === "destructive" ? "destructive-solid" : "default"}
                onClick={() => void handleDialogAction()}
              >
                {dialogCopy.action}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
