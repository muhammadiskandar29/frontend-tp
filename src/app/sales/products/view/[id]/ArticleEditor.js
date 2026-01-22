"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import { useState, useEffect } from "react";
import {
    Bold, Italic, List, ListOrdered, Quote,
    Link as LinkIcon, Type, AlignLeft, AlignCenter,
    AlignRight, Image as ImageIcon, Save, X, Eye,
    Code, Undo, Redo, Strikethrough, Minimize2
} from "lucide-react";
import { toast } from "react-hot-toast";

const MenuBar = ({ editor }) => {
    if (!editor) return null;

    return (
        <div className="editor-toolbar">
            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive("bold") ? "is-active" : ""}
                    title="Bold (Ctrl+B)"
                >
                    <Bold size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive("italic") ? "is-active" : ""}
                    title="Italic (Ctrl+I)"
                >
                    <Italic size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive("strike") ? "is-active" : ""}
                    title="Strikethrough"
                >
                    <Strikethrough size={16} />
                </button>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive("bulletList") ? "is-active" : ""}
                >
                    <List size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive("orderedList") ? "is-active" : ""}
                >
                    <ListOrdered size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive("blockquote") ? "is-active" : ""}
                >
                    <Quote size={16} />
                </button>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-group">
                <button onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                    <AlignLeft size={16} />
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                    <AlignCenter size={16} />
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                    <AlignRight size={16} />
                </button>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-group">
                <button
                    onClick={() => {
                        const url = window.prompt("Enter URL");
                        if (url) editor.chain().focus().setLink({ href: url }).run();
                    }}
                    className={editor.isActive("link") ? "is-active" : ""}
                >
                    <LinkIcon size={16} />
                </button>
                <button onClick={() => editor.chain().focus().unsetLink().run()}>
                    <Minimize2 size={16} style={{ transform: 'rotate(45deg)' }} />
                </button>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-group">
                <button onClick={() => editor.chain().focus().undo().run()}>
                    <Undo size={16} />
                </button>
                <button onClick={() => editor.chain().focus().redo().run()}>
                    <Redo size={16} />
                </button>
            </div>
        </div>
    );
};

