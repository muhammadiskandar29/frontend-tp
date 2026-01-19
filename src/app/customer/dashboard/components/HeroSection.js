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
            {isLoading ? (
              <div className="member-card skeleton" style={{ background: "#e5e7eb", height: "300px" }}></div>
            ) : (
              <div className="member-card">
                <div className="member-card__top">
                  <div className="member-card__brand">TERNAK PROPERTI</div>
                  <div className="member-card__qr">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                      <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5H15zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v3h-3v-3zm-3 3h2v3h-2v-3z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" style={{ color: '#000' }} />
                    </svg>
                  </div>
                </div>

                <div className="member-card__body">
                  <div className="member-card__label">MEMBER ID</div>
                  <div className="member-card__number">
                    {(() => {
                      const id = customerInfo?.id || customerInfo?.customer_id || "0";
                      const str = String(id).padStart(12, '0');
                      // Format: 0000 0000 0000
                      return str.match(/.{1,4}/g).join(' ');
                    })()}
                  </div>
                </div>

                <div className="member-card__footer">
                  <div>
                    <div className="member-card__label">CARDHOLDER</div>
                    <div className="member-card__holder-name">
                      {customerName}
                    </div>
                  </div>

                  <div className="member-card__status">
                    <div className="member-card__label">MEMBER</div>
                    <div className="member-card__status-value">BASIC</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(!customerInfo?.verifikasi || customerInfo?.verifikasi == "0") ? (
            <div className="hero-verification-alert" style={{ marginTop: "1.5rem" }}>
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


