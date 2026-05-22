"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { EditorContent, type Editor, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Highlight from "@tiptap/extension-highlight"
import TextAlign from "@tiptap/extension-text-align"
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CodeIcon,
  EraserIcon,
  HighlighterIcon,
  ImagePlusIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UndoIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { uploadQuestionImage } from "../utils/upload"

type QuestionRichTextEditorProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

async function uploadImageAndInsert(file: File, editor: Editor) {
  const url = await uploadQuestionImage(file)
  editor.chain().focus().setImage({ src: url, alt: file.name }).run()
}

function getHeadingValue(editor: Editor) {
  if (editor.isActive("heading", { level: 1 })) return "1"
  if (editor.isActive("heading", { level: 2 })) return "2"
  if (editor.isActive("heading", { level: 3 })) return "3"
  return "0"
}

function getTextAlignValue(editor: Editor) {
  if (editor.isActive({ textAlign: "center" })) return "center"
  if (editor.isActive({ textAlign: "right" })) return "right"
  if (editor.isActive({ textAlign: "justify" })) return "justify"
  return "left"
}

export function QuestionRichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Question content",
  disabled = false,
}: QuestionRichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Highlight,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    [],
  )

  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class:
          "min-h-[18rem] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-0 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border/60 [&_img]:shadow-sm",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return

    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>", {
        emitUpdate: false,
      })
    }
  }, [editor, value])

  async function handleUpload(file: File) {
    if (!editor) return

    setIsUploading(true)

    try {
      await uploadImageAndInsert(file, editor)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload the image."
      toast.error(message)
    } finally {
      setIsUploading(false)
    }
  }

  if (!editor) {
    return (
      <div className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        Loading editor...
      </div>
    )
  }

  const toolbarDisabled = disabled || isUploading
  const headingValue = getHeadingValue(editor)
  const alignValue = getTextAlignValue(editor)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-input bg-muted/20 p-1">
        <Select
          value={headingValue}
          onValueChange={(value) => {
            if (value === "0") {
              editor.chain().focus().setParagraph().run()
              return
            }

            const level = Number(value) as 1 | 2 | 3

            if (editor.isActive("heading", { level })) {
              return
            }

            editor.chain().focus().toggleHeading({ level }).run()
          }}
          disabled={toolbarDisabled}
        >
          <SelectTrigger className="h-9 w-[10.5rem] border-0 bg-background shadow-none">
            <SelectValue placeholder="Normal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Normal</SelectItem>
            <SelectItem value="1">Heading 1</SelectItem>
            <SelectItem value="2">Heading 2</SelectItem>
            <SelectItem value="3">Heading 3</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" variant={editor.isActive("bold") ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().toggleBold().run()} disabled={toolbarDisabled} aria-label="Bold">
          <BoldIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant={editor.isActive("italic") ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={toolbarDisabled} aria-label="Italic">
          <ItalicIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant={editor.isActive("underline") ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={toolbarDisabled} aria-label="Underline">
          <UnderlineIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant={editor.isActive("strike") ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={toolbarDisabled} aria-label="Strikethrough">
          <StrikethroughIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant={editor.isActive("code") ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().toggleCode().run()} disabled={toolbarDisabled} aria-label="Inline code">
          <CodeIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant={editor.isActive("bulletList") ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={toolbarDisabled} aria-label="Bullet list">
          <ListIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant={editor.isActive("orderedList") ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={toolbarDisabled} aria-label="Ordered list">
          <ListOrderedIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant={editor.isActive("blockquote") ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={toolbarDisabled} aria-label="Block quote">
          <QuoteIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant={editor.isActive("codeBlock") ? "secondary" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()} disabled={toolbarDisabled} aria-label="Code block">
          Code Block
        </Button>
        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "outline"}
          size="sm"
          onClick={() => {
            const currentUrl = editor.getAttributes("link").href as string | undefined
            const url = window.prompt("Link URL", currentUrl ?? "")

            if (url === null) return

            const trimmedUrl = url.trim()

            if (!trimmedUrl) {
              editor.chain().focus().unsetLink().run()
              return
            }

            editor.chain().focus().extendMarkRange("link").setLink({ href: trimmedUrl }).run()
          }}
          disabled={toolbarDisabled}
          aria-label="Link"
        >
          <LinkIcon data-icon="inline-start" />
          Link
        </Button>
        <Button type="button" variant={editor.isActive("highlight") ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().toggleHighlight().run()} disabled={toolbarDisabled} aria-label="Highlight">
          <HighlighterIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant="outline" size="icon-sm" onClick={() => fileInputRef.current?.click()} disabled={toolbarDisabled} aria-label="Upload image">
          <ImagePlusIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} disabled={toolbarDisabled} aria-label="Clear formatting">
          <EraserIcon data-icon="inline-start" />
          Clear
        </Button>
        <div className="mx-1 h-6 w-px bg-border/60" aria-hidden="true" />
        <div className="flex items-center gap-1">
          <Button type="button" variant={alignValue === "left" ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().setTextAlign("left").run()} disabled={toolbarDisabled} aria-label="Align left">
            <AlignLeftIcon data-icon="inline-start" />
          </Button>
          <Button type="button" variant={alignValue === "center" ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().setTextAlign("center").run()} disabled={toolbarDisabled} aria-label="Align center">
            <AlignCenterIcon data-icon="inline-start" />
          </Button>
          <Button type="button" variant={alignValue === "right" ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().setTextAlign("right").run()} disabled={toolbarDisabled} aria-label="Align right">
            <AlignRightIcon data-icon="inline-start" />
          </Button>
          <Button type="button" variant={alignValue === "justify" ? "secondary" : "outline"} size="icon-sm" onClick={() => editor.chain().focus().setTextAlign("justify").run()} disabled={toolbarDisabled} aria-label="Justify">
            <AlignJustifyIcon data-icon="inline-start" />
          </Button>
        </div>
        <div className="mx-1 h-6 w-px bg-border/60" aria-hidden="true" />
        <Button type="button" variant="outline" size="icon-sm" onClick={() => editor.chain().focus().undo().run()} disabled={toolbarDisabled || !editor.can().chain().focus().undo().run()} aria-label="Undo">
          <UndoIcon data-icon="inline-start" />
        </Button>
        <Button type="button" variant="outline" size="icon-sm" onClick={() => editor.chain().focus().redo().run()} disabled={toolbarDisabled || !editor.can().chain().focus().redo().run()} aria-label="Redo">
          <RedoIcon data-icon="inline-start" />
        </Button>
      </div>

      <div className={cn("rounded-lg border border-input bg-background", toolbarDisabled && "opacity-80")}>
        <EditorContent editor={editor} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ""

            if (!file) return

            void handleUpload(file)
          }}
        />
      </div>

      <p className="text-sm text-muted-foreground">{placeholder}</p>
    </div>
  )
}
