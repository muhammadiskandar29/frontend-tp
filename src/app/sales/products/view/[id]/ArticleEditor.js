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
    Link as LinkIcon, AlignLeft, AlignCenter,
    AlignRight, Image as ImageIcon, Save, X,
    Maximize2, Minus, Link2Off, Keyboard,
    Undo, Redo, Code
} from "lucide-react";
import { toast } from "react-hot-toast";
import React, { useImperativeHandle, forwardRef } from "react";
import "@/styles/sales/bonus.css";
import Image from "@tiptap/extension-image";

const MenuBar = ({ editor, viewMode, setViewMode }) => {
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
                    const src = readerEvent.target.result;
                    editor.chain().focus().setImage({ src }).run();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    return (
        <div className="wordpress-menubar-container">
            {/* Media & Tabs Row */}
            <div className="menubar-top-row">
                <button className="wp-add-media-btn" onClick={addImage}>
                    <ImageIcon size={14} />
                    Add Media
                </button>
                <div className="view-mode-switch">
                    <button
                        className={`mode-btn ${viewMode === 'visual' ? 'active' : ''}`}
                        onClick={() => setViewMode('visual')}
                    >
                        Visual
                    </button>
                    <button
                        className={`mode-btn ${viewMode === 'text' ? 'active' : ''}`}
                        onClick={() => setViewMode('text')}
                    >
                        Text
                    </button>
                </div>
            </div>

            {/* Main Toolbar Row */}
            <div className="wordpress-main-toolbar">
                <div className="toolbar-left-side">
                    <select
                        className="wp-format-select"
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

                    <div className="wp-divider"></div>

                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={`wp-toolbar-btn ${editor.isActive("bold") ? "is-active" : ""}`} title="Bold"><Bold size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`wp-toolbar-btn ${editor.isActive("italic") ? "is-active" : ""}`} title="Italic"><Italic size={16} /></button>

                    <div className="wp-divider"></div>

                    <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`wp-toolbar-btn ${editor.isActive("bulletList") ? "is-active" : ""}`} title="Bulleted List"><List size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`wp-toolbar-btn ${editor.isActive("orderedList") ? "is-active" : ""}`} title="Numbered List"><ListOrdered size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`wp-toolbar-btn ${editor.isActive("blockquote") ? "is-active" : ""}`} title="Blockquote"><Quote size={16} /></button>

                    <div className="wp-divider"></div>

                    <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`wp-toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`} title="Align Left"><AlignLeft size={16} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`wp-toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`} title="Align Center"><AlignCenter size={16} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`wp-toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`} title="Align Right"><AlignRight size={16} /></button>

                    <div className="wp-divider"></div>

                    <button
                        onClick={() => {
                            let url = window.prompt("Enter URL");
                            if (url) {
                                // Simple check to add protocol if missing
                                if (!/^https?:\/\//i.test(url)) {
                                    url = 'https://' + url;
                                }
                                editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
                            }
                        }}
                        className={`wp-toolbar-btn ${editor.isActive("link") ? "is-active" : ""}`}
                        title="Insert/edit link"
                    >
                        <LinkIcon size={16} />
                    </button>
                    <button onClick={() => editor.chain().focus().unsetLink().run()} className="wp-toolbar-btn" title="Remove link" disabled={!editor.isActive("link")}><Link2Off size={16} /></button>
                    <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="wp-toolbar-btn" title="Insert Read More tag"><Minus size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleCode().run()} className={`wp-toolbar-btn ${editor.isActive("code") ? "is-active" : ""}`} title="Toolbar Toggle"><Keyboard size={16} /></button>
                </div>

                <div className="toolbar-right-side">
                    <button className="wp-toolbar-btn" title="Distraction-free writing mode"><Maximize2 size={16} /></button>
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
                types: ['heading', 'paragraph', 'image'],
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
        ],
        content: initialData?.content ? (typeof initialData.content === 'string' ? initialData.content : JSON.stringify(initialData.content)) : "",
    });

    useEffect(() => {
        if (!initialData && title) {
            setSlug(title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [title, initialData]);

    const handleSave = async () => {
        if (!title) return toast.error("Judul wajib diisi");
        setSaving(true);
        try {
            const content = editor.getHTML();
            onSave({
                title,
                slug,
                status: initialData?.status || "draft",
                content: content
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
        <div className="wp-classic-editor-wrapper">
            <div className="editor-main-layout">
                {/* Title Area */}
                <div className="wp-title-container">
                    <input
                        type="text"
                        className="wp-title-input"
                        placeholder="Enter title here"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Permalink Section */}
                {title && (
                    <div className="wp-permalink-line">
                        <strong>Permalink:</strong> <span>https://domain.com/article/</span>
                        <input
                            className="permalink-input"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                        />
                        <button className="permalink-edit-btn">Edit</button>
                    </div>
                )}

                {/* Editor Container */}
                <div className="wp-editor-box card-shadow">
                    <MenuBar editor={editor} viewMode={viewMode} setViewMode={setViewMode} />

                    <div className="wp-content-canvas">
                        {viewMode === 'visual' ? (
                            <div className="wp-visual-area">
                                <EditorContent editor={editor} />
                            </div>
                        ) : (
                            <div className="wp-text-area">
                                <textarea
                                    className="wp-raw-textarea"
                                    value={editor?.getHTML() || ""}
                                    readOnly
                                />
                            </div>
                        )}
                    </div>

                    <div className="wp-editor-status-footer">
                        <div className="word-count">Word count: {getWordCount()}</div>
                        <div className="last-edit">Last edited on {new Date().toLocaleDateString('id-ID')}</div>
                    </div>
                </div>
            </div>

            {!hideActions && (
                <div className="wp-actions-floating">
                    <button className="btn-wp-draft" onClick={() => onSave({ title, slug, status: 'draft', content: editor.getHTML() })}>
                        Save Draft
                    </button>
                    <button className="btn-wp-publish" onClick={handleSave} disabled={saving}>
                        {saving ? "Publishing..." : (initialData ? "Update" : "Publish")}
                    </button>
                </div>
            )}
        </div>
    );
});

export default ArticleEditor;
