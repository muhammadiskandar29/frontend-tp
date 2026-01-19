"use client";

import { toast } from "react-hot-toast";
import { getCustomerSession } from "@/lib/customerAuth";

export default function HeroSection({ customerInfo, isLoading }) {
  const customerName = customerInfo?.nama_panggilan || customerInfo?.nama || "Member";
  const fullName = customerInfo?.nama || customerInfo?.nama_panggilan || "Member Name";

  // Logic verifikasi yang lebih robust
  const isVerified =
    customerInfo?.verifikasi === 1 ||
    customerInfo?.verifikasi === "1" ||
    customerInfo?.verifikasi === true;

  const memberId = customerInfo?.id || customerInfo?.customer_id || "0";

  return (
    <div className="customer-dashboard__hero-wrapper">
      <div className="customer-dashboard__hero-content">
        <div className="customer-dashboard__hero-card">

          <div className="hero-content-wrapper" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "2rem", flexWrap: "wrap" }}>

            {/* Left Side: Greeting & Verification Alert */}
            <div className="hero-text-section" style={{ flex: 1, minWidth: "300px" }}>
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

              {!isVerified && !isLoading && (
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
              )}
            </div>

            {/* Right Side: Member Card */}
            <div className="hero-card-section" style={{ flexShrink: 0 }}>
              {isLoading ? (
                <div className="member-card skeleton" style={{ background: "#e5e7eb", height: "240px", width: "380px" }}></div>
              ) : (
                <div className="member-card">
                  <div className="member-card__top">
                    <div className="member-card__brand">TERNAK PROPERTI</div>
                    <a href={`/member/${memberId}`} target="_blank" rel="noopener noreferrer" className="member-card__qr" title="Scan or Click to view details">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                        <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5H15zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v3h-3v-3zm-3 3h2v3h-2v-3z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" style={{ color: '#000' }} />
                      </svg>
                    </a>
                  </div>

                  <div className="member-card__body">
                    <div className="member-card__label">MEMBER ID</div>
                    <div className="member-card__number">
                      {(() => {
                        const str = String(memberId).padStart(12, '0');
                        return str.match(/.{1,4}/g).join(' ');
                      })()}
                    </div>
                  </div>

                  <div className="member-card__footer">
                    <div style={{ maxWidth: "70%" }}>
                      <div className="member-card__label">CARDHOLDER</div>
                      <div className="member-card__holder-name">
                        {fullName}
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

          </div>
        </div>
      </div>
    </div>
  );
}
