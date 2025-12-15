"use client";

import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import { ShoppingCart, Clock, CheckCircle, PartyPopper, XCircle } from "lucide-react";
import { Calendar } from "primereact/calendar";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "@/styles/sales/dashboard.css";
import "@/styles/sales/admin.css";
import { getOrders, updateOrderAdmin, getOrderStatistics } from "@/lib/sales/orders";

// Lazy load modals
const ViewOrders = dynamic(() => import("./viewOrders"), { ssr: false });
const UpdateOrders = dynamic(() => import("./updateOrders"), { ssr: false });
const AddOrders = dynamic(() => import("./addOrders"), { ssr: false });
const AddCicilan = dynamic(() => import("./addCicilan"), { ssr: false });

// Use Next.js proxy to avoid CORS
const BASE_URL = "/api";

// Status Pembayaran Mapping
const STATUS_PEMBAYARAN_MAP = {
  0:    { label: "Unpaid", class: "unpaid" },
  null: { label: "Unpaid", class: "unpaid" },
  1:    { label: "Menunggu", class: "pending" },
  2:    { label: "Paid", class: "paid" },
  3:    { label: "Ditolak", class: "rejected" },
  4:    { label: "DP", class: "dp" },
};

// Status Order Mapping
const STATUS_ORDER_MAP = {
  "1": { label: "Proses", class: "proses" },
  "2": { label: "Sukses", class: "sukses" },
  "3": { label: "Failed", class: "failed" },
  "4": { label: "Upselling", class: "upselling" },
  "N": { label: "Dihapus", class: "dihapus" },
};

const ORDERS_COLUMNS = [
  "#",
  "Customer",
  "Produk",
  "Total Harga",
  "Status Order",
  "Status Pembayaran",
  "Tanggal",
  "Sumber",
  "Waktu Pembayaran",
  "Metode Bayar",
  "Actions",
];


const DEFAULT_TOAST = { show: false, message: "", type: "success" };

