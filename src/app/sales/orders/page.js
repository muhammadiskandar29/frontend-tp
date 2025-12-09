"use client";

import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import { ShoppingCart, Clock, CheckCircle, PartyPopper, XCircle } from "lucide-react";
import "@/styles/dashboard.css";
import "@/styles/admin.css";
import { getOrders, updateOrderAdmin, getOrderStatistics } from "@/lib/sales/orders";

// Lazy load modals
const ViewOrders = dynamic(() => import("./viewOrders"), { ssr: false });
const UpdateOrders = dynamic(() => import("./updateOrders"), { ssr: false });
const AddOrders = dynamic(() => import("./addOrders"), { ssr: false });

// Use Next.js proxy to avoid CORS
const BASE_URL = "/api";

const STATUS_MAP = {
  0: "Unpaid",
  1: "Paid",
  2: "Sukses",
  3: "Gagal",
};

const ORDERS_COLUMNS = [
  "#",
  "Customer",
  "Produk",
  "Total Harga",
  "Status Pesanan",
  "Tanggal",
  "Sumber",
  "Waktu Pembayaran",
  "Metode Bayar",
  "Bukti Bayar",
  "Actions",
];


const DEFAULT_TOAST = { show: false, message: "", type: "success" };

export default function DaftarPesanan() {
  // Pagination state sesuai requirement
  const [orders, setOrders] = useState([]); // Array semua data yang digabung
  const [page, setPage] = useState(1); // Halaman sekarang
  const [lastPage, setLastPage] = useState(null); // Dari API pagination.last_page
  const [loading, setLoading] = useState(false); // Loading state
  
  // State lainnya
  const [statistics, setStatistics] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [toast, setToast] = useState(DEFAULT_TOAST);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: "", type });
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // 🔹 Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const stats = await getOrderStatistics();
      if (stats) {
        setStatistics(stats);
      }
    } catch (err) {
      console.error("Error loading statistics:", err);
    }
  }, []);

  // 🔹 Fetch orders - replace data per page (bukan append)
  const fetchOrders = useCallback(async (pageNumber) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/sales/order?page=${pageNumber}&per_page=15`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      
      // Handle response dengan struktur: { success: true, data: [...], pagination: { current_page, last_page, per_page, total } }
      if (json.success && json.data && Array.isArray(json.data)) {
        // Replace data (bukan append) - setiap page menampilkan data yang berbeda
        setOrders(json.data);

        // Update pagination info dari pagination object
        if (json.pagination && json.pagination.last_page !== undefined) {
          setLastPage(json.pagination.last_page);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      showToast("Gagal memuat data", "error");
      setLoading(false);
    }
  }, [showToast]);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Initial load: fetch page 1
  useEffect(() => {
    setPage(1);
  }, []);

  // Fetch data saat page berubah
  useEffect(() => {
    if (page > 0) {
      fetchOrders(page);
    }
  }, [page, fetchOrders]);

  // 🔹 Refresh all data (reset to page 1)
  const requestRefresh = async (message, type = "success") => {
    setPage(1);
    await Promise.all([loadStatistics(), fetchOrders(1)]);
    if (message) showToast(message, type);
  };

  // 🔹 Handle page change - Next/Previous
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= lastPage && newPage !== page && !loading) {
      setPage(newPage);
    }
  };

  // 🔹 Next page
  const handleNextPage = () => {
    if (page < lastPage && !loading) {
      handlePageChange(page + 1);
    }
  };

  // 🔹 Previous page
  const handlePrevPage = () => {
    if (page > 1 && !loading) {
      handlePageChange(page - 1);
    }
  };

  // === Helper ===
  function computeStatusBayar(o) {
    if (
      o.bukti_pembayaran &&
      o.bukti_pembayaran !== "" &&
      o.waktu_pembayaran &&
      o.waktu_pembayaran !== ""
    ) {
      return 1; // Paid
    }
    return 0; // Unpaid
  }

  // === SUMMARY ===
  // Gunakan data dari statistics API
  const totalOrders = statistics?.total_order || 0;
  const unpaidOrders = statistics?.total_order_unpaid || 0;
  const menungguOrders = statistics?.total_order_menunggu || 0;
  const approvedOrders = statistics?.total_order_sudah_diapprove || 0;
  const ditolakOrders = statistics?.total_order_ditolak || 0;



  // === EVENT HANDLERS ===
  const handleView = (order) => {
    setSelectedOrder(order);
    setShowView(true);
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setShowEdit(true);
  };

  const handleSuccessEdit = async (updatedFromForm) => {
    try {
      if (!selectedOrder?.id) {
        showToast("Order ID tidak valid", "error");
        return;
      }
  
      // Update ke server
      const result = await updateOrderAdmin(selectedOrder.id, updatedFromForm);
  
      if (result.success) {
        const updatedFromAPI = result.data?.order || result.data;
  
        // Tutup modal
        setShowEdit(false);
  
        // Update state orders agar UI langsung berubah
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id
              ? {
                  ...o,
                  ...updatedFromAPI,
  
                  // pertahankan relasi supaya view tidak error
                  customer_rel: updatedFromAPI.customer_rel || o.customer_rel,
                  produk_rel: updatedFromAPI.produk_rel || o.produk_rel,
                }
              : o
          )
        );
  
        // Reset selected
        setSelectedOrder(null);
  
        showToast(result.message || "Order berhasil diupdate!", "success");

        // Refresh statistics
        await loadStatistics();
      } else {
        showToast(result.message || "Gagal mengupdate order", "error");
      }
    } catch (err) {
      console.error("Error updating order:", err);
      showToast("Terjadi kesalahan saat mengupdate order", "error");
    }
  };
  

  const closeAllModals = () => {
    setShowAdd(false);
    setShowEdit(false);
    setShowDelete(false);
    setShowView(false);
    setSelectedOrder(null);
  };

  return (
    <Layout title="Orders | One Dashboard">
      <div className="dashboard-shell orders-shell">
        <section className="dashboard-hero orders-hero">
          <div className="dashboard-hero__copy">
            <p className="dashboard-hero__eyebrow">Orders</p>
            <h2 className="dashboard-hero__title">Order Management</h2>
            <span className="dashboard-hero__meta">
              Track and manage all customer orders and payments.
            </span>
          </div>

          <div className="orders-toolbar">
            <button className="orders-button orders-button--primary" onClick={() => setShowAdd(true)}>
              + Tambah Pesanan
            </button>
          </div>
        </section>

        <section className="dashboard-summary orders-summary">
          {[
            {
              label: "Total orders",
              value: totalOrders,
              accent: "accent-indigo",
              icon: <ShoppingCart size={22} />,
            },
            {
              label: "Unpaid",
              value: unpaidOrders,
              accent: "accent-amber",
              icon: <Clock size={22} />,
            },
            {
              label: "Menunggu",
              value: menungguOrders,
              accent: "accent-blue",
              icon: <Clock size={22} />,
            },
            {
              label: "Sudah Approve",
              value: approvedOrders,
              accent: "accent-emerald",
              icon: <CheckCircle size={22} />,
            },
            {
              label: "Ditolak",
              value: ditolakOrders,
              accent: "accent-red",
              icon: <XCircle size={22} />,
            },
          ].map((card) => (
            <article className="summary-card" key={card.label}>
              <div className={`summary-card__icon ${card.accent}`}>{card.icon}</div>
              <div>
                <p className="summary-card__label">{card.label}</p>
                <p className="summary-card__value">{card.value}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="panel orders-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Directory</p>
              <h3 className="panel__title">Order roster</h3>
            </div>
            <span className="panel__meta">{orders.length} orders</span>
          </div>

          <div className="orders-table__wrapper">
            <div className="orders-table">
              <div className="orders-table__head">
                {ORDERS_COLUMNS.map((column) => (
                  <span key={column}>{column}</span>
                ))}
              </div>
              <div className="orders-table__body">
                {orders.length > 0 ? (
                  orders.map((order, i) => {
                    // Handle produk name - dari produk_rel
                    const produkNama = order.produk_rel?.nama || "-";

                    // Handle customer name - dari customer_rel
                    const customerNama = order.customer_rel?.nama || "-";

                    const statusBayar = computeStatusBayar(order);
                    const statusLabel = STATUS_MAP[statusBayar] || "Unpaid";

                    return (
                      <div className="orders-table__row" key={order.id || `${order.id}-${i}`}>
                        <div className="orders-table__cell" data-label="#">
                          {(page - 1) * 15 + i + 1}
                        </div>
                        <div className="orders-table__cell orders-table__cell--strong" data-label="Customer">
                          {customerNama}
                        </div>
                        <div className="orders-table__cell" data-label="Produk">
                          {produkNama}
                        </div>
                        <div className="orders-table__cell" data-label="Total Harga">
                          Rp {Number(order.total_harga || 0).toLocaleString()}
                        </div>
                        <div className="orders-table__cell" data-label="Status Pesanan">
                          <span className={`orders-status-badge orders-status-badge--${statusLabel.toLowerCase()}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="orders-table__cell" data-label="Tanggal">
                          {order.tanggal || "-"}
                        </div>
                        <div className="orders-table__cell" data-label="Sumber">
                          {order.sumber ? `#${order.sumber}` : "-"}
                        </div>
                        <div className="orders-table__cell" data-label="Waktu Pembayaran">
                          {order.waktu_pembayaran || "-"}
                        </div>
                        <div className="orders-table__cell" data-label="Metode Bayar">
                          {order.metode_bayar || "-"}
                        </div>
                        <div className="orders-table__cell" data-label="Bukti Bayar">
                          {order.bukti_pembayaran ? (
                            <a
                              href={`${BASE_URL.replace("/api", "")}/storage/${order.bukti_pembayaran}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="orders-link"
                            >
                              Lihat Bukti
                            </a>
                          ) : (
                            "-"
                          )}
                        </div>
                        <div className="orders-table__cell orders-table__cell--actions" data-label="Actions">
                          <button
                            className="orders-action-btn"
                            title="View"
                            onClick={() => handleView(order)}
                          >
                            <i className="pi pi-eye" />
                          </button>
                          <button
                            className="orders-action-btn orders-action-btn--ghost"
                            title="Edit"
                            onClick={() => handleEdit(order)}
                          >
                            <i className="pi pi-pencil" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="orders-empty">
                    {orders.length ? "Tidak ada hasil pencarian." : "Loading data..."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pagination dengan Next/Previous Button */}
          {lastPage !== null && lastPage > 1 && (
            <div className="orders-pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", padding: "1.5rem", flexWrap: "wrap" }}>
              {/* Previous Button */}
              <button
                className="orders-pagination__btn"
                onClick={handlePrevPage}
                disabled={page === 1 || loading}
                aria-label="Previous page"
                style={{
                  padding: "0.75rem 1rem",
                  minWidth: "100px",
                  background: page === 1 || loading ? "#e5e7eb" : "#f1a124",
                  color: page === 1 || loading ? "#9ca3af" : "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: page === 1 || loading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
              >
                <i className="pi pi-chevron-left" />
                Previous
              </button>

              {/* Page Info */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem",
                fontSize: "0.95rem",
                color: "var(--dash-text)",
                fontWeight: 500
              }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <i className="pi pi-spin pi-spinner" />
                    Loading...
                  </span>
                ) : (
                  <span>
                    Page {page} of {lastPage}
                  </span>
                )}
              </div>

              {/* Next Button */}
              <button
                className="orders-pagination__btn"
                onClick={handleNextPage}
                disabled={page >= lastPage || loading}
                aria-label="Next page"
                style={{
                  padding: "0.75rem 1rem",
                  minWidth: "100px",
                  background: page >= lastPage || loading ? "#e5e7eb" : "#f1a124",
                  color: page >= lastPage || loading ? "#9ca3af" : "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: page >= lastPage || loading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
              >
                Next
                <i className="pi pi-chevron-right" />
              </button>
            </div>
          )}
        </section>

        {/* TOAST */}
        {toast.show && (
          <div
            className={`toast ${toast.type === "error" ? "toast-error" : ""} ${
              toast.type === "warning" ? "toast-warning" : ""
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>

      {/* MODALS - Render di luar main content untuk memastikan z-index bekerja */}
      {showAdd && (
        <AddOrders
          onClose={() => setShowAdd(false)}
          onAdd={async () => {
            setShowAdd(false);
            // Refresh data and show success message
            await requestRefresh("Pesanan baru berhasil ditambahkan!");
          }}
          showToast={showToast}
        />
      )}

      {showView && selectedOrder && (
        <ViewOrders
          order={{
            ...selectedOrder,
            customer: selectedOrder.customer_rel?.nama || "-",
          }}
          onClose={() => {
            setShowView(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {showEdit && selectedOrder && (
        <UpdateOrders
          order={{
            ...selectedOrder,
            customer: selectedOrder.customer_rel?.nama || "-",
          }}
          onClose={() => {
            setShowEdit(false);
            setSelectedOrder(null);
            requestRefresh(""); // Auto refresh setelah edit
          }}
          onSave={handleSuccessEdit}
          setToast={setToast}
          refreshOrders={() => requestRefresh("")}
        />
      )}
    </Layout>
  );
}
