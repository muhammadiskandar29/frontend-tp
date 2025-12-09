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

/**
 * Simple debounce hook to avoid rerunning expensive computations
 */
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const DEFAULT_TOAST = { show: false, message: "", type: "success" };

export default function DaftarPesanan() {
  // Pagination state sesuai requirement
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(null);
  const [loading, setLoading] = useState(false);
  
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

  // 🔹 Fetch orders dengan struktur response baru
  const fetchOrders = useCallback(async (pageNumber) => {
    // Validasi: jangan fetch jika page > lastPage
    if (lastPage !== null && pageNumber > lastPage) {
      console.log("⚠️ Page sudah melebihi lastPage, skip fetch");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/sales/order?page=${pageNumber}`, {
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
      
      // Handle response dengan struktur: { data: [...], pagination: { current_page, last_page, per_page, total } }
      if (json.data && Array.isArray(json.data)) {
        // Page 1: replace data, Page > 1: append data
        setOrders(prev => {
          if (pageNumber === 1) {
            // Page 1: replace semua data
            return json.data;
          } else {
            // Page > 1: append data baru, hindari duplikasi berdasarkan ID
            const existingIds = new Set(prev.map(o => o.id));
            const uniqueNewOrders = json.data.filter(o => !existingIds.has(o.id));
            return [...prev, ...uniqueNewOrders];
          }
        });

        // Update lastPage dari pagination object
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
  }, [lastPage, showToast]);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Initial load: fetch page 1
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchOrders(1);
    };
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load More function
  const loadMore = useCallback(() => {
    if (loading) return; // Jangan load jika sedang loading
    if (lastPage !== null && page >= lastPage) return; // Jangan load jika sudah di page terakhir
    
    const nextPage = page + 1;
    console.log("🔄 Load More clicked, loading page:", nextPage);
    setPage(nextPage);
    fetchOrders(nextPage);
  }, [page, lastPage, loading, fetchOrders]);

  // 🔹 Refresh all data (reset to page 1)
  const requestRefresh = async (message, type = "success") => {
    // Clear orders first, then reset to page 1
    setOrders([]);
    setPage(1);
    setLastPage(null);
    await loadStatistics();
    await fetchOrders(1);
    if (message) showToast(message, type);
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

        {/* Orders List - Simple UI dengan Tailwind */}
        <section className="panel orders-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Directory</p>
              <h3 className="panel__title">Order roster</h3>
            </div>
            <span className="panel__meta">{orders.length} orders</span>
          </div>

          <div className="p-6">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order, i) => {
                  const customerName = order.customer_rel?.nama || "-";
                  const produkName = order.produk_rel?.nama || "-";
                  const totalHarga = Number(order.total_harga || 0).toLocaleString("id-ID");
                  const statusPembayaran = order.status_pembayaran === "1" || order.status_pembayaran === 1 ? "Paid" : "Unpaid";
                  
                  return (
                    <div
                      key={order.id || i}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Customer</p>
                          <p className="font-semibold text-gray-900">{customerName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Produk</p>
                          <p className="text-gray-900">{produkName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Total Harga</p>
                          <p className="font-semibold text-gray-900">Rp {totalHarga}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Status Pembayaran</p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusPembayaran === "Paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {statusPembayaran}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {loading ? "Loading data..." : "Tidak ada data"}
                </p>
              </div>
            )}

            {/* Load More Button */}
            {lastPage !== null && page < lastPage && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600 hover:shadow-lg"
                  } flex items-center gap-2`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Info jika semua data sudah ditampilkan */}
            {lastPage !== null && page >= lastPage && (
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  Semua data sudah ditampilkan ({orders.length} orders)
                </p>
              </div>
            )}
          </div>
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
