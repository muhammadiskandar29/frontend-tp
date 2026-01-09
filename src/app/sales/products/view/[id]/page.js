"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { getProductById } from "@/lib/sales/products";
import FollowupSection from "./FollowupSection";
import LinkZoomSection from "./LinkZoomSection";
import TrainerSection from "./TrainerSection";
import { 
  ArrowLeft, Package, Tag, DollarSign, Calendar, 
  Globe, User, CheckCircle2, XCircle, FileText,
  Image as ImageIcon, Video, MessageSquare, List,
  Edit, ExternalLink, Copy, Eye
} from "lucide-react";
import "@/styles/sales/product-detail.css";

// Helper function untuk build image URL via proxy
const buildImageUrl = (path) => {
  if (!path) return null;
  
  // Jika path sudah full URL, return langsung
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // Bersihkan path dari prefix yang tidak diperlukan
  let cleanPath = path.replace(/^\/?(storage\/)?/, "");
  
  // Pastikan path tidak kosong
  if (!cleanPath || cleanPath.trim() === "") {
    return null;
  }
  
  return `/api/image?path=${encodeURIComponent(cleanPath)}`;
};

// Safe parse JSON dengan fallback
const safeParse = (value, fallback = []) => {
  if (!value) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  if (Array.isArray(value)) return value;
  return fallback;
};

// Format currency
const formatCurrency = (value) => {
  if (!value) return "0";
  return Number(value).toLocaleString("id-ID");
};

