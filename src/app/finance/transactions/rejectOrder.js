"use client";
import React, { useState, useEffect } from "react";
import "@/styles/finance/pesanan.css";
import { BACKEND_URL } from "@/config/env";

// Helper function untuk build image URL via proxy
const buildImageUrl = (path) => {
  if (!path) return null;
  
  // Jika sudah full URL (http:// atau https://), extract path-nya
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      let cleanPath = url.pathname;
      cleanPath = cleanPath.replace(/^\/+/, "");
      cleanPath = cleanPath.replace(/^storage\//, "");
      return `/api/image?path=${encodeURIComponent(cleanPath)}`;
    } catch (e) {
      const match = path.match(/\/(storage\/.*)$/);
      if (match) {
        let cleanPath = match[1].replace(/^storage\//, "");
        return `/api/image?path=${encodeURIComponent(cleanPath)}`;
      }
      return path;
    }
  }
  
  if (path.startsWith("/storage/")) {
    let cleanPath = path.replace(/^\/storage\//, "");
    return `/api/image?path=${encodeURIComponent(cleanPath)}`;
  }
  
  return `/api/image?path=${encodeURIComponent(path)}`;
};

export default function RejectOrder({ order, onClose, onReject }) {
  const [loading, setLoading] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch detail data dari API
  // order.id adalah ID payment validation (bukan order_id)
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!order?.id) {
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Token tidak ditemukan");
          setDataLoading(false);
          return;
        }

        // Menggunakan order.id (ID payment validation), bukan order_id
        const response = await fetch(
          `/api/finance/order-validation/${order.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const json = await response.json();

        if (!response.ok) {
          console.error("API Error:", {
            status: response.status,
            statusText: response.statusText,
            message: json.message || json.error || "Gagal memuat data",
            json: json,
          });
          setError(json.message || json.error || `Gagal memuat data (${response.status})`);
          setDataLoading(false);
          return;
        }

        if (json.success && json.data) {
          setOrderData(json.data);
        } else {
          setError(json.message || "Gagal memuat data");
        }
      } catch (err) {
        console.error("Error fetching order detail:", err);
        if (err.message && err.message.includes("JSON")) {
          setError("Format response tidak valid. Pastikan endpoint benar.");
        } else {
          setError(`Terjadi kesalahan: ${err.message || "Gagal memuat data"}`);
        }
      } finally {
        setDataLoading(false);
      }
    };

    fetchOrderDetail();
  }, [order?.id]);

  // Format tanggal
  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  // Format status validasi
  const getStatusLabel = (status) => {
    const statusCode = Number(status?.toString().trim() || 0);
    switch (statusCode) {
      case 0:
      case 1:
        return "Menunggu";
      case 2:
        return "Valid";
      case 3:
        return "Ditolak";
      default:
        return "-";
    }
  };

  // Format payment method
  const getPaymentMethodLabel = (method) => {
    if (!method) return "-";
    const methodMap = {
      cc: "Credit Card",
      transfer: "Transfer",
      cash: "Cash",
      ewallet: "E-Wallet",
      manual: "Manual",
    };
    return methodMap[method.toLowerCase()] || method.toUpperCase();
  };

  const handleReject = async () => {
    if (!catatan.trim()) {
      alert("Mohon isi catatan penolakan");
      return;
    }

    setLoading(true);
    try {
      if (onReject) {
        await onReject(order, catatan);
        // onClose akan dipanggil di onReject jika berhasil
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <div className="orders-modal-overlay">
      <div className="orders-modal-card">
        {/* Header */}
        <div className="orders-modal-header">
          <div>
            <p className="orders-modal-eyebrow">Konfirmasi</p>
            <h2>Tolak Pesanan</h2>
          </div>
          <button className="orders-modal-close" onClick={onClose} type="button" aria-label="Tutup">
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Body */}
        <div className="orders-modal-body">
          {dataLoading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem", color: "#f1a124" }} />
              <p style={{ marginTop: "1rem", color: "#6b7280" }}>Memuat data...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <i className="pi pi-exclamation-triangle" style={{ fontSize: "2rem", color: "#ef4444" }} />
              <p style={{ marginTop: "1rem", color: "#ef4444" }}>{error}</p>
            </div>
          ) : orderData ? (
            <>
              <div className="orders-section">
                <p style={{ marginBottom: "1.5rem", color: "var(--dash-text)", fontSize: "1rem", textAlign: "center", fontWeight: 500 }}>
                  Apakah Anda yakin ingin menolak pembayaran ini?
                </p>

                {/* Ringkasan Informasi Penting */}
                <div
                  style={{
                    padding: "1rem",
                    background: "#fef2f2",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div className="orders-row">
                    <p style={{ fontWeight: 600 }}>Customer</p>
                    <span style={{ fontWeight: 600 }}>{orderData.customer?.nama || "-"}</span>
                  </div>
                  <div className="orders-row">
                    <p>Produk</p>
                    <span>{orderData.produk?.nama || "-"}</span>
                  </div>
                  <div className="orders-row">
                    <p>Order ID</p>
                    <span>#{orderData.order_id || "-"}</span>
                  </div>
                  <div className="orders-row">
                    <p>Jumlah Pembayaran</p>
                    <span style={{ fontWeight: 600, color: "#dc2626", fontSize: "1.1rem" }}>
                      Rp {Number(orderData.amount || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="orders-row">
                    <p>Pembayaran Ke-</p>
                    <span>{orderData.payment_ke || "-"}</span>
                  </div>
                  <div className="orders-row">
                    <p>Tipe Pembayaran</p>
                    <span>
                      {(() => {
                        // Cek apakah order memiliki status_pembayaran === 4 (DP)
                        const statusPembayaran = order?.order_rel?.status_pembayaran !== undefined && order?.order_rel?.status_pembayaran !== null
                          ? Number(order.order_rel.status_pembayaran)
                          : (orderData.order?.status_pembayaran !== undefined && orderData.order?.status_pembayaran !== null
                            ? Number(orderData.order.status_pembayaran)
                            : null);
                        
                        // Jika status_pembayaran === 4, berarti DP
                        if (statusPembayaran === 4) {
                          return "DP (Down Payment)";
                        }
                        
                        // Jika bukan DP, tampilkan payment_type sesuai nilai
                        if (orderData.payment_type === "1") {
                          return "Pembayaran Pertama";
                        } else if (orderData.payment_type === "2") {
                          return "Pelunasan";
                        } else if (orderData.payment_type) {
                          return orderData.payment_type;
                        }
                        
                        return "-";
                      })()}
                    </span>
                  </div>
                  <div className="orders-row">
                    <p>Metode Pembayaran</p>
                    <span>{getPaymentMethodLabel(orderData.payment_method) || "-"}</span>
                  </div>
                </div>

                <div className="orders-field">
                  <label htmlFor="reject-catatan" style={{ fontWeight: 600, marginBottom: "0.5rem", display: "block" }}>
                    Catatan Penolakan *
                  </label>
                  <textarea
                    id="reject-catatan"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Masukkan alasan penolakan pembayaran ini..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
                    Catatan ini akan ditampilkan kepada customer sebagai alasan penolakan.
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="orders-modal-footer">
          <button
            className="orders-btn orders-btn--ghost"
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            Batal
          </button>
          <button
            className="orders-btn orders-btn--primary"
            onClick={handleReject}
            type="button"
            disabled={loading || !catatan.trim()}
            style={{ background: "#ef4444", color: "#fff" }}
          >
            {loading ? (
              <>
                <i className="pi pi-spin pi-spinner" style={{ marginRight: "0.5rem" }} />
                Memproses...
              </>
            ) : (
              <>
                <i className="pi pi-times" style={{ marginRight: "0.5rem" }} />
                Tolak
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
