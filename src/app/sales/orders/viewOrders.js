"use client";
import React from "react";
import "@/styles/pesanan.css";

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

const BASE_URL = "https://onedashboardapi-production.up.railway.app";

export default function ViewOrders({ order, onClose }) {
  if (!order) return null;

  // 🔍 Debug log untuk memastikan datanya benar
  console.log("🔍 Order Detail:", order);
  console.log("🖼️ Bukti Pembayaran Path:", order.bukti_pembayaran);
  console.log("🧾 Waktu Pembayaran:", order.waktu_pembayaran);
  console.log("💰 Status Pembayaran:", order.status_pembayaran);

  const statusBayar = computeStatusBayar(order);
  const statusLabel = STATUS_MAP[statusBayar];

  // 🔧 Tentukan URL gambar
  const buktiUrl = order.bukti_pembayaran
    ? order.bukti_pembayaran.startsWith("http")
      ? order.bukti_pembayaran
      : `${BASE_URL}/${order.bukti_pembayaran.replace(/^\/+/, "")}`
    : null;

  return (
    <div className="view-modal-overlay">
      <div className="view-modal-card">
        {/* Header */}
        <div className="view-modal-header">
          <h2>Detail Pesanan</h2>
          <div className="header-actions">
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="view-modal-body">
          {/* Informasi Pelanggan */}
          <div className="view-section">
            <h4>Informasi Pelanggan</h4>
            <div className="view-row">
              <p>Nama</p>
              <span>{order.customer_rel?.nama || "-"}</span>
            </div>
            <div className="view-row">
              <p>No. WhatsApp</p>
              <span>{order.customer_rel?.wa || "-"}</span>
            </div>
            <div className="view-row">
              <p>Alamat</p>
              <span>{order.alamat || "-"}</span>
            </div>
          </div>

          {/* Detail Produk */}
          <div className="view-section">
            <h4>Detail Produk</h4>
            <div className="view-row">
              <p>Nama Produk</p>
              <span>{order.produk_rel?.nama || "-"}</span>
            </div>
            <div className="view-row">
              <p>Harga</p>
              <span>Rp {Number(order.harga || 0).toLocaleString()}</span>
            </div>
            <div className="view-row">
              <p>Ongkir</p>
              <span>Rp {Number(order.ongkir || 0).toLocaleString()}</span>
            </div>
            <div className="view-row">
              <p>Total Harga</p>
              <span>Rp {Number(order.total_harga || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Pembayaran */}
          <div className="view-section">
            <h4>Informasi Pembayaran</h4>
            <div className="view-row">
              <p>Status Pembayaran</p>
              <span className={`status-badge ${statusLabel}`}>
                {statusLabel}
              </span>
            </div>
            <div className="view-row">
              <p>Metode Pembayaran</p>
              <span>{order.metode_bayar || "-"}</span>
            </div>
            <div className="view-row">
              <p>Waktu Pembayaran</p>
              <span>{order.waktu_pembayaran || "-"}</span>
            </div>
            <div
              className="view-row"
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
          <div className="view-section">
            <h4>Informasi Tambahan</h4>
            <div className="view-row">
              <p>Tanggal Pesanan</p>
              <span>{order.tanggal || "-"}</span>
            </div>
            <div className="view-row">
              <p>Sumber Pesanan</p>
              <span>{order.sumber || "-"}</span>
            </div>
            <div className="view-row">
              <p>Order ID</p>
              <span>#{order.id}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="view-modal-footer">
          <button className="btn-close" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