export default function DetailProdukPage({ params }) {
  const resolved = React.use(params);
  const { id } = resolved;
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // TAB STATE
  const [activeTab, setActiveTab] = useState("detail");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getProductById(id);
        console.log("📦 [VIEW PRODUCT] Fetched data:", data);
        console.log("📦 [VIEW PRODUCT] Data type:", Array.isArray(data) ? "array" : typeof data);
        console.log("📦 [VIEW PRODUCT] Nama produk:", data?.nama);
        console.log("📦 [VIEW PRODUCT] Header:", data?.header);
        console.log("📦 [VIEW PRODUCT] Gambar:", data?.gambar);
        
        if (!data) {
          console.error("❌ [VIEW PRODUCT] No data received");
          return;
        }
        
        setProduct(data);
      } catch (err) {
        console.error("❌ Error fetching detail:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <Layout>Memuat detail produk...</Layout>;
  if (!product) return <Layout>Produk tidak ditemukan.</Layout>;

  // Parse JSON fields dengan safe parse
  const gallery = safeParse(product.gambar, []);
  const testimoni = safeParse(product.testimoni, []);
  const listPoint = safeParse(product.list_point, []);
  const video = safeParse(product.video, []);
  const customField = safeParse(product.custom_field, []);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You can add toast notification here if needed
  };

  return (
    <Layout title={`Detail Produk - ${product.nama}`}>
      <div className="product-detail-container">
        {/* Header with Back Button and Actions */}
        <div className="product-detail-header">
          <button
            className="back-to-list-btn"
            onClick={() => router.push("/sales/products")}
          >
            <ArrowLeft size={18} />
            <span>Kembali ke Daftar Produk</span>
          </button>
          
          <div className="header-actions">
            <button
              className="action-btn secondary"
              onClick={() => router.push(`/sales/products/editProducts/${id}`)}
            >
              <Edit size={16} />
              <span>Edit Produk</span>
            </button>
            {product.url && (
              <button
                className="action-btn primary"
                onClick={() => window.open(product.url, '_blank')}
              >
                <ExternalLink size={16} />
                <span>Lihat Landing Page</span>
              </button>
            )}
          </div>
        </div>

        <div className="analytics-box">
          <div className="analytics-item">
            <h3>Sales Page View</h3>
            <p>43</p>
          </div>
          <div className="analytics-item">
            <h3>Checkout Page View</h3>
            <p>0</p>
          </div>
          <div className="analytics-item">
            <h3>Order</h3>
            <p>0</p>
          </div>
          <div className="analytics-item">
            <h3>Paid</h3>
            <p>0</p>
          </div>
        </div>
        {/* TABS */}
        <div className="top-tabs">
          <button
            className={`tab ${activeTab === "detail" ? "active" : ""}`}
            onClick={() => setActiveTab("detail")}
          >
            Detail Produk
          </button>
          <button
            className={`tab ${activeTab === "followup" ? "active" : ""}`}
            onClick={() => setActiveTab("followup")}
          >
            Followup Text
          </button>
          <button
            className={`tab ${activeTab === "link-zoom" ? "active" : ""}`}
            onClick={() => setActiveTab("link-zoom")}
          >
            Link Zoom
          </button>
          <button
            className={`tab ${activeTab === "trainer" ? "active" : ""}`}
            onClick={() => setActiveTab("trainer")}
          >
            Trainer
          </button>
        </div>

        {/* === TAB DETAIL === */}
        {activeTab === "detail" && (
          <>
            {/* Product Hero Section */}
            <div className="product-hero-section">
              <div className="product-hero-content">
                <div className="product-title-section">
                  <h1 className="product-title">{product.nama || "-"}</h1>
                  <div className="product-meta-tags">
                    {product.kategori_rel?.nama && (
                      <span className="meta-tag category">
                        <Package size={14} />
                        {product.kategori_rel.nama}
                      </span>
                    )}
                    {product.kode && (
                      <span className="meta-tag code">
                        <Tag size={14} />
                        {product.kode}
                      </span>
                    )}
                    <span className={`meta-tag status ${product.status === "1" ? "active" : "inactive"}`}>
                      {product.status === "1" ? (
                        <>
                          <CheckCircle2 size={14} />
                          Aktif
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          Nonaktif
                        </>
                      )}
                    </span>
                    {product.landingpage && (
                      <span className={`meta-tag landing ${product.landingpage === "1" ? "active" : "inactive"}`}>
                        {product.landingpage === "1" ? (
                          <>
                            <Eye size={14} />
                            Landing Page Aktif
                          </>
                        ) : (
                          <>
                            <Eye size={14} />
                            Landing Page Nonaktif
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="product-price-section">
                  {product.harga_coret && (
                    <div className="price-old">
                      Rp {formatCurrency(product.harga_coret)}
                    </div>
                  )}
                  <div className="price-current">
                    Rp {formatCurrency(product.harga_asli || product.harga || 0)}
                  </div>
                </div>
              </div>
              
              {/* Optional Header Image */}
              {product.header && (
                <div className="product-hero-image">
                  <img
                    src={buildImageUrl(product.header)}
                    alt={product.nama || "Product header"}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Information Cards Grid */}
            <div className="info-cards-grid">
              {/* Basic Information Card */}
              <div className="info-card">
                <div className="info-card-header">
                  <Package size={20} />
                  <h2>Informasi Dasar</h2>
                </div>
                <div className="info-card-body">
                  <div className="info-item">
                    <div className="info-label">
                      <FileText size={16} />
                      <span>Nama Produk</span>
                    </div>
                    <div className="info-value">{product.nama || "-"}</div>
                  </div>

                  {product.kode && (
                    <div className="info-item">
                      <div className="info-label">
                        <Tag size={16} />
                        <span>Kode Produk</span>
                      </div>
                      <div className="info-value">
                        <span className="code-value">{product.kode}</span>
                        <button 
                          className="copy-btn"
                          onClick={() => copyToClipboard(product.kode)}
                          title="Copy kode"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {product.deskripsi && (
                    <div className="info-item full-width">
                      <div className="info-label">
                        <FileText size={16} />
                        <span>Deskripsi</span>
                      </div>
                      <div className="info-value">{product.deskripsi}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Information Card */}
              <div className="info-card">
                <div className="info-card-header">
                  <DollarSign size={20} />
                  <h2>Harga</h2>
                </div>
                <div className="info-card-body">
                  <div className="info-item">
                    <div className="info-label">
                      <DollarSign size={16} />
                      <span>Harga</span>
                    </div>
                    <div className="info-value price-value">
                      Rp {formatCurrency(product.harga_asli || product.harga || 0)}
                    </div>
                  </div>
                  {product.harga_coret && (
                    <div className="info-item">
                      <div className="info-label">
                        <DollarSign size={16} />
                        <span>Harga Coret</span>
                      </div>
                      <div className="info-value price-old-value">
                        Rp {formatCurrency(product.harga_coret)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event & URL Information Card */}
              <div className="info-card">
                <div className="info-card-header">
                  <Calendar size={20} />
                  <h2>Event & URL</h2>
                </div>
                <div className="info-card-body">
                  {product.tanggal_event && (
                    <div className="info-item">
                      <div className="info-label">
                        <Calendar size={16} />
                        <span>Tanggal Event</span>
                      </div>
                      <div className="info-value">{formatDate(product.tanggal_event)}</div>
                    </div>
                  )}
                  {product.url && (
                    <div className="info-item">
                      <div className="info-label">
                        <Globe size={16} />
                        <span>URL</span>
                      </div>
                      <div className="info-value">
                        <a 
                          href={product.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="url-link"
                        >
                          {product.url}
                          <ExternalLink size={14} />
                        </a>
                        <button 
                          className="copy-btn"
                          onClick={() => copyToClipboard(product.url)}
                          title="Copy URL"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User & Status Information Card */}
              <div className="info-card">
                <div className="info-card-header">
                  <User size={20} />
                  <h2>Pengelola & Status</h2>
                </div>
                <div className="info-card-body">
                  {product.user_rel?.nama && (
                    <div className="info-item">
                      <div className="info-label">
                        <User size={16} />
                        <span>Dibuat Oleh</span>
                      </div>
                      <div className="info-value">{product.user_rel.nama}</div>
                    </div>
                  )}
                  <div className="info-item">
                    <div className="info-label">
                      <CheckCircle2 size={16} />
                      <span>Status Produk</span>
                    </div>
                    <div className="info-value">
                      <span className={`status-badge ${product.status === "1" ? "active" : "inactive"}`}>
                        {product.status === "1" ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </div>
                  {product.landingpage && (
                    <div className="info-item">
                      <div className="info-label">
                        <Eye size={16} />
                        <span>Status Landing Page</span>
                      </div>
                      <div className="info-value">
                        <span className={`status-badge ${product.landingpage === "1" ? "active" : "inactive"}`}>
                          {product.landingpage === "1" ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery Card */}
            <div className="info-card full-width">
              <div className="info-card-header">
                <ImageIcon size={20} />
                <h2>Gallery Produk</h2>
                <span className="badge-count">{gallery.length} gambar</span>
              </div>
              <div className="info-card-body">
                {gallery.length === 0 ? (
                  <div className="empty-state">
                    <ImageIcon size={48} />
                    <p>Tidak ada gambar gallery</p>
                  </div>
                ) : (
                  <div className="gallery-grid">
                    {gallery.map((g, i) => {
                      const imageUrl = buildImageUrl(g.path);
                      return (
                        <div key={i} className="gallery-card">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={g.caption || `Gallery ${i + 1}`}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="gallery-placeholder" style={{ display: imageUrl ? 'none' : 'flex' }}>
                            <ImageIcon size={24} />
                            <span>No Image</span>
                          </div>
                          {g.caption && <p className="gallery-caption">{g.caption}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* List Point Card */}
            {listPoint.length > 0 && (
              <div className="info-card full-width">
                <div className="info-card-header">
                  <List size={20} />
                  <h2>List Point</h2>
                  <span className="badge-count">{listPoint.length} item</span>
                </div>
                <div className="info-card-body">
                  <ul className="list-point-grid">
                    {listPoint.map((point, i) => (
                      <li key={i} className="list-point-item">
                        <CheckCircle2 size={18} />
                        <span>{point.nama || point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Testimoni Card */}
            {testimoni.length > 0 && (
              <div className="info-card full-width">
                <div className="info-card-header">
                  <MessageSquare size={20} />
                  <h2>Testimoni</h2>
                  <span className="badge-count">{testimoni.length} testimoni</span>
                </div>
                <div className="info-card-body">
                  <div className="testimoni-grid">
                    {testimoni.map((testi, i) => {
                      const imageUrl = buildImageUrl(testi.gambar);
                      return (
                        <div key={i} className="testimoni-card">
                          <div className="testimoni-avatar">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={testi.nama || `Testimoni ${i + 1}`}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="testimoni-avatar-placeholder" style={{ display: imageUrl ? 'none' : 'flex' }}>
                              <User size={24} />
                            </div>
                          </div>
                          <div className="testimoni-content">
                            {testi.nama && <h4>{testi.nama}</h4>}
                            {testi.deskripsi && <p>{testi.deskripsi}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Video Card */}
            {video.length > 0 && (
              <div className="info-card full-width">
                <div className="info-card-header">
                  <Video size={20} />
                  <h2>Video</h2>
                  <span className="badge-count">{video.length} video</span>
                </div>
                <div className="info-card-body">
                  <div className="video-grid">
                    {video.map((url, i) => (
                      <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="video-card"
                      >
                        <Video size={20} />
                        <span>{url}</span>
                        <ExternalLink size={16} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Field Card */}
            {customField.length > 0 && (
              <div className="info-card full-width">
                <div className="info-card-header">
                  <FileText size={20} />
                  <h2>Custom Field</h2>
                  <span className="badge-count">{customField.length} field</span>
                </div>
                <div className="info-card-body">
                  <div className="custom-field-grid">
                    {customField.map((field, i) => (
                      <div key={i} className="custom-field-card">
                        <div className="custom-field-label">
                          {field.nama_field || field.label || `Field ${i + 1}`}
                        </div>
                        <div className="custom-field-value">
                          {field.value || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* === TAB FOLLOWUP TEXT === */}
        {activeTab === "followup" && <FollowupSection productId={id} />}

        {/* === TAB LINK ZOOM === */}
        {activeTab === "link-zoom" && (
          <LinkZoomSection productId={id} productName={product.nama} />
        )}

        {/* === TAB TRAINER === */}
        {activeTab === "trainer" && (
          <TrainerSection
            productId={id}
            product={product}
            onProductUpdate={(updatedProduct) => {
              setProduct(updatedProduct);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
