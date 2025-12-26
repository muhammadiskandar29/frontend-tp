"use client";
import React from "react";
// CSS sudah di-import di page.js untuk menghindari preload warning

const STATUS_MAP = {
  0: "Unpaid",
  1: "Paid",
  2: "Sukses",
  3: "Gagal",
};

// 🔹 Helper untuk menentukan status bayar otomatis
const computeStatusBayar = (order) => {
  if (
    order.bukti_pembayaran &&
    order.bukti_pembayaran !== "" &&
    order.waktu_pembayaran &&
    order.waktu_pembayaran !== ""
  ) {
    return 1; // Paid
  }
  return 0; // Unpaid
};

// Helper function untuk build image URL via proxy
const buildImageUrl = (path) => {
  if (!path) return null;
  const cleanPath = path.replace(/^\/?(storage\/)?/, "");
  return `/api/image?path=${encodeURIComponent(cleanPath)}`;
};

export default function ViewOrders({ order, onClose }) {
  if (!order) return null;

  const statusBayar = computeStatusBayar(order);
  const statusLabel = STATUS_MAP[statusBayar];
  const buktiUrl = buildImageUrl(order.bukti_pembayaran);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* HEADER */}
        <div className="modal-header">
          <h2>Detail Pesanan</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          <div className="detail-list">
            {/* Informasi Pelanggan */}
            <div className="detail-section">
              <h4 className="detail-section-title">Informasi Pelanggan</h4>
              <div className="detail-item">
                <span className="detail-label">Nama</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">{order.customer_rel?.nama || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">No. WhatsApp</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">{order.customer_rel?.wa || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Alamat</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">{order.alamat || "-"}</span>
              </div>
            </div>

            <div className="detail-section-divider"></div>

            {/* Detail Produk */}
            <div className="detail-section">
              <h4 className="detail-section-title">Detail Produk</h4>
              <div className="detail-item">
                <span className="detail-label">Nama Produk</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">{order.produk_rel?.nama || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Harga</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">Rp {Number(order.harga || 0).toLocaleString("id-ID")}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ongkir</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">Rp {Number(order.ongkir || 0).toLocaleString("id-ID")}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Harga</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">Rp {Number(order.total_harga || 0).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="detail-section-divider"></div>

            {/* Informasi Pembayaran */}
            <div className="detail-section">
              <h4 className="detail-section-title">Informasi Pembayaran</h4>
              <div className="detail-item">
                <span className="detail-label">Status Pembayaran</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">
                  <span className={`status-badge ${statusLabel.toLowerCase()}`}>{statusLabel}</span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Metode Pembayaran</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">{order.metode_bayar || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Waktu Pembayaran</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">{order.waktu_pembayaran || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Bukti Pembayaran</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">
                  {buktiUrl ? (
                    <img
                      src={buktiUrl}
                      alt={`Bukti Pembayaran ${order.customer_rel?.nama || "-"}`}
                      style={{
                        maxWidth: 150,
                        maxHeight: 120,
                        objectFit: "cover",
                        marginTop: 4,
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        console.error("Gagal memuat gambar:", buktiUrl);
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </span>
              </div>
            </div>

            <div className="detail-section-divider"></div>

            {/* Informasi Tambahan */}
            <div className="detail-section">
              <h4 className="detail-section-title">Informasi Tambahan</h4>
              <div className="detail-item">
                <span className="detail-label">Tanggal Pesanan</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">{order.tanggal || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sumber Pesanan</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">{order.sumber || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Order ID</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">#{order.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
