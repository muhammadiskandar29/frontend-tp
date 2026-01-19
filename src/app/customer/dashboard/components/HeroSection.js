"use client";

import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getCustomerSession } from "@/lib/customerAuth";

export default function HeroSection({ customerInfo, isLoading }) {
  const router = useRouter();

  const session = getCustomerSession();
  const sessionUser = session?.user || {};

  // Logic Verification "Aggressive"
  // Cek semua kemungkinan sumber data verifikasi
  const isVerified = (() => {
    const candidates = [
      customerInfo?.verifikasi,
      customerInfo?.data?.verifikasi, // Jaga-jaga nested data
      sessionUser?.verifikasi,
      sessionUser?.data?.verifikasi
    ];

    // Debugging (Temporary - uncomment if needed)
    // console.log("🔍 [HERO Debug] Verif Candidates:", candidates);

    return candidates.some(val => {
      if (val === undefined || val === null) return false;
      const s = String(val).trim().toLowerCase();
      // Terima 1, "1", true, "true" sebagai verified
      return s === "1" || s === "true";
    });
  })();

  const displayInfo = { ...sessionUser, ...customerInfo };
  const customerName = displayInfo?.nama_panggilan || displayInfo?.nama || "Member";
  const fullName = displayInfo?.nama || displayInfo?.nama_panggilan || "Member Name";

  const memberId = displayInfo?.memberID || displayInfo?.member_id || displayInfo?.id ||
    displayInfo?.customer_id || "0";

  return (
    <div className="customer-dashboard__hero-wrapper">
      <div className="customer-dashboard__hero-content">

        {/* Helper Wrapper for Layout */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Top Section: Greeting & Member Card */}
          <div className="customer-dashboard__hero-card">
            <div className="hero-content-wrapper" style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "2rem",
              flexWrap: "wrap"
            }}>

              {/* Left Side: Greeting */}
              <div className="hero-text-section" style={{ flex: 1, minWidth: "300px", alignSelf: "flex-start", paddingTop: "1rem" }}>
                <div className="hero-greeting">
                  <p className="customer-dashboard__subtitle" style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "#64748b" }}>
                    Kelola dan akses semua order Anda di satu tempat
                  </p>
                  <h1 style={{ fontSize: "2rem", lineHeight: "1.2" }}>
                    {isLoading ? (
                      "Selamat Datang!"
                    ) : (
                      <>
                        Selamat Datang, <br />
                        <span className="hero-name" style={{ color: "#f97316" }}>{customerName}!</span>
                      </>
                    )}
                  </h1>
                </div>
              </div>

              {/* Right Side: Member Card */}
              <div className="hero-card-section" style={{ flexShrink: 0 }}>
                {isLoading ? (
                  <div className="member-card skeleton" style={{ background: "#e5e7eb", height: "240px", width: "400px", borderRadius: "20px" }}></div>
                ) : (
                  <div className="member-card" style={{
                    background: "linear-gradient(135deg, #FF881B 0%, #FF512F 100%)", // Vibrant Orange Gradient
                    borderRadius: "20px",
                    padding: "1.75rem",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 20px 25px -5px rgba(255, 110, 48, 0.4), 0 8px 10px -6px rgba(255, 110, 48, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    width: "100%",
                    maxWidth: "420px",
                    minHeight: "250px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    {/* Background Pattern Overlay */}
                    <div style={{
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
                      pointerEvents: 'none',
                      transform: 'rotate(-15deg)'
                    }} />

                    {/* Top Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: "700",
                        fontSize: "1.35rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}>
                        TERNAK PROPERTI
                      </div>
                      <a href={`/member/${memberId}`} target="_blank" rel="noopener noreferrer" style={{
                        background: "#FDE047", // Yellow-400 equivalent
                        padding: "6px",
                        borderRadius: "10px",
                        width: "52px",
                        height: "52px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                      }} title="Scan or Click to view details">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                          <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5H15zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v3h-3v-3zm-3 3h2v3h-2v-3z" fill="#1F2937" fillRule="evenodd" clipRule="evenodd" />
                        </svg>
                      </a>
                    </div>

                    {/* Middle Row: Member ID */}
                    <div style={{ marginTop: "auto", marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
                      <div style={{
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        color: "rgba(255, 255, 255, 0.8)",
                        marginBottom: "0.35rem",
                        fontWeight: "600"
                      }}>MEMBER ID</div>
                      <div style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: "1.6rem",
                        letterSpacing: "0.1rem",
                        fontWeight: "700",
                        display: "flex",
                        gap: "0.75rem",
                        textShadow: "0 2px 2px rgba(0,0,0,0.1)"
                      }}>
                        {(() => {
                          const str = String(memberId).padStart(12, '0');
                          return str.match(/.{1,4}/g)?.join(' ') || str;
                        })()}
                      </div>
                    </div>

                    {/* Bottom Row: Cardholder & Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
                      <div style={{ maxWidth: "65%" }}>
                        <div style={{
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.15em",
                          color: "rgba(255, 255, 255, 0.8)",
                          marginBottom: "0.25rem",
                          fontWeight: "600"
                        }}>CARDHOLDER</div>
                        <div style={{
                          fontSize: "1.1rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}>
                          {fullName}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.15em",
                          color: "rgba(255, 255, 255, 0.8)",
                          marginBottom: "0.25rem",
                          fontWeight: "600"
                        }}>MEMBER</div>
                        <div style={{
                          color: "#FDE047", // Yellow-300
                          fontWeight: "800",
                          fontSize: "1.1rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          textShadow: "0 1px 2px rgba(0,0,0,0.2)"
                        }}>BASIC</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>


          {/* Bottom Section: Verification Alert (Only if Unverified) */}


        </div>
      </div>
    </div>
  );
}
