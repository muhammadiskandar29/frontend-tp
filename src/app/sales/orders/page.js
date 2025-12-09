"use client";

import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import { ShoppingCart, Clock, CheckCircle, PartyPopper, XCircle } from "lucide-react";
import "@/styles/dashboard.css";
import "@/styles/admin.css";
import { getOrders, updateOrderAdmin } from "@/lib/sales/orders";

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
  const [needsRefresh, setNeedsRefresh] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
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

  // 🔹 Load data dari backend - Optimized dengan useCallback dan prevent duplicate fetch
  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found");
        setNeedsRefresh(false);
        return;
      }

      // Fetch produk dan orders secara parallel untuk optimasi
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
        // Ambil orders dengan pagination
        // Selalu gunakan server-side pagination dengan page dan per_page
        getOrders(currentPage, itemsPerPage).catch(err => {
          console.error("Error fetching orders:", err);
          return [];
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
      const finalOrders = Array.isArray(ordersResult)
        ? ordersResult
        : ordersResult?.data || [];

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
  }, [currentPage, itemsPerPage]); // Include currentPage dan itemsPerPage untuk pagination

  useEffect(() => {
    if (needsRefresh) {
      loadData();
    }
  }, [needsRefresh, currentPage]); // Trigger saat needsRefresh atau currentPage berubah

  // 🔹 Direct refresh function that loads data immediately - Reuse loadData
  const refreshData = useCallback(async () => {
    setNeedsRefresh(true);
    await loadData();
  }, [loadData, currentPage]);

  const requestRefresh = async (message, type = "success") => {
    // Immediately refresh data first, then show message
    await refreshData();
    // Reset to first page to show updated data
    setCurrentPage(1);
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
  const totalOrders = orders.length;
  const gagalOrders = orders.filter((o) => String(o.status_pembayaran) === "3").length;
  const unpaidOrders = orders.filter((o) => computeStatusBayar(o) === 0).length;
  const paidOrders = orders.filter((o) => computeStatusBayar(o) === 1).length;
  const suksesOrders = orders.filter((o) => String(o.status_pembayaran) === "2").length;

  // === FILTER SEARCH ===
  const filteredOrders = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return orders.filter((o) => {
      const prod = (o.produk_rel?.nama || produkMap[o.produk] || "").toString();
      const cust = (o.customer_rel?.nama || customers[o.customer] || "").toString();
      if (!term) return true;
      return (
        prod.toLowerCase().includes(term) ||
        cust.toLowerCase().includes(term)
      );
    });
  }, [orders, debouncedSearch, produkMap, customers]);

  // === PAGINATION ===
  // Note: Pagination dilakukan di server-side dengan parameter page dan per_page
  // Untuk search, tetap filter client-side dari data yang sudah di-fetch
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = useMemo(() => {
    // Data sudah di-paginate dari server, tapi jika ada search perlu filter dulu
    // Jika tidak ada search, langsung gunakan data dari server
    if (debouncedSearch.trim()) {
      // Client-side filtering dan pagination untuk hasil search
      const endIndex = startIndex + itemsPerPage;
      return filteredOrders.slice(startIndex, endIndex);
    }
    // Server-side pagination - data sudah di-paginate dari API
    return filteredOrders;
  }, [filteredOrders, startIndex, itemsPerPage, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Reload data saat currentPage berubah (untuk server-side pagination)
  useEffect(() => {
    // Reset ke page 1 saat search berubah
    if (debouncedSearch.trim() && currentPage !== 1) {
      setCurrentPage(1);
    } else if (!debouncedSearch.trim()) {
      // Reload data saat page berubah (hanya jika tidak ada search)
      setNeedsRefresh(true);
    }
  }, [currentPage, debouncedSearch]);

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
  
        // Refresh background (opsional)
        refreshData().catch(() => {});
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
              label: "Paid",
              value: paidOrders,
              accent: "accent-emerald",
              icon: <CheckCircle size={22} />,
            },
            {
              label: "Sukses",
              value: suksesOrders,
              accent: "accent-blue",
              icon: <PartyPopper size={22} />,
            },
            {
              label: "Gagal",
              value: gagalOrders,
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
                          {startIndex + i + 1}
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

          {totalPages > 1 && (
            <div className="orders-pagination">
              <button
                className="orders-pagination__btn"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <i className="pi pi-chevron-left" />
              </button>
              <span className="orders-pagination__info">
                Page {currentPage} of {totalPages} ({filteredOrders.length} total)
              </span>
              <button
                className="orders-pagination__btn"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
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
