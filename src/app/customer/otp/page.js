"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import "@/styles/sales/otp.css";
import { getCustomerSession } from "@/lib/customerAuth";

const OTP_VALID_DURATION = 5 * 60; // 5 minutes in seconds

export default function CustomerOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [wa, setWa] = useState(null);
  const [timeLeft, setTimeLeft] = useState(OTP_VALID_DURATION);
  const [timerActive, setTimerActive] = useState(true);
  const inputs = useRef([]);

  const resetOtpTimer = () => {
    setTimeLeft(OTP_VALID_DURATION);
    setTimerActive(true);
  };

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(timeLeft % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Auto-send OTP function
  const autoSendOTP = async (customerId, waNumber) => {
    if (!customerId || !waNumber) {
      console.log("⚠️ [OTP] Cannot auto-send: missing customerId or waNumber");
      return;
    }

    try {
      console.log("🔵 [OTP] Auto-sending OTP on page load...");

      // Format nomor WA (pastikan format 62xxxxxxxxxx)
      let formattedWa = waNumber.trim();
      if (formattedWa.startsWith("0")) {
        formattedWa = "62" + formattedWa.substring(1);
      } else if (!formattedWa.startsWith("62")) {
        formattedWa = "62" + formattedWa;
      }

      const token = localStorage.getItem("customer_token");

      if (!token) {
        console.error("❌ [OTP] No token found for auto-send");
        return;
      }

      const response = await fetch("/api/customer/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          wa: formattedWa,
        }),
      });

      const result = await response.json();
      console.log("[OTP] Auto-send response:", result);

      if (result.success) {
        setMessage("Kode OTP telah dikirim ke WhatsApp Anda!");
        toast.success("OTP terkirim!");
        resetOtpTimer();
      } else {
        console.error("❌ [OTP] Auto-send failed:", result.message);
      }
    } catch (error) {
      console.error("❌ [OTP] Error auto-sending:", error);
    }
  };

  useEffect(() => {
    const session = getCustomerSession();
    if (!session.user || !session.user.id) {
      console.error("❌ [OTP] No user data, redirecting to login");
      router.replace("/customer");
      return;
    }

    // Cek apakah user sudah verifikasi
    const isVerified = session.user.verifikasi === 1 || session.user.verifikasi === "1";
    console.log("🔵 [OTP] User verification status:", isVerified);
    console.log("🔵 [OTP] User verifikasi value:", session.user.verifikasi);

    // Jika sudah verifikasi, langsung ke dashboard
    if (isVerified) {
      console.log("✅ [OTP] User already verified, redirecting to dashboard");
      router.replace("/customer/dashboard");
      return;
    }

    const customerIdValue = session.user.id;
    const waNumber = session.user.wa || session.user.phone;

    setCustomerId(customerIdValue);
    setWa(waNumber);
    console.log("🔵 [OTP] Customer ID:", customerIdValue);
    console.log("🔵 [OTP] WA:", waNumber);
    resetOtpTimer();

    // Auto-send OTP ketika halaman dimuat
    if (customerIdValue && waNumber) {
      autoSendOTP(customerIdValue, waNumber);
    }
  }, [router]);

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

  useEffect(() => {
    if (timeLeft === 0) {
      setMessage((prev) => prev || "Kode OTP telah kedaluwarsa. Kirim ulang kode untuk melanjutkan.");
    }
  }, [timeLeft]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setMessage("Masukkan 6 digit kode OTP.");
      return;
    }

    if (!customerId) {
      setMessage("Data customer tidak ditemukan. Silakan login kembali.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      console.log("🔵 [OTP] Verifying OTP...");

      const token = localStorage.getItem("customer_token");
      const response = await fetch("/api/customer/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_id: customerId,
          otp: code,
        }),
      });

      const result = await response.json();
      console.log("[OTP] Verify response:", result);

      if (result.success) {
        setMessage("Verifikasi berhasil!");
        setTimerActive(false);
        toast.success("Verifikasi berhasil!");
        localStorage.setItem("customer_show_update_modal", "1");

        // Update user data di localStorage dengan data dari response API
        const session = getCustomerSession();
        if (session.user && result.data) {
          const updatedUser = {
            ...session.user,
            verifikasi: result.data.verifikasi || 1,
            nama: result.data.nama || session.user.nama,
            customer_id: result.data.customer_id || session.user.id || session.user.customer_id,
          };
          localStorage.setItem("customer_user", JSON.stringify(updatedUser));
          console.log("✅ [OTP] User data updated with verification:", updatedUser);
        } else if (session.user) {
          // Fallback jika tidak ada data dari response
          session.user.verifikasi = 1;
          localStorage.setItem("customer_user", JSON.stringify(session.user));
          console.log("✅ [OTP] User data updated (fallback):", session.user);
        }

        // Redirect ke dashboard setelah verifikasi berhasil
        setTimeout(() => {
          router.replace("/customer/dashboard");
        }, 500);
      } else {
        setMessage(result.message || "Kode OTP salah atau sudah kadaluarsa.");
      }
    } catch (error) {
      console.error("❌ [OTP] Error:", error);
      setMessage("Terjadi kesalahan saat memverifikasi OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!customerId || !wa) {
      setMessage("Data customer tidak ditemukan. Silakan login kembali.");
      return;
    }

    setResending(true);
    setMessage("");

    try {
      console.log("🔵 [OTP] Resending OTP...");

      // Format nomor WA (pastikan format 62xxxxxxxxxx)
      let waNumber = wa.trim();
      if (waNumber.startsWith("0")) {
        waNumber = "62" + waNumber.substring(1);
      } else if (!waNumber.startsWith("62")) {
        waNumber = "62" + waNumber;
      }

      const token = localStorage.getItem("customer_token");

      if (!token) {
        setMessage("Token tidak ditemukan. Silakan login kembali.");
        toast.error("Token tidak ditemukan. Silakan login kembali.");
        setResending(false);
        return;
      }

      const response = await fetch("/api/customer/otp/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          wa: waNumber,
        }),
      });

      const result = await response.json();
      console.log("[OTP] Resend response:", result);

      if (result.success) {
        setMessage("Kode OTP baru telah dikirim ke WhatsApp Anda!");
        toast.success("OTP terkirim!");
        // Reset OTP input
        setOtp(["", "", "", "", "", ""]);
        if (inputs.current[0]) {
          inputs.current[0].focus();
        }
        resetOtpTimer();
      } else {
        setMessage(result.message || "Gagal mengirim ulang OTP.");
      }
    } catch (error) {
      console.error("❌ [OTP] Error resending:", error);
      setMessage("Terjadi kesalahan saat mengirim ulang OTP.");
    } finally {
      setResending(false);
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

  return (
    <div className="otp-page">
      <div className="otp-container">

        {/* Brand / Logo */}
        <div className="otp-brand">
          <img src="/assets/logo.png" alt="Logo" className="otp-logo" />
        </div>

        <div className="otp-card">
          <div className="otp-header">
            <div className="otp-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#F0FDF4" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12L11 14L15 10" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="otp-title">Verifikasi WhatsApp</h1>
            <p className="otp-subtitle">
              Kami telah mengirimkan 6 digit kode ke WhatsApp
              {wa && <span className="otp-wa-number"><br />{wa.replace(/(\d{2})(\d{3})(\d{4})(\d+)/, "+$1 $2-$3-$4")}</span>}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="otp-form">
            <div className="otp-inputs" onPaste={handlePaste}>
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
                  className={`otp-input-field ${digit ? 'filled' : ''}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {/* Timer & Message */}
            <div className="otp-status">
              {message ? (
                <p className={`status-message ${message.includes("berhasil") ? "success" : "error"}`}>
                  {message}
                </p>
              ) : (
                <p className="timer-text">
                  Kode berlaku selama <span className="timer-value">{timeLeft > 0 ? formatTimeLeft() : "00:00"}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="otp-submit-btn"
              disabled={loading || timeLeft === 0}
            >
              {loading ? (
                <span className="flex-center gap-2">
                  <span className="spinner"></span> Memverifikasi...
                </span>
              ) : "Verifikasi Sekarang"}
            </button>
          </form>

          <div className="otp-footer">
            <p>Tidak menerima kode?</p>
            <button
              className="resend-btn"
              onClick={!resending ? handleResend : undefined}
              disabled={resending || timerActive}
            >
              {resending ? "Mengirim ulang..." : "Kirim Ulang OTP"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .otp-page {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          font-family: 'Inter', sans-serif;
        }

        .otp-container {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .otp-brand {
          display: flex;
          justify-content: center;
        }

        .otp-logo {
          height: 48px;
          object-fit: contain;
        }

        .otp-card {
          background: #ffffff;
          padding: 2.5rem 2rem;
          border-radius: 20px;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
          border: 1px solid #f1f5f9;
        }

        .otp-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .otp-icon-wrapper {
          display: inline-flex;
          margin-bottom: 1.5rem;
        }

        .otp-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }

        .otp-subtitle {
          font-size: 0.9375rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        .otp-wa-number {
          display: block;
          font-weight: 600;
          color: #1e293b;
          margin-top: 4px;
        }

        .otp-inputs {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .otp-input-field {
          width: 48px;
          height: 56px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1.5rem;
          font-weight: 600;
          text-align: center;
          color: #0f172a;
          background: #f8fafc;
          transition: all 0.2s ease;
          outline: none;
        }

        .otp-input-field:focus {
          border-color: #f1a124;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(241, 161, 36, 0.1);
          transform: translateY(-2px);
        }

        .otp-input-field.filled {
          background: #fff;
          border-color: #cbd5e1;
        }

        .otp-status {
          min-height: 24px;
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }

        .timer-text {
          color: #64748b;
        }

        .timer-value {
          color: #ef4444;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .status-message {
          font-weight: 500;
        }
        .status-message.success { color: #16a34a; }
        .status-message.error { color: #dc2626; }

        .otp-submit-btn {
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(135deg, #f1a124 0%, #d97706 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(241, 161, 36, 0.2);
        }

        .otp-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 12px -1px rgba(241, 161, 36, 0.3);
        }

        .otp-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background: #cbd5e1;
          box-shadow: none;
        }

        .otp-footer {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #f1f5f9;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .otp-footer p {
           margin: 0;
        }

        .resend-btn {
          background: none;
          border: none;
          color: #f1a124;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .resend-btn:hover:not(:disabled) {
          background: #fff8eb;
        }

        .resend-btn:disabled {
          color: #94a3b8;
          cursor: not-allowed;
        }
        
        .flex-center {
           display: flex;
           align-items: center;
           justify-content: center;
        }
        
        .spinner {
           width: 16px; 
           height: 16px;
           border: 2px solid rgba(255,255,255,0.3);
           border-top-color: white;
           border-radius: 50%;
           animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
           to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
           .otp-card {
              padding: 2rem 1.5rem;
           }
           .otp-input-field {
              width: 40px;
              height: 48px;
              font-size: 1.25rem;
           }
        }
      `}</style>
    </div>
  );
}
