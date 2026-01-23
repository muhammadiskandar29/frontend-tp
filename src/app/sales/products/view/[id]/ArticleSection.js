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
          <div className="card-header-inner-clean">
            <div className="card-title-group">
              <span className="card-subtitle">DIRECTORY</span>
              <h2 className="card-title">Artikel Produk</h2>
            </div>
          </div>

          {/* Search Section */}
          <div className="search-section-clean">
            <input
              type="text"
              className="search-input-full-clean"
              placeholder="Cari artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={20} className="search-icon-right-clean" />
          </div>

          {/* Table / List */}
          <div className="table-container-clean">
            {loading && articles.length === 0 ? (
              <div className="loading-state">
                <div className="spinner orange"></div>
                <p>Memuat artikel...</p>
              </div>
            ) : filteredArticles.length > 0 ? (
              <table className="bonus-table-clean">
                <thead>
                  <tr>
                    <th className="w-10">#</th>
                    <th>JUDUL ARTIKEL</th>
                    <th>STATUS</th>
                    <th className="text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((article, index) => (
                    <tr key={article.id}>
                      <td className="row-num">{index + 1}</td>
                      <td>
                        <div className="article-info-clean">
                          <span className="article-name">{article.title}</span>
                          <span className="article-slug-clean">/{article.slug}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill-clean ${article.status}`}>
                          {article.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-clean">
                          <button
                            className="btn-action-icon"
                            title="Lihat"
                            onClick={() => window.open(`/article/${article.slug}`, '_blank')}
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="btn-action-icon"
                            title="Edit"
                            onClick={() => handleEdit(article)}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className="btn-action-icon delete"
                            title="Hapus"
                            onClick={() => handleDelete(article.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <LayoutIcon size={48} className="empty-icon-gray" />
                <h3>Belum ada artikel</h3>
                <p>Mulai buat artikel pertama Anda untuk membantuk customer mengenal produk lebih jauh.</p>
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
        /* Roster Theme */
        .card-header-inner-clean {
            padding: 24px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-title-group { display: flex; flex-direction: column; }
        .card-subtitle { font-size: 11px; font-weight: 700; color: #cbd5e1; letter-spacing: 0.1em; }
        .card-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }

        .search-section-clean {
            margin: 0 30px 20px 30px;
            position: relative;
            background: #fff;
            border: 1px solid #f1f5f9;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .search-input-full-clean {
            width: 100%;
            padding: 12px 20px;
            border: none;
            background: transparent;
            outline: none;
            font-size: 14px;
        }
        .search-icon-right-clean {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #cbd5e1;
        }

        .table-container-clean { padding: 0 30px 30px 30px; }
        .bonus-table-clean {
            width: 100%;
            border-collapse: collapse;
        }
        .bonus-table-clean thead th {
            background: #f8fafc;
            padding: 12px 16px;
            text-align: left;
            font-size: 11px;
            font-weight: 800;
            color: #475569;
            letter-spacing: 0.05em;
        }
        .bonus-table-clean tr td {
            padding: 16px;
            color: #334155;
            border-bottom: 1px solid #f8fafc;
        }
        .row-num { font-weight: 500; color: #94a3b8; font-size: 13px; }
        .article-name { font-weight: 600; color: #1e293b; display: block; font-size: 14px; }
        .article-slug-clean { font-size: 11px; color: #cbd5e1; }

        .status-pill-clean {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .status-pill-clean.published { background: #fff7ed; color: #ff7a00; }
        .status-pill-clean.draft { background: #f1f5f9; color: #94a3b8; }

        .action-buttons-clean {
            display: flex;
            gap: 4px;
            justify-content: flex-end;
        }
        .btn-action-icon {
            background: none;
            border: none;
            color: #cbd5e1;
            cursor: pointer;
            padding: 6px;
            transition: all 0.2s;
        }
        .btn-action-icon:hover { color: #ff7a00; }
        .btn-action-icon.delete:hover { color: #ef4444; }

        .spinner.orange {
            width: 24px;
            height: 24px;
            border: 3px solid #f1f5f9;
            border-top: 3px solid #ff7a00;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .empty-icon-gray { color: #e2e8f0; margin-bottom: 12px; }
        .w-10 { width: 40px; }

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
