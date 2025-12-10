"use client";
import React from "react";
import "@/styles/sales/pesanan.css";

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
  // Bersihkan path dari prefix yang tidak diperlukan
  const cleanPath = path.replace(/^\/?(storage\/)?/, "");
  return `/api/image?path=${encodeURIComponent(cleanPath)}`;
};

export default function ViewOrders({ order, onClose }) {
  if (!order) return null;

  // Debug log untuk memastikan datanya benar
  console.log("Order Detail:", order);
  console.log("Bukti Pembayaran Path:", order.bukti_pembayaran);
  console.log("🧾 Waktu Pembayaran:", order.waktu_pembayaran);
  console.log("Status Pembayaran:", order.status_pembayaran);

  const statusBayar = computeStatusBayar(order);
  const statusLabel = STATUS_MAP[statusBayar];

  // 🔧 Tentukan URL gambar via proxy
  const buktiUrl = buildImageUrl(order.bukti_pembayaran);

  return (
    <div className="orders-modal-overlay">
      <div className="orders-modal-card">
        {/* Header */}
        <div className="orders-modal-header">
          <div>
            <p className="orders-modal-eyebrow">Ringkasan Pesanan</p>
            <h2>Detail Pesanan</h2>
          </div>
          <button className="orders-modal-close" onClick={onClose} type="button" aria-label="Tutup detail">
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Body */}
        <div className="orders-modal-body">
          {/* Informasi Pelanggan */}
          <div className="orders-section">
            <h4>Informasi Pelanggan</h4>
            <div className="orders-row">
              <p>Nama</p>
              <span>{order.customer_rel?.nama || "-"}</span>
            </div>
            <div className="orders-row">
              <p>No. WhatsApp</p>
              <span>{order.customer_rel?.wa || "-"}</span>
            </div>
            <div className="orders-row">
              <p>Alamat</p>
              <span>{order.alamat || "-"}</span>
            </div>
          </div>

          {/* Detail Produk */}
          <div className="orders-section">
            <h4>Detail Produk</h4>
            <div className="orders-row">
              <p>Nama Produk</p>
              <span>{order.produk_rel?.nama || "-"}</span>
            </div>
            <div className="orders-row">
              <p>Harga</p>
              <span>Rp {Number(order.harga || 0).toLocaleString()}</span>
            </div>
            <div className="orders-row">
              <p>Ongkir</p>
              <span>Rp {Number(order.ongkir || 0).toLocaleString()}</span>
            </div>
            <div className="orders-row">
              <p>Total Harga</p>
              <span>Rp {Number(order.total_harga || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Pembayaran */}
          <div className="orders-section">
            <h4>Informasi Pembayaran</h4>
            <div className="orders-row">
              <p>Status Pembayaran</p>
              <span className={`status-badge ${statusLabel}`}>
                {statusLabel}
              </span>
            </div>
            <div className="orders-row">
              <p>Metode Pembayaran</p>
              <span>{order.metode_bayar || "-"}</span>
            </div>
            <div className="orders-row">
              <p>Waktu Pembayaran</p>
              <span>{order.waktu_pembayaran || "-"}</span>
            </div>
            <div
              className="orders-row"
              style={{ flexDirection: "column", alignItems: "flex-start" }}
            >
              <p>Bukti Pembayaran</p>
              {buktiUrl ? (
                <>
                  <p style={{ fontSize: "0.85rem", color: "#374151" }}>
                    📎 Bukti Pembayaran ({order.customer_rel?.nama || "-"})
                  </p>
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
                </>
              ) : (
                <span>-</span>
              )}
            </div>
          </div>

          {/* Informasi Tambahan */}
          <div className="orders-section">
            <h4>Informasi Tambahan</h4>
            <div className="orders-row">
              <p>Tanggal Pesanan</p>
              <span>{order.tanggal || "-"}</span>
            </div>
            <div className="orders-row">
              <p>Sumber Pesanan</p>
              <span>{order.sumber || "-"}</span>
            </div>
            <div className="orders-row">
              <p>Order ID</p>
              <span>#{order.id}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="orders-modal-footer">
          <button className="orders-btn orders-btn--primary" onClick={onClose} type="button">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
