"use client";

import { toast } from "react-hot-toast";
import { getCustomerSession } from "@/lib/customerAuth";

export default function HeroSection({ customerInfo, isLoading }) {
  const customerName = customerInfo?.nama_panggilan || customerInfo?.nama || "Member";

  return (
    <div className="customer-dashboard__hero-wrapper">
      <div className="customer-dashboard__hero-content">
        <div className="customer-dashboard__hero-card">
          <div className="hero-greeting">
            <p className="customer-dashboard__subtitle">
              Kelola dan akses semua order Anda di satu tempat
            </p>
            <h1>
              {isLoading ? (
                "Selamat Datang!"
              ) : (
                <>
                  Selamat Datang,{" "}
                  <span className="hero-name">{customerName}!</span>
                </>
              )}
            </h1>
          </div>

          {(!customerInfo?.verifikasi || customerInfo?.verifikasi == "0") ? (
            <div className="hero-verification-alert" style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ color: "#DC2626" }}>⚠️</div>
                <p style={{ margin: 0, color: "#991B1B", fontWeight: 500 }}>
                  Akun Anda belum diverifikasi. Silakan verifikasi OTP terlebih dahulu.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const session = getCustomerSession();
                    const token = session.token;

                    if (!token) {
                      toast.error("Sesi tidak valid. Silakan login ulang.");
                      return;
                    }

                    if (!customerInfo?.wa) {
                      toast.error("Nomor WhatsApp tidak ditemukan.");
                      return;
                    }

                    let waNumber = customerInfo.wa.trim();
                    if (waNumber.startsWith("0")) {
                      waNumber = "62" + waNumber.substring(1);
                    } else if (!waNumber.startsWith("62")) {
                      waNumber = "62" + waNumber;
                    }

                    const payload = {
                      customer_id: customerInfo.id || customerInfo.customer_id,
                      wa: waNumber,
                    };

                    const toastId = toast.loading("Mengirim OTP...");

                    const response = await fetch("/api/customer/otp/send", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(payload),
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                      toast.success("OTP berhasil dikirim ke WhatsApp Anda!", { id: toastId });
                    } else {
                      toast.error(data.message || "Gagal mengirim OTP.", { id: toastId });
                    }
                  } catch (error) {
                    console.error("OTP Error:", error);
                    toast.error("Terjadi kesalahan saat mengirim OTP.");
                  }
                }}
                className="btn-primary"
                style={{
                  backgroundColor: "#DC2626",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Verifikasi Sekarang
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


