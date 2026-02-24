"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useState } from "react";

type HtmlEditorProps = {
  value: string;
  placeholder?: string;
  variableTokens?: string[];
  onChange: (nextHtml: string, nextText: string) => void;
};

const DEFAULT_TOKENS = [
  "{nickname}",
  "{realname}",
  "{age}",
  "{username}",
  "{email}",
];

export default function HtmlEditor({
  value,
  placeholder = "Write your email...",
  variableTokens = DEFAULT_TOKENS,
  onChange,
}: HtmlEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const tokens = useMemo(
    () =>
      Array.from(
        new Set(
          (variableTokens || [])
            .map((item) => String(item || "").trim())
            .filter(Boolean),
        ),
      ),
    [variableTokens],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML(), current.getText());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const nextHtml = value || "";
    if (currentHtml === nextHtml) return;
    editor.commands.setContent(nextHtml, false);
  }, [editor, value]);

  const applyLink = () => {
    if (!editor) return;
    const current = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL", current);
    if (url === null) return;
    const next = url.trim();
    if (!next) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: next, target: "_blank" }).run();
  };

  const insertVariable = (token: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(token).run();
  };

  const toolbarBtn =
    "rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-muted";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          Underline
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          Bullet List
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          Numbered List
        </button>
        <button type="button" className={toolbarBtn} onClick={applyLink}>
          Link
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor?.chain().focus().setParagraph().run()}
        >
          Paragraph
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Heading
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => setShowPreview((prev) => !prev)}
        >
          {showPreview ? "Hide Preview" : "Preview"}
        </button>
      </div>

      {tokens.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {tokens.map((token) => (
            <button
              key={token}
              type="button"
              className={toolbarBtn}
              onClick={() => insertVariable(token)}
            >
              {token}
            </button>
          ))}
        </div>
      ) : null}

      <EditorContent editor={editor} />

      {showPreview ? (
        <div
          className="min-h-[120px] rounded-md border border-input bg-muted/20 p-3 text-sm"
          dangerouslySetInnerHTML={{ __html: value || "" }}
        />
      ) : null}
    </div>
  );
}
