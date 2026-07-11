"use client";

import { useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import { postMediaUrl } from "@/lib/media";
import { STORAGE_BUCKETS } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n";

// Rich body editor (PRD 7.1-7.2): basic formatting, lists, quote, divider,
// links and inline image upload. Emits HTML; render paths sanitize it.
export function RichTextEditor({
  value,
  onChange,
  userId,
  labels,
  maxFileMb,
}: {
  value: string;
  onChange: (html: string) => void;
  userId: string;
  labels: Dictionary["editor"];
  maxFileMb: number;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image,
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "rich-content min-h-40 rounded-b-xl border border-t-0 border-line px-3 py-2.5 text-sm outline-none focus:border-primary",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.isEmpty ? "" : current.getHTML());
    },
  });

  if (!editor) {
    return <div className="min-h-48 rounded-xl border border-line bg-surface-sub/40" />;
  }

  async function insertImage(raw: File) {
    const file = await compressImage(raw);
    if (file.size > maxFileMb * 1024 * 1024) return;
    const supabase = createClient();
    const path = `${userId}/body-${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.POST_MEDIA)
      .upload(path, file);
    if (!error) {
      editor?.chain().focus().setImage({ src: postMediaUrl(path) }).run();
    }
  }

  const btn = (active: boolean) =>
    `flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-bold transition-colors ${
      active ? "bg-ink text-white" : "text-ink-soft hover:bg-surface-sub"
    }`;

  return (
    <div>
      <div className="scrollbar-none flex items-center gap-0.5 overflow-x-auto rounded-t-xl border border-line bg-surface-sub/50 px-1.5 py-1">
        <button type="button" aria-label={labels.bold} className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </button>
        <button type="button" aria-label={labels.italic} className={`${btn(editor.isActive("italic"))} italic`} onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </button>
        <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
        <button type="button" aria-label={labels.bulletList} className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
        </button>
        <button type="button" aria-label={labels.orderedList} className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </button>
        <button type="button" aria-label={labels.quote} className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo;
        </button>
        <button type="button" aria-label={labels.divider} className={btn(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          —
        </button>
        <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
        <button
          type="button"
          aria-label={labels.link}
          className={btn(editor.isActive("link"))}
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            const url = window.prompt(labels.linkPrompt);
            if (url) {
              editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
            }
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>
        <button
          type="button"
          aria-label={labels.table}
          className={btn(editor.isActive("table"))}
          onClick={() =>
            editor.isActive("table")
              ? editor.chain().focus().deleteTable().run()
              : editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
        </button>
        <button type="button" aria-label={labels.image} className={btn(false)} onClick={() => fileInput.current?.click()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) insertImage(file);
            e.target.value = "";
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
