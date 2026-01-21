"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
// import "@/styles/transfer.css"; // Styles replaced by professional scoped CSS below

import { getCustomerSession } from "@/lib/customerAuth";
import { fetchCustomerDashboard } from "@/lib/customerDashboard";

// --- ICONS (Professional SVGs) ---
const Icons = {
  CreditCard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  Upload: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clock: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2-2v1" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  WhatsApp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
};

function BankTransferPageContent() {
  const params = useSearchParams();
  const product = params.get("product");
  const harga = params.get("harga");
  const downPaymentFromQuery = params.get("down_payment");
  const orderIdFromQuery = params.get("order_id");
  const via = params.get("via") || "manual";

  const [bukti, setBukti] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [downPayment, setDownPayment] = useState(downPaymentFromQuery || "");
  const [orderId, setOrderId] = useState(orderIdFromQuery || "");
  const [isWorkshop, setIsWorkshop] = useState(false);

  // New States for Status Handling
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'unpaid', 'pending_validation', 'paid'
  const [serverOrderData, setServerOrderData] = useState(null);

  // Cek status order dari server
  useEffect(() => {
    const checkOrderStatus = async () => {
      const session = getCustomerSession();
      if (!session.token || !orderId) return;

      setCheckingStatus(true);
      try {
        const dashboardData = await fetchCustomerDashboard(session.token);

        // Cari order di semua list yang mungkin
        const allOrders = [
          ...(dashboardData?.orders_aktif || []),
          ...(dashboardData?.orders_pending || []),
          ...(dashboardData?.order_proses || []),
          ...(dashboardData?.orders_proses || []),
          ...(dashboardData?.orders || [])
        ];

        const foundOrder = allOrders.find(o =>
          String(o.id) === String(orderId)
        );

        if (foundOrder) {
          console.log("🔍 [PAYMENT] Found order status:", foundOrder);
          setServerOrderData(foundOrder);

          const statusBayar = String(foundOrder.status_pembayaran || foundOrder.status_pembayaran_id);

          if (statusBayar === "2") {
            setPaymentStatus("paid"); // Paid
          } else if (statusBayar === "1") {
            setPaymentStatus("pending_validation"); // Menunggu Verifikasi
          } else {
            setPaymentStatus("unpaid"); // Belum Lunas
          }
        }
      } catch (err) {
        console.error("[PAYMENT] Failed to check status:", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (orderId) {
      checkOrderStatus();
    }
  }, [orderId]);

  // Cek dari localStorage sebagai fallback
  useEffect(() => {
    const storedOrder = localStorage.getItem("pending_order");
    if (storedOrder) {
      try {
        const orderData = JSON.parse(storedOrder);
        // Prioritaskan localStorage untuk downPayment dan orderId
        if (orderData.downPayment) {
          setDownPayment(orderData.downPayment);
          setIsWorkshop(true);
        } else if (downPaymentFromQuery) {
          setDownPayment(downPaymentFromQuery);
          setIsWorkshop(true);
        }

        if (orderData.orderId) {
          setOrderId(orderData.orderId);
        } else if (orderIdFromQuery) {
          setOrderId(orderIdFromQuery);
        }
      } catch (e) {
        console.error("[PAYMENT] Error parsing stored order:", e);
      }
    } else {
      if (downPaymentFromQuery) {
        setDownPayment(downPaymentFromQuery);
        setIsWorkshop(true);
      }
      if (orderIdFromQuery) {
        setOrderId(orderIdFromQuery);
      }
    }
  }, []);

  // Update isWorkshop setiap kali downPayment berubah
  useEffect(() => {
    if (downPayment && parseFloat(downPayment) > 0) {
      setIsWorkshop(true);
    } else {
      setIsWorkshop(false);
    }
  }, [downPayment]);

  const rekeningBCA = {
    bank: "BCA",
    logo: "/assets/bca.png",
    nomor: "1234567890",
    atasNama: "PT Dukung Dunia Akademi",
  };

  const adminWA = "6281234567890";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setBukti({ name: file.name, file, url: previewUrl });
      setErrorMsg("");
    }
  };

  const handleKonfirmasiPembayaran = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    let finalOrderId = orderId;
    if (!finalOrderId) {
      const storedOrder = localStorage.getItem("pending_order");
      if (storedOrder) {
        try {
          const orderData = JSON.parse(storedOrder);
          finalOrderId = orderData.orderId;
        } catch (e) { }
      }
    }

    if (!finalOrderId) return setErrorMsg("Order ID tidak valid. Refresh halaman.");
    if (!bukti?.file) return setErrorMsg("Upload bukti pembayaran terlebih dahulu.");

    // Determine amount
    let amountToUse = null;
    if (isWorkshop || downPayment) {
      amountToUse = downPayment;
      if (!amountToUse || parseFloat(amountToUse) <= 0) {
        const storedOrder = localStorage.getItem("pending_order");
        if (storedOrder) {
          try {
            amountToUse = JSON.parse(storedOrder).downPayment;
          } catch (e) { }
        }
      }
    } else {
      amountToUse = harga;
      if (!amountToUse || parseFloat(amountToUse) <= 0) {
        const storedOrder = localStorage.getItem("pending_order");
        if (storedOrder) {
          try {
            const od = JSON.parse(storedOrder);
            amountToUse = od.total_harga || od.harga;
          } catch (e) { }
        }
      }
    }

    const amountValue = parseFloat(amountToUse || "0");
    if (!amountValue || amountValue <= 0) {
      return setErrorMsg("Jumlah pembayaran tidak valid.");
    }

    setSubmitting(true);

    try {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const waktuPembayaran = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const formData = new FormData();
      formData.append("bukti_pembayaran", bukti.file);
      formData.append("waktu_pembayaran", waktuPembayaran);
      formData.append("metode_pembayaran", via === "manual" ? "Transfer Bank" : via);
      formData.append("amount", String(amountValue));

      const customerToken = localStorage.getItem("customer_token");
      const headers = { Accept: "application/json" };
      if (customerToken) headers.Authorization = `Bearer ${customerToken}`;

      const response = await fetch(`/api/customer/order/${finalOrderId}/upload-bukti-pembayaran`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      const isSuccess = response.ok && (data.success === true || (data.message && data.message.toLowerCase().includes("sukses")));

      if (!isSuccess) {
        const errMsg = data?.message || data?.error || "Gagal konfirmasi pembayaran";
        setSubmitting(false);
        return setErrorMsg(errMsg);
      }

      toast.success("Bukti berhasil dikirim!");
      setTimeout(() => {
        window.location.href = "/customer/dashboard";
      }, 2000);

    } catch (err) {
      console.error("error:", err);
      setErrorMsg("Terjadi kesalahan sistem.");
      setSubmitting(false);
    }
  };

  const handleSudahTransfer = () => {
    const message = encodeURIComponent(
      `Halo, saya konfirmasi transfer:\n` +
      `Order ID: ${orderId}\n` +
      `Produk: ${product || "-"}\n` +
      `Nominal: Rp ${Number(isWorkshop ? downPayment : harga).toLocaleString("id-ID")}`
    );
    window.open(`https://wa.me/${adminWA}?text=${message}`, "_blank");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Disalin!");
    }).catch(() => toast.error("Gagal menyalin"));
  };

  // --- RENDER HELPERS ---
  const displayAmount = Number((isWorkshop ? downPayment : harga) || 0);

  return (
    <div className="saas-payment-page">
      <div className="saas-container">
        {/* Simplified Header */}
        <header className="saas-header">
          <div className="saas-header__content">
            <h1 className="saas-title">Penyelesaian Pembayaran</h1>
            <p className="saas-subtitle">Lakukan transfer dan konfirmasi pesanan Anda.</p>
          </div>
        </header>

        <main className="saas-grid">
          {/* LEFT COLUMN: Payment Details & Instructions */}
          <section className="saas-col-left">
            {/* Amount Card */}
            <div className="pro-card highlight-card">
              <div className="amount-label-row">
                <span className="amount-label">Total Tagihan {isWorkshop && "(Down Payment)"}</span>
                <span className="payment-status-badge">Menunggu Transfer</span>
              </div>
              <div className="amount-value">
                <span className="currency">Rp</span>
                {displayAmount.toLocaleString("id-ID")}
              </div>
              {product && <div className="order-ref">Order Ref: {orderId || "Pending"} • {product}</div>}
            </div>

            {/* Bank Details */}
            <div className="pro-card bank-details-card">
              <div className="card-header">
                <h3 className="card-title">Transfer ke Rekening</h3>
                <div className="secure-badge"><Icons.Lock /> Secure</div>
              </div>

              <div className="bank-account-box">
                <div className="bank-logo-area">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={rekeningBCA.logo} alt="BCA" className="bank-logo-img" />
                </div>
                <div className="bank-info-area">
                  <div className="bank-account-number">
                    {rekeningBCA.nomor}
                    <button className="icon-btn" onClick={() => copyToClipboard(rekeningBCA.nomor)}>
                      <Icons.Copy />
                    </button>
                  </div>
                  <div className="bank-account-name">{rekeningBCA.atasNama}</div>
                </div>
              </div>

              <div className="instructions-list">
                <div className="instruction-step">
                  <span className="step-num">1</span>
                  <p>Transfer tepat <strong>Rp {displayAmount.toLocaleString("id-ID")}</strong> ke rekening di atas.</p>
                </div>
                <div className="instruction-step">
                  <span className="step-num">2</span>
                  <p>Simpan bukti transfer (screenshot/foto).</p>
                </div>
                <div className="instruction-step">
                  <span className="step-num">3</span>
                  <p>Upload bukti tersebut di form konfirmasi di samping.</p>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Upload & Actions */}
          <section className="saas-col-right">
            <div className="pro-card upload-card">
              <h3 className="card-title mb-4">Konfirmasi Pembayaran</h3>

              <form onSubmit={handleKonfirmasiPembayaran}>
                {paymentStatus === "paid" ? (
                  <div className="status-state success">
                    <Icons.CheckCircle />
                    <h3>Pembayaran Sukses</h3>
                    <p>Pesanan Anda telah dikonfirmasi.</p>
                    <button type="button" className="btn-primary full-width mt-4" onClick={() => window.location.href = "/customer/dashboard"}>
                      Ke Dashboard
                    </button>
                  </div>
                ) : paymentStatus === "pending_validation" ? (
                  <div className="status-state pending">
                    <Icons.Clock />
                    <h3>Menunggu Validasi</h3>
                    <p>Tim kami sedang memverifikasi pembayaran Anda (max 24 jam).</p>
                    <button type="button" className="btn-secondary full-width mt-4" onClick={() => window.location.href = "/customer/dashboard"}>
                      Cek Status di Dashboard
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="upload-field">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        id="file-upload-styled"
                        className="hidden-input"
                      />
                      <label htmlFor="file-upload-styled" className={`dropzone ${bukti?.url ? 'has-file' : ''}`}>
                        {bukti?.url ? (
                          <div className="file-preview">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={bukti.url} alt="Proof" className="proof-img" />
                            <div className="file-info">
                              <span className="filename">{bukti.name}</span>
                              <span className="change-text">Ganti Dokumen</span>
                            </div>
                          </div>
                        ) : (
                          <div className="empty-state">
                            <div className="upload-icon-circle"><Icons.Upload /></div>
                            <span className="upload-cta">Klik untuk upload bukti</span>
                            <span className="upload-hint">JPG, PNG max 5MB</span>
                          </div>
                        )}
                      </label>
                    </div>

                    {errorMsg && <div className="error-message">{errorMsg}</div>}

                    <div className="action-buttons">
                      <button
                        type="submit"
                        className={`btn-primary full-width ${submitting ? 'loading' : ''}`}
                        disabled={submitting || !bukti?.file}
                      >
                        {submitting ? "Memproses..." : "Kirim Konfirmasi"}
                      </button>

                      <button type="button" className="btn-text full-width mt-2" onClick={handleSudahTransfer}>
                        <span className="whatsApp-icon"><Icons.WhatsApp /></span>
                        Bantuan via WhatsApp
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        /* --- RESET & VARS --- */
        .saas-payment-page {
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
          display: flex;
          justify-content: center;
          padding: 2rem 1rem;
        }

        .saas-container {
          width: 100%;
          max-width: 960px;
        }

        /* --- HEADER --- */
        .saas-header {
          margin-bottom: 2.5rem;
          text-align: center;
        }
        .saas-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.025em;
          margin: 0 0 0.5rem 0;
        }
        .saas-subtitle {
          color: #64748b;
          font-size: 1rem;
        }

        /* --- GRID --- */
        .saas-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        
        @media (max-width: 768px) {
          .saas-grid {
            grid-template-columns: 1fr;
          }
        }

        /* --- CARDS --- */
        .pro-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .highlight-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #ffffff;
          border: none;
        }

        /* --- LEFT COL STYLE --- */
        .amount-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .amount-label {
          font-size: 0.875rem;
          opacity: 0.8;
          font-weight: 500;
        }
        .payment-status-badge {
          background: rgba(255,255,255,0.2);
          padding: 4px 8px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .amount-value {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 1rem;
        }
        .currency {
          font-size: 1.5rem;
          opacity: 0.6;
          margin-right: 4px;
          font-weight: 500;
        }
        .order-ref {
          font-size: 0.875rem;
          opacity: 0.6;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        /* BANK CARD */
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
        .secure-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 600;
          background: #ecfdf5;
          padding: 4px 8px;
          border-radius: 6px;
        }
        
        .bank-account-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .bank-logo-area {
          width: 60px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border-radius: 6px;
          padding: 4px;
          border: 1px solid #f1f5f9;
        }
        .bank-logo-img {
          max-width: 100%;
          max-height: 100%;
        }
        .bank-info-area {
          flex: 1;
        }
        .bank-account-number {
          font-family: 'Courier New', monospace;
          font-weight: 700;
          font-size: 1.1rem;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bank-account-name {
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .instructions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .instruction-step {
          display: flex;
          gap: 12px;
          font-size: 0.935rem;
          color: #475569;
          line-height: 1.5;
        }
        .step-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #f1f5f9;
          color: #64748b;
          font-weight: 600;
          font-size: 0.75rem;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* --- RIGHT COL (UPLOAD) --- */
        .mb-4 { margin-bottom: 1rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-2 { margin-top: 0.5rem; }

        .dropzone {
          display: block;
          width: 100%;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          transition: all 0.2s;
          cursor: pointer;
          background: #f8fafc;
        }
        .dropzone:hover {
          border-color: #94a3b8;
          background: #f1f5f9;
        }
        .dropzone.has-file {
          border-style: solid;
          border-color: #e2e8f0;
          background: #fff;
          padding: 1rem;
        }

        .upload-icon-circle {
          width: 48px;
          height: 48px;
          background: #e0f2fe;
          color: #0284c7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px auto;
        }
        
        .upload-cta {
          display: block;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .upload-hint {
          display: block;
          font-size: 0.875rem;
          color: #94a3b8;
        }
        
        .hidden-input { display: none; }

        .file-preview {
          text-align: center;
        }
        .proof-img {
          max-height: 200px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 12px;
        }
        .filename {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
        }
        .change-text {
          font-size: 0.75rem;
          color: #2563eb;
          font-weight: 500;
        }

        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 4px;
          display: inline-flex;
          border-radius: 4px;
        }
        .icon-btn:hover { background: #e2e8f0; color: #0f172a; }

        /* BUTTONS */
        .btn-primary {
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.875rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }
        .btn-primary:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
        .btn-primary.loading {
          opacity: 0.8;
        }

        .btn-secondary {
          background: #white;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: block;
          text-align: center;
          text-decoration: none;
        }
        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        
        .btn-text {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-text:hover { color: #0f172a; }
        
        .full-width { width: 100%; }

        .error-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #fef2f2;
          color: #ef4444;
          border-radius: 8px;
          font-size: 0.875rem;
          border: 1px solid #fecaca;
        }

        /* STATUS STATES */
        .status-state {
          text-align: center;
          padding: 2rem 0;
        }
        .status-state h3 {
          margin: 1rem 0 0.5rem 0;
          color: #0f172a;
        }
        .status-state p {
          color: #64748b;
          font-size: 0.935rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// ✅ FIX: Wrap dengan Suspense untuk useSearchParams (Next.js requirement)
export default function BankTransferPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#64748b' }}>
        Loading Payment...
      </div>
    }>
      <BankTransferPageContent />
    </Suspense>
  );
}
