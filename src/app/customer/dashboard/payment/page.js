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
            <p>Memuat data pembayaran...</p>
          </div>
        )}

        {error && (
          <div className="payment-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && unpaidOrders.length === 0 && (
          <div className="payment-empty">
            <div className="payment-empty__icon">✓</div>
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

