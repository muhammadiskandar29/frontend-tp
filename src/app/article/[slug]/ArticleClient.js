"use client";

import React, { useState, useEffect } from "react";
import {
    ArrowLeft, ChevronRight, CheckCircle, Search, HelpCircle,
    MessageSquare, Smile, Meh, Frown
} from "lucide-react";

// Intercom-style Article Renderer
const ArticleRenderer = ({ data }) => {
    if (!data) return null;

    let contentObj;
    try {
        contentObj = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        return <div className="intercom-prose" dangerouslySetInnerHTML={{ __html: data }} />;
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
                    if (mark.type === 'link') content = <a key={index} href={mark.attrs.href} target="_blank" rel="noopener" className="intercom-link">{content}</a>;
                });
            }
            return content;
        }

        const children = node.content ? node.content.map((child, i) => renderTiptapNode(child, i)) : null;

        switch (node.type) {
            case 'doc': return <div key={index}>{children}</div>;
            case 'paragraph': return <p key={index} className="intercom-p" style={{ textAlign: node.attrs?.textAlign || 'left' }}>{children}</p>;
            case 'heading':
                const Tag = `h${node.attrs?.level || 1}`;
                return <Tag key={index} className={`intercom-h${node.attrs?.level || 1}`} style={{ textAlign: node.attrs?.textAlign || 'left' }}>{children}</Tag>;
            case 'bulletList': return <ul key={index} className="intercom-list-bullet">{children}</ul>;
            case 'orderedList': return <ol key={index} className="intercom-list-ordered">{children}</ol>;
            case 'listItem': return <li key={index} className="intercom-li">{children}</li>;
            case 'blockquote': return <blockquote key={index} className="intercom-quote">{children}</blockquote>;
            case 'image':
                return (
                    <figure key={index} className="intercom-figure">
                        <img src={node.attrs.src} alt={node.attrs.alt} className="intercom-img" />
                        {node.attrs.title && <figcaption className="intercom-caption">{node.attrs.title}</figcaption>}
                    </figure>
                );
            case 'horizontalRule': return <hr key={index} className="intercom-hr" />;
            case 'hardBreak': return <br key={index} />;
            default: return null;
        }
    };

    if (contentObj.type === 'doc') {
        return <div className="intercom-renderer">{renderTiptapNode(contentObj, 0)}</div>;
    }

    if (contentObj.blocks) {
        return (
            <div className="intercom-renderer">
                {contentObj.blocks.map((block, index) => {
                    switch (block.type) {
                        case "header":
                            const Tag = `h${block.data.level || 2}`;
                            return <Tag key={index} className={`intercom-h${block.data.level || 2}`}>{block.data.text}</Tag>;
                        case "paragraph":
                            return <p key={index} className="intercom-p" dangerouslySetInnerHTML={{ __html: block.data.text }}></p>;
                        case "list":
                            const ListTag = block.data.style === "ordered" ? "ol" : "ul";
                            const listClass = block.data.style === "ordered" ? "intercom-list-ordered" : "intercom-list-bullet";
                            return (
                                <ListTag key={index} className={listClass}>
                                    {block.data.items.map((item, i) => (
                                        <li key={i} className="intercom-li" dangerouslySetInnerHTML={{ __html: item }}></li>
                                    ))}
                                </ListTag>
                            );
                        case "image":
                            return (
                                <figure key={index} className="intercom-figure">
                                    <img src={block.data.file?.url || "/placeholder.jpg"} alt={block.data.caption} className="intercom-img" />
                                    {block.data.caption && <figcaption className="intercom-caption">{block.data.caption}</figcaption>}
                                </figure>
                            );
                        default: return null;
                    }
                })}
            </div>
        );
    }
    return null;
};

