"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { getCustomerSession } from "@/lib/customerAuth";
import { fetchCustomerDashboard } from "@/lib/customerDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [stats, setStats] = useState([
    { id: "total", label: "Total Order", value: 0, icon: "🧾" },
    { id: "active", label: "Order Aktif", value: 0, icon: "✅" },
  ]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value) => {
    if (!value) return "Rp 0";
    const numberValue = Number(String(value).replace(/\D/g, ""));
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numberValue || 0);
  };

  const parseDateFromString = (value) => {
    if (!value) return null;

    const direct = Date.parse(value);
    if (!Number.isNaN(direct)) {
      return new Date(direct);
    }

    // try format dd/mm/yyyy hh:mm
    const match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/.exec(
      value.trim()
    );
    if (match) {
      const [, dd, mm, yyyy, hh = "00", min = "00"] = match;
      const iso = `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
      const parsed = Date.parse(iso);
      if (!Number.isNaN(parsed)) {
        return new Date(parsed);
      }
    }

    return null;
  };

  const getOrderStartDate = (order) => {
    return (
      parseDateFromString(order.webinar?.start_time) ||
      parseDateFromString(order.webinar?.start_time_formatted) ||
      parseDateFromString(order.tanggal_event) ||
      parseDateFromString(order.tanggal_order_raw) ||
      null
    );
  };

  const adaptOrders = (orders = [], { status } = {}) =>
    orders.map((order) => {
      const typeLabel =
        order.tipe_produk === "ebook"
          ? "E-Book"
          : order.tipe_produk === "seminar"
          ? "Seminar"
          : (order.kategori_nama || "Produk");

      const schedule =
        order.webinar?.start_time_formatted ||
        order.webinar?.start_time ||
        order.tanggal_order ||
        "-";

      const actionLabel =
        order.tipe_produk === "ebook"
          ? "Lihat Materi"
          : order.tipe_produk === "seminar"
          ? "Join Seminar"
          : "Lihat Detail";

      const startDate = getOrderStartDate(order);
      const requiresPayment =
        status === "pending" ||
        order.status === "pending" ||
        order.status === "0" ||
        order.is_paid === false;

      return {
        id: order.id,
        type: typeLabel,
        title: order.produk_nama || "Produk Tanpa Nama",
        slug: order.ebook_url || order.produk_kode || order.kategori_nama || "-",
        total: order.total_harga_formatted || formatCurrency(order.total_harga),
        orderDate: order.tanggal_order || "-",
        schedule,
        actionLabel,
        requiresPayment,
        startDate,
      };
    });

  const loadDashboardData = useCallback(async () => {
    const session = getCustomerSession();

    if (!session.token) {
      setDashboardError("Token tidak ditemukan. Silakan login kembali.");
      setDashboardLoading(false);
      router.replace("/customer/login");
      return;
    }

    setDashboardLoading(true);
    setDashboardError("");

    try {
      const data = await fetchCustomerDashboard(session.token);
      setCustomerInfo(data.customer || null);
      setStats((prev) =>
        prev.map((item) => {
          if (item.id === "total") {
            return { ...item, value: data?.statistik?.total_order ?? 0 };
          }
          if (item.id === "active") {
            return { ...item, value: data?.statistik?.order_aktif ?? 0 };
          }
          return item;
        })
      );
      setActiveOrders(adaptOrders(data?.orders_aktif || []));
      setPendingOrders(adaptOrders(data?.orders_pending || [], { status: "pending" }));
    } catch (error) {
      console.error("❌ [DASHBOARD] Failed to load data:", error);
      setDashboardError(error.message || "Gagal memuat data dashboard.");
    } finally {
      setDashboardLoading(false);
    }
  }, [router]);

  // Cek apakah user sudah verifikasi
  useEffect(() => {
    const checkVerification = () => {
      const session = getCustomerSession();
      console.log("🔵 [DASHBOARD] Checking verification status...");
      console.log("🔵 [DASHBOARD] Session:", session);
      
      if (session.user) {
        // Cek apakah user sudah verifikasi (verifikasi = 1 atau "1" atau true)
        const verifikasiValue = session.user.verifikasi;
        // Normalize: convert string "1" to number 1, "0" to 0, etc.
        const normalizedVerifikasi = verifikasiValue === "1" ? 1 : verifikasiValue === "0" ? 0 : verifikasiValue;
        const isVerified = normalizedVerifikasi === 1 || normalizedVerifikasi === true;
        
        console.log("🔵 [DASHBOARD] Checking verification:");
        console.log("🔵 [DASHBOARD] Raw verifikasi value:", verifikasiValue);
        console.log("🔵 [DASHBOARD] Verifikasi type:", typeof verifikasiValue);
        console.log("🔵 [DASHBOARD] Normalized verifikasi:", normalizedVerifikasi);
        console.log("🔵 [DASHBOARD] Is verified:", isVerified);
        
        if (isVerified) {
          console.log("✅ [DASHBOARD] User already verified, hiding modal and allowing access");
          setShowVerificationModal(false);
          // User sudah verifikasi, langsung masuk dashboard tanpa modal
          loadDashboardData();
          return;
        } else {
          console.log("⚠️ [DASHBOARD] User not verified, showing modal");
          console.log("⚠️ [DASHBOARD] Verifikasi value that failed check:", verifikasiValue);
          setShowVerificationModal(true);
        }
      } else {
        // Jika tidak ada user data
        console.log("⚠️ [DASHBOARD] No user data");
        // Jika tidak ada token juga, redirect ke login
        if (!session.token) {
          console.log("⚠️ [DASHBOARD] No token, redirecting to login");
          router.replace("/customer/login");
        } else {
          // Ada token tapi tidak ada user data, mungkin perlu verifikasi
          console.log("⚠️ [DASHBOARD] Has token but no user data, showing modal");
          setShowVerificationModal(true);
        }
      }
    };

    // Check immediately
    checkVerification();

    // Also check when page becomes visible (user returns from OTP page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVerification();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also check on focus (when user switches back to tab)
    const handleFocus = () => {
      checkVerification();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router, loadDashboardData]);

  const handleVerificationOK = async () => {
    const session = getCustomerSession();
    console.log("🔵 [DASHBOARD] handleVerificationOK called");
    console.log("🔵 [DASHBOARD] Session:", session);

    const token = session.token;
    const user = session.user;

    if (!token || !user) {
      toast.error("Sesi tidak valid. Silakan login kembali.");
      router.replace("/customer/login");
      return;
    }

    const customerId = user.id || user.customer_id;
    const wa = user.wa || user.phone;

    if (!customerId || !wa) {
      console.error("❌ [DASHBOARD] Missing customer ID or WA number", { customerId, wa, user });
      toast.error("Data customer tidak lengkap. Silakan hubungi admin.");
      return;
    }

    setSendingOTP(true);

    try {
      console.log("🔵 [DASHBOARD] Sending OTP with existing session token...");
      const { sendCustomerOTP } = await import("@/lib/customerAuth");
      const otpResult = await sendCustomerOTP(customerId, wa, token);

      if (otpResult.success) {
        console.log("✅ [DASHBOARD] OTP sent successfully, redirecting to OTP page");
        setShowVerificationModal(false);
        router.replace("/customer/otp");
      } else {
        console.error("❌ [DASHBOARD] Failed to send OTP:", otpResult.message);
        toast.error(otpResult.message || "Gagal mengirim OTP");
      }
    } catch (error) {
      console.error("❌ [DASHBOARD] Error in handleVerificationOK:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSendingOTP(false);
    }
  };

  const getCountdownLabel = (order) => {
    if (!order.startDate) return null;

    const diff = order.startDate.getTime() - currentTime;
    if (diff <= 0) {
      return "Jadwal sudah dimulai";
    }

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    parts.push(`${minutes} menit`);

    return parts.join(" ");
  };

  const handleLogout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    router.replace("/customer/login");
  };

  return (
    <CustomerLayout>
      {/* Modal Verifikasi */}
      {showVerificationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Jangan tutup jika klik di luar modal
            }
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "16px",
                color: "#1f1b16",
              }}
            >
              ⚠️ Verifikasi Diperlukan
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#666",
                marginBottom: "24px",
                lineHeight: "1.6",
              }}
            >
              Akun Anda belum terverifikasi. Silakan verifikasi akun Anda terlebih dahulu untuk melanjutkan.
              Kode OTP akan dikirim ke WhatsApp Anda.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={handleVerificationOK}
                disabled={sendingOTP}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#F1A124",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: sendingOTP ? "not-allowed" : "pointer",
                  opacity: sendingOTP ? 0.6 : 1,
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  if (!sendingOTP) {
                    e.target.style.backgroundColor = "#d98f1e";
                  }
                }}
                onMouseOut={(e) => {
                  if (!sendingOTP) {
                    e.target.style.backgroundColor = "#F1A124";
                  }
                }}
              >
                {sendingOTP ? "Mengirim OTP..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="customer-dashboard">
        <header className="customer-dashboard__hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="customer-dashboard__subtitle">Kelola dan akses order Anda di sini</p>
            <h1>
              Selamat Datang,{" "}
              <span>{(customerInfo?.nama_panggilan || customerInfo?.nama || "Member") + "!"}</span>
            </h1>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              padding: "10px 24px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(220, 53, 69, 0.2)"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#c82333";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 12px rgba(220, 53, 69, 0.3)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#dc3545";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 8px rgba(220, 53, 69, 0.2)";
            }}
          >
            🚪 Logout
          </button>
        </header>

        {!dashboardLoading && dashboardError && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              borderRadius: "8px",
              background: "#fff1f0",
              color: "#a8071a",
              border: "1px solid #ffa39e",
              fontSize: "14px",
            }}
          >
            {dashboardError}
          </div>
        )}

        <section className="stats-grid">
          {stats.map((item) => (
            <div key={item.id} className="stat-card">
              <div className="stat-icon">{item.icon}</div>
              <div>
                <p>{item.label}</p>
                <strong>{dashboardLoading ? "-" : item.value}</strong>
              </div>
            </div>
          ))}
        </section>

        <section className="orders-section">
          <div className="orders-section__header">
            <h2>Order Aktif Saya</h2>
          </div>

          <div className="orders-list">
            {dashboardLoading && (
              <div className="order-card">
                <div className="order-body">
                  <div>
                    <h3>Sedang memuat data...</h3>
                    <p>Mohon tunggu sebentar.</p>
                  </div>
                </div>
              </div>
            )}

            {!dashboardLoading &&
              pendingOrders.length === 0 &&
              activeOrders.length === 0 && (
              <div className="order-card">
                <div className="order-body">
                  <div>
                    <h3>Belum ada order aktif</h3>
                    <p>Ayo eksplor produk kami untuk mulai belajar.</p>
                  </div>
                </div>
              </div>
            )}

            {!dashboardLoading &&
              pendingOrders.map((order) => {
                const countdownLabel = getCountdownLabel(order);
                return (
                  <div
                    key={`pending-${order.id}`}
                    className="order-card"
                    style={{ border: "1px solid rgba(220,38,38,0.25)", boxShadow: "0 12px 30px rgba(220,38,38,0.08)" }}
                  >
                    <div className="order-card__banner">
                      <span
                        className="order-badge"
                        style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}
                      >
                        Menunggu Pembayaran
                      </span>
                    </div>

                    <div className="order-body">
                      <div>
                        <h3>{order.title}</h3>
                        <p>{order.slug}</p>
                      </div>

                      <div className="order-meta">
                        <div>
                          <p>Total Harga</p>
                          <strong>{order.total}</strong>
                        </div>
                        <div>
                          <p>Tanggal Order</p>
                          <strong>{order.orderDate}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="order-footer">
                      <div className="order-schedule">
                        <span>Waktu Pelaksanaan</span>
                        <strong>{order.schedule}</strong>
                        {countdownLabel && (
                          <small style={{ color: "#dc2626", fontWeight: 600 }}>
                            Sisa waktu: {countdownLabel}
                          </small>
                        )}
                      </div>
                      <button
                        className="order-action"
                        style={{ backgroundColor: "#ef4444", color: "#fff" }}
                      >
                        Bayar Sekarang
                      </button>
                    </div>
                  </div>
                );
              })}

            {!dashboardLoading &&
              activeOrders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-card__banner">
                    <span className="order-badge">{order.type}</span>
                  </div>

                  <div className="order-body">
                    <div>
                      <h3>{order.title}</h3>
                      <p>{order.slug}</p>
                    </div>

                    <div className="order-meta">
                      <div>
                        <p>Total Harga</p>
                        <strong>{order.total}</strong>
                      </div>
                      <div>
                        <p>Tanggal Order</p>
                        <strong>{order.orderDate}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="order-footer">
                    <div className="order-schedule">
                      <span>Jadwal Seminar</span>
                      <strong>{order.schedule}</strong>
                    </div>
                    <button className="order-action">{order.actionLabel}</button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </CustomerLayout>
  );
}
