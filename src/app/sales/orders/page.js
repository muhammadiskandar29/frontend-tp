"use client";

import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import { toast } from "react-hot-toast";
import { ShoppingCart, Clock, CheckCircle, PartyPopper, XCircle, Filter } from "lucide-react";
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
const PaymentHistoryModal = dynamic(() => import("./paymentHistoryModal"), { ssr: false });
const FilterModal = dynamic(() => import("./filterModal"), { ssr: false });

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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState(null); // [startDate, endDate] atau null
  const [filterPreset, setFilterPreset] = useState("all"); // all | today
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    statusOrder: [],
    statusPembayaran: [],
    sumber: [],
    tanggalRange: null,
    waktuPembayaranRange: null,
  });
  
  // State lainnya
  const [statistics, setStatistics] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState({}); // { orderId: [payments] }
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedOrderIdForHistory, setSelectedOrderIdForHistory] = useState(null);

  const fetchingRef = useRef(false); // Prevent multiple simultaneous fetches
  const searchTimeoutRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 when search changes
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchInput]);

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

      // Build query parameters
      const params = new URLSearchParams({
        page: String(pageNumber),
        per_page: String(perPage),
      });

      // Add search parameter
      if (debouncedSearch && debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      // Add filter parameters
      if (filters.statusOrder.length > 0) {
        params.append("status_order", filters.statusOrder.join(","));
      }
      if (filters.statusPembayaran.length > 0) {
        params.append("status_pembayaran", filters.statusPembayaran.join(","));
      }
      if (filters.sumber.length > 0) {
        params.append("sumber", filters.sumber.join(","));
      }
      if (filters.tanggalRange && Array.isArray(filters.tanggalRange) && filters.tanggalRange.length === 2) {
        params.append("tanggal_from", filters.tanggalRange[0].toISOString().split("T")[0]);
        params.append("tanggal_to", filters.tanggalRange[1].toISOString().split("T")[0]);
      }
      if (filters.waktuPembayaranRange && Array.isArray(filters.waktuPembayaranRange) && filters.waktuPembayaranRange.length === 2) {
        params.append("waktu_pembayaran_from", filters.waktuPembayaranRange[0].toISOString().split("T")[0]);
        params.append("waktu_pembayaran_to", filters.waktuPembayaranRange[1].toISOString().split("T")[0]);
      }

      const res = await fetch(`/api/sales/order?${params.toString()}`, {
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
        // Normalisasi data: pastikan status_pembayaran tetap 4 jika masih ada remaining
        // dan status_order tetap "Proses" (1) meskipun ada payment yang di-reject
        const normalizedData = json.data.map((order) => {
          const totalHarga = Number(order.total_harga || 0);
          const totalPaid = Number(order.total_paid || 0);
          const remaining = order.remaining !== undefined 
            ? Number(order.remaining)
            : (totalHarga - totalPaid);
          
          // LOGIKA STATUS PEMBAYARAN:
          // - Jika sudah lunas (total_paid >= total_harga), set ke 2 (Paid)
          // - Jika masih ada remaining (total_paid < total_harga), set ke 4 (DP)
          // - Status pembayaran harus tetap 4 (DP) sampai remaining = 0
          // - Perubahan status payment individual (approve/reject) hanya mempengaruhi paymentHistoryModal.js, bukan page.js
          let statusPembayaran = order.status_pembayaran;

          if (totalPaid >= totalHarga && totalHarga > 0) {
            statusPembayaran = 2; // Paid
          } else if (totalPaid > 0 && totalPaid < totalHarga) {
            statusPembayaran = 4; // DP (ada pembayaran sebagian)
          } else {
            statusPembayaran = order.status_pembayaran ?? 0; // Unpaid / lainnya
          }
          
          // Pastikan status_order tetap "Proses" (1) meskipun ada payment yang di-reject
          // Status order tidak boleh berubah menjadi "Failed" (3) hanya karena payment di-reject
          // User masih bisa konfirmasi pembayaran lagi jika payment di-reject
          let statusOrder = order.status_order ?? order.status ?? "1";
          // Jika status_order adalah "3" (Failed) tapi masih ada remaining atau belum paid, kembalikan ke "1" (Proses)
          if (statusOrder === "3" || statusOrder === 3) {
            // Cek apakah order sudah benar-benar failed atau hanya payment yang di-reject
            // Jika masih ada remaining atau belum paid, kembalikan ke "Proses"
            if (remaining > 0 || totalPaid < totalHarga || statusPembayaran !== 2) {
              statusOrder = "1"; // Kembalikan ke "Proses"
            }
          }
          
          return {
            ...order,
            status_pembayaran: statusPembayaran,
            status_order: statusOrder,
            total_paid: totalPaid,
            remaining: remaining,
          };
        });
        
        // Selalu replace data (bukan append) - setiap page menampilkan data yang berbeda
        setOrders(normalizedData);

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
      toast.error("Gagal memuat data");
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [debouncedSearch, filters, perPage]);

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

  // Fetch data saat page, search, atau filter berubah
  useEffect(() => {
    if (page > 0 && !loading) {
      fetchOrders(page);
      // Tidak scroll ke atas, tetap di posisi saat ini
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, filters]); // Depend pada page, search, dan filters

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
    if (message) {
      if (type === "error") toast.error(message);
      else toast.success(message);
    }
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

  // Handler untuk apply filters dari modal
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 when filters change
  }, []);

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

  const handleShowPaymentHistory = (order) => {
    if (order?.id) {
      setSelectedOrderIdForHistory(order.id);
      setShowPaymentHistory(true);
    }
  };

  const handleSuccessEdit = async (updatedFromForm) => {
      try {
      if (!selectedOrder?.id) {
        toast.error("Order ID tidak valid");
        return;
      }

      // Cek apakah ini konfirmasi pembayaran (ada status_pembayaran, total_paid, atau remaining)
      const isPaymentConfirmation = 
        updatedFromForm.status_pembayaran !== undefined ||
        updatedFromForm.total_paid !== undefined ||
        updatedFromForm.remaining !== undefined ||
        updatedFromForm.bukti_pembayaran !== undefined;

      // Jika ini konfirmasi pembayaran, langsung update state tanpa memanggil updateOrderAdmin
      // karena konfirmasi pembayaran sudah dilakukan via API order-konfirmasi
      if (isPaymentConfirmation) {
        // Tutup modal
        setShowEdit(false);

        // Hitung remaining untuk menentukan apakah masih DP
        const totalHarga = Number(updatedFromForm.total_harga ?? selectedOrder?.total_harga ?? 0);
        const totalPaid = Number(updatedFromForm.total_paid ?? selectedOrder?.total_paid ?? 0);
        const remaining = updatedFromForm.remaining !== undefined 
          ? Number(updatedFromForm.remaining)
          : (totalHarga - totalPaid);

        // Tentukan status pembayaran:
        // - Jika sudah lunas (total_paid >= total_harga), set ke 2 (Paid)
        // - Jika masih ada remaining (total_paid < total_harga), set ke 4 (DP)
        // - Status pembayaran harus tetap 4 (DP) sampai remaining = 0
        // - Perubahan status payment individual (approve/reject) hanya mempengaruhi paymentHistoryModal.js, bukan page.js
        let finalStatusPembayaran;
        
        if (totalPaid >= totalHarga) {
          // Jika sudah lunas, set ke 2 (Paid)
          finalStatusPembayaran = 2;
        } else if (remaining > 0 || totalPaid < totalHarga) {
          // Jika masih ada remaining, set ke 4 (DP)
          // Ini berlaku untuk konfirmasi pertama kali (dari Unpaid) maupun konfirmasi lanjutan
          finalStatusPembayaran = 4;
        } else {
          // Fallback: gunakan status dari form atau order
          finalStatusPembayaran = updatedFromForm.status_pembayaran ?? selectedOrder?.status_pembayaran ?? 0;
        }

        // Update state orders dengan data dari form (yang sudah diupdate dari konfirmasi pembayaran)
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id
              ? {
                  ...o,
                  ...updatedFromForm,

                  // Pastikan status_pembayaran tetap 4 jika masih ada remaining
                  status_pembayaran: finalStatusPembayaran,

                  // Pastikan total_paid dan remaining tetap ada
                  total_paid: totalPaid,
                  remaining: remaining,

                  // pertahankan relasi supaya view tidak error
                  customer_rel: updatedFromForm.customer_rel || o.customer_rel,
                  produk_rel: updatedFromForm.produk_rel || o.produk_rel,
                }
              : o
          )
        );

        // Reset selected
        setSelectedOrder(null);

        toast.success(updatedFromForm.message || "Pembayaran berhasil dikonfirmasi!");

        // Refresh statistics dan data dari backend
        await Promise.all([loadStatistics(), fetchOrders(page)]);
        return;
      }
  
      // Untuk update order biasa (bukan konfirmasi pembayaran), gunakan updateOrderAdmin
      const result = await updateOrderAdmin(selectedOrder.id, updatedFromForm);
  
      if (result.success) {
        const updatedFromAPI = result.data?.order || result.data;
  
        // Tutup modal
        setShowEdit(false);

        // Hitung remaining untuk menentukan apakah masih DP
        const totalHarga = Number(updatedFromAPI.total_harga ?? selectedOrder?.total_harga ?? 0);
        const totalPaid = Number(updatedFromAPI.total_paid ?? selectedOrder?.total_paid ?? 0);
        const remaining = updatedFromAPI.remaining !== undefined 
          ? Number(updatedFromAPI.remaining)
          : (totalHarga - totalPaid);

        // Pastikan status_pembayaran tetap 4 jika masih ada remaining
        let finalStatusPembayaran = updatedFromAPI.status_pembayaran ?? selectedOrder?.status_pembayaran ?? 0;
        
        // Jika sebelumnya 4 dan masih ada remaining, tetap 4
        if (selectedOrder?.status_pembayaran === 4 && remaining > 0) {
          finalStatusPembayaran = 4;
        } 
        // Jika ada pembayaran tapi belum lunas, set ke 4 (DP)
        else if (totalPaid > 0 && remaining > 0 && totalPaid < totalHarga) {
          finalStatusPembayaran = 4;
        }
  
        // Update state orders agar UI langsung berubah
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id
              ? {
                  ...o,
                  ...updatedFromAPI,

                  // Pastikan status_pembayaran tetap 4 jika masih ada remaining
                  status_pembayaran: finalStatusPembayaran,
                  total_paid: totalPaid,
                  remaining: remaining,
  
                  // pertahankan relasi supaya view tidak error
                  customer_rel: updatedFromAPI.customer_rel || o.customer_rel,
                  produk_rel: updatedFromAPI.produk_rel || o.produk_rel,
                }
              : o
          )
        );
  
        // Reset selected
        setSelectedOrder(null);

        toast.success(result.message || "Order berhasil diupdate!");

        // Refresh statistics
        await loadStatistics();
      } else {
        toast.error(result.message || "Gagal mengupdate order");
      }
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error("Terjadi kesalahan saat mengupdate order");
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
    <Layout title="Manage Orders">
      <div className="dashboard-shell orders-shell">
        <section className="dashboard-hero orders-hero">
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
              <div className="orders-filters" aria-label="Filter pesanan">
                <button
                  type="button"
                  className={`orders-filter-btn ${filterPreset === "all" ? "is-active" : ""}`}
                  onClick={() => setFilterPreset("all")}
                  style={{
                    color: filterPreset === "all" ? "#c85400" : undefined,
                  }}
                >
                  Semua
                </button>
                <button
                  type="button"
                  className={`orders-filter-btn ${filterPreset === "today" ? "is-active" : ""}`}
                  onClick={() => setFilterPreset("today")}
                  style={{
                    color: filterPreset === "today" ? "#c85400" : undefined,
                  }}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  className="orders-filter-btn orders-filter-icon-btn"
                  title="Filter"
                  aria-label="Filter"
                  onClick={() => setShowFilterModal(true)}
                  style={{
                    color: "#c85400",
                  }}
                >
                  <Filter size={16} color="#c85400" />
                </button>
              </div>
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
                    minWidth: "250px"
                  }}
                  inputStyle={{
                    width: "100%",
                    padding: "0.55rem 2.2rem 0.55rem 0.75rem",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
                    background: "var(--dash-surface)",
                    color: "var(--dash-text)",
                    boxShadow: "none",
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
              {dateRange && Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1] && (
                <button
                  onClick={() => setDateRange(null)}
                  className="orders-button orders-button--secondary"
                  style={{ whiteSpace: "nowrap" }}
                >
                  <i className="pi pi-times" style={{ marginRight: "0.25rem" }} />
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="dashboard-summary orders-summary">
          <article className="summary-card summary-card--combined">
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <ShoppingCart size={24} />
              </div>
              <div>
                <p className="summary-card__label">Total orders</p>
                <p className="summary-card__value">{totalOrders}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <Clock size={24} />
              </div>
              <div>
                <p className="summary-card__label">Unpaid</p>
                <p className="summary-card__value">{unpaidOrders}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <Clock size={24} />
              </div>
              <div>
                <p className="summary-card__label">Menunggu</p>
                <p className="summary-card__value">{menungguOrders}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="summary-card__label">Sudah Approve</p>
                <p className="summary-card__value">{approvedOrders}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <XCircle size={24} />
              </div>
              <div>
                <p className="summary-card__label">Ditolak</p>
                <p className="summary-card__value">{ditolakOrders}</p>
              </div>
            </div>
          </article>
        </section>
        
        <section className="panel orders-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Directory</p>
              <h3 className="panel__title">Order roster</h3>
            </div>
            <div className="customers-toolbar-buttons">

            <button 
              className="customers-button customers-button--primary" 
              onClick={() => setShowAdd(true)}
              style={{
                background: "#f1a124",
                color: "#fff",
                border: "none",
                outline: "none",
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.background = "#c85400";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.background = "#f1a124";
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid rgba(255, 108, 0, 0.3)";
                e.currentTarget.style.outlineOffset = "2px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "none";
              }}
            >
                + Tambah Pesanan
              </button>
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
                {orders.length > 0 ? (
                  orders.map((order, i) => {
                    // Handle produk name - dari produk_rel
                    const produkNama = order.produk_rel?.nama || "-";

                    // Handle customer name - dari customer_rel
                    const customerNama = order.customer_rel?.nama || "-";

                    // Get Status Order
                    const statusOrderRaw = order.status_order ?? order.status; // fallback ke order.status jika status_order kosong
                    const statusOrderValue = statusOrderRaw !== undefined && statusOrderRaw !== null
                      ? statusOrderRaw.toString()
                      : "";
                    const statusOrderInfo = STATUS_ORDER_MAP[statusOrderValue] || { label: "-", class: "default" };

                    // Get Status Pembayaran
                    // Handle string "4" atau number 4
                    let statusPembayaranValue = order.status_pembayaran;
                    if (statusPembayaranValue === null || statusPembayaranValue === undefined) {
                      statusPembayaranValue = 0;
                    } else {
                      // Konversi ke number untuk konsistensi
                      statusPembayaranValue = Number(statusPembayaranValue);
                      if (isNaN(statusPembayaranValue)) {
                        statusPembayaranValue = 0;
                      }
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
                            
                            
                            {/* Total Paid & Remaining
                                NOTE:
                                - Hanya tampil untuk order dengan status pembayaran DP (4)
                                - Untuk pembayaran full (bukan DP), meskipun total_paid > 0,
                                  tidak menampilkan breakdown agar hanya terlihat total harga saja
                            */}
                            {statusPembayaranValue === 4 && (
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
          refreshOrders={() => requestRefresh("")}
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
          color: #c85400;
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
      <PaymentHistoryModal
        orderId={selectedOrderIdForHistory}
        isOpen={showPaymentHistory}
        onClose={() => {
          setShowPaymentHistory(false);
          setSelectedOrderIdForHistory(null);
        }}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </Layout>
  );
}
