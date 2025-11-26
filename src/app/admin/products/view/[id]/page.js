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
  if (!path) return "/placeholder-image.png";
  // Bersihkan path dari prefix yang tidak diperlukan
  const cleanPath = path.replace(/^\/?(storage\/)?/, "");
  return `/api/image?path=${encodeURIComponent(cleanPath)}`;
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

  const gallery = product.gambar ? JSON.parse(product.gambar) : [];

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
              <img
                src={buildImageUrl(product.header)}
                className="header-image"
                alt={product.nama}
              />

              <div className="header-info">
                <h1>{product.nama}</h1>
                <p className="category-tag">{product.kategori_rel?.nama}</p>
                <p className="price">Rp {product.harga_asli}</p>
                {product.harga_coret && (
                  <p className="price-coret">Rp {product.harga_coret}</p>
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
                  <p>{product.nama}</p>
                </div>

                <div className="info-row">
                  <span>Deskripsi:</span>
                  <p>{product.deskripsi}</p>
                </div>

                <div className="info-row">
                  <span>Tanggal Event:</span>
                  <p>{product.tanggal_event}</p>
                </div>

                <div className="info-row">
                  <span>URL:</span>
                  <p>{product.url}</p>
                </div>

                <div className="info-row">
                  <span>User Input:</span>
                  <p>{product.user_rel?.nama}</p>
                </div>

                <div className="info-row">
                  <span>Status:</span>
                  <p>{product.status === "1" ? "Aktif" : "Nonaktif"}</p>
                </div>
              </div>

              {/* GALLERY */}
              <div className="detail-card">
                <h2>Gallery Produk</h2>

                {gallery.length === 0 ? (
                  <p>Tidak ada gambar gallery</p>
                ) : (
                  <div className="gallery-list">
                    {gallery.map((g, i) => (
                      <div key={i} className="gallery-item">
                        <img
                          src={buildImageUrl(g.path)}
                          alt={g.caption}
                        />
                        <p>{g.caption}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
