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
  // Client-side pagination state
  const [orders, setOrders] = useState([]); // Array gabungan semua data
  const [page, setPage] = useState(1); // Current page untuk fetch
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [customers, setCustomers] = useState({});
  const [produkMap, setProdukMap] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
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

  // 🔹 Load produk data (one-time fetch)
  const loadProduk = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const produkResponse = await fetch("/api/sales/produk", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).then(res => res.json()).catch(err => {
        console.error("Error fetching produk:", err);
        return { success: false, data: [] };
      });

      if (produkResponse.success && Array.isArray(produkResponse.data)) {
        const mapProduk = {};
        produkResponse.data.forEach((p) => {
          mapProduk[p.id] = p.nama;
        });
        setProdukMap(mapProduk);
      }
    } catch (err) {
      console.error("Error loading produk:", err);
    }
  }, []);

  // 🔹 Fetch orders untuk page tertentu - Client-side pagination dengan append
  const fetchOrders = useCallback(async (pageNumber) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found");
        setIsLoading(false);
        return;
      }

      // Fetch orders dengan pagination
      const ordersResult = await getOrders(pageNumber, itemsPerPage).catch(err => {
        console.error("Error fetching orders:", err);
        return { data: [] };
      });

      const newOrders = Array.isArray(ordersResult.data) ? ordersResult.data : [];
      
      console.log(`📦 Fetched page ${pageNumber}:`, {
        newOrdersCount: newOrders.length,
        totalOrdersBefore: orders.length,
        totalOrdersAfter: orders.length + newOrders.length
      });

      // Merge data lama + baru (append)
      setOrders(prevOrders => {
        // Avoid duplicates by checking IDs
        const existingIds = new Set(prevOrders.map(o => o.id));
        const uniqueNewOrders = newOrders.filter(o => !existingIds.has(o.id));
        const merged = [...prevOrders, ...uniqueNewOrders];
        
        // Set hasMore = false jika data < 15 (berarti sudah di page terakhir)
        if (newOrders.length < itemsPerPage) {
          setHasMore(false);
          console.log("✅ No more data available. Total orders loaded:", merged.length);
        }
        
        return merged;
      });

      // Update customer map
      const mapCustomer = {};
      newOrders.forEach((o) => {
        if (o.customer_rel?.id) {
          mapCustomer[o.customer_rel.id] = o.customer_rel.nama;
        } else if (o.customer && typeof o.customer === "object" && o.customer.id) {
          mapCustomer[o.customer.id] = o.customer.nama || "-";
        }
      });
      setCustomers(prev => ({ ...prev, ...mapCustomer }));

      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      showToast("Gagal memuat data", "error");
      setIsLoading(false);
    }
  }, [itemsPerPage, showToast]);

  // 🔹 Load More function
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    const nextPage = page + 1;
    console.log("🔄 Loading more data, page:", nextPage);
    setPage(nextPage);
    fetchOrders(nextPage);
  }, [page, isLoading, hasMore, fetchOrders]);

  // Initial load: Fetch statistics, produk, and first page of orders
  useEffect(() => {
    const initializeData = async () => {
      // Load statistics and produk in parallel
      await Promise.all([loadStatistics(), loadProduk()]);
      // Then load first page of orders
      fetchOrders(1);
    };
    initializeData();
  }, [loadStatistics, loadProduk, fetchOrders]);

  // 🔹 Refresh all data (reset to page 1)
  const requestRefresh = async (message, type = "success") => {
    // Reset state
    setOrders([]);
    setPage(1);
    setHasMore(true);
    
    // Refresh statistics and fetch first page
    await Promise.all([loadStatistics(), fetchOrders(1)]);
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
  // Search dilakukan client-side dari semua data yang sudah di-fetch
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
            <span className="panel__meta">{filteredOrders.length} orders</span>
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

          {/* Load More Button - Client-side pagination */}
          <div className="orders-pagination">
            {hasMore ? (
              <button
                className="orders-pagination__btn orders-pagination__btn--load-more"
                onClick={loadMore}
                disabled={isLoading}
                aria-label="Load more orders"
              >
                {isLoading ? (
                  <>
                    <i className="pi pi-spin pi-spinner" style={{ marginRight: "0.5rem" }} />
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="pi pi-chevron-down" style={{ marginRight: "0.5rem" }} />
                    Load More
                  </>
                )}
              </button>
            ) : (
              <div className="orders-pagination__info">
                <p style={{ color: "var(--dash-muted-strong)", fontSize: "0.9rem", fontWeight: 500 }}>
                  Semua data sudah ditampilkan ({filteredOrders.length} orders)
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
