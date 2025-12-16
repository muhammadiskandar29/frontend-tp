"use client";
import React, { useState, useEffect } from "react";
import "@/styles/finance/pesanan.css";

// Helper function untuk build image URL via proxy
const buildImageUrl = (path) => {
  if (!path) return null;
  // Jika sudah full URL, gunakan langsung
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Bersihkan path dari prefix yang tidak diperlukan
  const cleanPath = path.replace(/^\/?(storage\/)?/, "");
  return `/api/image?path=${encodeURIComponent(cleanPath)}`;
};

export default function ViewOrders({ order, onClose }) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch detail data dari API
  // order.id adalah ID payment validation (bukan order_id)
  // Contoh: jika response API memiliki id: 12 dan order_id: 153, kita gunakan id: 12
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!order?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Token tidak ditemukan");
          setLoading(false);
          return;
        }

        // Menggunakan order.id (ID payment validation), bukan order_id
        const response = await fetch(
          `http://3.105.234.181:8000/api/finance/order-validation/${order.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();

        if (json.success && json.data) {
          setOrderData(json.data);
        } else {
          setError(json.message || "Gagal memuat data");
        }
      } catch (err) {
        console.error("Error fetching order detail:", err);
        setError("Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [order?.id]);

  if (!order) return null;

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
    };
    return methodMap[method.toLowerCase()] || method.toUpperCase();
  };

  // 🔧 Tentukan URL gambar via proxy
  const buktiUrl = orderData?.bukti_pembayaran
    ? buildImageUrl(orderData.bukti_pembayaran)
    : null;

  return (
    <div className="orders-modal-overlay">
      <div className="orders-modal-card">
        {/* Header */}
        <div className="orders-modal-header">
          <div>
            <p className="orders-modal-eyebrow">Detail Validasi Pembayaran</p>
            <h2>Detail Pembayaran Order</h2>
          </div>
          <button className="orders-modal-close" onClick={onClose} type="button" aria-label="Tutup detail">
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Body */}
        <div className="orders-modal-body">
          {loading ? (
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
              {/* Informasi Pelanggan */}
              <div className="orders-section">
                <h4>Informasi Pelanggan</h4>
                <div className="orders-row">
                  <p>Nama</p>
                  <span>{orderData.customer?.nama || "-"}</span>
                </div>
                <div className="orders-row">
                  <p>Email</p>
                  <span>{orderData.customer?.email || "-"}</span>
                </div>
                <div className="orders-row">
                  <p>No. WhatsApp</p>
                  <span>{orderData.customer?.wa || "-"}</span>
                </div>
                <div className="orders-row">
                  <p>Alamat</p>
                  <span>{orderData.customer?.alamat || "-"}</span>
                </div>
              </div>

              {/* Detail Produk */}
              <div className="orders-section">
                <h4>Detail Produk</h4>
                <div className="orders-row">
                  <p>Nama Produk</p>
                  <span>{orderData.produk?.nama || "-"}</span>
                </div>
                <div className="orders-row">
                  <p>Kode Produk</p>
                  <span>{orderData.produk?.kode || "-"}</span>
                </div>
              </div>

              {/* Informasi Order */}
              <div className="orders-section">
                <h4>Informasi Order</h4>
                <div className="orders-row">
                  <p>Order ID</p>
                  <span>#{orderData.order_id || "-"}</span>
                </div>
                <div className="orders-row">
                  <p>Total Harga</p>
                  <span>Rp {Number(orderData.order?.total_harga || 0).toLocaleString("id-ID")}</span>
                </div>
                <div className="orders-row">
                  <p>Ongkir</p>
                  <span>Rp {Number(orderData.order?.ongkir || 0).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Informasi Pembayaran */}
              <div className="orders-section">
                <h4>Informasi Pembayaran</h4>
                <div className="orders-row">
                  <p>ID Validasi</p>
                  <span>#{orderData.id || "-"}</span>
                </div>
                <div className="orders-row">
                  <p>Jumlah Pembayaran</p>
                  <span style={{ fontWeight: 600, color: "#059669" }}>
                    Rp {Number(orderData.amount || 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="orders-row">
                  <p>Pembayaran Ke-</p>
                  <span>{orderData.payment_ke || "-"}</span>
                </div>
                <div className="orders-row">
                  <p>Metode Pembayaran</p>
                  <span>{getPaymentMethodLabel(orderData.payment_method) || "-"}</span>
                </div>
                <div className="orders-row">
                  <p>Tipe Pembayaran</p>
                  <span>
                    {orderData.payment_type === "1"
                      ? "DP (Down Payment)"
                      : orderData.payment_type === "2"
                      ? "Pelunasan"
                      : orderData.payment_type || "-"}
                  </span>
                </div>
                <div className="orders-row">
                  <p>Tanggal Pembayaran</p>
                  <span>{formatTanggal(orderData.tanggal) || "-"}</span>
                </div>
                <div className="orders-row">
                  <p>Status Validasi</p>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      display: "inline-block",
                      backgroundColor:
                        getStatusLabel(orderData.status) === "Valid"
                          ? "#d1fae5"
                          : getStatusLabel(orderData.status) === "Ditolak"
                          ? "#fee2e2"
                          : "#fef3c7",
                      color:
                        getStatusLabel(orderData.status) === "Valid"
                          ? "#059669"
                          : getStatusLabel(orderData.status) === "Ditolak"
                          ? "#dc2626"
                          : "#d97706",
                    }}
                  >
                    {getStatusLabel(orderData.status)}
                  </span>
                </div>
                {orderData.catatan && (
                  <div className="orders-row">
                    <p>Catatan</p>
                    <span>{orderData.catatan}</span>
                  </div>
                )}
                <div
                  className="orders-row"
                  style={{ flexDirection: "column", alignItems: "flex-start" }}
                >
                  <p>Bukti Pembayaran</p>
                  {buktiUrl ? (
                    <>
                      <p style={{ fontSize: "0.85rem", color: "#374151", marginBottom: "0.5rem" }}>
                        📎 Bukti Pembayaran ({orderData.customer?.nama || "-"})
                      </p>
                      <img
                        src={buktiUrl}
                        alt={`Bukti Pembayaran ${orderData.customer?.nama || "-"}`}
                        onClick={() => setShowImageModal(true)}
                        style={{
                          maxWidth: 150,
                          maxHeight: 120,
                          objectFit: "cover",
                          marginTop: 4,
                          borderRadius: 6,
                          border: "1px solid #e5e7eb",
                          cursor: "pointer",
                          transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "scale(1.05)";
                          e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "scale(1)";
                          e.target.style.boxShadow = "none";
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
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="orders-modal-footer">
          <button className="orders-btn orders-btn--primary" onClick={onClose} type="button">
            Tutup
          </button>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageModal && buktiUrl && orderData && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "2rem",
          }}
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: "1.5rem",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.2)";
            }}
            aria-label="Tutup"
          >
            <i className="pi pi-times" />
          </button>
          <img
            src={buktiUrl}
            alt={`Bukti Pembayaran ${orderData.customer?.nama || "-"}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: "8px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
            onError={(e) => {
              console.error("Gagal memuat gambar:", buktiUrl);
            }}
          />
        </div>
      )}
    </div>
  );
}
