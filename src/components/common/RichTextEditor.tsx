import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { useEffect } from "react";
import {
  Bold, Italic, UnderlineIcon, List, ListOrdered,
  Quote, Subscript as SubIcon, Superscript as SupIcon, RemoveFormatting,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
}

const ToolBtn = ({
  active, onClick, title, children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`p-1.5 rounded-lg text-sm transition-all ${
      active
        ? "bg-primary-100 text-primary-700"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    }`}
  >
    {children}
  </button>
);

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Type here…",
  className = "",
  minHeight = "100px",
  disabled = false,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Subscript,
      Superscript,
    ],
    content: value || "",
    editable: !disabled,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-3 py-2",
        style: `min-height:${minHeight}`,
        "data-placeholder": placeholder,
      },
    },
  });

  // Sync external value changes (e.g. when form resets)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (current !== next && (next === "" || next === "<p></p>")) {
      editor.commands.setContent(next);
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (
    label: string,
    icon: React.ReactNode,
    active: boolean,
    action: () => void
  ) => (
    <ToolBtn key={label} title={label} active={active} onClick={action}>
      {icon}
    </ToolBtn>
  );

  return (
    <div className={`border border-primary-200 rounded-xl overflow-hidden bg-white tiptap-editor ${className} ${disabled ? "opacity-60" : ""}`}>
      {/* Toolbar */}
      {!disabled && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
          {btn("Bold", <Bold className="w-3.5 h-3.5" />, editor.isActive("bold"),
            () => editor.chain().focus().toggleBold().run())}
          {btn("Italic", <Italic className="w-3.5 h-3.5" />, editor.isActive("italic"),
            () => editor.chain().focus().toggleItalic().run())}
          {btn("Underline", <UnderlineIcon className="w-3.5 h-3.5" />, editor.isActive("underline"),
            () => editor.chain().focus().toggleUnderline().run())}

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          {btn("Bullet list", <List className="w-3.5 h-3.5" />, editor.isActive("bulletList"),
            () => editor.chain().focus().toggleBulletList().run())}
          {btn("Numbered list", <ListOrdered className="w-3.5 h-3.5" />, editor.isActive("orderedList"),
            () => editor.chain().focus().toggleOrderedList().run())}
          {btn("Blockquote", <Quote className="w-3.5 h-3.5" />, editor.isActive("blockquote"),
            () => editor.chain().focus().toggleBlockquote().run())}

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          {btn("Subscript", <SubIcon className="w-3.5 h-3.5" />, editor.isActive("subscript"),
            () => editor.chain().focus().toggleSubscript().run())}
          {btn("Superscript", <SupIcon className="w-3.5 h-3.5" />, editor.isActive("superscript"),
            () => editor.chain().focus().toggleSuperscript().run())}

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          {btn("Clear formatting", <RemoveFormatting className="w-3.5 h-3.5" />, false,
            () => editor.chain().focus().clearNodes().unsetAllMarks().run())}
        </div>
      )}

      {/* Editor area */}
      <EditorContent editor={editor} />

      <style>{`
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
