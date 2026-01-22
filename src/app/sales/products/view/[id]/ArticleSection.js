"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    FileText, Plus, Edit2, Trash2, Search,
    ExternalLink, Calendar, User, ChevronRight,
    Eye, Save, X, Layout as LayoutIcon
} from "lucide-react";
import { toast } from "react-hot-toast";
import ArticleEditor from "./ArticleEditor";

export default function ArticleSection({ productName }) {
    const params = useParams();
    const productId = params.id;

    const [view, setView] = useState("list"); // "list" | "editor"
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentArticle, setCurrentArticle] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchArticles = async () => {
        setLoading(true);
        try {
            // Placeholder for actual API call
            // const res = await fetch(`/api/sales/artikel?produk_id=${productId}`);
            // const data = await res.json();
            // if (data.success) setArticles(data.data);

            // Mock data for demonstration
            setArticles([
                {
                    id: 1,
                    title: "Panduan Penggunaan " + (productName || "Produk"),
                    slug: "panduan-penggunaan",
                    status: "published",
                    updated_at: "2024-03-20 10:00:00",
                    author: "Admin Sales"
                },
                {
                    id: 2,
                    title: "Tips & Trick Maksimalkan Fitur",
                    slug: "tips-trick",
                    status: "draft",
                    updated_at: "2024-03-21 15:30:00",
                    author: "Admin Sales"
                }
            ]);
        } catch (err) {
            toast.error("Gagal memuat artikel");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, [productId]);

    const handleCreate = () => {
        setCurrentArticle(null);
        setView("editor");
    };

    const handleEdit = (article) => {
        setCurrentArticle(article);
        setView("editor");
    };

    const handleDelete = async (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus artikel ini?")) {
            try {
                // const res = await fetch(`/api/sales/artikel/${id}`, { method: 'DELETE' });
                toast.success("Artikel berhasil dihapus");
                setArticles(articles.filter(a => a.id !== id));
            } catch (err) {
                toast.error("Gagal menghapus artikel");
            }
        }
    };

    const handleSave = async (data) => {
        setLoading(true);
        try {
            console.log("Saving article data:", data);
            // Simulate API call
            // const res = await fetch('/api/sales/artikel', { 
            //   method: currentArticle ? 'PUT' : 'POST',
            //   body: JSON.stringify({ ...data, produk_id: productId })
            // });

            toast.success(currentArticle ? "Artikel dikirim ulang!" : "Artikel berhasil disimpan!");
            setView("list");
            fetchArticles(); // Refresh list
        } catch (err) {
            toast.error("Gagal menyimpan artikel");
        } finally {
            setLoading(false);
        }
    };

    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="article-section-container">
            {view === "list" ? (
                <div className="article-list-view fade-in">
                    {/* Header List */}
                    <div className="list-header">
                        <div className="header-info">
                            <h2 className="title">
                                <FileText size={20} className="icon" />
                                Artikel Produk
                            </h2>
                            <p className="subtitle">Kelola artikel edukasi dan panduan untuk produk ini</p>
                        </div>
                        <button className="btn-primary" onClick={handleCreate}>
                            <Plus size={18} />
                            Tambah Artikel
                        </button>
                    </div>

                    {/* Search & Stats */}
                    <div className="list-controls">
                        <div className="search-wrapper">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Cari artikel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="stats">
                            <span>Total: <strong>{articles.length}</strong></span>
                            <span className="dot"></span>
                            <span>Published: <strong>{articles.filter(a => a.status === 'published').length}</strong></span>
                        </div>
                    </div>

                    {/* Table / List */}
                    <div className="table-container">
                        {loading && articles.length === 0 ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Memuat artikel...</p>
                            </div>
                        ) : filteredArticles.length > 0 ? (
                            <table className="article-table">
                                <thead>
                                    <tr>
                                        <th>Judul Artikel</th>
                                        <th>Status</th>
                                        <th>Terakhir Diupdate</th>
                                        <th>Penulis</th>
                                        <th className="text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredArticles.map((article) => (
                                        <tr key={article.id}>
                                            <td>
                                                <div className="article-info">
                                                    <span className="article-title">{article.title}</span>
                                                    <span className="article-slug">/{article.slug}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${article.status}`}>
                                                    {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="date-info">
                                                    <Calendar size={14} />
                                                    {article.updated_at}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="author-info">
                                                    <User size={14} />
                                                    {article.author}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon"
                                                        title="Lihat"
                                                        onClick={() => window.open(`/article/${article.slug}`, '_blank')}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-icon"
                                                        title="Edit"
                                                        onClick={() => handleEdit(article)}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-icon delete"
                                                        title="Hapus"
                                                        onClick={() => handleDelete(article.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <LayoutIcon size={48} className="empty-icon" />
                                <h3>Belum ada artikel</h3>
                                <p>Mulai buat artikel pertama Anda untuk membantuk customer mengenal produk lebih jauh.</p>
                                <button className="btn-outline" onClick={handleCreate}>Buat Artikel Sekarang</button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="article-editor-view fade-in">
                    {/* Editor Header */}
                    <div className="editor-header">
                        <button className="btn-back" onClick={() => setView("list")}>
                            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                            Kembali ke Daftar
                        </button>
                        <div className="editor-title-container">
                            <h2>{currentArticle ? 'Edit Artikel' : 'Buat Artikel Baru'}</h2>
                            <span className="product-context">untuk {productName}</span>
                        </div>
                    </div>

                    <ArticleEditor
                        initialData={currentArticle}
                        onSave={handleSave}
                        onCancel={() => setView("list")}
                    />
                </div>
            )}

            <style jsx>{`
        .article-section-container {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
          margin-top: 1rem;
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* List View */
        .list-header {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-info .title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
        }

        .header-info .icon {
          color: #3b82f6;
        }

        .header-info .subtitle {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0.25rem 0 0 0;
        }

        .list-controls {
          padding: 1rem 1.5rem;
          background: #f8fafc;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-wrapper input {
          width: 100%;
          padding: 0.5rem 1rem 0.5rem 2.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s;
        }

        .search-wrapper input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .stats {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .dot {
          width: 4px;
          height: 4px;
          background: #cbd5e1;
          border-radius: 50%;
        }

        /* Table */
        .table-container {
          overflow-x: auto;
        }

        .article-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .article-table th {
          padding: 0.75rem 1.5rem;
          background: #f8fafc;
          color: #64748b;
          font-weight: 500;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9;
        }

        .article-table td {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .article-info {
          display: flex;
          flex-direction: column;
        }

        .article-title {
          color: #1e293b;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .article-slug {
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .status-pill {
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-pill.published {
          background: #dcfce7;
          color: #166534;
        }

        .status-pill.draft {
          background: #f1f5f9;
          color: #475569;
        }

        .date-info, .author-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        /* Buttons */
        .btn-primary {
          background: #3b82f6;
          color: white;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #f8fafc;
          color: #3b82f6;
          border-color: #3b82f6;
        }

        .btn-icon.delete:hover {
          color: #ef4444;
          border-color: #ef4444;
          background: #fef2f2;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 1rem;
        }

        .btn-outline:hover {
          background: #f8fafc;
          color: #1e293b;
        }

        /* Empty State */
        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .empty-icon {
          color: #cbd5e1;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0;
          color: #1e293b;
        }

        .empty-state p {
          color: #64748b;
          max-width: 400px;
          margin: 0.5rem 0 0 0;
        }

        /* Editor View */
        .editor-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .btn-back {
          background: none;
          border: none;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0;
          margin-bottom: 1rem;
        }

        .btn-back:hover {
          color: #1e293b;
        }

        .editor-title-container h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #1e293b;
        }

        .product-context {
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .text-right { text-align: right; }
      `}</style>
        </div>
    );
}
