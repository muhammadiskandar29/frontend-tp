"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
    ChevronRight, Tag as TagIcon, Save, X, Folder, Search as SearchIcon,
    Filter, FileText, CheckCircle, HelpCircle, Calendar,
    Eye, Edit2, Trash2
} from "lucide-react";
import { toast } from "react-hot-toast";
import React, { useRef } from "react";
import ArticleEditor from "../products/view/[id]/ArticleEditor";
import { getProducts } from "@/lib/sales/products";
import "@/styles/sales/bonus.css";
import axios from "axios";

export default function BonusProdukPage() {
    const [view, setView] = useState("list"); // "list" | "editor"
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentArticle, setCurrentArticle] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [availableProducts, setAvailableProducts] = useState([]);
    const editorRef = useRef();

    useEffect(() => {
        fetchArticles();
        fetchAvailableProducts();
    }, []);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get("/api/sales/post", { headers });

            if (response.data?.success) {
                setArticles(response.data.data || []);
            } else {
                setArticles([]);
            }
        } catch (err) {
            console.error("Fetch articles error:", err);
            toast.error("Gagal memuat bonus produk");
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableProducts = async () => {
        try {
            const data = await getProducts();
            setAvailableProducts(data);
        } catch (err) {
            console.error("Gagal memuat produk:", err);
        }
    };

    const handleCreate = () => {
        setCurrentArticle(null);
        setView("editor");
    };

    const handleEdit = async (article) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            // Ambil data lengkap termasuk konten (Tiptap JSON)
            const response = await axios.get(`/api/sales/post/${article.id}`, { headers });

            if (response.data?.success) {
                setCurrentArticle(response.data.data);
                setView("editor");
            } else {
                toast.error("Gagal mengambil detail artikel");
            }
        } catch (err) {
            console.error("Fetch detail error:", err);
            toast.error("Koneksi gagal saat mengambil detail");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus bonus ini?")) {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                const response = await axios.delete(`/api/sales/post/${id}`, { headers });

                if (response.data?.success) {
                    toast.success("Bonus berhasil dihapus");
                    fetchArticles();
                } else {
                    toast.error(response.data?.message || "Gagal menghapus bonus");
                }
            } catch (err) {
                console.error("Delete error:", err);
                toast.error("Terjadi kesalahan saat menghapus data");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSuccessSave = () => {
        setView("list");
        fetchArticles();
    };

    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout title="Bonus Produk">
            <div className="bonus-page-container">
                {view === "list" ? (
                    <div className="fade-in">
                        {/* Large Search Bar Section */}
                        <div className="search-container-top">
                            <div className="search-box-large card-shadow">
                                <SearchIcon size={20} className="search-icon-left" />
                                <input
                                    type="text"
                                    className="search-input-large"
                                    placeholder="Cari produk, kategori, atau pembuat"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Table Card Section */}
                        <div className="main-content-card card-shadow">
                            <div className="card-header-inner">
                                <div className="card-header-titles">
                                    <span className="eyebrow-text">DIRECTORY</span>
                                    <h2 className="card-title">Bonus roster</h2>
                                </div>
                                <div className="card-header-actions">
                                    <button className="btn-primary-orange" onClick={handleCreate}>
                                        <TagIcon size={16} strokeWidth={3} />
                                        + Tambah Bonus
                                    </button>
                                </div>
                            </div>

                            <div className="table-container-clean">
                                {loading && articles.length === 0 ? (
                                    <div className="loading-state">
                                        <div className="spinner orange"></div>
                                        <p>Memuat data...</p>
                                    </div>
                                ) : filteredArticles.length > 0 ? (
                                    <table className="bonus-table-clean">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40%' }}>PRODUCT</th>
                                                <th>CATEGORY</th>
                                                <th>STATUS</th>
                                                <th>EVENT DATE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredArticles.map((article, index) => (
                                                <tr key={article.id}>
                                                    <td>
                                                        <div className="article-main-cell">
                                                            <span className="article-name-blue">{article.title}</span>
                                                            <div className="article-action-links">
                                                                <button className="link-action" onClick={() => window.open(`/article/${article.slug}`, '_blank')}>Review</button>
                                                                <button className="link-action" onClick={() => handleEdit(article)}>Edit</button>
                                                                <button className="link-action delete-pill" onClick={() => handleDelete(article.id)}>Delete</button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="tag-badges-clean">
                                                            {article.tag_produk && article.tag_produk.length > 0 ? (
                                                                article.tag_produk.map(prodId => {
                                                                    const p = availableProducts.find(item => item.id == prodId);
                                                                    return p ? (
                                                                        <span key={prodId} className="tag-item-text">
                                                                            {p.nama}
                                                                        </span>
                                                                    ) : null;
                                                                })
                                                            ) : (
                                                                <span className="text-xs text-gray-400">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`status-pill-outline ${article.status === 'published' ? 'is-active' : 'is-draft'}`}>
                                                            {article.status === 'published' ? 'Active' : 'Draft'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="date-text">{article.created_at ? new Date(article.created_at).toLocaleDateString('id-ID') : '28/01/2026'}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="empty-state-modern">
                                        <div className="empty-state-visual">
                                            <div className="blob-bg"></div>
                                            <Folder size={40} className="empty-icon" />
                                        </div>
                                        <h3>Belum ada bonus artikel</h3>
                                        <p>Mulai tingkatkan nilai konversi produk Anda dengan memberikan artikel bonus atau panduan eksklusif kepada pembeli.</p>
                                        <button className="btn-outline-create" onClick={handleCreate}>
                                            Buat Artikel Sekarang
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="fade-in">
                        <div className="editor-view-header">
                            <div className="header-left-side">
                                <button className="btn-back" onClick={() => setView("list")}>
                                    <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                                    Kembali ke Daftar
                                </button>
                                <h2 className="editor-title">{currentArticle ? 'Edit Bonus Produk' : 'Buat Bonus Baru'}</h2>
                                <p className="editor-subtitle">Kelola konten bonus dan pilih produk target di bagian bawah</p>
                            </div>

                            <div className="header-right-actions">
                                <button className="btn-cancel-top" onClick={() => setView("list")}>
                                    Batal
                                </button>
                                <button
                                    className="btn-publish-orange"
                                    onClick={() => editorRef.current?.handleSave()}
                                    disabled={loading}
                                >
                                    {loading ? 'Menyimpan...' : 'Publish Bonus'}
                                </button>
                            </div>
                        </div>

                        <div className="editor-wrapper-card card-shadow">
                            <ArticleWithTags
                                ref={editorRef}
                                initialData={currentArticle}
                                availableProducts={availableProducts}
                                onSuccess={handleSuccessSave}
                                onCancel={() => setView("list")}
                            />
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .bonus-page-container {
                    padding: 30px 40px;
                    background: transparent;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    gap: 45px; /* Spacing between toolbars and table cards */
                }
                .card-shadow {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    border: 1px solid #f1f5f9;
                }

                /* Search Area */
                .search-container-top {
                    display: flex;
                    justify-content: flex-start;
                    margin-bottom: 5px;
                }
                .search-box-large {
                    width: 480px;
                    display: flex;
                    align-items: center;
                    background: #fff;
                    padding: 0 15px;
                    height: 48px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                }
                .search-input-large {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: transparent;
                    font-size: 14px;
                    color: #64748b;
                    padding-left: 10px;
                }
                .search-icon-left { color: #94a3b8; }

                /* Main Table Card */
                .main-content-card { 
                    overflow: hidden; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 12px; 
                    background: #fff;
                }
                .card-header-inner {
                    padding: 30px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .card-header-titles { display: flex; flex-direction: column; gap: 4px; }
                .eyebrow-text { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
                .card-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; }
                
                .btn-primary-orange {
                    background: #ff7a00;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .btn-primary-orange:hover { background: #e66e00; }

                /* Table Styling */
                .bonus-table-clean { width: 100%; border-collapse: collapse; }
                .bonus-table-clean thead th {
                    background: #f8fafc;
                    padding: 15px 40px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 700;
                    color: #64748b;
                    border-bottom: 1px solid #f1f5f9;
                }
                .bonus-table-clean tr td {
                    padding: 25px 40px;
                    color: #334155;
                    font-size: 14px;
                    border-bottom: 1px solid #f8fafc;
                    vertical-align: middle;
                }
                
                /* Product Cell Improvements */
                .article-main-cell { display: flex; flex-direction: column; gap: 8px; }
                .article-name-blue { font-size: 15px; font-weight: 600; color: #0ea5e9; cursor: pointer; }
                .article-action-links { display: flex; align-items: center; gap: 20px; }
                .link-action {
                    background: none;
                    border: none;
                    padding: 0;
                    font-size: 13px;
                    color: #64748b;
                    cursor: pointer;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                .link-action:hover { color: #0ea5e9; }
                .link-action.delete-pill {
                    background: #fff1f2;
                    color: #e11d48;
                    padding: 2px 10px;
                    border-radius: 6px;
                }
                .link-action.delete-pill:hover { background: #ffe4e6; }

                /* Status Pill Outline */
                .status-pill-outline {
                    display: inline-block;
                    padding: 4px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    border: 1px solid #e2e8f0;
                }
                .status-pill-outline.is-active {
                    background: #f0fdf4;
                    color: #16a34a;
                    border-color: #22c55e;
                }
                .status-pill-outline.is-draft {
                    background: #f8fafc;
                    color: #64748b;
                }

                .tag-item-text { display: block; color: #334155; font-weight: 500; margin-bottom: 4px; }
                .date-text { color: #334155; font-weight: 500; }

                .empty-state-modern {
                    padding: 100px 40px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    max-width: 500px;
                    margin: 0 auto;
                }
                .empty-state-visual {
                    position: relative;
                    margin-bottom: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .blob-bg {
                    position: absolute;
                    width: 120px;
                    height: 120px;
                    background: #fff7ed;
                    border-radius: 50%;
                    filter: blur(20px);
                    z-index: 1;
                }
                .empty-icon { 
                    position: relative;
                    z-index: 2;
                    color: #ff7a00; 
                    opacity: 0.8;
                }
                .empty-state-modern h3 { 
                    font-size: 22px; 
                    font-weight: 800; 
                    color: #1e293b; 
                    margin: 0 0 12px 0; 
                    letter-spacing: -0.01em;
                }
                .empty-state-modern p { 
                    color: #64748b; 
                    font-size: 15px; 
                    line-height: 1.6;
                    margin-bottom: 32px;
                }
                .btn-outline-create {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #1e293b;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-outline-create:hover {
                    border-color: #ff7a00;
                    color: #ff7a00;
                    background: #fff7ed;
                }

                .editor-view-header {
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding: 0 10px;
                }
                .btn-back {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                    padding: 10px 18px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    margin-bottom: 16px;
                    transition: all 0.2s;
                }
                .btn-back:hover { border-color: #1e293b; color: #1e293b; }
                .editor-title { font-size: 32px; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.03em; }
                .editor-subtitle { color: #64748b; font-size: 16px; font-weight: 500; margin-top: 6px; }
                
                .btn-publish-orange {
                    background: #ff7a00;
                    color: white;
                    border: none;
                    padding: 14px 32px;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 14px rgba(255, 122, 0, 0.2);
                }
                .btn-publish-orange:hover {
                    background: #e66e00;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255, 122, 0, 0.3);
                }
                .btn-cancel-top {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                    padding: 14px 28px;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 15px;
                    cursor: pointer;
                    margin-right: 12px;
                    transition: all 0.2s;
                }
                .btn-cancel-top:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

                .spinner.orange {
                    width: 32px;
                    height: 32px;
                    border: 4px solid #f1f5f9;
                    border-top: 4px solid #ff7a00;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .loading-state { text-align: center; padding: 100px 0; color: #64748b; font-weight: 500; }
            `}</style>
        </Layout>
    );
}

const ArticleWithTags = React.forwardRef(({ initialData, availableProducts, onSuccess, onCancel }, ref) => {
    const [selectedProducts, setSelectedProducts] = useState(initialData?.tag_produk || []);

    const handleToggleProduct = (id) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleFinalSuccess = () => {
        if (onSuccess) onSuccess();
    };

    return (
        <div className="editor-with-tags">
            <ArticleEditor
                ref={ref}
                initialData={initialData}
                extraPayload={{ tag_produk: selectedProducts }}
                onSuccess={handleFinalSuccess}
                onCancel={onCancel}
                hideActions={true}
            />

            <div className="tags-section">
                <div className="section-header">
                    <TagIcon size={18} />
                    <h3>Tag Produk</h3>
                </div>
                <p className="section-desc">Pilih produk mana saja yang akan mendapatkan akses ke artikel bonus ini.</p>

                <div className="products-selection-grid">
                    {availableProducts.map(product => (
                        <label key={product.id} className={`product-checkbox-label ${selectedProducts.includes(product.id) ? 'selected' : ''}`}>
                            <input
                                type="checkbox"
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => handleToggleProduct(product.id)}
                            />
                            <div className="product-item-content">
                                <span className="p-name">{product.nama}</span>
                                <span className="p-code">{product.kode}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
});
