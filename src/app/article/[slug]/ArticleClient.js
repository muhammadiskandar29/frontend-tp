"use client";

import React, { useState, useEffect } from "react";
import {
    Calendar, User, ArrowLeft, BookOpen, Clock, ChevronRight,
    FileText, PlayCircle, CheckCircle, Lock
} from "lucide-react";
import { useRouter } from "next/navigation";

// Premium custom renderer for Learning Content
const ArticleRenderer = ({ data }) => {
    if (!data) return null;

    let contentObj;
    try {
        contentObj = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        return <div className="article-prose-content" dangerouslySetInnerHTML={{ __html: data }} />;
    }

    if (!contentObj) return null;

    const renderTiptapNode = (node, index) => {
        if (!node) return null;
        if (node.type === 'text') {
            let content = node.text;
            if (node.marks) {
                node.marks.forEach(mark => {
                    if (mark.type === 'bold') content = <strong key={index}>{content}</strong>;
                    if (mark.type === 'italic') content = <em key={index}>{content}</em>;
                    if (mark.type === 'underline') content = <u key={index}>{content}</u>;
                    if (mark.type === 'link') content = <a key={index} href={mark.attrs.href} target="_blank" rel="noopener">{content}</a>;
                });
            }
            return content;
        }

        const children = node.content ? node.content.map((child, i) => renderTiptapNode(child, i)) : null;

        switch (node.type) {
            case 'doc': return <div key={index} className="article-tiptap-content">{children}</div>;
            case 'paragraph': return <div key={index} className="tiptap-p" style={{ textAlign: node.attrs?.textAlign || 'center', marginBottom: '1.5rem' }}>{children}</div>;
            case 'heading':
                const Tag = `h${node.attrs?.level || 1}`;
                return <Tag key={index} style={{ textAlign: node.attrs?.textAlign || 'center' }}>{children}</Tag>;
            case 'bulletList': return <ul key={index} style={{ display: 'inline-block', textAlign: 'left' }}>{children}</ul>;
            case 'orderedList': return <ol key={index} style={{ display: 'inline-block', textAlign: 'left' }}>{children}</ol>;
            case 'listItem': return <li key={index}>{children}</li>;
            case 'blockquote': return <blockquote key={index} style={{ textAlign: 'center' }}>{children}</blockquote>;
            case 'image':
                return (
                    <figure key={index} className="article-figure" style={{ textAlign: node.attrs?.textAlign || 'center' }}>
                        <img src={node.attrs.src} alt={node.attrs.alt} className="article-img-refined" />
                        {node.attrs.title && <figcaption className="caption-refined">{node.attrs.title}</figcaption>}
                    </figure>
                );
            case 'horizontalRule': return <hr key={index} className="prose-hr" />;
            case 'hardBreak': return <br key={index} />;
            default: return null;
        }
    };

    if (contentObj.type === 'doc') {
        return <div className="article-renderer tiptap">{renderTiptapNode(contentObj, 0)}</div>;
    }

    if (contentObj.blocks) {
        return (
            <div className="article-renderer editorjs">
                {contentObj.blocks.map((block, index) => {
                    switch (block.type) {
                        case "header":
                            const Tag = `h${block.data.level || 2}`;
                            return <Tag key={index} className="rendered-h text-center">{block.data.text}</Tag>;
                        case "paragraph":
                            return <div key={index} className="rendered-p text-center" style={{ marginBottom: '1.5rem' }} dangerouslySetInnerHTML={{ __html: block.data.text }}></div>;
                        case "list":
                            const ListTag = block.data.style === "ordered" ? "ol" : "ul";
                            return (
                                <div key={index} className="text-center">
                                    <ListTag className="rendered-list inline-block text-left">
                                        {block.data.items.map((item, i) => (
                                            <li key={i} dangerouslySetInnerHTML={{ __html: item }}></li>
                                        ))}
                                    </ListTag>
                                </div>
                            );
                        case "checklist":
                            return (
                                <div key={index} className="rendered-checklist">
                                    {block.data.items.map((item, i) => (
                                        <div key={i} className={`checklist-item ${item.checked ? 'checked' : ''} justify-center`}>
                                            <div className="custom-checkbox">{item.checked && <CheckCircle size={14} />}</div>
                                            <span dangerouslySetInnerHTML={{ __html: item.text }}></span>
                                        </div>
                                    ))}
                                </div>
                            );
                        case "table":
                            return (
                                <div key={index} className="table-wrapper">
                                    <table className="rendered-table">
                                        <tbody>
                                            {block.data.content.map((row, i) => (
                                                <tr key={i}>
                                                    {row.map((cell, j) => (
                                                        block.data.withHeadings && i === 0
                                                            ? <th key={j} dangerouslySetInnerHTML={{ __html: cell }}></th>
                                                            : <td key={j} dangerouslySetInnerHTML={{ __html: cell }}></td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        case "image":
                            return (
                                <figure key={index} className="article-figure" style={{ textAlign: 'center' }}>
                                    <img
                                        src={block.data.file?.url || "/placeholder.jpg"}
                                        alt={block.data.caption}
                                        className="article-img-refined"
                                    />
                                    {block.data.caption && <figcaption className="caption-refined">{block.data.caption}</figcaption>}
                                </figure>
                            );
                        case "quote":
                            return (
                                <blockquote key={index} className="rendered-quote text-center">
                                    <div className="quote-icon">“</div>
                                    <p>{block.data.text}</p>
                                    {block.data.caption && <footer>— {block.data.caption}</footer>}
                                </blockquote>
                            );
                        case "delimiter":
                            return <div key={index} className="rendered-divider"><span>•••</span></div>;
                        default:
                            return null;
                    }
                })}
            </div>
        );
    }
    return null;
};

export default function ArticleClient({ article }) {
    const router = useRouter();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!article) return null;

    return (
        <div className="article-page-root">
            {/* Navbar Refactored */}
            <nav className="navbar-standard">
                <div className="nav-inner">
                    <div className="nav-left-branding">
                        <img src="/assets/logo.png" alt="Logo" className="logo-main" />
                    </div>
                    <div className="nav-right-actions">
                        <button className="back-btn-pill" onClick={() => window.history.back()}>
                            <ArrowLeft size={16} />
                            <span>Kembali</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="article-scroll-area">
                <main className="article-center-layout">
                    <div className="article-content-wrapper">
                        <header className="article-header-centered">
                            <nav className="article-breadcrumb-centered">
                                <span>Dashboard</span>
                                <ChevronRight size={12} />
                                <span>Education Center</span>
                                <ChevronRight size={12} />
                                <span className="current-path">{article.title}</span>
                            </nav>

                            <h1 className="article-display-title">{article.title}</h1>

                            <div className="article-author-meta-centered">
                                <div className="author-pill">
                                    <div className="author-img-frame">
                                        <img src={`https://ui-avatars.com/api/?name=${article.author}&background=0ea5e9&color=fff`} alt="Author" />
                                    </div>
                                    <span className="author-label">{article.author}</span>
                                </div>
                                <span className="meta-divider">•</span>
                                <span className="meta-text">{article.date}</span>
                                <span className="meta-divider">•</span>
                                <span className="meta-text">12 Menit Belajar</span>
                            </div>
                        </header>

                        <div className="article-body-centered">
                            {hasMounted ? (
                                <div className="content-render-target">
                                    <ArticleRenderer data={article.content} />
                                </div>
                            ) : (
                                <div className="skeleton-placeholder"></div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <style jsx>{`
                .article-page-root {
                    background: #fff;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }

                /* NAVBAR REFACTORED */
                .navbar-standard {
                    height: 70px;
                    background: #fff;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    width: 100%;
                }
                .nav-inner {
                    width: 100%;
                    padding: 0 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .logo-main {
                    height: 32px; /* Lebih besar sedikit */
                    width: auto;
                    display: block;
                }
                .back-btn-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    padding: 8px 16px;
                    border-radius: 50px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .back-btn-pill:hover {
                    background: #f1f5f9;
                    color: #1e293b;
                    border-color: #cbd5e1;
                }

                /* CENTERED LAYOUT */
                .article-scroll-area {
                    flex: 1;
                    width: 100%;
                }
                .article-center-layout {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 5rem 1.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center; /* Rata tengah container */
                }
                .article-content-wrapper {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                /* HEADER CENTERED */
                .article-header-centered {
                    text-align: center;
                    margin-bottom: 4rem;
                    width: 100%;
                }
                .article-breadcrumb-centered {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #94a3b8;
                    font-weight: 500;
                    margin-bottom: 2rem;
                }
                .current-path { color: #0ea5e9; }
                .article-display-title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    color: #0f172a;
                    line-height: 1.1;
                    margin-bottom: 2rem;
                    letter-spacing: -0.02em;
                }
                .article-author-meta-centered {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    font-size: 14px;
                    color: #64748b;
                }
                .author-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #1e293b;
                    font-weight: 600;
                }
                .author-img-frame { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; }
                .author-img-frame img { width: 100%; height: 100%; }
                .meta-divider { color: #e2e8f0; }

                /* BODY CENTERED */
                .article-body-centered {
                    width: 100%;
                    text-align: center; /* Paksa konten text rata tengah */
                }
                .content-render-target {
                    line-height: 1.8;
                    color: #334155;
                    font-size: 1.15rem;
                }

                /* LOGIC RATA TENGAH UNTUK ELEMEN KHUSUS */
                :global(.text-center) { text-align: center !important; }
                :global(.inline-block) { display: inline-block !important; }
                :global(.justify-center) { justify-content: center !important; }

                /* IMAGE - KECIL & CENTERED */
                :global(.article-figure) {
                    margin: 3rem auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                :global(.article-img-refined) {
                    display: block;
                    width: auto;
                    max-width: 320px; /* Lebih kecil lagi sesuai permintaan */
                    height: auto;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    margin: 0 auto;
                }
                :global(.caption-refined) {
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    color: #94a3b8;
                    font-style: italic;
                }

                /* OTHER TYPOGRAPHY */
                :global(.rendered-h), :global(h2) {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 3rem 0 1.5rem;
                    line-height: 1.3;
                }
                :global(blockquote) {
                    margin: 3rem auto;
                    padding: 2rem;
                    background: #f8fafc;
                    border-radius: 16px;
                    font-style: italic;
                    color: #475569;
                    max-width: 90%;
                }

                .skeleton-placeholder {
                    width: 100%;
                    height: 500px;
                    background: #f1f5f9;
                    border-radius: 20px;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }

                @media (max-width: 768px) {
                    .article-display-title { font-size: 2.5rem; }
                    .article-center-layout { padding: 3rem 1.25rem; }
                }
            `}</style>
        </div>
    );
}
