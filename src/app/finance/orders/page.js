"use client";

import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { ShoppingCart, Clock, CheckCircle, PartyPopper, XCircle } from "lucide-react";
import { Calendar } from "primereact/calendar";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "@/styles/finance/dashboard.css";
import "@/styles/finance/admin.css";

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

// Dummy Data
const DUMMY_ORDERS = [
  {
    id: 1,
    customer_rel: { nama: "John Doe" },
    produk_rel: { nama: "Product A" },
    total_harga: 500000,
    status_order: "1",
    status_pembayaran: 1,
    tanggal: "2025-01-15",
    sumber: "website",
    waktu_pembayaran: "2025-01-15 10:30:00",
    metode_bayar: "Transfer Bank",
    bukti_pembayaran: null,
  },
  {
    id: 2,
    customer_rel: { nama: "Jane Smith" },
    produk_rel: { nama: "Product B" },
    total_harga: 750000,
    status_order: "1",
    status_pembayaran: 2,
    tanggal: "2025-01-16",
    sumber: "instagram",
    waktu_pembayaran: "2025-01-16 14:20:00",
    metode_bayar: "E-Wallet",
    bukti_pembayaran: "bukti1.jpg",
  },
  {
    id: 3,
    customer_rel: { nama: "Bob Johnson" },
    produk_rel: { nama: "Product C" },
    total_harga: 1200000,
    status_order: "2",
    status_pembayaran: 2,
    tanggal: "2025-01-17",
    sumber: "website",
    waktu_pembayaran: "2025-01-17 09:15:00",
    metode_bayar: "Transfer Bank",
    bukti_pembayaran: "bukti2.jpg",
  },
  {
    id: 4,
    customer_rel: { nama: "Alice Brown" },
    produk_rel: { nama: "Product D" },
    total_harga: 300000,
    status_order: "1",
    status_pembayaran: 4,
    tanggal: "2025-01-18",
    sumber: "website",
    waktu_pembayaran: "2025-01-18 11:45:00",
    metode_bayar: "Transfer Bank",
    bukti_pembayaran: "bukti3.jpg",
  },
  {
    id: 5,
    customer_rel: { nama: "Charlie Wilson" },
    produk_rel: { nama: "Product E" },
    total_harga: 900000,
    status_order: "1",
    status_pembayaran: 3,
    tanggal: "2025-01-19",
    sumber: "instagram",
    waktu_pembayaran: null,
    metode_bayar: null,
    bukti_pembayaran: null,
  },
];

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
  "Bukti Bayar",
  "Actions",
];

// Dummy Statistics (akan diganti dengan data real nanti)
const DUMMY_STATISTICS = {
  total_order: 150,
  total_order_unpaid: 25,
  total_order_menunggu: 15,
  total_order_sudah_diapprove: 100,
  total_order_ditolak: 10,
};

export default function FinanceOrders() {
  // State untuk search dan filter
  const [searchInput, setSearchInput] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [orders] = useState(DUMMY_ORDERS);
  const [statistics] = useState(DUMMY_STATISTICS);
  
  // State untuk pagination (placeholder, akan diisi fungsi nanti)
  const [page, setPage] = useState(1);
  const [loading] = useState(false);
  const [hasMore] = useState(true);
  const perPage = 15;

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

  // Summary data
  const totalOrders = statistics?.total_order || 0;
  const unpaidOrders = statistics?.total_order_unpaid || 0;
  const menungguOrders = statistics?.total_order_menunggu || 0;
  const approvedOrders = statistics?.total_order_sudah_diapprove || 0;
  const ditolakOrders = statistics?.total_order_ditolak || 0;

  // Placeholder handlers (akan diisi fungsi nanti)
  const handleNextPage = () => {
    // Fungsi akan diisi nanti
  };

  const handlePrevPage = () => {
    // Fungsi akan diisi nanti
  };

  const handleView = (order) => {
    // Fungsi akan diisi nanti
  };

  return (
    <Layout title="Orders | Finance Dashboard">
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
              {/* Button tambahan bisa ditambahkan di sini nanti */}
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
                          Rp {Number(order.total_harga || 0).toLocaleString()}
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
                        <div className="orders-table__cell" data-label="Bukti Bayar">
                          {order.bukti_pembayaran ? (
                            <a
                              href="#"
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
                  Page {page}
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
    </Layout>
  );
}
