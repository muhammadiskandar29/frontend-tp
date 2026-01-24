"use client";

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { toast } from "react-hot-toast";
import "@/styles/sales/bonus.css";

// Editor.js core and plugins
let EditorJS;
let Header;
let List;
let Table;
let Image;
let Checklist;
let Quote;
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
                    List = ListModule.default;
                    Table = TableModule.default;
                    Image = ImageModule.default;
                    Checklist = ChecklistModule.default;
                    Quote = QuoteModule.default;
                    Code = CodeModule.default;
                    Delimiter = DelimiterModule.default;
                    InlineCode = InlineCodeModule.default;
                    Marker = MarkerModule.default;
                    Embed = EmbedModule.default;
                }

                if (!editorInstance.current && editorContainerRef.current) {
                    // Parse data jika string
                    let initialBlocks = {};
                    if (initialData?.content) {
                        try {
                            initialBlocks = typeof initialData.content === 'string'
                                ? JSON.parse(initialData.content)
                                : initialData.content;

                            // Pastikan jika structure-nya bukan Editor.js tapi HTML, kita handle
                            if (typeof initialBlocks === 'string' || !initialBlocks.blocks) {
                                console.warn("Content detected as HTML or non-block format, clearing for new Editor.js instance");
                                initialBlocks = { blocks: [] };
                            }
                        } catch (e) {
                            initialBlocks = { blocks: [] };
                        }
                    }

                    const editor = new EditorJS({
                        holder: editorContainerRef.current,
                        tools: {
                            header: {
                                class: Header,
                                shortcut: 'CMD+SHIFT+H',
                                config: {
                                    levels: [1, 2, 3, 4],
                                    defaultLevel: 2
                                },
                                inlineToolbar: true
                            },
                            list: {
                                class: List,
                                inlineToolbar: true,
                            },
                            checklist: {
                                class: Checklist,
                                inlineToolbar: true,
                            },
                            table: {
                                class: Table,
                                inlineToolbar: true,
                            },
                            quote: {
                                class: Quote,
                                inlineToolbar: true,
                                config: {
                                    quotePlaceholder: 'Enter a quote',
                                    captionPlaceholder: 'Quote\'s author',
                                },
                            },
                            code: Code,
                            delimiter: Delimiter,
                            inlineCode: InlineCode,
                            marker: Marker,
                            embed: Embed,
                            image: {
                                class: Image,
                                config: {
                                    endpoints: {
                                        byFile: '/api/sales/upload/image',
                                        byUrl: '/api/sales/upload/image-url',
                                    }
                                }
                            }
                        },
                        data: initialBlocks,
                        placeholder: 'Mulai tulis artikel edukasi Anda di sini...',
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
            // ✅ Output Editor.js : { time, blocks: [...], version }
            const savedData = await editorInstance.current.save();

            // Backend validasi "The content must be an array"
            // Laravel akan menerima object ini sebagai associative array.
            // Namun jika backend secara spesifik mengharapkan array of blocks, 
            // kita bisa sesuaikan. Tapi biasanya standard Editor.js adalah satu object utuh.
            onSave({
                title,
                slug,
                status: forceStatus || initialData?.status || "draft",
                content: savedData
            });
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Gagal mengambil data dari editor");
        } finally {
            setSaving(false);
        }
    };

    useImperativeHandle(ref, () => ({
        handleSave
    }));

    return (
        <div className="wp-classic-editor-wrapper">
            <div className="editor-main-layout">
                {/* Title Area */}
                <div className="wp-title-container">
                    <input
                        type="text"
                        className="wp-title-input"
                        placeholder="Judul Artikel Bonus"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Permalink Section */}
                {title && (
                    <div className="wp-permalink-line">
                        <strong>Permalink:</strong> <span>/article/{slug || '...'}</span>
                        <input
                            className="permalink-input"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                        />
                    </div>
                )}

                {/* Editor Container */}
                <div className="wp-editor-box card-shadow" style={{ minHeight: '500px', padding: '40px 60px', backgroundColor: '#fff' }}>
                    {!editorLoaded && (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                            <div className="spinner-orange" style={{ marginBottom: '10px' }}></div>
                            <p style={{ color: '#64748b' }}>Menyiapkan Editor...</p>
                        </div>
                    )}
                    <div ref={editorContainerRef} className="editorjs-content-wrapper"></div>
                </div>
            </div>

            {!hideActions && (
                <div className="wp-actions-floating">
                    <button
                        className="btn-wp-draft"
                        onClick={() => handleSave('draft')}
                        disabled={saving}
                    >
                        Simpan Draft
                    </button>
                    <button
                        className="btn-wp-publish"
                        onClick={() => handleSave('published')}
                        disabled={saving}
                    >
                        {saving ? "Menyimpan..." : (initialData ? "Simpan Perubahan" : "Terbitkan Artikel")}
                    </button>
                </div>
            )}

            <style jsx global>{`
                .editorjs-content-wrapper {
                    width: 100%;
                }
                /* Menghilangkan padding default Editor.js agar memenuhi kontainer */
                .codex-editor__redactor {
                    padding-bottom: 50px !important;
                }
                /* Memastikan toolbar mengikuti lebar penuh */
                .ce-block__content, .ce-toolbar__content {
                    max-width: 90% !important;
                }
                .ce-header {
                    font-weight: 800;
                    margin-top: 1.5em;
                }
                .spinner-orange {
                    width: 30px;
                    height: 30px;
                    border: 3px solid #f1f5f9;
                    border-top: 3px solid #ff7a00;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
});

export default ArticleEditor;
