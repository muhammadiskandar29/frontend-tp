"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/styles/pesanan.css";

// Use Next.js proxy to avoid CORS
const BASE_URL = "/api";

// Helper function to clean order data
const cleanOrderData = (orderData) => {
  if (!orderData) return {};
  
  const cleaned = { ...orderData };
  
  // Ensure customer is an ID, not an object
  if (cleaned.customer && typeof cleaned.customer === "object") {
    cleaned.customer = cleaned.customer.id || cleaned.customer_rel?.id || null;
  }
  
  // Ensure produk is an ID, not an object
  if (cleaned.produk && typeof cleaned.produk === "object") {
    cleaned.produk = cleaned.produk.id || cleaned.produk_rel?.id || null;
  }
  
  return cleaned;
};

export default function UpdateOrders({ order, onClose, onSave, setToast }) {
  const router = useRouter();
  const [updatedOrder, setUpdatedOrder] = useState(order ? cleanOrderData(order) : {});
  const [showKonfirmasiModal, setShowKonfirmasiModal] = useState(false);
  const [bukti, setBukti] = useState(
    order?.bukti_pembayaran
      ? { name: order.bukti_pembayaran, existing: true, url: order.bukti_pembayaran }
      : null
  );
  const [metodeBayar, setMetodeBayar] = useState(order?.metode_bayar ?? "");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setUpdatedOrder(cleanOrderData(order));
      setBukti(
        order.bukti_pembayaran
          ? { name: order.bukti_pembayaran, existing: true, url: order.bukti_pembayaran }
          : null
      );
      setMetodeBayar(order.metode_bayar ?? "");
      setErrorMsg("");
    }
  }, [order]);

  const computedStatus = () => {
    if (
      updatedOrder.bukti_pembayaran &&
      updatedOrder.waktu_pembayaran &&
      updatedOrder.bukti_pembayaran !== ""
    )
      return 1;
    return 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedOrder((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
  };

  const handleKonfirmasiFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setBukti({ name: file.name, file, existing: false, url: previewUrl });
    }
  };

  const getPaymentStatus = (orderData) => {
    if (orderData.bukti_pembayaran && orderData.waktu_pembayaran && orderData.metode_bayar) return 1;
    return Number(orderData.status_pembayaran) || 0;
  };

  const handleKonfirmasiSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!order?.id) return setErrorMsg("Order ID tidak valid.");
    if (!bukti?.file) return setErrorMsg("Harap upload bukti pembayaran baru.");
    if (!metodeBayar) return setErrorMsg("Isi metode pembayaran terlebih dahulu.");

    setSubmitting(true);

    try {
      // Format waktu: dd-mm-yyyy HH:mm:ss
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const waktuPembayaran = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      // Build FormData sesuai API spec
      const formData = new FormData();
      formData.append("bukti_pembayaran", bukti.file);
      formData.append("waktu_pembayaran", waktuPembayaran);
      formData.append("metode_pembayaran", metodeBayar);

      const token = localStorage.getItem("token");
      const url = `${BASE_URL}/admin/order-konfirmasi/${order.id}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      // Cek sukses: bisa dari success field, atau dari message yang mengandung "Sukses"
      const isSuccess = res.ok && (
        data.success === true || 
        (data.message && data.message.toLowerCase().includes("sukses"))
      );

      if (!isSuccess) {
        const errMsg = data?.message || data?.error || "Gagal konfirmasi pembayaran";
        setSubmitting(false);
        return setErrorMsg(errMsg);
      }

      // Response sukses sesuai API spec
      const konfirmasiOrder = data.data || data;

      // Update local state dengan data dari backend
      const finalOrder = {
        ...order,
        ...konfirmasiOrder,
        // Pastikan field-field ini terisi
        bukti_pembayaran: konfirmasiOrder.bukti_pembayaran || bukti.name,
        waktu_pembayaran: konfirmasiOrder.waktu_pembayaran || waktuPembayaran,
        metode_bayar: konfirmasiOrder.metode_bayar || metodeBayar,
        status_pembayaran: konfirmasiOrder.status_pembayaran ?? 1,
        status_order: konfirmasiOrder.status_order || "2",
      };

      setUpdatedOrder(finalOrder);
      setBukti((prev) => ({ 
        ...prev, 
        existing: true, 
        url: konfirmasiOrder.bukti_pembayaran || bukti.name 
      }));
      
      // Update parent component
      onSave(finalOrder);
      setShowKonfirmasiModal(false);

      // Tampilkan toast sukses
      setToast?.({
        show: true,
        type: "success",
        message: "✅ Pembayaran berhasil dikonfirmasi!",
      });

      // Tutup modal dan redirect ke halaman orders setelah delay
      setTimeout(() => {
        setToast?.((prev) => ({ ...prev, show: false }));
        onClose();
        // Redirect ke halaman orders
        router.push("/admin/orders");
      }, 1200);
    } catch (err) {
      console.error("❌ [KONFIRMASI] Error:", err);
      setErrorMsg("Terjadi kesalahan saat konfirmasi pembayaran.");
      setSubmitting(false);

      setToast?.({
        show: true,
        type: "error",
        message: "❌ Gagal mengkonfirmasi pembayaran.",
      });

      setTimeout(() => {
        setToast?.((prev) => ({ ...prev, show: false }));
      }, 2000);
    }
  };


const handleSubmitUpdate = async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${BASE_URL}/admin/order/${order.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...updatedOrder,
        metode_bayar: metodeBayar,
      }),
    });

    const json = await res.json();
    const newOrder = json.data;   // ⬅️ full data

    onSave(newOrder);             // ⬅️ langsung update parent
    onClose();
  } catch (err) {
    console.error(err);
  }
};



  // Helper untuk build URL gambar via proxy
  const buildImageUrl = (path) => {
    if (!path) return null;
    const cleanPath = path.replace(/^\/?(storage\/)?/, "");
    return `/api/image?path=${encodeURIComponent(cleanPath)}`;
  };

  return (
    <>
      <div className="orders-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="orders-modal-card" style={{ width: "min(960px, 95vw)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div className="orders-modal-header">
            <div>
              <p className="orders-modal-eyebrow">Kelola Pesanan</p>
              <h2>Update Pesanan #{order?.id}</h2>
            </div>
            <button className="orders-modal-close" onClick={onClose} type="button" aria-label="Tutup modal">
              <i className="pi pi-times" />
            </button>
          </div>

          {/* Body */}
          <form className="orders-modal-body" onSubmit={handleSubmitUpdate} style={{ overflowY: "auto", flex: 1, padding: "1.5rem" }}>
            <div className="update-orders-grid">
              {/* KOLOM KIRI - Informasi Order */}
              <div className="update-orders-section">
                <div className="section-header">
                  <span className="section-icon">📋</span>
                  <div>
                    <h4>Informasi Order</h4>
                    <p>Data pelanggan dan produk</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-row">
                    <span className="info-label">👤 Customer</span>
                    <span className="info-value">
                      {order.customer_rel?.nama ||
                        (typeof order.customer === "object" ? order.customer?.nama : String(order.customer || "-")) ||
                        "-"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📱 WhatsApp</span>
                    <span className="info-value">{order.customer_rel?.wa || "-"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📦 Produk</span>
                    <span className="info-value">
                      {order.produk_rel?.nama ||
                        (typeof order.produk === "object" ? order.produk?.nama : String(order.produk || "-")) ||
                        "-"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📅 Tanggal</span>
                    <span className="info-value">{order.tanggal || "-"}</span>
                  </div>
                </div>

                <label className="form-field">
                  <span className="field-label">📍 Alamat Pengiriman</span>
                  <textarea
                    name="alamat"
                    rows="3"
                    className="field-input"
                    value={updatedOrder.alamat ?? order.alamat ?? ""}
                    onChange={handleChange}
                    placeholder="Masukkan alamat lengkap"
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">🔗 Sumber Order</span>
                  <select
                    name="sumber"
                    className="field-input"
                    value={updatedOrder.sumber ?? order.sumber ?? ""}
                    onChange={handleChange}
                  >
                    <option value="">Pilih sumber</option>
                    <option value="website">Website</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sales">Sales</option>
                    <option value="event">Event</option>
                  </select>
                </label>
              </div>

              {/* KOLOM KANAN - Pembayaran */}
              <div className="update-orders-section">
                <div className="section-header">
                  <span className="section-icon">💰</span>
                  <div>
                    <h4>Detail Pembayaran</h4>
                    <p>Informasi harga dan status bayar</p>
                  </div>
                </div>

                <div className="price-grid">
                  <label className="form-field">
                    <span className="field-label">Harga Produk</span>
                    <div className="field-input-wrapper">
                      <span className="input-prefix">Rp</span>
                      <input
                        type="number"
                        name="harga"
                        className="field-input field-input--readonly"
                        value={updatedOrder.harga ?? order.harga ?? ""}
                        disabled
                      />
                    </div>
                  </label>

                  <label className="form-field">
                    <span className="field-label">Ongkir</span>
                    <div className="field-input-wrapper">
                      <span className="input-prefix">Rp</span>
                      <input
                        type="number"
                        name="ongkir"
                        className="field-input"
                        value={updatedOrder.ongkir ?? order.ongkir ?? ""}
                        onChange={handleChange}
                      />
                    </div>
                  </label>
                </div>

                <label className="form-field">
                  <span className="field-label">Total Harga</span>
                  <div className="field-input-wrapper">
                    <span className="input-prefix">Rp</span>
                    <input
                      type="number"
                      name="total_harga"
                      className="field-input field-input--highlight"
                      value={updatedOrder.total_harga ?? order.total_harga ?? ""}
                      onChange={handleChange}
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span className="field-label">💳 Metode Pembayaran</span>
                  <input
                    type="text"
                    className="field-input"
                    value={metodeBayar}
                    onChange={(e) => setMetodeBayar(e.target.value)}
                    placeholder="Contoh: Transfer BCA, QRIS, dll"
                  />
                </label>

                {/* Status Pembayaran Card */}
                <div className={`payment-status-card ${computedStatus() === 1 ? "paid" : "unpaid"}`}>
                  <div className="status-info">
                    <span className="status-label">Status Pembayaran</span>
                    <span className={`status-badge ${computedStatus() === 1 ? "badge-paid" : "badge-unpaid"}`}>
                      {computedStatus() === 1 ? "✅ Paid" : "⏳ Unpaid"}
                    </span>
                  </div>
                  
                  {computedStatus() === 0 ? (
                    <button
                      type="button"
                      className="btn-konfirmasi"
                      disabled={!metodeBayar}
                      onClick={() => setShowKonfirmasiModal(true)}
                    >
                      <i className="pi pi-check-circle" />
                      Konfirmasi Pembayaran
                    </button>
                  ) : (
                    <span className="status-confirmed">Pembayaran Terkonfirmasi</span>
                  )}
                </div>

                {/* Bukti Pembayaran Preview */}
                {bukti && (
                  <div className="bukti-preview">
                    <span className="field-label">📎 Bukti Pembayaran</span>
                    <div className="bukti-image-wrapper">
                      <img
                        src={bukti.url.startsWith("blob:") ? bukti.url : buildImageUrl(bukti.url)}
                        alt="Bukti Pembayaran"
                        className="bukti-image"
                        onError={(e) => {
                          e.target.style.display = "none";
                          console.error("Gagal memuat gambar bukti");
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="orders-error orders-error--inline">⚠️ {errorMsg}</div>
            )}

            {/* Footer */}
            <div className="orders-modal-footer">
              <button type="button" onClick={onClose} className="orders-btn orders-btn--ghost">
                Batal
              </button>
              <button type="submit" className="orders-btn orders-btn--primary">
                <i className="pi pi-save" style={{ marginRight: 6 }} />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inline Styles */}
      <style jsx>{`
        .update-orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 20px;
        }

        .update-orders-section {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
        }

        .section-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .section-icon {
          font-size: 24px;
        }

        .section-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .section-header p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .info-card {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 13px;
          color: #6b7280;
        }

        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          text-align: right;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .field-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .field-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .field-input--readonly {
          background: #f3f4f6;
          cursor: not-allowed;
          color: #6b7280;
        }

        .field-input--highlight {
          background: #eef2ff;
          border-color: #818cf8;
          font-weight: 600;
          color: #4338ca;
        }

        .field-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-prefix {
          position: absolute;
          left: 12px;
          color: #6b7280;
          font-size: 14px;
        }

        .field-input-wrapper .field-input {
          padding-left: 36px;
        }

        .price-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .payment-status-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .payment-status-card.paid {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #6ee7b7;
        }

        .payment-status-card.unpaid {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border: 1px solid #fcd34d;
        }

        .status-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .status-label {
          font-size: 12px;
          color: #6b7280;
        }

        .status-badge {
          font-size: 14px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .badge-paid {
          background: #10b981;
          color: white;
        }

        .badge-unpaid {
          background: #f59e0b;
          color: white;
        }

        .btn-konfirmasi {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-konfirmasi:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-konfirmasi:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .status-confirmed {
          font-size: 13px;
          color: #059669;
          font-weight: 500;
        }

        .bukti-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bukti-image-wrapper {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          text-align: center;
        }

        .bukti-image {
          max-width: 100%;
          max-height: 180px;
          border-radius: 8px;
          object-fit: contain;
        }

        @media (max-width: 768px) {
          .update-orders-grid {
            grid-template-columns: 1fr;
          }

          .price-grid {
            grid-template-columns: 1fr;
          }

          .payment-status-card {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>

      {/* Modal Konfirmasi Pembayaran */}
      {showKonfirmasiModal && (
        <div className="orders-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowKonfirmasiModal(false)}>
          <div className="konfirmasi-modal">
            <div className="konfirmasi-header">
              <div className="konfirmasi-icon">💳</div>
              <div>
                <h3>Konfirmasi Pembayaran</h3>
                <p>Upload bukti pembayaran untuk order #{order?.id}</p>
              </div>
              <button
                className="konfirmasi-close"
                onClick={() => setShowKonfirmasiModal(false)}
                type="button"
              >
                <i className="pi pi-times" />
              </button>
            </div>

            <form onSubmit={handleKonfirmasiSubmit} className="konfirmasi-form">
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleKonfirmasiFileChange}
                  id="bukti-upload"
                  className="upload-input"
                />
                <label htmlFor="bukti-upload" className="upload-label">
                  {bukti?.url ? (
                    <img src={bukti.url} alt="Preview" className="upload-preview" />
                  ) : (
                    <>
                      <span className="upload-icon">📷</span>
                      <span className="upload-text">Klik untuk upload bukti pembayaran</span>
                      <span className="upload-hint">PNG, JPG maksimal 5MB</span>
                    </>
                  )}
                </label>
              </div>

              <div className="konfirmasi-info">
                <div className="konfirmasi-info-row">
                  <span>Metode Pembayaran</span>
                  <strong>{metodeBayar || "-"}</strong>
                </div>
                <div className="konfirmasi-info-row">
                  <span>Total Bayar</span>
                  <strong>Rp {Number(updatedOrder.total_harga || order.total_harga || 0).toLocaleString("id-ID")}</strong>
                </div>
              </div>

              {errorMsg && (
                <div className="konfirmasi-error">⚠️ {errorMsg}</div>
              )}

              <div className="konfirmasi-footer">
                <button
                  type="button"
                  className="orders-btn orders-btn--ghost"
                  onClick={() => setShowKonfirmasiModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="orders-btn orders-btn--success"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <i className="pi pi-spin pi-spinner" style={{ marginRight: 6 }} />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <i className="pi pi-check" style={{ marginRight: 6 }} />
                      Konfirmasi Pembayaran
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Konfirmasi Modal Styles */}
      <style jsx>{`
        .konfirmasi-modal {
          background: white;
          border-radius: 20px;
          width: min(480px, 95vw);
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow: hidden;
        }

        .konfirmasi-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .konfirmasi-icon {
          font-size: 32px;
        }

        .konfirmasi-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .konfirmasi-header p {
          margin: 4px 0 0;
          font-size: 13px;
          opacity: 0.9;
        }

        .konfirmasi-close {
          margin-left: auto;
          background: rgba(255,255,255,0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .konfirmasi-close:hover {
          background: rgba(255,255,255,0.3);
        }

        .konfirmasi-form {
          padding: 24px;
        }

        .upload-area {
          margin-bottom: 20px;
        }

        .upload-input {
          display: none;
        }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 160px;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          background: #f9fafb;
          cursor: pointer;
          transition: all 0.2s;
          overflow: hidden;
        }

        .upload-label:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .upload-preview {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
        }

        .upload-icon {
          font-size: 40px;
          margin-bottom: 8px;
        }

        .upload-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .upload-hint {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .konfirmasi-info {
          background: #f9fafb;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 20px;
        }

        .konfirmasi-info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .konfirmasi-info-row:last-child {
          border-bottom: none;
        }

        .konfirmasi-info-row span {
          font-size: 13px;
          color: #6b7280;
        }

        .konfirmasi-info-row strong {
          font-size: 14px;
          color: #111827;
        }

        .konfirmasi-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .konfirmasi-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .orders-btn--success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }

        .orders-btn--success:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </>
  );
}
