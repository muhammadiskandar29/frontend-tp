"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { useState, useEffect } from "react";
import {
    Bold, Italic, List, ListOrdered, Quote,
    Link as LinkIcon, Type, AlignLeft, AlignCenter,
    AlignRight, Image as ImageIcon, Save, X, Eye,
    Code, Undo, Redo, Strikethrough, Minimize2,
    Heading1, Heading2, Heading3, Minus, Maximize2,
    Paperclip, ExternalLink
} from "lucide-react";
import { toast } from "react-hot-toast";
import React, { useImperativeHandle, forwardRef } from "react";

const MenuBar = ({ editor }) => {
    if (!editor) return null;

    const addImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    const content = `<img src="${readerEvent.target.result}" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />`;
                    editor.chain().focus().insertContent(content).run();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    return (
        <div className="editor-premium-toolbar">
            {/* Action Bar (Top) */}
            <div className="toolbar-top-actions">
                <button className="wp-media-btn-premium" onClick={addImage}>
                    <ImageIcon size={16} />
                    Add Media
                </button>
                <div className="toolbar-v-divider"></div>
                <button className="toolbar-round-btn" onClick={() => toast.success("Attach feature ready!")} title="Attach File">
                    <Paperclip size={18} />
                </button>
                <button className="toolbar-round-btn" onClick={() => {
                    const url = window.prompt("Enter Backlink URL");
                    if (url) editor.chain().focus().setLink({ href: url }).run();
                }} title="Backlink">
                    <ExternalLink size={18} />
                </button>
            </div>

            {/* Formatting Grid (Bottom) */}
            <div className="toolbar-main-row">
                <select
                    className="heading-select-premium"
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === "paragraph") editor.chain().focus().setParagraph().run();
                        else editor.chain().focus().toggleHeading({ level: parseInt(value) }).run();
                    }}
                    value={
                        editor.isActive("heading", { level: 1 }) ? "1" :
                            editor.isActive("heading", { level: 2 }) ? "2" :
                                editor.isActive("heading", { level: 3 }) ? "3" : "paragraph"
                    }
                >
                    <option value="paragraph">Paragraph</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                </select>

                <div className="toolbar-v-divider"></div>

                <div className="toolbar-group">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`toolbar-icon-btn ${editor.isActive("bold") ? "is-active" : ""}`}
                        title="Bold"
                    >
                        <Bold size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`toolbar-icon-btn ${editor.isActive("italic") ? "is-active" : ""}`}
                        title="Italic"
                    >
                        <Italic size={18} />
                    </button>
                </div>

                <div className="toolbar-v-divider"></div>

                <div className="toolbar-group">
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`toolbar-icon-btn ${editor.isActive("bulletList") ? "is-active" : ""}`}
                        title="Bullet List"
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`toolbar-icon-btn ${editor.isActive("orderedList") ? "is-active" : ""}`}
                        title="Ordered List"
                    >
                        <ListOrdered size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`toolbar-icon-btn ${editor.isActive("blockquote") ? "is-active" : ""}`}
                        title="Blockquote"
                    >
                        <Quote size={18} />
                    </button>
                </div>

                <div className="toolbar-v-divider"></div>

                <div className="toolbar-group">
                    <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`toolbar-icon-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`} title="Align Left">
                        <AlignLeft size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`toolbar-icon-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`} title="Align Center">
                        <AlignCenter size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`toolbar-icon-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`} title="Align Right">
                        <AlignRight size={18} />
                    </button>
                </div>

                <div className="toolbar-v-divider"></div>

                <div className="toolbar-group">
                    <button
                        onClick={() => {
                            const url = window.prompt("Enter URL");
                            if (url) editor.chain().focus().setLink({ href: url }).run();
                        }}
                        className={`toolbar-icon-btn ${editor.isActive("link") ? "is-active" : ""}`}
                        title="Link"
                    >
                        <LinkIcon size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="toolbar-icon-btn" title="Divider">
                        <Minus size={18} />
                    </button>
                </div>

                <div className="toolbar-v-divider"></div>

                <div className="toolbar-group">
                    <button onClick={() => editor.chain().focus().undo().run()} className="toolbar-icon-btn" title="Undo">
                        <Undo size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().redo().run()} className="toolbar-icon-btn" title="Redo">
                        <Redo size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ArticleEditor = forwardRef(({ initialData, onSave, onCancel, hideActions = false }, ref) => {
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
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: initialData?.content ? (typeof initialData.content === 'string' ? initialData.content : JSON.stringify(initialData.content)) : "<p>Mulai menulis...</p>",
        editorProps: {
            handlePaste: (view, event) => {
                const items = event.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const content = `<img src="${e.target.result}" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />`;
                            editor.chain().focus().insertContent(content).run();
                        };
                        reader.readAsDataURL(file);
                        return true;
                    }
                }
                return false;
            },
        },
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

    useImperativeHandle(ref, () => ({
        handleSave
    }));

    const getWordCount = () => {
        if (!editor) return 0;
        const text = editor.getText();
        return text.split(/\s+/).filter(s => s.length > 0).length;
    };

    return (
        <div className="editor-premium-wrapper">
            <div className="editor-header-glass card-shadow">
                <div className="title-row">
                    <input
                        type="text"
                        className="premium-title-input"
                        placeholder="Judul Artikel..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className="segmented-control">
                        <button
                            className={`segment-btn ${viewMode === 'visual' ? 'active' : ''}`}
                            onClick={() => setViewMode('visual')}
                        >
                            Visual
                        </button>
                        <button
                            className={`segment-btn ${viewMode === 'text' ? 'active' : ''}`}
                            onClick={() => setViewMode('text')}
                        >
                            Text
                        </button>
                    </div>
                </div>

                <div className="slug-preview-row">
                    <span className="slug-label">Permalink:</span>
                    <span className="slug-url">domain.com/article/</span>
                    <input
                        className="slug-input"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                    />
                </div>
            </div>

            <div className="editor-main-canvas card-shadow">
                {viewMode === 'visual' ? (
                    <>
                        <MenuBar editor={editor} />
                        <div className="visual-content-area">
                            <EditorContent editor={editor} />
                        </div>
                    </>
                ) : (
                    <div className="code-content-area">
                        <textarea
                            className="text-mode-textarea"
                            value={editor?.getHTML() || ""}
                            readOnly
                        />
                    </div>
                )}

                <div className="editor-footer-status">
                    <div className="status-item">
                        <Code size={14} />
                        <span>SEO Dynamic Content</span>
                    </div>
                    <div className="status-item">
                        <span>Mode: <strong>{viewMode.toUpperCase()}</strong></span>
                    </div>
                    <div className="word-count-badge">
                        {getWordCount()} kata
                    </div>
                </div>
            </div>

            {!hideActions && (
                <div className="floating-action-bar">
                    <button className="btn-cancel-glass" onClick={onCancel}>
                        <X size={18} />
                        Cancel
                    </button>
                    <button className="btn-publish-premium" onClick={handleSave} disabled={saving}>
                        {saving ? <div className="loader-small"></div> : <Save size={18} />}
                        {saving ? "Publishing..." : "Publish Article"}
                    </button>
                </div>
            )}

            <style jsx>{`
        .editor-premium-wrapper {
          padding-bottom: 80px;
          color: #1e293b;
        }

        /* Header Glass */
        .editor-header-glass {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid #f1f5f9;
        }
        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 16px;
        }
        .premium-title-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          padding: 0;
          background: transparent;
        }
        .premium-title-input::placeholder { color: #cbd5e1; }

        .segmented-control {
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          display: flex;
          gap: 2px;
        }
        .segment-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .segment-btn.active {
          background: #fff;
          color: #ff7a00;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .slug-preview-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #94a3b8;
        }
        .slug-url { color: #cbd5e1; }
        .slug-input {
          border: 1px solid transparent;
          background: #f8fafc;
          padding: 2px 8px;
          border-radius: 4px;
          color: #64748b;
          font-weight: 500;
          outline: none;
        }
        .slug-input:focus { border-color: #ff7a00; background: #fff; }

        /* Main Canvas */
        .editor-main-canvas {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #f1f5f9;
        }

        /* Toolbar Premium Redesign */
        .editor-premium-toolbar {
          background: #fff;
          padding: 0;
          border-bottom: 2px solid #f1f5f9;
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .toolbar-top-actions {
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid #f8fafc;
            background: #fff;
        }
        .wp-media-btn-premium {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 18px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .wp-media-btn-premium:hover {
            border-color: #ff7a00;
            color: #ff7a00;
            background: #fff7ed;
            transform: translateY(-1px);
        }
        
        .toolbar-main-grid {
            padding: 12px 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            background: #fafafa;
        }

        .toolbar-row {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }

        .toolbar-round-btn {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #475569;
          border-radius: 50%; /* Bulat Sempurna */
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .toolbar-round-btn:hover { 
            background: #f1f5f9; 
            color: #ff7a00; 
            border-color: #ff7a00;
            transform: scale(1.05);
        }
        .toolbar-round-btn.is-active { 
            background: #ff7a00; 
            color: #fff; 
            border-color: #ff7a00;
            box-shadow: 0 4px 12px rgba(255, 122, 0, 0.2);
        }

        .heading-select-premium {
            background: #fff;
            border: 1px solid #e2e8f0;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            outline: none;
            cursor: pointer;
            min-width: 120px;
            height: 34px;
        }
        /* Content Area */
        .visual-content-area {
          padding: 40px;
          min-height: 500px;
        }
        :global(.ProseMirror) {
          outline: none;
          font-size: 17px;
          line-height: 1.6; /* Deeper Spacing Fixed */
          color: #334155;
        }
        :global(.ProseMirror p) { 
            margin-bottom: 0.6em; /* Spacing Enter dideketin */
            margin-top: 0;
        }
        :global(.ProseMirror h1) { font-size: 2.2em; font-weight: 800; margin-bottom: 0.8em; color: #0f172a; }
        :global(.ProseMirror h2) { font-size: 1.8em; font-weight: 700; margin-bottom: 0.8em; color: #0f172a; margin-top: 1.2em; }
        :global(.ProseMirror h3) { font-size: 1.4em; font-weight: 700; margin-bottom: 0.8em; color: #0f172a; margin-top: 1.2em; }
        
        :global(.ProseMirror ul) {
          list-style-type: disc;
          padding-left: 1.5em;
          margin-bottom: 1.5em;
        }
        :global(.ProseMirror ol) {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin-bottom: 1.5em;
        }
        :global(.ProseMirror li) {
          margin-bottom: 0.5em;
        }

        :global(.ProseMirror hr) {
          border: none;
          border-top: 2px dashed #e2e8f0;
          margin: 2em 0;
          position: relative;
        }
        :global(.ProseMirror hr::after) {
          content: 'READ MORE';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          padding: 0 10px;
          font-size: 10px;
          font-weight: 800;
          color: #cbd5e1;
        }

        :global(.ProseMirror blockquote) {
          border-left: 4px solid #ff7a00;
          margin: 2em 0;
          padding: 20px 30px;
          background: #fffaf5;
          font-size: 18px;
          font-style: italic;
          border-radius: 0 12px 12px 0;
        }

        .code-content-area { background: #0f172a; padding: 20px; }
        .text-mode-textarea {
          width: 100%;
          min-height: 500px;
          background: transparent;
          border: none;
          outline: none;
          color: #94a3b8;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1.6;
          resize: none;
        }

        /* Footer Status */
        .editor-footer-status {
          padding: 12px 24px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #94a3b8;
        }
        .status-item { display: flex; align-items: center; gap: 6px; }
        .word-count-badge {
          background: #fff;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-weight: 600;
        }

        /* Floating Action Bar */
        .floating-action-bar {
          position: fixed;
          bottom: 30px;
          right: 30px;
          display: flex;
          gap: 12px;
          z-index: 100;
        }
        .btn-cancel-glass {
          background: #fff;
          border: 1px solid #e2e8f0;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .btn-cancel-glass:hover { transform: translateY(-2px); border-color: #ef4444; color: #ef4444; }

        .btn-publish-premium {
          background: #ff7a00;
          border: none;
          padding: 12px 30px;
          border-radius: 14px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(255, 122, 0, 0.3);
          transition: all 0.2s;
        }
        .btn-publish-premium:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(255, 122, 0, 0.4); }
        .btn-publish-premium:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .loader-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
});

export default ArticleEditor;
