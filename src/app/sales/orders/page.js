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
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [produkMap, setProdukMap] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [needsRefresh, setNeedsRefresh] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const itemsPerPage = 15;

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

  // 🔹 Load data dari backend - Optimized dengan useCallback dan prevent duplicate fetch
  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found");
        setNeedsRefresh(false);
        return;
      }

      // Fetch produk, orders, dan statistics secara parallel untuk optimasi
      const [produkResponse, ordersResult] = await Promise.all([
        // Ambil produk melalui Next.js proxy
        fetch("/api/sales/produk", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).then(res => res.json()).catch(err => {
          console.error("Error fetching produk:", err);
          return { success: false, data: [] };
        }),
        // Ambil orders dengan pagination - server-side pagination
        getOrders(currentPage, itemsPerPage).catch(err => {
          console.error("Error fetching orders:", err);
          return { data: [], total: 0, last_page: 1 };
        })
      ]);
      
      // Handle produk data
      if (produkResponse.success && Array.isArray(produkResponse.data)) {
        const mapProduk = {};
        produkResponse.data.forEach((p) => {
          mapProduk[p.id] = p.nama;
        });
        setProdukMap(mapProduk);
      }
      
      // Handle orders data - response sudah dalam format { data, total, last_page, current_page, per_page }
      const finalOrders = Array.isArray(ordersResult.data) ? ordersResult.data : [];
      
      // Update pagination info from response
      console.log("📊 Orders Result:", ordersResult);
      
      // Priority 1: Use pagination info from API response if available
      if (ordersResult.total !== undefined && ordersResult.total > 0) {
        setTotalOrdersCount(ordersResult.total);
        const calculatedPages = Math.ceil(ordersResult.total / itemsPerPage);
        const lastPage = ordersResult.last_page || calculatedPages || 1;
        setTotalPages(lastPage);
        console.log("📊 Pagination Info from API:", {
          total: ordersResult.total,
          last_page: lastPage,
          current_page: ordersResult.current_page || currentPage,
          per_page: itemsPerPage
        });
      } 
      // Priority 2: Use statistics.total_order if available (fallback when API doesn't return pagination metadata)
      else if (statistics && statistics.total_order !== undefined && statistics.total_order > 0) {
        const totalFromStats = statistics.total_order;
        setTotalOrdersCount(totalFromStats);
        const calculatedPages = Math.ceil(totalFromStats / itemsPerPage);
        setTotalPages(calculatedPages);
        console.log("📊 Pagination Info from Statistics:", {
          total: totalFromStats,
          last_page: calculatedPages,
          current_page: currentPage,
          per_page: itemsPerPage,
          note: "Using statistics API as fallback"
        });
      }
      // Priority 3: If we have 15 items (full page), use statistics to calculate total pages
      else if (finalOrders.length >= itemsPerPage) {
        // If we got a full page (15 items), there's likely more data
        // Try to use statistics.total_order if available, otherwise assume at least 2 pages
        if (statistics && statistics.total_order !== undefined && statistics.total_order > 0) {
          const totalFromStats = statistics.total_order;
          setTotalOrdersCount(totalFromStats);
          const calculatedPages = Math.ceil(totalFromStats / itemsPerPage);
          setTotalPages(calculatedPages);
          console.log("📊 Pagination Info from Statistics (full page detected):", {
            total: totalFromStats,
            last_page: calculatedPages,
            current_page: currentPage,
            per_page: itemsPerPage
          });
        } else {
          // Fallback: assume at least 2 pages if we got full page
          setTotalOrdersCount(finalOrders.length);
          setTotalPages(2);
          console.log("⚠️ No pagination info and no statistics, but got full page. Assuming at least 2 pages.");
        }
      }
      // Priority 4: Less than full page, probably last page
      else if (finalOrders.length > 0) {
        setTotalOrdersCount(finalOrders.length);
        setTotalPages(1);
        console.log("⚠️ No pagination info, using fallback (less than full page)");
      } 
      // No data
      else {
        setTotalOrdersCount(0);
        setTotalPages(1);
      }

      // Map customer
      const mapCustomer = {};
      finalOrders.forEach((o) => {
        if (o.customer_rel?.id) {
          mapCustomer[o.customer_rel.id] = o.customer_rel.nama;
        } else if (o.customer && typeof o.customer === "object" && o.customer.id) {
          mapCustomer[o.customer.id] = o.customer.nama || "-";
        }
      });
      
      setCustomers(mapCustomer);
      setOrders(finalOrders);
      setNeedsRefresh(false);
    } catch (err) {
      console.error("Error load data:", err);
      showToast("Gagal memuat data", "error");
      setNeedsRefresh(false);
    }
  }, [currentPage, itemsPerPage, statistics]); // Include statistics untuk fallback pagination calculation

  // Load statistics on mount
  // Load statistics FIRST, then load data
  useEffect(() => {
    const initializeData = async () => {
      // Load statistics first
      await loadStatistics();
      // Then load data (which will use statistics for pagination)
      setNeedsRefresh(true);
    };
    initializeData();
  }, [loadStatistics]);

  // Load data when needsRefresh is true
  useEffect(() => {
    if (needsRefresh) {
      loadData();
    }
  }, [needsRefresh, loadData]); // Include loadData in dependencies

  // 🔹 Direct refresh function that loads data immediately - Reuse loadData
  const refreshData = useCallback(async () => {
    setNeedsRefresh(true);
    await loadData();
  }, [loadData, currentPage]);

  const requestRefresh = async (message, type = "success") => {
    // Reset to first page first
    setCurrentPage(1);
    // Refresh statistics and data
    await Promise.all([loadStatistics(), refreshData()]);
    // Show success message after refresh completes
    showToast(message, type);
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

  // === FILTER SEARCH ===
  // Note: Search dilakukan client-side dari data yang sudah di-fetch per page
  const filteredOrders = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((o) => {
      const prod = (o.produk_rel?.nama || produkMap[o.produk] || "").toString();
      const cust = (o.customer_rel?.nama || customers[o.customer] || "").toString();
      return (
        prod.toLowerCase().includes(term) ||
        cust.toLowerCase().includes(term)
      );
    });
  }, [orders, debouncedSearch, produkMap, customers]);

  // === PAGINATION ===
  // Pagination dilakukan di server-side dengan parameter page dan per_page
  // Setiap perubahan page akan trigger fetch baru dari API
  const paginatedData = useMemo(() => {
    // Jika ada search, filter data yang sudah di-fetch dari current page
    // Jika tidak ada search, langsung gunakan data dari server (sudah di-paginate)
    return filteredOrders;
  }, [filteredOrders]);

  // Reset ke page 1 saat search berubah
  useEffect(() => {
    if (debouncedSearch.trim() && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  // Update totalPages when statistics changes (if API doesn't provide pagination metadata)
  // This ensures pagination works even when API response doesn't include pagination metadata
  useEffect(() => {
    if (statistics && statistics.total_order !== undefined && statistics.total_order > 0) {
      const calculatedPages = Math.ceil(statistics.total_order / itemsPerPage);
      // Always update if calculated pages is greater than current totalPages
      // This ensures statistics is used to calculate pagination
      if (calculatedPages > totalPages) {
        setTotalPages(calculatedPages);
        setTotalOrdersCount(statistics.total_order);
        console.log("🔄 Updated pagination from statistics:", {
          total: statistics.total_order,
          last_page: calculatedPages,
          current_page: currentPage,
          previous_totalPages: totalPages
        });
      }
    }
  }, [statistics, itemsPerPage]);

  // Reload data saat currentPage berubah (server-side pagination)
  // Setiap kali page berubah, fetch data baru dari API dengan page yang sesuai
  useEffect(() => {
    // Reload data saat currentPage berubah (kecuali saat initial mount)
    if (currentPage > 0) {
      console.log("🔄 Page changed to:", currentPage, "- Fetching data...");
      setNeedsRefresh(true);
    }
  }, [currentPage]);

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

        // Refresh statistics and data
        await Promise.all([loadStatistics(), refreshData()]);
      } else {
        showToast(result.message || "Gagal mengupdate order", "error");
      }
    } catch (err) {
      console.error("Error updating order:", err);
      showToast("Terjadi kesalahan saat mengupdate order", "error");
      await refreshData();
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
                placeholder="Cari customer atau produk..."
                className="orders-search__input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="orders-search__icon pi pi-search" />
            </div>
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
            <span className="panel__meta">{totalOrdersCount || filteredOrders.length} orders</span>
          </div>

          <div className="orders-table__wrapper">
            <div className="orders-table">
              <div className="orders-table__head">
                {ORDERS_COLUMNS.map((column) => (
                  <span key={column}>{column}</span>
                ))}
              </div>
              <div className="orders-table__body">
                {paginatedData.length > 0 ? (
                  paginatedData.map((order, i) => {
                    // Handle produk name - ensure it's always a string
                    let produkNama = "-";
                    if (order.produk_rel?.nama) {
                      produkNama = String(order.produk_rel.nama);
                    } else if (order.produk) {
                      const produkId = typeof order.produk === "object" ? order.produk?.id : order.produk;
                      produkNama = produkMap[produkId] || (typeof order.produk === "object" ? order.produk?.nama : String(order.produk)) || "-";
                    }

                    // Handle customer name - ensure it's always a string
                    let customerNama = "-";
                    if (order.customer_rel?.nama) {
                      customerNama = String(order.customer_rel.nama);
                    } else if (order.customer) {
                      const customerId = typeof order.customer === "object" ? order.customer?.id : order.customer;
                      customerNama = customers[customerId] || (typeof order.customer === "object" ? order.customer?.nama : String(order.customer)) || "-";
                    }

                    const statusBayar = computeStatusBayar(order);
                    const statusLabel = STATUS_MAP[statusBayar] || "Unpaid";

                    return (
                      <div className="orders-table__row" key={order.id || `${order.id}-${i}`}>
                        <div className="orders-table__cell" data-label="#">
                          {(currentPage - 1) * itemsPerPage + i + 1}
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

          {/* Pagination - Always show pagination controls */}
          <div className="orders-pagination">
            <button
              className="orders-pagination__btn"
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1);
                console.log("⬅️ Previous page clicked, going to page:", newPage);
                setCurrentPage(newPage);
              }}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <i className="pi pi-chevron-left" />
            </button>
            <span className="orders-pagination__info">
              Page {currentPage} of {totalPages || 1} ({totalOrdersCount > 0 ? totalOrdersCount : (filteredOrders.length || orders.length)} total)
            </span>
            <button
              className="orders-pagination__btn"
              onClick={() => {
                const maxPage = totalPages || 1;
                const newPage = Math.min(maxPage, currentPage + 1);
                console.log("➡️ Next page clicked, going to page:", newPage, "of", maxPage);
                console.log("📊 Current state:", { 
                  currentPage, 
                  totalPages, 
                  totalOrdersCount, 
                  ordersLength: orders.length,
                  itemsPerPage,
                  canGoNext: currentPage < maxPage
                });
                setCurrentPage(newPage);
              }}
              disabled={(() => {
                // Simple: disable if we're on the last page
                // totalPages should be calculated from statistics.total_order (128 / 15 = 9 pages)
                const maxPage = totalPages || 1;
                const isDisabled = currentPage >= maxPage;
                
                console.log("🔘 Next button state:", { 
                  currentPage, 
                  maxPage, 
                  totalPages,
                  totalOrdersCount,
                  isDisabled,
                  ordersLength: orders.length
                });
                
                return isDisabled;
              })()}
              aria-label="Next page"
            >
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
            customer:
              selectedOrder.customer_rel?.nama ||
              (typeof selectedOrder.customer === "object"
                ? selectedOrder.customer?.nama
                : customers[selectedOrder.customer]) ||
              "-",
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
            customer:
              selectedOrder.customer_rel?.nama ||
              (typeof selectedOrder.customer === "object"
                ? selectedOrder.customer?.nama
                : customers[selectedOrder.customer]) ||
              "-",
          }}
          onClose={() => {
            setShowEdit(false);
            setSelectedOrder(null);
            setNeedsRefresh(true);  // ⬅️ ini auto refresh
          }}
          onSave={handleSuccessEdit}
          setToast={setToast}
          refreshOrders={() => setNeedsRefresh(true)}
        />
      )}
    </Layout>
  );
}
