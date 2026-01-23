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
import axios from "axios";

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
      const payload = {
        title: data.title,
        content: data.content,
        slug: data.slug,
        status: data.status || "draft",
        idproduk: [productId] // Wrapped in array
      };

      const response = await axios.post("/api/sales/post", payload);

      if (response.data?.success) {
        toast.success(currentArticle ? "Artikel diperbarui!" : "Artikel berhasil disimpan!");
        setView("list");
        fetchArticles();
      } else {
        toast.error(response.data?.message || "Gagal menyimpan");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.message || "Gagal menyambung ke server");
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
          {/* Roster Header */}
          <div className="card-header-inner">
            <div className="card-title-group">
              <span className="card-subtitle">DIRECTORY</span>
              <h2 className="card-title">Artikel Produk</h2>
            </div>
            <button className="btn-primary-orange" onClick={handleCreate}>
              + Tambah Artikel
            </button>
          </div>

          {/* Search Bar Premium */}
          <div className="search-container-premium">
            <div className="search-box-premium">
              <Search size={20} className="search-icon-left" />
              <input
                type="text"
                className="search-input-premium"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
                  <X size={16} />
                </button>
              )}
            </div>
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
          <div className="editor-view-header">
            <div className="header-left-side">
              <button className="btn-back" onClick={() => setView("list")}>
                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                Kembali ke Daftar
              </button>
              <h2 className="editor-title">{currentArticle ? 'Edit Artikel' : 'Buat Artikel Baru'}</h2>
              <p className="editor-subtitle">Kelola konten artikel khusus untuk {productName}</p>
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
        /* Premium Theme Sync with Bonus Page */
        .article-section-container {
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
        }

        .card-header-inner {
            padding: 24px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-title-group { display: flex; flex-direction: column; }
        .card-subtitle { font-size: 11px; font-weight: 700; color: #cbd5e1; letter-spacing: 0.1em; }
        .card-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
        
        .btn-primary-orange {
            background: #ff7a00;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary-orange:hover {
            background: #e66e00;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 122, 0, 0.2);
        }

        .search-container-premium {
            padding: 0 30px 24px 30px;
        }
        .search-box-premium {
            display: flex;
            align-items: center;
            background: #f8fafc;
            padding: 0 16px;
            height: 48px;
            width: 100%;
            max-width: 400px;
            border-radius: 12px;
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #f1f5f9;
        }
        .search-box-premium:focus-within {
            background: #fff;
            border-color: #ff7a00;
            box-shadow: 0 8px 30px rgba(255, 122, 0, 0.1);
        }
        .search-icon-left { color: #94a3b8; margin-right: 12px; flex-shrink: 0; }
        .search-input-premium {
            flex: 1;
            height: 100%;
            border: none;
            outline: none;
            background: transparent;
            font-size: 14px;
            color: #1e293b;
        }
        .search-clear-btn {
            background: #f1f5f9;
            border: none;
            color: #94a3b8;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
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
        .bonus-table-clean tr:hover td {
            background: #fafafa;
        }
        .row-num { font-weight: 500; color: #94a3b8; font-size: 13px; }
        .article-name { font-weight: 600; color: #1e293b; display: block; font-size: 14px; }
        .article-slug-clean { font-size: 11px; color: #cbd5e1; }

        .status-pill-clean {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10px;
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

        /* Editor Header Sync */
        .editor-view-header {
            padding: 24px 30px;
            border-bottom: 1px solid #f1f5f9;
            margin-bottom: 0;
            background: #fff;
        }
        .btn-back {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #64748b;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        .btn-back:hover { border-color: #ff7a00; color: #ff7a00; }
        .editor-title { font-size: 24px; font-weight: 800; color: #1e293b; margin: 0; }
        .editor-subtitle { color: #94a3b8; font-size: 14px; margin: 4px 0 0 0; }

        .spinner.orange {
            width: 24px;
            height: 24px;
            border: 3px solid #f1f5f9;
            border-top: 3px solid #ff7a00;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .empty-state {
            padding: 60px 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .empty-icon-gray { color: #f1f5f9; stroke-width: 1.5; margin-bottom: 16px; }
        .empty-state h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
        .empty-state p { color: #94a3b8; font-size: 14px; margin-top: 8px; max-width: 320px; }

        .text-right { text-align: right; }
      `}</style>
    </div>
  );
}
