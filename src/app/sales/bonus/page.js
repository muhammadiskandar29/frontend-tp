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
            // Mock data for demonstration
            setArticles([
                {
                    id: 1,
                    title: "Bonus: Panduan Eksklusif Digital Marketing",
                    slug: "bonus-panduan-eksklusif",
                    status: "published",
                    updated_at: "2024-03-22 10:00:00",
                    author: "Admin Sales",
                    tag_produk: [1, 2]
                }
            ]);
        } catch (err) {
            toast.error("Gagal memuat bonus produk");
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

    const handleSave = async (data) => {
        setLoading(true);
        try {
            console.log("Saving bonus data:", data);
            toast.success(currentArticle ? "Bonus diperbarui!" : "Bonus berhasil dibuat!");
            setView("list");
            fetchArticles();
        } catch (err) {
            toast.error("Gagal menyimpan");
        } finally {
            setLoading(false);
        }
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
                                    <span className="card-subtitle">DIRECTORY</span>
                                    <h2 className="card-title">Bonus roster</h2>
                                </div>
                                <button className="btn-primary-orange" onClick={handleCreate}>
                                    + Tambah Bonus
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
                                    <div className="empty-state">
                                        <LayoutIcon size={48} className="empty-icon" />
                                        <h3>Belum ada bonus</h3>
                                        <p>Buat artikel bonus pertama Anda untuk meningkatkan value produk.</p>
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
                                onSave={handleSave}
                                onCancel={() => setView("list")}
                            />
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .bonus-page-container {
                    padding: 30px;
                    background: #fdfdfd;
                    min-height: 100vh;
                }
                .card-shadow {
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.03);
                    border: 1px solid #f1f5f9;
                }
                .search-container-premium {
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: flex-start;
                }
                .search-box-premium {
                    display: flex;
                    align-items: center;
                    background: #fff;
                    padding: 0 16px;
                    height: 54px;
                    width: 100%;
                    max-width: 500px;
                    border-radius: 14px;
                    position: relative;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid #f1f5f9;
                }
                .search-box-premium:focus-within {
                    border-color: #ff7a00;
                    box-shadow: 0 8px 30px rgba(255, 122, 0, 0.1);
                }
                .search-icon-left {
                    color: #94a3b8;
                    margin-right: 12px;
                }
                .search-input-premium {
                    flex: 1;
                    height: 100%;
                    border: none;
                    outline: none;
                    background: transparent;
                    font-size: 15px;
                    color: #1e293b;
                }
                .search-clear-btn {
                    background: #f1f5f9;
                    border: none;
                    color: #94a3b8;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .main-content-card {
                    background: #fff;
                    padding-bottom: 20px;
                }
                .card-header-inner {
                    padding: 24px 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .card-title-group { display: flex; flex-direction: column; }
                .card-subtitle { font-size: 12px; font-weight: 600; color: #cbd5e1; letter-spacing: 0.1em; }
                .card-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
                .btn-primary-orange {
                    background: #ff7a00;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                }
                .table-container-clean { padding: 0 30px; }
                .bonus-table-clean {
                    width: 100%;
                    border-collapse: collapse;
                }
                .bonus-table-clean thead th {
                    background: #f8fafc;
                    padding: 14px 16px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 800;
                    color: #475569;
                }
                .bonus-table-clean tr td {
                    padding: 20px 16px;
                    color: #334155;
                    border-bottom: 1px solid #f8fafc;
                }
                .tag-badge-clean {
                    display: inline-block;
                    background: #fff7ed;
                    color: #ff7a00;
                    padding: 2px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    margin: 2px;
                }
                .btn-action-icon {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 8px;
                }
                .btn-action-icon:hover { color: #ff7a00; }
                .btn-action-icon.delete:hover { color: #ef4444; }
                .editor-view-header {
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .btn-back {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                    padding: 8px 16px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .editor-title { font-size: 28px; font-weight: 800; color: #1e293b; margin: 0; }
                .editor-subtitle { color: #94a3b8; font-size: 15px; margin: 4px 0 0 0; }
                .btn-publish-orange {
                    background: #ff7a00;
                    color: white;
                    border: none;
                    padding: 12px 28px;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }
                .btn-cancel-top {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    color: #94a3b8;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-right: 12px;
                }
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

    const handleFinalSave = (editorData) => {
        onSave({
            ...editorData,
            tag_produk: selectedProducts
        });
    };

    return (
        <div className="editor-with-tags">
            <ArticleEditor
                ref={ref}
                initialData={initialData}
                onSave={handleFinalSave}
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
