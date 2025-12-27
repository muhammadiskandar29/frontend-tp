"use client";

import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import { ShoppingCart, Clock, CheckCircle, PartyPopper, XCircle, Filter } from "lucide-react";
import { Calendar } from "primereact/calendar";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "@/styles/sales/orders-page.css";
import { getOrders, updateOrderAdmin, getOrderStatistics } from "@/lib/sales/orders";
import { api } from "@/lib/api";
import { createPortal } from "react-dom";

/**
 * Simple debounce hook to avoid rerunning expensive computations
 */
function useDebouncedValue(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Lazy load modals - sama seperti customers
// CSS di-import di dalam komponen masing-masing
const ViewOrders = dynamic(() => import("./viewOrders"), { ssr: false });
const UpdateOrders = dynamic(() => import("./updateOrders"), { ssr: false });
const AddOrders = dynamic(() => import("./addOrders"), { ssr: false });
const PaymentHistoryModal = dynamic(() => import("./paymentHistoryModal"), { ssr: false });

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
  const debouncedSearch = useDebouncedValue(searchInput, 500); // Debounce 500ms
  const [dateRange, setDateRange] = useState(null); // [startDate, endDate] atau null
  const [filterPreset, setFilterPreset] = useState("all"); // all | today
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]); // Array of product IDs
  const [selectedProductsData, setSelectedProductsData] = useState([]); // Array of full product objects
  const [selectedStatusOrder, setSelectedStatusOrder] = useState([]); // Array of status order values
  const [selectedStatusPembayaran, setSelectedStatusPembayaran] = useState([]); // Array of status pembayaran values
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  
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

  // 🔹 Search produk untuk filter
  const handleSearchProduct = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      setProductResults([]);
      return;
    }

    try {
      const res = await api("/sales/produk", { method: "GET" });
      if (res?.success && Array.isArray(res.data)) {
        const filtered = res.data.filter((prod) =>
          (prod.status === "1" || prod.status === 1) &&
          prod.nama?.toLowerCase().includes(keyword.toLowerCase())
        );
        setProductResults(filtered);
      } else {
        setProductResults([]);
      }
    } catch (err) {
      console.error("Error searching products:", err);
      setProductResults([]);
    }
  }, []);

  // Debounce product search
  const debouncedProductSearch = useDebouncedValue(productSearch, 300);

  useEffect(() => {
    if (debouncedProductSearch.trim().length >= 2) {
      handleSearchProduct(debouncedProductSearch);
    } else {
      setProductResults([]);
    }
  }, [debouncedProductSearch, handleSearchProduct]);

  // 🔹 Handle product selection (multiple)
  const handleToggleProduct = useCallback((product) => {
    const productId = typeof product === 'object' ? product.id : product;
    const productData = typeof product === 'object' ? product : productResults.find(p => p.id === productId);
    
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        // Remove from selected
        setSelectedProductsData((prevData) => prevData.filter(p => p.id !== productId));
        return prev.filter((id) => id !== productId);
      } else {
        // Add to selected
        if (productData) {
          setSelectedProductsData((prevData) => {
            // Check if already exists
            if (prevData.find(p => p.id === productId)) {
              return prevData;
            }
            return [...prevData, productData];
          });
        }
        return [...prev, productId];
      }
    });
  }, [productResults]);

  // 🔹 Handle status order toggle (multiple)
  const handleToggleStatusOrder = useCallback((status) => {
    setSelectedStatusOrder((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  }, []);

  // 🔹 Handle status pembayaran toggle (multiple)
  const handleToggleStatusPembayaran = useCallback((status) => {
    setSelectedStatusPembayaran((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  }, []);

  // 🔹 Reset all filters
  const handleResetFilters = useCallback(() => {
    setDateRange(null);
    setSelectedProducts([]);
    setSelectedProductsData([]);
    setSelectedStatusOrder([]);
    setSelectedStatusPembayaran([]);
    setProductSearch("");
    setProductResults([]);
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

      // Build query parameters
      const params = new URLSearchParams({
        page: String(pageNumber),
        per_page: String(perPage),
      });

      // Add search parameter (gunakan debouncedSearch untuk konsistensi)
      if (debouncedSearch && debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      // Add date range filter (tanggal orderan)
      if (dateRange && Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        const fromDate = new Date(dateRange[0]);
        const toDate = new Date(dateRange[1]);
        // Set time to start and end of day
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        params.append("tanggal_from", fromDate.toISOString().split('T')[0]);
        params.append("tanggal_to", toDate.toISOString().split('T')[0]);
      }

      // Add status order filter (multiple)
      if (selectedStatusOrder.length > 0) {
        selectedStatusOrder.forEach(status => {
          params.append("status_order", status);
        });
      }

      // Add status pembayaran filter (multiple)
      if (selectedStatusPembayaran.length > 0) {
        selectedStatusPembayaran.forEach(status => {
          params.append("status_pembayaran", status);
        });
      }

      // Add produk filter (multiple) - jika backend support produk_id
      if (selectedProducts.length > 0) {
        selectedProducts.forEach(productId => {
          params.append("produk_id", productId);
        });
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
          
          // Ambil waktu_pembayaran dari order_payment_rel jika ada
          // Prioritas: ambil dari payment yang statusnya approved (status "2") atau yang terbaru
          let waktuPembayaran = order.waktu_pembayaran || "";
          if (!waktuPembayaran && order.order_payment_rel && Array.isArray(order.order_payment_rel) && order.order_payment_rel.length > 0) {
            // Cari payment yang statusnya approved (status "2") terlebih dahulu
            const approvedPayment = order.order_payment_rel.find(p => String(p.status).trim() === "2");
            if (approvedPayment && approvedPayment.create_at) {
              // Format create_at dari "2025-12-27 08:57:53" ke format yang diinginkan
              const date = new Date(approvedPayment.create_at);
              const pad = (n) => n.toString().padStart(2, "0");
              waktuPembayaran = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
            } else {
              // Jika tidak ada yang approved, ambil yang terbaru (create_at terakhir)
              const latestPayment = order.order_payment_rel.sort((a, b) => {
                const dateA = new Date(a.create_at || 0);
                const dateB = new Date(b.create_at || 0);
                return dateB - dateA;
              })[0];
              if (latestPayment && latestPayment.create_at) {
                const date = new Date(latestPayment.create_at);
                const pad = (n) => n.toString().padStart(2, "0");
                waktuPembayaran = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
              }
            }
          }
          
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
            waktu_pembayaran: waktuPembayaran, // Pastikan waktu_pembayaran ada
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
      setToast({ show: true, message: "Gagal memuat data", type: "error" });
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [debouncedSearch, perPage, dateRange, selectedStatusOrder, selectedStatusPembayaran, selectedProducts]);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Initial load: fetch page 1
  useEffect(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Hanya sekali saat mount

  // Reset to page 1 when search changes (sama seperti customers)
  useEffect(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]); // Reset when search changes

  // Fetch data saat page atau debouncedSearch berubah
  useEffect(() => {
    if (page > 0) {
      fetchOrders(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]); // Depend pada page dan debouncedSearch

  // Scroll to top and prevent body scroll when filter modal opens
  useEffect(() => {
    if (showFilterModal && typeof window !== "undefined") {
      // Get current scroll position
      const scrollY = window.scrollY;
      
      // Force scroll to top immediately BEFORE locking body
      window.scrollTo(0, 0);
      
      // Then prevent body scroll and lock position
      requestAnimationFrame(() => {
        document.body.style.position = "fixed";
        document.body.style.top = "0";
        document.body.style.width = "100%";
        document.body.style.overflow = "hidden";
      });
      
      return () => {
        // Restore body scroll
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [showFilterModal]);

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
      setToast({ show: true, message, type });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    }
  };

  // 🔹 Format date range untuk display
  const formatDateRange = useCallback((range) => {
    if (!range || !Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
      return "Pilih tanggal";
    }
    
    const formatDate = (date) => {
      const d = new Date(date);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };
    
    return `${formatDate(range[0])} - ${formatDate(range[1])}`;
  }, []);

  // === Helper ===
  const computeStatusBayar = useCallback((o) => {
    // Cek dari order_payment_rel jika ada
    if (o.order_payment_rel && Array.isArray(o.order_payment_rel) && o.order_payment_rel.length > 0) {
      // Jika ada payment yang approved (status "2"), berarti sudah paid
      const hasApprovedPayment = o.order_payment_rel.some(p => String(p.status).trim() === "2");
      if (hasApprovedPayment) {
        return 1; // Paid
      }
      // Jika ada payment yang pending (status "1"), berarti menunggu
      const hasPendingPayment = o.order_payment_rel.some(p => String(p.status).trim() === "1");
      if (hasPendingPayment) {
        return 1; // Menunggu (dianggap sebagai status pembayaran yang sudah ada)
      }
    }
    // Fallback ke logika lama
    if (
      o.bukti_pembayaran &&
      o.bukti_pembayaran !== "" &&
      o.waktu_pembayaran &&
      o.waktu_pembayaran !== ""
    ) {
      return 1; // Paid
    }
    return 0; // Unpaid
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
        setToast({ show: true, message: "Order ID tidak valid", type: "error" });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
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

        setToast({ show: true, message: updatedFromForm.message || "Pembayaran berhasil dikonfirmasi!", type: "success" });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);

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

        setToast({ show: true, message: result.message || "Order berhasil diupdate!", type: "success" });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);

        // Refresh statistics
        await loadStatistics();
      } else {
        setToast({ show: true, message: result.message || "Gagal mengupdate order", type: "error" });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
      }
    } catch (err) {
      console.error("Error updating order:", err);
      setToast({ show: true, message: "Terjadi kesalahan saat mengupdate order", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
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
      <div className="orders-shell">
        <section className="orders-hero">
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
              {/* Filter Icon Button */}
              <button
                type="button"
                onClick={() => setShowFilterModal(true)}
                className="orders-filter-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.6rem",
                }}
                title="Filter"
              >
                <Filter size={16} />
              </button>
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
                    border: "1px solid #e9ecef",
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
                    background: "#ffffff",
                    color: "#212529",
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
              {(dateRange && Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) ||
               selectedProducts.length > 0 ||
               selectedStatusOrder.length > 0 ||
               selectedStatusPembayaran.length > 0 ? (
                <button
                  onClick={handleResetFilters}
                  className="orders-filter-btn"
                  style={{
                    whiteSpace: "nowrap",
                    padding: "0.55rem 0.75rem",
                    fontSize: "0.85rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                  title="Reset Filter"
                >
                  <i className="pi pi-times" style={{ fontSize: "0.85rem" }} />
                  Reset
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="orders-summary">
          <article className="summary-card summary-card--combined">
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <ShoppingCart size={22} />
              </div>
              <div>
                <p className="summary-card__label">Total orders</p>
                <p className="summary-card__value">{totalOrders}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <Clock size={22} />
              </div>
              <div>
                <p className="summary-card__label">Unpaid</p>
                <p className="summary-card__value">{unpaidOrders}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <Clock size={22} />
              </div>
              <div>
                <p className="summary-card__label">Menunggu</p>
                <p className="summary-card__value">{menungguOrders}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="summary-card__label">Sudah Approve</p>
                <p className="summary-card__value">{approvedOrders}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <XCircle size={22} />
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
                          {order.waktu_pembayaran ? (
                            <span style={{ fontSize: "0.875rem", color: "#374151", whiteSpace: "nowrap" }}>
                              {order.waktu_pembayaran}
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.875rem", color: "#9ca3af", fontStyle: "italic" }}>-</span>
                          )}
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
      {/* Filter Modal */}
      {showFilterModal && typeof window !== "undefined" && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setShowFilterModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(17, 24, 39, 0.55)",
            backdropFilter: "blur(3px)",
            margin: 0,
            padding: "1rem",
            boxSizing: "border-box",
            overflowY: "auto",
            overflowX: "hidden",
          }}
          onWheel={(e) => {
            // Prevent body scroll when scrolling modal content
            e.stopPropagation();
          }}
        >
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: "600px", 
              width: "90%",
              position: "relative",
              zIndex: 10000,
              margin: "auto",
              flexShrink: 0,
            }}
          >
            <div className="modal-header" style={{ 
              padding: "1.5rem 1.75rem",
              borderBottom: "1px solid #e5e7eb",
              background: "#ffffff"
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: "1.25rem", 
                fontWeight: "700", 
                color: "#111827",
                letterSpacing: "-0.01em"
              }}>
                Filter Orders
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowFilterModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                <i className="pi pi-times" style={{ fontSize: "1.125rem" }} />
              </button>
            </div>
            <div className="modal-body" style={{ 
              maxHeight: "70vh", 
              overflowY: "auto", 
              padding: "1.75rem",
              background: "#ffffff"
            }}>
              {/* Produk Filter */}
              <div style={{ marginBottom: "2rem" }}>
                <label className="field-label" style={{ 
                  marginBottom: "0.875rem", 
                  display: "block",
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  color: "#111827",
                  letterSpacing: "-0.01em"
                }}>
                  Produk
                </label>
                <div style={{ position: "relative", marginBottom: "0.875rem" }}>
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="field-input"
                    style={{ 
                      width: "100%", 
                      padding: "0.875rem 2.75rem 0.875rem 1rem",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "0.625rem",
                      fontSize: "0.9375rem",
                      background: "#ffffff",
                      transition: "all 0.2s",
                      color: "#111827",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#ff6c00";
                      e.target.style.boxShadow = "0 0 0 3px rgba(255, 108, 0, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
                    }}
                  />
                  <span className="pi pi-search" style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    fontSize: "1rem",
                    pointerEvents: "none",
                  }} />
                </div>
                {/* Show selected products first, then search results */}
                {(selectedProductsData.length > 0 || productResults.length > 0) && (
                  <div style={{
                    marginTop: "0.75rem",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "0.625rem",
                    maxHeight: "280px",
                    overflowY: "auto",
                    background: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  }}>
                    {/* Selected products section */}
                    {selectedProductsData.length > 0 && (
                      <>
                        {selectedProductsData.map((prod) => {
                          const isSelected = selectedProducts.includes(prod.id);
                          return (
                            <div
                              key={`selected-${prod.id}`}
                              onClick={() => handleToggleProduct(prod)}
                              style={{
                                padding: "0.875rem 1.125rem",
                                cursor: "pointer",
                                borderBottom: "1px solid #f3f4f6",
                                background: isSelected ? "#fff5ed" : "#ffffff",
                                borderLeft: isSelected ? "4px solid #ff6c00" : "4px solid transparent",
                                transition: "all 0.15s",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = "#f9fafb";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = "#ffffff";
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  cursor: "pointer",
                                  accentColor: "#ff6c00",
                                }}
                              />
                              <span style={{
                                color: isSelected ? "#c85400" : "#111827",
                                fontWeight: isSelected ? "600" : "500",
                                fontSize: "0.9375rem",
                                flex: 1,
                              }}>
                                {prod.nama}
                              </span>
                              {isSelected && (
                                <span style={{
                                  fontSize: "0.75rem",
                                  color: "#c85400",
                                  fontWeight: "600",
                                  background: "#fff5ed",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "0.25rem",
                                }}>
                                  Dipilih
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {productResults.length > 0 && productResults.some(prod => !selectedProducts.includes(prod.id)) && (
                          <div style={{
                            padding: "0.5rem 1rem",
                            background: "#f9fafb",
                            borderTop: "1px solid #e5e7eb",
                            borderBottom: "1px solid #e5e7eb",
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}>
                            Hasil Pencarian
                          </div>
                        )}
                      </>
                    )}
                    {/* Search results (exclude already selected) */}
                    {productResults
                      .filter(prod => !selectedProducts.includes(prod.id))
                      .map((prod) => {
                        return (
                          <div
                            key={`result-${prod.id}`}
                            onClick={() => handleToggleProduct(prod)}
                            style={{
                              padding: "0.875rem 1.125rem",
                              cursor: "pointer",
                              borderBottom: "1px solid #f3f4f6",
                              background: "#ffffff",
                              borderLeft: "4px solid transparent",
                              transition: "all 0.15s",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f9fafb";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#ffffff";
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => {}}
                              style={{
                                width: "18px",
                                height: "18px",
                                cursor: "pointer",
                                accentColor: "#ff6c00",
                              }}
                            />
                            <span style={{
                              color: "#111827",
                              fontWeight: "500",
                              fontSize: "0.9375rem",
                              flex: 1,
                            }}>
                              {prod.nama}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
                {selectedProductsData.length > 0 && (
                  <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {selectedProductsData.map((product) => (
                      <span
                        key={product.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.5rem 0.75rem",
                          background: "#fff5ed",
                          border: "1px solid #ff6c00",
                          borderRadius: "0.375rem",
                          fontSize: "0.8125rem",
                          color: "#c85400",
                          fontWeight: "500",
                        }}
                      >
                        {product.nama}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleProduct(product);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#c85400",
                            cursor: "pointer",
                            padding: 0,
                            margin: 0,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <i className="pi pi-times" style={{ fontSize: "0.75rem" }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Order Filter */}
              <div style={{ marginBottom: "2rem" }}>
                <label className="field-label" style={{ 
                  marginBottom: "0.875rem", 
                  display: "block",
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  color: "#111827",
                  letterSpacing: "-0.01em"
                }}>
                  Status Order
                </label>
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "0.625rem",
                  background: "#f9fafb",
                  padding: "0.75rem",
                  borderRadius: "0.625rem",
                  border: "1.5px solid #e5e7eb",
                }}>
                  {Object.entries(STATUS_ORDER_MAP).map(([value, { label }]) => {
                    const isChecked = selectedStatusOrder.includes(value);
                    return (
                      <label
                        key={value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          padding: "0.75rem 1rem",
                          borderRadius: "0.5rem",
                          background: isChecked ? "#fff5ed" : "transparent",
                          border: isChecked ? "1.5px solid #ff6c00" : "1.5px solid transparent",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "transparent";
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStatusOrder(value)}
                          style={{ 
                            marginRight: "0.75rem",
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                            accentColor: "#ff6c00",
                          }}
                        />
                        <span style={{
                          color: isChecked ? "#c85400" : "#111827",
                          fontWeight: isChecked ? "600" : "500",
                          fontSize: "0.9375rem",
                        }}>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Pembayaran Filter */}
              <div style={{ marginBottom: "2rem" }}>
                <label className="field-label" style={{ 
                  marginBottom: "0.875rem", 
                  display: "block",
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  color: "#111827",
                  letterSpacing: "-0.01em"
                }}>
                  Status Pembayaran
                </label>
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "0.625rem",
                  background: "#f9fafb",
                  padding: "0.75rem",
                  borderRadius: "0.625rem",
                  border: "1.5px solid #e5e7eb",
                }}>
                  {Object.entries(STATUS_PEMBAYARAN_MAP).map(([value, { label }]) => {
                    const isChecked = selectedStatusPembayaran.includes(String(value));
                    return (
                      <label
                        key={value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          padding: "0.75rem 1rem",
                          borderRadius: "0.5rem",
                          background: isChecked ? "#fff5ed" : "transparent",
                          border: isChecked ? "1.5px solid #ff6c00" : "1.5px solid transparent",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "transparent";
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStatusPembayaran(String(value))}
                          style={{ 
                            marginRight: "0.75rem",
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                            accentColor: "#ff6c00",
                          }}
                        />
                        <span style={{
                          color: isChecked ? "#c85400" : "#111827",
                          fontWeight: isChecked ? "600" : "500",
                          fontSize: "0.9375rem",
                        }}>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ 
              display: "flex", 
              justifyContent: "flex-end", 
              gap: "0.75rem", 
              padding: "1.5rem 1.75rem",
              borderTop: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#ffffff",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "0.625rem",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "0.9375rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <i className="pi pi-times" style={{ fontSize: "0.875rem" }} />
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#ff6c00",
                  border: "none",
                  borderRadius: "0.625rem",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "0.9375rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: "0 2px 4px rgba(255, 108, 0, 0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e55a00";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(255, 108, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ff6c00";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(255, 108, 0, 0.2)";
                }}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <PaymentHistoryModal
        orderId={selectedOrderIdForHistory}
        isOpen={showPaymentHistory}
        onClose={() => {
          setShowPaymentHistory(false);
          setSelectedOrderIdForHistory(null);
        }}
      />

      {/* Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "12px 20px",
            background: toast.type === "error" ? "#ef4444" : "#10b981",
            color: "#fff",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, message: "", type: "success" })}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ×
          </button>
        </div>
      )}

    </Layout>
  );
}
