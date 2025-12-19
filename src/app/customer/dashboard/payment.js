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

      <style jsx>{`
        .payment-page-header {
          margin-bottom: 2rem;
        }

        .payment-page-header h1 {
          font-size: 1.5rem;
          color: #1f1b16;
          margin: 0 0 0.5rem;
          font-weight: 600;
        }

        .payment-page-header p {
          color: #8c7a65;
          margin: 0;
          font-size: 0.95rem;
        }

        .payment-loading,
        .payment-error {
          text-align: center;
          padding: 2rem;
          color: #8c7a65;
        }

        .payment-error {
          color: #dc2626;
          background: #fff1f0;
          border: 1px solid #ffa39e;
          border-radius: var(--radius);
          padding: 1rem;
        }

        .payment-empty {
          text-align: center;
          padding: 4rem 2rem;
          background: #fff;
          border-radius: var(--radius);
          border: 1px solid rgba(255, 166, 76, 0.15);
        }

        .payment-empty__icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #f0fdf4;
          color: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 600;
          margin: 0 auto 1.5rem;
        }

        .payment-empty h2 {
          font-size: 1.25rem;
          color: #1f1b16;
          margin: 0 0 0.5rem;
          font-weight: 600;
        }

        .payment-empty p {
          color: #8c7a65;
          margin: 0;
          font-size: 0.95rem;
        }

        .payment-orders-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .payment-order-card {
          background: #fff;
          border-radius: var(--radius);
          border: 1px solid rgba(255, 166, 76, 0.15);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .payment-order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .payment-order-card__header {
          padding: 1.25rem;
          border-bottom: 1px solid rgba(255, 166, 76, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .payment-order-card__info h3 {
          margin: 0 0 0.5rem;
          font-size: 1rem;
          color: #1f1b16;
          font-weight: 600;
          line-height: 1.4;
        }

        .payment-order-card__order-id {
          font-size: 0.85rem;
          color: #8c7a65;
          margin: 0;
        }

        .payment-order-card__status {
          background: #fff1f0;
          color: #dc2626;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .payment-order-card__body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .payment-order-card__detail {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .payment-order-card__label {
          font-size: 0.9rem;
          color: #8c7a65;
        }

        .payment-order-card__value {
          font-size: 0.95rem;
          color: #1f1b16;
          font-weight: 600;
        }

        .payment-order-card__footer {
          padding: 0 1.25rem 1.25rem;
          margin-top: auto;
        }

        .payment-order-card__button {
          width: 100%;
          background: var(--primary);
          border: none;
          color: #fff;
          font-weight: 600;
          padding: 0.85rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 0.95rem;
        }

        .payment-order-card__button:hover {
          opacity: 0.92;
        }

        @media (max-width: 768px) {
          .payment-orders-list {
            grid-template-columns: 1fr;
          }

          .payment-order-card__header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </CustomerLayout>
  );
}

