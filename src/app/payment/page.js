"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import "@/styles/transfer.css";

export default function BankTransferPage() {
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

  // Cek dari localStorage sebagai fallback
  useEffect(() => {
    const storedOrder = localStorage.getItem("pending_order");
    if (storedOrder) {
      try {
        const orderData = JSON.parse(storedOrder);
        console.log("[PAYMENT] Order data from localStorage:", orderData);
        
        // Gunakan dari localStorage jika query param tidak ada
        if (!downPayment && orderData.downPayment) {
          setDownPayment(orderData.downPayment);
          console.log("[PAYMENT] Using downPayment from localStorage:", orderData.downPayment);
        }
        if (!orderId && orderData.orderId) {
          setOrderId(orderData.orderId);
          console.log("[PAYMENT] Using orderId from localStorage:", orderData.orderId);
        }
      } catch (e) {
        console.error("[PAYMENT] Error parsing stored order:", e);
      }
    }
  }, []);

  const isWorkshop = downPayment && parseFloat(downPayment) > 0;

  // Debug log
  useEffect(() => {
    console.log("[PAYMENT] Debug info:", {
      downPaymentFromQuery,
      downPayment,
      orderIdFromQuery,
      orderId,
      isWorkshop,
      product,
      harga
    });
  }, [downPayment, orderId, isWorkshop]);

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

  // Handle submit konfirmasi pembayaran (untuk workshop)
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

    const amountValue = parseFloat(downPayment || "0");
    if (!amountValue || amountValue <= 0) {
      return setErrorMsg("Jumlah pembayaran tidak valid.");
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
      formData.append("metode_bayar", via);
      formData.append("metode_pembayaran", via); // Kompatibilitas
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
        metode_bayar: via,
        waktu_pembayaran,
        hasBukti: !!bukti?.file,
        hasToken: !!customerToken
      });

      // Submit ke API order-konfirmasi
      const response = await fetch(`/api/sales/order-konfirmasi/${finalOrderId}`, {
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

        {/* Total Pembayaran Pertama (untuk Workshop) */}
        {isWorkshop && (
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

        {/* Form Upload Bukti Pembayaran (untuk Workshop) */}
        {isWorkshop && (
          <div className="instruksi-card" style={{ marginTop: "24px" }}>
            <h3 className="instruksi-title">📤 Upload Bukti Pembayaran</h3>
            <form onSubmit={handleKonfirmasiPembayaran}>
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="bukti-upload"
                  style={{ display: "none" }}
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
            </form>
          </div>
        )}

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
              {isWorkshop 
                ? "Upload bukti pembayaran setelah melakukan transfer"
                : "Tim kami akan cek dan verifikasi pembayaran maksimal 1×24 jam"}
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
              : "Setelah transfer, klik tombol di atas untuk menghubungi sales kami. Sales akan membantu proses verifikasi pembayaran Anda."}
          </p>
        </div>
      </div>
    </div>
  );
}
