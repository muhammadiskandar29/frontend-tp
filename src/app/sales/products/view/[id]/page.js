"use client";

import { useEffect, useState } from "react";
import React from "react";
import Layout from "@/components/Layout";
import { getProductById } from "@/lib/products";
import FollowupSection from "./FollowupSection";

export default function DetailProdukPage({ params }) {
  const resolved = React.use(params);
  const { id } = resolved;

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
        </div>

        {/* === TAB DETAIL === */}
        {activeTab === "detail" && (
          <>
            {/* HEADER IMAGE */}
            <div className="header-section">
              <img
                src={`/storage/${product.header}`}
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
                          src={`/storage/${g.path}`}
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
        {activeTab === "followup" && (
  <FollowupSection productId={id} />
)}

      </div>

      <style>{`

        /* LIMIT WIDTH */
        .product-detail-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          animation: fadeIn 0.3s ease;
          margin-right: 20px;
margin-left: 275px;
margin-top: 20px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ======= ANALYTICS STYLE (TAMBAHAN) ======= */
        .analytics-box {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .analytics-item {
          background: white;
          padding: 15px;
          border-radius: 12px;
          box-shadow: 0 3px 12px rgba(0,0,0,0.06);
          text-align: center;
        }

        .analytics-item h3 {
          font-weight: 600;
          color: #555;
          margin-bottom: 4px;
        }

        .analytics-item p {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
        }

        /* ===================== */
        /*        TABS           */
        /* ===================== */
        .top-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tab {
          padding: 10px 16px;
          border-radius: 8px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .tab:hover {
          background: #e5e7eb;
        }

        .tab.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        /* ===================== */
        /*      HEADER AREA      */
        /* ===================== */
        .header-section {
          display: flex;
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          gap: 20px;
          margin-bottom: 25px;
          align-items: center;
        }

        .header-image {
          width: 180px;
          height: 180px;
          object-fit: cover;
          border-radius: 12px;
        }

        .header-info h1 {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 6px;
        }

        .category-tag {
          display: inline-block;
          background: #EEF4FF;
          color: #3B82F6;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .price {
          font-size: 22px;
          font-weight: bold;
          color: #10B981;
        }

        .price-coret {
          text-decoration: line-through;
          color: #888;
          margin-top: 4px;
        }

        /* ===================== */
        /*       GRID AREA       */
        /* ===================== */
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .detail-card {
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 3px 12px rgba(0,0,0,0.06);
        }

        .detail-card h2 {
          margin-bottom: 15px;
          font-size: 20px;
          font-weight: bold;
        }

        .info-row {
          margin-bottom: 12px;
        }

        .info-row span {
          display: block;
          font-weight: 600;
          color: #555;
        }

        /* ===================== */
        /*       GALLERY         */
        /* ===================== */

        .gallery-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .gallery-item img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 10px;
        }

        .gallery-item p {
          text-align: center;
          margin-top: 6px;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
          .header-section {
            flex-direction: column;
            text-align: center;
          }
          .header-image {
            width: 100%;
            height: 200px;
          }
        }
      `}</style>
    </Layout>
  );
}
