"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCustomerSession } from "@/lib/customerAuth";
import { fetchCustomerDashboard } from "@/lib/customerDashboard";
import CustomerLayout from "@/components/customer/CustomerLayout";
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
  const [zoomSDK, setZoomSDK] = useState(null);

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
      setError("");
      const session = getCustomerSession();

      // Fetch customer dashboard untuk mendapatkan list orders
      const dashboardData = await fetchCustomerDashboard(session.token);
      
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

      // Jika order ditemukan, cek apakah ada webinar data
      // Logika: Order ID → Produk ID → Webinar (1 link yang sama untuk semua yang beli produk yang sama)
      if (!foundOrder.webinar) {
        setError("Webinar tidak tersedia untuk order ini. Silakan hubungi support.");
        setErrorType("not_found");
        setLoading(false);
        setValidating(false);
        return;
      }

      // Jika validasi berhasil dan ada webinar, lanjut fetch webinar data
      // Gunakan produk_id dari order untuk mendapatkan webinar yang sama (many-to-many)
      await fetchWebinarData(foundOrder);
    } catch (err) {
      console.error("❌ [WEBINAR] Validation error:", err);
      setError("Gagal memvalidasi akses. Silakan coba lagi atau hubungi support.");
      setErrorType("server_error");
      setLoading(false);
      setValidating(false);
    }
  };

  const fetchWebinarData = async (orderData = null) => {
    try {
      setLoading(true);
      setValidating(false);
      setError("");
      const session = getCustomerSession();
      
      // Logika: Order ID → Produk ID → Webinar (1 link yang sama untuk semua yang beli produk yang sama)
      // Jika orderData sudah ada dari validasi, gunakan data tersebut
      let order = orderData;
      let kategoriNama = "webinar";
      
      if (!order) {
        // Fetch order data dari dashboard untuk mendapatkan produk_id dan webinar
        const dashboardData = await fetchCustomerDashboard(session.token);
        const allOrders = [
          ...(dashboardData.orders_aktif || []),
          ...(dashboardData.orders_pending || [])
        ];
        order = allOrders.find(o => Number(o.id) === Number(idOrder));
      }

      if (!order) {
        setError("Order tidak ditemukan.");
        setErrorType("not_found");
        setLoading(false);
        return;
      }

      // Ambil kategori dari produk (jika sudah di-fetch sebelumnya)
      // Atau gunakan kategori_nama dari order
      kategoriNama = order.kategori_nama || "webinar";

      // Cek apakah ada webinar data di order
      if (!order.webinar) {
        setError("Webinar tidak tersedia untuk produk ini.");
        setErrorType("not_found");
        setLoading(false);
        return;
      }

      // Fetch webinar data dari backend untuk mendapatkan signature dan data lengkap
      // Backend akan: Order ID → Produk ID → Webinar (many-to-many)
      const response = await fetch(`/api/webinar/join-order/${idOrder}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${session.token}`,
        },
      });

      // Handle response status
      if (response.status === 403) {
        setError("Akses ditolak. Anda tidak memiliki izin untuk mengakses webinar ini.");
        setErrorType("unauthorized");
        setLoading(false);
        return;
      }

      if (response.status === 404) {
        setError("Webinar tidak ditemukan. Pastikan order ID benar atau hubungi support.");
        setErrorType("not_found");
        setLoading(false);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("❌ [WEBINAR] Failed to parse JSON:", parseError);
        setError("Terjadi kesalahan saat memproses response dari server.");
        setErrorType("server_error");
        setLoading(false);
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = data?.message || "Gagal memuat data webinar";
        
        // Tentukan error type berdasarkan status code
        if (response.status === 401) {
          setError("Sesi Anda telah berakhir. Silakan login kembali.");
          setErrorType("unauthorized");
        } else if (response.status >= 500) {
          setError("Server sedang mengalami masalah. Silakan coba lagi nanti.");
          setErrorType("server_error");
        } else {
          setError(errorMessage);
          setErrorType("server_error");
        }
        
        setLoading(false);
        return;
      }

      // Jika backend return error 404 (route tidak ditemukan), gunakan data webinar dari order
      if (response.status === 404 && order.webinar) {
        console.warn("⚠️ [WEBINAR] Backend route not found, using webinar data from order");
        
        // Ambil customer info untuk userName dan userEmail
        const dashboardData = await fetchCustomerDashboard(session.token);
        const customer = dashboardData.customer || {};
        
        // Gunakan data webinar dari order (sudah ada di dashboard response)
        // Backend logic: Order ID → Produk ID → Webinar (1 link yang sama untuk semua yang beli produk yang sama)
        // Note: Signature akan di-generate oleh backend saat join, atau bisa pakai join_url langsung
        setWebinarData({
          meetingNumber: order.webinar.meeting_id,
          password: order.webinar.password,
          join_url: order.webinar.join_url, // Bisa pakai join_url langsung jika signature tidak diperlukan
          start_time: order.webinar.start_time,
          start_time_formatted: order.webinar.start_time_formatted,
          duration: order.webinar.duration,
          userName: customer.nama || customer.nama_panggilan || "Customer",
          userEmail: customer.email || "",
          produkNama: order.produk_nama || "",
          orderId: Number(idOrder),
          kategoriNama: kategoriNama,
          webinar: order.webinar,
          // Signature dan SDK key akan di-generate oleh backend saat join
          // Untuk sementara, kita bisa pakai join_url langsung atau generate signature di frontend
          signature: null, // Akan di-generate saat join jika diperlukan
          sdkKey: null // Akan diambil dari backend jika diperlukan
        });
        setLoading(false);
        return;
      }

      // Jika backend berhasil, gunakan data dari backend
      // Simpan data webinar termasuk kategori dari produk
      setWebinarData({
        ...data.data,
        kategoriNama: kategoriNama
      });
    } catch (err) {
      console.error("❌ [WEBINAR] Error fetching webinar data:", err);
      
      // Handle network errors
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
        setErrorType("network_error");
      } else {
        setError(err.message || "Gagal memuat data webinar. Silakan coba lagi.");
        setErrorType("server_error");
      }
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!webinarData) return;

    try {
      // Jika ada join_url langsung dan tidak ada signature, gunakan join_url (redirect ke Zoom web)
      if (webinarData.join_url && !webinarData.signature) {
        console.log("🔗 [WEBINAR] Using join_url directly:", webinarData.join_url);
        window.open(webinarData.join_url, '_blank');
        return;
      }

      // Jika ada signature dan sdkKey, gunakan Zoom SDK
      if (webinarData.signature && webinarData.sdkKey) {
        // Load Zoom SDK
        await loadZoomSDK();
        
        // Initialize Zoom Meeting
        const { ZoomMtg } = window.ZoomMtg || {};
        
        if (!ZoomMtg) {
          throw new Error("Zoom SDK tidak dapat dimuat");
        }

        // Set Zoom JS Library
        ZoomMtg.setZoomJSLib("https://source.zoom.us/2.18.0/lib", "/av");
        
        // Pre-load WebAssembly
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();
        
        // Required dependencies
        ZoomMtg.downloadZoomMtg();

        // Initialize
        ZoomMtg.init({
          leaveOnPageUnload: true,
          patchJsMedia: true,
          success: () => {
            console.log("✅ Zoom SDK initialized");
            
            // Join meeting
            ZoomMtg.join({
              sdkKey: webinarData.sdkKey,
              signature: webinarData.signature,
              meetingNumber: webinarData.meetingNumber,
              passWord: webinarData.password,
              userName: webinarData.userName,
              userEmail: webinarData.userEmail,
              success: (success) => {
                console.log("✅ Zoom join success:", success);
                setShowZoom(true);
              },
              error: (error) => {
                console.error("❌ Zoom join error:", error);
                // Fallback: gunakan join_url jika SDK gagal
                if (webinarData.join_url) {
                  console.log("⚠️ [WEBINAR] SDK failed, using join_url as fallback");
                  window.open(webinarData.join_url, '_blank');
                } else {
                  alert("Gagal bergabung ke meeting. Silakan coba lagi.");
                }
              },
            });
          },
          error: (error) => {
            console.error("❌ Zoom SDK init error:", error);
            // Fallback: gunakan join_url jika SDK init gagal
            if (webinarData.join_url) {
              console.log("⚠️ [WEBINAR] SDK init failed, using join_url as fallback");
              window.open(webinarData.join_url, '_blank');
            } else {
              alert("Gagal menginisialisasi Zoom SDK. Silakan coba lagi.");
            }
          },
        });
      } else {
        // Jika tidak ada signature dan sdkKey, gunakan join_url
        if (webinarData.join_url) {
          window.open(webinarData.join_url, '_blank');
        } else {
          alert("Data webinar tidak lengkap. Silakan hubungi support.");
        }
      }
    } catch (err) {
      console.error("❌ [WEBINAR] Error joining meeting:", err);
      // Fallback: gunakan join_url jika ada
      if (webinarData?.join_url) {
        console.log("⚠️ [WEBINAR] Error occurred, using join_url as fallback");
        window.open(webinarData.join_url, '_blank');
      } else {
        alert(err.message || "Gagal bergabung ke meeting");
      }
    }
  };

  const loadZoomSDK = () => {
    return new Promise((resolve, reject) => {
      if (window.ZoomMtg) {
        resolve();
        return;
      }

      // Load dependencies in sequence
      const scripts = [
        "https://source.zoom.us/2.18.0/lib/vendor/react.min.js",
        "https://source.zoom.us/2.18.0/lib/vendor/react-dom.min.js",
        "https://source.zoom.us/2.18.0/lib/vendor/redux.min.js",
        "https://source.zoom.us/2.18.0/lib/vendor/redux-thunk.min.js",
        "https://source.zoom.us/2.18.0/lib/vendor/lodash.min.js",
        "https://source.zoom.us/zoom-meeting-2.18.0.min.js",
      ];

      let loaded = 0;
      const loadScript = (index) => {
        if (index >= scripts.length) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = scripts[index];
        script.onload = () => {
          loaded++;
          if (loaded === scripts.length) {
            resolve();
          } else {
            loadScript(index + 1);
          }
        };
        script.onerror = () => {
          reject(new Error(`Failed to load script: ${scripts[index]}`));
        };
        document.body.appendChild(script);
      };

      loadScript(0);
    });
  };

  if (loading || validating) {
    return (
      <CustomerLayout>
        <div className="webinar-gateway-container">
          <div className="webinar-loading">
            <div className="loading-spinner"></div>
            <p>
              {validating ? "Memvalidasi akses..." : "Memuat data webinar..."}
            </p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
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
      </CustomerLayout>
    );
  }

  if (showZoom && webinarData) {
    return (
      <CustomerLayout>
        <div className="webinar-gateway-container">
          <div id="zmmtg-root" style={{ width: "100%", height: "100vh" }}></div>
        </div>
      </CustomerLayout>
    );
  }

  if (!webinarData) {
    return (
      <CustomerLayout>
        <div className="webinar-gateway-container">
          <div className="webinar-error">
            <h2>Data Webinar Tidak Ditemukan</h2>
            <button onClick={() => router.push("/customer/dashboard")}>
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="webinar-gateway-container">
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
      </div>
    </CustomerLayout>
  );
}

