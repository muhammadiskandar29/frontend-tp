"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { getCustomerSession } from "@/lib/customerAuth";
import { fetchCustomerDashboard } from "@/lib/customerDashboard";
import "@/styles/customer/cstdashboard.css";

export default function PaymentPage() {
  const router = useRouter();
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);
  const [error, setError] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);

  const formatCurrency = (value) => {
    if (!value) return "Rp 0";
    const numberValue = Number(String(value).replace(/\D/g, ""));
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numberValue || 0);
  };

  const formatOrderId = (orderId) => {
    if (!orderId) return "-";
    return `#${String(orderId).padStart(6, "0")}`;
  };

  const loadUnpaidOrders = useCallback(async () => {
    const session = getCustomerSession();

    if (!session.token) {
      router.replace("/customer");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchCustomerDashboard(session.token);

      // Simpan customer info untuk digunakan saat pembayaran
      if (data?.customer) {
        setCustomerInfo(data.customer);
      }

      // Kumpulkan semua order dari berbagai sumber
      const allOrders = [
        ...(data?.orders_aktif || []),
        ...(data?.orders_pending || []),
        ...(data?.order_proses || []),
        ...(data?.orders_proses || []),
      ];

      // Filter untuk menghindari duplikat berdasarkan ID
      const uniqueOrders = allOrders.filter((order, index, self) =>
        index === self.findIndex((o) => o.id === order.id)
      );

      // Filter order yang status_pembayaran belum 2 (belum terbayar)
      const unpaidOrdersList = uniqueOrders.filter((order) => {
        const statusPembayaran = order.status_pembayaran || order.status_pembayaran_id;
        return statusPembayaran !== 2 && statusPembayaran !== "2";
      });

      // Ambil data order dari localStorage (dari verify-order) untuk melengkapi data
      const storedOrderData = localStorage.getItem("customer_order_data");
      let localStorageOrderData = null;
      if (storedOrderData) {
        try {
          localStorageOrderData = JSON.parse(storedOrderData);
          console.log("[PAYMENT] Order data from localStorage:", localStorageOrderData);
        } catch (e) {
          console.error("[PAYMENT] Error parsing stored order data:", e);
        }
      }

      // Format orders untuk ditampilkan
      const formattedOrders = unpaidOrdersList.map((order) => {
        // Cek apakah order ini sesuai dengan order dari localStorage (berdasarkan orderId)
        const isMatchingOrder = localStorageOrderData &&
          (localStorageOrderData.orderId === order.id ||
            localStorageOrderData.orderId === String(order.id));

        // Gabungkan data dari API dengan data dari localStorage
        // Prioritaskan data dari localStorage untuk metode pembayaran dan order ID
        return {
          id: order.id,
          orderId: isMatchingOrder ? localStorageOrderData.orderId : order.id,
          productName: order.produk_nama || localStorageOrderData?.productName || "Produk Tanpa Nama",
          totalHarga: order.total_harga || order.total_harga_formatted || localStorageOrderData?.totalHarga || "0",
          status: "Menunggu Pembayaran",
          // Prioritaskan metode pembayaran dari localStorage jika ada
          paymentMethod: isMatchingOrder
            ? (localStorageOrderData.paymentMethod || order.metode_bayar || "manual")
            : (order.metode_bayar || "manual"),
          tanggalOrder: order.tanggal_order || "-",
          statusPembayaran: order.status_pembayaran || order.status_pembayaran_id,
          // Simpan data lengkap untuk Midtrans
          nama: order.nama || localStorageOrderData?.nama || data?.customer?.nama || data?.customer?.nama_lengkap || session?.user?.nama || "",
          email: order.email || localStorageOrderData?.email || data?.customer?.email || session?.user?.email || "",
          downPayment: localStorageOrderData?.downPayment || order.down_payment || "",
          rawOrder: order, // Simpan order lengkap untuk kebutuhan lainnya
        };
      });

      setUnpaidOrders(formattedOrders);
      setHasHistory(uniqueOrders.length > 0);

      // Hapus data dari localStorage jika semua order sudah terbayar
      // atau jika order dari localStorage sudah tidak ada di unpaid orders
      if (localStorageOrderData && unpaidOrdersList.length > 0) {
        const orderStillUnpaid = unpaidOrdersList.some(order =>
          order.id === localStorageOrderData.orderId ||
          String(order.id) === String(localStorageOrderData.orderId)
        );

        if (!orderStillUnpaid) {
          // Order sudah terbayar, hapus data dari localStorage
          console.log("[PAYMENT] Order sudah terbayar, removing from localStorage");
          localStorage.removeItem("customer_order_data");
          localStorage.removeItem("pending_order");
        }
      } else if (unpaidOrdersList.length === 0 && localStorageOrderData) {
        // Tidak ada unpaid orders, hapus data
        console.log("[PAYMENT] No unpaid orders, removing from localStorage");
        localStorage.removeItem("customer_order_data");
        localStorage.removeItem("pending_order");
      }
    } catch (error) {
      console.error("[PAYMENT] Failed to load unpaid orders:", error);
      setError(error.message || "Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUnpaidOrders();
  }, [loadUnpaidOrders]);

  const handleContinuePayment = async (order) => {
    // Ambil data dari localStorage sebagai prioritas jika ada matching orderId
    const storedOrderData = localStorage.getItem("customer_order_data");
    let localPaymentMethod = null;

    if (storedOrderData) {
      try {
        const parsed = JSON.parse(storedOrderData);
        if (String(parsed.orderId) === String(order.id)) {
          localPaymentMethod = parsed.paymentMethod;
        }
      } catch (e) {
        console.error("Error parsing stored order data", e);
      }
    }

    const { productName, totalHarga, nama, email, orderId } = order;
    // Gunakan paymentMethod dari order atau fallback ke localPaymentMethod
    const rawPaymentMethod = order.paymentMethod || localPaymentMethod || order.metode_bayar || "manual";
    const paymentMethod = String(rawPaymentMethod).toLowerCase();

    // Jika metode pembayaran adalah E-Payment (ewallet, cc, va), panggil Midtrans
    if (paymentMethod === "ewallet" || paymentMethod === "cc" || paymentMethod === "va" || paymentMethod === "midtrans") {
      // Ambil data customer dari session sebagai fallback
      const session = getCustomerSession();
      const finalNama = nama || customerInfo?.nama || customerInfo?.nama_lengkap || session?.user?.nama || "";
      const finalEmail = email || customerInfo?.email || session?.user?.email || "";

      // Validasi data yang diperlukan
      if (!finalNama || !finalEmail) {
        toast.error("Data customer tidak lengkap. Silakan lengkapi profil Anda terlebih dahulu.");
        return;
      }

      // Parse total harga (bisa berupa string dengan format currency atau number)
      let amount = 0;
      if (typeof totalHarga === "string") {
        // Hapus semua karakter non-digit
        const numericValue = totalHarga.replace(/\D/g, "");
        amount = parseInt(numericValue, 10) || 0;
      } else {
        amount = parseInt(totalHarga, 10) || 0;
      }

      if (amount <= 0) {
        toast.error("Jumlah pembayaran tidak valid.");
        return;
      }

      try {
        setLoading(true);

        // Tentukan endpoint berdasarkan metode pembayaran
        let endpoint = "";
        if (paymentMethod === "ewallet") {
          endpoint = "/api/midtrans/create-snap-ewallet";
        } else if (paymentMethod === "cc") {
          endpoint = "/api/midtrans/create-snap-cc";
        } else if (paymentMethod === "va") {
          endpoint = "/api/midtrans/create-snap-va";
        }

        console.log("[PAYMENT] Calling Midtrans API:", {
          endpoint,
          name: finalNama,
          email: finalEmail,
          amount,
          product_name: productName,
          order_id: orderId,
        });

        // Panggil API Midtrans
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: finalNama,
            email: finalEmail,
            amount: amount,
            product_name: productName,
            order_id: orderId,
          }),
        });

        const data = await response.json();
        console.log("[PAYMENT] Midtrans response:", data);

        // Sesuai dokumentasi: response harus memiliki success: true dan redirect_url
        if (data.success === true && data.redirect_url) {
          // Simpan order ID ke sessionStorage untuk tracking setelah kembali dari Midtrans
          if (orderId) {
            sessionStorage.setItem("midtrans_order_id", String(orderId));
          }

          // Simpan snap_token dan order_id dari Midtrans jika ada
          if (data.snap_token) {
            sessionStorage.setItem("midtrans_snap_token", data.snap_token);
          }
          if (data.order_id) {
            sessionStorage.setItem("midtrans_order_id_midtrans", data.order_id);
          }

          // Buka Midtrans gateway di tab baru sesuai dokumentasi
          console.log("[PAYMENT] Opening Midtrans in new tab:", data.redirect_url);
          window.open(data.redirect_url, "_blank");

          // Tampilkan toast info
          toast.success("Halaman pembayaran Midtrans dibuka di tab baru");
        } else {
          // Jika tidak ada redirect_url atau success false, tampilkan error
          console.error("[PAYMENT] Midtrans tidak mengembalikan redirect_url atau success false:", data);
          toast.error(data.message || "Gagal membuat transaksi pembayaran");

          // Fallback: redirect ke payment page manual
          const query = new URLSearchParams({
            product: productName || "",
            harga: totalHarga || "0",
            via: "manual",
            sumber: "dashboard",
          });
          router.push(`/payment?${query.toString()}`);
        }
      } catch (error) {
        console.error("[PAYMENT] Error calling Midtrans:", error);
        toast.error("Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.");

        // Fallback: redirect ke payment page manual
        const query = new URLSearchParams({
          product: productName || "",
          harga: totalHarga || "0",
          via: "manual",
          sumber: "dashboard",
        });
        router.push(`/payment?${query.toString()}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Manual transfer
      const query = new URLSearchParams({
        product: productName || "",
        harga: totalHarga || "0",
        via: "manual",
        sumber: "dashboard",
      });
      router.push(`/payment?${query.toString()}`);
    }
  };

  return (
    <CustomerLayout>
      <div className="customer-dashboard">
        <div className="payment-page-header">
          <h1>Pembayaran</h1>
          <p>Lengkapi pembayaran untuk order yang belum dibayar</p>
        </div>

        {loading && (
          <div className="payment-loading">
            <div className="loading-spinner"></div>
            <p>Memuat data pembayaran...</p>
          </div>
        )}

        {error && (
          <div className="payment-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && unpaidOrders.length === 0 && (
          <div className="payment-empty">
            <div className="payment-empty__icon" style={{
              color: hasHistory ? '#16a34a' : '#6b7280',
              backgroundColor: hasHistory ? '#dcfce7' : '#f3f4f6'
            }}>
              {hasHistory ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              )}
            </div>
            <h2>{hasHistory ? "Semua pembayaran sudah selesai" : "Belum Ada Transaksi"}</h2>
            <p>{hasHistory ? "Tidak ada order yang menunggu pembayaran saat ini." : "Anda belum melakukan transaksi apapun."}</p>
            {!hasHistory && (
              <button
                onClick={() => router.push('/')}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.95rem'
                }}
              >
                Lihat Katalog Produk
              </button>
            )}
          </div>
        )}

        {!loading && !error && unpaidOrders.length > 0 && (
          <div className="payment-orders-list">
            {unpaidOrders.map((order) => (
              <div key={order.id} className="payment-order-card">
                <div className="payment-order-card__header">
                  <div className="payment-order-card__info">
                    <h3>{order.productName}</h3>
                    <p className="payment-order-card__order-id">
                      {formatOrderId(order.orderId)}
                    </p>
                  </div>
                  <span className="payment-order-card__status">
                    {order.status}
                  </span>
                </div>

                <div className="payment-order-card__body">
                  <div className="payment-order-card__detail">
                    <span className="payment-order-card__label">Total Harga</span>
                    <span className="payment-order-card__value">
                      {formatCurrency(order.totalHarga)}
                    </span>
                  </div>
                  <div className="payment-order-card__detail">
                    <span className="payment-order-card__label">Tanggal Order</span>
                    <span className="payment-order-card__value">
                      {order.tanggalOrder}
                    </span>
                  </div>
                </div>

                <div className="payment-order-card__footer">
                  <button
                    className="payment-order-card__button"
                    onClick={() => handleContinuePayment(order)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner" style={{
                          width: '16px',
                          height: '16px',
                          marginRight: '8px',
                          display: 'inline-block'
                        }}></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                          <path d="M4.16667 10H15.8333M15.8333 10L11.6667 5.83333M15.8333 10L11.6667 14.1667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Lanjutkan Pembayaran
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </CustomerLayout>
  );
}

