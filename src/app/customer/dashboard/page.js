"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { getCustomerSession } from "@/lib/customerAuth";
import { fetchCustomerDashboard } from "@/lib/customerDashboard";
import OTPVerificationModal from "./otpVerificationModal";
import UpdateCustomerModal from "./updateCustomer";

export default function DashboardPage() {
  const router = useRouter();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateModalReason, setUpdateModalReason] = useState("password");
  const [isDashboardLocked, setIsDashboardLocked] = useState(false); // Untuk lock dashboard saat verifikasi = 0
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
  const [hasModalBeenShown, setHasModalBeenShown] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Lock dashboard saat modal verifikasi/update muncul
  useEffect(() => {
    setIsDashboardLocked(showVerificationModal || showUpdateModal);
  }, [showVerificationModal, showUpdateModal]);

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

  const adaptOrders = (orders = [], produkMap = {}, { status } = {}) =>
    orders.map((order) => {
      // Ambil kategori dari produk yang di-fetch (lebih akurat)
      const produkData = produkMap[order.produk];
      const kategoriNama = produkData?.kategori_rel?.nama || order.kategori_nama || "Produk";
      
      // Format kategori nama (capitalize first letter)
      const formatKategori = (nama) => {
        if (!nama) return "Produk";
        return nama.charAt(0).toUpperCase() + nama.slice(1);
      };
      
      const typeLabel = formatKategori(kategoriNama);

      const schedule =
        order.webinar?.start_time_formatted ||
        order.webinar?.start_time ||
        order.tanggal_order ||
        "-";

      // Tentukan action label berdasarkan kategori
      const getActionLabel = (kategoriNama) => {
        const kategoriLower = kategoriNama?.toLowerCase() || "";
        if (kategoriLower === "seminar") {
          return "Join Seminar";
        } else if (kategoriLower === "e-book" || kategoriLower === "ebook") {
          return "Buka Ebook";
        } else if (kategoriLower === "webinar") {
          return "Join Webinar";
        } else if (kategoriLower === "workshop") {
          return "Join Workshop";
        }
        return "Lihat Detail";
      };

      const actionLabel = getActionLabel(kategoriNama);

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
        kategoriNama: kategoriNama,
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
      // Fetch dashboard data
      const data = await fetchCustomerDashboard(session.token);
      
      // Tidak perlu fetch produk lagi karena kategori_nama sudah ada di order data
      // Fetch produk dari admin endpoint menyebabkan error 500 karena customer token tidak memiliki akses admin
      
      const customerData = data.customer || null;
      setCustomerInfo(customerData);
      
      // ===== SYNC CUSTOMER DATA KE LOCALSTORAGE =====
      // Update localStorage dengan data customer terbaru dari backend
      // Ini memastikan field seperti nama_panggilan, profesi, verifikasi ter-update
      if (customerData) {
        const existingUser = session.user || {};
        const updatedUser = {
          ...existingUser,
          ...customerData,
          // Pastikan field penting tidak null jika sudah ada di existingUser
          nama_panggilan: customerData.nama_panggilan || existingUser.nama_panggilan,
          profesi: customerData.profesi || existingUser.profesi,
          // Pastikan verifikasi ter-sync dari backend (prioritas utama untuk modal check)
          verifikasi: customerData.verifikasi !== undefined ? customerData.verifikasi : existingUser.verifikasi,
        };
        localStorage.setItem("customer_user", JSON.stringify(updatedUser));
        console.log("✅ [DASHBOARD] Customer data synced to localStorage:", updatedUser);
        console.log("✅ [DASHBOARD] Key field for modal check:", {
          verifikasi: updatedUser.verifikasi,
          isVerified: updatedUser.verifikasi === "1" || updatedUser.verifikasi === 1
        });
      }
      
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
      setActiveOrders(adaptOrders(data?.orders_aktif || [], {}));
      setPendingOrders(adaptOrders(data?.orders_pending || [], {}, { status: "pending" }));
      
      return customerData; // Return untuk digunakan di tempat lain
    } catch (error) {
      console.error("❌ [DASHBOARD] Failed to load data:", error);
      setDashboardError(error.message || "Gagal memuat data dashboard.");
      return null;
    } finally {
      setDashboardLoading(false);
    }
  }, [router]);

  // Helper function untuk cek apakah modal perlu ditampilkan
  const checkAndShowModal = useCallback((user) => {
    // Jika modal sudah pernah ditampilkan, jangan check lagi (biarkan user klik OK dulu)
    if (hasModalBeenShown && showVerificationModal) {
      console.log("🔒 [DASHBOARD] Modal already shown, waiting for user action");
      return;
    }

    if (!user) {
      console.log("⚠️ [DASHBOARD] No user data, showing verification modal immediately");
      // Tampilkan modal langsung tanpa delay
      setShowVerificationModal(true);
      setHasModalBeenShown(true);
      // Tampilkan notif
      toast.error("Akun Anda belum diverifikasi. Silakan verifikasi OTP terlebih dahulu.");
      return;
    }

    // ===== CEK VERIFIKASI OTP =====
    const verifikasiValue = user.verifikasi;
    const normalizedVerifikasi = verifikasiValue === "1" ? 1 : verifikasiValue === "0" ? 0 : verifikasiValue;
    const isVerified = normalizedVerifikasi === 1 || normalizedVerifikasi === true;

    console.log("🔍 [DASHBOARD] Checking user data:", {
      verifikasi: user.verifikasi,
      isVerified
    });

    // Jika sudah verifikasi (verifikasi = 1), dashboard normal tanpa modal
    if (isVerified) {
      console.log("✅ [DASHBOARD] User verified (verifikasi = 1), dashboard berhasil ditampilkan");
      setShowVerificationModal(false);
      setShowUpdateModal(false);
      setUpdateModalReason("password");
      setHasModalBeenShown(false);
      return;
    }

    // Jika belum verifikasi (verifikasi = 0), tampilkan modal OTP langsung (lock modal)
    // Dashboard tetap tampil, tapi di-lock dan muncul otpVerificationModal
    // Setelah OTP sent, akan muncul updateCustomer.js
    // Dashboard akan di-lock otomatis oleh useEffect ketika modal muncul
    if (!isVerified) {
      console.log("⚠️ [DASHBOARD] User not verified (verifikasi = 0), showing OTP modal immediately");
      setShowUpdateModal(false);
      // Tampilkan modal langsung tanpa delay
      setShowVerificationModal(true);
      setHasModalBeenShown(true);
      // Tampilkan notif
      toast.error("Akun Anda belum diverifikasi. Silakan verifikasi OTP terlebih dahulu.");
    }
  }, [hasModalBeenShown, showVerificationModal]);

  // Fetch customer profile langsung dari API untuk mendapatkan data lengkap
  const fetchCustomerProfile = useCallback(async (token) => {
    try {
      const response = await fetch("/api/customer/customer", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("📥 [DASHBOARD] Customer profile response:", result);

      if (response.ok && result?.success && result?.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error("❌ [DASHBOARD] Failed to fetch customer profile:", error);
      return null;
    }
  }, []);

  // Load dashboard data dan cek modal
  useEffect(() => {
    const session = getCustomerSession();
    
    if (!session.token) {
      router.replace("/customer/login");
      return;
    }

    // Load dashboard data dan customer profile, lalu cek modal dengan data terbaru
    const initDashboard = async () => {
      // Fetch dashboard data
      const dashboardCustomerData = await loadDashboardData();
      
      // Fetch customer profile langsung untuk mendapatkan data lengkap (termasuk nama_panggilan, profesi)
      const customerProfile = await fetchCustomerProfile(session.token);
      
      console.log("📊 [DASHBOARD] Dashboard customer data:", dashboardCustomerData);
      console.log("📊 [DASHBOARD] Customer profile data:", customerProfile);
      
      // Gabungkan data dari berbagai sumber
      // Prioritas: customerProfile > dashboardCustomerData > session.user
      const mergedCustomerData = {
        ...session.user,
        ...dashboardCustomerData,
        ...customerProfile,
        // Pastikan verifikasi dari source terbaru (prioritas utama untuk menentukan apakah modal muncul)
        verifikasi: customerProfile?.verifikasi || dashboardCustomerData?.verifikasi || session.user?.verifikasi,
      };
      
      console.log("📊 [DASHBOARD] Merged customer data:", mergedCustomerData);
      console.log("📊 [DASHBOARD] Key field for modal check:", {
        verifikasi: mergedCustomerData.verifikasi,
        isVerified: mergedCustomerData.verifikasi === "1" || mergedCustomerData.verifikasi === 1
      });
      
      // Update localStorage dengan data lengkap
      if (mergedCustomerData && (mergedCustomerData.id || mergedCustomerData.nama)) {
        localStorage.setItem("customer_user", JSON.stringify(mergedCustomerData));
        console.log("✅ [DASHBOARD] Customer data synced to localStorage");
      }
      
      // Cek verifikasi terlebih dahulu sebelum check modal
      const isUserVerified =
        mergedCustomerData?.verifikasi === "1" ||
        mergedCustomerData?.verifikasi === 1 ||
        mergedCustomerData?.verifikasi === true;
      
      // Jika sudah verifikasi, pastikan modal tidak muncul
      if (isUserVerified) {
        console.log("✅ [DASHBOARD] User verified, ensuring OTP modal is hidden");
        setShowVerificationModal(false);
        setHasModalBeenShown(false);
      } else {
        // Gunakan data yang sudah di-merge untuk cek modal (hanya jika modal belum pernah ditampilkan)
        if (!hasModalBeenShown) {
          checkAndShowModal(mergedCustomerData);
        }
      }

      // Check untuk pending update modal (setelah OTP verification)
      const pendingUpdateModal = localStorage.getItem("customer_show_update_modal");
      if (pendingUpdateModal === "1" && isUserVerified) {
        console.log("🟢 [DASHBOARD] Triggering UpdateCustomer modal after OTP verification");
        localStorage.removeItem("customer_show_update_modal");
        setUpdateModalReason("incomplete");
        setShowUpdateModal(true);
      }
    };

    initDashboard();
  }, [router, loadDashboardData, fetchCustomerProfile, checkAndShowModal, hasModalBeenShown]);

  // Handler untuk OTP sent callback
  const handleOTPSent = () => {
    console.log("📤 [DASHBOARD] OTP sent, redirecting user to OTP page");
    setShowVerificationModal(false);
    setHasModalBeenShown(false);
    router.replace("/customer/otp");
  };

  const handleUpdateSuccess = (data) => {
    console.log("✅ [DASHBOARD] Update success, data received:", data);

    const session = getCustomerSession();
    if (session.user) {
      const updatedUser = {
        ...session.user,
        ...data,
        nama_panggilan: data?.nama_panggilan || session.user.nama_panggilan,
        profesi: data?.profesi || session.user.profesi,
        instagram: data?.instagram || session.user.instagram,
        pendapatan_bln: data?.pendapatan_bln || session.user.pendapatan_bln,
        industri_pekerjaan: data?.industri_pekerjaan || session.user.industri_pekerjaan,
        jenis_kelamin: data?.jenis_kelamin || session.user.jenis_kelamin,
        verifikasi: data?.verifikasi !== undefined ? data.verifikasi : session.user.verifikasi,
        alamat: data?.alamat || session.user.alamat,
      };

      console.log("✅ [DASHBOARD] Updated user data:", updatedUser);
      localStorage.setItem("customer_user", JSON.stringify(updatedUser));
    }

    localStorage.removeItem("customer_show_update_modal");
    setShowUpdateModal(false);
    toast.success("Data berhasil diperbarui!");
    loadDashboardData();
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
      {/* Modal Update Data Customer */}
      {showUpdateModal && (
        <UpdateCustomerModal
          isOpen={showUpdateModal}
          onClose={() => {
            // Modal tidak bisa ditutup sebelum update
          }}
          onSuccess={handleUpdateSuccess}
          title={
            updateModalReason === "password"
              ? "Ubah Password & Lengkapi Data"
              : "Lengkapi Data Profil Anda"
          }
          requirePassword={updateModalReason === "password"}
        />
      )}

      {/* Modal Verifikasi OTP - Tampil HANYA jika verifikasi = 0 dan belum verifikasi */}
      {showVerificationModal && !showUpdateModal && (() => {
        const session = getCustomerSession();
        const customerData = customerInfo || session.user;
        
        // Double check: pastikan user benar-benar belum verifikasi
        if (customerData) {
          const verifikasiValue = customerData.verifikasi;
          const normalizedVerifikasi = verifikasiValue === "1" ? 1 : verifikasiValue === "0" ? 0 : verifikasiValue;
          const isVerified = normalizedVerifikasi === 1 || normalizedVerifikasi === true;
          
          // Jika sudah verifikasi, jangan tampilkan modal
          if (isVerified) {
            console.log("✅ [DASHBOARD] User already verified, hiding OTP modal");
            setShowVerificationModal(false);
            setHasModalBeenShown(false);
            return null;
          }
        }
        
        return customerData ? (
          <OTPVerificationModal
            customerInfo={customerData}
            onClose={() => {
              // Jangan tutup modal dengan klik di luar atau ESC
            }}
            onOTPSent={handleOTPSent}
            allowClose={false}
          />
        ) : null;
      })()}

      <div 
        className="customer-dashboard"
        style={{
          position: "relative",
          filter: isDashboardLocked ? "blur(5px)" : "none",
          pointerEvents: isDashboardLocked ? "none" : "auto",
          opacity: isDashboardLocked ? 0.6 : 1,
          transition: "all 0.3s ease",
        }}
      >
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
                    <button 
                      className="order-action"
                      onClick={() => {
                        const kategoriLower = order.kategoriNama?.toLowerCase() || "";
                        if (kategoriLower === "webinar" || kategoriLower === "seminar") {
                          // Arahkan ke halaman webinar internal
                          router.push(`/customer/webinar/${order.id}`);
                        } else if (kategoriLower === "e-book" || kategoriLower === "ebook") {
                          // Ebook: redirect ke halaman ebook
                          if (order.slug && order.slug !== "-") {
                            router.push(order.slug);
                          } else {
                            alert("Fitur Buka Ebook akan segera tersedia");
                          }
                        } else {
                          // Kategori lainnya: tampilkan detail order
                          router.push(`/customer/orders/${order.id}`);
                        }
                      }}
                    >
                      {order.actionLabel}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </CustomerLayout>
  );
}
