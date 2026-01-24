"use client";

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { toast } from "react-hot-toast";
import {
    Bold, Italic, List, ListOrdered, Quote, AlignLeft,
    AlignCenter, AlignRight, Link, Image as ImageIcon,
    MoreHorizontal, Undo, Redo, Strikethrough, ChevronDown
} from "lucide-react";
import "@/styles/sales/bonus.css";

// Editor.js core and plugins
let EditorJS;
let Header;
let ListBlock;
let Table;
let ImageBlock;
let Checklist;
let QuoteBlock;
let Code;
let Delimiter;
let InlineCode;
let Marker;
let Embed;

const ArticleEditor = forwardRef(({ initialData, onSave, onCancel, hideActions = false }, ref) => {
    const [title, setTitle] = useState(initialData?.title || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [saving, setSaving] = useState(false);
    const [editorLoaded, setEditorLoaded] = useState(false);

    const editorInstance = useRef(null);
    const editorContainerRef = useRef(null);

    // Initialize Editor.js
    useEffect(() => {
        const initEditor = async () => {
            try {
                if (!EditorJS) {
                    // Dynamically import to avoid SSR issues
                    const [
                        EditorJSModule,
                        HeaderModule,
                        ListModule,
                        TableModule,
                        ImageModule,
                        ChecklistModule,
                        QuoteModule,
                        CodeModule,
                        DelimiterModule,
                        InlineCodeModule,
                        MarkerModule,
                        EmbedModule
                    ] = await Promise.all([
                        import("@editorjs/editorjs"),
                        import("@editorjs/header"),
                        import("@editorjs/list"),
                        import("@editorjs/table"),
                        import("@editorjs/image"),
                        import("@editorjs/checklist"),
                        import("@editorjs/quote"),
                        import("@editorjs/code"),
                        import("@editorjs/delimiter"),
                        import("@editorjs/inline-code"),
                        import("@editorjs/marker"),
                        import("@editorjs/embed")
                    ]);

                    EditorJS = EditorJSModule.default;
                    Header = HeaderModule.default;
                    ListBlock = ListModule.default;
                    Table = TableModule.default;
                    ImageBlock = ImageModule.default;
                    Checklist = ChecklistModule.default;
                    QuoteBlock = QuoteModule.default;
                    Code = CodeModule.default;
                    Delimiter = DelimiterModule.default;
                    InlineCode = InlineCodeModule.default;
                    Marker = MarkerModule.default;
                    Embed = EmbedModule.default;
                }

                if (!editorInstance.current && editorContainerRef.current) {
                    let initialBlocks = {};
                    if (initialData?.content) {
                        try {
                            const parsed = typeof initialData.content === 'string'
                                ? JSON.parse(initialData.content)
                                : initialData.content;

                            if (Array.isArray(parsed)) {
                                initialBlocks = { blocks: parsed };
                            } else {
                                initialBlocks = parsed;
                            }

                            if (!initialBlocks || !initialBlocks.blocks) {
                                initialBlocks = { blocks: [] };
                            }
                        } catch (e) {
                            console.warn("Failed to parse content:", e);
                            initialBlocks = { blocks: [] };
                        }
                    }

                    const editor = new EditorJS({
                        holder: editorContainerRef.current,
                        tools: {
                            header: { class: Header, inlineToolbar: true },
                            list: { class: ListBlock, inlineToolbar: true },
                            image: { class: ImageBlock },
                            quote: { class: QuoteBlock, inlineToolbar: true },
                            delimiter: Delimiter,
                        },
                        data: initialBlocks,
                        placeholder: 'Tulis artikel Anda di sini...',
                        minHeight: 300,
                        onReady: () => {
                            editorInstance.current = editor;
                            setEditorLoaded(true);
                        }
                    });
                }
            } catch (error) {
                console.error("Editor.js initialization failed:", error);
                toast.error("Gagal memuat editor");
            }
        };

        if (typeof window !== "undefined") {
            initEditor();
        }

        return () => {
            if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
                // editorInstance.current.destroy(); // Sometimes causes issues in Dev HMR
            }
        };
    }, [initialData]);

    // Slug generation
    useEffect(() => {
        if (!initialData && title) {
            setSlug(title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [title, initialData]);

    const handleSave = async (forceStatus = null) => {
        if (!title) return toast.error("Judul wajib diisi");
        if (!editorInstance.current) return toast.error("Editor belum siap");

        setSaving(true);
        try {
            const savedData = await editorInstance.current.save();
            onSave({
                title,
                slug,
                status: forceStatus || initialData?.status || "draft",
                content: savedData.blocks || []
            });
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Gagal menyimpan");
        } finally {
            setSaving(false);
        }
    };

    useImperativeHandle(ref, () => ({ handleSave }));

    return (
        <div className="wp-classic-layout">
            {/* 1. Title Input Area */}
            <div className="wp-title-section">
                <input
                    type="text"
                    className="wp-title-input"
                    placeholder="Enter title here"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            
            {/* 2. Permalink Area */}
            {title && (
                <div className="wp-permalink-line">
                    <span className="text-gray-500 text-sm">Permalink: </span>
                    <a href="#" className="text-blue-600 text-sm hover:underline">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/article/{slug}
                    </a>
                    <button className="wp-btn-small ml-2">Edit</button>
                </div>
            )}

            {/* 3. Add Media Button */}
            <div className="wp-media-section mt-4 mb-2">
                <button className="wp-add-media-btn">
                    <ImageIcon size={14} style={{marginRight: 6}} /> 
                    Add Media
                </button>
            </div>

            {/* 4. Main Editor Container (The Box) */}
            <div className="wp-editor-frame">
                {/* Visual / Text Tabs */}
                <div className="wp-editor-tabs">
                    <button className="wp-tab active">Visual</button>
                    <button className="wp-tab">Text</button>
                </div>

                {/* Toolbar */}
                <div className="wp-toolbar">
                    <div className="wp-toolbar-row">
                        <button className="wp-tool-btn dropdown" title="Paragraph">Paragraph <ChevronDown size={10} /></button>
                        <button className="wp-tool-btn" title="Bold"><Bold size={14} /></button>
                        <button className="wp-tool-btn" title="Italic"><Italic size={14} /></button>
                        <button className="wp-tool-btn" title="Bulleted List"><List size={14} /></button>
                        <button className="wp-tool-btn" title="Numbered List"><ListOrdered size={14} /></button>
                        <button className="wp-tool-btn" title="Blockquote"><Quote size={14} /></button>
                        <button className="wp-tool-btn" title="Align Left"><AlignLeft size={14} /></button>
                        <button className="wp-tool-btn" title="Align Center"><AlignCenter size={14} /></button>
                        <button className="wp-tool-btn" title="Align Right"><AlignRight size={14} /></button>
                        <button className="wp-tool-btn" title="Insert/edit link"><Link size={14} /></button>
                        <button className="wp-tool-btn" title="Read More">Insert Read More tag</button>
                        <button className="wp-tool-btn" title="Toolbar Toggle"><MoreHorizontal size={14} /></button>
                    </div>
                </div>

                {/* The Editor Area */}
                <div className="wp-editor-content-area" onClick={() => editorInstance.current?.focus?.()}>
                    {!editorLoaded && <div className="p-4 text-gray-400">Loading editor...</div>}
                    <div ref={editorContainerRef} className="editorjs-override"></div>
                </div>

                {/* Status Bar */}
                <div className="wp-editor-footer">
                    <div className="text-xs text-gray-500">
                        p
                    </div>
                </div>
            </div>

            {/* 5. Publish Actions (Optional Sidebar Simulation) */}
            {!hideActions && (
                <div className="wp-publish-actions mt-6 p-4 bg-white border border-gray-300">
                    <div className="flex justify-between items-center mb-4">
                        <button className="text-red-600 text-sm hover:underline">Move to Trash</button>
                        <button 
                            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                            onClick={() => handleSave('published')}
                            disabled={saving}
                        >
                            {saving ? 'Publishing...' : 'Publish'}
                        </button>
                    </div>
                                </div>
                            </div>
                            <div className="wp-box-footer">
                                <button className="btn-wp-link-delete">Move to Trash</button>
                                <button
                                    className="btn-wp-primary-publish"
                                    onClick={() => handleSave('published')}
                                    disabled={saving}
                                >
                                    {saving ? "Publishing..." : "Publish"}
                                </button>
                            </div>
                        </div >
                    )}

<div className="wp-meta-box card-shadow">
    <div className="wp-box-header">
        <h3>Categories</h3>
    </div>
    <div className="wp-box-content" style={{ maxHeight: '150px', overflowY: 'auto' }}>
        <div style={{ padding: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}><input type="checkbox" /> Uncategorized</label>
            <label style={{ display: 'block', marginBottom: '5px' }}><input type="checkbox" /> News</label>
            <label style={{ display: 'block', marginBottom: '5px' }}><input type="checkbox" /> Updates</label>
        </div>
    </div>
</div>
                </div >
            </div >

    <style jsx global>{`
                /* WP Admin Like Styles */
                .wp-classic-layout {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
                    background-color: #f1f1f1;
                    padding: 20px;
                    min-height: 100vh;
                    color: #3c434a;
                }
                .wp-header h2 {
                    font-size: 23px;
                    font-weight: 400;
                    padding: 9px 0 4px 0;
                    line-height: 1.3;
                    color: #1d2327;
                    margin-bottom: 20px;
                }
                .wp-grid-container {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                .wp-main-column {
                    flex: 1; /* Takes remaining width */
                    min-width: 60%;
                }
                .wp-sidebar-column {
                    width: 280px;
                    flex-shrink: 0;
                }

                /* Title Input */
                .wp-title-wrapper {
                    margin-bottom: 20px;
                }
                .wp-title-input {
                    padding: 3px 8px;
                    font-size: 1.7em;
                    line-height: 100%;
                    height: 1.7em;
                    width: 100%;
                    outline: 0;
                    margin: 0;
                    background-color: #fff;
                    border: 1px solid #8c8f94;
                    box-shadow: 0 0 0 transparent;
                    border-radius: 4px;
                    transition: box-shadow .1s linear;
                }
                .wp-title-input:focus {
                    border-color: #2271b1;
                    box-shadow: 0 0 0 1px #2271b1;
                }

                /* Permalink */
                .wp-permalink {
                    font-size: 13px;
                    line-height: 1.5;
                    color: #646970;
                    margin-bottom: 20px;
                    margin-top: -10px;
                }
                .permalink-slug {
                    font-weight: 600;
                    color: #1d2327;
                }
                .permalink-edit-btn {
                    background: none;
                    border: none;
                    color: #2271b1;
                    font-size: 11px;
                    text-decoration: underline;
                    cursor: pointer;
                    margin-left: 5px;
                }

                /* Toolbar Area */
                .wp-toolbar-area {
                    margin-bottom: 10px;
                }
                .wp-add-media-btn {
                    background: #f6f7f7;
                    border-color: #2271b1;
                    color: #2271b1;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    font-size: 13px;
                    line-height: 2.15384615;
                    min-height: 30px;
                    margin: 0;
                    padding: 0 10px;
                    cursor: pointer;
                    border-width: 1px;
                    border-style: solid;
                    appearance: none;
                    border-radius: 3px;
                    white-space: nowrap;
                    font-weight: 600;
                }
                .wp-add-media-btn:hover {
                    background: #f0f0f1;
                    border-color: #0a4b78;
                    color: #0a4b78;
                }

                /* Editor Box */
                .wp-editor-container {
                    background: #fff;
                    border: 1px solid #c3c4c7;
                    min-height: 400px;
                    position: relative;
                }
                .wp-editor-content {
                    padding: 20px;
                    min-height: 400px;
                }
                .wp-word-count {
                    padding: 8px 12px;
                    background: #f6f7f7;
                    border-top: 1px solid #dcdcde;
                    font-size: 12px;
                    color: #646970;
                }

                /* Sidebar Meta Box */
                .wp-meta-box {
                    background: #fff;
                    border: 1px solid #c3c4c7;
                    margin-bottom: 20px;
                }
                .wp-box-header {
                    border-bottom: 1px solid #c3c4c7;
                    padding: 8px 12px;
                }
                .wp-box-header h3 {
                    font-size: 14px;
                    font-weight: 600;
                    margin: 0;
                    color: #1d2327;
                }
                .wp-box-content {
                    padding: 12px;
                    font-size: 13px;
                }
                .wp-box-footer {
                    background: #f6f7f7;
                    border-top: 1px solid #c3c4c7;
                    padding: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .wp-misc-actions {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                .wp-status-info p {
                    margin: 8px 0;
                    color: #3c434a;
                }

                /* Buttons */
                .btn-wp-simple {
                    background: #f6f7f7;
                    border: 1px solid #c3c4c7;
                    color: #2271b1;
                    font-size: 13px;
                    padding: 4px 10px;
                    cursor: pointer;
                    border-radius: 3px;
                }
                .btn-wp-simple:hover {
                    background: #f0f0f1;
                    border-color: #8c8f94;
                    color: #0a4b78;
                }
                .btn-wp-primary-publish {
                    background: #2271b1;
                    border-color: #2271b1;
                    color: #fff;
                    text-decoration: none;
                    text-shadow: none;
                    display: inline-block;
                    font-size: 13px;
                    line-height: 2.15384615;
                    min-height: 30px;
                    margin: 0;
                    padding: 0 10px;
                    cursor: pointer;
                    border-width: 1px;
                    border-style: solid;
                    appearance: none;
                    border-radius: 3px;
                    white-space: nowrap;
                    font-weight: 600;
                }
                .btn-wp-primary-publish:hover {
                    background: #135e96;
                    border-color: #135e96;
                }
                .btn-wp-primary-publish:disabled {
                    background: #a7aaad !important;
                    border-color: #a7aaad !important;
                    color: #fff !important;
                    cursor: default;
                }
                .btn-wp-link-delete {
                    color: #a00;
                    text-decoration: none;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 0;
                }
                .btn-wp-link-delete:hover {
                    color: #dc3232;
                }

                /* EditorJS overrides to fit WP theme */
                .codex-editor__redactor {
                    padding-bottom: 50px !important;
                    margin-right: 0 !important;
                }
                .ce-block__content {
                    max-width: 100% !important; /* Full width like classic editor */
                    padding: 0 !important;
                }
                .ce-toolbar__content {
                    max-width: 100% !important;
                }
                .ce-popover {
                    z-index: 9999;
                }
            `}</style>
        </div >
    );
});

export default ArticleEditor;