export default function ArticleClient({ article }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!article) return null;

    return (
        <div className="intercom-layout-root">
            {/* INTERCOM NAVBAR */}
            <header className="intercom-navbar">
                <div className="intercom-nav-container">
                    <div className="intercom-nav-left">
                        <img src="/assets/logo.png" alt="Logo" className="intercom-logo" />
                    </div>
                    <div className="intercom-nav-right">
                        <div className="intercom-search-box">
                            <Search size={16} className="search-icon" />
                            <input type="text" placeholder="Search for articles..." disabled />
                        </div>
                        <button className="intercom-nav-link" onClick={() => window.history.back()}>
                            Go to Ternak Properti
                        </button>
                    </div>
                </div>
            </header>

            {/* INTERCOM CONTENT AREA */}
            <main className="intercom-main">
                <div className="intercom-content-container">
                    {/* BREADCRUMBS */}
                    <nav className="intercom-breadcrumb">
                        <a href="#">All Collections</a>
                        <ChevronRight size={12} />
                        <a href="#">Education Center</a>
                        <ChevronRight size={12} />
                        <span className="current">{article.title}</span>
                    </nav>

                    {/* ARTICLE HEADER */}
                    <header className="intercom-article-header">
                        <h1 className="intercom-title">{article.title}</h1>
                        <p className="intercom-subtitle">Learn how to manage and organize your knowledge base effectively.</p>

                        <div className="intercom-author-box">
                            <div className="author-avatar-stack">
                                <img src={`https://ui-avatars.com/api/?name=${article.author}&background=0ea5e9&color=fff`} alt="Author" />
                            </div>
                            <div className="author-info-text">
                                <p className="author-attribution">Written by <span>{article.author}</span></p>
                                <p className="update-info">Updated over a week ago</p>
                            </div>
                        </div>
                    </header>

                    {/* ARTICLE BODY */}
                    <article className="intercom-article-body">
                        {hasMounted ? (
                            <ArticleRenderer data={article.content} />
                        ) : (
                            <div className="intercom-skeleton"></div>
                        )}
                    </article>

                    {/* FEEDBACK SECTION */}
                    <footer className="intercom-feedback">
                        <div className="feedback-inner">
                            <h3>Did this answer your question?</h3>
                            <div className="feedback-icons">
                                <button title="Disappointed"><Frown size={32} /></button>
                                <button title="Neutral"><Meh size={32} /></button>
                                <button title="Smiley"><Smile size={32} /></button>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>

            <style jsx>{`
                .intercom-layout-root {
                    background: #fff;
                    min-height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, Helvetica, Arial, sans-serif;
                    color: #111827;
                }

                /* NAVBAR */
                .intercom-navbar {
                    height: 64px;
                    border-bottom: 1px solid #E5E7EB;
                    display: flex;
                    align-items: center;
                    background: #fff;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .intercom-nav-container {
                    max-width: 1100px;
                    width: 100%;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 1.5rem;
                }
                .intercom-logo { height: 32px; width: auto; cursor: pointer; }
                .intercom-nav-right { display: flex; align-items: center; gap: 1.5rem; }
                .intercom-search-box {
                    display: flex;
                    align-items: center;
                    background: #F3F4F6;
                    border-radius: 8px;
                    padding: 8px 12px;
                    width: 280px;
                    gap: 10px;
                }
                .search-icon { color: #9CA3AF; }
                .intercom-search-box input {
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 14px;
                    width: 100%;
                    color: #111827;
                }
                .intercom-nav-link {
                    background: none;
                    border: none;
                    color: #0057FF;
                    font-weight: 500;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                /* MAIN */
                .intercom-main {
                    padding: 3rem 1.5rem 6rem;
                    display: flex;
                    justify-content: center;
                }
                .intercom-content-container {
                    max-width: 720px; /* Lebar standar Intercom */
                    width: 100%;
                }

                /* BREADCRUMB */
                .intercom-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #6B7280;
                    margin-bottom: 2.5rem;
                }
                .intercom-breadcrumb a { color: #0057FF; text-decoration: none; }
                .intercom-breadcrumb a:hover { text-decoration: underline; }
                .intercom-breadcrumb .current { color: #6B7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                /* HEADER */
                .intercom-title {
                    font-size: 40px;
                    font-weight: 800;
                    line-height: 1.2;
                    margin-bottom: 0.75rem;
                    letter-spacing: -0.025em;
                }
                .intercom-subtitle {
                    font-size: 18px;
                    color: #4B5563;
                    margin-bottom: 2rem;
                    line-height: 1.5;
                }
                .intercom-author-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 3rem;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid #F3F4F6;
                }
                .author-avatar-stack img {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 2px solid #fff;
                }
                .author-info-text p { margin: 0; line-height: 1.4; }
                .author-attribution { font-size: 14px; color: #6B7280; }
                .author-attribution span { color: #111827; font-weight: 600; }
                .update-info { font-size: 13px; color: #9CA3AF; }

                /* BODY PROSE */
                .intercom-article-body {
                    font-size: 17px;
                    line-height: 1.6;
                    color: #374151;
                }
                :global(.intercom-p) { margin-bottom: 1.5rem; }
                :global(.intercom-h1) { font-size: 32px; font-weight: 800; margin: 2.5rem 0 1rem; }
                :global(.intercom-h2) { font-size: 26px; font-weight: 800; margin: 2.5rem 0 1rem; }
                :global(.intercom-h3) { font-size: 20px; font-weight: 700; margin: 2rem 0 1rem; }
                :global(.intercom-link) { color: #0057FF; text-decoration: none; border-bottom: 1px solid transparent; }
                :global(.intercom-link:hover) { border-bottom-color: #0057FF; }
                
                :global(.intercom-list-bullet) { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
                :global(.intercom-list-ordered) { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.5rem; }
                :global(.intercom-li) { margin-bottom: 0.5rem; }
                
                :global(.intercom-figure) { margin: 2.5rem 0; text-align: center; }
                :global(.intercom-img) {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    border: 1px solid #E5E7EB;
                }
                :global(.intercom-caption) { margin-top: 0.75rem; font-size: 14px; color: #6B7280; font-style: italic; }

                /* FEEDBACK */
                .intercom-feedback {
                    margin-top: 5rem;
                    padding-top: 3rem;
                    border-top: 1px solid #F3F4F6;
                    text-align: center;
                }
                .feedback-inner h3 { font-size: 18px; font-weight: 600; margin-bottom: 1.5rem; }
                .feedback-icons { display: flex; justify-content: center; gap: 2rem; }
                .feedback-icons button {
                    background: none;
                    border: none;
                    color: #D1D5DB;
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 8px;
                    border-radius: 50%;
                }
                .feedback-icons button:hover { color: #0057FF; background: #F3F4F6; transform: scale(1.1); }

                .intercom-skeleton {
                    width: 100%;
                    height: 400px;
                    background: #F9FAFB;
                    border-radius: 12px;
                    animation: intercomPulse 2s infinite;
                }
                @keyframes intercomPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @media (max-width: 640px) {
                    .intercom-title { font-size: 32px; }
                    .intercom-search-box { display: none; }
                    .intercom-nav-link span { display: none; }
                }
            `}</style>
        </div>
    );
}
