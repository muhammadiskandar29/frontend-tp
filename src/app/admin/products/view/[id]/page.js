"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { getProductById } from "@/lib/products";
import FollowupSection from "./FollowupSection";
import LinkZoomSection from "./LinkZoomSection";
import "@/styles/product-detail.css";

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

  return (
    <Layout title={`Detail Produk - ${product.nama}`}>
      <div className="product-detail-container">
        {/* Back Button */}
        <div className="product-detail-header">
          <button
            className="back-to-list-btn"
            onClick={() => router.push("/admin/products")}
          >
            <i className="pi pi-arrow-left" />
            <span>Back to Product List</span>
          </button>
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
        </div>

        {/* === TAB DETAIL === */}
        {activeTab === "detail" && (
          <>
            {/* HEADER IMAGE */}
            <div className="header-section">
              {product.header ? (
                <img
                  src={buildImageUrl(product.header)}
                  className="header-image"
                  alt={product.nama || "Product header"}
                  onError={(e) => {
                    e.target.src = "/placeholder-image.png";
                  }}
                />
              ) : (
                <div className="header-image-placeholder">
                  <span>No Image</span>
                </div>
              )}

              <div className="header-info">
                <h1>{product.nama || "-"}</h1>
                <p className="category-tag">{product.kategori_rel?.nama || product.kategori || "-"}</p>
                <div className="price-group">
                  {product.harga_coret && (
                    <p className="price-coret">Rp {formatCurrency(product.harga_coret)}</p>
                  )}
                  <p className="price">Rp {formatCurrency(product.harga_asli)}</p>
                </div>
                {product.kode && (
                  <p className="product-code">Kode: {product.kode}</p>
                )}
              </div>
            </div>

            {/* GRID */}
            <div className="detail-grid">
              {/* LEFT */}
              <div className="detail-card">
                <h2>Informasi Produk</h2>

                <div className="info-row">
                  <span>Nama Produk:</span>
                  <p>{product.nama || "-"}</p>
                </div>

                {product.kode && (
                  <div className="info-row">
                    <span>Kode Produk:</span>
                    <p>{product.kode}</p>
                  </div>
                )}

                <div className="info-row">
                  <span>Harga Asli:</span>
                  <p>Rp {formatCurrency(product.harga_asli)}</p>
                </div>

                {product.harga_coret && (
                  <div className="info-row">
                    <span>Harga Coret:</span>
                    <p>Rp {formatCurrency(product.harga_coret)}</p>
                  </div>
                )}

                <div className="info-row">
                  <span>Deskripsi:</span>
                  <p>{product.deskripsi || "-"}</p>
                </div>

                {product.tanggal_event && (
                  <div className="info-row">
                    <span>Tanggal Event:</span>
                    <p>
                      {new Date(product.tanggal_event).toLocaleString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                )}

                {product.url && (
                  <div className="info-row">
                    <span>URL:</span>
                    <p>{product.url}</p>
                  </div>
                )}

                {product.user_rel?.nama && (
                  <div className="info-row">
                    <span>User Input:</span>
                    <p>{product.user_rel.nama}</p>
                  </div>
                )}

                <div className="info-row">
                  <span>Status:</span>
                  <p>{product.status === "1" ? "Aktif" : "Nonaktif"}</p>
                </div>

                {product.landingpage && (
                  <div className="info-row">
                    <span>Landing Page:</span>
                    <p>{product.landingpage === "1" ? "Aktif" : "Nonaktif"}</p>
                  </div>
                )}
              </div>

              {/* GALLERY */}
              <div className="detail-card">
                <h2>Gallery Produk</h2>

                {gallery.length === 0 ? (
                  <p>Tidak ada gambar gallery</p>
                ) : (
                  <div className="gallery-list">
                    {gallery.map((g, i) => {
                      const imageUrl = buildImageUrl(g.path);
                      return (
                        <div key={i} className="gallery-item">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={g.caption || `Gallery ${i + 1}`}
                              onError={(e) => {
                                e.target.src = "/placeholder-image.png";
                              }}
                            />
                          ) : (
                            <div className="gallery-placeholder">
                              <span>No Image</span>
                            </div>
                          )}
                          {g.caption && <p>{g.caption}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* LIST POINT */}
            {listPoint.length > 0 && (
              <div className="detail-card">
                <h2>List Point</h2>
                <ul className="list-point-list">
                  {listPoint.map((point, i) => (
                    <li key={i}>{point.nama || point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* TESTIMONI */}
            {testimoni.length > 0 && (
              <div className="detail-card">
                <h2>Testimoni</h2>
                <div className="testimoni-list">
                  {testimoni.map((testi, i) => {
                    const imageUrl = buildImageUrl(testi.gambar);
                    return (
                      <div key={i} className="testimoni-item">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={testi.nama || `Testimoni ${i + 1}`}
                            className="testimoni-image"
                            onError={(e) => {
                              e.target.src = "/placeholder-image.png";
                            }}
                          />
                        ) : (
                          <div className="testimoni-image-placeholder">
                            <span>No Image</span>
                          </div>
                        )}
                        <div className="testimoni-content">
                          {testi.nama && <h4>{testi.nama}</h4>}
                          {testi.deskripsi && <p>{testi.deskripsi}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIDEO */}
            {video.length > 0 && (
              <div className="detail-card">
                <h2>Video</h2>
                <div className="video-list">
                  {video.map((url, i) => (
                    <div key={i} className="video-item">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOM FIELD */}
            {customField.length > 0 && (
              <div className="detail-card">
                <h2>Custom Field</h2>
                <div className="custom-field-list">
                  {customField.map((field, i) => (
                    <div key={i} className="custom-field-item">
                      <span className="field-label">{field.nama_field || field.label}:</span>
                      <span className="field-value">{field.value || "-"}</span>
                    </div>
                  ))}
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
      </div>
    </Layout>
  );
}