export default function ArticleEditor({ initialData, onSave, onCancel }) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [viewMode, setViewMode] = useState("visual"); // "visual" | "text"
    const [saving, setSaving] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false }),
            TextStyle,
            Color,
        ],
        content: initialData?.content ? (typeof initialData.content === 'string' ? initialData.content : JSON.stringify(initialData.content)) : "<p>Mulai menulis...</p>",
    });

    // Sync slug
    useEffect(() => {
        if (!initialData && title) {
            setSlug(title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [title, initialData]);

    const handleSave = async () => {
        if (!title) return toast.error("Judul wajib diisi");
        setSaving(true);
        try {
            const jsonContent = editor.getJSON();
            onSave({
                title,
                slug,
                status: initialData?.status || "draft",
                content: jsonContent
            });
        } catch (err) {
            toast.error("Gagal menyimpan");
        } finally {
            setSaving(false);
        }
    };

    const getWordCount = () => {
        if (!editor) return 0;
        const text = editor.getText();
        return text.split(/\s+/).filter(s => s.length > 0).length;
    };

    return (
        <div className="wp-editor-container">
            <div className="wp-editor-header">
                <h1 className="wp-title">Add New Post</h1>
            </div>

            <div className="wp-title-wrapper">
                <input
                    type="text"
                    className="wp-title-input"
                    placeholder="Enter title here"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <div className="wp-media-buttons">
                <button className="wp-media-btn" onClick={() => toast.success("Media library opening...")}>
                    <ImageIcon size={14} />
                    Add Media
                </button>

                <div className="wp-tabs">
                    <button
                        className={`wp-tab ${viewMode === 'visual' ? 'active' : ''}`}
                        onClick={() => setViewMode('visual')}
                    >
                        Visual
                    </button>
                    <button
                        className={`wp-tab ${viewMode === 'text' ? 'active' : ''}`}
                        onClick={() => setViewMode('text')}
                    >
                        Text
                    </button>
                </div>
            </div>

            <div className="wp-main-editor-border">
                {viewMode === 'visual' ? (
                    <>
                        <MenuBar editor={editor} />
                        <div className="wp-editor-content">
                            <EditorContent editor={editor} />
                        </div>
                    </>
                ) : (
                    <textarea
                        className="wp-text-editor"
                        value={editor?.getHTML() || ""}
                        readOnly
                    />
                )}

                <div className="wp-editor-footer">
                    <div className="wp-path">Path: p</div>
                    <div className="wp-word-count">Word count: {getWordCount()}</div>
                </div>
            </div>

            <div className="wp-action-footer">
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? "Publishing..." : "Publish"}
                </button>
                <button className="btn-cancel" onClick={onCancel}>
                    Cancel
                </button>
            </div>

            <style jsx>{`
        .wp-editor-container {
          background: #f0f0f1;
          padding: 20px;
          min-height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
          color: #3c434a;
        }

        .wp-editor-header {
            margin-bottom: 10px;
        }

        .wp-title {
          font-size: 23px;
          font-weight: 400;
          margin: 0 0 20px 0;
          color: #1d2327;
        }

        .wp-title-wrapper {
          margin-bottom: 20px;
        }

        .wp-title-input {
          width: 100%;
          padding: 10px;
          font-size: 1.7em;
          height: auto;
          background-color: #fff;
          border: 1px solid #dcdcde;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.07);
          outline: none;
        }

        .wp-title-input:focus {
          border-color: #2271b1;
          box-shadow: 0 0 0 1px #2271b1;
        }

        .wp-media-buttons {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: -1px;
          position: relative;
          z-index: 1;
        }

        .wp-media-btn {
          background: #f6f7f7;
          border: 1px solid #dcdcde;
          color: #3c434a;
          padding: 5px 10px;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          border-radius: 3px;
        }

        .wp-media-btn:hover {
          background: #f0f0f1;
          border-color: #c3c4ca;
        }

        .wp-tabs {
          display: flex;
        }

        .wp-tab {
          padding: 5px 10px;
          background: #ebebeb;
          border: 1px solid #dcdcde;
          border-bottom: none;
          font-size: 13px;
          cursor: pointer;
          color: #2271b1;
          margin-left: 5px;
        }

        .wp-tab.active {
          background: #fff;
          border-bottom: 1px solid #fff;
          color: #3c434a;
          font-weight: 400;
        }

        .wp-main-editor-border {
          background: #fff;
          border: 1px solid #dcdcde;
          box-shadow: 0 1px 1px rgba(0,0,0,0.04);
        }

        .editor-toolbar {
          padding: 8px;
          background: #f6f7f7;
          border-bottom: 1px solid #dcdcde;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .toolbar-group {
          display: flex;
          gap: 2px;
        }

        .toolbar-group button {
          background: none;
          border: 1px solid transparent;
          padding: 4px;
          cursor: pointer;
          color: #3c434a;
          border-radius: 2px;
        }

        .toolbar-group button:hover {
          background: #fff;
          border-color: #c3c4ca;
        }

        .toolbar-group button.is-active {
          background: #dcdcde;
          color: #000;
        }

        .toolbar-divider {
          width: 1px;
          height: 20px;
          background: #dcdcde;
          margin: 0 4px;
          align-self: center;
        }

        .wp-editor-content {
          min-height: 400px;
          padding: 20px;
          cursor: text;
        }

        :global(.ProseMirror) {
          outline: none;
          min-height: 400px;
        }

        :global(.ProseMirror p) {
          margin-bottom: 1em;
          line-height: 1.5;
        }

        :global(.ProseMirror blockquote) {
          border-left: 4px solid #dcdcde;
          padding-left: 15px;
          font-style: italic;
          color: #646970;
        }

        :global(.ProseMirror ul), :global(.ProseMirror ol) {
          padding-left: 30px;
          margin-bottom: 1em;
        }

        .wp-text-editor {
          width: 100%;
          min-height: 400px;
          padding: 20px;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 13px;
          border: none;
          outline: none;
          resize: vertical;
          background: #fff;
        }

        .wp-editor-footer {
          background: #f6f7f7;
          border-top: 1px solid #dcdcde;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #646970;
        }

        .wp-action-footer {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }

        .btn-save {
          background: #2271b1;
          color: #fff;
          border: none;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 3px;
          cursor: pointer;
        }

        .btn-save:hover {
          background: #135e96;
        }

        .btn-cancel {
          background: none;
          border: 1px solid #dcdcde;
          color: #d63638;
          padding: 10px 20px;
          font-size: 14px;
          border-radius: 3px;
          cursor: pointer;
        }

        .btn-cancel:hover {
          border-color: #d63638;
          background: #fcf0f1;
        }
      `}</style>
        </div>
    );
}
