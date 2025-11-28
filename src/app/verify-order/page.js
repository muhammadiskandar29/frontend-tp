"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import "@/styles/otp.css";

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
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: orderData.customerId,
          otp: code,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Verifikasi berhasil! 🎉");
        setTimerActive(false);
        toast.success("OTP Verified!");

        // Hapus pending order dari localStorage
        localStorage.removeItem("pending_order");

        // Redirect ke halaman pembayaran sesuai metode
        await new Promise((r) => setTimeout(r, 500));
        redirectToPayment();
      } else {
        setMessage(result.message || "Kode OTP salah atau sudah kadaluarsa.");
      }
    } catch (error) {
      setMessage("Terjadi kesalahan saat memverifikasi OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Redirect ke payment sesuai metode
  const redirectToPayment = () => {
    if (!orderData) return;

    const { paymentMethod, productName, totalHarga, landingUrl } = orderData;


    switch (paymentMethod) {
      case "ewallet":
        callMidtrans("ewallet");
        break;
      case "cc":
        callMidtrans("cc");
        break;
      case "va":
        callMidtrans("va");
        break;
      case "manual":
      default:
        // Manual transfer - buka di tab baru, balik ke landing
        const query = new URLSearchParams({
          product: productName || "",
          harga: totalHarga || "0",
        });
        window.open(`/payment?${query.toString()}`, "_blank");
        // Balik ke landing page
        router.push(landingUrl || "/");
        break;
    }
  };

  // Call Midtrans API
  const callMidtrans = async (type) => {
    if (!orderData) return;

    const { nama, email, totalHarga, productName, landingUrl } = orderData;
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
    }

    try {
      const payload = {
        name: nama,
        email: email,
        amount: totalHarga,
        product_name: productName,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (json.redirect_url) {
        // Buka Midtrans di tab baru
        window.open(json.redirect_url, "_blank");
        // Balik ke landing page (form akan kosong/fresh)
        router.push(landingUrl || "/");
      } else {
        toast.error(json.message || "Gagal membuat transaksi");
        router.push(landingUrl || "/");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat memproses pembayaran");
      router.push(landingUrl || "/");
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!orderData?.customerId || !orderData?.wa) {
      setMessage("Sesi telah berakhir. Silakan mulai ulang pemesanan.");
      return;
    }

    setResending(true);
    setMessage("");

    try {
      // Dari landing page - tidak perlu token
      const response = await fetch("/api/otp/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          customer_id: orderData.customerId,
          wa: orderData.wa,
        }),
      });

      const result = await response.json();

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
      setMessage("Terjadi kesalahan saat mengirim ulang OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-box">
        <div className="otp-header">
          <span className="otp-icon">🔐</span>
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
            <span>📦</span>
            <span>{orderData.productName}</span>
            {orderData.totalHarga && (
              <span className="otp-price">
                Rp {Number(orderData.totalHarga).toLocaleString("id-ID")}
              </span>
            )}
          </div>
        )}

        <div className="otp-timer">
          <span>⏱️</span>
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
