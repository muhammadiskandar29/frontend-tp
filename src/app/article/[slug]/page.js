"use client";

import React from "react";
import {
    Calendar, User, Share2, ArrowLeft,
    Linkedin, Twitter, Facebook, MessageCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

// Simple custom renderer for Editor.js blocks
const ArticleRenderer = ({ data }) => {
    if (!data) return null;

    // Check if the data is a string (HTML from Tiptap)
    if (typeof data === "string") {
        return (
            <div
                className="article-prose-content"
                dangerouslySetInnerHTML={{ __html: data }}
            />
        );
    }

    // Fallback for old block-based data (Editor.js)
    if (data.blocks) {
        return (
            <div className="article-renderer">
                {data.blocks.map((block, index) => {
                    switch (block.type) {
                        case "header":
                            const Tag = `h${block.data.level || 2}`;
                            return <Tag key={index} className="rendered-h">{block.data.text}</Tag>;

                        case "paragraph":
                            return (
                                <p
                                    key={index}
                                    className="rendered-p"
                                    dangerouslySetInnerHTML={{ __html: block.data.text }}
                                ></p>
                            );

                        case "list":
                            const ListTag = block.data.style === "ordered" ? "ol" : "ul";
                            return (
                                <ListTag key={index} className="rendered-list">
                                    {block.data.items.map((item, i) => (
                                        <li key={i} dangerouslySetInnerHTML={{ __html: item }}></li>
                                    ))}
                                </ListTag>
                            );

                        case "image":
                            return (
                                <figure key={index} className="rendered-figure">
                                    <img src={block.data.file?.url || "/placeholder-image.jpg"} alt={block.data.caption} />
                                    {block.data.caption && <figcaption>{block.data.caption}</figcaption>}
                                </figure>
                            );

                        case "quote":
                            return (
                                <blockquote key={index} className="rendered-quote">
                                    <p>{block.data.text}</p>
                                    {block.data.caption && <footer>— {block.data.caption}</footer>}
                                </blockquote>
                            );

                        case "delimiter":
                            return <hr key={index} className="rendered-hr-divider" />;

                        default:
                            return null;
                    }
                })}
            </div>
        );
    }

    return null;
};

export default function PublicArticlePage({ params }) {
    const router = useRouter();
    const [article, setArticle] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Mock fetch data
        setTimeout(() => {
            setArticle({
                title: "Panduan Penggunaan Produk Premium",
                author: "Tim Support Antigravity",
                date: "22 Januari 2026",
                content: JSON.stringify({
                    time: 1705928123000,
                    blocks: [
                        {
                            type: "header",
                            data: { text: "Selamat Datang di Panduan Resmi", level: 2 }
                        },
                        {
                            type: "paragraph",
                            data: { text: "Terima kasih telah memilih produk kami. Artikel ini akan membantu Anda memahami cara mengoptimalkan setiap fitur yang tersedia dengan cara yang mudah dan efisien." }
                        },
                        {
                            type: "image",
                            data: {
                                file: { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" },
                                caption: "Ilustrasi Dashboard Produk Modern"
                            }
                        },
                        {
                            type: "header",
                            data: { text: "Langkah Pertama: Konfigurasi", level: 3 }
                        },
                        {
                            type: "list",
                            data: {
                                style: "ordered",
                                items: [
                                    "Daftar akun baru menggunakan email aktif",
                                    "Verifikasi identitas melalui OTP WhatsApp",
                                    "Hubungkan nomor rekening untuk penarikan saldo",
                                    "Lengkapi profil profesional Anda"
                                ]
                            }
                        },
                        {
                            type: "quote",
                            data: {
                                text: "Sistem yang baik bukan tentang seberapa kompleks fiturnya, tapi seberapa mudah ia membantu penggunanya.",
                                caption: "Steven Jobs (Tribute)"
                            }
                        },
                        {
                            type: "paragraph",
                            data: { text: "Pastikan Anda selalu memperbarui aplikasi ke versi terbaru untuk mendapatkan dukungan keamanan maksimal." }
                        },
                        {
                            type: "delimiter",
                            data: {}
                        }
                    ]
                })
            });
            setLoading(false);
        }, 800);
    }, []);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Menyiapkan Konten...</p>
                <style jsx>{`
          .loading-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; }
          .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
            </div>
        );
    }

    return (
        <div className="public-article-container">
            {/* Top Navbar (Mini) */}
            <nav className="mini-nav">
                <div className="nav-content">
                    <button className="btn-back" onClick={() => window.history.back()}>
                        <ArrowLeft size={18} />
                        Kembali
                    </button>
                    <div className="logo">Antigravity <span>Portal</span></div>
                    <button className="btn-share">
                        <Share2 size={18} />
                        Share
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="article-hero">
                <div className="hero-content">
                    <h1 className="hero-title">{article.title}</h1>
                    <div className="hero-meta">
                        <div className="meta-item">
                            <User size={16} />
                            <span>{article.author}</span>
                        </div>
                        <div className="meta-item">
                            <Calendar size={16} />
                            <span>{article.date}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="content-grid">
                    {/* Sidebar Left: Share buttons sticky */}
                    <aside className="share-sidebar">
                        <div className="sticky-share">
                            <span>SHARE</span>
                            <button className="share-icon twitter" title="Share on Twitter"><Twitter size={20} /></button>
                            <button className="share-icon facebook" title="Share on Facebook"><Facebook size={20} /></button>
                            <button className="share-icon linkedin" title="Share on LinkedIn"><Linkedin size={20} /></button>
                            <button className="share-icon wa" title="Share on WhatsApp"><MessageCircle size={20} /></button>
                        </div>
                    </aside>

                    {/* Article Body */}
                    <article className="article-body">
                        <ArticleRenderer data={JSON.parse(article.content)} />

                        {/* Author Footer */}
                        <div className="author-card">
                            <div className="author-avatar">
                                <img src="https://ui-avatars.com/api/?name=Antigravity+Support&background=3b82f6&color=fff" alt="Author" />
                            </div>
                            <div className="author-details">
                                <h4>Ditulis oleh {article.author}</h4>
                                <p>Edukasi specialist di Antigravity Corp. Fokus membantu digital marketer mengoptimalkan alur penjualan mereka.</p>
                            </div>
                        </div>
                    </article>

                    {/* Sidebar Right: Ads / Related items */}
                    <aside className="related-sidebar">
                        <div className="promo-box">
                            <h3>Butuh bantuan lebih?</h3>
                            <p>Hubungi trainer kami untuk sesi konsultasi 1on1 gratis!</p>
                            <button className="btn-promo">Hubungi Trainer</button>
                        </div>
                    </aside>
                </div>
            </main>

            <footer className="footer">
                <p>© 2026 Antigravity Portal. All rights reserved.</p>
            </footer>

            <style jsx>{`
        .public-article-container {
          background: #fff;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        .mini-nav {
            position: sticky;
            top: 0;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #f1f5f9;
            z-index: 100;
            height: 60px;
        }

        .nav-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1.5rem;
            height: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo { font-weight: 800; font-size: 1.25rem; color: #1e293b; }
        .logo span { color: #3b82f6; }

        .btn-back, .btn-share {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            background: #fff;
            color: #475569;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;
        }

        .article-hero {
            padding: 4rem 1.5rem;
            background: #f8fafc;
            border-bottom: 1px solid #f1f5f9;
            text-align: center;
        }
        .hero-title { font-size: 3rem; font-weight: 800; color: #1e293b; line-height: 1.1; margin-bottom: 1.5rem; letter-spacing: -0.025em; }
        .hero-meta { display: flex; justify-content: center; gap: 1.5rem; color: #64748b; }
        .meta-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }

        .main-content { max-width: 1200px; margin: 0 auto; padding: 3rem 1.5rem; }
        .content-grid { display: grid; grid-template-columns: 80px 1fr 300px; gap: 4rem; }

        @media (max-width: 1024px) {
            .content-grid { grid-template-columns: 1fr; gap: 2rem; }
            .share-sidebar { display: none; }
        }

        .sticky-share { position: sticky; top: 100px; display: flex; flex-direction: column; gap: 1rem; align-items: center; }
        .share-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; transition: all 0.2s; }
        .share-icon:hover { transform: translateY(-3px); color: white; }
        .share-icon.twitter:hover { background: #1DA1F2; }
        .share-icon.facebook:hover { background: #1877F2; }
        .share-icon.linkedin:hover { background: #0A66C2; }
        .share-icon.wa:hover { background: #25D366; }

        .article-prose-content { line-height: 1.8; color: #334155; font-size: 1.125rem; }
        .article-prose-content h1, .article-prose-content h2, .article-prose-content h3 { color: #1e293b; font-weight: 800; margin: 2.5rem 0 1rem 0; }
        .article-prose-content h2 { border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }
        .article-prose-content p { margin-bottom: 1.5rem; }
        .article-prose-content a { color: #3b82f6; text-decoration: underline; font-weight: 500; transition: color 0.2s; }
        .article-prose-content a:hover { color: #2563eb; }
        .article-prose-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 1.5rem 0; display: block; }
        
        /* Alignment Support */
        .article-prose-content [style*="text-align: center"] { text-align: center; }
        .article-prose-content [style*="text-align: right"] { text-align: right; }
        .article-prose-content [style*="text-align: center"] img { margin: 1.5rem auto; }
        .article-prose-content [style*="text-align: right"] img { margin-left: auto; }

        .article-prose-content blockquote { margin: 2rem 0; padding: 1rem 2rem; border-left: 4px solid #3b82f6; background: #f8fafc; font-style: italic; }

        .author-card { margin-top: 4rem; padding: 2rem; background: #f8fafc; border-radius: 16px; display: flex; gap: 1.5rem; align-items: center; }
        .author-avatar img { width: 80px; height: 80px; border-radius: 50%; }

        .promo-box { position: sticky; top: 100px; background: #1e293b; color: white; padding: 2rem; border-radius: 16px; text-align: center; }
        .btn-promo { width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }

        .footer { margin-top: 5rem; padding: 3rem 1.5rem; text-align: center; border-top: 1px solid #f1f5f9; color: #94a3b8; }
      `}</style>
        </div>
    );
}
