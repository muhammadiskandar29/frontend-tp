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
                    const content = `<img src="${readerEvent.target.result}" style="max-width: 100%; border-radius: 4px; margin: 10px 0;" />`;
                    editor.chain().focus().insertContent(content).run();
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
                            const url = window.prompt("Enter URL");
                            if (url) editor.chain().focus().setLink({ href: url }).run();
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
                types: ['heading', 'paragraph'],
            }),
        ],
        content: initialData?.content ? (typeof initialData.content === 'string' ? initialData.content : JSON.stringify(initialData.content)) : "",
        editorProps: {
            handlePaste: (view, event) => {
                const items = event.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const content = `<img src="${e.target.result}" style="max-width: 100%; border-radius: 4px; margin: 10px 0;" />`;
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

            <style jsx>{`
                .wp-classic-editor-wrapper {
                    background: #f1f1f1;
                    padding: 24px;
                    border-radius: 4px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
                    color: #444;
                }

                .wp-title-container {
                    margin-bottom: 20px;
                }

                .wp-title-input {
                    width: 100%;
                    padding: 8px 12px;
                    font-size: 1.7em;
                    line-height: normal;
                    height: auto;
                    border: 1px solid #ddd;
                    border-radius: 2px;
                    box-shadow: inset 0 1px 2px rgba(0,0,0,0.07);
                    outline: none;
                    background-color: #fff;
                    color: #32373c;
                    transition: border-color 0.05s ease-in-out;
                }
                .wp-title-input:focus { border-color: #00a0d2; box-shadow: 0 0 2px rgba(0,160,210,0.8); }
                .wp-title-input::placeholder { color: #aaa; }

                .wp-permalink-line {
                    margin: -10px 0 15px 5px;
                    font-size: 13px;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .permalink-input {
                    border: 1px solid #ddd;
                    padding: 2px 5px;
                    font-size: 13px;
                    color: #666;
                    border-radius: 2px;
                }
                .permalink-edit-btn {
                    background: #f7f7f7;
                    border: 1px solid #ccc;
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                    cursor: pointer;
                }

                .wp-editor-box {
                    background: #fff;
                    border: 1px solid #ccd0d4;
                    box-shadow: 0 1px 1px rgba(0,0,0,0.04);
                }

                /* Menubar Styles */
                .wordpress-menubar-container {
                    background: #fff;
                }
                .menubar-top-row {
                    padding: 10px 10px 0 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .wp-add-media-btn {
                    background: #f7f7f7;
                    border: 1px solid #ccc;
                    padding: 4px 10px;
                    border-radius: 3px;
                    font-size: 13px;
                    color: #555;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                    box-shadow: 0 1px 0 #ccc;
                    margin-bottom: 5px;
                }
                .wp-add-media-btn:hover { background: #fafafa; border-color: #999; color: #23282d; }

                .view-mode-switch {
                    display: flex;
                    gap: 2px;
                }
                .mode-btn {
                    padding: 5px 12px;
                    background: #ebebeb;
                    border: 1px solid #ccc;
                    border-bottom: none;
                    font-size: 13px;
                    color: #555;
                    cursor: pointer;
                    border-radius: 3px 3px 0 0;
                }
                .mode-btn.active {
                    background: #fff;
                    border-bottom: 1px solid #fff;
                    margin-bottom: -1px;
                    color: #32373c;
                }

                .wordpress-main-toolbar {
                    padding: 6px 8px;
                    background: #f7f7f7;
                    border-top: 1px solid #ccc;
                    border-bottom: 1px solid #ccc;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .toolbar-left-side { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }

                .wp-format-select {
                    padding: 2px 4px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    font-size: 13px;
                    color: #32373c;
                    background: #fff;
                    height: 28px;
                }

                .wp-divider {
                    width: 1px;
                    height: 20px;
                    background: #ddd;
                    margin: 0 4px;
                }

                .wp-toolbar-btn {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f7f7f7;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    color: #555;
                    cursor: pointer;
                    box-shadow: 0 1px 0 #ccc;
                    transition: all 0.1s;
                }
                .wp-toolbar-btn:hover { background: #fafafa; border-color: #999; color: #23282d; }
                .wp-toolbar-btn.is-active { background: #eee; border-color: #999; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
                .wp-toolbar-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                /* Content Area */
                .wp-visual-area {
                    padding: 20px 30px;
                    min-height: 450px;
                }
                .wp-text-area { padding: 0; }
                .wp-raw-textarea {
                    width: 100%;
                    min-height: 450px;
                    border: none;
                    outline: none;
                    padding: 20px;
                    font-family: Consolas, Monaco, monospace;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #32373c;
                    resize: vertical;
                    background: #fff;
                }

                :global(.ProseMirror) {
                    outline: none;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #32373c;
                }
                :global(.ProseMirror p) { margin-bottom: 1.2em; }

                .wp-editor-status-footer {
                    padding: 6px 10px;
                    background: #f7f7f7;
                    border-top: 1px solid #ccc;
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #666;
                }

                .wp-actions-floating {
                    margin-top: 20px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .btn-wp-draft {
                    background: #f7f7f7;
                    border: 1px solid #ccc;
                    padding: 8px 16px;
                    border-radius: 3px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #555;
                    cursor: pointer;
                    box-shadow: 0 1px 0 #ccc;
                }
                .btn-wp-publish {
                    background: #007cba;
                    border-color: #006799;
                    box-shadow: 0 1px 0 #006799;
                    color: #fff;
                    text-decoration: none;
                    text-shadow: 0 -1px 1px #006799, 1px 0 1px #006799, 0 1px 1px #006799, -1px 0 1px #006799;
                    padding: 8px 24px;
                    border-radius: 3px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-wp-publish:hover { background: #008ec2; border-color: #006799; color: #fff; }
                .btn-wp-publish:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>
        </div>
    );
});

export default ArticleEditor;
