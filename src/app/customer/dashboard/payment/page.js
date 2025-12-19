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
  const [error, setError] = useState("");

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
      
      // Filter hanya orders_pending (unpaid orders)
      const pendingOrders = data?.orders_pending || [];
      
      // Format orders untuk ditampilkan
      const formattedOrders = pendingOrders.map((order) => ({
        id: order.id,
        orderId: order.id,
        productName: order.produk_nama || "Produk Tanpa Nama",
        totalHarga: order.total_harga || order.total_harga_formatted || "0",
        status: "Menunggu Pembayaran",
        paymentMethod: order.metode_bayar || "manual",
        tanggalOrder: order.tanggal_order || "-",
      }));

      setUnpaidOrders(formattedOrders);
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

  const handleContinuePayment = (order) => {
    // Redirect ke flow checkout/payment gateway sesuai metode pembayaran
    const { paymentMethod, productName, totalHarga } = order;
    
    if (paymentMethod === "ewallet" || paymentMethod === "cc" || paymentMethod === "va") {
      // Untuk Midtrans, perlu hit API dulu untuk mendapatkan redirect_url
      // Untuk sementara, redirect ke payment page dengan query params
      const query = new URLSearchParams({
        product: productName || "",
        harga: totalHarga || "0",
        via: paymentMethod,
        sumber: "dashboard",
      });
      router.push(`/payment?${query.toString()}`);
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
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && unpaidOrders.length === 0 && (
          <div className="payment-empty">
            <div className="payment-empty__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Semua pembayaran sudah selesai</h2>
            <p>Tidak ada order yang menunggu pembayaran saat ini.</p>
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
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                      <path d="M4.16667 10H15.8333M15.8333 10L11.6667 5.83333M15.8333 10L11.6667 14.1667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Lanjutkan Pembayaran
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

