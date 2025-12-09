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
  // Server-side pagination state
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [produkMap, setProdukMap] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [needsRefresh, setNeedsRefresh] = useState(true);
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

  // 🔹 Load data dari backend - Server-side pagination
  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found");
        setNeedsRefresh(false);
        return;
      }

      // Fetch produk dan orders secara parallel
      const [produkResponse, ordersResult] = await Promise.all([
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
      
      // Handle orders data
      const finalOrders = Array.isArray(ordersResult.data) ? ordersResult.data : [];
      
      // Update pagination info from response
      if (ordersResult.total !== undefined && ordersResult.total > 0) {
        setTotalOrdersCount(ordersResult.total);
        const calculatedPages = Math.ceil(ordersResult.total / itemsPerPage);
        const lastPage = ordersResult.last_page || calculatedPages || 1;
        setTotalPages(lastPage);
      } else if (statistics && statistics.total_order !== undefined && statistics.total_order > 0) {
        const totalFromStats = statistics.total_order;
        setTotalOrdersCount(totalFromStats);
        const calculatedPages = Math.ceil(totalFromStats / itemsPerPage);
        setTotalPages(calculatedPages);
      } else if (finalOrders.length >= itemsPerPage) {
        // Jika dapat 15 data (full page), kemungkinan masih ada data
        // Set totalPages minimal 2 agar button Load More muncul
        setTotalPages(2);
        // Jika statistics tersedia, gunakan untuk totalOrdersCount
        if (statistics && statistics.total_order) {
          setTotalOrdersCount(statistics.total_order);
          const calculatedPages = Math.ceil(statistics.total_order / itemsPerPage);
          setTotalPages(calculatedPages);
        } else {
          // Fallback: set totalOrdersCount lebih besar dari current untuk trigger button
          setTotalOrdersCount(finalOrders.length + 1);
        }
      } else {
        // Kurang dari 15 data, berarti sudah di page terakhir
        setTotalOrdersCount(finalOrders.length);
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
      
      setCustomers(prev => ({ ...prev, ...mapCustomer }));
      
      // Append data untuk page > 1, replace untuk page 1
      setOrders(prev => {
        if (currentPage === 1) {
          // Page 1: replace semua data
          return finalOrders;
        } else {
          // Page > 1: append data baru, hindari duplikasi berdasarkan ID
          const existingIds = new Set(prev.map(o => o.id));
          const uniqueNewOrders = finalOrders.filter(o => !existingIds.has(o.id));
          const merged = [...prev, ...uniqueNewOrders];
          
          // Jika data yang diterima < itemsPerPage, berarti sudah di page terakhir
          // Update totalOrdersCount dan totalPages
          if (finalOrders.length < itemsPerPage) {
            setTotalOrdersCount(merged.length);
            setTotalPages(currentPage);
          }
          
          return merged;
        }
      });
      
      setNeedsRefresh(false);
    } catch (err) {
      console.error("Error load data:", err);
      showToast("Gagal memuat data", "error");
      setNeedsRefresh(false);
    }
  }, [currentPage, itemsPerPage, statistics]);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Initial load
  useEffect(() => {
    setNeedsRefresh(true);
  }, []);

  // Load data when needsRefresh is true
  useEffect(() => {
    if (needsRefresh) {
      loadData();
    }
  }, [needsRefresh, loadData]);

  // Load More function - untuk load data berikutnya (append)
  const loadMore = useCallback(() => {
    if (currentPage >= totalPages || needsRefresh) return; // Jangan load jika sudah di page terakhir atau sedang loading
    const nextPage = currentPage + 1;
    console.log("🔄 Load More clicked, loading page:", nextPage);
    setCurrentPage(nextPage);
    setNeedsRefresh(true);
  }, [currentPage, totalPages, needsRefresh]);

  // 🔹 Refresh all data (reset to page 1)
  const requestRefresh = async (message, type = "success") => {
    // Clear orders first, then reset to page 1
    setOrders([]);
    setCurrentPage(1);
    setNeedsRefresh(true);
    await loadStatistics();
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

  // === FILTER SEARCH ===
  // Search dilakukan client-side dari data current page
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

  // Reset ke page 1 saat search berubah
  useEffect(() => {
    if (debouncedSearch.trim() && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);


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
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, i) => {
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
                          {i + 1}
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

          {/* Load More Button - Load data berikutnya (append) */}
          <div className="orders-pagination" style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
            {/* Selalu tampilkan button jika orders.length >= itemsPerPage (kemungkinan masih ada data)
                Atau jika orders.length < totalOrdersCount (masih ada data yang belum di-load)
            */}
            {(orders.length >= itemsPerPage || orders.length < totalOrdersCount || currentPage < totalPages) && 
             !(orders.length >= totalOrdersCount && totalOrdersCount > 0) ? (
              <button
                className="orders-pagination__btn orders-pagination__btn--load-more"
                onClick={loadMore}
                disabled={needsRefresh}
                aria-label="Load more orders"
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  background: "#f1a124",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: needsRefresh ? "not-allowed" : "pointer",
                  opacity: needsRefresh ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(241, 161, 36, 0.3)"
                }}
                onMouseEnter={(e) => {
                  if (!needsRefresh) {
                    e.target.style.background = "#df9620";
                    e.target.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!needsRefresh) {
                    e.target.style.background = "#f1a124";
                    e.target.style.transform = "translateY(0)";
                  }
                }}
              >
                {needsRefresh ? (
                  <>
                    <i className="pi pi-spin pi-spinner" />
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="pi pi-chevron-down" />
                    Load More ({orders.length} of {totalOrdersCount || "?"} loaded)
                  </>
                )}
              </button>
            ) : (
              <div className="orders-pagination__info">
                <p style={{ color: "var(--dash-muted-strong)", fontSize: "0.9rem", fontWeight: 500 }}>
                  Semua data sudah ditampilkan ({orders.length} orders)
                </p>
              </div>
            )}
          </div>
        </section>
{/* Pagination Buttons */}
<div style={{
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "1rem"
}}>
  <button
    onClick={() => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
        setNeedsRefresh(true);
      }
    }}
    disabled={currentPage === 1 || needsRefresh}
    className="orders-pagination__btn"
  >
    ← Prev
  </button>

  <span style={{ fontWeight: 600 }}>
    Page {currentPage} / {totalPages}
  </span>

  <button
    onClick={() => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
        setNeedsRefresh(true);
      }
    }}
    disabled={currentPage === totalPages || needsRefresh}
    className="orders-pagination__btn"
  >
    Next →
  </button>
</div>

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
          refreshOrders={() => requestRefresh("")}
        />
      )}
    </Layout>
  );
}