export default function DaftarPesanan() {
  // Pagination state dengan fallback pagination
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [hasMore, setHasMore] = useState(true); // penentu masih ada halaman berikutnya
  const [loading, setLoading] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState(null); // Store pagination info from backend
  const perPage = 15; // Data per halaman
  
  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [dateRange, setDateRange] = useState(null); // [startDate, endDate] atau null
  
  // State lainnya
  const [statistics, setStatistics] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showCicilan, setShowCicilan] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState({}); // { orderId: [payments] }
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistoryData, setPaymentHistoryData] = useState(null);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);

  const [toast, setToast] = useState(DEFAULT_TOAST);
  const toastTimeoutRef = useRef(null);
  const fetchingRef = useRef(false); // Prevent multiple simultaneous fetches

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

  // 🔹 Fetch orders dengan fallback pagination
  const fetchOrders = useCallback(async (pageNumber = 1) => {
    // Prevent multiple simultaneous calls using ref
    if (fetchingRef.current) {
      console.log("⏸️ Already fetching, skipping duplicate request for page", pageNumber);
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found");
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const res = await fetch(`/api/sales/order?page=${pageNumber}&per_page=${perPage}`, {
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
      
      // Handle response dengan struktur baru: { success: true, message: "...", data: [...], pagination: {...} }
      if (json.success && json.data && Array.isArray(json.data)) {
        // Selalu replace data (bukan append) - setiap page menampilkan data yang berbeda
        setOrders(json.data);

        // Gunakan pagination object jika tersedia
        if (json.pagination && typeof json.pagination === 'object') {
          // Struktur pagination: { current_page, last_page, per_page, total }
          const isLastPage = json.pagination.current_page >= json.pagination.last_page;
          setHasMore(!isLastPage);
          setPaginationInfo(json.pagination);
          console.log("📄 Pagination info:", {
            current_page: json.pagination.current_page,
            last_page: json.pagination.last_page,
            total: json.pagination.total,
            hasMore: !isLastPage
          });
        } else {
          setPaginationInfo(null);
          // Fallback pagination: cek jumlah data untuk menentukan hasMore
          if (json.data.length < perPage) {
            setHasMore(false); // sudah halaman terakhir
          } else {
            setHasMore(true); // masih ada halaman berikutnya
          }
        }
      } else {
        // Jika response tidak sesuai format yang diharapkan
        console.warn("⚠️ Unexpected response format:", json);
        setOrders([]);
        setHasMore(false);
      }
      
      setLoading(false);
      fetchingRef.current = false;
    } catch (err) {
      console.error("Error fetching orders:", err);
      showToast("Gagal memuat data", "error");
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [showToast, perPage]);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Initial load: fetch page 1
  useEffect(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Hanya sekali saat mount

  // Fetch data saat page berubah
  useEffect(() => {
    if (page > 0 && !loading) {
      fetchOrders(page);
      // Tidak scroll ke atas, tetap di posisi saat ini
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]); // Hanya depend pada page

  // 🔹 Next page
  const handleNextPage = useCallback(() => {
    if (loading || !hasMore) return; // Jangan load jika sedang loading atau sudah habis
    
    const nextPage = page + 1;
    console.log("🔄 Next page clicked, loading page:", nextPage);
    setPage(nextPage);
  }, [page, hasMore, loading]);

  // 🔹 Previous page
  const handlePrevPage = useCallback(() => {
    if (loading || page <= 1) return; // Jangan load jika sedang loading atau sudah di page 1
    
    const prevPage = page - 1;
    console.log("🔄 Previous page clicked, loading page:", prevPage);
    setPage(prevPage);
  }, [page, loading]);

  // 🔹 Refresh all data (reset to page 1)
  const requestRefresh = async (message, type = "success") => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
    await Promise.all([loadStatistics(), fetchOrders(1)]);
    if (message) showToast(message, type);
  };

  // 🔹 Format date range untuk display
  const formatDateRange = (range) => {
    if (!range || !Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
      return "Pilih tanggal";
    }
    
    const formatDate = (date) => {
      const d = new Date(date);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };
    
    return `${formatDate(range[0])} - ${formatDate(range[1])}`;
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

  // === FILTER ===
  // Filter orders berdasarkan search dan date range
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter by search (customer name, product name, alamat, total harga)
    if (searchInput && searchInput.trim()) {
      const searchLower = searchInput.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        const customerName = order.customer_rel?.nama?.toLowerCase() || "";
        const productName = order.produk_rel?.nama?.toLowerCase() || "";
        const alamat = order.alamat?.toLowerCase() || "";
        const totalHarga = order.total_harga?.toString() || "";
        
        return (
          customerName.includes(searchLower) ||
          productName.includes(searchLower) ||
          alamat.includes(searchLower) ||
          totalHarga.includes(searchLower)
        );
      });
    }

    // Filter by date range
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((order) => {
        if (!order.tanggal) return false;
        const orderDate = new Date(order.tanggal);
        const fromDate = new Date(dateRange[0]);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange[1]);
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    return filtered;
  }, [orders, searchInput, dateRange]);

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

  const handleCicilan = (order) => {
    setSelectedOrder(order);
    setShowCicilan(true);
  };

  // Fetch payment history untuk order
  const fetchPaymentHistory = async (orderId) => {
    if (!orderId) return;
    
    setPaymentHistoryLoading(true);
    setPaymentHistoryData(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Token tidak ditemukan", "error");
        return;
      }

      const res = await fetch(`/api/sales/order-payment/by-order/${orderId}`, {
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
      
      if (json.success && json.data) {
        setPaymentHistoryData(json.data);
        setShowPaymentHistory(true);
      } else {
        showToast(json.message || "Gagal memuat riwayat pembayaran", "error");
      }
    } catch (err) {
      console.error("Error fetching payment history:", err);
      showToast("Terjadi kesalahan saat memuat riwayat pembayaran", "error");
    } finally {
      setPaymentHistoryLoading(false);
    }
  };

  const handleShowPaymentHistory = (order) => {
    if (order?.id) {
      fetchPaymentHistory(order.id);
    }
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
            <div className="orders-search">
              <input
                type="search"
                placeholder="Cari customer, produk, alamat..."
                className="orders-search__input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="orders-search__icon pi pi-search" />
            </div>
            <div className="orders-toolbar-buttons">
              <button className="orders-button orders-button--primary" onClick={() => setShowAdd(true)}>
                + Tambah Pesanan
              </button>
            </div>
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
          <div className="panel__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p className="panel__eyebrow">Directory</p>
              <h3 className="panel__title">Order roster</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              {/* Date Range Picker - Rata Kanan */}
              <div style={{ position: "relative" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--dash-text)"
                }}>
                  Waktu Pesanan Dibuat
                </label>
                <div style={{ position: "relative" }}>
                  <Calendar
                    value={dateRange}
                    onChange={(e) => setDateRange(e.value)}
                    selectionMode="range"
                    readOnlyInput
                    showIcon
                    icon="pi pi-calendar"
                    placeholder="Pilih tanggal"
                    dateFormat="dd M yyyy"
                    monthNavigator
                    yearNavigator
                    yearRange="2020:2030"
                    style={{
                      width: "100%",
                      minWidth: "300px"
                    }}
                    inputStyle={{
                      width: "100%",
                      padding: "0.75rem 2.5rem 0.75rem 1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      background: "#ffffff",
                      color: "#1f2937",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                      cursor: "pointer"
                    }}
                    panelStyle={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                </div>
              </div>

              {/* Clear Filter Button */}
              {dateRange && Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1] && (
                <button
                  onClick={() => setDateRange(null)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: "#e5e7eb",
                    color: "#6b7280",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                    height: "fit-content",
                    marginTop: "1.75rem"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#d1d5db";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#e5e7eb";
                  }}
                >
                  <i className="pi pi-times" style={{ marginRight: "0.25rem", fontSize: "0.75rem" }} />
                  Reset
                </button>
              )}
            </div>
          </div>
          <div className="orders-table__wrapper">
            <div className="orders-table">
              <div className="orders-table__head">
                {ORDERS_COLUMNS.map((column) => (
                  <span key={column}>{column}</span>
                ))}
              </div>
              <div className="orders-table__body">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, i) => {
                    // Handle produk name - dari produk_rel
                    const produkNama = order.produk_rel?.nama || "-";

                    // Handle customer name - dari customer_rel
                    const customerNama = order.customer_rel?.nama || "-";

                    // Get Status Order
                    const statusOrderValue = order.status_order?.toString() || "";
                    const statusOrderInfo = STATUS_ORDER_MAP[statusOrderValue] || { label: "-", class: "default" };

                    // Get Status Pembayaran
                    let statusPembayaranValue = order.status_pembayaran;
                    if (statusPembayaranValue === null || statusPembayaranValue === undefined) {
                      statusPembayaranValue = 0;
                    }
                    const statusPembayaranInfo = STATUS_PEMBAYARAN_MAP[statusPembayaranValue] || STATUS_PEMBAYARAN_MAP[0];

                    return (
                      <div className="orders-table__row" key={order.id || `${order.id}-${i}`}>
                        <div className="orders-table__cell" data-label="#">
                          {(page - 1) * perPage + i + 1}
                        </div>
                        <div className="orders-table__cell orders-table__cell--strong" data-label="Customer">
                          {customerNama}
                        </div>
                        <div className="orders-table__cell" data-label="Produk">
                          {produkNama}
                        </div>
                        <div className="orders-table__cell" data-label="Total Harga">
                          <div className="payment-details">
                            <div className="payment-main">
                              <strong>Rp {Number(order.total_harga || 0).toLocaleString("id-ID")}</strong>
                            </div>
                            
                            
                            {/* Total Paid & Remaining - tampil jika status DP atau ada pembayaran */}
                            {(statusPembayaranValue === 4 || order.total_paid > 0 || (order.remaining !== undefined && order.remaining < order.total_harga)) && (
                              <div className="payment-breakdown">
                                <div className="payment-item">
                                  <span 
                                    className="payment-label payment-clickable" 
                                    onClick={() => handleShowPaymentHistory(order)}
                                    style={{ cursor: "pointer", textDecoration: "underline" }}
                                    title="Klik untuk melihat riwayat pembayaran"
                                  >
                                    Total Paid:
                                  </span>
                                  <span className="payment-value paid">
                                    Rp {Number(order.total_paid || 0).toLocaleString("id-ID")}
                                  </span>
                                </div>
                                <div className="payment-item">
                                  <span className="payment-label">Remaining:</span>
                                  <span className="payment-value remaining">
                                    Rp {Number(
                                      order.remaining !== undefined 
                                        ? order.remaining 
                                        : (Number(order.total_harga || 0) - Number(order.total_paid || 0))
                                    ).toLocaleString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="orders-table__cell" data-label="Status Order">
                          <span className={`orders-status-badge orders-status-badge--${statusOrderInfo.class}`}>
                            {statusOrderInfo.label}
                          </span>
                        </div>
                        <div className="orders-table__cell" data-label="Status Pembayaran">
                          <span className={`orders-status-badge orders-status-badge--${statusPembayaranInfo.class}`}>
                            {statusPembayaranInfo.label}
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
                          {/* Button Input Cicilan - hanya muncul jika status_pembayaran === 4 (DP) */}
                          {statusPembayaranValue === 4 && (
                            <button
                              className="orders-action-btn"
                              title="Input Cicilan"
                              onClick={() => handleCicilan(order)}
                              style={{
                                background: "#10b981",
                                color: "#fff",
                                marginTop: "0.25rem"
                              }}
                            >
                              <i className="pi pi-money-bill" />
                            </button>
                          )}
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
                  Page {paginationInfo?.current_page || page} of {paginationInfo?.last_page || "?"}
                  {paginationInfo?.total && ` (${paginationInfo.total} total)`}
                </span>
              )}
            </div>

            {/* Next Button */}
            <button
              className="orders-pagination__btn"
              onClick={handleNextPage}
              disabled={!hasMore || loading}
              aria-label="Next page"
              style={{
                padding: "0.75rem 1rem",
                minWidth: "100px",
                background: !hasMore || loading ? "#e5e7eb" : "#f1a124",
                color: !hasMore || loading ? "#9ca3af" : "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: !hasMore || loading ? "not-allowed" : "pointer",
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

      {showCicilan && selectedOrder && (
        <AddCicilan
          order={{
            ...selectedOrder,
            customer: selectedOrder.customer_rel?.nama || "-",
          }}
          onClose={() => {
            setShowCicilan(false);
            setSelectedOrder(null);
          }}
          onSave={async () => {
            // Fungsi save akan diisi nanti
            setShowCicilan(false);
            setSelectedOrder(null);
            await requestRefresh("Cicilan berhasil ditambahkan!");
          }}
        />
      )}

      {/* Payment Details Styles */}
      <style jsx>{`
        .payment-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .payment-main {
          font-size: 0.875rem;
          color: #111827;
          word-wrap: break-word;
        }

        .payment-main strong {
          font-weight: 600;
          color: #1f2937;
        }

        .payment-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.25rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          width: 100%;
          box-sizing: border-box;
        }

        .payment-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.25rem 0;
          font-size: 0.75rem;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .payment-number {
          color: #6b7280;
          font-weight: 500;
          flex-shrink: 0;
        }

        .payment-amount {
          color: #059669;
          font-weight: 600;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .payment-list-placeholder {
          padding: 0.25rem 0;
          font-size: 0.75rem;
        }

        .payment-hint {
          color: #9ca3af;
          font-style: italic;
        }

        .payment-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.375rem;
          padding-top: 0.375rem;
          border-top: 1px solid #e5e7eb;
          width: 100%;
          box-sizing: border-box;
        }

        .payment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .payment-label {
          color: #6b7280;
          font-weight: 500;
          flex-shrink: 0;
        }

        .payment-label.payment-clickable {
          cursor: pointer;
          transition: opacity 0.2s ease, color 0.2s ease;
        }

        .payment-label.payment-clickable:hover {
          opacity: 0.8;
          color: #3b82f6;
          text-decoration: underline;
        }

        .payment-value {
          font-weight: 600;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .payment-value.paid {
          color: #059669;
        }

        .payment-value.remaining {
          color: #dc2626;
        }

        .payment-clickable {
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .payment-clickable:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .payment-details {
            gap: 0.375rem;
          }

          .payment-main {
            font-size: 0.8125rem;
          }

          .payment-list,
          .payment-breakdown {
            font-size: 0.6875rem;
            padding: 0.375rem;
          }

          .payment-list-item,
          .payment-item {
            font-size: 0.6875rem;
          }
        }

        .payment-clickable {
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .payment-clickable:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
      `}</style>

      {/* Modal Payment History */}
      {showPaymentHistory && (
        <div className="orders-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPaymentHistory(false)}>
          <div className="orders-modal-card" style={{ width: "min(800px, 95vw)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div className="orders-modal-header">
              <div>
                <p className="orders-modal-eyebrow">Riwayat Pembayaran</p>
                <h2>Data Pembayaran Order #{paymentHistoryData?.order?.id || "-"}</h2>
              </div>
              <button className="orders-modal-close" onClick={() => setShowPaymentHistory(false)} type="button" aria-label="Tutup modal">
                <i className="pi pi-times" />
              </button>
            </div>

            {/* Body */}
            <div className="orders-modal-body" style={{ overflowY: "auto", flex: 1, padding: "1.5rem" }}>
              {paymentHistoryLoading ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                  <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem", color: "#3b82f6" }} />
                  <p style={{ marginTop: "1rem", color: "#6b7280" }}>Memuat data...</p>
                </div>
              ) : paymentHistoryData ? (
                <>
                  {/* Order Info */}
                  <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f9fafb", borderRadius: "8px" }}>
                    <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Informasi Order</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", fontSize: "0.875rem" }}>
                      <div>
                        <span style={{ color: "#6b7280" }}>Customer:</span>
                        <strong style={{ display: "block", color: "#111827" }}>{paymentHistoryData.order?.customer_rel?.nama || "-"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#6b7280" }}>Produk:</span>
                        <strong style={{ display: "block", color: "#111827" }}>{paymentHistoryData.order?.produk_rel?.nama || "-"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#6b7280" }}>Total Harga:</span>
                        <strong style={{ display: "block", color: "#111827" }}>Rp {Number(paymentHistoryData.order?.total_harga || 0).toLocaleString("id-ID")}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {paymentHistoryData.summary && (
                    <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                      <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Ringkasan</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", fontSize: "0.875rem" }}>
                        <div>
                          <span style={{ color: "#6b7280" }}>Total Amount:</span>
                          <strong style={{ display: "block", color: "#111827" }}>Rp {Number(paymentHistoryData.summary.total_amount || 0).toLocaleString("id-ID")}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#6b7280" }}>Total Paid:</span>
                          <strong style={{ display: "block", color: "#059669" }}>Rp {Number(paymentHistoryData.summary.total_paid || 0).toLocaleString("id-ID")}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#6b7280" }}>Remaining:</span>
                          <strong style={{ display: "block", color: "#dc2626" }}>Rp {Number(paymentHistoryData.summary.remaining || 0).toLocaleString("id-ID")}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#6b7280" }}>Jumlah Pembayaran:</span>
                          <strong style={{ display: "block", color: "#111827" }}>{paymentHistoryData.summary.count_payments || 0}x</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payments List */}
                  <div>
                    <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Daftar Pembayaran</h3>
                    {paymentHistoryData.payments && paymentHistoryData.payments.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {paymentHistoryData.payments.map((payment, idx) => (
                          <div key={payment.id || idx} style={{ padding: "1rem", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                              <div>
                                <strong style={{ fontSize: "0.95rem", color: "#111827" }}>Pembayaran ke {payment.payment_ke || idx + 1}</strong>
                                <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
                                  {payment.tanggal ? new Date(payment.tanggal).toLocaleString("id-ID", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  }) : "-"}
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <strong style={{ fontSize: "1.1rem", color: "#059669" }}>Rp {Number(payment.amount || 0).toLocaleString("id-ID")}</strong>
                                <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                                  <span style={{
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "4px",
                                    background: payment.status === "2" ? "#d1fae5" : payment.status === "3" ? "#fee2e2" : "#fef3c7",
                                    color: payment.status === "2" ? "#065f46" : payment.status === "3" ? "#991b1b" : "#92400e",
                                    fontWeight: 600
                                  }}>
                                    {payment.status === "2" ? "Approved" : payment.status === "3" ? "Rejected" : "Pending"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.5rem", fontSize: "0.875rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #e5e7eb" }}>
                              <div>
                                <span style={{ color: "#6b7280" }}>Metode:</span>
                                <strong style={{ display: "block", color: "#111827" }}>{payment.payment_method?.toUpperCase() || "-"}</strong>
                              </div>
                              {payment.bukti_pembayaran && (
                                <div>
                                  <span style={{ color: "#6b7280" }}>Bukti:</span>
                                  <a 
                                    href={`${process.env.NEXT_PUBLIC_API_URL || ''}/storage/${payment.bukti_pembayaran}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: "block", color: "#3b82f6", textDecoration: "underline" }}
                                  >
                                    Lihat Bukti
                                  </a>
                                </div>
                              )}
                              {payment.catatan && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <span style={{ color: "#6b7280" }}>Catatan:</span>
                                  <p style={{ margin: "0.25rem 0 0", color: "#111827" }}>{payment.catatan}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                        <p>Belum ada riwayat pembayaran</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
                  <p>Gagal memuat data</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="orders-modal-footer">
              <button type="button" onClick={() => setShowPaymentHistory(false)} className="orders-btn orders-btn--primary">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
