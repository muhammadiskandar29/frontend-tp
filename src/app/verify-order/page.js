"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { loginCustomer } from "@/lib/customerAuth";
import "@/styles/sales/otp.css";

const OTP_VALID_DURATION = 5 * 60; // 5 menit

export default function VerifyOrderOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_VALID_DURATION);
  const [timerActive, setTimerActive] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const inputs = useRef([]);

  // Load order data dari localStorage
  useEffect(() => {
    const stored = localStorage.getItem("pending_order");
    if (!stored) {
      router.replace("/");
      return;
    }

    try {
      const data = JSON.parse(stored);
      setOrderData(data);
    } catch {
      router.replace("/");
    }
  }, [router]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const seconds = Math.floor(timeLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const resetOtpTimer = () => {
    setTimeLeft(OTP_VALID_DURATION);
    setTimerActive(true);
  };

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value) {
      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);
      if (index < 5) inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      pastedData.split("").forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const lastIndex = Math.min(pastedData.length, 5);
      inputs.current[lastIndex]?.focus();
    }
  };

  // Verify OTP - WAJIB sebelum ke payment
  // Menggunakan route /api/otp/verify
  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    
    if (code.length < 6) {
      setMessage("Masukkan 6 digit kode OTP.");
      return;
    }

    if (!orderData?.customerId) {
      setMessage("Sesi telah berakhir. Silakan mulai ulang pemesanan.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Ambil token dari localStorage jika ada
      const token = localStorage.getItem("customer_token");
      
      // Menggunakan route /api/otp/verify (9.2 Verifikasi OTP Customer)
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_id: orderData.customerId,
          otp: code,
        }),
      });

      const result = await response.json();

      console.log("[VERIFY_ORDER] OTP Verify response:", result);

      if (result.success) {
        setMessage("Verifikasi berhasil!");
        setTimerActive(false);
        toast.success("OTP Verified!");

        // Ambil orderData dari localStorage untuk memastikan data masih ada
        // (karena state mungkin belum ter-update)
        const storedOrder = localStorage.getItem("pending_order");
        let currentOrderData = orderData;
        
        if (storedOrder) {
          try {
            currentOrderData = JSON.parse(storedOrder);
            console.log("[VERIFY_ORDER] Order data from localStorage:", currentOrderData);
          } catch (e) {
            console.error("[VERIFY_ORDER] Error parsing stored order:", e);
          }
        }

        // Log orderData untuk debug
        console.log("[VERIFY_ORDER] Order data before login:", currentOrderData);
        console.log("[VERIFY_ORDER] Email from order:", currentOrderData?.email);

        // Setelah verifikasi OTP berhasil, login otomatis dengan email dari form landing page
        // Password default dari backend: 123456
        if (currentOrderData?.email) {
          console.log("[VERIFY_ORDER] Attempting auto-login with email:", currentOrderData.email);
          
          // Login dengan password default dari backend: 123456
          const loginResult = await loginCustomer({
            email: currentOrderData.email,
            password: "123456", // Password default dari backend
          });

          console.log("[VERIFY_ORDER] Login result:", loginResult);

          if (loginResult.success) {
            console.log("[VERIFY_ORDER] Auto-login successful! Redirecting to dashboard...");
            toast.success("Login berhasil! Mengarahkan ke dashboard...");
            
            // Hapus pending order dari localStorage
            localStorage.removeItem("pending_order");
            
            // Redirect ke halaman pembayaran (default landing dashboard)
            await new Promise((r) => setTimeout(r, 500));
            router.replace("/customer/dashboard/payment");
            return;
          } else {
            // Jika login gagal, tampilkan error dan tetap redirect ke payment
            console.error("[VERIFY_ORDER] Auto-login failed, falling back to payment page");
            toast.error("Login otomatis gagal. Silakan login manual di halaman customer.");
            
            // Fallback: redirect ke payment page seperti sebelumnya
            await new Promise((r) => setTimeout(r, 500));
            redirectToPayment(currentOrderData);
          }
        } else {
          // Jika tidak ada email, fallback ke payment page
          console.warn("[VERIFY_ORDER] No email found in order data, redirecting to payment");
          await new Promise((r) => setTimeout(r, 500));
          redirectToPayment(currentOrderData);
        }
      } else {
        setMessage(result.message || "Kode OTP salah atau sudah kadaluarsa.");
      }
    } catch (error) {
      console.error("[VERIFY_ORDER] OTP Verify error:", error);
      setMessage("Terjadi kesalahan saat memverifikasi OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Clear data dan redirect ke landing page
  const clearAndRedirect = (landingUrl) => {
    // Clear semua state
    setOtp(["", "", "", "", "", ""]);
    setMessage("");
    setLoading(false);
    setResending(false);
    setTimeLeft(OTP_VALID_DURATION);
    setTimerActive(false);
    setOrderData(null);
    
    // Clear localStorage
    localStorage.removeItem("pending_order");
    
    // Redirect ke landing page
    setTimeout(() => {
      router.replace(landingUrl);
    }, 500);
  };

  // Redirect ke payment sesuai metode
  const redirectToPayment = (orderDataParam = null) => {
    // Gunakan parameter jika ada, jika tidak gunakan state
    const dataToUse = orderDataParam || orderData;
    
    if (!dataToUse) {
      console.error("[VERIFY_ORDER] Order data tidak ditemukan untuk redirect");
      toast.error("Data order tidak ditemukan. Silakan coba lagi.");
      return;
    }

    const { paymentMethod, productName, totalHarga } = dataToUse;

    console.log("[VERIFY_ORDER] Redirecting to payment with method:", paymentMethod);

    // Hapus pending order dari localStorage setelah data sudah diambil
    localStorage.removeItem("pending_order");

    switch (paymentMethod) {
      case "ewallet":
        console.log("[VERIFY_ORDER] Calling Midtrans e-wallet");
        callMidtrans("ewallet", dataToUse);
        break;
      case "cc":
        console.log("[VERIFY_ORDER] Calling Midtrans credit card");
        callMidtrans("cc", dataToUse);
        break;
      case "va":
        console.log("[VERIFY_ORDER] Calling Midtrans virtual account");
        callMidtrans("va", dataToUse);
        break;
      case "manual":
      default:
        console.log("[VERIFY_ORDER] Redirecting to manual payment page");
        // Manual transfer - langsung redirect ke payment page
        const query = new URLSearchParams({
          product: productName || "",
          harga: totalHarga || "0",
          via: paymentMethod || "manual",
          sumber: dataToUse?.sumber || "website",
        });
        
        // Tambahkan down_payment dan order_id jika ada (untuk workshop)
        if (dataToUse?.downPayment) {
          query.append("down_payment", dataToUse.downPayment);
        }
        if (dataToUse?.orderId) {
          query.append("order_id", dataToUse.orderId);
        }
        
        router.push(`/payment?${query.toString()}`);
        
        // Redirect halaman verify-order kembali ke landing page dan kosongkan data
        const landingUrl = dataToUse?.landingUrl || "/";
        clearAndRedirect(landingUrl);
        break;
    }
  };

  // Call Midtrans API
  const callMidtrans = async (type, orderDataParam = null) => {
    // Gunakan parameter jika ada, jika tidak gunakan state
    const dataToUse = orderDataParam || orderData;
    
    if (!dataToUse) {
      console.error("[VERIFY_ORDER] Order data tidak ditemukan untuk Midtrans");
      toast.error("Data order tidak ditemukan. Silakan coba lagi.");
      return;
    }

    const { nama, email, totalHarga, productName, orderId } = dataToUse;
    const API_BASE = "/api";

    let endpoint = "";
    switch (type) {
      case "ewallet":
        endpoint = `${API_BASE}/midtrans/create-snap-ewallet`;
        break;
      case "cc":
        endpoint = `${API_BASE}/midtrans/create-snap-cc`;
        break;
      case "va":
        endpoint = `${API_BASE}/midtrans/create-snap-va`;
        break;
      default:
        console.error("[VERIFY_ORDER] Payment type tidak valid:", type);
        toast.error("Metode pembayaran tidak valid");
        return;
    }

    console.log("[VERIFY_ORDER] Calling Midtrans endpoint:", endpoint);
    console.log("[VERIFY_ORDER] Payload:", { name: nama, email, amount: totalHarga, product_name: productName, order_id: orderId });

    try {
      const payload = {
        name: nama,
        email: email,
        amount: totalHarga,
        product_name: productName,
        order_id: orderId,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      console.log("[VERIFY_ORDER] Midtrans response:", json);

      if (json.redirect_url) {
        console.log("[VERIFY_ORDER] Redirecting to Midtrans:", json.redirect_url);
        // Buka Midtrans payment page di tab baru
        window.open(json.redirect_url, "_blank");
        
        // Redirect halaman verify-order kembali ke landing page dan kosongkan data
        const landingUrl = dataToUse?.landingUrl || "/";
        clearAndRedirect(landingUrl);
      } else {
        console.error("[VERIFY_ORDER] Midtrans tidak mengembalikan redirect_url:", json);
        toast.error(json.message || "Gagal membuat transaksi");
        // Jika gagal, redirect ke payment page manual
        const query = new URLSearchParams({
          product: productName || "",
          harga: totalHarga || "0",
        });
        router.push(`/payment?${query.toString()}`);
      }
    } catch (err) {
      console.error("[VERIFY_ORDER] Midtrans error:", err);
      toast.error("Terjadi kesalahan saat memproses pembayaran");
      // Jika error, redirect ke payment page manual
      const query = new URLSearchParams({
        product: productName || "",
        harga: totalHarga || "0",
      });
      router.push(`/payment?${query.toString()}`);
    }
  };

  // Resend OTP
  // Menggunakan route /api/otp/resend (9.3 Re-send OTP Customer)
  const handleResend = async () => {
    if (!orderData?.customerId || !orderData?.wa) {
      setMessage("Sesi telah berakhir. Silakan mulai ulang pemesanan.");
      return;
    }

    setResending(true);
    setMessage("");

    try {
      // Ambil token dari localStorage jika ada
      const token = localStorage.getItem("customer_token");
      
      // Menggunakan route /api/otp/resend
      const response = await fetch("/api/otp/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_id: orderData.customerId,
          wa: orderData.wa,
        }),
      });

      const result = await response.json();

      console.log("[VERIFY_ORDER] OTP Resend response:", result);

      if (result.success) {
        setMessage("Kode OTP baru telah dikirim ke WhatsApp Anda!");
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        resetOtpTimer();
        toast.success("OTP terkirim!");
      } else {
        setMessage(result.message || "Gagal mengirim ulang OTP.");
      }
    } catch (error) {
      console.error("[VERIFY_ORDER] OTP Resend error:", error);
      setMessage("Terjadi kesalahan saat mengirim ulang OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-box">
        <div className="otp-header">
          <span className="otp-icon"></span>
          <h1 className="otp-title">Verifikasi Pesanan</h1>
        </div>
        
        <p className="otp-desc">
          Masukkan 6 digit kode OTP yang telah dikirim ke WhatsApp
          {orderData?.wa && (
            <strong> ({orderData.wa.replace(/(\d{2})(\d{3})(\d{4})(\d+)/, "+$1 $2-$3-$4")})</strong>
          )}
        </p>

        {orderData?.productName && (
          <div className="otp-product-info">
            <span></span>
            <span>{orderData.productName}</span>
            {orderData.totalHarga && (
              <span className="otp-price">
                Rp {Number(orderData.totalHarga).toLocaleString("id-ID")}
              </span>
            )}
          </div>
        )}

        <div className="otp-timer">
          <span></span>
          <span>
            OTP berlaku {timeLeft > 0 ? `${formatTimeLeft()}` : "(kedaluwarsa)"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="otp-form">
          <div className="otp-input-group" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                ref={(el) => (inputs.current[i] = el)}
                className="otp-input"
                autoComplete="off"
              />
            ))}
          </div>

          {message && (
            <p className={`otp-message ${message.includes("berhasil") ? "success" : "error"}`}>
              {message}
            </p>
          )}

          <button 
            type="submit" 
            className="otp-btn" 
            disabled={loading || timeLeft === 0}
          >
            {loading ? "Memverifikasi..." : "Verifikasi & Lanjut Bayar"}
          </button>

          <p
            className="otp-resend"
            onClick={!resending ? handleResend : undefined}
            style={{
              cursor: resending ? "not-allowed" : "pointer",
              opacity: resending ? 0.6 : 1,
            }}
          >
            {resending ? "Mengirim ulang..." : "Kirim ulang kode OTP"}
          </p>
        </form>
      </div>

      {/* Extra Styles */}
      <style jsx>{`
        .otp-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .otp-icon {
          font-size: 32px;
        }

        .otp-product-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #f0fdf4;
          border: 1px solid #86efac;
          padding: 10px 16px;
          border-radius: 10px;
          margin: 16px 0;
          font-size: 14px;
          color: #166534;
        }

        .otp-price {
          font-weight: 600;
          color: #15803d;
        }

        .otp-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 14px;
          color: #ef4444;
          margin-bottom: 16px;
        }

        .otp-message.success {
          color: #16a34a;
        }

        .otp-message.error {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}
