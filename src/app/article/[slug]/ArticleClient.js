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
            {/* Header / Navbar Premium */}
            <nav className="module-nav">
                <div className="nav-wrapper">
                    <div className="nav-left">
                        <button className="back-button" onClick={() => window.history.back()}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="brand-logo">
                            <img src="/assets/logo.png" alt="Logo" className="logo-img" />
                        </div>
                    </div>
                </div>
            </nav>

            <div className="article-main-layout">
                {/* Main Content Area */}
                <main className="content-module-area">
                    <div className="reading-container">
                        <header className="module-header">
                            <nav className="breadcrumb-nav">
                                <span>Dashboard</span> <ChevronRight size={12} />
                                <span>Education Center</span> <ChevronRight size={12} />
                                <span className="active-breadcrumb">{article.title}</span>
                            </nav>
                            <h1 className="content-title">{article.title}</h1>
                            <div className="content-meta">
                                <div className="meta-box">
                                    <div className="meta-user">
                                        <div className="avatar-mini">
                                            <img src={`https://ui-avatars.com/api/?name=${article.author}&background=0ea5e9&color=fff`} alt="Author" />
                                        </div>
                                        <span>{article.author}</span>
                                    </div>
                                    <div className="meta-sep"></div>
                                    <div className="meta-date">
                                        <Calendar size={14} />
                                        <span>{article.date}</span>
                                    </div>
                                    <div className="meta-sep"></div>
                                    <div className="meta-timer">
                                        <Clock size={14} />
                                        <span>12 Menit Belajar</span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <div className="prose-body">
                            {hasMounted ? <ArticleRenderer data={article.content} /> : <div className="animate-pulse bg-gray-100 h-64 rounded-xl"></div>}
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

                /* Navbar Style */
                .module-nav {
                    height: 72px;
                    background: #fff;
                    border-bottom: 1px solid #f1f5f9;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    padding: 0 1.5rem;
                }
                .nav-wrapper { width: 100%; display: flex; justify-content: space-between; align-items: center; }
                .nav-left { display: flex; align-items: center; gap: 1.25rem; }
                .back-button { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: 0.2s; }
                .back-button:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
                .logo-img { height: 28px; width: auto; }

                .module-badge { background: #fffbeb; border: 1px solid #fde68a; padding: 6px 14px; border-radius: 50px; display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; }
                .icon-gold { color: #f59e0b; }
                /* Layout Grid */
                .lesson-icon { width: 40px; height: 40px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; }
                .active .lesson-icon { background: #3b82f6; color: white; }
                .lesson-meta { flex: 1; display: flex; flex-direction: column; gap: 4px; }
                .lesson-title { font-size: 14px; font-weight: 700; color: #1e293b; line-height: 1.4; }
                .lesson-type { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
                .text-blue { color: #3b82f6; }
                .text-gray { color: #cbd5e1; }

                /* Main Module Area */
                .content-module-area { flex: 1; min-width: 0; background: #fff; }
                .reading-container { max-width: 820px; margin: 4rem auto; padding: 0 2rem; }

                .breadcrumb-nav { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 2rem; }
                .active-breadcrumb { color: #3b82f6; }

                .content-title { font-size: 42px; font-weight: 900; color: #1e293b; line-height: 1.15; margin-bottom: 1.5rem; letter-spacing: -0.03em; }
                .content-meta { margin-bottom: 3rem; }
                .meta-box { display: flex; align-items: center; gap: 1.25rem; font-size: 14px; color: #64748b; font-weight: 500; }
                .meta-user { display: flex; align-items: center; gap: 0.75rem; color: #1e293b; font-weight: 700; }
                .avatar-mini { width: 28px; height: 28px; border-radius: 50%; overflow: hidden; }
                .avatar-mini img { width: 100%; height: 100%; object-fit: cover; }
                .meta-sep { width: 4px; height: 4px; border-radius: 50%; background: #cbd5e1; }
                .meta-date, .meta-timer { display: flex; align-items: center; gap: 6px; }

                /* Prose Typography Refined */
                .prose-body { 
                    line-height: 1.8; 
                    color: #2d3748; 
                    font-size: 1.125rem; 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                .prose-body :global(h2) { 
                    font-size: 1.875rem; 
                    font-weight: 700; 
                    color: #1a202c; 
                    margin: 3rem 0 1.25rem 0; 
                    line-height: 1.3;
                }
                .prose-body :global(p), .prose-body :global(.rendered-p), .prose-body :global(.tiptap-p) { 
                    margin-bottom: 1.5rem; 
                }
                
                /* Refined Image Handling - MUCH SMALLER */
                .article-figure {
                    margin: 2.5rem 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }
                .article-img-refined {
                    max-width: 45%;
                    height: auto;
                    border-radius: 6px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.06);
                    border: 1px solid #edf2f7;
                }
                .caption-refined {
                    margin-top: 0.75rem;
                    font-size: 0.8125rem;
                    color: #718096;
                    font-style: italic;
                    max-width: 45%;
                    text-align: center;
                }

                .prose-body :global(blockquote) { 
                    margin: 2.5rem 0; 
                    padding: 1.5rem 2rem; 
                    background: #f7fafc; 
                    border-radius: 12px; 
                    border-left: 4px solid #4a5568; 
                    font-style: italic;
                    color: #4a5568;
                }

                .table-wrapper { overflow-x: auto; margin: 2.5rem 0; border: 1px solid #e2e8f0; border-radius: 12px; }
                .rendered-table { width: 100%; border-collapse: collapse; }
                .rendered-table th { background: #f7fafc; padding: 12px 16px; font-size: 0.75rem; font-weight: 700; color: #4a5568; text-align: left; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; }
                .rendered-table td { padding: 12px 16px; font-size: 0.9375rem; border-bottom: 1px solid #edf2f7; }

                .rendered-checklist { margin: 1.5rem 0; display: flex; flex-direction: column; gap: 8px; }
                .checklist-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; }
                .checklist-item.checked { background: #f0fff4; border-color: #c6f6d5; }
                .custom-checkbox { width: 18px; height: 18px; border-radius: 4px; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .checked .custom-checkbox { border-color: #48bb78; background: #f0fff4; color: #48bb78; }

                .rendered-divider { display: flex; justify-content: center; margin: 4rem 0; color: #cbd5e1; letter-spacing: 10px; font-size: 18px; }

                @media (max-width: 640px) {
                    .content-title { font-size: 28px; }
                    .reading-container { padding: 0 1.25rem; margin: 2rem auto; }
                    .meta-box { flex-wrap: wrap; gap: 0.75rem; font-size: 13px; }
                    .article-img-refined, .caption-refined { max-width: 90%; }
                }
            `}</style>
        </div>
    );
}
