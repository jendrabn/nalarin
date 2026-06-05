"use client"

import { useEffect, useMemo } from "react"
import { EditorContent, type Editor, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Highlight from "@tiptap/extension-highlight"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  EraserIcon,
  HighlighterIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  UnderlineIcon,
  UndoIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type EmailCampaignRichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function getHeadingValue(editor: Editor) {
  if (editor.isActive("heading", { level: 1 })) {
    return "1"
  }

  if (editor.isActive("heading", { level: 2 })) {
    return "2"
  }

  if (editor.isActive("heading", { level: 3 })) {
    return "3"
  }

  return "0"
}

function getTextAlignValue(editor: Editor) {
  if (editor.isActive({ textAlign: "center" })) {
    return "center"
  }

  if (editor.isActive({ textAlign: "right" })) {
    return "right"
  }

  if (editor.isActive({ textAlign: "justify" })) {
    return "justify"
  }

  return "left"
}

export function EmailCampaignRichTextEditor({
  value,
  onChange,
  disabled = false,
}: EmailCampaignRichTextEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Highlight,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["http", "https", "mailto"],
      }),
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
        class:
          "min-h-[18rem] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-0",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>", {
        emitUpdate: false,
      })
    }
  }, [editor, value])

  if (!editor) {
    return (
      <div className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        Loading editor...
      </div>
    )
  }

  const toolbarDisabled = disabled
  const headingValue = getHeadingValue(editor)
  const alignValue = getTextAlignValue(editor)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-input bg-muted/20 p-1">
        <Select
          value={headingValue}
          onValueChange={(selectedValue) => {
            if (selectedValue === "0") {
              editor.chain().focus().setParagraph().run()
              return
            }

            const level = Number(selectedValue) as 1 | 2 | 3
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

        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "outline"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={toolbarDisabled}
          aria-label="Bold"
        >
          <BoldIcon data-icon="inline-start" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "outline"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={toolbarDisabled}
          aria-label="Italic"
        >
          <ItalicIcon data-icon="inline-start" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "outline"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={toolbarDisabled}
          aria-label="Underline"
        >
          <UnderlineIcon data-icon="inline-start" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "outline"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={toolbarDisabled}
          aria-label="Bullet list"
        >
          <ListIcon data-icon="inline-start" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "outline"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={toolbarDisabled}
          aria-label="Ordered list"
        >
          <ListOrderedIcon data-icon="inline-start" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "secondary" : "outline"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={toolbarDisabled}
          aria-label="Block quote"
        >
          <QuoteIcon data-icon="inline-start" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("highlight") ? "secondary" : "outline"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          disabled={toolbarDisabled}
          aria-label="Highlight"
        >
          <HighlighterIcon data-icon="inline-start" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "outline"}
          size="icon-sm"
          onClick={() => {
            const currentUrl = editor.getAttributes("link").href as string | undefined
            const url = window.prompt("Enter link URL", currentUrl ?? "")

            if (url === null) {
              return
            }

            const trimmedUrl = url.trim()

            if (!trimmedUrl) {
              editor.chain().focus().extendMarkRange("link").unsetLink().run()
              return
            }

            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: trimmedUrl })
              .run()
          }}
          disabled={toolbarDisabled}
          aria-label="Link"
        >
          <LinkIcon data-icon="inline-start" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          disabled={toolbarDisabled}
          aria-label="Clear formatting"
        >
          <EraserIcon data-icon="inline-start" />
          Clear
        </Button>
        <div className="mx-1 h-6 w-px bg-border/60" aria-hidden="true" />
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={alignValue === "left" ? "secondary" : "outline"}
            size="icon-sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            disabled={toolbarDisabled}
            aria-label="Align left"
          >
            <AlignLeftIcon data-icon="inline-start" />
          </Button>
          <Button
            type="button"
            variant={alignValue === "center" ? "secondary" : "outline"}
            size="icon-sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            disabled={toolbarDisabled}
            aria-label="Align center"
          >
            <AlignCenterIcon data-icon="inline-start" />
          </Button>
          <Button
            type="button"
            variant={alignValue === "right" ? "secondary" : "outline"}
            size="icon-sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            disabled={toolbarDisabled}
            aria-label="Align right"
          >
            <AlignRightIcon data-icon="inline-start" />
          </Button>
          <Button
            type="button"
            variant={alignValue === "justify" ? "secondary" : "outline"}
            size="icon-sm"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            disabled={toolbarDisabled}
            aria-label="Justify"
          >
            <AlignJustifyIcon data-icon="inline-start" />
          </Button>
        </div>
        <div className="mx-1 h-6 w-px bg-border/60" aria-hidden="true" />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={toolbarDisabled || !editor.can().chain().focus().undo().run()}
          aria-label="Undo"
        >
          <UndoIcon data-icon="inline-start" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={toolbarDisabled || !editor.can().chain().focus().redo().run()}
          aria-label="Redo"
        >
          <RedoIcon data-icon="inline-start" />
        </Button>
      </div>

      <div className={cn("rounded-lg border border-input bg-background", disabled && "opacity-80")}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
