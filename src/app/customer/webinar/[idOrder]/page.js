"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCustomerSession } from "@/lib/customerAuth";
import { fetchCustomerDashboard } from "@/lib/customerDashboard";
import config from "@/config/env";
import "@/styles/webinar-gateway.css";

export default function WebinarGatewayPage() {
  const params = useParams();
  const router = useRouter();
  const idOrder = params?.idOrder;
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [webinarData, setWebinarData] = useState(null);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(""); // "unauthorized", "not_found", "server_error", "network_error"
  const [showZoom, setShowZoom] = useState(false);

  useEffect(() => {
    if (!idOrder) {
      setError("Order ID tidak ditemukan. Silakan kembali ke dashboard.");
      setErrorType("not_found");
      setLoading(false);
      setValidating(false);
      return;
    }

    const session = getCustomerSession();
    if (!session.token) {
      router.replace("/customer/login");
      return;
    }

    // Validasi ownership order sebelum fetch webinar data
    validateOrderAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idOrder]);

  // Validasi apakah customer memiliki akses ke order ini
  const validateOrderAccess = async () => {
    try {
      setValidating(true);
      setLoading(true);
      setError("");
      const session = getCustomerSession();
      const backendUrl = config.backendUrl || "";

      // Fetch customer dashboard untuk mendapatkan list orders
      const dashboardData = await fetchCustomerDashboard(session.token);
      const customer = dashboardData.customer || {};
      
      // Gabungkan semua orders (aktif dan pending)
      const allOrders = [
        ...(dashboardData.orders_aktif || []),
        ...(dashboardData.orders_pending || [])
      ];

      // Cek apakah order dengan idOrder ada di list orders customer
      const orderIdNumber = Number(idOrder);
      const foundOrder = allOrders.find(order => Number(order.id) === orderIdNumber);

      if (!foundOrder) {
        setError("Anda tidak memiliki akses ke webinar ini. Hanya customer yang membeli order ini yang dapat mengakses.");
        setErrorType("unauthorized");
        setLoading(false);
        setValidating(false);
        return;
      }

      // Pastikan order memiliki data webinar
      if (!foundOrder.webinar) {
        setError("Webinar tidak tersedia untuk order ini. Silakan hubungi support.");
        setErrorType("not_found");
        setLoading(false);
        setValidating(false);
        return;
      }

      // Susun data webinar dari order + info customer
      const joinLink = `${backendUrl}/customer/order/${orderIdNumber}/join?token=${session.token}`;

      setWebinarData({
        meetingNumber: foundOrder.webinar.meeting_id,
        password: foundOrder.webinar.password,
        join_url: foundOrder.webinar.join_url,
        joinUrl: joinLink,
        start_time: foundOrder.webinar.start_time,
        start_time_formatted: foundOrder.webinar.start_time_formatted,
        duration: foundOrder.webinar.duration,
        userName: customer.nama_panggilan || customer.nama || "Customer",
        userEmail: customer.email || "",
        produkNama: foundOrder.produk_nama || "",
        orderId: Number(idOrder),
        kategoriNama: foundOrder.kategori_nama || "Webinar",
        webinar: foundOrder.webinar,
        signature: null,
        sdkKey: null
      });

      setLoading(false);
      setValidating(false);
    } catch (err) {
      console.error("❌ [WEBINAR] Validation error:", err);
      setError("Gagal memvalidasi akses. Silakan coba lagi atau hubungi support.");
      setErrorType("server_error");
      setLoading(false);
      setValidating(false);
    }
  };

  // Tidak lagi mem-fetch data webinar dari backend lain karena data sudah tersedia di order dashboard

  const handleJoinMeeting = () => {
    if (!webinarData) return;
    const embedUrl = webinarData.joinUrl || webinarData.join_url;
    if (!embedUrl) {
      alert("Link webinar tidak tersedia. Silakan hubungi support.");
      return;
    }
    setShowZoom(true);
  };

  if (loading || validating) {
    return (
      <div className="webinar-gateway-page">
        <div className="ticker ticker-top">
          <span>Selamat datang di Webinar One Dashboard — Pastikan kamera dan mikrofon siap, gunakan koneksi internet stabil, dan hubungi host bila mengalami kendala.</span>
        </div>
        <div className="webinar-gateway-container">
          <div className="webinar-loading">
            <div className="loading-spinner"></div>
            <p>
              {validating ? "Memvalidasi akses..." : "Memuat data webinar..."}
            </p>
          </div>
        </div>
        <div className="ticker ticker-bottom">
          <span>Promo spesial! Raih diskon kelas lanjutan dan bonus e-book eksklusif untuk peserta webinar hari ini.</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="webinar-gateway-page">
        <div className="ticker ticker-top">
          <span>Selamat datang di Webinar One Dashboard — Pastikan kamera dan mikrofon siap, gunakan koneksi internet stabil, dan hubungi host bila mengalami kendala.</span>
        </div>
        <div className="webinar-gateway-container">
          <div className="webinar-error">
            <div className="error-icon">
              {errorType === "unauthorized" ? "🔒" : errorType === "not_found" ? "🔍" : "⚠️"}
            </div>
            <h2>
              {errorType === "unauthorized" 
                ? "Akses Ditolak"
                : errorType === "not_found"
                ? "Tidak Ditemukan"
                : errorType === "network_error"
                ? "Koneksi Gagal"
                : "Terjadi Kesalahan"
              }
            </h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button 
                className="error-btn-primary"
                onClick={() => router.push("/customer/dashboard")}
              >
                Kembali ke Dashboard
              </button>
              {errorType === "network_error" && (
                <button 
                  className="error-btn-secondary"
                  onClick={() => {
                    setError("");
                    setLoading(true);
                    validateOrderAccess();
                  }}
                >
                  Coba Lagi
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="ticker ticker-bottom">
          <span>Promo spesial! Raih diskon kelas lanjutan dan bonus e-book eksklusif untuk peserta webinar hari ini.</span>
        </div>
      </div>
    );
  }

  if (!webinarData) {
    return (
      <div className="webinar-gateway-page">
        <div className="ticker ticker-top">
          <span>Selamat datang di Webinar One Dashboard — Pastikan kamera dan mikrofon siap, gunakan koneksi internet stabil, dan hubungi host bila mengalami kendala.</span>
        </div>
        <div className="webinar-gateway-container">
          <div className="webinar-error">
            <h2>Data Webinar Tidak Ditemukan</h2>
            <button onClick={() => router.push("/customer/dashboard")}>
              Kembali ke Dashboard
            </button>
          </div>
        </div>
        <div className="ticker ticker-bottom">
          <span>Promo spesial! Raih diskon kelas lanjutan dan bonus e-book eksklusif untuk peserta webinar hari ini.</span>
        </div>
      </div>
    );
  }

  const runningTextTop = "Selamat datang di Webinar One Dashboard — Pastikan kamera dan mikrofon siap, gunakan koneksi internet stabil, dan hubungi host bila mengalami kendala.";
  const runningTextBottom = "Promo spesial! Raih diskon kelas lanjutan dan bonus e-book eksklusif untuk peserta webinar hari ini.";

  return (
    <div className="webinar-gateway-page">
      <div className="ticker ticker-top">
        <span>{runningTextTop}</span>
      </div>
      <div className="webinar-gateway-container">
        {showZoom && webinarData ? (
          <div className="webinar-embed-wrapper">
            <iframe
              src={webinarData.joinUrl || webinarData.join_url}
              title="Zoom Meeting"
              allow="camera; microphone; fullscreen; display-capture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="webinar-gateway">
            <div className="webinar-header">
              <h1>
                {webinarData.kategoriNama?.toLowerCase() === "seminar" 
                  ? "Seminar Online"
                  : "Webinar Online"
                }
              </h1>
            </div>

            <div className="webinar-content">
              <h2 className="webinar-title">
                {webinarData.kategoriNama?.toLowerCase() === "seminar" 
                  ? `Bergabung ke seminar ${webinarData.produkNama}`
                  : `Bergabung ke webinar ${webinarData.produkNama}`
                }
              </h2>

              <div className="webinar-info">
                <div className="info-item">
                  <span className="info-label">Nama Peserta</span>
                  <span className="info-value">{webinarData.userName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Meeting ID</span>
                  <span className="info-value">{webinarData.meetingNumber}</span>
                </div>
              </div>

              <div className="join-link-card">
                <div className="join-link-header">
                  <span>Link Akses Webinar</span>
                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(webinarData.joinUrl || webinarData.join_url || "");
                      }
                    }}
                  >
                    Salin Link
                  </button>
                </div>
                <p>{webinarData.joinUrl || webinarData.join_url}</p>
              </div>

              {webinarData.kategoriNama?.toLowerCase() === "seminar" ? (
                <div className="webinar-schedule">
                  <div className="schedule-item">
                    <span className="schedule-label">Jadwal Seminar</span>
                    <span className="schedule-value">
                      {webinarData.webinar?.start_time 
                        ? new Date(webinarData.webinar.start_time).toLocaleString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "Jadwal akan diumumkan kemudian"
                      }
                    </span>
                  </div>
                  {webinarData.webinar?.duration && (
                    <div className="schedule-item">
                      <span className="schedule-label">Durasi</span>
                      <span className="schedule-value">{webinarData.webinar.duration} menit</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="webinar-notice">
                  <div className="notice-text">
                    <span className="running-text">
                      Selamat datang di Webinar One Dashboard — Pastikan kamera dan mikrofon siap, gunakan koneksi internet stabil, dan hubungi host bila mengalami kendala.
                    </span>
                  </div>
                </div>
              )}

              <button className="join-meeting-btn" onClick={handleJoinMeeting}>
                Join Meeting
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="ticker ticker-bottom">
        <span>{runningTextBottom}</span>
      </div>
    </div>
  );
}

