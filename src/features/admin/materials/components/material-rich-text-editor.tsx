"use client"

import { BlogRichTextEditor } from "@/features/admin/blog/components/blog-rich-text-editor"

type MaterialRichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function MaterialRichTextEditor(props: MaterialRichTextEditorProps) {
  return (
    <BlogRichTextEditor
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
      placeholder="Write the material content here..."
    />
  )
}
