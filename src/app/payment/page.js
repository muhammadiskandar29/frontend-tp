"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
import "@/styles/transfer.css";

import { getCustomerSession } from "@/lib/customerAuth";
import { fetchCustomerDashboard } from "@/lib/customerDashboard";

// ✅ FIX: Pisahkan komponen yang menggunakan useSearchParams untuk Suspense boundary
function BankTransferPageContent() {
  const params = useSearchParams();
  const product = params.get("product");
  const harga = params.get("harga");
  const downPaymentFromQuery = params.get("down_payment");
  const orderIdFromQuery = params.get("order_id");
  const via = params.get("via") || "manual";
  const sumber = params.get("sumber") || "website";

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

  // Cek dari localStorage sebagai fallback - PRIORITAS localStorage
  useEffect(() => {
    const storedOrder = localStorage.getItem("pending_order");
    if (storedOrder) {
      try {
        const orderData = JSON.parse(storedOrder);
        console.log("[PAYMENT] Order data from localStorage:", orderData);

        // Prioritaskan localStorage untuk downPayment dan orderId
        if (orderData.downPayment) {
          setDownPayment(orderData.downPayment);
          setIsWorkshop(true);
          console.log("[PAYMENT] Using downPayment from localStorage:", orderData.downPayment);
        } else if (downPaymentFromQuery) {
          setDownPayment(downPaymentFromQuery);
          setIsWorkshop(true);
        }

        if (orderData.orderId) {
          setOrderId(orderData.orderId);
          console.log("[PAYMENT] Using orderId from localStorage:", orderData.orderId);
        } else if (orderIdFromQuery) {
          setOrderId(orderIdFromQuery);
        }
      } catch (e) {
        console.error("[PAYMENT] Error parsing stored order:", e);
      }
    } else {
      // Jika tidak ada di localStorage, gunakan dari query param
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

  // Nomor rekening BCA (bisa dipindahkan ke env)
  const rekeningBCA = {
    bank: "BCA",
    logo: "/assets/bca.png",
    nomor: "1234567890",
    atasNama: "PT Dukung Dunia Akademi",
  };

  // Nomor WhatsApp admin (bisa dipindahkan ke env)
  const adminWA = "6281234567890"; // Format: 62xxxxxxxxxx (tanpa +)

  // Handle file upload bukti pembayaran
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      // Validasi tipe file (hanya image)
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setBukti({ name: file.name, file, url: previewUrl });
      setErrorMsg("");
    }
  };

  // Handle submit konfirmasi pembayaran
  const handleKonfirmasiPembayaran = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Cek orderId dari state atau localStorage
    let finalOrderId = orderId;
    if (!finalOrderId) {
      const storedOrder = localStorage.getItem("pending_order");
      if (storedOrder) {
        try {
          const orderData = JSON.parse(storedOrder);
          finalOrderId = orderData.orderId;
        } catch (e) {
          console.error("[PAYMENT] Error parsing stored order:", e);
        }
      }
    }

    if (!finalOrderId) {
      return setErrorMsg("Order ID tidak ditemukan. Silakan refresh halaman atau hubungi customer service.");
    }

    if (!bukti?.file) {
      return setErrorMsg("Harap upload bukti pembayaran terlebih dahulu.");
    }

    // Ambil amount: untuk workshop pakai downPayment, untuk non-workshop pakai total harga
    let amountToUse = null;

    if (isWorkshop || downPayment) {
      // Workshop: pakai downPayment
      amountToUse = downPayment;
      if (!amountToUse || parseFloat(amountToUse) <= 0) {
        // Cek dari localStorage sebagai fallback
        const storedOrder = localStorage.getItem("pending_order");
        if (storedOrder) {
          try {
            const orderData = JSON.parse(storedOrder);
            amountToUse = orderData.downPayment;
            console.log("[PAYMENT] Using downPayment from localStorage:", amountToUse);
          } catch (e) {
            console.error("[PAYMENT] Error parsing stored order for amount:", e);
          }
        }
      }
    } else {
      // Non-workshop: pakai total harga
      amountToUse = harga;
      if (!amountToUse || parseFloat(amountToUse) <= 0) {
        // Cek dari localStorage sebagai fallback
        const storedOrder = localStorage.getItem("pending_order");
        if (storedOrder) {
          try {
            const orderData = JSON.parse(storedOrder);
            amountToUse = orderData.total_harga || orderData.harga;
            console.log("[PAYMENT] Using total harga from localStorage:", amountToUse);
          } catch (e) {
            console.error("[PAYMENT] Error parsing stored order for amount:", e);
          }
        }
      }
    }

    const amountValue = parseFloat(amountToUse || "0");
    if (!amountValue || amountValue <= 0) {
      return setErrorMsg(
        isWorkshop || downPayment
          ? "Jumlah pembayaran tidak valid. Pastikan down payment sudah diisi."
          : "Jumlah pembayaran tidak valid. Pastikan total harga sudah diisi."
      );
    }

    setSubmitting(true);

    try {
      // Format waktu: dd-mm-yyyy HH:mm:ss
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const waktuPembayaran = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      // Build FormData sesuai API spec
      const formData = new FormData();

      if (bukti?.file) {
        formData.append("bukti_pembayaran", bukti.file);
      }

      formData.append("waktu_pembayaran", waktuPembayaran);
      // Sesuai dokumentasi backend: metode_pembayaran
      // Jika via='manual', kita kirim 'Transfer Bank' agar sesuai contoh, atau biarkan via jika sudah benar.
      // User request example shows: "metode_pembayaran": "Transfer Bank"
      formData.append("metode_pembayaran", via === "manual" ? "Transfer Bank" : via);
      formData.append("amount", String(amountValue));

      // Ambil customer token jika ada
      const customerToken = localStorage.getItem("customer_token");
      const headers = {
        Accept: "application/json",
      };

      // Jika ada customer token, gunakan untuk autentikasi
      if (customerToken) {
        headers.Authorization = `Bearer ${customerToken}`;
      }

      console.log("🔍 [PAYMENT] Submitting payment confirmation:", {
        orderId: finalOrderId,
        amount: amountValue,
        metode_pembayaran: via === "manual" ? "Transfer Bank" : via,
        waktu_pembayaran,
        hasBukti: !!bukti?.file,
        hasToken: !!customerToken
      });

      // Submit ke API baru: /api/customer/order/{id}/upload-bukti-pembayaran
      const response = await fetch(`/api/customer/order/${finalOrderId}/upload-bukti-pembayaran`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      const isSuccess = response.ok && (
        data.success === true ||
        (data.message && data.message.toLowerCase().includes("sukses"))
      );

      if (!isSuccess) {
        const errMsg = data?.message || data?.error || "Gagal konfirmasi pembayaran";
        setSubmitting(false);
        return setErrorMsg(errMsg);
      }

      toast.success("Bukti pembayaran berhasil dikirim! Tim kami akan memverifikasi pembayaran Anda.");

      // Redirect ke dashboard atau halaman sukses
      setTimeout(() => {
        window.location.href = "/customer/dashboard";
      }, 2000);

    } catch (err) {
      console.error("❌ [PAYMENT] Error:", err);
      setErrorMsg("Terjadi kesalahan saat mengirim bukti pembayaran. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  const handleSudahTransfer = () => {
    const message = encodeURIComponent(
      `Halo, saya sudah melakukan transfer untuk:\n\n` +
      `Produk: ${product || "Produk"}\n` +
      `Harga: Rp ${Number(harga || 0).toLocaleString("id-ID")}` +
      (isWorkshop ? `\nDown Payment: Rp ${Number(downPayment || 0).toLocaleString("id-ID")}` : "")
    );
    window.open(`https://wa.me/${adminWA}?text=${message}`, "_blank");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Nomor rekening berhasil disalin!");
    }).catch(() => {
      alert("Gagal menyalin. Silakan salin manual: " + text);
    });
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        {/* Header */}
        <div className="payment-header">
          <div className="payment-icon">💳</div>
          <h1>Pembayaran Bank Transfer</h1>
          <p className="payment-subtitle">
            {isWorkshop
              ? "Silakan transfer sesuai jumlah pembayaran pertama (Down Payment)"
              : "Silakan transfer sesuai total tagihan"}
          </p>
        </div>

        {/* Product Info Card */}
        {product && (
          <div className="product-card">
            <div className="product-icon">📦</div>
            <div className="product-details">
              <p className="product-label">Produk</p>
              <p className="product-name">{product}</p>
            </div>
          </div>
        )}

        {/* Total Tagihan Card */}
        <div className="total-card">
          <p className="total-label">Total Tagihan</p>
          <p className="total-amount">Rp {Number(harga || 0).toLocaleString("id-ID")}</p>
        </div>

        {/* Total Pembayaran Pertama (untuk Workshop) - TAMPILKAN jika ada downPayment */}
        {(isWorkshop || downPayment) && (
          <div className="total-card" style={{ background: "#fef3c7", border: "2px solid #f59e0b" }}>
            <p className="total-label" style={{ color: "#92400e", fontWeight: 600 }}>
              Total Pembayaran Pertama (Down Payment)
            </p>
            <p className="total-amount" style={{ color: "#92400e", fontSize: "1.5rem" }}>
              Rp {Number(downPayment || 0).toLocaleString("id-ID")}
            </p>
          </div>
        )}

        {/* Rekening BCA Card */}
        <div className="rekening-card">
          <div className="rekening-header">
            <img src={rekeningBCA.logo} alt={rekeningBCA.bank} className="bank-logo-large" />
            <h3>Rekening Tujuan</h3>
          </div>

          <div className="rekening-content">
            <div className="rekening-item">
              <span className="rekening-label">Nomor Rekening</span>
              <div className="rekening-number-wrapper">
                <span className="rekening-number">{rekeningBCA.nomor}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(rekeningBCA.nomor)}
                  title="Salin nomor rekening"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="rekening-item">
              <span className="rekening-label">Atas Nama</span>
              <span className="rekening-name">{rekeningBCA.atasNama}</span>
            </div>
          </div>
        </div>

        {/* Form Upload Bukti Pembayaran - SELALU TAMPILKAN untuk semua kasus */}
        <div className="instruksi-card" style={{ marginTop: "24px" }}>
          <h3 className="instruksi-title">📤 Upload Bukti Pembayaran</h3>
          <form onSubmit={handleKonfirmasiPembayaran}>
            {paymentStatus === "paid" ? (
              <div style={{ textAlign: "center", padding: "2rem", background: "#ecfdf5", borderRadius: "12px", border: "1px solid #10b981" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                <h3 style={{ color: "#059669", marginBottom: "0.5rem" }}>Pembayaran Lunas</h3>
                <p style={{ color: "#065f46" }}>Terima kasih! Pembayaran Anda telah kami terima.</p>
                <button
                  type="button"
                  onClick={() => window.location.href = "/customer/dashboard"}
                  style={{
                    marginTop: "1rem",
                    padding: "10px 20px",
                    background: "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Kembali ke Dashboard
                </button>
              </div>
            ) : paymentStatus === "pending_validation" ? (
              <div style={{ textAlign: "center", padding: "2rem", background: "#fefce8", borderRadius: "12px", border: "1px solid #eab308" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
                <h3 style={{ color: "#ca8a04", marginBottom: "0.5rem" }}>Menunggu Validasi Finance</h3>
                <p style={{ color: "#854d0e" }}>
                  Bukti pembayaran sudah diterima. Sedang divalidasi oleh Finance (maksimal 1x24 jam).
                </p>
                <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#fff", borderRadius: "8px", border: "1px dashed #ca8a04" }}>
                  <p style={{ fontSize: "0.9rem", color: "#666", margin: 0 }}>
                    Anda tidak perlu mengupload bukti transfer lagi.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="bukti-upload"
                    style={{ display: "none" }}
                    disabled={paymentStatus === "pending_validation" || paymentStatus === "paid"}
                  />
                  <label
                    htmlFor="bukti-upload"
                    style={{
                      display: "block",
                      padding: "24px",
                      border: "2px dashed #d1d5db",
                      borderRadius: "12px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: bukti?.url ? "transparent" : "#f9fafb",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (!bukti?.url) e.target.style.background = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      if (!bukti?.url) e.target.style.background = "#f9fafb";
                    }}
                  >
                    {bukti?.url ? (
                      <div>
                        <img
                          src={bukti.url}
                          alt="Preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "300px",
                            borderRadius: "8px",
                            marginBottom: "12px"
                          }}
                        />
                        <p style={{ color: "#059669", fontSize: "14px", margin: 0 }}>
                          ✓ {bukti.name}
                        </p>
                        <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px" }}>
                          Klik untuk ganti gambar
                        </p>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>📷</span>
                        <span style={{ display: "block", color: "#374151", fontWeight: 500, marginBottom: "4px" }}>
                          Klik untuk upload bukti pembayaran
                        </span>
                        <span style={{ display: "block", color: "#6b7280", fontSize: "14px" }}>
                          PNG, JPG maksimal 5MB
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {errorMsg && (
                  <div style={{
                    padding: "12px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    color: "#dc2626",
                    fontSize: "14px",
                    marginBottom: "16px"
                  }}>
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !bukti?.file}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: submitting || !bukti?.file ? "#d1d5db" : "#ff6c00",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: submitting || !bukti?.file ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting && bukti?.file) {
                      e.target.style.background = "#c85400";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting && bukti?.file) {
                      e.target.style.background = "#ff6c00";
                    }
                  }}
                >
                  {submitting ? "Memproses..." : "Konfirmasi Pembayaran"}
                </button>
              </>
            )}
          </form>
        </div>

        {/* Instruksi Card */}
        <div className="instruksi-card">
          <h3 className="instruksi-title">📋 Instruksi Pembayaran</h3>
          <ul className="instruksi-list">
            <li>
              <span className="instruksi-icon">✓</span>
              {isWorkshop
                ? "Transfer sesuai jumlah pembayaran pertama (Down Payment) yang tertera di atas"
                : "Transfer sesuai total tagihan agar proses verifikasi lebih cepat"}
            </li>
            <li>
              <span className="instruksi-icon">✓</span>
              Upload bukti pembayaran setelah melakukan transfer untuk mempercepat proses verifikasi
            </li>
            <li>
              <span className="instruksi-icon">✓</span>
              Sales kami akan menghubungi Anda untuk follow-up pembayaran
            </li>
            <li>
              <span className="instruksi-icon">✓</span>
              Pastikan nomor rekening dan nominal transfer sudah benar
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          <button className="btn-primary" onClick={handleSudahTransfer}>
            <span className="btn-icon">💬</span>
            <span>Hubungi Sales via WhatsApp</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => window.history.back()}
          >
            Kembali
          </button>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <p className="info-text">
            💡 <strong>Tips:</strong> {isWorkshop
              ? "Setelah transfer, upload bukti pembayaran di atas untuk mempercepat proses verifikasi."
              : "Setelah transfer, upload bukti pembayaran di atas untuk mempercepat proses verifikasi. Tim kami akan memverifikasi pembayaran Anda maksimal 1×24 jam."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ✅ FIX: Wrap dengan Suspense untuk useSearchParams (Next.js requirement)
export default function BankTransferPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <p>Loading...</p>
      </div>
    }>
      <BankTransferPageContent />
    </Suspense>
  );
}
