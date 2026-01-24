"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
    Eye, Edit2, Trash2, Layout as LayoutIcon,
    ChevronRight, Tag as TagIcon, Save, X, Folder, Search as SearchIcon
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

    const handleEdit = (article) => {
        setCurrentArticle(article);
        setView("editor");
    };

    const handleDelete = async (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus bonus ini?")) {
            toast.success("Bonus berhasil dihapus");
            setArticles(articles.filter(a => a.id !== id));
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
                        {/* Search Bar Section */}
                        <div className="search-container-premium">
                            <div className="search-box-premium card-shadow">
                                <SearchIcon size={20} className="search-icon-left" />
                                <input
                                    type="text"
                                    className="search-input-premium"
                                    placeholder="Cari artikel bonus..."
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

                        {/* Table Card Section */}
                        <div className="main-content-card card-shadow">
                            <div className="card-header-inner">
                                <div className="card-title-group">
                                    <h2 className="card-title">Bonus Roster</h2>
                                    <p className="card-subtitle">Manage bonus articles and perks for your product catalog</p>
                                </div>
                                <button className="btn-primary-orange" onClick={handleCreate}>
                                    <TagIcon size={16} className="btn-icon" />
                                    Tambah Bonus Baru
                                </button>
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
                                                <th className="w-10">#</th>
                                                <th>NAMA BONUS</th>
                                                <th>TAG PRODUK</th>
                                                <th className="text-right">ACTIONS</th>
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
                                                        <div className="tag-badges-clean">
                                                            {article.tag_produk?.map(prodId => {
                                                                const p = availableProducts.find(item => item.id == prodId);
                                                                return p ? (
                                                                    <span key={prodId} className="tag-badge-clean">
                                                                        {p.nama}
                                                                    </span>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons-clean">
                                                            <button
                                                                className="btn-action-icon"
                                                                onClick={() => window.open(`/article/${article.slug}`, '_blank')}
                                                                title="View"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                className="btn-action-icon"
                                                                onClick={() => handleEdit(article)}
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                className="btn-action-icon delete"
                                                                onClick={() => handleDelete(article.id)}
                                                                title="Delete"
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
                    padding: 40px;
                    background: #f8fafc;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }
                .card-shadow {
                    background: #fff;
                    border-radius: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
                    border: 1px solid #f1f5f9;
                    overflow: hidden;
                }
                .search-container-premium {
                    margin-bottom: 0;
                    display: flex;
                    justify-content: flex-start;
                }
                .search-box-premium {
                    display: flex;
                    align-items: center;
                    background: #fff;
                    padding: 0 20px;
                    height: 56px;
                    width: 100%;
                    max-width: 440px;
                    border-radius: 16px;
                    position: relative;
                    transition: all 0.3s ease;
                    border: 1px solid #e2e8f0;
                }
                .search-box-premium:focus-within {
                    border-color: #ff7a00;
                    box-shadow: 0 10px 40px rgba(255, 122, 0, 0.08);
                }
                .search-icon-left {
                    color: #94a3b8;
                    margin-right: 14px;
                }
                .search-input-premium {
                    flex: 1;
                    height: 100%;
                    border: none;
                    outline: none;
                    background: transparent;
                    font-size: 15px;
                    font-weight: 500;
                    color: #1e293b;
                }
                .search-clear-btn {
                    background: #f1f5f9;
                    border: none;
                    color: #64748b;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .search-clear-btn:hover { background: #e2e8f0; color: #1e293b; }

                .main-content-card {
                    background: #fff;
                }
                .card-header-inner {
                    padding: 32px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #f1f5f9;
                }
                .card-title-group { display: flex; flex-direction: column; gap: 4px; }
                .card-title { font-size: 24px; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.02em; }
                .card-subtitle { font-size: 14px; font-weight: 500; color: #64748b; margin: 0; }
                
                .btn-primary-orange {
                    background: #ff7a00;
                    color: white;
                    border: none;
                    padding: 12px 28px;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 15px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 14px rgba(255, 122, 0, 0.2);
                }
                .btn-primary-orange:hover {
                    background: #e66e00;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255, 122, 0, 0.3);
                }
                .btn-icon { stroke-width: 2.5; }

                .table-container-clean { padding: 0; }
                .bonus-table-clean {
                    width: 100%;
                    border-collapse: collapse;
                }
                .bonus-table-clean thead th {
                    background: #f8fafc;
                    padding: 16px 40px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 800;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .bonus-table-clean tr td {
                    padding: 24px 40px;
                    color: #334155;
                    border-bottom: 1px solid #f1f5f9;
                }
                .bonus-table-clean tr:hover td {
                    background: #fdfdfd;
                }
                .article-info-clean { display: flex; flex-direction: column; gap: 2px; }
                .article-name { font-weight: 700; color: #1e293b; font-size: 16px; }
                .article-slug-clean { font-size: 13px; color: #94a3b8; font-weight: 500; }

                .tag-badge-clean {
                    display: inline-block;
                    background: #eff6ff;
                    color: #3b82f6;
                    padding: 4px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    margin: 4px;
                    border: 1px solid #dbeafe;
                }
                .btn-action-icon {
                    background: none;
                    border: none;
                    color: #cbd5e1;
                    cursor: pointer;
                    padding: 10px;
                    border-radius: 10px;
                    transition: all 0.2s;
                }
                .btn-action-icon:hover { 
                    color: #ff7a00; 
                    background: #fff7ed;
                }
                .btn-action-icon.delete:hover { 
                    color: #ef4444; 
                    background: #fef2f2;
                }

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

const ArticleWithTags = React.forwardRef(({ initialData, availableProducts, onSave, onCancel }, ref) => {
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
