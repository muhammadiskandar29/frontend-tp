"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import { Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Calendar } from "primereact/calendar";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "@/styles/finance/dashboard.css";
import "@/styles/finance/admin.css";
import { getOrderStatistics } from "@/lib/finance/orders";

// Lazy load modals
const ViewOrders = dynamic(() => import("./viewOrders"), { ssr: false });
const ApproveOrder = dynamic(() => import("./approveOrder"), { ssr: false });
const RejectOrder = dynamic(() => import("./rejectOrder"), { ssr: false });

// Status Validasi Mapping (berdasarkan field `status`)
const VALIDATION_STATUS_MAP = {
  0: { label: "Menunggu", class: "pending" },
  1: { label: "Menunggu", class: "pending" },
  2: { label: "Valid", class: "valid" },
  3: { label: "Ditolak", class: "rejected" },
};

const ORDERS_COLUMNS = [
  "#",
  "Order ID",
  "Customer",
  "Produk",
  "Total Harga",
  "Pembayaran Ke -",
  "Amount",
  "Status Validasi",
  "Tanggal Bayar",
  "Actions",
];

const DEFAULT_TOAST = { show: false, message: "", type: "success" };

export default function FinanceOrders() {
  // Pagination state dengan fallback pagination
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [hasMore, setHasMore] = useState(true); // penentu masih ada halaman berikutnya
  const [loading, setLoading] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState(null); // info pagination dari backend
  const perPage = 15; // Data per halaman
  
  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [dateRange, setDateRange] = useState(null); // [startDate, endDate] atau null
  
  // State lainnya
  const [statistics, setStatistics] = useState(null);
  const [showView, setShowView] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

      const res = await fetch(`/api/finance/order-validation?page=${pageNumber}&per_page=${perPage}`, {
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
      
      // Handle response dengan struktur: { success: true, data: [...], pagination: {...} }
      if (json.success && json.data && Array.isArray(json.data)) {
        // Debug: log struktur data untuk melihat apakah order_rel sudah include status_pembayaran
        if (json.data.length > 0) {
          console.log("🔍 Sample payment data structure:", {
            payment: json.data[0],
            orderRel: json.data[0]?.order_rel,
            hasStatusPembayaran: json.data[0]?.order_rel?.status_pembayaran !== undefined,
            statusPembayaran: json.data[0]?.order_rel?.status_pembayaran,
          });
        }
        // Selalu replace data (bukan append) - setiap page menampilkan data yang berbeda
        setOrders(json.data);

        // Gunakan pagination object jika tersedia, jika tidak gunakan fallback
        if (json.pagination && typeof json.pagination === "object") {
          const isLastPage = json.pagination.current_page >= json.pagination.last_page;
          setHasMore(!isLastPage);
          setPaginationInfo(json.pagination);
          console.log("📄 Pagination info (finance):", {
            current_page: json.pagination.current_page,
            last_page: json.pagination.last_page,
            total: json.pagination.total,
            hasMore: !isLastPage,
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
        console.warn("⚠️ Unexpected response format (finance/orders):", json);
        setOrders([]);
        setHasMore(false);
        setPaginationInfo(null);
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

  // Reset page ke 1 dan fetch ulang ketika filter berubah
  useEffect(() => {
    // Skip pada initial mount (sudah ada useEffect untuk initial load)
    if (orders.length === 0) return;
    
    // Reset ke page 1 dan fetch ulang data
    setPage(1);
    setOrders([]);
    setHasMore(true);
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, dateRange]); // Reset page ketika search atau date range berubah

  // Filter payments (tidak di-group, setiap payment = 1 baris)
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter by search (customer name, product name, total harga)
    if (searchInput && searchInput.trim()) {
      const searchLower = searchInput.toLowerCase().trim();
      filtered = filtered.filter((payment) => {
        const customerName = payment.order_rel?.customer_rel?.nama?.toLowerCase() || "";
        const productName = payment.order_rel?.produk_rel?.nama?.toLowerCase() || "";
        const totalOrder = payment.order_rel?.total_harga?.toString() || "";
        const totalPaid = payment.total_paid?.toString() || "";
        const remaining = payment.remaining?.toString() || "";
        
        return (
          customerName.includes(searchLower) ||
          productName.includes(searchLower) ||
          totalOrder.includes(searchLower) ||
          totalPaid.includes(searchLower) ||
          remaining.includes(searchLower)
        );
      });
    }

    // Filter by date range
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((payment) => {
        if (!payment.tanggal) return false;
        const orderDate = new Date(payment.tanggal);
        const fromDate = new Date(dateRange[0]);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange[1]);
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    // Return semua payment tanpa grouping (setiap payment = 1 baris)
    return filtered;
  }, [orders, searchInput, dateRange]);

  // === SUMMARY ===
  // Gunakan data dari statistics API
  // Response structure: { menunggu_validasi, sudah_diapprove, ditolak, total_nilai_menunggu, total_nilai_menunggu_formatted }
  const menungguOrders = statistics?.menunggu_validasi || 0;
  const approvedOrders = statistics?.sudah_diapprove || 0;
  const ditolakOrders = statistics?.ditolak || 0;
  const totalNilaiMenunggu = statistics?.total_nilai_menunggu_formatted || "Rp 0";

  // === EVENT HANDLERS ===
  const handleView = (order) => {
    setSelectedOrder(order);
    setShowView(true);
  };

  const handleApprove = (order) => {
    setSelectedOrder(order);
    setShowApprove(true);
  };

  const handleReject = (order) => {
    setSelectedOrder(order);
    setShowReject(true);
  };

  // Handler untuk approve action
  const onApprove = async (order) => {
    try {
      if (!order?.id) {
        showToast("Order ID tidak valid", "error");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Token tidak ditemukan", "error");
        return;
      }

      const res = await fetch(`/api/finance/order-validation/${order.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (json.success) {
        setShowApprove(false);
        setSelectedOrder(null);
        await requestRefresh(json.message || "Order berhasil disetujui", "success");
      } else {
        showToast(json.message || "Gagal approve order", "error");
      }
    } catch (err) {
      console.error("Error approving order:", err);
      showToast("Terjadi kesalahan saat approve order", "error");
    }
  };

  // Handler untuk reject action
  const onReject = async (order, catatan) => {
    try {
      if (!order?.id) {
        showToast("Order ID tidak valid", "error");
        return;
      }

      if (!catatan || !catatan.trim()) {
        showToast("Mohon isi catatan penolakan", "error");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Token tidak ditemukan", "error");
        return;
      }

      // Log untuk debugging
      console.log("🔴 Reject Order Request:", {
        orderId: order.id,
        catatan: catatan,
        orderStatus: order.status,
      });

      const res = await fetch(`/api/finance/order-validation/${order.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ catatan: catatan.trim() }),
      });

      const json = await res.json();

      // Log response untuk debugging
      console.log("🔴 Reject Order Response:", json);

      if (json.success) {
        setShowReject(false);
        setSelectedOrder(null);
        await requestRefresh("Order berhasil ditolak!", "success");
      } else {
        showToast(json.message || "Gagal reject order", "error");
      }
    } catch (err) {
      console.error("Error rejecting order:", err);
      showToast("Terjadi kesalahan saat reject order", "error");
    }
  };

  return (
    <Layout title="Orders | Finance Dashboard">
      <div className="dashboard-shell orders-shell">
        <section className="dashboard-hero orders-hero">
          <div className="dashboard-hero__copy">
            <p className="dashboard-hero__eyebrow">Finance</p>
            <h2 className="dashboard-hero__title">Dashboard Finance</h2>
            <span className="dashboard-hero__meta">
              Validasi dan monitoring pembayaran (DP & pelunasan) untuk setiap order.
            </span>
          </div>

          <div className="orders-toolbar">
            <div className="orders-search">
              <input
                type="search"
                placeholder="Cari customer, produk, atau nominal..."
                className="orders-search__input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="orders-search__icon pi pi-search" />
            </div>
            <div className="orders-toolbar-buttons">
              {/* Button tambahan bisa ditambahkan di sini nanti */}
            </div>
          </div>
        </section>
 
        <section className="dashboard-summary orders-summary">
          {[
            {
              label: "Menunggu Validasi",
              value: menungguOrders,
              accent: "accent-amber",
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
            {
              label: "Total Nilai Menunggu",
              value: totalNilaiMenunggu,
              accent: "accent-indigo",
              icon: <DollarSign size={22} />,
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
          <div
            className="panel__header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <p className="panel__eyebrow">Validasi Pembayaran</p>
              <h3 className="panel__title">Daftar Pembayaran Order</h3>
              <p
                style={{
                  marginTop: "0.25rem",
                  fontSize: "0.875rem",
                  color: "var(--dash-muted)",
                }}
              >
                Setiap baris = 1 transaksi pembayaran (DP / pelunasan) yang perlu divalidasi oleh tim finance.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              {/* Date Range Picker - filter berdasarkan tanggal bayar */}
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--dash-text)",
                  }}
                >
                  Tanggal Bayar
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
                      minWidth: "300px",
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
                      cursor: "pointer",
                    }}
                    panelStyle={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </div>
              </div>

              {/* Clear Filter Button */}
              {dateRange &&
                Array.isArray(dateRange) &&
                dateRange.length === 2 &&
                dateRange[0] &&
                dateRange[1] && (
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
                      marginTop: "1.75rem",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#d1d5db";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "#e5e7eb";
                    }}
                  >
                    <i
                      className="pi pi-times"
                      style={{ marginRight: "0.25rem", fontSize: "0.75rem" }}
                    />
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
                  filteredOrders.map((payment, i) => {
                    const orderRel = payment.order_rel || {};

                    const orderId =
                      orderRel.id ?? payment.order_id ?? payment.id ?? "-";
                    const customerNama =
                      orderRel.customer_rel?.nama || "-";
                    const produkNama = orderRel.produk_rel?.nama || "-";

                    const totalOrder = Number(orderRel.total_harga || 0);
                    const totalPaid = Number(payment.total_paid || 0);
                    const remaining =
                      payment.remaining !== undefined &&
                      payment.remaining !== null
                        ? Number(payment.remaining)
                        : Math.max(totalOrder - totalPaid, 0);

                    // Cek apakah status pembayaran adalah type 4 (DP)
                    // Menggunakan relasi order_id (payment.order_rel) untuk mendapatkan status_pembayaran dari order
                    // orderRel adalah relasi dari payment ke order, yang berisi status_pembayaran
                    // Hanya tampilkan Total Paid & Remaining jika status_pembayaran === 4 (DP)
                    // Jika status_pembayaran null/0 atau bukan 4, tidak tampilkan Total Paid & Remaining
                    
                    // Ambil status_pembayaran dari order_rel
                    // Bisa berupa string "4" atau number 4
                    // Cek juga di payment.order jika order_rel tidak ada
                    let statusPembayaran = null;
                    
                    // Prioritas 1: order_rel.status_pembayaran
                    if (orderRel.status_pembayaran !== undefined && orderRel.status_pembayaran !== null) {
                      statusPembayaran = Number(orderRel.status_pembayaran);
                    }
                    // Prioritas 2: payment.order?.status_pembayaran (jika ada)
                    else if (payment.order?.status_pembayaran !== undefined && payment.order?.status_pembayaran !== null) {
                      statusPembayaran = Number(payment.order.status_pembayaran);
                    }
                    
                    const isDP = statusPembayaran === 4;
                    
                    // Debug: log untuk memastikan status_pembayaran terdeteksi dengan benar
                    console.log('🔍 Payment Debug:', {
                      paymentId: payment.id,
                      orderId: orderId,
                      orderRel: orderRel,
                      paymentOrder: payment.order,
                      statusPembayaran: statusPembayaran,
                      statusPembayaranFromOrderRel: orderRel.status_pembayaran,
                      statusPembayaranFromPaymentOrder: payment.order?.status_pembayaran,
                      isDP: isDP,
                      totalPaid: totalPaid,
                      remaining: remaining,
                      totalOrder: totalOrder,
                      fullPayment: payment
                    });

                    const paymentKe = payment.payment_ke !== undefined && payment.payment_ke !== null
                      ? payment.payment_ke
                      : "-";

                    // Format tanggal bayar: "15-12-2025 14:35:36" (konsisten dengan sales)
                    const formatTanggalBayar = (tanggal) => {
                      if (!tanggal) return "-";
                      const date = new Date(tanggal);
                      const day = String(date.getDate()).padStart(2, "0");
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const year = date.getFullYear();
                      const hours = String(date.getHours()).padStart(2, "0");
                      const minutes = String(date.getMinutes()).padStart(2, "0");
                      const seconds = String(date.getSeconds()).padStart(2, "0");
                      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
                    };

                    const tanggalBayar = formatTanggalBayar(payment.tanggal);

                    const statusCode = Number(
                      payment.status === null || payment.status === undefined
                        ? 0
                        : payment.status
                    );
                    const validationInfo =
                      VALIDATION_STATUS_MAP[statusCode] || {
                        label: "-",
                        class: "default",
                      };

                    // Finance harus bisa koreksi (salah approve / salah reject),
                    // jadi tombol Approve & Reject selalu tersedia untuk setiap pembayaran
                    const canApproveReject = true;

                    return (
                      <div
                        className="orders-table__row"
                        key={payment.id || `payment-${i}`}
                      >
                        <div className="orders-table__cell" data-label="#">
                          {(page - 1) * perPage + i + 1}
                        </div>
                        <div className="orders-table__cell" data-label="Order ID">
                          {orderId}
                        </div>
                        <div
                          className="orders-table__cell orders-table__cell--strong"
                          data-label="Customer"
                        >
                          {customerNama}
                        </div>
                        <div className="orders-table__cell" data-label="Produk">
                          {produkNama}
                        </div>
                        <div className="orders-table__cell" data-label="Total Harga">
                          <div className="payment-details">
                            <div className="payment-main">
                              <strong>Rp {totalOrder.toLocaleString("id-ID")}</strong>
                            </div>
                            
                            {/* Total Paid & Remaining - hanya tampil jika status_pembayaran === 4 (DP) */}
                            {isDP && (
                              <div className="payment-breakdown">
                                <div className="payment-item">
                                  <span className="payment-label">Total Paid:</span>
                                  <span className="payment-value paid">
                                    Rp {totalPaid.toLocaleString("id-ID")}
                                  </span>
                                </div>
                                <div className="payment-item">
                                  <span className="payment-label">Remaining:</span>
                                  <span className="payment-value remaining">
                                    Rp {remaining.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="orders-table__cell" data-label="Pembayaran Ke -">
                          {paymentKe}
                        </div>
                        <div className="orders-table__cell" data-label="Amount">
                          <span style={{ fontWeight: 600, color: "#059669" }}>
                            Rp {Number(payment.amount || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="orders-table__cell" data-label="Status Validasi">
                          <span
                            className={`orders-status-badge orders-status-badge--${validationInfo.class}`}
                          >
                            {validationInfo.label}
                          </span>
                        </div>
                        <div className="orders-table__cell" data-label="Tanggal Bayar">
                          {tanggalBayar}
                        </div>
                        <div
                          className="orders-table__cell orders-table__cell--actions"
                          data-label="Actions"
                        >
                          <button
                            className="orders-action-btn"
                            title="Detail pembayaran"
                            onClick={() => handleView(payment)}
                          >
                            Detail
                          </button>

                          {canApproveReject && (
                            <>
                              <button
                                className="orders-action-btn"
                                title="Approve"
                                onClick={() => handleApprove(payment)}
                                style={{
                                  background: "#10b981",
                                  color: "#fff",
                                  borderColor: "#10b981",
                                  padding: "0.4rem 0.8rem",
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="orders-action-btn"
                                title="Reject"
                                onClick={() => handleReject(payment)}
                                style={{
                                  background: "#ef4444",
                                  color: "#fff",
                                  borderColor: "#ef4444",
                                  padding: "0.4rem 0.8rem",
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="orders-empty">
                    {orders.length
                      ? "Tidak ada hasil pencarian."
                      : "Loading data pembayaran..."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pagination dengan Next/Previous Button */}
          <div
            className="orders-pagination"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            {/* Previous Button */}
            <button
              className="orders-pagination__btn"
              onClick={handlePrevPage}
              disabled={page === 1 || loading}
              aria-label="Previous page"
              style={{
                padding: "0.75rem 1rem",
                minWidth: "100px",
                background:
                  page === 1 || loading ? "#e5e7eb" : "#f1a124",
                color: page === 1 || loading ? "#9ca3af" : "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor:
                  page === 1 || loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
            >
              <i className="pi pi-chevron-left" />
              Previous
            </button>

            {/* Page Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.95rem",
                color: "var(--dash-text)",
                fontWeight: 500,
              }}
            >
              {loading ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="pi pi-spin pi-spinner" />
                  Loading...
                </span>
              ) : (
                <span>
                  Page {paginationInfo?.current_page || page} of{" "}
                  {paginationInfo?.last_page || "?"}
                  {paginationInfo?.total
                    ? ` (${paginationInfo.total} total)`
                    : ""}
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
                background:
                  !hasMore || loading ? "#e5e7eb" : "#f1a124",
                color: !hasMore || loading ? "#9ca3af" : "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor:
                  !hasMore || loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
            >
              Next
              <i className="pi pi-chevron-right" />
            </button>
          </div>
        </section>

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

          @media (max-width: 768px) {
            .payment-details {
              gap: 0.375rem;
            }

            .payment-main {
              font-size: 0.8125rem;
            }

            .payment-breakdown {
              font-size: 0.6875rem;
              padding: 0.375rem;
            }

            .payment-item {
              font-size: 0.6875rem;
            }
          }
        `}</style>

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

      {/* MODALS */}
      {showView && selectedOrder && (
        <ViewOrders
          order={selectedOrder}
          onClose={() => {
            setShowView(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {showApprove && selectedOrder && (
        <ApproveOrder
          order={selectedOrder}
          onClose={() => {
            setShowApprove(false);
            setSelectedOrder(null);
          }}
          onApprove={onApprove}
        />
      )}

      {showReject && selectedOrder && (
        <RejectOrder
          order={selectedOrder}
          onClose={() => {
            setShowReject(false);
            setSelectedOrder(null);
          }}
          onCloseWithRefresh={async () => {
            setShowReject(false);
            setSelectedOrder(null);
            await requestRefresh();
          }}
          onReject={onReject}
        />
      )}
    </Layout>
  );
}
