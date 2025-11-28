"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import "@/styles/otp.css";
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

  useEffect(() => {
    const session = getCustomerSession();
    if (!session.user || !session.user.id) {
      console.error("❌ [OTP] No user data, redirecting to login");
      router.replace("/customer/login");
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
    
    setCustomerId(session.user.id);
    setWa(session.user.wa || session.user.phone);
    console.log("🔵 [OTP] Customer ID:", session.user.id);
    console.log("🔵 [OTP] WA:", session.user.wa || session.user.phone);
    resetOtpTimer();
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
      console.log("📥 [OTP] Verify response:", result);
      
      if (result.success) {
        setMessage("Verifikasi berhasil! 🎉");
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
      console.log("📥 [OTP] Resend response:", result);
      
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
    <div className="otp-container">
      <div className="otp-box">
        <div className="otp-header">
          <span className="otp-icon">🔐</span>
          <h1 className="otp-title">Verifikasi</h1>
        </div>
        
        <p className="otp-desc">
          Masukkan 6 digit kode OTP yang telah dikirim ke WhatsApp
          {wa && (
            <strong> ({wa.replace(/(\d{2})(\d{3})(\d{4})(\d+)/, "+$1 $2-$3-$4")})</strong>
          )}
        </p>

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
            {loading ? "Memverifikasi..." : "Verifikasi"}
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
