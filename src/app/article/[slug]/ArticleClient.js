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
            case 'paragraph': return <div key={index} className="tiptap-p" style={{ textAlign: node.attrs?.textAlign, marginBottom: '2rem' }}>{children}</div>;
            case 'heading':
                const Tag = `h${node.attrs?.level || 1}`;
                return <Tag key={index} style={{ textAlign: node.attrs?.textAlign }}>{children}</Tag>;
            case 'bulletList': return <ul key={index}>{children}</ul>;
            case 'orderedList': return <ol key={index}>{children}</ol>;
            case 'listItem': return <li key={index}>{children}</li>;
            case 'blockquote': return <blockquote key={index}>{children}</blockquote>;
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
                            return <Tag key={index} className="rendered-h">{block.data.text}</Tag>;
                        case "paragraph":
                            return <div key={index} className="rendered-p" style={{ marginBottom: '2rem' }} dangerouslySetInnerHTML={{ __html: block.data.text }}></div>;
                        case "list":
                            const ListTag = block.data.style === "ordered" ? "ol" : "ul";
                            return (
                                <ListTag key={index} className="rendered-list">
                                    {block.data.items.map((item, i) => (
                                        <li key={i} dangerouslySetInnerHTML={{ __html: item }}></li>
                                    ))}
                                </ListTag>
                            );
                        case "checklist":
                            return (
                                <div key={index} className="rendered-checklist">
                                    {block.data.items.map((item, i) => (
                                        <div key={i} className={`checklist-item ${item.checked ? 'checked' : ''}`}>
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
                                <blockquote key={index} className="rendered-quote">
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
        <div className="learning-module-container">
            {/* Simple Standard Navbar */}
            <nav className="article-standard-nav">
                <div className="nav-container-refined">
                    <button className="back-btn-minimal" onClick={() => window.history.back()}>
                        <ArrowLeft size={18} />
                        <span>Kembali</span>
                    </button>
                    <div className="center-logo">
                        <img src="/assets/logo.png" alt="Logo" className="logo-img-small" />
                    </div>
                    <div className="empty-right"></div>
                </div>
            </nav>

            <div className="article-body-wrapper">
                <main className="article-content-container">
                    <div className="article-reading-surface">
                        <header className="article-header-clean">
                            <nav className="article-breadcrumb">
                                <span>Dashboard</span>
                                <ChevronRight size={12} />
                                <span>Education Center</span>
                                <ChevronRight size={12} />
                                <span className="active-path">{article.title}</span>
                            </nav>

                            <h1 className="article-main-title">{article.title}</h1>

                            <div className="article-meta-clean">
                                <div className="author-info">
                                    <div className="author-avatar">
                                        <img src={`https://ui-avatars.com/api/?name=${article.author}&background=0ea5e9&color=fff`} alt="Author" />
                                    </div>
                                    <span className="author-name">{article.author}</span>
                                </div>
                                <span className="meta-dot">•</span>
                                <span className="meta-item">{article.date}</span>
                                <span className="meta-dot">•</span>
                                <span className="meta-item">12 Menit Belajar</span>
                            </div>
                        </header>

                        <div className="article-prose-refined">
                            {hasMounted ? <ArticleRenderer data={article.content} /> : <div className="skeleton-loader"></div>}
                        </div>
                    </div>
                </main>
            </div>

            <style jsx>{`
                .learning-module-container {
                    background: #fff;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Inter', system-ui, sans-serif;
                }

                .article-standard-nav {
                    height: 60px;
                    background: #fff;
                    border-bottom: 1px solid #edf2f7;
                    display: flex;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .nav-container-refined {
                    max-width: 1200px;
                    width: 100%;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 2rem;
                }
                .back-btn-minimal {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    color: #4a5568;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: 0.2s;
                }
                .back-btn-minimal:hover { background: #f7fafc; color: #1a202c; }
                .logo-img-small { height: 24px; }

                .article-body-wrapper {
                    background: #fff;
                    min-height: 100vh;
                    width: 100%;
                }
                .article-content-container {
                    max-width: 850px;
                    margin: 0 auto;
                    padding: 4rem 2rem;
                }
                .article-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #a0aec0;
                    font-weight: 500;
                    margin-bottom: 1.5rem;
                }
                .active-path { color: #4299e1; }
                .article-main-title {
                    font-size: 3rem;
                    font-weight: 800;
                    color: #1a202c;
                    line-height: 1.2;
                    margin-bottom: 1.5rem;
                    letter-spacing: -0.02em;
                }
                .article-meta-clean {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 14px;
                    color: #718096;
                    margin-bottom: 3rem;
                }
                .author-info { display: flex; align-items: center; gap: 8px; color: #2d3748; font-weight: 600; }
                .author-avatar { width: 24px; height: 24px; border-radius: 50%; overflow: hidden; }
                .author-avatar img { width: 100%; height: 100%; }
                .meta-dot { color: #cbd5e1; }

                /* CONTENT PROSE */
                .article-prose-refined {
                    line-height: 1.8;
                    color: #2d3748;
                    font-size: 1.15rem;
                }
                .article-prose-refined :global(h2) {
                    font-size: 1.85rem;
                    font-weight: 700;
                    color: #1a202c;
                    margin: 3.5rem 0 1.5rem;
                }
                .article-prose-refined :global(p), .article-prose-refined :global(.rendered-p), .article-prose-refined :global(.tiptap-p) {
                    margin-bottom: 1.5rem;
                }

                /* IMAGE FIXED - SMALL & CENTERED */
                .article-figure {
                    margin: 3rem auto;
                    width: 100%;
                    max-width: 500px; /* Container max */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .article-img-refined {
                    display: block;
                    width: auto;
                    max-width: 350px; /* INI YANG BIKIN KECIL */
                    height: auto;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    margin: 0 auto;
                }
                .caption-refined {
                    margin-top: 10px;
                    font-size: 0.85rem;
                    color: #718096;
                    font-style: italic;
                    text-align: center;
                }

                .skeleton-loader {
                    width: 100%;
                    height: 400px;
                    background: #f7fafc;
                    border-radius: 12px;
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }

                @media (max-width: 640px) {
                    .article-main-title { font-size: 2rem; }
                    .article-content-container { padding: 2rem 1.25rem; }
                    .article-img-refined { max-width: 100%; }
                }
            `}</style>
        </div>
    );
}
